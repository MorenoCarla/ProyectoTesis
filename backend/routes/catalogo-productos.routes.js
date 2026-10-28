const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");

const SITE_ROOT = path.join(__dirname, "..", "..");
const catalogoImgDir = path.join(SITE_ROOT, "img", "productos");
const homeBannerDir = path.join(SITE_ROOT, "img", "home-banners");
if (!fs.existsSync(catalogoImgDir)) fs.mkdirSync(catalogoImgDir, { recursive: true });
if (!fs.existsSync(homeBannerDir)) fs.mkdirSync(homeBannerDir, { recursive: true });

const uploadImagenCatalogo = multer({
  storage: multer.diskStorage({
    destination: catalogoImgDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      const base = (file.originalname || "img")
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .slice(0, 40);
      cb(null, `${base}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Solo imágenes (PNG, JPG, WEBP…)"));
  }
});

const uploadHomeBanner = multer({
  storage: multer.diskStorage({
    destination: homeBannerDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      cb(null, `home-banner-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Solo imágenes (PNG, JPG, WEBP…)"));
  }
});

const {
  publicarProductoEnWeb,
  quitarCajitaProducto,
  publicarGrillaCategoria,
  publicarTodasLasCategorias
} = require("../services/catalogo-web");
const router = express.Router();

const SQL_LISTA = `
  SELECT p.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug, c.pagina_listado
  FROM productos_catalogo p
  INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
  WHERE p.activo = 1
`;

function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function splitCaracteristicasLegacy(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split(/[\n,;|]+|\s{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function mapProducto(row) {
  if (!row) return row;
  const codigos = parseJsonField(row.codigos_json, []);
  let colores = parseJsonField(row.colores_json, []);
  let caracteristicas_list = parseJsonField(row.caracteristicas_json, null);
  if (!Array.isArray(caracteristicas_list) || !caracteristicas_list.length) {
    caracteristicas_list = splitCaracteristicasLegacy(row.caracteristicas);
  }
  const sin_colores = !!row.sin_colores;
  if (!colores.length && !sin_colores && codigos.length) {
    colores = codigos.map((codigo) => ({ codigo, imagen: null, hex: null, etiqueta: null }));
  }
  return {
    ...row,
    codigos,
    imagenes: parseJsonField(row.imagenes_json, []),
    colores,
    caracteristicas_list,
    sin_colores
  };
}

function slugifyProducto(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizarColoresBody(colores) {
  if (!Array.isArray(colores)) return [];
  return colores
    .map((c) => ({
      codigo: String(c.codigo || "").trim(),
      imagen: (c.imagen || "").trim() || null,
      hex: (c.hex || "").trim() || null,
      etiqueta: (c.etiqueta || "").trim() || null
    }))
    .filter((c) => c.codigo);
}

function camposHomeVitrinaDesdeBody(body) {
  const campos = [];
  const valores = [];
  if (body.home_novedades !== undefined) {
    campos.push("home_novedades = ?");
    valores.push(body.home_novedades ? 1 : 0);
  }
  if (body.home_novedades_orden !== undefined) {
    campos.push("home_novedades_orden = ?");
    valores.push(parseInt(body.home_novedades_orden, 10) || 0);
  }
  if (body.home_novedades_lead !== undefined) {
    campos.push("home_novedades_lead = ?");
    valores.push(String(body.home_novedades_lead || "").trim() || null);
  }
  if (body.home_novedades_banner !== undefined) {
    campos.push("home_novedades_banner = ?");
    valores.push(String(body.home_novedades_banner || "").trim() || null);
  }
  if (body.home_ideas !== undefined) {
    campos.push("home_ideas = ?");
    valores.push(body.home_ideas ? 1 : 0);
  }
  if (body.home_ideas_orden !== undefined) {
    campos.push("home_ideas_orden = ?");
    valores.push(parseInt(body.home_ideas_orden, 10) || 0);
  }
  if (body.home_ideas_hero !== undefined) {
    campos.push("home_ideas_hero = ?");
    valores.push(body.home_ideas_hero ? 1 : 0);
  }
  if (body.home_ideas_hero_orden !== undefined) {
    campos.push("home_ideas_hero_orden = ?");
    valores.push(parseInt(body.home_ideas_hero_orden, 10) || 0);
  }
  if (body.home_ideas_lead !== undefined) {
    campos.push("home_ideas_lead = ?");
    valores.push(body.home_ideas_lead ? String(body.home_ideas_lead).trim().slice(0, 255) : null);
  }
  if (body.home_nuevos !== undefined) {
    campos.push("home_nuevos = ?");
    valores.push(body.home_nuevos ? 1 : 0);
  }
  if (body.home_nuevos_orden !== undefined) {
    campos.push("home_nuevos_orden = ?");
    valores.push(parseInt(body.home_nuevos_orden, 10) || 0);
  }
  return { campos, valores };
}

function filtrosListadoCatalogo(query) {
  let where = "";
  const params = [];

  const buscar = (query.buscar || "").trim();
  if (buscar) {
    const like = `%${buscar}%`;
    where += ` AND (p.nombre LIKE ? OR p.slug LIKE ? OR p.pagina_html LIKE ?
      OR p.nombre_grilla LIKE ? OR JSON_SEARCH(p.codigos_json, 'one', ?) IS NOT NULL)`;
    params.push(like, like, like, like, buscar);
  }

  const categoriaId = parseInt(query.categoria_id, 10);
  if (categoriaId > 0) {
    where += " AND p.categoria_id = ?";
    params.push(categoriaId);
  }

  if (query.publicado === "0") where += " AND p.publicado = 0";
  else if (query.publicado === "1") where += " AND p.publicado = 1";

  return { where, params, buscar };
}

// GET /catalogo-productos — listado paginado (admin/empleado)
router.get("/", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const { where, params } = filtrosListadoCatalogo(req.query);

    let limite = parseInt(req.query.limite, 10);
    if (!Number.isFinite(limite) || limite < 1) limite = 24;
    if (limite > 80) limite = 80;

    let pagina = parseInt(req.query.pagina, 10);
    if (!Number.isFinite(pagina) || pagina < 1) pagina = 1;
    const offset = (pagina - 1) * limite;

    const baseFrom = `${SQL_LISTA}${where}`;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM productos_catalogo p
       INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
       WHERE p.activo = 1${where}`,
      params
    );
    const total = Number(countRows[0]?.total) || 0;

    const sql = `${baseFrom} ORDER BY c.nombre, p.orden ASC, p.nombre LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);

    const paginas = total ? Math.ceil(total / limite) : 0;

    res.json({
      items: rows.map(mapProducto),
      total,
      pagina,
      limite,
      paginas
    });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        error: "Faltan tablas del catálogo. Ejecutá migrate-catalogo-productos.sql e importá productos."
      });
    }
    res.status(500).json({ error: "No se pudo listar productos" });
  }
});

