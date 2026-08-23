// Ejecutar después de importar schema.sql:
// npm run passwords
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const DEMO_EMAILS = [
  "gerente.demo@example.com",
  "empleado.demo@example.com",
  "cliente@ejemplo.com"
];

async function main() {
  const hash = await bcrypt.hash("Admin123!", 10);

  await pool.query(
    "UPDATE usuarios SET password_hash = ? WHERE email IN (?, ?, ?)",
    [hash, ...DEMO_EMAILS]
  );

  console.log("Contraseñas de demo actualizadas.");
  console.log("");
  console.log("Usuarios del CRM (contraseña: Admin123!):");
  console.log("  gerente.demo@example.com   → Gerente comercial");
  console.log("  empleado.demo@example.com  → Asesora comercial");
  console.log("  cliente@ejemplo.com        → Cliente demo");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
