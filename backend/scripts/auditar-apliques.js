const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const apliquesHtml = fs.readFileSync(path.join(root, "apliques.html"), "utf8");
const links = [...apliquesHtml.matchAll(/href="([^"]+\.html)"/g)]
  .map((m) => m[1])
  .filter((f) => !["index.html", "productos.html", "catalogo.html", "contacto.html", "conócenos.html", "registro.html"].includes(f));
const unique = [...new Set(links)];

const issues = [];

for (const file of unique.sort()) {
  const fp = path.join(root, file);
  if (!fs.existsSync(fp)) {
    issues.push({ file, problem: "ARCHIVO_NO_EXISTE" });
    continue;
  }
  const html = fs.readFileSync(fp, "utf8");
  const probs = [];
  if (!html.includes('data-categoria="Apliques"')) probs.push("NO_ES_APLIQUE");
  if (!html.includes("otrosSwiper")) probs.push("SIN_otrosSwiper");
  if (!html.includes("swiper-button-next")) probs.push("SIN_boton_next");
  if (!html.includes("swiper-button-prev")) probs.push("SIN_boton_prev");
  if (!html.includes("swiper-wrapper")) probs.push("SIN_wrapper");
  if (!html.includes("scriptcadaproducto.js")) probs.push("SIN_scriptcadaproducto");
  if (!html.includes("swiper-bundle.min.js")) probs.push("SIN_swiper_js");
  if (!html.includes("ver-mas")) probs.push("SIN_ver_mas");
  const openDiv = (html.match(/<div/g) || []).length;
  const closeDiv = (html.match(/<\/div>/g) || []).length;
  if (openDiv !== closeDiv) probs.push(`DIV_DESBALANCE ${openDiv}/${closeDiv}`);
  const slides = (html.match(/class="swiper-slide"/g) || []).length;
  if (slides < 3) probs.push(`POCOS_SLIDES_${slides}`);
  if (html.includes("minigloboopal.html")) probs.push("LINK_ROTO_minigloboopal");
  if (probs.length) issues.push({ file, problem: probs.join(", ") });
}

console.log(`Total apliques en catalogo: ${unique.length}`);
console.log(`Con problemas: ${issues.length}`);
issues.forEach((i) => console.log(`${i.file}: ${i.problem}`));
