/**

 * Genera sitemap.xml solo con páginas principales + categorías (sin fichas de producto).

 * Uso: node scripts/generar-sitemap.js

 */

const fs = require("fs");

const path = require("path");



const BASE = "https://electricidadituartesur.com.ar";

const root = path.join(__dirname, "..");



/** Páginas que queremos en Google (whitelist). */

const SITEMAP_PAGES = [

  { file: "index.html", priority: "1.0", changefreq: "weekly" },

  { file: "contacto.html", priority: "0.9", changefreq: "monthly" },

  { file: "conócenos.html", priority: "0.9", changefreq: "monthly" },

  { file: "productos.html", priority: "0.9", changefreq: "weekly" },

  { file: "catalogo.html", priority: "0.9", changefreq: "weekly" },

  { file: "proyectos.html", priority: "0.9", changefreq: "monthly" },

  // Categorías (desde productos.html)

  { file: "apliques.html", priority: "0.8", changefreq: "monthly" },

  { file: "colgantes.html", priority: "0.8", changefreq: "monthly" },

  { file: "veladores.html", priority: "0.8", changefreq: "monthly" },

  { file: "plafones.html", priority: "0.8", changefreq: "monthly" },

  { file: "espejos.html", priority: "0.8", changefreq: "monthly" },

  { file: "lamparasdepie.html", priority: "0.8", changefreq: "monthly" },

  { file: "bifocales.html", priority: "0.8", changefreq: "monthly" },

  { file: "unifocales.html", priority: "0.8", changefreq: "monthly" },

  { file: "farolas.html", priority: "0.8", changefreq: "monthly" },

  { file: "estacas.html", priority: "0.8", changefreq: "monthly" },

  { file: "tortugas.html", priority: "0.8", changefreq: "monthly" },

  { file: "reflectores.html", priority: "0.8", changefreq: "monthly" },

  { file: "pileta.html", priority: "0.8", changefreq: "monthly" },

  { file: "solares.html", priority: "0.8", changefreq: "monthly" },

  { file: "paneles.html", priority: "0.8", changefreq: "monthly" },

  { file: "smart.html", priority: "0.8", changefreq: "monthly" },

  { file: "alumbradopublico.html", priority: "0.8", changefreq: "monthly" },

  { file: "ventiladores.html", priority: "0.8", changefreq: "monthly" },

  { file: "camaras.html", priority: "0.8", changefreq: "monthly" },

];



const today = new Date().toISOString().slice(0, 10);



const urls = [];

for (const entry of SITEMAP_PAGES) {

  const full = path.join(root, entry.file);

  if (!fs.existsSync(full)) {

    console.warn(`AVISO: no existe ${entry.file}, se omite del sitemap.`);

    continue;

  }

  const loc =

    entry.file === "index.html"

      ? `${BASE}/`

      : `${BASE}/${encodeURI(entry.file)}`;

  urls.push({

    loc,

    priority: entry.priority,

    changefreq: entry.changefreq,

  });

}



const body = urls

  .map(

    (u) => `  <url>

    <loc>${u.loc}</loc>

    <lastmod>${today}</lastmod>

    <changefreq>${u.changefreq}</changefreq>

    <priority>${u.priority}</priority>

  </url>`

  )

  .join("\n");



const xml = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${body}

</urlset>

`;



const out = path.join(root, "sitemap.xml");

fs.writeFileSync(out, xml, "utf8");

console.log(`sitemap.xml: ${urls.length} URLs (solo principales + categorías) → ${out}`);


