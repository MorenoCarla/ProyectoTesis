/**
 * Migra el header viejo al site-header (igual que Home) en páginas de producto.
 * Ejecutar: node scripts/migrate-product-header.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const SITE_HEADER = `        <header class="site-header">
            <a href="index.html" class="site-logo">
                <img src="img/LOGO.png" alt="Electricidad Ituarte">
            </a>
            <button type="button" class="site-nav-toggle" aria-label="Abrir menú" aria-expanded="false">
                <i class="fa fa-bars" aria-hidden="true"></i>
            </button>
            <nav class="site-nav">
                <a href="index.html">Home</a>
                <a href="conócenos.html">Conócenos</a>
                <a href="productos.html" class="active">Productos</a>
                <a href="catalogo.html">Catálogo</a>
                <a href="contacto.html">Contacto</a>
                <a href="login.html">Acceso CRM</a>
                <a href="registro.html">Registrarse</a>
                <a href="https://www.instagram.com/electricidadituarte.sur?" target="_blank" class="nav-instagram" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            </nav>
        </header>`;

const OLD_HEADER_RE = /<header>\s*<div class="logo">[\s\S]*?<\/header>/i;

let updated = 0;
let skipped = 0;

for (const file of fs.readdirSync(root)) {
  if (!file.endsWith(".html")) continue;
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, "utf8");

  if (!html.includes("stylescadaproducto.css")) continue;
  if (html.includes('class="site-header"')) {
    skipped++;
    continue;
  }
  if (!html.includes('class="logo"') && !OLD_HEADER_RE.test(html)) {
    console.log("SKIP (sin header viejo):", file);
    skipped++;
    continue;
  }

  html = html.replace(OLD_HEADER_RE, SITE_HEADER);

  if (!html.includes("site-chrome.js")) {
    if (html.includes('script src="js/scriptcadaproducto.js" defer')) {
      html = html.replace(
        /(<script src="js\/scriptcadaproducto\.js" defer><\/script>)/,
        '$1\n        <script src="js/site-chrome.js" defer></script>'
      );
    } else if (html.includes("<script src=\"js/scriptcadaproducto.js\">")) {
      html = html.replace(
        /(<script src="js\/scriptcadaproducto\.js"><\/script>)/,
        '$1\n        <script src="js/site-chrome.js" defer></script>'
      );
    } else {
      html = html.replace(
        /(<\/head>)/i,
        '        <script src="js/site-chrome.js" defer></script>\n    $1'
      );
    }
  }

  fs.writeFileSync(filePath, html, "utf8");
  updated++;
}

console.log(`Listo: ${updated} actualizados, ${skipped} omitidos.`);