// GET /catalogo-productos/categorias
router.get("/categorias", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS total_productos
       FROM categorias_catalogo c
       LEFT JOIN productos_catalogo p ON p.categoria_id = c.id AND p.activo = 1
       WHERE c.activo = 1
       GROUP BY c.id
       ORDER BY c.nombre`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron listar categorías" });
  }
});

// POST /catalogo-productos — alta de producto nuevo (ficha /p/slug + grilla dinámica)
router.post("/", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const {
      nombre,
      slug: slugBody,
      subtitulo,
      descripcion_html,
      descripcion_texto,
      colores,
      caracteristicas_list,
      sin_colores,
      publicado,
      categoria_id,
      nombre_grilla,
      imagen_portada,
      imagenes
    } = req.body;

    const nombreTrim = String(nombre || "").trim();
    if (!nombreTrim) {
      return res.status(400).json({ error: "El nombre del producto es obligatorio" });
    }

    const catId = parseInt(categoria_id, 10);
    if (!Number.isFinite(catId) || catId < 1) {
      return res.status(400).json({ error: "Elegí una categoría" });
    }

    const [catRows] = await pool.query(
      "SELECT id, pagina_listado FROM categorias_catalogo WHERE id = ? AND activo = 1 LIMIT 1",
      [catId]
    );
    if (!catRows.length) {
      return res.status(400).json({ error: "Categoría no válida" });
    }
    const paginaCategoria = catRows[0].pagina_listado || null;

    let slug = slugifyProducto(slugBody || nombreTrim);
    if (!slug) {
      return res.status(400).json({ error: "Slug inválido (usá letras, números y guiones)" });
    }

    const [dupSlug] = await pool.query(
      "SELECT id FROM productos_catalogo WHERE slug = ? LIMIT 1",
      [slug]
    );
    if (dupSlug.length) {
      return res.status(409).json({ error: `El slug «${slug}» ya existe. Elegí otro.` });
    }

    const paginaHtml = `${slug}.html`;
    const [dupHtml] = await pool.query(
      "SELECT id FROM productos_catalogo WHERE pagina_html = ? LIMIT 1",
      [paginaHtml]
    );
    if (dupHtml.length) {
      return res.status(409).json({ error: "Conflicto con pagina_html; probá otro slug." });
    }

    const listaColores = normalizarColoresBody(colores);
    const sinCol = !!sin_colores;
    if (!sinCol && !listaColores.length) {
      return res.status(400).json({
        error: "Agregá al menos un color/código o marcá «sin colores»."
      });
    }

    const imgs = Array.isArray(imagenes)
      ? imagenes.map((s) => String(s).trim()).filter(Boolean)
      : [];
    if (!imgs.length) {
      return res.status(400).json({ error: "Agregá al menos una imagen del carrusel (ficha)." });
    }

    const listCarac = Array.isArray(caracteristicas_list)
      ? caracteristicas_list.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const descHtml = descripcion_html != null ? descripcion_html : descripcion_texto;
    const descTexto = descripcion_texto != null ? descripcion_texto : descripcion_html;

    const [ordRow] = await pool.query(
      "SELECT COALESCE(MAX(orden), 0) + 1 AS next_orden FROM productos_catalogo WHERE categoria_id = ?",
      [catId]
    );
    const orden = ordRow[0]?.next_orden ?? 0;

    const pub = publicado === false || publicado === 0 || publicado === "0" ? 0 : 1;

    const [ins] = await pool.query(
      `INSERT INTO productos_catalogo (
        categoria_id, nombre, nombre_grilla, slug, pagina_html, subtitulo,
        caracteristicas, caracteristicas_json, descripcion_html, descripcion_texto,
        codigos_json, colores_json, imagenes_json, imagen_portada, pagina_categoria,
        sin_colores, publicado, activo, orden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        catId,
        nombreTrim,
        nombre_grilla != null ? String(nombre_grilla).trim() || null : null,
        slug,
        paginaHtml,
        subtitulo != null ? String(subtitulo).trim() || null : null,
        listCarac.length ? listCarac.join("|") : null,
        JSON.stringify(listCarac),
        descHtml != null ? descHtml : null,
        descTexto != null ? descTexto : null,
        JSON.stringify(listaColores.map((c) => c.codigo)),
        JSON.stringify(listaColores),
        JSON.stringify(imgs),
        imagen_portada != null ? String(imagen_portada).trim() || null : null,
        paginaCategoria,
        sinCol ? 1 : 0,
        pub,
        orden
      ]
    );

    const nuevoId = ins.insertId;
    const homePatch = camposHomeVitrinaDesdeBody(req.body);
    if (homePatch.campos.length) {
      try {
        await pool.query(
          `UPDATE productos_catalogo SET ${homePatch.campos.join(", ")} WHERE id = ?`,
          [...homePatch.valores, nuevoId]
        );
      } catch (homeErr) {
        if (homeErr.code !== "ER_BAD_FIELD_ERROR") throw homeErr;
      }
    }
    const [rows] = await pool.query(`${SQL_LISTA} AND p.id = ?`, [nuevoId]);
    const producto = mapProducto(rows[0]);

    let web = null;
    try {
      web = await publicarProductoEnWeb(nuevoId, producto);
    } catch (pubErr) {
      console.error(pubErr);
      web = { error: pubErr.message };
    }

    res.status(201).json({
      ...producto,
      web,
      publicacion_error: web?.error || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo crear el producto" });
  }
});

