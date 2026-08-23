const express = require("express");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");
const {
  generarExcel,
  generarPdf,
  parseDias,
  parseLimite,
  formatearEstado,
  MAX_FILAS_REPORTE
} = require("../utils/reportes");

const router = express.Router();

const ESTADOS_CONSULTA = ["pendiente", "en_proceso", "finalizado", "cancelado"];

function textoFiltrosConsultas(query) {
  const partes = [];
  if (query.estado && ESTADOS_CONSULTA.includes(query.estado)) {
    partes.push(`Estado: ${formatearEstado(query.estado)}`);
  } else if (query.vista === "activas" || (!query.vista && !query.estado)) {
    partes.push("Solo activas (pendiente + en proceso)");
  } else if (query.vista === "todas") {
    partes.push("Todos los estados");
  }
  const dias = parseDias(query);
  if (dias) partes.push(`Últimos ${dias} días`);
  partes.push(`Máx. ${parseLimite(query)} registros`);
  return partes.join(" · ");
}

async function obtenerConsultasReporte(query) {
  let sql = `
    SELECT
      co.id, cl.nombre, cl.apellido, cl.email, cl.telefono, cl.ciudad,
      tc.nombre AS tipo, co.producto_interes, co.mensaje, co.estado,
      co.prioridad, co.creado_en,
      CONCAT(u.nombre, ' ', u.apellido) AS empleado
    FROM consultas co
    JOIN clientes cl ON cl.id = co.cliente_id
    JOIN tipos_consulta tc ON tc.id = co.tipo_consulta_id
    LEFT JOIN empleados e ON e.id = co.empleado_id
    LEFT JOIN usuarios u ON u.id = e.usuario_id
    WHERE co.activo = 1 AND cl.activo = 1
  `;
  const params = [];

  const estado = query.estado;
  const vista = query.vista || "activas";

  if (estado && ESTADOS_CONSULTA.includes(estado)) {
    sql += " AND co.estado = ?";
    params.push(estado);
  } else if (vista === "activas") {
    sql += " AND co.estado IN ('pendiente', 'en_proceso')";
  }

  const dias = parseDias(query) || 30;
  sql += " AND co.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
  params.push(dias);

  const limite = parseLimite(query);
  sql += " ORDER BY co.creado_en DESC LIMIT ?";
  params.push(limite);

  const [filas] = await pool.query(sql, params);
  return filas;
}

async function obtenerClientesReporte(query) {
  let sql = `
    SELECT c.id, c.nombre, c.apellido, c.email, c.telefono, c.ciudad,
           c.rubro, c.tipo_cliente, c.empresa, c.cuenta_corriente, c.creado_en,
           COUNT(co.id) AS total_consultas
    FROM clientes c
    LEFT JOIN consultas co ON co.cliente_id = c.id AND co.activo = 1
    WHERE c.activo = 1
  `;
  const params = [];

  if (query.rubro) {
    if (query.rubro === "sin_rubro") {
      sql += " AND (c.rubro IS NULL OR c.rubro = '')";
    } else {
      sql += " AND c.rubro = ?";
      params.push(query.rubro);
    }
  }

  const dias = parseDias(query);
  if (dias) {
    sql += " AND c.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(dias);
  }

  sql += " GROUP BY c.id ORDER BY c.creado_en DESC LIMIT ?";
  params.push(parseLimite(query));

  const [filas] = await pool.query(sql, params);
  return filas;
}

async function obtenerMarketingReporte(query) {
  const dias = parseDias(query) || 30;
  const limite = parseLimite(query);

  const [filas] = await pool.query(
    `SELECT e.id, e.tipo_campana, e.estado, e.mensaje, e.creado_en,
            CONCAT(c.nombre, ' ', COALESCE(c.apellido, '')) AS cliente_nombre,
            c.email, c.telefono, c.rubro, c.ciudad,
            cm.titulo AS campana_titulo
     FROM envios_marketing e
     JOIN clientes c ON c.id = e.cliente_id
     LEFT JOIN campanas_marketing cm ON e.tipo_campana = CONCAT('campana_', cm.id)
     WHERE e.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY e.creado_en DESC
     LIMIT ?`,
    [dias, limite]
  );
  return filas;
}

