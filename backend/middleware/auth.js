const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { obtenerEmpleadoId } = require("../utils/empleado");

const JWT_SECRET = process.env.JWT_SECRET || "solo-desarrollo-cambiar-en-produccion";

/** Cada llamada API con JWT válido refresca actividad (el token dura horas sin nuevo login). */
async function registrarActividadSesion(usuario) {
  if (!usuario || !usuario.id) return;
  if (usuario.rol !== "admin" && usuario.rol !== "empleado") return;

  try {
    await pool.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [usuario.id]);
  } catch (e) {
    if (e.code !== "ER_BAD_FIELD_ERROR") throw e;
  }

  try {
    const [[ult]] = await pool.query(
      "SELECT creado_en FROM accesos_crm WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 1",
      [usuario.id]
    );
    const haceMin = ult
      ? (Date.now() - new Date(ult.creado_en).getTime()) / 60000
      : 999;
    if (haceMin < 12) return;

    let empleadoId = null;
    if (usuario.rol === "empleado") {
      empleadoId = await obtenerEmpleadoId(pool, usuario);
    }
    await pool.query(
      "INSERT INTO accesos_crm (usuario_id, empleado_id, exito) VALUES (?, ?, 1)",
      [usuario.id, empleadoId]
    );
  } catch (e) {
    if (e.code !== "ER_NO_SUCH_TABLE") throw e;
  }
}

async function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }

  const token = header.split(" ")[1];

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Sesión expirada, volvé a ingresar" });
  }

  try {
    await registrarActividadSesion(req.usuario);
  } catch (e) {
    console.warn("[auth] actividad sesión:", e.message);
  }

  next();
}

function soloRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tenés permiso para esta acción" });
    }
    next();
  };
}

module.exports = { verificarToken, soloRoles, JWT_SECRET };
