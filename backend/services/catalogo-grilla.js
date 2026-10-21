/**
 * Parches quirúrgicos en grillas de categoría (cat-catalog-grid):
 * actualizar / insertar / quitar una sola cajita por producto, sin regenerar toda la página.
 */
const fs = require("fs");
const path = require("path");

const { SITE_ROOT } = require("../config/site-root");

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function etiquetaGrillaDesdeNombre(nombre) {
  if (!nombre) return "";
  return String(nombre)
    .trim()
    .replace(/^aplique\s+/i, "")
    .replace(/^colgante\s+/i, "")
    .replace(/^velador\s+/i, "")
    .replace(/^plaf[oó]n\s+/i, "")
    .trim();
}

function imagenEsDeFichaNoGrilla(src) {
  return /crudo|fotomont|negrocrudo|blancocrudo/i.test(String(src || ""));
}

function inferirImagenGrilla(p) {
  const slug = (p.slug || "").trim();
  const candidatos = [];
  if (slug) candidatos.push(`img/${slug}.png`);
  for (const src of parseJson(p.imagenes_json, [])) {
    const s = String(src || "").trim();
    if (s && !imagenEsDeFichaNoGrilla(s)) candidatos.push(s);
  }
  for (const c of candidatos) {
    const abs = path.join(SITE_ROOT, c.replace(/^\//, ""));
    if (fs.existsSync(abs)) return c;
  }
  return candidatos[0] || "img/LOGO.png";
}

/** Datos visibles de la cajita a partir del producto en BD. */
function datosCajitaDesdeProducto(p, overrides) {
  const o = overrides || {};
  const codigos = (p.codigos || parseJson(p.codigos_json, [])).join(", ");
  let nombre =
    o.nombre_grilla != null
      ? String(o.nombre_grilla).trim()
      : p.nombre_grilla != null
        ? String(p.nombre_grilla).trim()
        : "";
  if (!nombre) nombre = etiquetaGrillaDesdeNombre(p.nombre);
  if (!nombre) nombre = (p.nombre || "").trim();

  let img =
    o.imagen_portada != null
      ? String(o.imagen_portada).trim()
      : (p.imagen_portada || "").trim();
  if (!img || imagenEsDeFichaNoGrilla(img)) img = inferirImagenGrilla(p);

  return {
    href: p.pagina_html,
    nombre,
    codigos,
    img
  };
}

function extraerClasesCajita(bloque) {
  const mImagen = bloque.match(/<div class="imagen\s+([^"]+)"/i);
  const mP = bloque.match(/<p class="(p\d)"/i);
  const idx = mImagen ? mImagen[1].trim() : "1";
  const pClass = mP ? mP[1] : `p${(/^\d+$/.test(idx) ? parseInt(idx, 10) : 1) % 5 || 5}`;
  return { imagen: idx, p: pClass };
}

function generarHtmlCajita(datos, classes) {
  const cls = classes || { imagen: "1", p: "p1" };
  return `<a href="${escapeHtml(datos.href)}" class="link-producto">
                        <div class="imagen ${escapeHtml(cls.imagen)}" data-nombre="${escapeHtml(datos.nombre)}" data-codigo="${escapeHtml(datos.codigos)}">
                            <img src="${escapeHtml(datos.img)}" alt="${escapeHtml(datos.nombre)}">
                            <p class="${escapeHtml(cls.p)}">${escapeHtml(datos.nombre)}</p>
                        </div>
                    </a>`;
}

/** Actualiza solo textos/imagen dentro del bloque existente (conserva espacios y clases). */
function actualizarContenidoCajita(bloque, datos) {
  const nom = escapeHtml(datos.nombre);
  const cod = escapeHtml(datos.codigos);
  const img = escapeHtml(datos.img);
  let out = bloque;
  out = out.replace(/data-nombre="[^"]*"/i, `data-nombre="${nom}"`);
  out = out.replace(/data-codigo="[^"]*"/i, `data-codigo="${cod}"`);
  if (/<img\s+[^>]*src="[^"]*"[^>]*alt="[^"]*"/i.test(out)) {
    out = out.replace(/<img\s+[^>]*src="[^"]*"[^>]*alt="[^"]*"/i, `<img src="${img}" alt="${nom}"`);
  } else {
    out = out.replace(/<img\s+src="[^"]*"/i, `<img src="${img}" alt="${nom}"`);
  }
  out = out.replace(/(<p class="p\d">)[^<]*(<\/p>)/i, `$1${nom}$2`);
  return out;
}

function leerNombreEnBloque(bloque) {
  return (
    (bloque.match(/data-nombre="([^"]*)"/i) || [])[1] ||
    (bloque.match(/<p class="p\d">([^<]*)<\/p>/i) || [])[1] ||
    ""
  ).trim();
}

function normalizarPaginaHtml(paginaHtml) {
  return path.basename(String(paginaHtml || "").trim().replace(/\\/g, "/"));
}

function regexCajita(paginaHtml) {
  const base = escRe(normalizarPaginaHtml(paginaHtml));
  return new RegExp(
    `<a\\s+[^>]*href=["']${base}["'][^>]*class=["']link-producto["'][^>]*>[\\s\\S]*?<\\/a>` +
      `|<a\\s+[^>]*class=["']link-producto["'][^>]*href=["']${base}["'][^>]*>[\\s\\S]*?<\\/a>`,
    "i"
  );
}

function encontrarBloqueCajita(html, paginaHtml) {
  const re = regexCajita(paginaHtml);
  const m = html.match(re);
  return m ? m[0] : null;
}

function leerHtmlListado(paginaListado) {
  const filePath = path.join(SITE_ROOT, paginaListado);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe ${paginaListado}`);
  }
  return { filePath, html: fs.readFileSync(filePath, "utf8") };
}

function asegurarSeccionGrilla(html) {
  const re = /(<section class="filas-imagenes cat-catalog-grid">)([\s\S]*?)(<\/section>)/i;
  if (!re.test(html)) {
    throw new Error("No se encontró cat-catalog-grid en la página de categoría");
  }
  return re;
}

/** Inserta al final de la última fila (o crea fila nueva si ya hay 5 ítems). */
function insertarCajitaEnGrilla(inner, cajitaHtml) {
  const filaRe = /<div class="fila ([^"]+)">([\s\S]*?)<\/div>/gi;
  let lastMatch = null;
  let m;
  while ((m = filaRe.exec(inner)) !== null) {
    lastMatch = m;
  }
  if (!lastMatch) {
    return `                <div class="fila uno">\n                    ${cajitaHtml}\n                </div>`;
  }
  const filaClass = lastMatch[1];
  const filaBody = lastMatch[2];
  const count = (filaBody.match(/class="link-producto"/g) || []).length;
  if (count >= 5) {
    const nombres = [
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
      "quince",
      "extra"
    ];
    const todas = [...inner.matchAll(/<div class="fila /gi)].length;
    const nueva = nombres[todas] || "extra";
    return (
      inner +
      `\n                <div class="fila ${nueva}">\n                    ${cajitaHtml}\n                </div>`
    );
  }
  const nuevaFila = `<div class="fila ${filaClass}">${filaBody}\n                    ${cajitaHtml}\n                </div>`;
  return inner.replace(lastMatch[0], nuevaFila);
}

function limpiarFilasVacias(inner) {
  return inner.replace(/<div class="fila [^"]*">\s*<\/div>/gi, "");
}

function patchCajitaEnHtml(html, paginaHtml, cajitaHtml) {
  const bloque = encontrarBloqueCajita(html, paginaHtml);
  if (bloque) {
    return html.replace(bloque, cajitaHtml);
  }
  const sectionRe = asegurarSeccionGrilla(html);
  return html.replace(sectionRe, (_, open, inner, close) => {
    const nuevoInner = insertarCajitaEnGrilla(inner, cajitaHtml);
    return `${open}\n${nuevoInner}\n            ${close}`;
  });
}

function quitarCajitaEnHtml(html, paginaHtml) {
  const bloque = encontrarBloqueCajita(html, paginaHtml);
  if (!bloque) {
    return { html, removed: false };
  }
  let out = html.replace(bloque, "");
  out = out.replace(
    /(<section class="filas-imagenes cat-catalog-grid">)([\s\S]*?)(<\/section>)/i,
    (_, open, inner, close) => `${open}\n${limpiarFilasVacias(inner)}\n            ${close}`
  );
  return { html: out, removed: true };
}

function publicarCajitaEnArchivo(paginaListado, producto, overrides) {
  const paginaHtml = normalizarPaginaHtml(producto.pagina_html);
  const datos = datosCajitaDesdeProducto(producto, overrides);
  datos.href = paginaHtml;
  const { filePath, html } = leerHtmlListado(paginaListado);
  const bloque = encontrarBloqueCajita(html, paginaHtml);
  let cajitaHtml;
  if (bloque) {
    cajitaHtml = actualizarContenidoCajita(bloque, datos);
    if (cajitaHtml === bloque && leerNombreEnBloque(bloque) !== datos.nombre) {
      cajitaHtml = generarHtmlCajita(datos, extraerClasesCajita(bloque));
    }
  } else {
    cajitaHtml = generarHtmlCajita(datos, { imagen: "1", p: "p1" });
  }

  let nuevo;
  if (bloque) {
    const idx = html.indexOf(bloque);
    if (idx === -1) {
      throw new Error(`No se encontró la cajita de ${paginaHtml} en ${paginaListado}`);
    }
    nuevo = html.slice(0, idx) + cajitaHtml + html.slice(idx + bloque.length);
  } else {
    nuevo = patchCajitaEnHtml(html, paginaHtml, cajitaHtml);
  }

  if (nuevo === html) {
    const prev = bloque ? leerNombreEnBloque(bloque) : "";
    if (prev === datos.nombre) {
      return {
        archivo: paginaListado,
        ruta_absoluta: filePath,
        accion: "cajita_sin_cambios",
        nombre: datos.nombre,
        imagen: datos.img
      };
    }
    throw new Error(
      `No se pudo actualizar la cajita de ${paginaHtml} en ${paginaListado}`
    );
  }

  fs.writeFileSync(filePath, nuevo, "utf8");
  const verificar = fs.readFileSync(filePath, "utf8");
  const bloqueVer = encontrarBloqueCajita(verificar, paginaHtml);
  const nombreEnDisco = bloqueVer ? leerNombreEnBloque(bloqueVer) : "";
  if (nombreEnDisco !== datos.nombre) {
    throw new Error(
      `Se escribió ${paginaListado} pero la cajita sigue mostrando «${nombreEnDisco}» en lugar de «${datos.nombre}» (${filePath})`
    );
  }

  console.log("[catalogo-grilla] Cajita publicada:", filePath, paginaHtml, "→", datos.nombre);
  return {
    archivo: paginaListado,
    ruta_absoluta: filePath,
    accion: bloque ? "cajita_actualizada" : "cajita_insertada",
    nombre: datos.nombre,
    imagen: datos.img
  };
}

function quitarCajitaEnArchivo(paginaListado, paginaHtml) {
  const { filePath, html } = leerHtmlListado(paginaListado);
  const { html: nuevo, removed } = quitarCajitaEnHtml(html, paginaHtml);
  if (removed) fs.writeFileSync(filePath, nuevo, "utf8");
  return { archivo: paginaListado, accion: removed ? "cajita_eliminada" : "sin_cambios" };
}

/** Lee nombre e imagen actuales de la cajita en el HTML (para rellenar BD). */
function leerCajitaDesdeHtml(paginaListado, paginaHtml) {
  try {
    const { html } = leerHtmlListado(paginaListado);
    const bloque = encontrarBloqueCajita(html, paginaHtml);
    if (!bloque) return null;
    const nombre =
      (bloque.match(/data-nombre="([^"]*)"/i) || [])[1] ||
      (bloque.match(/<p class="p\d">([^<]*)</i) || [])[1] ||
      "";
    const img = (bloque.match(/<img src="([^"]+)"/i) || [])[1] || "";
    const codigo = (bloque.match(/data-codigo="([^"]*)"/i) || [])[1] || "";
    return { nombre: nombre.trim(), imagen: img.trim(), codigos: codigo.trim() };
  } catch {
    return null;
  }
}

module.exports = {
  SITE_ROOT,
  datosCajitaDesdeProducto,
  generarHtmlCajita,
  inferirImagenGrilla,
  etiquetaGrillaDesdeNombre,
  imagenEsDeFichaNoGrilla,
  publicarCajitaEnArchivo,
  quitarCajitaEnArchivo,
  leerCajitaDesdeHtml,
  parseJson
};
