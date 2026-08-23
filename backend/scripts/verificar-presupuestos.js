const pool = require("../config/db");

async function main() {
  try {
    const [db] = await pool.query("SELECT DATABASE() AS db");
    console.log("Base conectada:", db[0].db);

    const [pres] = await pool.query("SHOW TABLES LIKE 'presupuestos'");
    if (pres.length) {
      console.log("OK: tabla presupuestos EXISTE");
      process.exit(0);
    }

    console.log("Creando tabla presupuestos...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        empleado_id INT NULL,
        titulo VARCHAR(200) NOT NULL DEFAULT 'Presupuesto',
        numero VARCHAR(80) NULL,
        notas TEXT NULL,
        nombre_archivo VARCHAR(255) NOT NULL,
        ruta_archivo VARCHAR(255) NOT NULL,
        tamano_bytes INT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_presupuestos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        CONSTRAINT fk_presupuestos_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id)
      ) ENGINE=InnoDB
    `);
    await pool.query("CREATE INDEX idx_presupuestos_cliente ON presupuestos(cliente_id)");
    await pool.query("CREATE INDEX idx_presupuestos_creado ON presupuestos(creado_en)");
    console.log("OK: tabla presupuestos CREADA");
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
