const express = require("express");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");
const { obtenerEmpleadoId } = require("../utils/empleado");

const router = express.Router();

const SQL_BASE = `
  SELECT
    co.id, co.mensaje, co.estado, co.prioridad, co.producto_interes,
    co.fecha_seguimiento, co.creado_en, co.actualizado_en,
    tc.nombre AS tipo_consulta,
    cl.id AS cliente_id, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
    cl.email AS cliente_email, cl.telefono AS cliente_telefono, cl.ciudad AS cliente_ciudad,
    co.empleado_id,
    CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre
  FROM consultas co
  JOIN clientes cl ON cl.id = co.cliente_id
  JOIN tipos_consulta tc ON tc.id = co.tipo_consulta_id
  LEFT JOIN empleados e ON e.id = co.empleado_id
  LEFT JOIN usuarios u ON u.id = e.usuario_id
  WHERE co.activo = 1 AND cl.activo = 1
`;

const ESTADOS_VALIDOS = ["pendiente", "en_proceso", "finalizado", "cancelado"];
const ESTADOS_ACTIVAS = ["pendiente", "en_proceso"];

async function armarFiltrosConsultas(req) {
  const params = [];
  let sql = SQL_BASE;
  const empleadoId = await obtenerEmpleadoId(pool, req.usuario);

  if (req.usuario.rol === "cliente") {
    sql += " AND cl.usuario_id = ?";
    params.push(req.usuario.id);
  }

  const buscar = (req.query.buscar || "").trim();
  if (buscar) {
    const like = `%${buscar}%`;
    sql += ` AND (
      co.id LIKE ? OR co.mensaje LIKE ? OR co.producto_interes LIKE ?
      OR cl.nombre LIKE ? OR cl.apellido LIKE ? OR cl.email LIKE ?
      OR tc.nombre LIKE ? OR CONCAT(u.nombre, ' ', u.apellido) LIKE ?
    )`;
    params.push(like, like, like, like, like, like, like, like);
  }

  const estado = req.query.estado;
  const vista = req.query.vista || "activas";
  let asignacion = req.query.asignacion || "";

  if (req.usuario.rol === "empleado") {
    if (!asignacion || asignacion === "todas") asignacion = "operativas";
    if (["finalizado", "cancelado"].includes(estado)) {
      asignacion = "mias";
    }
  }

  if (asignacion === "mias" && empleadoId) {
    sql += " AND co.empleado_id = ?";
    params.push(empleadoId);
  } else if (asignacion === "sin_asignar") {
    sql += " AND co.empleado_id IS NULL";
  } else if (asignacion === "operativas" && empleadoId) {
    sql += " AND (co.empleado_id = ? OR co.empleado_id IS NULL)";
    params.push(empleadoId);
  }

  if (estado && ESTADOS_VALIDOS.includes(estado)) {
    sql += " AND co.estado = ?";
    params.push(estado);
  } else if (vista === "activas") {
    sql += " AND co.estado IN (?, ?)";
    params.push(...ESTADOS_ACTIVAS);
  }

  const dias = parseInt(req.query.dias, 10);
  if (dias > 0 && !buscar) {
    sql += " AND co.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(dias);
  }

  if (req.usuario.rol === "empleado" && vista === "todas" && !estado) {
    sql += " AND co.empleado_id = ?";
    params.push(empleadoId);
  }

  return {
    sql,
    params,
    vista: estado ? estado : vista,
    buscar,
    dias: dias > 0 ? dias : null,
    asignacion: asignacion || null
  };
}

