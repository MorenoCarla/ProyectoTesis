const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "solo-desarrollo-cambiar-en-produccion";

function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }

  const token = header.split(" ")[1];

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Sesión expirada, volvé a ingresar" });
  }
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
