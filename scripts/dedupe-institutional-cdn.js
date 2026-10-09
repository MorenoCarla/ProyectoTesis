/**
 * Paso 1b: quitar CDN Font Awesome + Google Fonts en páginas que NO son producto.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const CDN_FA =
  /\s*<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome[^"]*">\r?\n/g;
const GOOGLE_FONTS =
  /\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Work\+Sans[^"]*" rel="stylesheet">\r?\n/g;
const INSTITUTIONAL_BLOCK =
  /\s*<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome[^"]*">\r?\n\s*<link rel="stylesheet" href="vendor\/fonts\/work-sans\.css">\r?\n\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Work\+Sans[^"]*" rel="stylesheet">\r?\n/g;
const WORK_SANS =
  /<link rel="stylesheet" href="vendor\/fonts\/work-sans\.css">\s*\n|<link href="vendor\/fonts\/work-sans\.css" rel="stylesheet">\s*\n/g;

function ensureLocalFonts(html, beforeNeedle) {
  const idx = html.indexOf(beforeNeedle);
  if (idx === -1) return html;
  let block = "";
  if (!html.includes("vendor/fonts/work-sans.css")) {
    block += '  <link rel="stylesheet" href="vendor/fonts/work-sans.css">\n';
  }
  if (!html.includes("vendor/fontawesome/css/all.min.css")) {
    block += '  <link rel="stylesheet" href="vendor/fontawesome/css/all.min.css">\n';
  }
  if (!block) return html;
  return html.slice(0, idx) + block + html.slice(idx);
}

function fixHead(html) {
  if (!html.includes("cdnjs.cloudflare") && !html.includes("fonts.googleapis.com")) {
    return html;
  }
  if (html.includes("scriptcadaproducto.js")) return html;

  html = html.replace(INSTITUTIONAL_BLOCK, "\n");
  html = html.replace(CDN_FA, "\n");
  html = html.replace(GOOGLE_FONTS, "\n");

  html = html.replace(
    /(<meta charset="UTF-8">\r?\n)\s*<link rel="stylesheet" href="vendor\/fonts\/work-sans\.css">\r?\n(?=\s*<meta name="viewport")/,
    "$1"
  );

  let firstWorkSans = false;
  html = html.replace(WORK_SANS, (m) => {
    if (firstWorkSans) return "";
    firstWorkSans = true;
    return '  <link rel="stylesheet" href="vendor/fonts/work-sans.css">\n';
  });

  html = html.replace(
    /(<link rel="stylesheet" href="vendor\/fontawesome\/css\/all\.min\.css">\s*\n)(?=[\s\S]*<link rel="stylesheet" href="vendor\/fontawesome\/css\/all\.min\.css">)/,
    ""
  );

  if (html.includes('href="css/crm.css"')) {
    html = ensureLocalFonts(html, '<link rel="stylesheet" href="css/crm.css">');
  } else if (html.includes("<style>")) {
    html = ensureLocalFonts(html, "<style>");
  } else if (html.includes('href="css/site-chrome.css"')) {
    html = ensureLocalFonts(html, '<link rel="stylesheet" href="css/site-chrome.css">');
  }

  if (!html.includes("vendor/fontawesome/css/all.min.css") && html.includes("vendor/fonts/work-sans.css")) {
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
  const next = fixHead(html);
  if (next !== html) {
    fs.writeFileSync(filePath, next, "utf8");
    updated++;
  }
}

console.log(`Páginas institucionales/CRM actualizadas: ${updated}`);
