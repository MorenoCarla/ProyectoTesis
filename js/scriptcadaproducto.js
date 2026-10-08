// ============================================================
// JS compartido por TODAS las páginas de producto individual
// El nombre del producto se lee del atributo data-producto en <body>
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  inyectarFormularioProductoCompleto();
  initSwiperProducto();
  initSwiperOtros();
  syncVerMasHeights();
  window.addEventListener("resize", syncVerMasHeights);
  cargarResponsiveNav();
});

function inyectarFormularioProductoCompleto() {
  const form = document.querySelector(".formulario form");
  if (!form || form.querySelector("[data-form-producto-extendido]")) return;
  if (!form.querySelector("#nombre")) return;

  const bloque = document.createElement("div");
  bloque.setAttribute("data-form-producto-extendido", "1");
  bloque.innerHTML = `
    <label>Apellido</label>
    <input type="text" id="apellido" placeholder="Tu apellido">
    <label>Teléfono</label>
    <input type="tel" id="telefono" placeholder="3865...">
    <label>Ciudad</label>
    <input type="text" id="ciudad" placeholder="Ej: Concepción">
    <label>Tipo de cliente</label>
    <select id="tipoCliente">
      <option value="particular">Particular</option>
      <option value="profesional">Profesional</option>
      <option value="empresa">Empresa</option>
      <option value="municipalidad">Municipalidad</option>
    </select>
    <label>Rubro / Profesión</label>
    <select id="rubro">
      <option value="">Sin especificar</option>
      <option value="arquitecto">Arquitecto</option>
      <option value="ingeniero">Ingeniero</option>
      <option value="electricista">Electricista</option>
      <option value="diseñador_interiores">Diseñador de interiores</option>
      <option value="constructor">Constructor</option>
      <option value="municipalidad">Municipalidad / Alumbrado público</option>
      <option value="empresa_industrial">Empresa industrial</option>
      <option value="comercio">Comercio</option>
      <option value="otro">Otro</option>
    </select>
    <label>Empresa / Estudio</label>
    <input type="text" id="empresa" placeholder="Opcional">
  `;

  const mensaje = form.querySelector("#mensaje");
  if (mensaje) form.insertBefore(bloque, mensaje);
  else form.appendChild(bloque);
}

function leerPerfilProducto() {
  const tipo = document.getElementById("tipoCliente");
  const rubro = document.getElementById("rubro");
  const empresa = document.getElementById("empresa");
  return {
    tipo_cliente: tipo && tipo.value ? tipo.value : "particular",
    rubro: rubro && rubro.value ? rubro.value : null,
    empresa: empresa && empresa.value.trim() ? empresa.value.trim() : null
  };
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

if (formProducto) {
  formProducto.addEventListener("submit", async function(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellidoEl = document.getElementById("apellido");
    const apellido = apellidoEl ? apellidoEl.value.trim() : "";
    const email = document.getElementById("email").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const telefonoEl = document.getElementById("telefono");
    const telefono = telefonoEl ? telefonoEl.value.trim() : "";
    const { producto, categoria } = obtenerDatosProducto();

    const btn = formProducto.querySelector('button[type="submit"]');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Enviando...";

    try {
      const res = await fetch("/public/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono,
          ciudad: document.getElementById("ciudad")?.value.trim() || null,
          producto: producto,
          tipo_consulta: "Solicitud de producto",
          mensaje: `[${categoria}] Consulta sobre: ${producto}\n\n${mensaje}`,
          ...leerPerfilProducto()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar");
      }

      alert("Consulta enviada correctamente. Nos comunicaremos a la brevedad.");
      formProducto.reset();
    } catch (err) {
      console.error(err);
      alert("No se pudo enviar la consulta. Verificá que el servidor esté corriendo.");
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  });
}
