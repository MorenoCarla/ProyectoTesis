/**
 * Añade / actualiza css/ficha-producto-layout.css?v=4 y stylescadaproducto.css?v=4 en fichas.
 * node scripts/enlazar-ficha-layout-css-en-html.js
 */
const fs = require("fs");
const path = require("path");

const SITE_ROOT = path.join(__dirname, "..", "..");
const CSS_V = "4";
const FICHA_LINK = `<link rel="stylesheet" href="css/ficha-producto-layout.css?v=${CSS_V}">`;

const files = fs.readdirSync(SITE_ROOT).filter((f) => f.endsWith(".html"));
let touched = 0;

for (const name of files) {
  const filePath = path.join(SITE_ROOT, name);
  let html = fs.readFileSync(filePath, "utf8");
  if (!html.includes("stylescadaproducto.css")) continue;

  const before = html;
  html = html.replace(
    /href="css\/stylescadaproducto\.css(?:\?v=[^"]*)?"/g,
    `href="css/stylescadaproducto.css?v=${CSS_V}"`
  );
  html = html.replace(
    /href="css\/ficha-producto-layout\.css(?:\?v=[^"]*)?"/g,
    `href="css/ficha-producto-layout.css?v=${CSS_V}"`
  );
  if (!html.includes("ficha-producto-layout.css")) {
    html = html.replace(
      new RegExp(
        `(<link rel="stylesheet" href="css/stylescadaproducto\\.css\\?v=${CSS_V}">)`
      ),
      `$1\n        ${FICHA_LINK}`
    );
  }
  html = html.replace(
    /src="js\/scriptcadaproducto\.js(?:\?v=[^"]*)?"/g,
    `src="js/scriptcadaproducto.js?v=${CSS_V}"`
  );

  if (html !== before) {
    fs.writeFileSync(filePath, html, "utf8");
    touched++;
  }
}

console.log(`Fichas actualizadas: ${touched}`);
