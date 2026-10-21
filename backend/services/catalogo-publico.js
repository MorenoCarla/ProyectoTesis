/**
 * Lectura pública del catálogo (fuente de verdad: MySQL).
 * Sin autenticación — solo productos publicados y categorías activas.
 */
const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const { SITE_ROOT } = require("../config/site-root");
const {
  categoriaAtributoCss,
  clasesBodyFicha,
  ordenarImagenesFicha
} = require("./ficha-producto-tema");
const { pdfCatalogoParaCategoria } = require("./pdf-catalogo-categoria");

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function imagenEsDeFichaNoGrilla(src) {
  return /crudo|fotomont|negrocrudo|blancocrudo/i.test(String(src || ""));
}

function resolverImagenGrilla(p) {
  let img = (p.imagen_portada || "").trim();
  if (img && !imagenEsDeFichaNoGrilla(img)) return img;
  const slug = (p.slug || "").trim();
  if (slug) {
    const candidato = `img/${slug}.png`;
    if (fs.existsSync(path.join(SITE_ROOT, candidato))) return candidato;
  }
  const imgs = parseJson(p.imagenes_json, []);
  for (const s of imgs) {
    const t = String(s || "").trim();
    if (t && !imagenEsDeFichaNoGrilla(t)) return t;
  }
  return imgs[0] || "img/LOGO.png";
}

function resolverNombreGrilla(p) {
  const ng = (p.nombre_grilla || "").trim();
  if (ng) return ng;
  let n = (p.nombre || "").trim();
  n = n.replace(/^aplique\s+/i, "").replace(/^colgante\s+/i, "");
  return n || p.nombre || "";
}

function urlProductoPublico(slug) {
  return `/p/${encodeURIComponent(slug)}`;
}

function codigosDesdeProductoRow(row) {
  let codigos = parseJson(row.codigos_json, []);
  if (Array.isArray(codigos) && codigos.length && typeof codigos[0] === "object") {
    codigos = codigos
      .map((c) => String(c?.codigo ?? c?.code ?? "").trim())
      .filter(Boolean);
  } else {
    codigos = codigos.map((c) => String(c || "").trim()).filter(Boolean);
  }
  if (!codigos.length) {
    const colores = parseJson(row.colores_json, []);
    codigos = colores.map((c) => String(c?.codigo || "").trim()).filter(Boolean);
  }
  return [...new Set(codigos)];
}

function mapProductoGrilla(row) {
  const codigos = codigosDesdeProductoRow(row);
  return {
    id: row.id,
    slug: row.slug,
    nombre: (row.nombre || "").trim(),
    nombre_grilla: resolverNombreGrilla(row),
    codigos,
    codigos_texto: codigos.join(", "),
    imagen: resolverImagenGrilla(row),
    url: urlProductoPublico(row.slug),
    orden: row.orden
  };
}

