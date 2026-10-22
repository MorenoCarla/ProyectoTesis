/**
 * Diagnóstico vitrina Próximamente (usa backend/.env del servidor).
 * Uso: cd backend && npm run check-proximamente
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

const siteRoot = path.join(__dirname, "..", "..");

async function main() {
  const db = process.env.DB_NAME || "crm_ituarte";
  console.log("=== Check Próximamente ===");
  console.log("DB_HOST:", process.env.DB_HOST || "localhost");
  console.log("DB_NAME:", db);
  console.log("Site root:", siteRoot);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD ?? "",
      database: db
    });
  } catch (e) {
    console.error("No se pudo conectar a MySQL:", e.message);
    process.exit(1);
  }

  try {
    const [tables] = await conn.query("SHOW TABLES LIKE 'proximamente_items'");
    if (!tables.length) {
      console.error("\n[ERROR] No existe la tabla proximamente_items. Corré: npm run migrate-proximamente");
      process.exit(1);
    }

    const [cols] = await conn.query("SHOW COLUMNS FROM proximamente_items LIKE 'imagen_hover'");
    if (!cols.length) {
      console.warn("\n[AVISO] Falta columna imagen_hover. Corré: npm run migrate-proximamente");
    }

    const [countRow] = await conn.query(
      "SELECT COUNT(*) AS total FROM proximamente_items WHERE activo = 1"
    );
    const [pubRow] = await conn.query(
      "SELECT COUNT(*) AS n FROM proximamente_items WHERE activo = 1 AND publicado = 1"
    );
    console.log("\nÍtems activos:", countRow[0].total);
    console.log("Ítems publicados (web):", pubRow[0].n);

    const [rows] = await conn.query(
      `SELECT id, titulo, publicado, imagen
       FROM proximamente_items WHERE activo = 1 ORDER BY orden, id`
    );

    if (!rows.length) {
      console.error("\n[ERROR] Tabla vacía. Corré: npm run import-proximamente-items");
      process.exit(1);
    }

    console.log("\nListado:");
    for (const r of rows) {
      const imgPath = path.join(siteRoot, String(r.imagen).replace(/^\//, ""));
      const imgOk = fs.existsSync(imgPath);
      console.log(
        `  #${r.id} ${r.titulo} | pub=${r.publicado} | imagen ${imgOk ? "OK" : "FALTA"}: ${r.imagen}`
      );
    }

    console.log("\nAPI pública debería devolver", pubRow[0].n, "ítem(s).");
    console.log("Probá: curl -s http://127.0.0.1:3000/public/proximamente/items | head -c 400");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
