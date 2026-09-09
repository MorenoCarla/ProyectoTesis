// ============================================================
// JS compartido por TODAS las páginas de producto individual
// El nombre del producto se lee del atributo data-producto en <body>
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  agruparInfoMarcaProducto();
  initDescargasCatalogoProducto();
  iniciarPaginaProducto();
  prepararFormularioConsultaProducto();
  window.addEventListener("resize", syncVerMasHeights);
  cargarResponsiveNav();
});

/** Logo + sucursales en una sola columna compacta (evita huecos del grid) */
function agruparInfoMarcaProducto() {
  const contenedor = document.querySelector(".imagen-info");
  if (!contenedor || contenedor.querySelector(".info-marca-columna")) return;

  const imagenes = contenedor.querySelector(".imagenes");
  const direcciones = contenedor.querySelector(".direcciones");
  if (!imagenes || !direcciones) return;

  const columna = document.createElement("div");
  columna.className = "info-marca-columna";
  contenedor.insertBefore(columna, imagenes);
  columna.appendChild(imagenes);
  columna.appendChild(direcciones);
}

/** PDF por categoría — archivos en carpeta /catalogo/ */
const CATALOGOS_POR_ETIQUETA = {
  "Catálogo Apliques": "catalogo/catalogo-apliques.pdf",
  "Catálogo Colgantes": "catalogo/catalogo-colgantes.pdf",
  "Catálogo Veladores": "catalogo/catalogo-veladores.pdf",
  "Catálogo Plafones": "catalogo/catalogo-plafones.pdf",
  "Catálogo Paneles": "catalogo/catalogo-paneles.pdf",
  "Catálogo Espejos": "catalogo/catalogo-espejos.pdf",
  "Catálogo Ventiladores": "catalogo/catalogo-ventiladores.pdf",
  "Catálogo Lámparas de Pie": "catalogo/catalogo-lamparas-de-pie.pdf",
  "Catálogo Bifocales": "catalogo/catalogo-bifocales.pdf",
  "Catálogo Unifocales": "catalogo/catalogo-unifocales.pdf",
  "Catálogo Farolas": "catalogo/catalogo-farolas.pdf",
  "Catálogo Estacas": "catalogo/catalogo-estacas.pdf",
  "Catálogo Tortugas": "catalogo/catalogo-tortugas.pdf",
  "Catálogo Reflectores": "catalogo/catalogo-reflectores.pdf",
  "Catálogo Solares": "catalogo/catalogo-solares.pdf",
  "Catálogo Smart": "catalogo/catalogo-smart.pdf",
  "Catálogo Cámaras": "catalogo/catalogo-camaras.pdf",
  "Catálogo Alumbrado Público": "catalogo/catalogo-alumbrado-publico.pdf",
  "Catálogo Luminaria de Pileta": [
    "catalogo/catalogo-luminaria-pileta.pdf",
    "catalogo/catalogo-luminaria-de-pileta.pdf",
    "catalogo/catalogo-pileta.pdf"
  ]
};

function rutasCatalogoProducto(ruta) {
  return Array.isArray(ruta) ? ruta : [ruta];
}

async function abrirCatalogoProducto(rutas) {
  const candidatas = rutasCatalogoProducto(rutas);

  for (const ruta of candidatas) {
    try {
      const res = await fetch(ruta, { method: "HEAD" });
      if (res.ok) {
        window.open(ruta, "_blank", "noopener,noreferrer");
        return;
      }
    } catch (_) {
      /* sin servidor local: intentar igual */
    }
  }

  window.open(candidatas[0], "_blank", "noopener,noreferrer");
}

function initDescargasCatalogoProducto() {
  document.querySelectorAll(".boton-descargas").forEach((btn) => {
    if (btn.dataset.catalogoListo === "1") return;

    const etiqueta = btn.textContent.trim();
    const ruta = CATALOGOS_POR_ETIQUETA[etiqueta];
    if (!ruta) return;

    btn.dataset.catalogoListo = "1";
    btn.type = "button";
    btn.title = `Abrir ${etiqueta}`;
    btn.addEventListener("click", () => {
      abrirCatalogoProducto(ruta);
    });
  });
}

function iniciarPaginaProducto() {
  const esAplique = document.body.dataset.categoria === "Apliques";

  if (esAplique && !window.APLIQUES_CATALOGO) {
    const catalogo = document.createElement("script");
    catalogo.src = "js/apliques-catalogo.js";
    catalogo.onload = () => arrancarSwipersProducto();
    catalogo.onerror = () => arrancarSwipersProducto();
    document.head.appendChild(catalogo);
    return;
  }

  arrancarSwipersProducto();
}

