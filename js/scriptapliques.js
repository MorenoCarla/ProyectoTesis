document.addEventListener("DOMContentLoaded", () => {
  const inputBusqueda = document.getElementById("busqueda");
  const imagenes = Array.from(document.querySelectorAll(".imagen"));
  const filas = Array.from(document.querySelectorAll(".fila"));
  const main = document.querySelector("main");

  // Contenedor donde se mostrarán los resultados encontrados
  const resultados = document.createElement("div");
  resultados.className = "resultados-busqueda";
  resultados.style.display = "none";
  main.insertBefore(resultados, main.querySelector(".filas-imagenes"));

  // Mensaje "no encontrado"
  const mensajeNoEncontrado = document.createElement("div");
  mensajeNoEncontrado.className = "mensaje-no-encontrado";
  mensajeNoEncontrado.textContent = "Producto no encontrado😢 Intenta nuevamente con otro nombre u código.";
  mensajeNoEncontrado.style.display = "none";
  main.insertBefore(mensajeNoEncontrado, resultados);

  function mostrarTodasFilas() {
    resultados.style.display = "none";
    mensajeNoEncontrado.style.display = "none";
    filas.forEach(fila => (fila.style.display = "flex"));
  }

  function aplicarBusqueda(texto) {
    if (!texto) {
      mostrarTodasFilas();
      return;
    }

    const coincidencias = [];

    imagenes.forEach(imagen => {
      const nombre = (imagen.dataset.nombre || "").toLowerCase();
      const codigos = (imagen.dataset.codigo || "")
        .toLowerCase()
        .split(",")
        .map(s => s.trim());
      const busca = texto.toLowerCase();

      const coincideNombre = nombre.includes(busca);
      const coincideCodigo = codigos.some(c => c && c.includes(busca));

      if (coincideNombre || coincideCodigo) {
        coincidencias.push(imagen);
      }
    });

    if (coincidencias.length === 0) {
      filas.forEach(fila => (fila.style.display = "none"));
      resultados.style.display = "none";
      mensajeNoEncontrado.style.display = "block";
      return;
    }

    // Ocultamos filas y mensaje, mostramos los resultados en formato fila horizontal
    mensajeNoEncontrado.style.display = "none";
    filas.forEach(fila => (fila.style.display = "none"));

    resultados.innerHTML = "";

    coincidencias.forEach(node => {
      const clon = node.cloneNode(true);
      resultados.appendChild(clon);
    });

    resultados.style.display = "flex"; // los muestra en fila
  }

  // Escucha mientras el usuario escribe
  inputBusqueda.addEventListener("input", e => {
    const texto = e.target.value.trim();
    aplicarBusqueda(texto);
  });

  // Buscar también al presionar Enter
  inputBusqueda.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      aplicarBusqueda(e.target.value.trim());
    }
  });

  // Buscar al hacer clic en la lupa
  const botonLupa = document.querySelector(".buscador i");
  if (botonLupa) {
    botonLupa.addEventListener("click", () => {
      aplicarBusqueda(inputBusqueda.value.trim());
    });
  }
});


const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) { // aparece después de 300px
    scrollTopBtn.style.opacity = '1';
  } else {
    scrollTopBtn.style.opacity = '0';
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
