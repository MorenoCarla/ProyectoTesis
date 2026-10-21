/**
 * Redirige fichas HTML legacy (virgo.html) → /p/virgo (catálogo dinámico).
 */
const { slugDesdePaginaHtml, urlProductoPublico } = require("../services/catalogo-publico");

function createLegacyProductoRedirectMiddleware() {
  return async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const m = req.path.match(/^\/([a-zA-Z0-9._-]+\.html)$/);
    if (!m) return next();
    const archivo = m[1];
    const omitir = new Set([
      "index.html",
      "productos.html",
      "contacto.html",
      "login.html",
      "registro.html",
      "crm-admin.html",
      "crm-cliente.html",
      "catalogo.html",
      "producto.html",
      "apliques.html",
      "colgantes.html",
      "veladores.html",
      "plafones.html",
      "bifocales.html",
      "unifocales.html",
      "farolas.html",
      "estacas.html",
      "tortugas.html",
      "reflectores.html",
      "pileta.html",
      "solares.html",
      "paneles.html",
      "smart.html",
      "alumbradopublico.html",
      "ventiladores.html",
      "camaras.html",
      "espejos.html",
      "lamparasdepie.html",
      "conócenos.html",
      "conocenos.html",
      "recuperar-contrasena.html",
      "cambiar-contrasena.html",
      "plantilla-producto.html",
      "plantilla-colgante.html"
    ]);
    if (omitir.has(archivo.toLowerCase())) return next();

    try {
      const slug = await slugDesdePaginaHtml(archivo);
      if (slug) {
        const dest = urlProductoPublico(slug);
        return res.redirect(301, dest);
      }
    } catch (e) {
      console.warn("[legacy-producto-redirect]", e.message);
    }
    next();
  };
}

module.exports = { createLegacyProductoRedirectMiddleware };
