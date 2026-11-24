const ORIGEN_LABELS = {
  mostrador: "Mostrador (CRM)",
  web_registro: "Registro en el sitio web",
  web_contacto: "Consulta / contacto web",
  web_proximamente: "Página Próximamente («Avisame cuando llegue»)"
};

function etiquetaOrigenAlta(origen) {
  if (!origen) return null;
  return ORIGEN_LABELS[origen] || origen;
}

function textoRegistroCliente(row) {
  if (!row) return "";
  const origen = row.origen_alta;
  if (origen === "mostrador") {
    const nom = [row.registrado_por_nombre, row.registrado_por_apellido].filter(Boolean).join(" ").trim();
    if (nom) return `Cargado en mostrador por ${nom}`;
    return "Alta en mostrador";
  }
  const lab = etiquetaOrigenAlta(origen);
  return lab || "";
}

const SQL_JOIN_REGISTRO = `
  LEFT JOIN empleados reg_e ON reg_e.id = c.registrado_por_empleado_id AND reg_e.activo = 1
  LEFT JOIN usuarios reg_u ON reg_u.id = reg_e.usuario_id
`;

/** Solo columnas del JOIN; origen_alta y registrado_por_empleado_id vienen en c.* */
const SQL_CAMPOS_REGISTRO = `
  reg_u.nombre AS registrado_por_nombre,
  reg_u.apellido AS registrado_por_apellido
`;

module.exports = {
  ORIGEN_LABELS,
  etiquetaOrigenAlta,
  textoRegistroCliente,
  SQL_JOIN_REGISTRO,
  SQL_CAMPOS_REGISTRO
};
