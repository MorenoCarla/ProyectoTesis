const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");
const { obtenerEmpleadoId } = require("../utils/empleado");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads", "presupuestos");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const MAX_PDF_BYTES = 150 * 1024 * 1024; // 150 MB

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
      cb(null, `presup-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: MAX_PDF_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"));
    }
  }
});

const SQL_LISTA = `
  SELECT p.*,
         CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre,
         e.cargo AS empleado_cargo
  FROM presupuestos p
  LEFT JOIN empleados e ON e.id = p.empleado_id
  LEFT JOIN usuarios u ON u.id = e.usuario_id
  WHERE p.activo = 1
`;

function errorSql(res, error) {
  console.error(error);
  if (error.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      error: "Falta la tabla presupuestos. Ejecutá actualizar-presupuestos.sql en MySQL Workbench."
    });
  }
  if (error.message === "Solo se permiten archivos PDF") {
    return res.status(400).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error en presupuestos" });
}

// GET /presupuestos/buscar?numero=&buscar=&dias=&pagina=1&limite=20
router.get("/buscar", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const numero = (req.query.numero || "").trim();
    const buscar = (req.query.buscar || "").trim();
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(30, Math.max(5, parseInt(req.query.limite, 10) || 15));
    const offset = (pagina - 1) * limite;
    const dias = parseInt(req.query.dias, 10);

    if (!numero && !buscar) {
      return res.status(400).json({
        error: "Ingresá un N° de presupuesto o texto para buscar (título, cliente...)"
      });
    }

    let sql = `
      SELECT p.*,
             CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre,
             e.cargo AS empleado_cargo,
             c.nombre AS cliente_nombre,
             c.apellido AS cliente_apellido,
             c.email AS cliente_email,
             c.telefono AS cliente_telefono
      FROM presupuestos p
      JOIN clientes c ON c.id = p.cliente_id AND c.activo = 1
      LEFT JOIN empleados e ON e.id = p.empleado_id
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE p.activo = 1
    `;
    const params = [];

    if (numero) {
      sql += " AND p.numero LIKE ?";
      params.push(`%${numero}%`);
    }

    if (buscar) {
      const like = `%${buscar}%`;
      sql += ` AND (
        p.titulo LIKE ? OR p.nombre_archivo LIKE ? OR p.notas LIKE ?
        OR c.nombre LIKE ? OR c.apellido LIKE ? OR c.email LIKE ?
      )`;
      params.push(like, like, like, like, like, like);
    }

    if (dias > 0) {
      sql += " AND p.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
      params.push(dias);
    }

    const empleadoId = parseInt(req.query.empleado_id, 10);
    if (empleadoId > 0) {
      sql += " AND p.empleado_id = ?";
      params.push(empleadoId);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (${sql}) AS sub`,
      params
    );

    const [filas] = await pool.query(
      sql + " ORDER BY p.creado_en DESC LIMIT ? OFFSET ?",
      [...params, limite, offset]
    );

    res.json({
      total,
      pagina,
      limite,
      total_paginas: Math.max(1, Math.ceil(total / limite)),
      presupuestos: filas.map(p => ({
        ...p,
        url: "/uploads/presupuestos/" + p.ruta_archivo
      }))
    });
  } catch (error) {
    errorSql(res, error);
  }
});

