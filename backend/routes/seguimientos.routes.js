const express = require("express");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");

const router = express.Router();

// GET /seguimientos/consulta/:consultaId
router.get("/consulta/:consultaId", verificarToken, async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT s.*, CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre
       FROM seguimientos s
       JOIN empleados e ON e.id = s.empleado_id
       JOIN usuarios u ON u.id = e.usuario_id
       WHERE s.consulta_id = ?
       ORDER BY s.creado_en DESC`,
      [req.params.consultaId]
    );

    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener seguimientos" });
  }
});

function formatearFechaMySQL(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function obtenerEmpleadoId(usuario) {
  const [emp] = await pool.query(
    "SELECT id FROM empleados WHERE usuario_id = ? AND activo = 1",
    [usuario.id]
  );

  if (emp.length > 0) return emp[0].id;

  if (usuario.rol === "admin") {
    const [fallback] = await pool.query(
      "SELECT id FROM empleados WHERE activo = 1 ORDER BY id LIMIT 1"
    );
    if (fallback.length > 0) return fallback[0].id;
  }

  return null;
}

// POST /seguimientos  (CRUD Create)
router.post("/", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const { consulta_id, nota, proximo_contacto } = req.body;

    if (!consulta_id || !nota || !nota.trim()) {
      return res.status(400).json({ error: "Consulta y nota son obligatorios" });
    }

    const empleadoId = await obtenerEmpleadoId(req.usuario);

    if (!empleadoId) {
      return res.status(403).json({
        error: "Tu usuario no está vinculado a un empleado. Contactá al administrador."
      });
    }

    const [consultaExiste] = await pool.query(
      "SELECT id FROM consultas WHERE id = ? AND activo = 1",
      [consulta_id]
    );

    if (consultaExiste.length === 0) {
      return res.status(404).json({ error: "La consulta no existe o está desactivada" });
    }

    const fechaProximo = formatearFechaMySQL(proximo_contacto);

    const [resultado] = await pool.query(
      `INSERT INTO seguimientos (consulta_id, empleado_id, nota, proximo_contacto)
       VALUES (?, ?, ?, ?)`,
      [consulta_id, empleadoId, nota.trim(), fechaProximo]
    );

    if (fechaProximo) {
      await pool.query(
        "UPDATE consultas SET fecha_seguimiento = ? WHERE id = ?",
        [fechaProximo, consulta_id]
      );
    }

    res.status(201).json({ id: resultado.insertId, mensaje: "Seguimiento registrado" });
  } catch (error) {
    console.error("Error seguimiento:", error);
    res.status(500).json({ error: "Error al crear seguimiento: " + error.message });
  }
});

// PUT /seguimientos/:id  (CRUD Update)
router.put("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const { nota, proximo_contacto } = req.body;

    await pool.query(
      "UPDATE seguimientos SET nota = ?, proximo_contacto = ? WHERE id = ?",
      [nota, proximo_contacto, req.params.id]
    );

    res.json({ mensaje: "Seguimiento actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar seguimiento" });
  }
});

// DELETE /seguimientos/:id  (CRUD Delete - borrado físico de notas internas)
router.delete("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM seguimientos WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Seguimiento eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar seguimiento" });
  }
});

module.exports = router;
