document.addEventListener("DOMContentLoaded", () => {
  const inputBusqueda = document.getElementById("busqueda");
  if (!inputBusqueda) return;

  const main = document.querySelector(".cat-catalog-main") || document.querySelector("main");
  const imagenes = Array.from(document.querySelectorAll(".imagen"));
  const filas = Array.from(document.querySelectorAll(".fila"));
  const grid = main?.querySelector(".filas-imagenes");

  let resultados = main?.querySelector(".resultados-busqueda");
  if (!resultados && main) {
    resultados = document.createElement("div");
    resultados.className = "resultados-busqueda";
    if (grid) {
      main.querySelector(".container")?.insertBefore(resultados, grid);
    } else {
      main.prepend(resultados);
    }
  }

  let mensajeNoEncontrado = main?.querySelector(".mensaje-no-encontrado");
  if (!mensajeNoEncontrado && main) {
    mensajeNoEncontrado = document.createElement("div");
    mensajeNoEncontrado.className = "mensaje-no-encontrado";
    mensajeNoEncontrado.textContent =
      "Producto no encontrado😢 Intenta nuevamente con otro nombre o código.";
    mensajeNoEncontrado.style.display = "none";
    if (grid) {
      main.querySelector(".container")?.insertBefore(mensajeNoEncontrado, grid);
    }
  }

  function mostrarTodasFilas() {
    if (resultados) resultados.classList.remove("activo");
    if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "none";
    filas.forEach((fila) => (fila.style.display = ""));
  }

  function aplicarBusqueda(texto) {
    if (!texto) {
      mostrarTodasFilas();
      return;
    }

    const coincidencias = [];

    imagenes.forEach((imagen) => {
      const nombre = (imagen.dataset.nombre || "").toLowerCase();
      const codigos = (imagen.dataset.codigo || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim());
      const busca = texto.toLowerCase();
      const coincideNombre = nombre.includes(busca);
      const coincideCodigo = codigos.some((c) => c && c.includes(busca));
      if (coincideNombre || coincideCodigo) {
        coincidencias.push(imagen);
      }
    });

    if (coincidencias.length === 0) {
      filas.forEach((fila) => (fila.style.display = "none"));
      if (resultados) resultados.classList.remove("activo");
      if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "block";
      return;
    }

    if (mensajeNoEncontrado) mensajeNoEncontrado.style.display = "none";
    filas.forEach((fila) => (fila.style.display = "none"));

    if (!resultados) return;
    resultados.innerHTML = "";

    coincidencias.forEach((node) => {
      const link = node.closest(".link-producto");
      if (link) {
        const wrap = document.createElement("div");
        wrap.className = "link-producto";
        wrap.appendChild(node.cloneNode(true));
        resultados.appendChild(wrap);
      } else {
        resultados.appendChild(node.cloneNode(true));
      }
    });

    resultados.classList.add("activo");
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

  const botonBuscar = document.querySelector(".buscador-btn, .cat-catalog-search .fa-search");
  if (botonBuscar) {
    botonBuscar.addEventListener("click", () => {
      aplicarBusqueda(inputBusqueda.value.trim());
    });
  }
});