function partesCaracteristicas(textOrJson) {
  const list = parseJson(textOrJson, null);
  if (Array.isArray(list) && list.length) {
    return list.map((s) => String(s).trim()).filter(Boolean);
  }
  if (!textOrJson || !String(textOrJson).trim()) return [];
  return String(textOrJson)
    .split(/[\n,;|]+|\s{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function mapProductoFicha(row) {
  const codigos = parseJson(row.codigos_json, []);
  let colores = parseJson(row.colores_json, []);
  const sin_colores = !!row.sin_colores;
  if (!colores.length && !sin_colores && codigos.length) {
    colores = codigos.map((codigo) => ({ codigo, imagen: null, hex: null, etiqueta: null }));
  }
  const imagenes = ordenarImagenesFicha(parseJson(row.imagenes_json, []));
  const carac = partesCaracteristicas(row.caracteristicas_json || row.caracteristicas);

  const pdf = pdfCatalogoParaCategoria({
    pdf_catalogo: row.pdf_catalogo,
    categoria_slug: row.categoria_slug,
    categoria_nombre: row.categoria_nombre
  });

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    subtitulo: row.subtitulo || "",
    caracteristicas: carac,
    descripcion_html: row.descripcion_html || row.descripcion_texto || "",
    descripcion_texto: row.descripcion_texto || "",
    imagenes: imagenes.length ? imagenes : ["img/LOGO.png"],
    codigos,
    colores,
    sin_colores,
    categoria: {
      id: row.categoria_id,
      nombre: row.categoria_nombre,
      slug: row.categoria_slug,
      pagina_listado: row.pagina_listado,
      css: categoriaAtributoCss(row.categoria_nombre)
    },
    ficha_body_class: clasesBodyFicha(row.categoria_nombre),
    url: urlProductoPublico(row.slug),
    catalogo_pdf: pdf,
    nombre_grilla: resolverNombreGrilla(row),
    imagen_grilla: resolverImagenGrilla(row)
  };
}

async function listarCategoriasPublicas() {
  const [rows] = await pool.query(
    `SELECT c.id, c.nombre, c.slug, c.pagina_listado, c.pdf_catalogo,
            COUNT(p.id) AS total_publicados
     FROM categorias_catalogo c
     LEFT JOIN productos_catalogo p ON p.categoria_id = c.id
       AND p.activo = 1 AND p.publicado = 1
     WHERE c.activo = 1 AND c.pagina_listado IS NOT NULL AND c.pagina_listado != ''
     GROUP BY c.id
     ORDER BY c.nombre`
  );
  return rows.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    pagina_listado: c.pagina_listado,
    url_listado: `/${c.pagina_listado}`,
    total_publicados: Number(c.total_publicados) || 0
  }));
}

async function resolverCategoria({ slug, listado }) {
  if (slug) {
    const [rows] = await pool.query(
      "SELECT * FROM categorias_catalogo WHERE slug = ? AND activo = 1 LIMIT 1",
      [slug]
    );
    return rows[0] || null;
  }
  if (listado) {
    const base = path.basename(String(listado).trim());
    const [rows] = await pool.query(
      "SELECT * FROM categorias_catalogo WHERE pagina_listado = ? AND activo = 1 LIMIT 1",
      [base]
    );
    return rows[0] || null;
  }
  return null;
}

async function listarProductosCategoriaPublico({ slug, listado }) {
  const cat = await resolverCategoria({ slug, listado });
  if (!cat) return null;

  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug, c.pagina_listado, c.pdf_catalogo
     FROM productos_catalogo p
     INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
     WHERE p.categoria_id = ? AND p.activo = 1 AND p.publicado = 1
     ORDER BY p.orden ASC, p.id ASC`,
    [cat.id]
  );

  return {
    categoria: {
      id: cat.id,
      nombre: cat.nombre,
      slug: cat.slug,
      pagina_listado: cat.pagina_listado,
      url_listado: `/${cat.pagina_listado}`
    },
    productos: rows.map(mapProductoGrilla)
  };
}

async function obtenerProductoPublico(slug) {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;

  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug,
            c.pagina_listado, c.pdf_catalogo
     FROM productos_catalogo p
     INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
     WHERE p.slug = ? AND p.activo = 1 AND p.publicado = 1 AND c.activo = 1
     LIMIT 1`,
    [s]
  );
  if (!rows.length) return null;
  return mapProductoFicha(rows[0]);
}

async function slugDesdePaginaHtml(paginaHtml) {
  const base = path.basename(String(paginaHtml || "").trim());
  if (!base.endsWith(".html")) return null;
  const [rows] = await pool.query(
    "SELECT slug FROM productos_catalogo WHERE pagina_html = ? AND activo = 1 LIMIT 1",
    [base]
  );
  return rows[0]?.slug || null;
}

module.exports = {
  listarCategoriasPublicas,
  listarProductosCategoriaPublico,
  obtenerProductoPublico,
  slugDesdePaginaHtml,
  urlProductoPublico,
  mapProductoGrilla,
  mapProductoFicha
};