// GET /consultas
// Admin/empleado: ?vista=activas|todas&estado=&buscar=&pagina=1&limite=20
// Cliente: devuelve array simple (sus consultas, sin paginar)
router.get("/", verificarToken, async (req, res) => {
  try {
    const { sql, params, vista, buscar } = await armarFiltrosConsultas(req);

    if (req.usuario.rol === "cliente") {
      const [filas] = await pool.query(
        sql + " ORDER BY co.creado_en DESC",
        params
      );
      return res.json(filas);
    }

    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 20, 1), 100);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const offset = (pagina - 1) * limite;

    const orderBy = `
      ORDER BY
        CASE co.estado WHEN 'pendiente' THEN 0 WHEN 'en_proceso' THEN 1 ELSE 2 END,
        co.creado_en DESC
    `;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (${sql}) AS sub`,
      params
    );

    const [consultas] = await pool.query(
      sql + orderBy + " LIMIT ? OFFSET ?",
      [...params, limite, offset]
    );

    const totalPaginas = Math.max(1, Math.ceil(total / limite));

    let resumen = null;
    if (req.query.incluir_resumen === "1") {
      let sqlResumen = `
        SELECT co.estado, COUNT(*) AS cantidad
        FROM consultas co
        JOIN clientes cl ON cl.id = co.cliente_id
        JOIN tipos_consulta tc ON tc.id = co.tipo_consulta_id
        LEFT JOIN empleados e ON e.id = co.empleado_id
        LEFT JOIN usuarios u ON u.id = e.usuario_id
        WHERE co.activo = 1 AND cl.activo = 1
      `;
      const paramsResumen = [];
      if (buscar) {
        const like = `%${buscar}%`;
        sqlResumen += ` AND (
          co.id LIKE ? OR co.mensaje LIKE ? OR co.producto_interes LIKE ?
          OR cl.nombre LIKE ? OR cl.apellido LIKE ? OR cl.email LIKE ?
          OR tc.nombre LIKE ? OR CONCAT(u.nombre, ' ', u.apellido) LIKE ?
        )`;
        paramsResumen.push(like, like, like, like, like, like, like, like);
      }
      sqlResumen += " GROUP BY co.estado";
      const [filasResumen] = await pool.query(sqlResumen, paramsResumen);
      resumen = { pendiente: 0, en_proceso: 0, finalizado: 0, cancelado: 0 };
      filasResumen.forEach(r => { resumen[r.estado] = r.cantidad; });
    }

    res.json({
      total,
      pagina: Math.min(pagina, totalPaginas),
      limite,
      total_paginas: totalPaginas,
      vista,
      dias: parseInt(req.query.dias, 10) || null,
      resumen,
      consultas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener consultas" });
  }
});

// GET /consultas/:id  (con seguimientos e historial)
router.get("/:id", verificarToken, async (req, res) => {
  try {
    let sql = SQL_BASE + " AND co.id = ?";
    const params = [req.params.id];

    if (req.usuario.rol === "cliente") {
      sql += " AND cl.usuario_id = ?";
      params.push(req.usuario.id);
    }

    const [filas] = await pool.query(sql, params);

    if (filas.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }

    const [seguimientos] = await pool.query(
      `SELECT s.*, CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre
       FROM seguimientos s
       JOIN empleados e ON e.id = s.empleado_id
       JOIN usuarios u ON u.id = e.usuario_id
       WHERE s.consulta_id = ?
       ORDER BY s.creado_en DESC`,
      [req.params.id]
    );

    const [historial] = await pool.query(
      `SELECT h.*, CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre
       FROM historial_estados h
       LEFT JOIN empleados e ON e.id = h.empleado_id
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       WHERE h.consulta_id = ?
       ORDER BY h.creado_en DESC`,
      [req.params.id]
    );

    res.json({ ...filas[0], seguimientos, historial });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener consulta" });
  }
});

// POST /consultas  (admin/empleado crean consultas manualmente)
router.post("/", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const { cliente_id, tipo_consulta_id, producto_interes, mensaje, prioridad, empleado_id } = req.body;

    const [resultado] = await pool.query(
      `INSERT INTO consultas (cliente_id, empleado_id, tipo_consulta_id, producto_interes, mensaje, prioridad)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cliente_id, empleado_id || null, tipo_consulta_id, producto_interes || null, mensaje, prioridad || "media"]
    );

    await pool.query(
      `INSERT INTO historial_estados (consulta_id, estado_anterior, estado_nuevo, observacion)
       VALUES (?, 'nuevo', 'pendiente', 'Consulta creada manualmente')`,
      [resultado.insertId]
    );

    res.status(201).json({ id: resultado.insertId, mensaje: "Consulta creada" });
  } catch (error) {
    res.status(500).json({ error: "Error al crear consulta" });
  }
});

