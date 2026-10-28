/**
 * Clases de <body> y data-categoria para fichas (como en los HTML legacy).
 */
function normalizarCategoriaKey(nombre) {
  return String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Valor exacto para data-categoria (selectores CSS en stylescadaproducto.css). */
const CATEGORIA_ATTR_CSS = {
  apliques: "Apliques",
  colgantes: "Colgantes",
  veladores: "Veladores",
  plafones: "Plafones",
  espejos: "Espejos",
  "lamparas de pie": "Lámparas de pie",
  paneles: "Paneles",
  smart: "Smart",
  ventiladores: "Ventiladores",
  bifocales: "Bifocales",
  unifocales: "Unifocales",
  farolas: "Farolas",
  estacas: "Estacas",
  tortugas: "Tortugas",
  reflectores: "Reflectores",
  "luminaria de pileta": "Luminaria de pileta",
  solares: "Solares",
  "alumbrado publico": "Alumbrado público",
  camaras: "Cámaras"
};

const EXTERIOR_BODY_CLASS = {
  bifocales: "producto-exterior",
  unifocales: "producto-exterior producto-unifocal",
  farolas: "producto-exterior producto-farolas",
  estacas: "producto-exterior producto-estacas",
  tortugas: "producto-exterior producto-tortugas",
  reflectores: "producto-exterior producto-reflectores",
  "luminaria de pileta": "producto-exterior producto-piletas",
  solares: "producto-exterior producto-solares",
  "alumbrado publico": "producto-exterior producto-alumbrado",
  camaras: "producto-exterior producto-camaras"
};

function categoriaAtributoCss(nombreCategoria) {
  const key = normalizarCategoriaKey(nombreCategoria);
  return CATEGORIA_ATTR_CSS[key] || String(nombreCategoria || "").trim();
}

function clasesBodyFicha(nombreCategoria) {
  const key = normalizarCategoriaKey(nombreCategoria);
  if (EXTERIOR_BODY_CLASS[key]) return EXTERIOR_BODY_CLASS[key];
  return "fondo-cada-producto";
}

/** Fotomontaje / ambiente — va al final del carrusel. */
function esImagenFotomontajeFicha(src) {
  const s = String(src || "").toLowerCase();
  return /fotomont|foto-?mont|ambientad/.test(s);
}

/**
 * Crudas (y cualquier otra) primero, en el orden del CRM; fotomontajes al final.
 * No usamos "montaje" suelto en el nombre: muchas crudas lo traen y quedaban en el medio.
 */
function ordenarImagenesFicha(imagenes) {
  if (!Array.isArray(imagenes) || imagenes.length < 2) return imagenes || [];
  const crudas = [];
  const fotom = [];
  for (const src of imagenes) {
    if (src && esImagenFotomontajeFicha(src)) fotom.push(src);
    else if (src) crudas.push(src);
  }
  return [...crudas, ...fotom];
}

module.exports = {
  normalizarCategoriaKey,
  categoriaAtributoCss,
  clasesBodyFicha,
  ordenarImagenesFicha,
  esImagenFotomontajeFicha
};
