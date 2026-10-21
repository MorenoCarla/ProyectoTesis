/**
 * Auditoría de catálogo publicado (web + CRM).
 * node backend/scripts/auditar-catalogo-publico.js
 * node backend/scripts/auditar-catalogo-publico.js --strict   (también cuenta advertencias para exit code)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { SITE_ROOT } = require("../config/site-root");
const { ordenarImagenesFicha } = require("../services/ficha-producto-tema");
const { pdfCatalogoParaCategoria } = require("../services/pdf-catalogo-categoria");

const STRICT = process.argv.includes("--strict");
const DESC_MIN = 25;

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textoDescripcion(row) {
  return stripHtml(row.descripcion_texto || row.descripcion_html || "");
}

function imagenesDesordenadas(imagenes) {
  const raw = Array.isArray(imagenes) ? imagenes.filter(Boolean) : [];
  if (raw.length < 2) return false;
  const sorted = ordenarImagenesFicha(raw);
  return sorted.some((s, i) => s !== raw[i]);
}

function archivoExisteEnSitio(ruta) {
  let rel = String(ruta || "").trim().replace(/^\//, "");
  if (!rel || /^https?:\/\//i.test(rel)) return true;
  try {
    rel = decodeURIComponent(rel);
  } catch (_) {}
  const abs = path.join(SITE_ROOT, rel);
  if (fs.existsSync(abs)) return true;
  if (rel !== String(ruta || "").trim().replace(/^\//, "")) {
    return fs.existsSync(path.join(SITE_ROOT, String(ruta || "").trim().replace(/^\//, "")));
  }
  return false;
}

function esDescripcionPlaceholder(texto) {
  const t = texto.toLowerCase();
  if (!t) return false;
  if (/^(x+|w+|\.+|\-+|n\/a|test|prueba)\b/i.test(t)) return true;
  if (/(.)\1{8,}/.test(t)) return true;
  if (t.length >= 20 && /^(w|\.){15,}/.test(t.replace(/\s/g, ""))) return true;
  return false;
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

function pdfEsperado(row) {
  return pdfCatalogoParaCategoria({
    pdf_catalogo: row.pdf_catalogo,
    categoria_slug: row.categoria_slug,
    categoria_nombre: row.categoria
  });
}

function auditarProducto(r) {
  const imgs = parseJson(r.imagenes_json, []).map((s) => String(s || "").trim()).filter(Boolean);
  const desc = textoDescripcion(r);
  const carac = partesCaracteristicas(r.caracteristicas_json || r.caracteristicas);
  const colores = parseJson(r.colores_json, []);
  const sinColores = !!r.sin_colores;
  const critico = [];
  const advertencia = [];

  const slug = (r.slug || "").trim();
  if (!slug) critico.push("sin slug");
  else if (!/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug)) {
    advertencia.push("slug con caracteres raros (revisar URL /p/" + slug + ")");
  }

  if (!imgs.length) critico.push("sin imágenes en ficha");
  if (!r.pagina_listado) critico.push("categoría sin pagina_listado (grilla rota)");
  if (!(r.nombre_grilla || "").trim()) advertencia.push("sin nombre en grilla");

  if (!desc) critico.push("sin descripción");
  else {
    if (desc.length < DESC_MIN) advertencia.push(`descripción muy corta (${desc.length} caracteres)`);
    if (esDescripcionPlaceholder(desc)) advertencia.push("descripción parece placeholder (texto de prueba)");
  }

  if (!(r.subtitulo || "").trim()) advertencia.push("sin subtítulo (ej. LUMINARIA DE INTERIOR)");
  if (!carac.length) advertencia.push("sin características técnicas");

  if (imgs.length === 1) advertencia.push("solo 1 imagen (convienen 2: cruda + fotomontaje)");
  if (imgs.length >= 2 && imagenesDesordenadas(imgs)) {
    advertencia.push("orden de imágenes: fotomontaje antes que cruda");
  }

  const imgsRotas = imgs.filter((src) => !archivoExisteEnSitio(src));
  if (imgs.length && imgsRotas.length === imgs.length) {
    critico.push("ninguna imagen de ficha existe en disco");
  } else if (imgsRotas.length) {
    advertencia.push(`${imgsRotas.length} imagen(es) no encontrada(s) en disco`);
  }

  const portada = (r.imagen_portada || "").trim();
  if (!portada && imgs.length) advertencia.push("sin imagen de portada (miniatura grilla)");
  else if (portada && !archivoExisteEnSitio(portada)) {
    advertencia.push("imagen de portada no existe en disco");
  }

  if (!sinColores && !colores.length && !parseJson(r.codigos_json, []).length) {
    advertencia.push("sin códigos/colores (marcar «sin colores» si aplica)");
  }

  const pdf = pdfEsperado(r);
  if (pdf && !archivoExisteEnSitio(pdf)) {
    advertencia.push(`PDF de catálogo no encontrado (${pdf})`);
  }

  return { critico, advertencia };
}

async function main() {
  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug, c.pagina_listado
     FROM productos_catalogo p
     INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
     WHERE p.activo = 1 AND p.publicado = 1
     ORDER BY c.nombre, p.orden, p.id`
  );

  const [borradores] = await pool.query(
    `SELECT COUNT(*) AS n FROM productos_catalogo WHERE activo = 1 AND publicado = 0`
  );

  const slugCount = {};
  for (const r of rows) {
    const s = (r.slug || "").trim().toLowerCase();
    if (s) slugCount[s] = (slugCount[s] || 0) + 1;
  }
  const slugsDup = Object.entries(slugCount).filter(([, n]) => n > 1);

  const informe = [];
  let totalCrit = 0;
  let totalAdv = 0;

  for (const r of rows) {
    const { critico, advertencia } = auditarProducto(r);
    const s = (r.slug || "").trim().toLowerCase();
    if (s && slugCount[s] > 1) critico.push("slug duplicado en BD");
    if (!critico.length && !advertencia.length) continue;
    totalCrit += critico.length;
    totalAdv += advertencia.length;
    informe.push({
      id: r.id,
      slug: r.slug,
      nombre: r.nombre,
      categoria: r.categoria,
      critico,
      advertencia
    });
  }

  console.log("\n=== Auditoría catálogo web (publicados) ===\n");
  console.log(`Productos publicados: ${rows.length}`);
  console.log(`Activos no publicados (borrador/ocultos): ${borradores[0]?.n ?? 0}`);
  if (slugsDup.length) {
    console.log(`Slugs duplicados: ${slugsDup.map(([s, n]) => s + " (×" + n + ")").join(", ")}`);
  }
  console.log(`Productos con observaciones: ${informe.length}`);
  console.log(`  → hallazgos críticos: ${totalCrit}`);
  console.log(`  → advertencias: ${totalAdv}\n`);

  if (!informe.length) {
    console.log("OK — sin observaciones con las reglas actuales.\n");
    await pool.end();
    return;
  }

  for (const i of informe) {
    console.log(`#${i.id}  /p/${i.slug}  —  ${i.nombre}  (${i.categoria})`);
    for (const c of i.critico) console.log(`   [CRÍTICO] ${c}`);
    for (const a of i.advertencia) console.log(`   [aviso] ${a}`);
    console.log("");
  }

  console.log("Tip: corregir en CRM → Catálogo, guardar, Ctrl+F5 en la ficha.\n");

  await pool.end();
  const hayCritico = informe.some((i) => i.critico.length);
  const hayAdv = informe.some((i) => i.advertencia.length);
  if (hayCritico || (STRICT && hayAdv)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