// PUT /consultas/:id  (cambiar estado, asignar empleado, etc.)
router.put("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const { estado, empleado_id, prioridad, fecha_seguimiento } = req.body;

    const [actual] = await pool.query(
      "SELECT estado, empleado_id FROM consultas WHERE id = ? AND activo = 1",
      [req.params.id]
    );

    if (actual.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }

    const campos = [];
    const valores = [];

    if (estado !== undefined) {
      campos.push("estado = ?");
      valores.push(estado);
    }
    if (empleado_id !== undefined) {
      if (req.usuario.rol === "empleado") {
        const miId = await obtenerEmpleadoId(pool, req.usuario);
        const nuevoId = empleado_id || null;
        if (nuevoId !== null && nuevoId !== miId) {
          return res.status(403).json({ error: "Solo el gerente puede asignar consultas a otros empleados" });
        }
      }
      campos.push("empleado_id = ?");
      valores.push(empleado_id || null);
    }
    if (prioridad !== undefined) {
      campos.push("prioridad = ?");
      valores.push(prioridad);
    }
    if (fecha_seguimiento !== undefined) {
      campos.push("fecha_seguimiento = ?");
      valores.push(fecha_seguimiento || null);
    }

    if (campos.length > 0) {
      valores.push(req.params.id);
      await pool.query(
        `UPDATE consultas SET ${campos.join(", ")} WHERE id = ?`,
        valores
      );
    }

    let empleadoIdHistorial = null;
    const [emp] = await pool.query(
      "SELECT id FROM empleados WHERE usuario_id = ?",
      [req.usuario.id]
    );
    empleadoIdHistorial = emp[0]?.id || null;

    if (estado !== undefined && estado !== actual[0].estado) {
      await pool.query(
        `INSERT INTO historial_estados (consulta_id, empleado_id, estado_anterior, estado_nuevo, observacion)
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, empleadoIdHistorial, actual[0].estado, estado, "Cambio de estado desde el panel"]
      );
    }

    if (empleado_id !== undefined && (empleado_id || null) !== (actual[0].empleado_id || null)) {
      let nombreEmpleado = "Sin asignar";
      if (empleado_id) {
        const [nom] = await pool.query(
          `SELECT CONCAT(u.nombre, ' ', u.apellido) AS nombre
           FROM empleados e JOIN usuarios u ON u.id = e.usuario_id WHERE e.id = ?`,
          [empleado_id]
        );
        nombreEmpleado = nom[0]?.nombre || "Empleado";
      }
      await pool.query(
        `INSERT INTO historial_estados (consulta_id, empleado_id, estado_anterior, estado_nuevo, observacion)
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, empleadoIdHistorial, actual[0].estado, actual[0].estado,
         `Consulta asignada a: ${nombreEmpleado}`]
      );
    }

    res.json({ mensaje: "Consulta actualizada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar consulta" });
  }
});

// DELETE /consultas/:id  → SOFT DELETE
router.delete("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await pool.query(
      "UPDATE consultas SET activo = 0, eliminado_en = NOW() WHERE id = ?",
      [req.params.id]
    );

    res.json({ mensaje: "Consulta desactivada (soft delete)" });
  } catch (error) {
    res.status(500).json({ error: "Error al desactivar consulta" });
  }
});

module.exports = router;
