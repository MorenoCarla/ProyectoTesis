/**
 * Importa los 6 ítems de vitrina (misma data que import-proximamente-items.sql)
 * usando DB_NAME de .env — ideal en el SERVIDOR.
 * Uso: cd backend && npm run migrate-proximamente && npm run import-proximamente-items
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

const ITEMS = [
  [1, "APLIQUE LALA", "6W", "djkjkjcnskclslksmlmxalmlclmlmc", "img/productos/lala-1792703453520.png", "img/productos/fotomontlala-1792708053344.png", "INTERIOR", 1],
  [2, "aplique lele", "7w", "jdncjklklkxkkkkkkkkkkkkkkkkkkkk", "img/productos/lele-1792703689741.png", "img/productos/fotomontlele-1792708062890.png", "INTERIOR", 2],
  [3, "APLIQUE LILI", "8W", "JCNKJXNKXNLANLKZLkmllllllllllllllll", "img/productos/lili-1792703720259.png", "img/productos/fotomontlili-1792708070286.png", "EXTERIOR", 3],
  [4, "colgante lolo", "9w", "mmmmmmmmmmmmmmmmmmmmmmmmmmmmm", "img/productos/lolo-1792703748945.png", "img/productos/fotomontlulu-1792708086851.png", "EXTERIOR", 4],
  [5, "smart lulu", "9kk", "djckjakxnlsddddddddddddddddddddd", "img/productos/lulu-1792703774459.png", "img/productos/fotomontpla-1792708094435.png", "INTERIOR", 5],
  [6, "aplique pla", "7000k", "fffffffffffffffffffffffffffffff", "img/productos/pla-1792703807932.png", "img/productos/fotomontlolo-1792708078826.png", "INTERIOR", 4]
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "crm_ituarte",
    multipleStatements: true
  });

  const [tables] = await conn.query("SHOW TABLES LIKE 'proximamente_items'");
  if (!tables.length) {
    throw new Error("Tabla proximamente_items no existe. Ejecutá: npm run migrate-proximamente");
  }

  let hasHover = true;
  try {
    await conn.query("SELECT imagen_hover FROM proximamente_items LIMIT 1");
  } catch {
    hasHover = false;
  }

  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  await conn.query("DELETE FROM proximamente_likes");
  await conn.query("DELETE FROM proximamente_items");
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");

  for (const row of ITEMS) {
    const [id, titulo, subtitulo, descripcion, imagen, imagen_hover, categoria, orden] = row;
    if (hasHover) {
      await conn.query(
        `INSERT INTO proximamente_items
         (id, titulo, subtitulo, descripcion, imagen, imagen_hover, categoria_etiqueta, orden, activo, publicado, likes_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0)`,
        [id, titulo, subtitulo, descripcion, imagen, imagen_hover, categoria, orden]
      );
    } else {
      await conn.query(
        `INSERT INTO proximamente_items
         (id, titulo, subtitulo, descripcion, imagen, categoria_etiqueta, orden, activo, publicado, likes_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0)`,
        [id, titulo, subtitulo, descripcion, imagen, categoria, orden]
      );
    }
  }

  await conn.query("ALTER TABLE proximamente_items AUTO_INCREMENT = 7");
  const [c] = await conn.query("SELECT COUNT(*) AS n FROM proximamente_items WHERE publicado = 1");
  await conn.end();

  console.log("Import listo. Ítems publicados:", c[0].n);
  console.log("Siguiente: npm run check-proximamente");
  console.log("Luego: pm2 restart crm-ituarte");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
