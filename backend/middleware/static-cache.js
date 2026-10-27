const path = require("path");

/** Cabeceras de caché para el sitio estático (paso 2 rendimiento). */
function setStaticCacheHeaders(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".html") {
    res.setHeader("Cache-Control", "no-cache");
    return;
  }

  const longCache =
    [".css", ".js", ".woff2", ".woff", ".ttf", ".eot", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico", ".mp4", ".webm"].includes(ext);

  if (ext === ".css" || ext === ".js") {
    const base = path.basename(filePath).toLowerCase();
    const fichasCriticas =
      base.startsWith("scriptcadaproducto") ||
      base.startsWith("ficha-producto") ||
      base.startsWith("apliques-catalog") ||
      base.startsWith("catalogo-publico") ||
      base.startsWith("site-chrome") ||
      base.startsWith("home-vitrinas");
    res.setHeader(
      "Cache-Control",
      fichasCriticas ? "no-store, no-cache, must-revalidate" : "public, max-age=0, must-revalidate"
    );
    return;
  }

  if (longCache) {
    res.setHeader("Cache-Control", "public, max-age=604800");
  }
}

module.exports = { setStaticCacheHeaders };
