/**
 * Migra páginas de categoría (stylesapliques.css) al header/footer site-chrome.
 * Ejecutar una vez: node scripts/migrate-category-chrome.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const files = [
  "apliques.html", "colgantes.html", "veladores.html", "plafones.html",
  "lamparasdepie.html", "espejos.html", "bifocales.html", "unifocales.html",
  "farolas.html", "estacas.html", "tortugas.html", "reflectores.html",
  "pileta.html", "solares.html", "paneles.html", "smart.html",
  "alumbradopublico.html", "ventiladores.html", "camaras.html"
];

const SITE_HEADER = `  <header class="site-header">
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
      <a href="https://www.instagram.com/electricidadituarte.sur?" target="_blank" class="nav-instagram" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
    </nav>
  </header>`;

const FOOTER = `  <footer class="site-footer">
    <div class="site-footer-grid">
      <div>
        <h3>Electricidad Ituarte</h3>
        <p>Más de 50 años iluminando proyectos en Tucumán.</p>
        <div class="site-footer-social">
          <a href="https://www.instagram.com/electricidadituarte.sur?" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="https://www.facebook.com/share/19tbHw23mm/?" target="_blank" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
          <a href="https://www.tiktok.com/@ituarte.electricidad?" target="_blank" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
        </div>
      </div>
      <div class="site-footer-links">
        <h3>Navegación</h3>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="conócenos.html">Conócenos</a></li>
          <li><a href="productos.html">Productos</a></li>
          <li><a href="catalogo.html">Catálogo</a></li>
          <li><a href="contacto.html">Contacto</a></li>
          <li><a href="registro.html">Registrarse</a></li>
        </ul>
      </div>
      <div>
        <h3>Horarios de atención</h3>
        <ul>
          <li>Lunes a viernes: 8:30 a 12:30 hs / 16:30 a 20:30 hs</li>
          <li>Sábados: 8:30 a 13:00 hs</li>
        </ul>
      </div>
    </div>
    <p class="site-footer-copy">© Electricidad Ituarte — Concepción &amp; J. B. Alberdi, Tucumán</p>
  </footer>

  <button type="button" class="scroll-top" id="scroll-top" aria-label="Volver arriba">↑</button>
  <a href="https://wa.me/5493865601388" class="whatsapp-float" target="_blank" aria-label="WhatsApp">
    <i class="fab fa-whatsapp"></i>
  </a>`;

function buildHead(title) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="css/site-chrome.css">
  <link rel="stylesheet" href="css/stylesapliques.css">
  <script src="js/site-chrome.js" defer></script>
  <script src="js/scriptapliques.js" defer></script>
</head>`;
}

function migrate(file) {
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, "utf8");

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : file.replace(".html", "");

  const bodyMatch = html.match(/<body\s+class="([^"]+)"/i);
  if (!bodyMatch) {
    console.warn("Skip (no body class):", file);
    return;
  }
  let bodyClass = bodyMatch[1];
  if (!bodyClass.includes("pagina-categoria")) {
    bodyClass = `pagina-institucional pagina-categoria ${bodyClass}`;
  }

  const h1Match = html.match(/<h1\s+class="(titulo[^"]*)"\s*>([\s\S]*?)<\/h1>/i);
  if (!h1Match) {
    console.warn("Skip (no h1):", file);
    return;
  }
  const titleInner = h1Match[2].trim();

  const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    console.warn("Skip (no main):", file);
    return;
  }
  let mainContent = mainMatch[1];

  mainContent = mainContent.replace(/<h1\s+class="titulo[^"]*"\s*>[\s\S]*?<\/h1>\s*/i, "");
  mainContent = mainContent.replace(/<div\s+class="mensaje-no-encontrado"[^>]*>[\s\S]*?<\/div>\s*/i, "");
  mainContent = mainContent.replace(/<section\s+class="filas-imagenes"/i, '<section class="filas-imagenes cat-catalog-grid"');
  mainContent = mainContent.trim();

  const hero = `${SITE_HEADER}

  <section class="cat-catalog-hero">
    <div class="container">
      <a href="productos.html" class="cat-back-link"><i class="fa fa-arrow-left" aria-hidden="true"></i> Volver a categorías</a>
      <h1 class="cat-catalog-title">${titleInner}</h1>
      <div class="buscador cat-catalog-search">
        <input type="text" id="busqueda" placeholder="Buscar por nombre o código..." autocomplete="off">
        <button type="button" class="buscador-btn" aria-label="Buscar"><i class="fa fa-search"></i></button>
      </div>
    </div>
  </section>

  <main class="cat-catalog-main">
    <div class="container">
      <div class="mensaje-no-encontrado" style="display: none;">Producto no encontrado😢 Intenta nuevamente con otro nombre o código.</div>
${mainContent}
    </div>
  </main>

${FOOTER}
</body>
</html>`;

  const out = `${buildHead(title)}
<body class="${bodyClass}">
${hero}`;

  fs.writeFileSync(filePath, out, "utf8");
  console.log("OK:", file);
}

files.forEach(migrate);