async function obtenerResumenReporte() {
  const [[clientes]] = await pool.query(
    "SELECT COUNT(*) AS total FROM clientes WHERE activo = 1"
  );
  const [porEstado] = await pool.query(
    `SELECT estado, COUNT(*) AS cantidad FROM consultas WHERE activo = 1 GROUP BY estado`
  );
  const [[activas]] = await pool.query(
    `SELECT COUNT(*) AS total FROM consultas WHERE activo = 1 AND estado IN ('pendiente','en_proceso')`
  );
  const [[enviosMes]] = await pool.query(
    `SELECT COUNT(*) AS total FROM envios_marketing
     WHERE estado = 'enviado' AND creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
  );
  const [[campanas]] = await pool.query(
    `SELECT COUNT(*) AS total FROM campanas_marketing WHERE activo = 1`
  );

  return [
    { indicador: "Clientes activos", valor: clientes.total, detalle: "Base de clientes del CRM" },
    { indicador: "Consultas activas", valor: activas.total, detalle: "Pendientes + en proceso" },
    ...porEstado.map(e => ({
      indicador: `Consultas ${formatearEstado(e.estado)}`,
      valor: e.cantidad,
      detalle: "Estado actual en el sistema"
    })),
    { indicador: "Contactos marketing (30 días)", valor: enviosMes.total, detalle: "Envíos registrados" },
    { indicador: "Campañas activas", valor: campanas.total, detalle: "Promociones vigentes" }
  ];
}

const COLUMNAS = {
  consultas: [
    { header: "ID", key: "id", minWidth: 6, maxWidth: 10 },
    { header: "Nombre", key: "nombre", minWidth: 14, maxWidth: 22 },
    { header: "Apellido", key: "apellido", minWidth: 14, maxWidth: 22 },
    { header: "Email", key: "email", minWidth: 22, maxWidth: 36 },
    { header: "Teléfono", key: "telefono", minWidth: 12, maxWidth: 18 },
    { header: "Ciudad", key: "ciudad", minWidth: 12, maxWidth: 20 },
    { header: "Tipo", key: "tipo", minWidth: 16, maxWidth: 26 },
    { header: "Producto", key: "producto_interes", minWidth: 14, maxWidth: 28 },
    { header: "Estado", key: "estado", minWidth: 12, format: "estado", maxWidth: 16 },
    { header: "Prioridad", key: "prioridad", minWidth: 10, maxWidth: 12 },
    { header: "Empleado", key: "empleado", minWidth: 14, maxWidth: 24 },
    { header: "Fecha", key: "creado_en", minWidth: 18, format: "fecha", maxWidth: 22 }
  ],
  consultasPdf: [
    { header: "ID", key: "id", pdfPeso: 0.4 },
    { header: "Cliente", key: "nombre", pdfPeso: 1.4 },
    { header: "Email", key: "email", pdfPeso: 1.6 },
    { header: "Teléfono", key: "telefono", pdfPeso: 0.9 },
    { header: "Tipo", key: "tipo", pdfPeso: 1.1 },
    { header: "Estado", key: "estado", format: "estado", pdfPeso: 0.9 },
    { header: "Prioridad", key: "prioridad", pdfPeso: 0.7 },
    { header: "Fecha", key: "creado_en", format: "fecha_corta", pdfPeso: 1 }
  ],
  clientes: [
    { header: "ID", key: "id", minWidth: 6, maxWidth: 10 },
    { header: "Nombre", key: "nombre", minWidth: 14, maxWidth: 22 },
    { header: "Apellido", key: "apellido", minWidth: 14, maxWidth: 22 },
    { header: "Email", key: "email", minWidth: 22, maxWidth: 36 },
    { header: "Teléfono", key: "telefono", minWidth: 12, maxWidth: 18 },
    { header: "Ciudad", key: "ciudad", minWidth: 12, maxWidth: 20 },
    { header: "Rubro", key: "rubro", minWidth: 12, format: "estado", maxWidth: 20 },
    { header: "Tipo", key: "tipo_cliente", minWidth: 12, format: "estado", maxWidth: 16 },
    { header: "Empresa", key: "empresa", minWidth: 14, maxWidth: 26 },
    { header: "Cta. cte.", key: "cuenta_corriente", minWidth: 8, format: "si_no", maxWidth: 10 },
    { header: "Consultas", key: "total_consultas", minWidth: 8, maxWidth: 10 },
    { header: "Alta", key: "creado_en", minWidth: 18, format: "fecha", maxWidth: 22 }
  ],
  clientesPdf: [
    { header: "ID", key: "id", pdfPeso: 0.35 },
    { header: "Cliente", key: "cliente_completo", pdfPeso: 1.5 },
    { header: "Email", key: "email", pdfPeso: 1.7 },
    { header: "Teléfono", key: "telefono", pdfPeso: 0.9 },
    { header: "Ciudad", key: "ciudad", pdfPeso: 0.9 },
    { header: "Rubro", key: "rubro", format: "estado", pdfPeso: 1 },
    { header: "Cta. cte.", key: "cuenta_corriente", format: "si_no", pdfPeso: 0.55 },
    { header: "Consultas", key: "total_consultas", pdfPeso: 0.55 },
    { header: "Alta", key: "creado_en", format: "fecha_corta", pdfPeso: 0.95 }
  ],
  marketing: [
    { header: "ID", key: "id", minWidth: 6, maxWidth: 10 },
    { header: "Cliente", key: "cliente_nombre", minWidth: 18, maxWidth: 28 },
    { header: "Email", key: "email", minWidth: 22, maxWidth: 34 },
    { header: "Rubro", key: "rubro", minWidth: 12, format: "estado", maxWidth: 18 },
    { header: "Tipo contacto", key: "tipo_campana", minWidth: 14, maxWidth: 22 },
    { header: "Campaña", key: "campana_titulo", minWidth: 16, maxWidth: 28 },
    { header: "Estado", key: "estado", minWidth: 10, format: "estado", maxWidth: 14 },
    { header: "Fecha envío", key: "creado_en", minWidth: 18, format: "fecha", maxWidth: 22 }
  ],
  marketingPdf: [
    { header: "ID", key: "id", pdfPeso: 0.35 },
    { header: "Cliente", key: "cliente_nombre", pdfPeso: 1.4 },
    { header: "Email", key: "email", pdfPeso: 1.5 },
    { header: "Rubro", key: "rubro", format: "estado", pdfPeso: 0.9 },
    { header: "Tipo", key: "tipo_campana", pdfPeso: 1.1 },
    { header: "Campaña", key: "campana_titulo", pdfPeso: 1.2 },
    { header: "Estado", key: "estado", format: "estado", pdfPeso: 0.7 },
    { header: "Fecha", key: "creado_en", format: "fecha_corta", pdfPeso: 0.95 }
  ],
  resumen: [
    { header: "Indicador", key: "indicador", minWidth: 24, maxWidth: 40, pdfPeso: 2 },
    { header: "Valor", key: "valor", minWidth: 10, maxWidth: 14, pdfPeso: 0.6 },
    { header: "Detalle", key: "detalle", minWidth: 28, maxWidth: 50, pdfPeso: 2.4 }
  ]
};

async function exportarConsultas(req, res, formato) {
  const filasRaw = await obtenerConsultasReporte(req.query);
  const filtros = textoFiltrosConsultas(req.query);
  const meta = {
    titulo: "Reporte de Consultas",
    subtitulo: "Detalle de consultas comerciales y reclamos",
    hojaNombre: "consultas",
    filtrosTexto: filtros
  };
  if (formato === "excel") {
    await generarExcel(res, { ...meta, columnas: COLUMNAS.consultas, filas: filasRaw });
  } else {
    const filas = filasRaw.map(f => ({
      ...f,
      nombre: `${f.nombre} ${f.apellido || ""}`.trim()
    }));
    generarPdf(res, { ...meta, columnas: COLUMNAS.consultasPdf, filas });
  }
}

async function exportarClientes(req, res, formato) {
  const filasRaw = await obtenerClientesReporte(req.query);
  const dias = parseDias(req.query);
  const filtros = [
    req.query.rubro ? `Rubro: ${req.query.rubro}` : null,
    dias ? `Últimos ${dias} días` : "Todos los períodos",
    `Máx. ${parseLimite(req.query)} registros`
  ].filter(Boolean).join(" · ");

  const meta = {
    titulo: "Reporte de Clientes",
    subtitulo: "Base de clientes registrados en el CRM",
    hojaNombre: "clientes",
    filtrosTexto: filtros
  };

  if (formato === "excel") {
    await generarExcel(res, { ...meta, columnas: COLUMNAS.clientes, filas: filasRaw });
  } else {
    const filas = filasRaw.map(f => ({
      ...f,
      cliente_completo: `${f.nombre} ${f.apellido || ""}`.trim()
    }));
    generarPdf(res, { ...meta, columnas: COLUMNAS.clientesPdf, filas });
  }
}

async function exportarMarketing(req, res, formato) {
  const filasRaw = await obtenerMarketingReporte(req.query);
  const dias = parseDias(req.query) || 30;
  const meta = {
    titulo: "Reporte de Marketing",
    subtitulo: "Contactos comerciales y envíos registrados",
    hojaNombre: "marketing",
    filtrosTexto: `Últimos ${dias} días · Máx. ${parseLimite(req.query)} registros`
  };
  if (formato === "excel") {
    await generarExcel(res, { ...meta, columnas: COLUMNAS.marketing, filas: filasRaw });
  } else {
    generarPdf(res, { ...meta, columnas: COLUMNAS.marketingPdf, filas: filasRaw });
  }
}

async function exportarResumen(req, res, formato) {
  const filas = await obtenerResumenReporte();
  const meta = {
    titulo: "Resumen Ejecutivo CRM",
    subtitulo: "Indicadores generales del sistema",
    hojaNombre: "resumen",
    filtrosTexto: "Instantánea al momento de generación"
  };
  if (formato === "excel") {
    await generarExcel(res, { ...meta, columnas: COLUMNAS.resumen, filas });
  } else {
    generarPdf(res, { ...meta, columnas: COLUMNAS.resumen, filas });
  }
}

function rutaExportar(tipo, handler) {
  router.get(`/${tipo}/excel`, verificarToken, soloRoles("admin"), async (req, res) => {
    try {
      await handler(req, res, "excel");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al exportar Excel" });
    }
  });

  router.get(`/${tipo}/pdf`, verificarToken, soloRoles("admin"), async (req, res) => {
    try {
      await handler(req, res, "pdf");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al exportar PDF" });
    }
  });
}

rutaExportar("consultas", exportarConsultas);
rutaExportar("clientes", exportarClientes);
rutaExportar("marketing", exportarMarketing);
rutaExportar("resumen", exportarResumen);

router.get("/excel", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await exportarConsultas(req, res, "excel");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al exportar Excel" });
  }
});

router.get("/pdf", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await exportarConsultas(req, res, "pdf");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al exportar PDF" });
  }
});

router.get("/tipos", verificarToken, soloRoles("admin"), (req, res) => {
  res.json([
    { id: "consultas", nombre: "Consultas", descripcion: "Consultas comerciales filtradas por estado y período" },
    { id: "clientes", nombre: "Clientes", descripcion: "Clientes activos con rubro y fecha de alta" },
    { id: "marketing", nombre: "Marketing", descripcion: "Envíos y contactos comerciales registrados" },
    { id: "resumen", nombre: "Resumen ejecutivo", descripcion: "Indicadores generales del CRM" }
  ]);
});

module.exports = router;
