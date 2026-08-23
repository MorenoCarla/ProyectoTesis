const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads", "campanas");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + ext);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image\/|video\/|application\/pdf|text\/plain)/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes, videos, PDF o texto"));
    }
  }
});

function tipoDeArchivo(mimetype) {
  if (mimetype.startsWith("image/")) return "imagen";
  if (mimetype.startsWith("video/")) return "video";
  return "documento";
}

async function obtenerArchivosPorCampanas(ids) {
  if (!ids.length) return {};
  try {
    const [filas] = await pool.query(
      "SELECT * FROM campana_archivos WHERE campana_id IN (?) ORDER BY id",
      [ids]
    );
    const map = {};
    filas.forEach(a => {
      if (!map[a.campana_id]) map[a.campana_id] = [];
      map[a.campana_id].push({
        id: a.id,
        nombre: a.nombre_original,
        url: "/uploads/campanas/" + a.ruta,
        tipo: a.tipo
      });
    });
    return map;
  } catch {
    return {};
  }
}

function errorSql(res, error) {
  console.error(error);
  if (error.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      error: "Faltan tablas de marketing. Ejecutá actualizar-marketing.sql y actualizar-plantillas-campanas.sql en MySQL Workbench."
    });
  }
  return res.status(500).json({ error: "Error en marketing" });
}

function aplicarPlantilla(plantilla, cliente) {
  return plantilla
    .replace(/\{\{nombre\}\}/g, cliente.nombre || "")
    .replace(/\{\{apellido\}\}/g, cliente.apellido || "")
    .replace(/\{\{empresa\}\}/g, cliente.empresa || "su empresa")
    .replace(/\{\{rubro\}\}/g, (cliente.rubro || "cliente").replace(/_/g, " "));
}

function formatearRubro(r) {
  if (!r) return "";
  return r.replace(/_/g, " ");
}

async function obtenerPlantilla(codigo, fallback) {
  try {
    const [filas] = await pool.query(
      "SELECT plantilla FROM plantillas_mensajes WHERE codigo = ?",
      [codigo]
    );
    return filas.length > 0 ? filas[0].plantilla : fallback;
  } catch {
    return fallback;
  }
}

const PRIORIDAD_CATEGORIA = { urgente: 1, semana: 2, campana: 3, cuenta_corriente: 4 };
const LIMITE_CLIENTES_MASIVO = 25;
const SQL_CLIENTE = `
  SELECT id, nombre, apellido, email, telefono, rubro, empresa,
         fecha_nacimiento, cuenta_corriente, tipo_cliente
  FROM clientes WHERE activo = 1
`;

async function consultarClientes(extraWhere = "", params = [], limite = null) {
  let sql = SQL_CLIENTE + extraWhere + " ORDER BY cuenta_corriente DESC, creado_en DESC";
  const qParams = [...params];
  if (limite) {
    sql += " LIMIT ?";
    qParams.push(limite);
  }
  const [filas] = await pool.query(sql, qParams);
  return filas;
}

