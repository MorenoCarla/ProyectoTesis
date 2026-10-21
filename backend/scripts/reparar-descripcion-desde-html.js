/**
 * Copia descripción desde ficha HTML legacy → BD (CRM / ficha dinámica).
 * node scripts/reparar-descripcion-desde-html.js beattall
 * node scripts/reparar-descripcion-desde-html.js artefactoalumbpubli150 --texto "Texto comercial…"
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { SITE_ROOT } = require("../config/site-root");

function extraerDescripcionHtml(html) {
  const m = html.match(/<p class="textodescripcion">([\s\S]*?)<\/p>/i);
  if (!m) return null;
  return m[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function esPlaceholder(texto) {
  const t = String(texto || "").trim().toLowerCase();
  if (!t) return true;
  if (/^(bla bla|bli bli|wwww|xxxx|test|prueba|lorem)/i.test(t)) return true;
  if (t.length < 20 && /^(bla|bli|x+|\.+)+/i.test(t.replace(/\s/g, ""))) return true;
  return false;
}

function leerFlagTexto(argv) {
  const i = argv.indexOf("--texto");
  if (i === -1) return null;
  return argv.slice(i + 1).join(" ").trim() || null;
}

async function main() {
  const argv = process.argv.slice(2);
  const textoManual = leerFlagTexto(argv);
  const arg = argv.find((a) => a !== "--texto" && !a.startsWith("--"));
  if (!arg) {
    console.error("Uso: node scripts/reparar-descripcion-desde-html.js <slug> [--texto \"…\"]");
    process.exit(1);
  }

  let rows;
  if (arg === "--id") {
    const id = argv[argv.indexOf("--id") + 1];
    [rows] = await pool.query("SELECT * FROM productos_catalogo WHERE id = ? LIMIT 1", [id]);
  } else {
    [rows] = await pool.query(
      "SELECT * FROM productos_catalogo WHERE LOWER(slug) = ? LIMIT 1",
      [arg.trim().toLowerCase()]
    );
  }

  if (!rows.length) {
    console.error("Producto no encontrado.");
    process.exit(1);
  }
  const p = rows[0];
  let desc = textoManual;

  if (!desc) {
    const htmlPath = path.join(SITE_ROOT, p.pagina_html || `${p.slug}.html`);
    if (!fs.existsSync(htmlPath)) {
      console.error("No existe HTML:", htmlPath);
      process.exit(1);
    }
    desc = extraerDescripcionHtml(fs.readFileSync(htmlPath, "utf8"));
  }

  if (!desc) {
    console.error("No hay descripción en HTML ni --texto.");
    process.exit(1);
  }
  if (!textoManual && esPlaceholder(desc)) {
    console.error(
      "La descripción del HTML parece placeholder:\n  \"" + desc + "\"\n" +
        "Escribí el texto real con --texto \"…\" o desde el CRM."
    );
    process.exit(1);
  }

  await pool.query(
    `UPDATE productos_catalogo SET descripcion_texto = ?, descripcion_html = ? WHERE id = ?`,
    [desc, desc, p.id]
  );

  console.log("OK", p.slug, `(id ${p.id})`, "—", desc.length, "caracteres");
  console.log(desc.slice(0, 200) + (desc.length > 200 ? "…" : ""));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
