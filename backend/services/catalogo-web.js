/**
 * Publica catálogo en archivos HTML estáticos (ficha + grilla de categoría).
 * Fuente de verdad: tablas productos_catalogo / categorias_catalogo.
 */
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const {
  datosCajitaDesdeProducto,
  generarHtmlCajita,
  publicarCajitaEnArchivo,
  quitarCajitaEnArchivo
} = require("./catalogo-grilla");

const { SITE_ROOT } = require("../config/site-root");

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function slugCatalogoPdf(nombreCategoria) {
  const map = { "Luminaria de Pileta": "catalogo-luminaria-pileta.pdf" };
  if (map[nombreCategoria]) return "catalogo/" + map[nombreCategoria];
  const slug = nombreCategoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return "catalogo/catalogo-" + slug + ".pdf";
}

function nombreGrillaDefault(nombre, slug) {
  if (slug) {
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }
  return nombre;
}

async function cargarProducto(id) {
  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria_nombre, c.pagina_listado, c.slug AS categoria_slug
     FROM productos_catalogo p
     INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
     WHERE p.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const p = rows[0];
  p.codigos = parseJson(p.codigos_json, []);
  p.imagenes = parseJson(p.imagenes_json, []);
  p.caracteristicas_list = parseJson(p.caracteristicas_json, null);
  p.colores = parseJson(p.colores_json, []);
  p.sin_colores = !!p.sin_colores;
  if (!p.caracteristicas_list?.length && p.caracteristicas) {
    p.caracteristicas_list = partesCaracteristicas(p.caracteristicas);
  }
  if (!p.colores.length && !p.sin_colores && p.codigos.length) {
    p.colores = p.codigos.map((codigo) => ({ codigo, imagen: null, hex: null, etiqueta: null }));
  }
  return p;
}

function generarSlidesSwiper(imagenes, alt) {
  if (!imagenes.length) {
    return `<div class="swiper-slide"><img src="img/LOGO.png" alt="${escapeHtml(alt)}"></div>`;
  }
  return imagenes
    .map(
      (src) =>
        `<div class="swiper-slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"></div>`
    )
    .join("\n                            ");
}

