/**
 * Base URL del backend CRM (sitio + API mismo servidor).
 * - localhost:3000 o dominio sin puerto (Nginx 80/443) → rutas relativas
 * - Live Server / file:// → http://localhost:3000
 */
function crmApiBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:3000";
  const { protocol, port } = window.location;
  if (!protocol.startsWith("http")) return "http://localhost:3000";
  if (port === "3000" || port === "" || port === "80" || port === "443") {
    return "";
  }
  return "http://localhost:3000";
}

function crmPublicUrl(path) {
  const p = path.startsWith("/") ? path : "/" + path;
  const base = crmApiBaseUrl();
  return base ? base + p : p;
}
