const express = require("express");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");
const { normalizarDatosPersonales } = require("../utils/texto");

const router = express.Router();

const SQL_BASE = `
  SELECT c.*, COUNT(DISTINCT co.id) AS total_consultas,
         COUNT(DISTINCT p.id) AS total_presupuestos
  FROM clientes c
  LEFT JOIN consultas co ON co.cliente_id = c.id AND co.activo = 1
  LEFT JOIN presupuestos p ON p.cliente_id = c.id AND p.activo = 1
  WHERE c.activo = 1
`;

function armarFiltrosClientes(req) {
  const params = [];
  let sql = SQL_BASE;

  if (req.usuario.rol === "cliente") {
    sql += " AND c.usuario_id = ?";
    params.push(req.usuario.id);
  }

  const buscar = (req.query.buscar || "").trim();
  if (buscar) {
    const like = `%${buscar}%`;
    sql += ` AND (
      c.nombre LIKE ? OR c.apellido LIKE ? OR c.email LIKE ?
      OR c.telefono LIKE ? OR c.ciudad LIKE ? OR c.empresa LIKE ? OR c.rubro LIKE ?
    )`;
    params.push(like, like, like, like, like, like, like);
  }

  const rubro = req.query.rubro;
  if (rubro === "sin_rubro") {
    sql += " AND (c.rubro IS NULL OR c.rubro = '')";
  } else if (rubro) {
    sql += " AND c.rubro = ?";
    params.push(rubro);
  }

  const dias = parseInt(req.query.dias, 10);
  if (dias > 0 && !buscar) {
    sql += " AND c.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(dias);
  }

  sql += " GROUP BY c.id";
  return { sql, params, rubro: rubro || null, buscar, dias: dias > 0 ? dias : null };
}

// GET /clientes/rubros  — rubros con cantidad (para filtros)
router.get("/rubros", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query(`
      SELECT
        CASE WHEN c.rubro IS NULL OR c.rubro = '' THEN 'sin_rubro' ELSE c.rubro END AS rubro,
        COUNT(*) AS cantidad
      FROM clientes c
      WHERE c.activo = 1
      GROUP BY CASE WHEN c.rubro IS NULL OR c.rubro = '' THEN 'sin_rubro' ELSE c.rubro END
      ORDER BY cantidad DESC, rubro ASC
    `);
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener rubros" });
  }
});

// GET /clientes?rubro=&dias=&buscar=&pagina=1&limite=15
router.get("/", verificarToken, async (req, res) => {
  try {
    const { sql, params, rubro, buscar, dias } = armarFiltrosClientes(req);

    if (req.usuario.rol === "cliente") {
      const [filas] = await pool.query(sql + " ORDER BY c.creado_en DESC", params);
      return res.json(filas);
    }

    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 15, 1), 100);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const offset = (pagina - 1) * limite;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (${sql}) AS sub`,
      params
    );

    const [clientes] = await pool.query(
      sql + " ORDER BY c.creado_en DESC LIMIT ? OFFSET ?",
      [...params, limite, offset]
    );

    const totalPaginas = Math.max(1, Math.ceil(total / limite));

    res.json({
      total,
      pagina: Math.min(pagina, totalPaginas),
      limite,
      total_paginas: totalPaginas,
      rubro,
      dias,
      clientes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// GET /clientes/:id
router.get("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query(
      "SELECT * FROM clientes WHERE id = ? AND activo = 1",
      [req.params.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(filas[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cliente" });
  }
});

// PUT /clientes/:id
router.put("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const {
      nombre, apellido, email, telefono, ciudad,
      tipo_cliente, rubro, empresa, fecha_nacimiento,
      cuenta_corriente, notas_comerciales
    } = req.body;

    const normalizado = normalizarDatosPersonales({ nombre, apellido, ciudad, empresa });
    const emailNorm = (email || "").trim().toLowerCase();

    await pool.query(
      `UPDATE clientes SET
         nombre = ?, apellido = ?, email = ?, telefono = ?, ciudad = ?,
         tipo_cliente = ?, rubro = ?, empresa = ?, fecha_nacimiento = ?,
         cuenta_corriente = ?, notas_comerciales = ?
       WHERE id = ? AND activo = 1`,
      [
        normalizado.nombre, normalizado.apellido, emailNorm, telefono, normalizado.ciudad,
        tipo_cliente || "particular", rubro || null, normalizado.empresa,
        fecha_nacimiento || null, cuenta_corriente ? 1 : 0,
        notas_comerciales || null, req.params.id
      ]
    );

    const [cliente] = await pool.query(
      "SELECT usuario_id FROM clientes WHERE id = ? AND activo = 1",
      [req.params.id]
    );

    if (cliente[0]?.usuario_id) {
      await pool.query(
        "UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ? WHERE id = ?",
        [normalizado.nombre, normalizado.apellido, telefono || null, cliente[0].usuario_id]
      );
    }

    res.json({ mensaje: "Cliente actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

// DELETE /clientes/:id  → SOFT DELETE
router.delete("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await pool.query(
      "UPDATE clientes SET activo = 0, eliminado_en = NOW() WHERE id = ?",
      [req.params.id]
    );

    res.json({ mensaje: "Cliente desactivado (soft delete)" });
  } catch (error) {
    res.status(500).json({ error: "Error al desactivar cliente" });
  }
});

module.exports = router;
