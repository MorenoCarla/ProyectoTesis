const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const sqlPath = path.join(__dirname, "..", "database", "migrate-catalogo-home-ideas-dual.sql");

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    const statements = fs
      .readFileSync(sqlPath, "utf8")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      const m = stmt.match(/ADD COLUMN\s+(\w+)/i);
      const col = m ? m[1] : null;
      if (col && (await columnExists(conn, "productos_catalogo", col))) {
        console.log("Omitido (ya existe):", col);
        continue;
      }
      try {
        await conn.query(stmt);
        console.log("OK:", col || stmt.slice(0, 60));
      } catch (e) {
        if (e.code === "ER_DUP_FIELDNAME") {
          console.log("Omitido (duplicado):", col);
        } else {
          throw e;
        }
      }
    }
    console.log("Migración ideas dual completada.");
  } finally {
    await conn.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