// POST /catalogo-productos/upload-home-banner — banner diseñado (Canva) para Novedades
router.post(
  "/upload-home-banner",
  verificarToken,
  soloRoles("admin"),
  (req, res) => {
    uploadHomeBanner.single("imagen")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir el banner" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Falta el archivo (campo imagen)" });
      }
      const ruta = "img/home-banners/" + req.file.filename;
      res.json({ ruta, url: "/" + ruta.replace(/\\/g, "/") });
    });
  }
);

// POST /catalogo-productos/upload-imagen — sube a img/productos/ (ficha web)
router.post(
  "/upload-imagen",
  verificarToken,
  soloRoles("admin"),
  (req, res) => {
    uploadImagenCatalogo.single("imagen")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "No se pudo subir la imagen" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Falta el archivo (campo imagen)" });
      }
      const ruta = "img/productos/" + req.file.filename;
      res.json({ ruta, url: "/" + ruta.replace(/\\/g, "/") });
    });
  }
);

// POST /catalogo-productos/publicar-grillas — regenerar todas las grillas de categoría
router.post(
  "/publicar-grillas",
  verificarToken,
  soloRoles("admin"),
  async (req, res) => {
    try {
      const resultados = await publicarTodasLasCategorias();
      res.json({ mensaje: "Grillas actualizadas", resultados });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Error al publicar grillas" });
    }
  }
);

