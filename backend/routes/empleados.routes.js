const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");
const { normalizarDatosPersonales } = require("../utils/texto");

const router = express.Router();

const SQL_EMPLEADO = `
  SELECT e.id, e.cargo, e.sucursal, e.activo,
         u.id AS usuario_id, u.nombre, u.apellido, u.email, u.telefono,
         u.activo AS usuario_activo,
         CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo
  FROM empleados e
  JOIN usuarios u ON u.id = e.usuario_id
`;

function generarPassword() {
  return "Itu" + crypto.randomBytes(4).toString("hex") + "!";
}

function armarFiltrosEmpleados(req) {
  let sql = " WHERE u.eliminado_en IS NULL";
  const params = [];

  const estado = req.query.estado || "activos";
  if (estado === "activos") {
    sql += " AND e.activo = 1 AND u.activo = 1";
  } else if (estado === "inactivos") {
    sql += " AND (e.activo = 0 OR u.activo = 0)";
  }

  const sucursal = (req.query.sucursal || "").trim();
  if (sucursal) {
    sql += " AND e.sucursal = ?";
    params.push(sucursal);
  }

  const buscar = (req.query.buscar || "").trim();
  if (buscar) {
    const like = `%${buscar}%`;
    sql += ` AND (
      u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?
      OR e.cargo LIKE ? OR e.sucursal LIKE ? OR u.telefono LIKE ?
    )`;
    params.push(like, like, like, like, like, like);
  }

  return { sql, params, estado, sucursal, buscar };
}

// GET /empleados — activos para desplegables (asignar consultas, presupuestos)
router.get("/", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query(
      SQL_EMPLEADO +
        ` WHERE e.activo = 1 AND u.activo = 1 AND u.eliminado_en IS NULL
          ORDER BY u.nombre`
    );
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// GET /empleados/todos — panel gerente (paginado y filtrado en servidor)
router.get("/todos", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const { sql, params, estado, sucursal, buscar } = armarFiltrosEmpleados(req);
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 10, 1), 50);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const offset = (pagina - 1) * limite;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM empleados e JOIN usuarios u ON u.id = e.usuario_id${sql}`,
      params
    );

    const [empleados] = await pool.query(
      SQL_EMPLEADO + sql + " ORDER BY e.activo DESC, u.nombre LIMIT ? OFFSET ?",
      [...params, limite, offset]
    );

    const totalPaginas = Math.max(1, Math.ceil(total / limite));

    res.json({
      total,
      pagina: Math.min(pagina, totalPaginas),
      limite,
      total_paginas: totalPaginas,
      estado,
      sucursal: sucursal || null,
      buscar: buscar || null,
      empleados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// POST /empleados — crear empleado con usuario de acceso (solo gerente)
router.post("/", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, cargo, sucursal, password } = req.body;

    if (!nombre || !email || !cargo) {
      return res.status(400).json({ error: "Nombre, email y cargo son obligatorios" });
    }

    const [existente] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (existente.length > 0) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email" });
    }

    const passwordPlano = password && password.length >= 6 ? password : generarPassword();
    const hash = await bcrypt.hash(passwordPlano, 10);
    const datos = normalizarDatosPersonales({ nombre, apellido });

    const [rolEmpleado] = await pool.query(
      "SELECT id FROM roles WHERE nombre = 'empleado'"
    );

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [usuario] = await conn.query(
        `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [rolEmpleado[0].id, datos.nombre, datos.apellido || "",
         email.toLowerCase().trim(), hash, telefono || null]
      );

      const [empleado] = await conn.query(
        `INSERT INTO empleados (usuario_id, cargo, sucursal)
         VALUES (?, ?, ?)`,
        [usuario.insertId, cargo.trim(), (sucursal || "Concepción").trim()]
      );

      await conn.commit();

      res.status(201).json({
        mensaje: "Empleado creado correctamente",
        empleado_id: empleado.insertId,
        email: email.toLowerCase().trim(),
        password_temporal: passwordPlano,
        aviso: "Guardá la contraseña. El empleado puede cambiarla desde Recuperar contraseña."
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

// PUT /empleados/:id/desactivar — soft delete (solo gerente)
router.put("/:id/desactivar", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const [emp] = await pool.query(
      "SELECT usuario_id FROM empleados WHERE id = ?",
      [req.params.id]
    );

    if (emp.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    if (emp[0].usuario_id === req.usuario.id) {
      return res.status(400).json({ error: "No podés desactivar tu propio usuario" });
    }

    await pool.query("UPDATE empleados SET activo = 0 WHERE id = ?", [req.params.id]);
    await pool.query(
      "UPDATE usuarios SET activo = 0, eliminado_en = NOW() WHERE id = ?",
      [emp[0].usuario_id]
    );

    res.json({ mensaje: "Empleado desactivado. Ya no podrá ingresar al CRM." });
  } catch (error) {
    res.status(500).json({ error: "Error al desactivar empleado" });
  }
});

module.exports = router;
