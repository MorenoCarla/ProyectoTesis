function normalizarTextoBusqueda(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function initBusquedaCatalogo() {
  const inputBusqueda = document.getElementById("busqueda");
  if (!inputBusqueda) return;

  const main = document.querySelector(".cat-catalog-main") || document.querySelector("main");

  function gridEl() {
    return (
      main?.querySelector("section.cat-catalog-grid[data-catalogo-dinamico]") ||
      main?.querySelector(".filas-imagenes.cat-catalog-grid") ||
      main?.querySelector(".filas-imagenes")
    );
  }

  let resultados = main?.querySelector(".resultados-busqueda");
  const gridInicial = gridEl();
  if (!resultados && main && gridInicial) {
    resultados = document.createElement("div");
    resultados.className = "resultados-busqueda";
    main.querySelector(".container")?.insertBefore(resultados, gridInicial);
  }

  let mensajeNoEncontrado = main?.querySelector(".mensaje-no-encontrado");

  function refsGrilla() {
    const grid = gridEl();
    const scope = grid || main || document;
    const imagenes = Array.from(scope.querySelectorAll(".fila .imagen, .cat-catalog-grid .imagen"));
    const filas = grid
      ? Array.from(grid.querySelectorAll(":scope > .fila"))
      : Array.from(scope.querySelectorAll(".fila"));
    return { grid, imagenes, filas };
  }

  function datosImagen(imagen) {
    const nombre = (
      imagen.dataset.nombre ||
      imagen.querySelector("p")?.textContent ||
      ""
    ).trim();
    const codigos = (imagen.dataset.codigo || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const slug = (imagen.dataset.slug || "").trim().toLowerCase();
    const href = imagen.closest("a.link-producto")?.getAttribute("href") || "";
    return { nombre, codigos, slug, href: href.toLowerCase() };
  }

  function imagenCoincide(imagen, buscaNorm) {
    if (!buscaNorm) return true;
    const { nombre, codigos, slug, href } = datosImagen(imagen);
    if (normalizarTextoBusqueda(nombre).includes(buscaNorm)) return true;
    if (codigos.some((c) => normalizarTextoBusqueda(c).includes(buscaNorm))) return true;
    if (slug && slug.includes(buscaNorm.replace(/\s+/g, ""))) return true;
    if (href && href.includes(buscaNorm.replace(/\s+/g, ""))) return true;
    return false;
  }

  function mostrarTodasFilas() {
    const { filas } = refsGrilla();
    if (resultados) {
      resultados.classList.remove("activo");
      resultados.innerHTML = "";
    }
    if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "none";
    filas.forEach((fila) => {
      fila.style.display = "";
      fila.querySelectorAll(".link-producto").forEach((a) => {
        a.style.display = "";
      });
    });
    const grid = gridEl();
    if (grid) grid.style.display = "";
  }

  function aplicarBusqueda(texto) {
    const buscaNorm = normalizarTextoBusqueda(texto);
    const { grid, imagenes, filas } = refsGrilla();

    if (!buscaNorm) {
      mostrarTodasFilas();
      return;
    }

    if (!imagenes.length) {
      if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "block";
      if (grid) grid.style.display = "";
      return;
    }

    let total = 0;

    filas.forEach((fila) => {
      let visiblesEnFila = 0;
      fila.querySelectorAll(".link-producto").forEach((link) => {
        const imagen = link.querySelector(".imagen");
        const ok = imagen && imagenCoincide(imagen, buscaNorm);
        link.style.display = ok ? "" : "none";
        if (ok) {
          visiblesEnFila++;
          total++;
        }
      });
      fila.style.display = visiblesEnFila > 0 ? "" : "none";
    });

    if (resultados) {
      resultados.classList.remove("activo");
      resultados.innerHTML = "";
    }

    if (total === 0) {
      if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "block";
    } else {
      if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "none";
    }
    if (grid) grid.style.display = "";
  }

  inputBusqueda.addEventListener("input", (e) => {
    aplicarBusqueda(e.target.value.trim());
  });

  inputBusqueda.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      aplicarBusqueda(e.target.value.trim());
    }
  });

  const botonBuscar = document.querySelector(".buscador-btn");
  if (botonBuscar && !botonBuscar.dataset.busquedaBound) {
    botonBuscar.dataset.busquedaBound = "1";
    botonBuscar.addEventListener("click", () => {
      aplicarBusqueda(inputBusqueda.value.trim());
    });
  }

  return {
    aplicarBusqueda,
    refreshRefs: () => {},
  };
}

document.addEventListener("DOMContentLoaded", () => {
  window.__busquedaCatalogo = initBusquedaCatalogo();
});

document.addEventListener("catalogo-grilla-ready", () => {
  const input = document.getElementById("busqueda");
  const q = input?.value.trim() || "";
  if (window.__busquedaCatalogo?.aplicarBusqueda) {
    window.__busquedaCatalogo.aplicarBusqueda(q);
  }
});