function svgDataUrlColor(hex) {
  const raw = String(hex || "").trim();
  const fill = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(raw) ? raw : "#bdbdbd";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><circle cx="28" cy="28" r="26" fill="${fill}" stroke="#777" stroke-width="1"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generarBloquesColoresYCodigos(p) {
  if (p.sin_colores) {
    return {
      imagenesColores: `<div class="imagenes-colores"></div>`,
      textoCodigos: `<div class="texto-codigos"></div>`,
      omitirSeccionCodigo: true
    };
  }
  const colores = (p.colores || []).filter((c) => c && String(c.codigo || "").trim());
  if (!colores.length) {
    return {
      imagenesColores: `<div class="imagenes-colores"></div>`,
      textoCodigos: `<div class="texto-codigos"></div>`,
      omitirSeccionCodigo: false
    };
  }
  const imgs = colores
    .map((item) => {
      let src = (item.imagen || "").trim();
      if (!src && item.hex) src = svgDataUrlColor(item.hex);
      if (!src) return "";
      const alt = escapeHtml(item.etiqueta || item.codigo || "color");
      const srcAttr = src.startsWith("data:") ? src : escapeHtml(src);
      return `<img src="${srcAttr}" alt="${alt}">`;
    })
    .filter(Boolean)
    .join("\n                        ");
  const ps = colores
    .map((c) => `<p class="codigocolor">${escapeHtml(String(c.codigo).trim())}</p>`)
    .join("\n                        ");
  return {
    imagenesColores: `<div class="imagenes-colores">\n                        ${imgs}\n                    </div>`,
    textoCodigos: `<div class="texto-codigos">\n                        ${ps}\n                    </div>`,
    omitirSeccionCodigo: false
  };
}

/** Varias etiquetas rojas: separa por saltos de línea, comas o espacios múltiples. */
function partesCaracteristicas(text) {
  if (text == null || !String(text).trim()) return [];
  return String(text)
    .split(/[\n,;]+|\s{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function generarBloqueCaracteristicas(textOrParts) {
  const parts = Array.isArray(textOrParts)
    ? textOrParts.map((s) => String(s).trim()).filter(Boolean)
    : partesCaracteristicas(textOrParts);
  if (!parts.length) {
    return `<div class="caracteristicas"></div>`;
  }
  const ps = parts.map((part) => `<p>${escapeHtml(part)}</p>`).join("\n                        ");
  return `<div class="caracteristicas">\n                        ${ps}\n                    </div>`;
}

function normalizarDescripcionPublicar(text) {
  if (text == null || !String(text).trim()) return "";
  const raw = String(text);
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw.trim();
  return escapeHtml(raw.replace(/\s+/g, " ").trim());
}

function patchFichaHtml(html, p) {
  const categoria = p.categoria_nombre || "";
  const nombre = p.nombre || "";
  const tituloUpper = (nombre || "").toUpperCase();
  const descRaw = p.descripcion_html || p.descripcion_texto || "";
  const descHtml = normalizarDescripcionPublicar(descRaw);
  const volver = p.pagina_categoria || p.pagina_listado || "productos.html";
  const volverLabel = categoria ? `← Volver a ${categoria.toLowerCase()}` : "← Volver";
  const pdf = slugCatalogoPdf(categoria);
  const catalogoLabel = categoria ? `Catálogo ${categoria}` : "Catálogo";
  const imagenes = p.imagenes || [];
  const slides = generarSlidesSwiper(imagenes, nombre);
  const bloquesCodigo = generarBloquesColoresYCodigos(p);

  const descRe = /<p class="textodescripcion">[\s\S]*?<\/p>/i;
  if (!descRe.test(html)) {
    throw new Error("La ficha no tiene <p class=\"textodescripcion\"> (no se puede publicar la descripción)");
  }

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(nombre)}</title>`);
  if (/data-producto="/i.test(out)) {
    out = out.replace(/data-producto="[^"]*"/i, `data-producto="${escapeHtml(nombre)}"`);
  }
  if (/data-categoria="/i.test(out)) {
    out = out.replace(/data-categoria="[^"]*"/i, `data-categoria="${escapeHtml(categoria)}"`);
  }
  out = out.replace(
    /<a href="[^"]*" class="btn-volver">\s*[\s\S]*?<\/a>/i,
    `<a href="${escapeHtml(volver)}" class="btn-volver">${escapeHtml(volverLabel)}</a>`
  );

  const swiperRe =
    /(<div class="swiper swiper-producto">\s*<div class="swiper-wrapper">)[\s\S]*?(<\/div>\s*<div class="swiper-pagination">)/i;
  if (swiperRe.test(out)) {
    out = out.replace(swiperRe, `$1\n                            ${slides}\n                        $2`);
  }

  if (p.subtitulo != null) {
    out = out.replace(
      /<p class="subtitulo">[^<]*<\/p>/i,
      `<p class="subtitulo">${escapeHtml(p.subtitulo || "")}</p>`
    );
  }
  out = out.replace(
    /<h1 class="titulo"><strong>[\s\S]*?<\/strong><\/h1>/i,
    `<h1 class="titulo"><strong>${escapeHtml(tituloUpper)}</strong></h1>`
  );
  {
    const carac = p.caracteristicas_list?.length
      ? p.caracteristicas_list
      : p.caracteristicas;
    out = out.replace(
      /<div class="caracteristicas">\s*[\s\S]*?<\/div>/i,
      generarBloqueCaracteristicas(carac)
    );
  }
  out = out.replace(descRe, `<p class="textodescripcion">${descHtml}</p>`);
  if (!out.includes(descHtml.slice(0, Math.min(24, descHtml.length)))) {
    throw new Error("No se pudo escribir la descripción en el HTML");
  }
  if (bloquesCodigo.omitirSeccionCodigo) {
    out = out.replace(
      /<h2 class="codigo">[\s\S]*?<div class="texto-codigos">[\s\S]*?<\/div>\s*(?:<br\s*\/?>)?/i,
      ""
    );
  } else {
    out = out.replace(
      /<div class="imagenes-colores">[\s\S]*?<\/div>/i,
      bloquesCodigo.imagenesColores
    );
    out = out.replace(/<div class="texto-codigos">[\s\S]*?<\/div>/i, bloquesCodigo.textoCodigos);
  }
  out = out.replace(
    /<a class="boton-descargas"[^>]*>[\s\S]*?<\/a>/i,
    `<a class="boton-descargas" href="${escapeHtml(pdf)}" target="_blank" rel="noopener noreferrer">${escapeHtml(catalogoLabel)}</a>`
  );

  return out;
}

async function publicarFichaProducto(productoId) {
  const p = await cargarProducto(productoId);
  if (!p) throw new Error("Producto no encontrado");
  if (!p.pagina_html) throw new Error("El producto no tiene pagina_html");

  const filePath = path.join(SITE_ROOT, p.pagina_html);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo ${p.pagina_html} en el sitio`);
  }

  const html = fs.readFileSync(filePath, "utf8");
  const nuevo = patchFichaHtml(html, p);
  fs.writeFileSync(filePath, nuevo, "utf8");
  console.log("[catalogo-web] Ficha publicada:", filePath);
  return { archivo: p.pagina_html, ruta: filePath };
}

function generarHtmlGrilla(productos) {
  const filas = [];
  const POR_FILA = 5;
  const nombresFila = [
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince"
  ];

  for (let i = 0; i < productos.length; i += POR_FILA) {
    const chunk = productos.slice(i, i + POR_FILA);
    const filaClass = nombresFila[Math.floor(i / POR_FILA)] || "extra";
    const items = chunk
      .map((p, j) => {
        const idx = (i + j + 1) % 5 || 5;
        const datos = datosCajitaDesdeProducto(p);
        return generarHtmlCajita(datos, { imagen: String(idx), p: `p${idx}` });
      })
      .join("\n");
    filas.push(`                <div class="fila ${filaClass}">\n${items}\n                </div>`);
  }

  return filas.join("\n");
}

async function prepararProductoParaGrilla(productoId, productoPre) {
  let p = productoPre;
  if (!p) {
    p = await cargarProducto(productoId);
  } else if (!p.codigos && p.codigos_json != null) {
    p.codigos = parseJson(p.codigos_json, []);
  }
  if (!p) throw new Error("Producto no encontrado");

  let listado = p.pagina_listado;
  if (!listado && p.categoria_id) {
    const [cats] = await pool.query(
      "SELECT pagina_listado FROM categorias_catalogo WHERE id = ? AND activo = 1",
      [p.categoria_id]
    );
    listado = cats[0]?.pagina_listado;
  }
  if (!listado) {
    throw new Error(
      "La categoría no tiene pagina_listado (ej. apliques.html). Revisá categorias_catalogo en MySQL."
    );
  }
  return { p, listado };
}

async function publicarCajitaProducto(productoId, productoPre, overrides) {
  const { p, listado } = await prepararProductoParaGrilla(productoId, productoPre);
  return publicarCajitaEnArchivo(listado, p, overrides);
}

async function quitarCajitaProducto(categoriaId, paginaHtml) {
  const [cats] = await pool.query(
    "SELECT pagina_listado FROM categorias_catalogo WHERE id = ? AND activo = 1",
    [categoriaId]
  );
  if (!cats.length || !cats[0].pagina_listado) {
    throw new Error("Categoría sin página de listado");
  }
  return quitarCajitaEnArchivo(cats[0].pagina_listado, paginaHtml);
}

async function publicarGrillaCategoria(categoriaId) {
  const [cats] = await pool.query(
    "SELECT * FROM categorias_catalogo WHERE id = ? AND activo = 1",
    [categoriaId]
  );
  if (!cats.length) throw new Error("Categoría no encontrada");
  const cat = cats[0];
  if (!cat.pagina_listado) {
    throw new Error(`La categoría "${cat.nombre}" no tiene pagina_listado (ej. colgantes.html)`);
  }

  const [productos] = await pool.query(
    `SELECT * FROM productos_catalogo
     WHERE categoria_id = ? AND activo = 1 AND publicado = 1
     ORDER BY orden ASC, id ASC`,
    [categoriaId]
  );

  const gridInner = generarHtmlGrilla(productos);
  const filePath = path.join(SITE_ROOT, cat.pagina_listado);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe ${cat.pagina_listado}`);
  }

  let html = fs.readFileSync(filePath, "utf8");
  if (/data-catalogo-dinamico/i.test(html)) {
    return {
      archivo: cat.pagina_listado,
      productos: productos.length,
      modo: "dinamico",
      mensaje:
        "Grilla dinámica: la web lee productos publicados desde la API (no se pisa el HTML)."
    };
  }

  const re = /(<section class="filas-imagenes cat-catalog-grid">)[\s\S]*?(<\/section>)/i;
  if (!re.test(html)) {
    throw new Error(`No se encontró cat-catalog-grid en ${cat.pagina_listado}`);
  }
  html = html.replace(re, `$1\n${gridInner}\n            $2`);
  fs.writeFileSync(filePath, html, "utf8");

  return { archivo: cat.pagina_listado, productos: productos.length, modo: "estatico" };
}

async function publicarProductoEnWeb(productoId, productoPre) {
  const p = productoPre || (await cargarProducto(productoId));
  if (!p) throw new Error("Producto no encontrado");

  const visible = Number(p.activo) === 1 && Number(p.publicado) === 1;
  const slug = p.slug || "";
  const { urlProductoPublico } = require("./catalogo-publico");

  return {
    modo: "catalogo_dinamico",
    visible,
    ficha_url: slug ? urlProductoPublico(slug) : null,
    mensaje: visible
      ? "Guardado en base de datos. Visible en el sitio (API / grilla dinámica /p/slug)."
      : "Guardado. Producto oculto o dado de baja (no aparece en la web pública)."
  };
}

async function publicarTodasLasCategorias() {
  const [cats] = await pool.query("SELECT id FROM categorias_catalogo WHERE activo = 1");
  const out = [];
  for (const c of cats) {
    try {
      out.push({ categoria_id: c.id, ...(await publicarGrillaCategoria(c.id)) });
    } catch (e) {
      out.push({ categoria_id: c.id, error: e.message });
    }
  }
  return out;
}

module.exports = {
  publicarFichaProducto,
  publicarCajitaProducto,
  quitarCajitaProducto,
  publicarGrillaCategoria,
  publicarProductoEnWeb,
  publicarTodasLasCategorias,
  SITE_ROOT
};
