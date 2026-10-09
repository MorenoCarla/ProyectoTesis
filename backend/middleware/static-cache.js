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

  if (longCache) {
    res.setHeader("Cache-Control", "public, max-age=604800");
  }
}

module.exports = { setStaticCacheHeaders };
