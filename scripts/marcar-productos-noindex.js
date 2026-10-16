/**
 * Pone noindex en fichas de producto (scriptcadaproducto.js), no en categorías ni CRM.
 * Uso: node scripts/marcar-productos-noindex.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const META = '<meta name="robots" content="noindex, follow">';

const EXCLUIR =
  /^(login|registro|recuperar|restablecer|cambiar-contrasena|crm|crm-admin|crm-cliente|plantilla|google)/i;

let actualizados = 0;
let yaTenian = 0;

for (const file of fs.readdirSync(root)) {
  if (!file.endsWith(".html") || EXCLUIR.test(file)) continue;

  const full = path.join(root, file);
  let html = fs.readFileSync(full, "utf8");

  if (!html.includes("scriptcadaproducto.js")) continue;

  if (/noindex/i.test(html)) {
    yaTenian++;
    continue;
  }

  if (html.includes("<head>")) {
    html = html.replace("<head>", `<head>\n        ${META}`);
  } else {
    console.warn(`AVISO: ${file} sin <head>, omitido.`);
    continue;
  }

  fs.writeFileSync(full, html, "utf8");
  actualizados++;
}

console.log(`Listo: ${actualizados} páginas con noindex, ${yaTenian} ya lo tenían.`);
