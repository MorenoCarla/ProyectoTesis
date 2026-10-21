/**
 * Lista PDF de categoría esperados vs archivos en catalogo/
 * node scripts/verificar-pdfs-catalogo.js
 */
const fs = require("fs");
const path = require("path");
const { SITE_ROOT } = require("../config/site-root");
const { PDF_POR_CLAVE } = require("../services/pdf-catalogo-categoria");

const dir = path.join(SITE_ROOT, "catalogo");
const unicos = [...new Set(Object.values(PDF_POR_CLAVE))].sort();

console.log("\n=== PDFs de catálogo (carpeta catalogo/) ===\n");
console.log("Ruta:", dir, "\n");

let ok = 0;
let falta = 0;
for (const rel of unicos) {
  const base = path.basename(rel);
  const abs = path.join(SITE_ROOT, rel.replace(/\//g, path.sep));
  const existe = fs.existsSync(abs);
  if (existe) {
    const mb = (fs.statSync(abs).size / (1024 * 1024)).toFixed(1);
    console.log(`  OK   ${base}  (${mb} MB)`);
    ok++;
  } else {
    console.log(`  FALTA   ${base}`);
    falta++;
  }
}

const general = path.join(dir, "catalogo-ituarte-2025.pdf");
if (fs.existsSync(general)) {
  console.log(`  OK   catalogo-ituarte-2025.pdf (general)`);
} else {
  console.log(`  FALTA   catalogo-ituarte-2025.pdf (página Catálogo)`);
}

console.log(`\nResumen: ${ok} presentes, ${falta} faltantes de categoría.`);
console.log("Nombres exactos: catalogo/CATALOGO-NOMBRES-PDF.txt\n");
process.exitCode = falta ? 1 : 0;
