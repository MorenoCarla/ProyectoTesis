/** URL del backend: mismo origen en :3000, localhost:3000 si abrís el HTML suelto */
function crmPublicUrl(path) {
  const p = path.startsWith("/") ? path : "/" + path;
  if (
    typeof window !== "undefined" &&
    window.location.protocol.startsWith("http") &&
    String(window.location.port) === "3000"
  ) {
    return p;
  }
  return "http://localhost:3000" + p;
}
