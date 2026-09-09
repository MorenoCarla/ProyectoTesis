const express = require("express");
const pool = require("../config/db");
const { validarPerfilComercial, upsertClienteComercial } = require("../utils/cliente");

const router = express.Router();

// Formularios del sitio web (contacto, productos) — sin login
// POST /public/consulta
router.post("/consulta", async (req, res) => {
  try {
    const {
      nombre, apellido, email, telefono, ciudad, mensaje,
      producto, tipo_consulta, prioridad,
      tipo_cliente, rubro, empresa, fecha_nacimiento
    } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios" });
    }

    const perfilCheck = validarPerfilComercial(req.body, { exigirPerfil: Boolean(tipo_cliente) });
    if (!perfilCheck.ok) {
      return res.status(400).json({ error: perfilCheck.error });
    }

    const tipoNombre = tipo_consulta || "Consulta comercial";
    const esQueja = tipoNombre === "Queja o reclamo";
    const prioridadFinal = prioridad || (esQueja ? "alta" : "media");
    const productoFinal = producto || tipoNombre;

    const clienteId = await upsertClienteComercial(pool, {
      nombre,
      apellido,
      email,
      telefono,
      ciudad,
      tipo_cliente: perfilCheck.perfil.tipo_cliente,
      rubro: perfilCheck.perfil.rubro,
      empresa: perfilCheck.perfil.empresa,
      fecha_nacimiento: perfilCheck.perfil.fecha_nacimiento
    });

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
