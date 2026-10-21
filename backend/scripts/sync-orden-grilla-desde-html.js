/**
 * Lee el orden actual de cada grilla (colgantes.html, etc.) y lo guarda en productos_catalogo.orden
 * Ejecutar UNA VEZ antes de la primera republicación masiva, para no mezclar el orden visual.
 *
 *   node scripts/sync-orden-grilla-desde-html.js
 */
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const SITE_ROOT = path.join(__dirname, "..", "..");

async function main() {
  const [cats] = await pool.query(
    "SELECT id, nombre, pagina_listado FROM categorias_catalogo WHERE activo = 1 AND pagina_listado IS NOT NULL"
  );

  let total = 0;
  for (const cat of cats) {
    const filePath = path.join(SITE_ROOT, cat.pagina_listado);
    if (!fs.existsSync(filePath)) {
      console.warn("Skip", cat.pagina_listado);
      continue;
    }
    const html = fs.readFileSync(filePath, "utf8");
    const gridMatch = html.match(
      /<section class="filas-imagenes cat-catalog-grid">([\s\S]*?)<\/section>/i
    );
    if (!gridMatch) {
      console.warn("Sin grilla en", cat.pagina_listado);
      continue;
    }
    const gridHtml = gridMatch[1];
    const re = /href="([^"]+\.html)"/gi;
    const orden = [];
    let m;
    while ((m = re.exec(gridHtml)) !== null) {
      const base = path.basename(m[1]);
      if (!orden.includes(base)) orden.push(base);
    }

    for (let i = 0; i < orden.length; i++) {
      const [r] = await pool.query(
        "UPDATE productos_catalogo SET orden = ? WHERE pagina_html = ? AND categoria_id = ?",
        [i + 1, orden[i], cat.id]
      );
      if (r.affectedRows) total += r.affectedRows;
    }
    console.log(cat.nombre, "→", orden.length, "items en grilla");
  }

  console.log("Productos con orden actualizado:", total);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
