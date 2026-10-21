/**
 * Lee las fichas HTML del sitio y las carga en categorias_catalogo / productos_catalogo.
 *
 * Requisito: ejecutar antes migrate-catalogo-productos.sql en MySQL.
 *
 *   cd backend
 *   node scripts/importar-productos-desde-html.js
 *
 * Opcional: --dry-run  (solo muestra conteos, no escribe en la BD)
 */
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const ROOT = path.join(__dirname, "..", "..");
const DRY_RUN = process.argv.includes("--dry-run");

const EXCLUIR_ARCHIVOS = new Set([
  "plantilla-producto.html",
  "plantilla-colgante.html",
  "index.html",
  "productos.html",
  "contacto.html",
  "login.html",
  "registro.html",
  "crm-admin.html",
  "crm-cliente.html",
  "recuperar-contrasena.html",
  "cambiar-contrasena.html",
  "catalogo.html",
  "conócenos.html",
  "conocenos.html"
]);

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function extraerAtributo(html, attr) {
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function extraerBloqueSwiper(html) {
  const m = html.match(/<div class="swiper swiper-producto">([\s\S]*?)<\/div>\s*<\/div>/i);
  return m ? m[1] : "";
}

function extraerImagenes(html) {
  const bloque = extraerBloqueSwiper(html);
  const srcs = [];
  const re = /src="(img\/[^"]+)"/gi;
  let match;
  const texto = bloque || html;
  while ((match = re.exec(texto)) !== null) {
    if (!srcs.includes(match[1])) srcs.push(match[1]);
  }
  return srcs;
}

function extraerCodigos(html) {
  const codigos = [];
  const re = /class="codigo(?:color|blanco)"[^>]*>([^<]+)</gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const c = match[1].trim();
    if (!c || c.toLowerCase() === "xxxx") continue;
    if (!codigos.includes(c)) codigos.push(c);
  }
  return codigos;
}

function parsearFicha(archivo, html) {
  const nombre = extraerAtributo(html, "data-producto");
  const categoria = extraerAtributo(html, "data-categoria");
  if (!nombre || !categoria) return null;

  const slug = path.basename(archivo, ".html");
  const subtitulo = (html.match(/<p class="subtitulo">([^<]*)</i) || [])[1]?.trim() || null;
  const caracteristicas = (html.match(/<div class="caracteristicas">\s*([\s\S]*?)<\/div>/i) || [])[1];
  const descHtml = (html.match(/<p class="textodescripcion">([\s\S]*?)<\/p>/i) || [])[1]?.trim() || null;
  const volver = (html.match(/class="btn-volver"[^>]*href="([^"]+)"/i) || [])[1]?.trim() || null;

  return {
    slug,
    pagina_html: archivo,
    nombre,
    categoria,
    subtitulo,
    caracteristicas: caracteristicas ? stripHtml(caracteristicas) : null,
    descripcion_html: descHtml,
    descripcion_texto: descHtml ? stripHtml(descHtml) : null,
    codigos: extraerCodigos(html),
    imagenes: extraerImagenes(html),
    pagina_categoria: volver
  };
}

async function upsertCategoria(conn, nombre, paginaListado) {
  const slug = slugify(nombre);
  const [rows] = await conn.query(
    "SELECT id FROM categorias_catalogo WHERE nombre = ? OR slug = ? LIMIT 1",
    [nombre, slug]
  );
  if (rows.length) {
    if (paginaListado) {
      await conn.query(
        "UPDATE categorias_catalogo SET pagina_listado = COALESCE(NULLIF(pagina_listado, ''), ?) WHERE id = ?",
        [paginaListado, rows[0].id]
      );
    }
    return rows[0].id;
  }
  const [ins] = await conn.query(
    "INSERT INTO categorias_catalogo (nombre, slug, pagina_listado) VALUES (?, ?, ?)",
    [nombre, slug, paginaListado]
  );
  return ins.insertId;
}

function nombreGrillaDesdeSlug(slug) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

async function upsertProducto(conn, categoriaId, p) {
  const nombreGrilla = nombreGrillaDesdeSlug(p.slug);
  const imagenPortada = p.imagenes && p.imagenes[0] ? p.imagenes[0] : null;
  const payload = [
    categoriaId,
    p.nombre,
    nombreGrilla,
    p.slug,
    p.pagina_html,
    p.subtitulo,
    p.caracteristicas,
    p.descripcion_html,
    p.descripcion_texto,
    JSON.stringify(p.codigos),
    JSON.stringify(p.imagenes),
    imagenPortada,
    p.pagina_categoria,
    1,
    1
  ];

  await conn.query(
    `INSERT INTO productos_catalogo (
      categoria_id, nombre, nombre_grilla, slug, pagina_html, subtitulo, caracteristicas,
      descripcion_html, descripcion_texto, codigos_json, imagenes_json, imagen_portada,
      pagina_categoria, publicado, activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      categoria_id = VALUES(categoria_id),
      nombre = VALUES(nombre),
      nombre_grilla = COALESCE(VALUES(nombre_grilla), nombre_grilla),
      subtitulo = VALUES(subtitulo),
      caracteristicas = VALUES(caracteristicas),
      descripcion_html = VALUES(descripcion_html),
      descripcion_texto = VALUES(descripcion_texto),
      codigos_json = VALUES(codigos_json),
      imagenes_json = VALUES(imagenes_json),
      imagen_portada = COALESCE(VALUES(imagen_portada), imagen_portada),
      pagina_categoria = VALUES(pagina_categoria),
      actualizado_en = CURRENT_TIMESTAMP`,
    payload
  );
}

async function main() {
  const archivos = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".html") && !EXCLUIR_ARCHIVOS.has(f));

  const fichas = [];
  const omitidos = [];

  for (const archivo of archivos) {
    const html = fs.readFileSync(path.join(ROOT, archivo), "utf8");
    if (!html.includes("data-producto=")) {
      omitidos.push(archivo);
      continue;
    }
    const parsed = parsearFicha(archivo, html);
    if (!parsed) {
      omitidos.push(archivo);
      continue;
    }
    fichas.push(parsed);
  }

  console.log("Fichas detectadas:", fichas.length);
  console.log("HTML omitidos (sin data-producto):", omitidos.length);

  if (DRY_RUN) {
    console.log("--dry-run: no se escribió en la base.");
    process.exit(0);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const p of fichas) {
      const catId = await upsertCategoria(conn, p.categoria, p.pagina_categoria);
      await upsertProducto(conn, catId, p);
    }
    await conn.commit();
    console.log("Importación OK:", fichas.length, "productos.");
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.error("\nEjecutá primero: backend/database/migrate-catalogo-productos.sql");
    }
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
