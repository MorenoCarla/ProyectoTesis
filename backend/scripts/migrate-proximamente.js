/**
 * Crea tablas Próximamente + columna en consultas (una sola vez).
 * Uso: npm run migrate-proximamente   (desde carpeta backend)
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

async function main() {
  const sqlPath = path.join(__dirname, "..", "database", "migrate-proximamente.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "crm_ituarte",
    multipleStatements: true
  });

  await conn.query(sql);
  const hoverPath = path.join(__dirname, "..", "database", "migrate-proximamente-imagen-hover.sql");
  if (fs.existsSync(hoverPath)) {
    await conn.query(fs.readFileSync(hoverPath, "utf8"));
  }
  const [rows] = await conn.query("SELECT COUNT(*) AS n FROM proximamente_items");
  await conn.end();

  console.log("Listo: migrate-proximamente.sql aplicado.");
  console.log("Filas en proximamente_items:", rows[0].n);
  console.log("Probá: http://localhost:3000/public/proximamente/items  →  {\"items\":[]}");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
