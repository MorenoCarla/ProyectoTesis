const express = require("express");
const pool = require("../config/db");
const { normalizarDatosPersonales } = require("../utils/texto");

const router = express.Router();

async function upsertClienteWeb(pool, datos) {
  const {
    emailNorm,
    normalizado,
    telefono,
    tipo_cliente,
    rubro,
    empresa,
    fecha_nacimiento
  } = datos;

  const tipo = tipo_cliente || "particular";
  const rubroVal = rubro || null;
  const empresaVal = normalizado.empresa ?? empresa ?? null;
  const fechaNac = fecha_nacimiento || null;

  const [existente] = await pool.query(
    "SELECT id FROM clientes WHERE email = ? AND activo = 1",
    [emailNorm]
  );

  if (existente.length > 0) {
    const clienteId = existente[0].id;
    await pool.query(
      `UPDATE clientes SET
         nombre = ?, apellido = ?, telefono = ?, ciudad = ?,
         tipo_cliente = ?, rubro = ?, empresa = ?,
         fecha_nacimiento = COALESCE(?, fecha_nacimiento)
       WHERE id = ?`,
      [
        normalizado.nombre,
        normalizado.apellido || "",
        telefono || null,
        normalizado.ciudad,
        tipo,
        rubroVal,
        empresaVal,
        fechaNac,
        clienteId
      ]
    );
    return clienteId;
  }

  const [nuevo] = await pool.query(
    `INSERT INTO clientes (
       nombre, apellido, email, telefono, ciudad,
       tipo_cliente, rubro, empresa, fecha_nacimiento
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizado.nombre,
      normalizado.apellido || "",
      emailNorm,
      telefono || null,
      normalizado.ciudad,
      tipo,
      rubroVal,
      empresaVal,
      fechaNac
    ]
  );
  return nuevo.insertId;
}

// Formularios del sitio web (contacto, productos) — sin login
// POST /public/consulta
router.post("/consulta", async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      ciudad,
      mensaje,
      producto,
      tipo_consulta,
      prioridad,
      tipo_cliente,
      rubro,
      empresa,
      fecha_nacimiento
    } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios" });
    }

    const tipoNombre = tipo_consulta || "Consulta comercial";
    const esQueja = tipoNombre === "Queja o reclamo";
    const prioridadFinal = prioridad || (esQueja ? "alta" : "media");
    const productoFinal = producto || tipoNombre;

    const normalizado = normalizarDatosPersonales({ nombre, apellido, ciudad, empresa });
    const emailNorm = email.trim().toLowerCase();

    const clienteId = await upsertClienteWeb(pool, {
      emailNorm,
      normalizado,
      telefono,
      tipo_cliente,
      rubro,
      empresa,
      fecha_nacimiento: fecha_nacimiento || null
    });

    // Buscar tipo de consulta por nombre
    const [tipo] = await pool.query(
      "SELECT id FROM tipos_consulta WHERE nombre = ?",
      [tipoNombre]
    );

    const tipoId = tipo.length > 0 ? tipo[0].id : 2;

    const [consulta] = await pool.query(
      `INSERT INTO consultas (cliente_id, tipo_consulta_id, producto_interes, mensaje, estado, prioridad)
       VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [clienteId, tipoId, productoFinal, mensaje, prioridadFinal]
    );

    await pool.query(
      `INSERT INTO historial_estados (consulta_id, estado_anterior, estado_nuevo, observacion)
       VALUES (?, 'nuevo', 'pendiente', 'Consulta recibida desde el sitio web')`,
      [consulta.insertId]
    );

    res.status(201).json({ mensaje: "Consulta enviada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar la consulta" });
  }
});

// GET /public/tipos-consulta
router.get("/tipos-consulta", async (req, res) => {
  const [filas] = await pool.query("SELECT id, nombre FROM tipos_consulta ORDER BY id");
  res.json(filas);
});

module.exports = router;