// POST /catalogo-productos/:id/publicar — ficha + grilla de su categoría
router.post("/:id/publicar", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const web = await publicarProductoEnWeb(req.params.id);
    res.json({ mensaje: "Publicado en el sitio", web });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error al publicar" });
  }
});

// GET /catalogo-productos/:id
router.get("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${SQL_LISTA} AND p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(mapProducto(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// PUT /catalogo-productos/:id — editar campos principales
router.put("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const {
      nombre,
      subtitulo,
      caracteristicas,
      descripcion_html,
      descripcion_texto,
      codigos,
      imagenes,
      colores,
      caracteristicas_list,
      sin_colores,
      publicado,
      categoria_id
    } = req.body;

    const [actual] = await pool.query(
      "SELECT id, categoria_id FROM productos_catalogo WHERE id = ? AND activo = 1",
      [req.params.id]
    );
    if (!actual.length) return res.status(404).json({ error: "Producto no encontrado" });
    const categoriaAnterior = actual[0].categoria_id;

    const campos = [];
    const valores = [];

    if (nombre !== undefined) {
      campos.push("nombre = ?");
      valores.push(nombre);
    }
    if (req.body.nombre_grilla !== undefined) {
      campos.push("nombre_grilla = ?");
      valores.push(req.body.nombre_grilla);
    }
    if (req.body.imagen_portada !== undefined) {
      campos.push("imagen_portada = ?");
      valores.push(req.body.imagen_portada);
    }
    if (subtitulo !== undefined) {
      campos.push("subtitulo = ?");
      valores.push(subtitulo);
    }
    if (caracteristicas_list !== undefined) {
      const list = Array.isArray(caracteristicas_list)
        ? caracteristicas_list.map((s) => String(s).trim()).filter(Boolean)
        : [];
      campos.push("caracteristicas_json = ?");
      valores.push(JSON.stringify(list));
      campos.push("caracteristicas = ?");
      valores.push(list.length ? list.join("|") : null);
    } else if (caracteristicas !== undefined) {
      campos.push("caracteristicas = ?");
      valores.push(caracteristicas);
    }
    if (descripcion_html !== undefined) {
      campos.push("descripcion_html = ?");
      valores.push(descripcion_html);
    }
    if (descripcion_texto !== undefined) {
      campos.push("descripcion_texto = ?");
      valores.push(descripcion_texto);
    }
    if (colores !== undefined) {
      const lista = Array.isArray(colores)
        ? colores
            .map((c) => ({
              codigo: String(c.codigo || "").trim(),
              imagen: (c.imagen || "").trim() || null,
              hex: (c.hex || "").trim() || null,
              etiqueta: (c.etiqueta || "").trim() || null
            }))
            .filter((c) => c.codigo)
        : [];
      campos.push("colores_json = ?");
      valores.push(JSON.stringify(lista));
      campos.push("codigos_json = ?");
      valores.push(JSON.stringify(lista.map((c) => c.codigo)));
    } else if (codigos !== undefined) {
      campos.push("codigos_json = ?");
      valores.push(JSON.stringify(codigos));
    }
    if (imagenes !== undefined) {
      const imgs = Array.isArray(imagenes)
        ? imagenes.map((s) => String(s).trim()).filter(Boolean)
        : [];
      campos.push("imagenes_json = ?");
      valores.push(JSON.stringify(imgs));
    }
    if (sin_colores !== undefined) {
      campos.push("sin_colores = ?");
      valores.push(sin_colores ? 1 : 0);
    }
    if (publicado !== undefined) {
      campos.push("publicado = ?");
      valores.push(publicado ? 1 : 0);
    }
    if (categoria_id !== undefined) {
      campos.push("categoria_id = ?");
      valores.push(categoria_id);
    }
    const homePatch = camposHomeVitrinaDesdeBody(req.body);
    campos.push(...homePatch.campos);
    valores.push(...homePatch.valores);

    if (!campos.length) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    valores.push(req.params.id);
    await pool.query(
      `UPDATE productos_catalogo SET ${campos.join(", ")}, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      valores
    );

    const [rows] = await pool.query(`${SQL_LISTA} AND p.id = ?`, [req.params.id]);
    const productoActualizado = mapProducto(rows[0]);
    if (req.body.nombre_grilla !== undefined) {
      productoActualizado.nombre_grilla = req.body.nombre_grilla;
    }
    if (req.body.imagen_portada !== undefined) {
      productoActualizado.imagen_portada = req.body.imagen_portada;
    }
    let web = null;
    try {
      web = await publicarProductoEnWeb(req.params.id, productoActualizado);
    } catch (pubErr) {
      console.error(pubErr);
      web = { error: pubErr.message };
    }
    const publicacion_error = web?.error || null;
    res.json({ ...mapProducto(rows[0]), web, publicacion_error });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar el producto" });
  }
});

// DELETE /catalogo-productos/:id — baja lógica
router.delete("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const [prev] = await pool.query(
      "SELECT categoria_id FROM productos_catalogo WHERE id = ? AND activo = 1",
      [req.params.id]
    );
    if (!prev.length) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    const categoriaId = prev[0].categoria_id;

    await pool.query(
      "UPDATE productos_catalogo SET activo = 0, publicado = 0 WHERE id = ?",
      [req.params.id]
    );

    const [prod] = await pool.query(
      "SELECT pagina_html FROM productos_catalogo WHERE id = ?",
      [req.params.id]
    );
    const paginaHtml = prod[0]?.pagina_html;

    res.json({
      mensaje: "Producto dado de baja",
      web: { modo: "catalogo_dinamico", mensaje: "Ya no aparece en la web pública." }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo dar de baja" });
  }
});

module.exports = router;
