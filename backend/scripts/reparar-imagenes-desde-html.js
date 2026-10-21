/**
 * Sincroniza imagenes_json (y opcional imagen_portada) desde la ficha HTML legacy.
 * Uso: node scripts/reparar-imagenes-desde-html.js caño
 *      node scripts/reparar-imagenes-desde-html.js --id 52
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { SITE_ROOT } = require("../config/site-root");
const { ordenarImagenesFicha } = require("../services/ficha-producto-tema");

function extraerImagenes(html) {
  const m = html.match(/<div class="swiper swiper-producto">([\s\S]*?)<\/div>\s*<\/div>/i);
  const bloque = m ? m[1] : html;
  const srcs = [];
  const re = /src="(img\/[^"]+)"/gi;
  let match;
  while ((match = re.exec(bloque)) !== null) {
    let src = match[1].trim();
    try {
      src = decodeURIComponent(src);
    } catch (_) {}
    if (!srcs.includes(src)) srcs.push(src);
  }
  return srcs;
}

function existeEnSitio(ruta) {
  const rel = String(ruta || "").trim().replace(/^\//, "");
  if (!rel) return false;
  return fs.existsSync(path.join(SITE_ROOT, rel));
}

function portadaDesdeImagenes(imagenes) {
  for (const src of imagenes) {
    if (!/crudo|fotomont|negrocrudo|blancocrudo/i.test(src)) return src;
  }
  for (const src of imagenes) {
    if (!/fotomont/i.test(src)) return src;
  }
  return imagenes[0] || null;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Uso: node scripts/reparar-imagenes-desde-html.js <slug>");
    console.error("     node scripts/reparar-imagenes-desde-html.js --id <id>");
    process.exit(1);
  }

  let rows;
  if (arg === "--id") {
    const id = process.argv[3];
    [rows] = await pool.query("SELECT * FROM productos_catalogo WHERE id = ? LIMIT 1", [id]);
  } else {
    const slug = arg.trim().toLowerCase();
    [rows] = await pool.query(
      "SELECT * FROM productos_catalogo WHERE LOWER(slug) = ? LIMIT 1",
      [slug]
    );
  }

  if (!rows.length) {
    console.error("Producto no encontrado.");
    process.exit(1);
  }
  const p = rows[0];
  const htmlFile = p.pagina_html || `${p.slug}.html`;
  const htmlPath = path.join(SITE_ROOT, htmlFile);
  if (!fs.existsSync(htmlPath)) {
    console.error("No existe:", htmlPath);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const extraidas = ordenarImagenesFicha(extraerImagenes(html));
  const faltantes = extraidas.filter((s) => !existeEnSitio(s));
  const imagenes = extraidas.filter((s) => existeEnSitio(s));
  if (faltantes.length) {
    console.warn("Omitidas (no hay archivo en img/):", faltantes.join(", "));
  }
  if (!imagenes.length) {
    console.error("Ninguna imagen del HTML existe en disco. Subí los PNG o copiálos a img/.");
    process.exit(1);
  }

  const portada = portadaDesdeImagenes(imagenes);
  await pool.query(
    `UPDATE productos_catalogo SET imagenes_json = ?, imagen_portada = COALESCE(?, imagen_portada) WHERE id = ?`,
    [JSON.stringify(imagenes), portada, p.id]
  );

  console.log("OK", p.slug, `(id ${p.id})`);
  console.log("  imagenes:", imagenes.join(" | "));
  if (portada) console.log("  portada:", portada);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