async function contarEnviadosSemana() {
  try {
    const [[r]] = await pool.query(
      `SELECT COUNT(*) AS total FROM envios_marketing
       WHERE estado = 'enviado' AND creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    return r.total;
  } catch {
    return 0;
  }
}

function datosCliente(c) {
  return {
    cliente_id: c.id,
    cliente_nombre: `${c.nombre} ${c.apellido || ""}`.trim(),
    email: c.email,
    telefono: c.telefono,
    rubro: formatearRubro(c.rubro),
    rubro_valor: c.rubro || "",
    empresa: c.empresa,
    cuenta_corriente: c.cuenta_corriente
  };
}

async function obtenerEnviosRecientes() {
  try {
    const [filas] = await pool.query(
      `SELECT cliente_id, tipo_campana FROM envios_marketing
       WHERE estado IN ('enviado', 'descartado')
       AND creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const set = new Set();
    filas.forEach(f => set.add(`${f.cliente_id}:${f.tipo_campana}`));
    return set;
  } catch {
    return new Set();
  }
}

async function obtenerCuentaCorrienteEnviadaEsteMes() {
  try {
    const [filas] = await pool.query(
      `SELECT cliente_id FROM envios_marketing
       WHERE tipo_campana = 'cuenta_corriente'
       AND estado IN ('enviado', 'descartado')
       AND YEAR(creado_en) = YEAR(CURDATE())
       AND MONTH(creado_en) = MONTH(CURDATE())`
    );
    return new Set(filas.map(f => f.cliente_id));
  } catch {
    return new Set();
  }
}

function agregarOportunidad(lista, enviados, oportunidad) {
  const clave = `${oportunidad.cliente_id}:${oportunidad.tipo_campana}`;
  if (enviados.has(clave)) return;
  lista.push(oportunidad);
}

function consolidarPorCliente(oportunidades) {
  const map = new Map();

  oportunidades.forEach(o => {
    if (!map.has(o.cliente_id)) {
      map.set(o.cliente_id, {
        cliente_id: o.cliente_id,
        cliente_nombre: o.cliente_nombre,
        email: o.email,
        telefono: o.telefono,
        rubro: o.rubro,
        rubro_valor: o.rubro_valor,
        empresa: o.empresa,
        cuenta_corriente: o.cuenta_corriente,
        items: []
      });
    }
    map.get(o.cliente_id).items.push({
      motivo: o.motivo,
      tipo_campana: o.tipo_campana,
      mensaje: o.mensaje,
      categoria: o.categoria,
      archivos: o.archivos || [],
      ref_id: o.ref_id
    });
  });

  return Array.from(map.values())
    .map(g => {
      g.items.sort((a, b) => PRIORIDAD_CATEGORIA[a.categoria] - PRIORIDAD_CATEGORIA[b.categoria]);
      g.motivos = g.items.map(i => i.motivo);
      g.categoria_principal = g.items[0].categoria;
      g.categorias = [...new Set(g.items.map(i => i.categoria))];
      return g;
    })
    .sort((a, b) => PRIORIDAD_CATEGORIA[a.categoria_principal] - PRIORIDAD_CATEGORIA[b.categoria_principal]);
}

function calcularResumen(clientes) {
  const resumen = { urgente: 0, semana: 0, campana: 0, cuenta_corriente: 0, total_clientes: clientes.length };
  clientes.forEach(c => {
    c.categorias.forEach(cat => {
      if (resumen[cat] !== undefined) resumen[cat]++;
    });
  });
  return resumen;
}

// GET /marketing/oportunidades?buscar=&categoria=todos|rubro=&pagina=1&limite=20
router.get("/oportunidades", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const oportunidades = [];
    const enviados = await obtenerEnviosRecientes();
    const rubroFiltro = req.query.rubro || "";
    const buscar = (req.query.buscar || "").toLowerCase().trim();

    const tplCumpleHoy = await obtenerPlantilla("cumpleanos_hoy",
      "¡Feliz cumpleaños {{nombre}}! Desde Ituarte tenemos promociones para vos.");
    const tplCumpleProx = await obtenerPlantilla("cumpleanos_proximo",
      "Hola {{nombre}}, feliz cumpleaños. Consultanos por promos en iluminación.");
    const tplCtaCte = await obtenerPlantilla("cuenta_corriente",
      "Hola {{nombre}}, novedades del mes en Ituarte para clientes con cuenta corriente.");

    const hoyStr = new Date().toISOString().split("T")[0];
    const diaHoy = new Date().getDate();

    const [cumpleHoy] = await pool.query(
      SQL_CLIENTE + ` AND fecha_nacimiento IS NOT NULL
        AND MONTH(fecha_nacimiento) = MONTH(CURDATE())
        AND DAY(fecha_nacimiento) = DAY(CURDATE())`
    );
    cumpleHoy.forEach(c => {
      agregarOportunidad(oportunidades, enviados, {
        ...datosCliente(c),
        motivo: "Cumpleaños hoy",
        tipo_campana: "cumpleanos",
        categoria: "urgente",
        mensaje: aplicarPlantilla(tplCumpleHoy, c)
      });
    });

    for (let i = 1; i <= 7; i++) {
      const [cumpleProx] = await pool.query(
        SQL_CLIENTE + ` AND fecha_nacimiento IS NOT NULL
          AND DATE_FORMAT(fecha_nacimiento, '%m-%d') = DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL ? DAY), '%m-%d')`,
        [i]
      );
      cumpleProx.forEach(c => {
        if (oportunidades.some(o => o.cliente_id === c.id && o.tipo_campana.startsWith("cumpleanos"))) return;
        agregarOportunidad(oportunidades, enviados, {
          ...datosCliente(c),
          motivo: `Cumpleaños en ${i} día(s)`,
          tipo_campana: "cumpleanos_proximo",
          categoria: "semana",
          mensaje: aplicarPlantilla(tplCumpleProx, c)
        });
      });
    }

    const [diasEsp] = await pool.query("SELECT * FROM dias_especiales WHERE activo = 1");

    for (let i = 0; i <= 7; i++) {
      const [[fecha]] = await pool.query(
        "SELECT MONTH(DATE_ADD(CURDATE(), INTERVAL ? DAY)) AS mes, DAY(DATE_ADD(CURDATE(), INTERVAL ? DAY)) AS dia",
        [i, i]
      );

      for (const de of diasEsp) {
        if (de.mes !== fecha.mes || de.dia !== fecha.dia) continue;

        let clientesDia;
        if (de.rubro_objetivo) {
          clientesDia = await consultarClientes(" AND rubro = ?", [de.rubro_objetivo]);
        } else if (rubroFiltro || buscar) {
          clientesDia = await consultarClientes(
            rubroFiltro ? " AND rubro = ?" : "",
            rubroFiltro ? [rubroFiltro] : []
          );
        } else {
          clientesDia = await consultarClientes("", [], LIMITE_CLIENTES_MASIVO);
        }

        clientesDia.forEach(c => {
          agregarOportunidad(oportunidades, enviados, {
            ...datosCliente(c),
            motivo: i === 0 ? de.nombre + " (hoy)" : de.nombre + ` (en ${i} días)`,
            tipo_campana: "dia_especial_" + de.id,
            categoria: i === 0 ? "urgente" : "semana",
            ref_id: de.id,
            mensaje: aplicarPlantilla(de.plantilla, c)
          });
        });
      }
    }

    const [campanas] = await pool.query(
      `SELECT * FROM campanas_marketing WHERE activo = 1
       AND (fecha_inicio IS NULL OR fecha_inicio <= ?)
       AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
      [hoyStr, hoyStr]
    );

    const archivosMap = await obtenerArchivosPorCampanas(campanas.map(c => c.id));

    for (const camp of campanas) {
      const rubroCamp = camp.rubro_objetivo || rubroFiltro || null;
      if (!rubroCamp && !buscar) continue;

      const clientesCamp = rubroCamp
        ? await consultarClientes(" AND rubro = ?", [rubroCamp])
        : await consultarClientes("", [], LIMITE_CLIENTES_MASIVO);

      clientesCamp.forEach(c => {
        agregarOportunidad(oportunidades, enviados, {
          ...datosCliente(c),
          motivo: "Campaña: " + camp.titulo,
          tipo_campana: "campana_" + camp.id,
          categoria: "campana",
          ref_id: camp.id,
          mensaje: aplicarPlantilla(camp.mensaje_plantilla, c),
          archivos: archivosMap[camp.id] || []
        });
      });
    }

    if (diaHoy === 1) {
      const enviadosCtaCteMes = await obtenerCuentaCorrienteEnviadaEsteMes();
      const clientesCta = await consultarClientes(" AND cuenta_corriente = 1");
      clientesCta.forEach(c => {
        if (enviadosCtaCteMes.has(c.id)) return;
        agregarOportunidad(oportunidades, enviados, {
          ...datosCliente(c),
          motivo: "Recordatorio mensual — cuenta corriente (1° del mes)",
          tipo_campana: "cuenta_corriente",
          categoria: "cuenta_corriente",
          mensaje: aplicarPlantilla(tplCtaCte, c)
        });
      });
    }

    let clientesAgrupados = consolidarPorCliente(oportunidades);
    const resumen = calcularResumen(clientesAgrupados);
    resumen.enviados_semana = await contarEnviadosSemana();

    const categoria = req.query.categoria || "todos";

    if (buscar) {
      clientesAgrupados = clientesAgrupados.filter(c =>
        c.cliente_nombre.toLowerCase().includes(buscar) ||
        (c.email || "").toLowerCase().includes(buscar) ||
        (c.telefono || "").includes(buscar) ||
        (c.empresa || "").toLowerCase().includes(buscar)
      );
    }

    if (rubroFiltro) {
      clientesAgrupados = clientesAgrupados.filter(c => c.rubro_valor === rubroFiltro);
    }

    if (categoria && categoria !== "todos") {
      clientesAgrupados = clientesAgrupados.filter(c => c.categorias.includes(categoria));
    }

    const total = clientesAgrupados.length;
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(30, Math.max(5, parseInt(req.query.limite, 10) || 15));
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const inicio = (pagina - 1) * limite;

    res.json({
      total,
      pagina,
      limite,
      total_paginas: totalPaginas,
      resumen,
      aviso: !rubroFiltro && !buscar
        ? "Mostrando solo contactos prioritarios. Usá filtro por rubro o buscador para campañas generales."
        : null,
      clientes: clientesAgrupados.slice(inicio, inicio + limite)
    });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        error: "Ejecutá actualizar-plantillas-campanas.sql en MySQL Workbench"
      });
    }
    res.status(500).json({ error: "Error al cargar oportunidades" });
  }
});

// --- PLANTILLAS AUTOMÁTICAS ---
router.get("/plantillas", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query("SELECT * FROM plantillas_mensajes ORDER BY id");
    res.json(filas);
  } catch (error) {
    errorSql(res, error);
  }
});

router.put("/plantillas/:codigo", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const { plantilla } = req.body;
    await pool.query(
      "UPDATE plantillas_mensajes SET plantilla = ? WHERE codigo = ?",
      [plantilla, req.params.codigo]
    );
    res.json({ mensaje: "Plantilla actualizada" });
  } catch (error) {
    errorSql(res, error);
  }
});

// --- DÍAS ESPECIALES ---
async function crearDiaEspecial(req, res) {
  try {
    const { nombre, mes, dia, rubro_objetivo, plantilla } = req.body;
    if (!nombre || !mes || !dia || !plantilla) {
      return res.status(400).json({ error: "Nombre, fecha y mensaje son obligatorios" });
    }
    const m = parseInt(mes, 10);
    const d = parseInt(dia, 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return res.status(400).json({ error: "Mes o día inválido" });
    }
    const [r] = await pool.query(
      `INSERT INTO dias_especiales (nombre, mes, dia, rubro_objetivo, plantilla)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre.trim(), m, d, rubro_objetivo || null, plantilla.trim()]
    );
    res.status(201).json({ id: r.insertId, mensaje: "Día agregado al calendario" });
  } catch (error) {
    errorSql(res, error);
  }
}

