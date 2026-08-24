/**
 * Catálogo PDF — GitHub no permite archivos > 100 MB.
 *
 * 1) Subí el PDF a Google Drive (compartir → cualquiera con el enlace).
 * 2) Copiá el ID del link (parte entre /d/ y /view).
 * 3) Pegalo en CATALOGO_DRIVE_ID abajo y hacé push de este archivo.
 *
 * En local, si existe catalogo/catalogo-ituarte-2025.pdf, también funciona sin Drive.
 */
const CATALOGO_DRIVE_ID = "TU_ID_DE_GOOGLE_DRIVE";

const CATALOGO_LOCAL = "catalogo/catalogo-ituarte-2025.pdf";
const CATALOGO_NOMBRE_DESCARGA = "Catalogo-Electricidad-Ituarte-2025.pdf";

document.addEventListener("DOMContentLoaded", () => {
  const btnDescargar = document.getElementById("btnCatalogoDescargar");
  const btnVer = document.getElementById("btnCatalogoVer");
  if (!btnDescargar || !btnVer) return;

  const usarDrive =
    CATALOGO_DRIVE_ID && CATALOGO_DRIVE_ID !== "TU_ID_DE_GOOGLE_DRIVE";

  if (usarDrive) {
    btnDescargar.href = `https://drive.google.com/uc?export=download&id=${CATALOGO_DRIVE_ID}`;
    btnDescargar.setAttribute("download", CATALOGO_NOMBRE_DESCARGA);
    btnVer.href = `https://drive.google.com/file/d/${CATALOGO_DRIVE_ID}/view`;
    return;
  }

  btnDescargar.href = CATALOGO_LOCAL;
  btnDescargar.setAttribute("download", CATALOGO_NOMBRE_DESCARGA);
  btnVer.href = CATALOGO_LOCAL;
});
