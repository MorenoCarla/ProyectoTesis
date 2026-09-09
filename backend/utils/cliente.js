const { normalizarDatosPersonales } = require("./texto");

const TIPOS_CLIENTE = ["particular", "profesional", "empresa", "municipalidad"];
const RUBROS_VALIDOS = [
  "arquitecto", "ingeniero", "electricista", "diseñador_interiores",
  "constructor", "municipalidad", "empresa_industrial", "comercio", "otro"
];

function normalizarPerfilComercial(body = {}) {
  const tipo = body.tipo_cliente && TIPOS_CLIENTE.includes(body.tipo_cliente)
    ? body.tipo_cliente
    : null;

  let rubro = body.rubro && String(body.rubro).trim() ? String(body.rubro).trim() : null;
  if (rubro && !RUBROS_VALIDOS.includes(rubro)) rubro = null;

  if (tipo === "particular") rubro = null;

  let fecha = body.fecha_nacimiento && String(body.fecha_nacimiento).trim()
    ? String(body.fecha_nacimiento).trim().slice(0, 10)
    : null;

  return {
    tipo_cliente: tipo || "particular",
    rubro,
    empresa: body.empresa,
    fecha_nacimiento: fecha
  };
}

function validarPerfilComercial(body, { exigirPerfil = false } = {}) {
  const perfil = normalizarPerfilComercial(body);

  if (!exigirPerfil) return { ok: true, perfil };

  if (!body.tipo_cliente) {
    return { ok: false, error: "Indicá si sos particular, profesional o empresa" };
  }

  const necesitaRubro = ["profesional", "empresa", "municipalidad"].includes(perfil.tipo_cliente);
  if (necesitaRubro && !perfil.rubro) {
    return { ok: false, error: "Seleccioná tu rubro o actividad" };
  }

  return { ok: true, perfil };
}

async function upsertClienteComercial(pool, datos) {
  const {
    nombre, apellido, email, telefono, ciudad,
    tipo_cliente, rubro, empresa, fecha_nacimiento,
    usuario_id = null
  } = datos;

  if (!nombre || !email) {
    throw new Error("Nombre y email son obligatorios");
  }

  const normalizado = normalizarDatosPersonales({ nombre, apellido, ciudad, empresa });
  const emailNorm = email.trim().toLowerCase();
  const perfil = normalizarPerfilComercial({
    tipo_cliente, rubro, empresa, fecha_nacimiento
  });

  const [existente] = await pool.query(
    "SELECT id, tipo_cliente, rubro, empresa, fecha_nacimiento, ciudad, telefono FROM clientes WHERE email = ? AND activo = 1",
    [emailNorm]
  );

  if (existente.length > 0) {
    const id = existente[0].id;
    await pool.query(
      `UPDATE clientes SET
         nombre = ?, apellido = ?,
         telefono = COALESCE(?, telefono),
         ciudad = COALESCE(?, ciudad),
         tipo_cliente = CASE
           WHEN ? IN ('profesional', 'empresa', 'municipalidad') THEN ?
           WHEN tipo_cliente IS NULL OR tipo_cliente = '' THEN ?
           ELSE tipo_cliente END,
         rubro = COALESCE(?, rubro),
         empresa = COALESCE(?, empresa),
         fecha_nacimiento = COALESCE(?, fecha_nacimiento),
         usuario_id = COALESCE(usuario_id, ?)
       WHERE id = ?`,
      [
        normalizado.nombre,
        normalizado.apellido || "",
        telefono || null,
        normalizado.ciudad,
        perfil.tipo_cliente,
        perfil.tipo_cliente,
        perfil.tipo_cliente,
        perfil.rubro,
        normalizado.empresa,
        perfil.fecha_nacimiento,
        usuario_id,
        id
      ]
    );
    return id;
  }

  const [nuevo] = await pool.query(
    `INSERT INTO clientes (
       usuario_id, nombre, apellido, email, telefono, ciudad,
       tipo_cliente, rubro, empresa, fecha_nacimiento
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      usuario_id,
      normalizado.nombre,
      normalizado.apellido || "",
      emailNorm,
      telefono || null,
      normalizado.ciudad,
      perfil.tipo_cliente,
      perfil.rubro,
      normalizado.empresa,
      perfil.fecha_nacimiento
    ]
  );

  return nuevo.insertId;
}

function perfilComercialIncompleto(cliente) {
  if (!cliente) return true;
  if (!cliente.telefono || !cliente.ciudad) return true;
  if (["profesional", "empresa", "municipalidad"].includes(cliente.tipo_cliente) && !cliente.rubro) {
    return true;
  }
  return false;
}

module.exports = {
  TIPOS_CLIENTE,
  RUBROS_VALIDOS,
  normalizarPerfilComercial,
  validarPerfilComercial,
  upsertClienteComercial,
  perfilComercialIncompleto
};