router.get("/dias-especiales", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query(
      "SELECT * FROM dias_especiales WHERE activo = 1 ORDER BY mes, dia"
    );
    res.json(filas);
  } catch (error) {
    errorSql(res, error);
  }
});

router.post("/dias-especiales/nuevo", verificarToken, soloRoles("admin"), crearDiaEspecial);
router.post("/dias-especiales", verificarToken, soloRoles("admin"), crearDiaEspecial);

router.put("/dias-especiales/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const { plantilla, nombre, mes, dia, rubro_objetivo } = req.body;
    await pool.query(
      `UPDATE dias_especiales SET plantilla = ?, nombre = ?, mes = ?, dia = ?, rubro_objetivo = ?
       WHERE id = ?`,
      [plantilla, nombre, mes, dia, rubro_objetivo || null, req.params.id]
    );
    res.json({ mensaje: "Día especial actualizado" });
  } catch (error) {
    errorSql(res, error);
  }
});

router.delete("/dias-especiales/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await pool.query("UPDATE dias_especiales SET activo = 0 WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Día eliminado del calendario" });
  } catch (error) {
    errorSql(res, error);
  }
});

// --- CAMPAÑAS PERSONALIZADAS ---
router.get("/campanas", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [filas] = await pool.query(
      "SELECT * FROM campanas_marketing ORDER BY activo DESC, creado_en DESC"
    );
    const archivosMap = await obtenerArchivosPorCampanas(filas.map(c => c.id));
    res.json(filas.map(c => ({ ...c, archivos: archivosMap[c.id] || [] })));
  } catch (error) {
    errorSql(res, error);
  }
});

