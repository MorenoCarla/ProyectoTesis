/**
 * Convierte <button class="boton-descargas">Catálogo …</button>
 * en <a href="catalogo/catalogo-….pdf"> (no depende de JS en producción).
 *
 * Uso: node scripts/enlazar-botones-catalogo-en-html.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const ARCHIVO_POR_CATEGORIA = {
  "Luminaria de Pileta": "catalogo/catalogo-luminaria-pileta.pdf",
};

function slugCatalogo(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function urlPdf(categoria) {
  if (ARCHIVO_POR_CATEGORIA[categoria]) return ARCHIVO_POR_CATEGORIA[categoria];
  return "catalogo/catalogo-" + slugCatalogo(categoria) + ".pdf";
}

const BUTTON_RE =
  /<button(\s+class="boton-descargas"|\s+class='boton-descargas')(\s[^>]*)?>\s*(Catálogo\s+[^<]+?)\s*<\/button>/gi;

function procesarArchivo(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  if (!html.includes("boton-descargas")) return { changed: false };

  const nuevo = html.replace(BUTTON_RE, (_m, _cls, _extra, labelRaw) => {
    const label = labelRaw.trim();
    const categoria = label.replace(/^Catálogo\s+/i, "").trim();
    const href = urlPdf(categoria);
    return `<a class="boton-descargas" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  if (nuevo === html) return { changed: false };
  fs.writeFileSync(filePath, nuevo, "utf8");
  return { changed: true };
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "backend" || name === ".git") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
}

const files = [];
walk(ROOT, files);

let changed = 0;
for (const f of files) {
  const r = procesarArchivo(f);
  if (r.changed) {
    changed++;
    console.log("OK", path.relative(ROOT, f));
  }
}

console.log("\nArchivos actualizados:", changed);
