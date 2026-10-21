/**
 * Rutas de PDF por categoría (nombres reales en catalogo/ — ver catalogo/CATALOGO-NOMBRES-PDF.txt).
 */
function normalizarKey(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const PDF_POR_CLAVE = {
  apliques: "catalogo/catalogo-apliques.pdf",
  colgantes: "catalogo/catalogo-colgantes.pdf",
  veladores: "catalogo/catalogo-veladores.pdf",
  plafones: "catalogo/catalogo-plafones.pdf",
  bifocales: "catalogo/catalogo-bifocales.pdf",
  unifocales: "catalogo/catalogo-unifocales.pdf",
  farolas: "catalogo/catalogo-farolas.pdf",
  estacas: "catalogo/catalogo-estacas.pdf",
  tortugas: "catalogo/catalogo-tortugas.pdf",
  reflectores: "catalogo/catalogo-reflectores.pdf",
  "lamparas de pie": "catalogo/catalogo-lamparas-de-pie.pdf",
  "luminaria de pileta": "catalogo/catalogo-luminaria-pileta.pdf",
  "luminaria pileta": "catalogo/catalogo-luminaria-pileta.pdf",
  paneles: "catalogo/catalogo-paneles.pdf",
  smart: "catalogo/catalogo-smart.pdf",
  ventiladores: "catalogo/catalogo-ventiladores.pdf",
  solares: "catalogo/catalogo-solares.pdf",
  espejos: "catalogo/catalogo-espejos.pdf",
  camaras: "catalogo/catalogo-camaras.pdf",
  "alumbrado publico": "catalogo/catalogo-alumbrado-publico.pdf"
};

function pdfCatalogoParaCategoria({ pdf_catalogo, categoria_slug, categoria_nombre }) {
  const explicit = (pdf_catalogo || "").trim();
  if (explicit) return explicit;

  const slugKey = normalizarKey(categoria_slug);
  if (slugKey && PDF_POR_CLAVE[slugKey]) return PDF_POR_CLAVE[slugKey];

  const nomKey = normalizarKey(categoria_nombre);
  if (nomKey && PDF_POR_CLAVE[nomKey]) return PDF_POR_CLAVE[nomKey];

  if (slugKey) return `catalogo/catalogo-${slugKey.replace(/\s+/g, "-")}.pdf`;
  return null;
}

module.exports = { pdfCatalogoParaCategoria, PDF_POR_CLAVE };