router.post("/campanas", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const { titulo, mensaje_plantilla, rubro_objetivo, fecha_inicio, fecha_fin } = req.body;
    if (!titulo || !mensaje_plantilla) {
      return res.status(400).json({ error: "Título y mensaje son obligatorios" });
    }
    const [r] = await pool.query(
      `INSERT INTO campanas_marketing (titulo, mensaje_plantilla, rubro_objetivo, fecha_inicio, fecha_fin)
       VALUES (?, ?, ?, ?, ?)`,
      [titulo, mensaje_plantilla, rubro_objetivo || null, fecha_inicio || null, fecha_fin || null]
    );
    res.status(201).json({ id: r.insertId, mensaje: "Campaña creada" });
  } catch (error) {
    errorSql(res, error);
  }
});

router.put("/campanas/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const { titulo, mensaje_plantilla, rubro_objetivo, fecha_inicio, fecha_fin, activo } = req.body;
    await pool.query(
      `UPDATE campanas_marketing SET titulo=?, mensaje_plantilla=?, rubro_objetivo=?,
       fecha_inicio=?, fecha_fin=?, activo=? WHERE id=?`,
      [titulo, mensaje_plantilla, rubro_objetivo || null, fecha_inicio || null, fecha_fin || null,
       activo !== undefined ? activo : 1, req.params.id]
    );
    res.json({ mensaje: "Campaña actualizada" });
  } catch (error) {
    errorSql(res, error);
  }
});

