/**
 * Tema visual de fichas /p/:slug (paridad con HTML legacy).
 */
(function (global) {
  function normalizarCategoriaKey(nombre) {
    return String(nombre || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  const CATEGORIA_ATTR_CSS = {
    apliques: "Apliques",
    colgantes: "Colgantes",
    veladores: "Veladores",
    plafones: "Plafones",
    espejos: "Espejos",
    "lamparas de pie": "Lámparas de pie",
    paneles: "Paneles",
    smart: "Smart",
    ventiladores: "Ventiladores",
    bifocales: "Bifocales",
    unifocales: "Unifocales",
    farolas: "Farolas",
    estacas: "Estacas",
    tortugas: "Tortugas",
    reflectores: "Reflectores",
    "luminaria de pileta": "Luminaria de pileta",
    solares: "Solares",
    "alumbrado publico": "Alumbrado público",
    camaras: "Cámaras"
  };

  const EXTERIOR_BODY_CLASS = {
    bifocales: "producto-exterior",
    unifocales: "producto-exterior producto-unifocal",
    farolas: "producto-exterior producto-farolas",
    estacas: "producto-exterior producto-estacas",
    tortugas: "producto-exterior producto-tortugas",
    reflectores: "producto-exterior producto-reflectores",
    "luminaria de pileta": "producto-exterior producto-piletas",
    solares: "producto-exterior producto-solares",
    "alumbrado publico": "producto-exterior producto-alumbrado",
    camaras: "producto-exterior producto-camaras"
  };

  function categoriaAtributoCss(nombreCategoria) {
    const key = normalizarCategoriaKey(nombreCategoria);
    return CATEGORIA_ATTR_CSS[key] || String(nombreCategoria || "").trim();
  }

  function clasesBodyFicha(nombreCategoria) {
    const key = normalizarCategoriaKey(nombreCategoria);
    if (EXTERIOR_BODY_CLASS[key]) return EXTERIOR_BODY_CLASS[key];
    return "fondo-cada-producto";
  }

  function esImagenFotomontajeFicha(src) {
    const s = String(src || "").toLowerCase();
    return /fotomont|foto-?mont|ambientad/.test(s);
  }

  function ordenarImagenesFicha(imagenes) {
    if (!Array.isArray(imagenes) || imagenes.length < 2) return imagenes || [];
    const crudas = [];
    const fotom = [];
    for (const src of imagenes) {
      if (src && esImagenFotomontajeFicha(src)) fotom.push(src);
      else if (src) crudas.push(src);
    }
    return [...crudas, ...fotom];
  }

  function aplicarTemaFichaProducto(producto) {
    const body = document.body;
    if (!body || !producto) return;
    const catNombre = producto.categoria?.nombre || "";
    const cssCat = producto.categoria?.css || categoriaAtributoCss(catNombre);
    const bodyClass =
      producto.ficha_body_class || clasesBodyFicha(catNombre);

    body.className = bodyClass;
    body.dataset.producto = producto.nombre || "";
    body.dataset.categoria = cssCat;
  }

  global.FichaProductoTema = {
    aplicarTemaFichaProducto,
    ordenarImagenesFicha,
    clasesBodyFicha,
    categoriaAtributoCss
  };
})(window);
