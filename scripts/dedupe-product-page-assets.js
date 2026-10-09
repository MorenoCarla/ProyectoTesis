/**
 * Paso 1 rendimiento: una sola fuente local de Work Sans + Font Awesome
 * en páginas que usan scriptcadaproducto.js (sin cambiar estética).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const CDN_FA =
  /\s*<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome[^"]*">\r?\n/g;
const GOOGLE_FONTS =
  /\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Work\+Sans[^"]*" rel="stylesheet">\r?\n/g;
const WORK_SANS =
  /<link rel="stylesheet" href="vendor\/fonts\/work-sans\.css">\s*\n|<link href="vendor\/fonts\/work-sans\.css" rel="stylesheet">\s*\n/g;

function fixProductHead(html) {
  html = html.replace(CDN_FA, "\n");
  html = html.replace(GOOGLE_FONTS, "\n");
  html = html.replace(
    /\s*<link rel="stylesheet" href="vendor\/fontawesome\/css\/all\.min\.css">\r?\n\s*<link href="vendor\/fonts\/work-sans\.css" rel="stylesheet">\r?\n(?=\s*<\/head>)/,
    "\n"
  );
  html = html.replace(
    /\s*<link rel="stylesheet" href="vendor\/fontawesome\/css\/all\.min\.css">\r?\n(?=\s*<\/head>)/,
    "\n"
  );
  html = html.replace(
    /\s*<link href="vendor\/fonts\/work-sans\.css" rel="stylesheet">\r?\n(?=\s*<\/head>)/,
    "\n"
  );

  let firstWorkSans = false;
  html = html.replace(WORK_SANS, (m) => {
    if (firstWorkSans) return "";
    firstWorkSans = true;
    return '  <link rel="stylesheet" href="vendor/fonts/work-sans.css">\n';
  });

  if (!html.includes("vendor/fontawesome/css/all.min.css")) {
    html = html.replace(
      /(<link rel="stylesheet" href="vendor\/fonts\/work-sans\.css">\n)/,
      `$1  <link rel="stylesheet" href="vendor/fontawesome/css/all.min.css">\n`
    );
  }

  return html;
}

let updated = 0;
for (const name of fs.readdirSync(root)) {
  if (!name.endsWith(".html")) continue;
  const filePath = path.join(root, name);
  const html = fs.readFileSync(filePath, "utf8");
  if (!html.includes("scriptcadaproducto.js")) continue;
  const next = fixProductHead(html);
  if (next !== html) {
    fs.writeFileSync(filePath, next, "utf8");
    updated++;
  }
}

console.log(`Páginas de producto actualizadas: ${updated}`);
