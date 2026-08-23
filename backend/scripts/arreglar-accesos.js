// Ajusta hashes de demo tras importar schema.sql (npm run passwords)
const bcrypt = require("bcrypt");
const pool = require("../config/db");

async function main() {
  const hash = await bcrypt.hash("Admin123!", 10);

  await pool.query(
    `UPDATE usuarios SET nombre='Carla', apellido='Ituarte', email='gerente.demo@example.com',
     telefono=NULL, password_hash=? WHERE id=1`,
    [hash]
  );
  await pool.query(
    `UPDATE usuarios SET nombre='María', apellido='González', email='empleado.demo@example.com',
     telefono=NULL, password_hash=? WHERE id=2`,
    [hash]
  );
  await pool.query(
    `UPDATE usuarios SET password_hash=? WHERE id=3`,
    [hash]
  );

  console.log("Accesos demo listos. Contraseña: Admin123!");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