function arrancarSwipersProducto() {
  rebuildApliquesCarousel();
  whenSwiperReady(() => {
    initSwiperProducto();
    initSwiperOtros();
    syncVerMasHeights();
  });
}

function whenSwiperReady(callback) {
  if (typeof Swiper !== "undefined") {
    callback();
    return;
  }

  let intentos = 0;
  const timer = setInterval(() => {
    if (typeof Swiper !== "undefined") {
      clearInterval(timer);
      callback();
    } else if (++intentos > 60) {
      clearInterval(timer);
    }
  }, 50);
}

function paginaActualProducto() {
  const path = window.location.pathname || "";
  const file = path.split("/").pop() || window.location.href.split("/").pop() || "";
  return file.split("?")[0].split("#")[0].toLowerCase();
}

function rebuildApliquesCarousel() {
  if (document.body.dataset.categoria !== "Apliques") return;
  if (!Array.isArray(window.APLIQUES_CATALOGO) || window.APLIQUES_CATALOGO.length === 0) return;

  const swiperEl = document.querySelector(".otros-apliques .otrosSwiper");
  const wrapper = swiperEl?.querySelector(".swiper-wrapper");
  if (!swiperEl || !wrapper) return;

  const catalogo = window.APLIQUES_CATALOGO;
  const actual = paginaActualProducto();
  let startIdx = catalogo.findIndex((item) => item.href.toLowerCase() === actual);
  if (startIdx < 0) startIdx = 0;

  const slides = [];
  for (let i = 1; slides.length < 13 && i <= catalogo.length; i++) {
    const item = catalogo[(startIdx + i) % catalogo.length];
    if (item.href.toLowerCase() === actual) continue;
    slides.push(item);
  }

  wrapper.innerHTML = slides.map((item) => `
    <div class="swiper-slide">
      <a href="${item.href}">
        <img src="${item.img}" alt="${item.nombre}">
        <p class="${item.pClass}">${item.nombre}</p>
      </a>
    </div>
  `).join("") + `
    <div class="swiper-slide ver-mas">
      <a href="apliques.html">
        <div class="contenido-ver-mas">
          <h4>Ver todos <br>los apliques</h4>
          <span>→</span>
        </div>
      </a>
    </div>
  `;
}

function cargarResponsiveNav() {
  if (window.__responsiveNavRequested) return;
  window.__responsiveNavRequested = true;
  const s = document.createElement("script");
  s.src = "js/responsive-nav.js";
  document.head.appendChild(s);
}

function syncVerMasHeights() {
  document.querySelectorAll(".otrosSwiper").forEach((swiperEl) => {
    const verMasBox = swiperEl.querySelector(".ver-mas .contenido-ver-mas");
    const productLinks = swiperEl.querySelectorAll(".swiper-slide:not(.ver-mas) a");

    if (!verMasBox || productLinks.length === 0) return;

    verMasBox.style.minHeight = "";

    let maxHeight = 0;
    productLinks.forEach((link) => {
      maxHeight = Math.max(maxHeight, link.getBoundingClientRect().height);
    });

    if (maxHeight > 0) {
      verMasBox.style.minHeight = `${Math.ceil(maxHeight)}px`;
    }
  });
}

function getSwiperProductPagination(el) {
  const container = el.closest(".swiper-container-custom");
  if (!container) return el.querySelector(".swiper-pagination");

  let paginationEl = null;
  for (const child of container.children) {
    if (child !== el && child.classList.contains("swiper-pagination")) {
      paginationEl = child;
      break;
    }
  }

  if (!paginationEl) {
    paginationEl = el.querySelector(".swiper-pagination");
    if (paginationEl) {
      container.appendChild(paginationEl);
    }
  }

  return paginationEl;
}

function initSwiperProducto() {
  const el = document.querySelector(".swiper-producto");
  if (!el || typeof Swiper === "undefined") return;

  const total = el.querySelectorAll(".swiper-slide").length;
  const paginationEl = getSwiperProductPagination(el);

  new Swiper(el, {
    slidesPerView: 1,
    loop: total >= 3,
    rewind: total < 3,
    autoHeight: true,
    observer: true,
    observeParents: true,
    pagination: paginationEl
      ? {
          el: paginationEl,
          clickable: true,
        }
      : undefined,
  });
}

function initSwiperOtros() {
  const el = document.querySelector(".otrosSwiper");
  if (!el || typeof Swiper === "undefined") return;

  const total = el.querySelectorAll(".swiper-slide").length;
  if (total === 0) return;

  const swiper = new Swiper(el, {
    slidesPerView: "auto",
    slidesPerGroup: 1,
    spaceBetween: 12,
    speed: 500,
    loop: false,
    rewind: true,
    watchOverflow: true,
    centerInsufficientSlides: true,
    grabCursor: true,
    observer: true,
    observeParents: true,
    autoplay:
      total > 2
        ? {
            delay: 2400,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false,
    navigation: {
      nextEl: el.querySelector(".swiper-button-next"),
      prevEl: el.querySelector(".swiper-button-prev"),
    },
    on: {
      init: syncVerMasHeights,
      resize: syncVerMasHeights,
      slideChange: syncVerMasHeights,
    },
  });

  el.querySelectorAll("img").forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", syncVerMasHeights, { once: true });
  });

  syncVerMasHeights();
}