router.delete("/campanas/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await pool.query("UPDATE campanas_marketing SET activo = 0 WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Campaña desactivada" });
  } catch (error) {
    errorSql(res, error);
  }
});

router.post(
  "/campanas/:id/archivos",
  verificarToken,
  soloRoles("admin"),
  upload.array("archivos", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Seleccioná al menos un archivo" });
      }
      for (const f of req.files) {
        await pool.query(
          "INSERT INTO campana_archivos (campana_id, nombre_original, ruta, tipo) VALUES (?, ?, ?, ?)",
          [req.params.id, f.originalname, f.filename, tipoDeArchivo(f.mimetype)]
        );
      }
      res.status(201).json({ mensaje: "Archivos subidos", cantidad: req.files.length });
    } catch (error) {
      errorSql(res, error);
    }
  }
);

router.post("/registrar-envio", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const { cliente_id, tipo_campana, mensaje, estado } = req.body;

    if (!cliente_id || !tipo_campana) {
      return res.status(400).json({ error: "Cliente y tipo de contacto son obligatorios" });
    }

    const [existente] = await pool.query(
      `SELECT id FROM envios_marketing
       WHERE cliente_id = ? AND tipo_campana = ?
         AND estado IN ('enviado', 'descartado')
         AND creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       LIMIT 1`,
      [cliente_id, tipo_campana]
    );

    if (existente.length > 0) {
      return res.json({
        mensaje: "Este contacto ya fue registrado en los últimos 7 días",
        ya_registrado: true
      });
    }

    await pool.query(
      `INSERT INTO envios_marketing (cliente_id, tipo_campana, mensaje, estado, fecha_programada)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [cliente_id, tipo_campana, mensaje, estado || "enviado"]
    );
    res.status(201).json({ mensaje: "Contacto registrado como enviado" });
  } catch (error) {
    errorSql(res, error);
  }
});

router.get("/rubros", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  res.json([
    { valor: "arquitecto", label: "Arquitecto" },
    { valor: "ingeniero", label: "Ingeniero" },
    { valor: "electricista", label: "Electricista" },
    { valor: "diseñador_interiores", label: "Diseñador de interiores" },
    { valor: "constructor", label: "Constructor" },
    { valor: "municipalidad", label: "Municipalidad" },
    { valor: "empresa_industrial", label: "Empresa industrial" },
    { valor: "comercio", label: "Comercio" },
    { valor: "particular", label: "Particular" },
    { valor: "otro", label: "Otro" }
  ]);
});

module.exports = router;
