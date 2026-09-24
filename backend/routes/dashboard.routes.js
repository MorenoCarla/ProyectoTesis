const express = require("express");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");
const { obtenerEmpleadoId } = require("../utils/empleado");

const router = express.Router();

async function dashboardGerencial() {
  const [[clientes]] = await pool.query(
    "SELECT COUNT(*) AS total FROM clientes WHERE activo = 1"
  );

  const [[cuentaCorriente]] = await pool.query(
    "SELECT COUNT(*) AS total FROM clientes WHERE activo = 1 AND cuenta_corriente = 1"
  );

  const [[empleados]] = await pool.query(
    "SELECT COUNT(*) AS total FROM empleados WHERE activo = 1"
  );

  const [porEstado] = await pool.query(
    `SELECT estado, COUNT(*) AS cantidad
     FROM consultas WHERE activo = 1
     GROUP BY estado`
  );

  const estadosMap = { pendiente: 0, en_proceso: 0, finalizado: 0, cancelado: 0 };
  porEstado.forEach(e => { estadosMap[e.estado] = e.cantidad; });
  const consultasActivas = estadosMap.pendiente + estadosMap.en_proceso;

  const [[sinAsignar]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas
     WHERE activo = 1 AND empleado_id IS NULL
       AND estado IN ('pendiente', 'en_proceso')`
  );

  const [porTipo] = await pool.query(
    `SELECT tc.nombre, COUNT(*) AS cantidad
     FROM consultas co
     JOIN tipos_consulta tc ON tc.id = co.tipo_consulta_id
     WHERE co.activo = 1
     GROUP BY tc.nombre
     ORDER BY cantidad DESC
     LIMIT 6`
  );

  const [porRubro] = await pool.query(
    `SELECT COALESCE(NULLIF(rubro, ''), 'sin_rubro') AS rubro, COUNT(*) AS cantidad
     FROM clientes WHERE activo = 1
     GROUP BY COALESCE(NULLIF(rubro, ''), 'sin_rubro')
     ORDER BY cantidad DESC
     LIMIT 6`
  );

  const [[hoy]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas
     WHERE activo = 1 AND DATE(creado_en) = CURDATE()`
  );

  const [[semana]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas
     WHERE activo = 1 AND creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
  );

  const [[enviosMarketing]] = await pool.query(
    `SELECT COUNT(*) AS total FROM envios_marketing
     WHERE estado = 'enviado' AND creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
  );

  const [[campanasActivas]] = await pool.query(
    `SELECT COUNT(*) AS total FROM campanas_marketing WHERE activo = 1`
  );

  const [proximosSeguimientos] = await pool.query(
    `SELECT co.id, co.fecha_seguimiento, cl.nombre, cl.apellido, co.estado, co.prioridad
     FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE co.activo = 1 AND co.fecha_seguimiento IS NOT NULL
       AND co.fecha_seguimiento >= NOW()
       AND co.estado NOT IN ('finalizado', 'cancelado')
     ORDER BY co.fecha_seguimiento ASC
     LIMIT 8`
  );

  const [consultasRecientes] = await pool.query(
    `SELECT co.id, co.estado, co.creado_en, co.prioridad,
            tc.nombre AS tipo_consulta,
            cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
            CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre
     FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     JOIN tipos_consulta tc ON tc.id = co.tipo_consulta_id
     LEFT JOIN empleados e ON e.id = co.empleado_id
     LEFT JOIN usuarios u ON u.id = e.usuario_id
     WHERE co.activo = 1 AND cl.activo = 1
     ORDER BY co.creado_en DESC
     LIMIT 6`
  );

  return {
    tipo: "gerencial",
    total_clientes: clientes.total,
    clientes_cuenta_corriente: cuentaCorriente.total,
    empleados_activos: empleados.total,
    consultas_activas: consultasActivas,
    consultas_sin_asignar: sinAsignar.total,
    consultas_hoy: hoy.total,
    consultas_semana: semana.total,
    envios_marketing_30d: enviosMarketing.total,
    campanas_activas: campanasActivas.total,
    por_estado: porEstado,
    por_tipo: porTipo,
    por_rubro: porRubro,
    proximos_seguimientos: proximosSeguimientos,
    consultas_recientes: consultasRecientes
  };
}

async function dashboardOperativo(empleadoId) {
  const baseActiva = `co.activo = 1 AND cl.activo = 1
    AND co.estado IN ('pendiente', 'en_proceso')`;

  const [[misActivas]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE ${baseActiva} AND co.empleado_id = ?`,
    [empleadoId]
  );

  const [[sinAsignar]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE ${baseActiva} AND co.empleado_id IS NULL`
  );

  const [[seguimientosHoy]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE co.activo = 1 AND cl.activo = 1
       AND co.empleado_id = ?
       AND co.fecha_seguimiento IS NOT NULL
       AND DATE(co.fecha_seguimiento) = CURDATE()
       AND co.estado NOT IN ('finalizado', 'cancelado')`,
    [empleadoId]
  );

  const [[seguimientosVencidos]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE co.activo = 1 AND cl.activo = 1
       AND co.empleado_id = ?
       AND co.fecha_seguimiento IS NOT NULL
       AND co.fecha_seguimiento < NOW()
       AND co.estado NOT IN ('finalizado', 'cancelado')`,
    [empleadoId]
  );

  const [consultasPrioritarias] = await pool.query(
    `SELECT co.id, co.estado, co.prioridad, co.producto_interes, co.creado_en,
            tc.nombre AS tipo_consulta,
            cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
            co.empleado_id,
            CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre
     FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     JOIN tipos_consulta tc ON tc.id = co.tipo_consulta_id
     LEFT JOIN empleados e ON e.id = co.empleado_id
     LEFT JOIN usuarios u ON u.id = e.usuario_id
     WHERE ${baseActiva}
       AND (co.empleado_id = ? OR co.empleado_id IS NULL)
     ORDER BY
       CASE WHEN co.empleado_id IS NULL THEN 0 ELSE 1 END,
       CASE co.estado WHEN 'pendiente' THEN 0 WHEN 'en_proceso' THEN 1 ELSE 2 END,
       co.creado_en DESC
     LIMIT 8`,
    [empleadoId]
  );

  const [proximosSeguimientos] = await pool.query(
    `SELECT co.id, co.fecha_seguimiento, cl.nombre, cl.apellido, co.estado, co.prioridad
     FROM consultas co
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE co.activo = 1 AND cl.activo = 1
       AND co.empleado_id = ?
       AND co.fecha_seguimiento IS NOT NULL
       AND co.fecha_seguimiento >= NOW()
       AND co.estado NOT IN ('finalizado', 'cancelado')
     ORDER BY co.fecha_seguimiento ASC
     LIMIT 8`,
    [empleadoId]
  );

  const [seguimientosRecientes] = await pool.query(
    `SELECT s.nota, s.creado_en, s.proximo_contacto,
            co.id AS consulta_id,
            cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido
     FROM seguimientos s
     JOIN consultas co ON co.id = s.consulta_id
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE s.empleado_id = ?
     ORDER BY s.creado_en DESC
     LIMIT 6`,
    [empleadoId]
  );

  return {
    tipo: "operativo",
    mis_consultas_activas: misActivas.total,
    sin_asignar: sinAsignar.total,
    seguimientos_hoy: seguimientosHoy.total,
    seguimientos_vencidos: seguimientosVencidos.total,
    consultas_prioritarias: consultasPrioritarias,
    proximos_seguimientos: proximosSeguimientos,
    seguimientos_recientes: seguimientosRecientes
  };
}

router.get("/", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    if (req.usuario.rol === "admin") {
      return res.json(await dashboardGerencial());
    }

    const empleadoId = await obtenerEmpleadoId(pool, req.usuario);
    if (!empleadoId) {
      return res.status(403).json({
        error: "Tu usuario no está vinculado a un empleado. Contactá al gerente."
      });
    }

    res.json(await dashboardOperativo(empleadoId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar dashboard" });
  }
});

module.exports = router;