const scrollTopBtn = document.getElementById('scroll-top');

if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    scrollTopBtn.classList.toggle("visible", window.scrollY > 300);
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function revealOnScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 100) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}
window.addEventListener("scroll", revealOnScroll);

function obtenerDatosProducto() {
  const body = document.body;
  return {
    producto: (body.dataset.producto || document.title || "Producto").trim(),
    categoria: (body.dataset.categoria || "Catálogo web").trim()
  };
}

const formProducto = document.querySelector(".formulario form");

function prepararFormularioConsultaProducto() {
  const form = document.querySelector(".formulario form");
  if (!form) return;

  const iniciar = () => {
    if (typeof estandarizarFormularioProducto === "function") {
      estandarizarFormularioProducto(form);
    }
    enlazarEnvioFormularioProducto(form);
    initSyncAlturaFormularioProducto();
  };

  if (typeof estandarizarFormularioProducto === "function") {
    iniciar();
    return;
  }

  const script = document.createElement("script");
  script.src = "js/perfil-comercial.js";
  script.onload = iniciar;
  document.head.appendChild(script);
}

let syncAlturaFormularioTimer = null;

function initSyncAlturaFormularioProducto() {
  const columna = document.querySelector(".info-marca-columna");
  const formulario = document.querySelector(".formulario");
  const form = formulario?.querySelector("form.form-producto-consulta");
  if (!columna || !formulario || !form) return;

  const aplicar = () => {
    if (window.matchMedia("(max-width: 992px)").matches) {
      formulario.style.height = "";
      form.style.height = "";
      form.style.maxHeight = "";
      return;
    }

    const altura = Math.round(columna.getBoundingClientRect().height);
    const btn = formulario.querySelector(".btn-enviar-producto");
    const btnAltura = btn
      ? btn.offsetHeight + parseFloat(getComputedStyle(btn).marginTop || "0")
      : 0;
    const separacion = 10;

    if (altura > 0) {
      const altoForm = Math.max(220, altura - btnAltura - separacion);
      form.style.height = `${altoForm}px`;
      form.style.maxHeight = `${altoForm}px`;
    }
  };

  const programar = () => {
    clearTimeout(syncAlturaFormularioTimer);
    syncAlturaFormularioTimer = setTimeout(() => {
      requestAnimationFrame(aplicar);
    }, 50);
  };

  programar();
  window.addEventListener("resize", programar);

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(programar);
    observer.observe(columna);
  }

  const tipoCliente = document.getElementById("tipoClienteProducto");
  if (tipoCliente) {
    tipoCliente.addEventListener("change", programar);
  }
}

function enlazarEnvioFormularioProducto(formProducto) {
  if (!formProducto || formProducto.dataset.envioListo === "1") return;
  formProducto.dataset.envioListo = "1";

  formProducto.addEventListener("submit", async function(e) {
    e.preventDefault();

    const errorPerfil = typeof validarPerfilComercialFront === "function"
      ? validarPerfilComercialFront("Producto")
      : null;
    if (errorPerfil) {
      alert(errorPerfil);
      return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const apellidoEl = document.getElementById("apellido");
    const apellido = apellidoEl ? apellidoEl.value.trim() : "";
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const ciudad = document.getElementById("ciudad").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const perfil = typeof leerPerfilComercial === "function"
      ? leerPerfilComercial("Producto")
      : {};
    const { producto, categoria } = obtenerDatosProducto();

    const btn = formProducto.closest(".formulario")?.querySelector(".btn-enviar-producto")
      || formProducto.querySelector('button[type="submit"]');
    if (!btn) return;
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Enviando...";

    try {
      const res = await fetch("http://localhost:3000/public/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono,
          ciudad,
          ...perfil,
          producto: producto,
          tipo_consulta: "Solicitud de producto",
          mensaje: `[${categoria}] Consulta sobre: ${producto}\n\n${mensaje}`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar");
      }

      alert("Consulta enviada correctamente. Nos comunicaremos a la brevedad.");
      formProducto.reset();
      const tipoEl = document.getElementById("tipoClienteProducto");
      if (tipoEl) tipoEl.dispatchEvent(new Event("change"));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo enviar la consulta. Verificá que el servidor esté corriendo.");
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  });
}
