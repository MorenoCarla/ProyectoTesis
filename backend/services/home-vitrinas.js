const pool = require("../config/db");
const { mapProductoGrilla, urlProductoPublico } = require("./catalogo-publico");

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function esMontaje(src) {
  return /fotomont|foto-?mont|montaje|ambientad/i.test(String(src || ""));
}

function imagenProducto(imagenes, portada) {
  const imgs = Array.isArray(imagenes) ? imagenes : [];
  for (const s of imgs) {
    const t = String(s || "").trim();
    if (t && !esMontaje(t)) return t;
  }
  const p = String(portada || "").trim();
  if (p && !esMontaje(p)) return p;
  return imgs[0] || p || "img/LOGO.png";
}

function imagenAmbiente(imagenes) {
  const imgs = Array.isArray(imagenes) ? imagenes : [];
  for (const s of imgs) {
    const t = String(s || "").trim();
    if (t && esMontaje(t)) return t;
  }
  return null;
}

function mapVitrinaRow(row) {
  const imagenes = parseJson(row.imagenes_json, []);
  const grilla = mapProductoGrilla(row);
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    subtitulo: row.subtitulo || "",
    nombre_grilla: grilla.nombre_grilla,
    categoria: row.categoria_nombre || "",
    url: urlProductoPublico(row.slug),
    imagen_producto: imagenProducto(imagenes, row.imagen_portada),
    imagen_ambiente: imagenAmbiente(imagenes) || grilla.imagen,
    imagen_tarjeta: grilla.imagen,
    home_novedades_lead: row.home_novedades_lead || "",
    home_novedades_banner: row.home_novedades_banner || null,
    home_ideas_lead: row.home_ideas_lead || "",
  };
}

const BASE_SELECT = `
  SELECT p.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug, c.pagina_listado, c.pdf_catalogo
  FROM productos_catalogo p
  INNER JOIN categorias_catalogo c ON c.id = p.categoria_id
  WHERE p.activo = 1 AND p.publicado = 1 AND c.activo = 1
`;

async function listarPorFlag(flagCol, ordenCol, limite = 12) {
  const [rows] = await pool.query(
    `${BASE_SELECT} AND p.${flagCol} = 1
     ORDER BY p.${ordenCol} ASC, p.id DESC
     LIMIT ?`,
    [limite]
  );
  return rows.map(mapVitrinaRow);
}

async function obtenerHomeVitrinas() {
  try {
    let [novedades, ideas_hero, ideas_carrusel, nuevos] = await Promise.all([
      listarPorFlag("home_novedades", "home_novedades_orden", 8),
      listarPorFlag("home_ideas_hero", "home_ideas_hero_orden", 12),
      listarPorFlag("home_ideas", "home_ideas_orden", 16),
      listarPorFlag("home_nuevos", "home_nuevos_orden", 12),
    ]);

    return { novedades, ideas_hero, ideas_carrusel, nuevos, vitrinas_version: 16 };
  } catch (e) {
    if (e.code === "ER_BAD_FIELD_ERROR") {
      try {
        const [novedades, ideas, nuevos] = await Promise.all([
          listarPorFlag("home_novedades", "home_novedades_orden", 8),
          listarPorFlag("home_ideas", "home_ideas_orden", 12),
          listarPorFlag("home_nuevos", "home_nuevos_orden", 12),
        ]);
        return {
          novedades,
          ideas_hero: [],
          ideas_carrusel: ideas,
          nuevos,
          migracion_ideas_dual: true,
        };
      } catch (e2) {
        if (e2.code === "ER_BAD_FIELD_ERROR") {
          return { novedades: [], ideas_hero: [], ideas_carrusel: [], nuevos: [], migracion_pendiente: true };
        }
        throw e2;
      }
    }
    throw e;
  }
}

module.exports = {
  obtenerHomeVitrinas,
  imagenProducto,
  imagenAmbiente,
  esMontaje,
};
