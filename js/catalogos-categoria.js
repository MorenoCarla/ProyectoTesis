/**
 * Botones "Catálogo …" en fichas de producto → PDF en catalogo/
 * Archivos esperados: catalogo/catalogo-{slug}.pdf (ver catalogo/CATALOGO-NOMBRES-PDF.txt)
 */
(function () {
  function slugCatalogo(nombre) {
    return nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /** Si el nombre del archivo no coincide con el slug automático */
  const ARCHIVO_POR_CATEGORIA = {
    "Luminaria de Pileta": "catalogo/catalogo-luminaria-pileta.pdf",
  };

  function urlPdfCategoria(nombreCategoria) {
    if (!nombreCategoria) return "";
    if (ARCHIVO_POR_CATEGORIA[nombreCategoria]) {
      return ARCHIVO_POR_CATEGORIA[nombreCategoria];
    }
    return "catalogo/catalogo-" + slugCatalogo(nombreCategoria) + ".pdf";
  }

  function nombreDesdeBoton(btn) {
    const text = (btn.textContent || "").trim();
    if (text.startsWith("Catálogo ")) {
      return text.slice("Catálogo ".length).trim();
    }
    return "";
  }

  window.initBotonesCatalogoCategoria = function () {
    document.querySelectorAll(".boton-descargas").forEach((btn) => {
      if (btn.dataset.catalogoListo === "1") return;

      let categoria = nombreDesdeBoton(btn);
      if (!categoria) {
        categoria = (document.body.getAttribute("data-categoria") || "").trim();
      }
      const pdf = urlPdfCategoria(categoria);
      if (!pdf) return;

      btn.dataset.catalogoListo = "1";
      btn.dataset.catalogoPdf = pdf;
      btn.type = "button";
      btn.title = "Abrir PDF: " + pdf;

      btn.addEventListener("click", () => {
        window.open(pdf, "_blank", "noopener,noreferrer");
      });
    });
  };
})();
