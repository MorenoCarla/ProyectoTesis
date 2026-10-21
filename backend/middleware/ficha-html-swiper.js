const fs = require("fs");

const path = require("path");

const { loadApliquesCatalog, patchApliquesCarouselInHtml } = require("../services/apliques-carousel-html");



const ASSET_V = "18";



function stripLegacySwiperScripts(html) {

  return html

    .replace(/^\s*<link[^>]+ficha-swiper-fix\.css[^>]*>\s*$/gim, "")

    .replace(/^\s*<script[^>]+ficha-swiper-init\.js[^>]*>\s*<\/script>\s*$/gim, "")

    .replace(/^\s*<script[^>]+ficha-producto-swiper\.js[^>]*>\s*<\/script>\s*$/gim, "");

}



function patchProductFichaHtml(html, options = {}) {

  if (!html.includes("swiper-producto")) return html;



  let out = stripLegacySwiperScripts(html)

    .replace(/href="css\/stylescadaproducto\.css(\?v=\d+)?"/gi, `href="css/stylescadaproducto.css?v=${ASSET_V}"`)

    .replace(/href="css\/ficha-producto-layout\.css(\?v=\d+)?"/gi, `href="css/ficha-producto-layout.css?v=${ASSET_V}"`)

    .replace(/src="js\/scriptcadaproducto\.js(\?v=\d+)?"/gi, `src="js/scriptcadaproducto.js?v=${ASSET_V}"`)

    .replace(/src="js\/site-chrome\.js(\?v=\d+)?"/gi, `src="js/site-chrome.js?v=${ASSET_V}"`);



  if (!out.includes("apliques-catalog.js")) {

    out = out.replace(

      /(<script[^>]+swiper-bundle\.min\.js[^>]*>\s*<\/script>)/i,

      `$1\n        <script src="js/apliques-catalog.js?v=${ASSET_V}"></script>`

    );

  }



  if (options.staticRoot && options.currentFile) {

    try {

      const catalog = loadApliquesCatalog(options.staticRoot);

      out = patchApliquesCarouselInHtml(out, options.currentFile, catalog);

    } catch (e) {

      console.warn("[ficha-html-swiper] carrusel apliques:", e.message);

    }

  }



  return out;

}



function createFichaHtmlMiddleware(staticRoot) {

  const rootNorm = path.resolve(staticRoot) + path.sep;



  return function fichaHtmlSwiperMiddleware(req, res, next) {

    if (req.method !== "GET" && req.method !== "HEAD") return next();



    const urlPath = req.path || "";

    if (!urlPath.endsWith(".html")) return next();



    const rel = urlPath.replace(/^\//, "").split("?")[0];

    const filePath = path.resolve(path.join(staticRoot, rel));



    if (!filePath.startsWith(rootNorm) || !fs.existsSync(filePath)) return next();



    let html;

    try {

      html = fs.readFileSync(filePath, "utf8");

    } catch {

      return next();

    }



    if (!html.includes("swiper-producto")) return next();



    const patched = patchProductFichaHtml(html, {

      staticRoot,

      currentFile: path.basename(filePath),

    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.send(patched);

  };

}



module.exports = { createFichaHtmlMiddleware, patchProductFichaHtml };

