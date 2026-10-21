/**
 * Convierte páginas de categoría a grilla dinámica (API + CRM).
 * node backend/scripts/activar-grilla-dinamica-en-categorias.js
 */
const fs = require("fs");
const path = require("path");
const { SITE_ROOT } = require("../config/site-root");

const LISTADOS = [
  "apliques.html",
  "colgantes.html",
  "veladores.html",
  "plafones.html",
  "bifocales.html",
  "unifocales.html",
  "farolas.html",
  "estacas.html",
  "tortugas.html",
  "reflectores.html",
  "pileta.html",
  "solares.html",
  "paneles.html",
  "smart.html",
  "alumbradopublico.html",
  "ventiladores.html",
  "camaras.html",
  "espejos.html",
  "lamparasdepie.html"
];

const GRID_RE =
  /<section class="filas-imagenes cat-catalog-grid">[\s\S]*?<\/section>/i;

const GRID_NUEVO = (listado) => `<section class="filas-imagenes cat-catalog-grid" data-catalogo-dinamico data-catalogo-listado="${listado}">
                <p class="catalogo-grilla-cargando">Cargando productos…</p>
            </section>`;

const SCRIPT_TAG = `<script src="js/catalogo-publico.js?v=1" defer></script>`;

for (const listado of LISTADOS) {
  const filePath = path.join(SITE_ROOT, listado);
  if (!fs.existsSync(filePath)) {
    console.warn("Skip (no existe):", listado);
    continue;
  }
  let html = fs.readFileSync(filePath, "utf8");
  if (!GRID_RE.test(html)) {
    console.warn("Skip (sin grilla):", listado);
    continue;
  }
  html = html.replace(GRID_RE, GRID_NUEVO(listado));
  if (!html.includes("catalogo-publico.js")) {
    html = html.replace(/<\/head>/i, `  ${SCRIPT_TAG}\n</head>`);
  }
  fs.writeFileSync(filePath, html, "utf8");
  console.log("OK:", listado);
}

console.log("Listo. Reiniciá el backend y recargá las categorías con Ctrl+Shift+R.");
