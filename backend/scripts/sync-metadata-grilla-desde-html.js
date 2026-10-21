/**
 * Copia desde cada grilla HTML el nombre e imagen visibles de cada cajita
 * hacia productos_catalogo.nombre_grilla e imagen_portada.
 *
 * Ejecutar una vez (o tras restaurar HTML desde backup):
 *   node backend/scripts/sync-metadata-grilla-desde-html.js
 */
const path = require("path");
const pool = require("../config/db");
const { leerCajitaDesdeHtml } = require("../services/catalogo-grilla");

async function main() {
  const [productos] = await pool.query(
    `SELECT p.id, p.pagina_html, p.categoria_id, c.pagina_listado
     FROM productos_catalogo p
     INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
     WHERE p.activo = 1 AND c.pagina_listado IS NOT NULL`
  );

  let ok = 0;
  let skip = 0;
  for (const p of productos) {
    const meta = leerCajitaDesdeHtml(p.pagina_listado, p.pagina_html);
    if (!meta || (!meta.nombre && !meta.imagen)) {
      skip++;
      continue;
    }
    await pool.query(
      `UPDATE productos_catalogo SET
         nombre_grilla = COALESCE(NULLIF(?, ''), nombre_grilla),
         imagen_portada = COALESCE(NULLIF(?, ''), imagen_portada)
       WHERE id = ?`,
      [meta.nombre, meta.imagen, p.id]
    );
    ok++;
  }

  console.log("Productos actualizados desde HTML:", ok, "| sin cajita en grilla:", skip);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
