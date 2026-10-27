const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos_catalogo'
       AND COLUMN_NAME LIKE 'home_%'`
    );
    console.log("Columnas home_*:", cols.map((c) => c.COLUMN_NAME).join(", ") || "(ninguna — corré migrate-catalogo-home-vitrinas)");

    if (!cols.length) return;

    const hasHeroCol = cols.some((c) => c.COLUMN_NAME === "home_ideas_hero");

    for (const [flag, label] of [
      ["home_novedades", "Novedades"],
      ...(hasHeroCol ? [["home_ideas_hero", "Ideas foto grande (arriba)"]] : []),
      ["home_ideas", "Ideas carrusel (abajo)"],
      ["home_nuevos", "Nuevos ingresos"],
    ]) {
      const [rows] = await conn.query(
        `SELECT id, slug, nombre, publicado FROM productos_catalogo
         WHERE activo = 1 AND ${flag} = 1 ORDER BY id LIMIT 20`
      );
      const visibles = rows.filter((r) => r.publicado === 1);
      console.log(`\n${label}: ${rows.length} marcados, ${visibles.length} visibles en la web (publicado=1):`);
      for (const r of rows) {
        const ok = r.publicado === 1 ? "SÍ web" : "NO web (falta publicar)";
        console.log(`  #${r.id} ${r.slug} — ${ok} — ${r.nombre}`);
      }
    }

    const [pub] = await conn.query(
      `SELECT COUNT(*) AS n FROM productos_catalogo
       WHERE activo = 1 AND publicado = 1 AND home_novedades = 1`
    );
    console.log("\nPublicados en carrusel Novedades:", pub[0].n);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
