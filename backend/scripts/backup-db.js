/**
 * Volcado MySQL a backend/backups/ituarte-FECHA.sql
 * 1) Intenta mysqldump (si está en PATH)
 * 2) Si no, backup con Node + mysql2 (misma .env que el servidor)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const host = process.env.DB_HOST || "localhost";
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME || "crm_ituarte";

const dir = path.join(__dirname, "..", "backups");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 10);
const outFile = path.join(dir, `ituarte-${stamp}.sql`);

function mysqlEscapeString(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\0/g, "\\0");
}

function sqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString("hex")}'`;
  }
  if (typeof val === "number" && Number.isFinite(val)) return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "object") {
    return `'${mysqlEscapeString(JSON.stringify(val))}'`;
  }
  return `'${mysqlEscapeString(val)}'`;
}

function tryMysqldump() {
  const args = [`-h${host}`, `-u${user}`, database, `-r${outFile}`];
  if (password) args.splice(2, 0, `-p${password}`);

  const r = spawnSync("mysqldump", args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (r.error) {
    if (r.error.code === "ENOENT") return { ok: false, reason: "mysqldump no está en PATH" };
    return { ok: false, reason: r.error.message };
  }
  if (r.status !== 0) {
    return { ok: false, reason: (r.stderr || r.stdout || "mysqldump falló").trim() };
  }
  return { ok: true, via: "mysqldump" };
}

async function backupWithNode() {
  const conn = await mysql.createConnection({
    host,
    user,
    password,
    database,
    multipleStatements: false
  });

  const lines = [
    "-- Backup Electricidad Ituarte / CRM",
    `-- Generado: ${new Date().toISOString()}`,
    `-- Base: ${database}`,
    "-- Método: Node (mysql2) — restaurar con mysql cliente o Workbench",
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS=0;",
    ""
  ];

  const [tables] = await conn.query("SHOW TABLES");
  const tableKey = `Tables_in_${database}`;

  for (const row of tables) {
    const table = row[tableKey] || Object.values(row)[0];
    const [createRows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createRows[0]["Create Table"];

    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(`${createSql};`);
    lines.push("");

    const [dataRows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (dataRows.length) {
      const cols = Object.keys(dataRows[0]);
      const colList = cols.map((c) => `\`${c}\``).join(", ");
      for (const r of dataRows) {
        const vals = cols.map((c) => sqlValue(r[c])).join(", ");
        lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES (${vals});`);
      }
      lines.push("");
    }
  }

  lines.push("SET FOREIGN_KEY_CHECKS=1;");
  lines.push("");

  await conn.end();
  fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  return { ok: true, via: "node" };
}

async function main() {
  const dump = tryMysqldump();
  if (dump.ok) {
    console.log("Backup guardado (mysqldump):", outFile);
    return;
  }

  console.warn("mysqldump no disponible:", dump.reason);
  console.warn("Usando backup con Node + mysql2…");

  try {
    const node = await backupWithNode();
    console.log(`Backup guardado (${node.via}):`, outFile);
  } catch (e) {
    console.error("No se pudo hacer el backup:", e.message);
    process.exit(1);
  }
}

main();