// GET /presupuestos/cliente/:clienteId
router.get("/cliente/:clienteId", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const clienteId = parseInt(req.params.clienteId, 10);
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(50, Math.max(5, parseInt(req.query.limite, 10) || 15));
    const offset = (pagina - 1) * limite;
    const buscar = (req.query.buscar || "").trim();
    const numero = (req.query.numero || "").trim();
    const dias = parseInt(req.query.dias, 10);

    const [[cliente]] = await pool.query(
      "SELECT id, nombre, apellido, email FROM clientes WHERE id = ? AND activo = 1",
      [clienteId]
    );
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    let sqlCount = "SELECT COUNT(*) AS total FROM presupuestos p WHERE p.cliente_id = ? AND p.activo = 1";
    let sqlList = SQL_LISTA + " AND p.cliente_id = ?";
    const params = [clienteId];

    if (numero) {
      sqlCount += " AND p.numero LIKE ?";
      sqlList += " AND p.numero LIKE ?";
      params.push(`%${numero}%`);
    }

    if (buscar) {
      const like = `%${buscar}%`;
      const filtro = ` AND (p.titulo LIKE ? OR p.nombre_archivo LIKE ? OR p.notas LIKE ?)`;
      sqlCount += filtro;
      sqlList += filtro;
      params.push(like, like, like);
    }

    if (dias > 0) {
      sqlCount += " AND p.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
      sqlList += " AND p.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
      params.push(dias);
    }

    const empleadoId = parseInt(req.query.empleado_id, 10);
    if (empleadoId > 0) {
      sqlCount += " AND p.empleado_id = ?";
      sqlList += " AND p.empleado_id = ?";
      params.push(empleadoId);
    }

    const [[{ total }]] = await pool.query(sqlCount, params);

    const [filas] = await pool.query(
      sqlList + " ORDER BY p.creado_en DESC LIMIT ? OFFSET ?",
      [...params, limite, offset]
    );

    const presupuestos = filas.map(p => ({
      ...p,
      url: "/uploads/presupuestos/" + p.ruta_archivo
    }));

    res.json({
      cliente,
      total,
      pagina,
      limite,
      total_paginas: Math.max(1, Math.ceil(total / limite)),
      presupuestos
    });
  } catch (error) {
    errorSql(res, error);
  }
});

function mensajeErrorMulter(err) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return `El PDF es muy pesado. Tamaño máximo: 150 MB. Probá exportarlo con menos imágenes o comprimirlo.`;
  }
  if (err.message === "Solo se permiten archivos PDF") return err.message;
  return err.message || "Error al subir el PDF";
}

// POST /presupuestos  (multipart: pdf + cliente_id + titulo + numero + notas)
router.post("/", verificarToken, soloRoles("admin", "empleado"), (req, res) => {
  upload.single("pdf")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: mensajeErrorMulter(err) });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "Debés seleccionar un archivo PDF" });
      }

      const clienteId = parseInt(req.body.cliente_id, 10);
      if (!clienteId) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Cliente inválido" });
      }

      const [[cliente]] = await pool.query(
        "SELECT id FROM clientes WHERE id = ? AND activo = 1",
        [clienteId]
      );
      if (!cliente) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      const titulo = (req.body.titulo || "").trim()
        || req.file.originalname.replace(/\.pdf$/i, "") || "Presupuesto";
      const numero = (req.body.numero || "").trim() || null;
      const notas = (req.body.notas || "").trim() || null;

      let empleadoId = parseInt(req.body.empleado_id, 10);
      if (empleadoId > 0) {
        const [[emp]] = await pool.query(
          "SELECT id FROM empleados WHERE id = ? AND activo = 1",
          [empleadoId]
        );
        if (!emp) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "Empleado no válido" });
        }
      } else {
        empleadoId = await obtenerEmpleadoId(pool, req.usuario);
        if (!empleadoId) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "Seleccioná quién elaboró el presupuesto" });
        }
      }

      const [result] = await pool.query(
        `INSERT INTO presupuestos
         (cliente_id, empleado_id, titulo, numero, notas, nombre_archivo, ruta_archivo, tamano_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clienteId,
          empleadoId,
          titulo.slice(0, 200),
          numero,
          notas,
          req.file.originalname,
          req.file.filename,
          req.file.size
        ]
      );

      res.status(201).json({
        mensaje: "Presupuesto cargado correctamente",
        id: result.insertId,
        url: "/uploads/presupuestos/" + req.file.filename
      });
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      errorSql(res, error);
    }
  });
});

// DELETE /presupuestos/:id  → soft delete
router.delete("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query(
      "SELECT id FROM presupuestos WHERE id = ? AND activo = 1",
      [req.params.id]
    );
    if (!filas.length) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    await pool.query(
      "UPDATE presupuestos SET activo = 0 WHERE id = ?",
      [req.params.id]
    );

    res.json({ mensaje: "Presupuesto eliminado" });
  } catch (error) {
    errorSql(res, error);
  }
});

module.exports = router;
