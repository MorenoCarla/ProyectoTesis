/**
 * Genera sitemap.xml en la raíz del proyecto.
 * Uso: node scripts/generar-sitemap.js
 */
const fs = require("fs");
const path = require("path");

const BASE = "https://electricidadituartesur.com.ar";
const root = path.join(__dirname, "..");

const EXCLUIR =
  /^(login|registro|recuperar|restablecer|cambiar-contrasena|crm|crm-admin|crm-cliente|plantilla)/i;

const PRIORIDAD = [
  { match: /^index\.html$/, priority: "1.0", changefreq: "weekly" },
  { match: /^(productos|catalogo|contacto|conócenos|proyectos)\.html$/i, priority: "0.9", changefreq: "weekly" },
  { match: /(apliques|colgantes|veladores|plafones|catalogo)\.html$/i, priority: "0.8", changefreq: "monthly" },
];

function meta(file) {
  for (const p of PRIORIDAD) {
    if (p.match.test(file)) return p;
  }
  return { priority: "0.6", changefreq: "monthly" };
}

const files = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".html") && !EXCLUIR.test(f))
  .sort();

const urls = files.map((f) => {
  const loc = f === "index.html" ? `${BASE}/` : `${BASE}/${encodeURI(f)}`;
  const m = meta(f);
  return { loc, priority: m.priority, changefreq: m.changefreq };
});

const today = new Date().toISOString().slice(0, 10);
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
console.log(`sitemap.xml: ${urls.length} URLs → ${out}`);
