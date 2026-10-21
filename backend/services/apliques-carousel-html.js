const fs = require("fs");
const path = require("path");

const MIN_SLIDES = 8;
const VER_MAS = `<div class="swiper-slide ver-mas"><a href="apliques.html"><div class="contenido-ver-mas"><h4>Ver todos <br>los apliques</h4><span>→</span></div></a></div>`;

function parseApliquesCatalog(html) {
  const items = [];
  const re =
    /<a href="([^"]+\.html)" class="link-producto">[\s\S]*?<img src="([^"]+)" alt="([^"]*)">[\s\S]*?<p class="(p\d[^"]*)">([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    items.push({
      href: m[1].trim(),
      imgSrc: m[2].trim(),
      alt: m[3].trim(),
      label: m[5].replace(/\s+/g, " ").trim(),
      pClass: m[4].trim().split(/\s+/)[0],
    });
  }
  const seen = new Set();
  return items.filter((item) => {
    const key = item.href.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

let catalogCache = null;

function loadApliquesCatalog(staticRoot) {
  if (catalogCache) return catalogCache;
  const p = path.join(staticRoot, "apliques.html");
  const html = fs.readFileSync(p, "utf8");
  catalogCache = parseApliquesCatalog(html);
  return catalogCache;
}

function pickEight(catalog, currentFile) {
  const cur = (currentFile || "").toLowerCase();
  const idx = catalog.findIndex((i) => i.href.toLowerCase() === cur);
  const start = idx >= 0 ? idx + 1 : 0;
  const picked = [];
  if (!catalog.length) return picked;
  for (let i = 0; picked.length < MIN_SLIDES && i < catalog.length * 2; i++) {
    const item = catalog[(start + i) % catalog.length];
    if (item.href.toLowerCase() === cur) continue;
    if (picked.some((p) => p.href.toLowerCase() === item.href.toLowerCase())) continue;
    picked.push(item);
  }
  return picked;
}

function slideHtml(item) {
  const label = item.label || item.alt || "Aplique";
  const alt = item.alt || label;
  return `<div class="swiper-slide"><a href="${item.href}"><img src="${item.imgSrc}" alt="${alt}"><p class="${item.pClass}">${label}</p></a></div>`;
}

function buildWrapperInner(picked) {
  const indent = "                        ";
  return (
    "\n" +
    picked.map((item) => indent + slideHtml(item)).join("\n") +
    "\n" +
    indent +
    VER_MAS +
    "\n                    "
  );
}

function patchApliquesCarouselInHtml(html, currentFile, catalog) {
  if (!html.includes('data-categoria="Apliques"') || !html.includes("otrosSwiper")) {
    return html;
  }
  const picked = pickEight(catalog, currentFile);
  if (picked.length < MIN_SLIDES) return html;

  const re =
    /(<div class="swiper otrosSwiper">\s*<div class="swiper-wrapper">)([\s\S]*?)(\s*<\/div>\s*<div class="swiper-button-next">)/;
  if (!re.test(html)) return html;
  return html.replace(re, `$1${buildWrapperInner(picked)}$3`);
}

function resetCatalogCache() {
  catalogCache = null;
}

module.exports = {
  MIN_SLIDES,
  parseApliquesCatalog,
  loadApliquesCatalog,
  pickEight,
  patchApliquesCarouselInHtml,
  resetCatalogCache,
};
