// ============================================================
// JS compartido por TODAS las páginas de producto individual
// El nombre del producto se lee del atributo data-producto en <body>
// Carrusel ficha: v18 — fotos + "otros" en este único archivo
// ============================================================

function crmPublicUrl(path) {
  const p = path.startsWith("/") ? path : "/" + path;
  const base =
    typeof crmApiBaseUrl === "function"
      ? crmApiBaseUrl()
      : (function () {
          const { protocol, port } = window.location;
          if (!protocol.startsWith("http")) return "http://localhost:3000";
          if (port === "3000" || port === "" || port === "80" || port === "443") return "";
          return "http://localhost:3000";
        })();
  return base ? base + p : p;
}

function cargarScriptProducto(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

/** PDF por categoría (botón "Catálogo Colgantes", etc.) → catalogo/catalogo-colgantes.pdf */
function initBotonesCatalogoCategoria() {
  const ARCHIVO_POR_CATEGORIA = {
    "Luminaria de Pileta": "catalogo/catalogo-luminaria-pileta.pdf",
  };

  function slugCatalogo(nombre) {
    return nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function urlPdfCategoria(nombreCategoria) {
    if (!nombreCategoria) return "";
    if (ARCHIVO_POR_CATEGORIA[nombreCategoria]) {
      return ARCHIVO_POR_CATEGORIA[nombreCategoria];
    }
    return "catalogo/catalogo-" + slugCatalogo(nombreCategoria) + ".pdf";
  }

  document.querySelectorAll(".boton-descargas").forEach((btn) => {
    if (btn.dataset.catalogoListo === "1") return;

    const text = (btn.textContent || "").trim();
    let categoria = text.startsWith("Catálogo ") ? text.slice("Catálogo ".length).trim() : "";
    if (!categoria) {
      categoria = (document.body.getAttribute("data-categoria") || "").trim();
    }
    const pdf = urlPdfCategoria(categoria);
    if (!pdf) return;

    const link = document.createElement("a");
    link.href = pdf;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = btn.className;
    link.textContent = text || "Catálogo " + categoria;
    link.title = "Abrir " + pdf;
    link.dataset.catalogoListo = "1";
    btn.replaceWith(link);
  });
}

const APLIQUES_CAROUSEL_MIN = 8;

function getApliquesCatalog() {
  return Array.isArray(window.APLIQUES_CATALOG) ? window.APLIQUES_CATALOG : [];
}

function pickEightApliques(catalog, currentFile) {
  const cur = (currentFile || "").toLowerCase();
  const idx = catalog.findIndex((i) => i.href.toLowerCase() === cur);
  const start = idx >= 0 ? idx + 1 : 0;
  const picked = [];
  if (!catalog.length) return picked;
  for (let i = 0; picked.length < APLIQUES_CAROUSEL_MIN && i < catalog.length * 2; i++) {
    const item = catalog[(start + i) % catalog.length];
    if (item.href.toLowerCase() === cur) continue;
    if (picked.some((p) => p.href.toLowerCase() === item.href.toLowerCase())) continue;
    picked.push(item);
  }
  return picked;
}

function verMasApliquesSlideHtml() {
  return (
    '<div class="swiper-slide ver-mas"><a href="apliques.html">' +
    '<div class="contenido-ver-mas"><h4>Ver todos <br>los apliques</h4><span>→</span></div></a></div>'
  );
}

function apliquesProductSlideHtml(item, index) {
  const pClass =
    item.pClass && /^p\d/.test(item.pClass) ? item.pClass.split(/\s+/)[0] : "p" + ((index % 5) + 1);
  const label = item.label || item.alt || "Aplique";
  const alt = item.alt || label;
  return (
    '<div class="swiper-slide"><a href="' +
    item.href +
    '"><img src="' +
    item.imgSrc +
    '" alt="' +
    alt +
    '"><p class="' +
    pClass +
    '">' +
    label +
    "</p></a></div>"
  );
}

/** 8 slides + Ver todos en todas las fichas Apliques (como Word). */
function hydrateApliquesCarouselIfNeeded() {
  if (!document.querySelector("section.otros-apliques")) return;
  const categoria = (document.body.getAttribute("data-categoria") || "").trim();
  if (categoria !== "Apliques") return;

  const wrapper = document.querySelector(".otrosSwiper .swiper-wrapper");
  if (!wrapper) return;

  const catalog = getApliquesCatalog();
  if (catalog.length < APLIQUES_CAROUSEL_MIN) return;

  const current = window.location.pathname.split("/").pop() || "";
  const picked = pickEightApliques(catalog, current);
  if (picked.length < APLIQUES_CAROUSEL_MIN) return;

  wrapper.innerHTML =
    picked.map((item, i) => apliquesProductSlideHtml(item, i)).join("") + verMasApliquesSlideHtml();
}

function lockProductoSlideWidths(swiper) {
  if (!swiper || !swiper.width) return;
  const w = swiper.width;
  swiper.slides.forEach((slide) => {
    slide.style.width = `${w}px`;
    slide.style.flexShrink = "0";
  });
}

function initSwiperProducto() {
  const el = document.querySelector(".caja-informacion .swiper-producto");
  if (!el || typeof Swiper === "undefined" || el.swiper) return;

  const total = el.querySelectorAll(".swiper-slide").length;
  if (total === 0) return;

  let paginationEl = el.querySelector(".swiper-pagination");
  if (!paginationEl) {
    const container = el.closest(".swiper-container-custom");
    if (container) {
      for (const child of container.children) {
        if (child !== el && child.classList.contains("swiper-pagination")) {
          el.appendChild(child);
          paginationEl = child;
          break;
        }
      }
    }
  }

  try {
    const swiper = new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: false,
      rewind: true,
      autoHeight: false,
      observer: false,
      observeParents: false,
      pagination: paginationEl ? { el: paginationEl, clickable: true } : undefined,
      on: {
        init(s) {
          lockProductoSlideWidths(s);
          s.update();
        },
        resize(s) {
          lockProductoSlideWidths(s);
          s.update();
        },
      },
    });
    lockProductoSlideWidths(swiper);
    swiper.update();
  } catch (err) {
    console.error("[ficha] swiper fotos:", err);
  }
}

function initFichaSwipers() {
  hydrateApliquesCarouselIfNeeded();
  initSwiperProducto();
  initSwiperOtros();
  syncVerMasHeights();
}

function refreshFichaSwipers() {
  initSwiperProducto();
  if (!document.querySelector(".otrosSwiper")?.swiper) {
    initSwiperOtros();
  }
  document.querySelectorAll(".swiper-producto, .otrosSwiper").forEach((node) => {
    if (!node.swiper) return;
    if (node.classList.contains("swiper-producto")) {
      lockProductoSlideWidths(node.swiper);
    }
    node.swiper.update();
  });
  syncVerMasHeights();
}

function destroySwiperFichaFotos() {
  const el = document.querySelector(".caja-informacion .swiper-producto");
  if (!el?.swiper) return;
  try {
    el.swiper.destroy(true, true);
  } catch (_) {}
  if (window.__swiperProducto) {
    try {
      window.__swiperProducto.destroy(true, true);
    } catch (_) {}
    window.__swiperProducto = null;
  }
}

document.addEventListener("catalogo-ficha-ready", () => {
  destroySwiperFichaFotos();
  const otros = document.querySelector(".otrosSwiper");
  if (otros?.swiper) {
    try {
      otros.swiper.destroy(true, true);
    } catch (_) {}
  }
  hydrateApliquesCarouselIfNeeded();
  initSwiperProducto();
  initSwiperOtros();
  syncVerMasHeights();
  bindFormularioConsultaProducto();
});

window.refreshFichaSwipers = refreshFichaSwipers;

document.addEventListener("DOMContentLoaded", async () => {
  initBotonesCatalogoCategoria();
  initFichaSwipers();
  requestAnimationFrame(refreshFichaSwipers);
  window.addEventListener("resize", () => {
    refreshFichaSwipers();
    syncVerMasHeights();
  });
  cargarResponsiveNav();
  try {
    if (typeof inyectarPerfilComercialEnFormularioProducto !== "function") {
      await cargarScriptProducto("js/form-perfil-comercial.js");
    }
    if (typeof inyectarPerfilComercialEnFormularioProducto === "function") {
      inyectarPerfilComercialEnFormularioProducto();
    }
  } catch (e) {
    console.warn("Perfil comercial no cargado en producto", e);
  }
  bindFormularioConsultaProducto();
});

window.addEventListener("load", refreshFichaSwipers);

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

function initSwiperOtros() {
  const el = document.querySelector(".otrosSwiper");
  if (!el || typeof Swiper === "undefined" || el.swiper) return;

  const total = el.querySelectorAll(".swiper-slide").length;
  if (total === 0) return;

  const nextBtn = el.querySelector(".swiper-button-next");
  const prevBtn = el.querySelector(".swiper-button-prev");

  try {
    new Swiper(el, {
      slidesPerView: "auto",
      slidesPerGroup: 1,
      spaceBetween: 12,
      speed: 500,
      loop: false,
      rewind: true,
      watchOverflow: false,
      centerInsufficientSlides: true,
      grabCursor: true,
      observer: false,
      observeParents: false,
      navigation:
        nextBtn && prevBtn ? { nextEl: nextBtn, prevEl: prevBtn } : undefined,
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
  } catch (err) {
    console.error("[ficha] swiper otros:", err);
  }
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

function slugFichaDesdeUrl() {
  const m = window.location.pathname.match(/\/p\/([^/]+)\/?$/i);
  return m ? decodeURIComponent(m[1]) : "";
}

function bindFormularioConsultaProducto() {
  const formProducto = document.querySelector(".formulario form");
  if (!formProducto || formProducto.dataset.consultaBound === "1") return;
  formProducto.dataset.consultaBound = "1";

  formProducto.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombreEl = document.getElementById("nombre");
    const emailEl = document.getElementById("email");
    const mensajeEl = document.getElementById("mensaje");
    if (!nombreEl || !emailEl || !mensajeEl) {
      alert("No se pudo cargar el formulario. Recargá la página (Ctrl+F5).");
      return;
    }

    const nombre = nombreEl.value.trim();
    const apellidoEl = document.getElementById("apellido");
    const apellido = apellidoEl ? apellidoEl.value.trim() : "";
    const email = emailEl.value.trim();
    const mensaje = mensajeEl.value.trim();
    const telefonoEl = document.getElementById("telefono");
    const telefono = telefonoEl ? telefonoEl.value.trim() : "";
    const ciudadEl = document.getElementById("ciudad");
    const ciudad = ciudadEl ? ciudadEl.value.trim() : "";
    const perfil =
      typeof leerPerfilComercial === "function"
        ? leerPerfilComercial("Producto")
        : {};
    const { producto, categoria } = obtenerDatosProducto();
    const slug = slugFichaDesdeUrl();
    const refProducto = slug
      ? `${producto} (ficha /p/${slug})`
      : producto;

    const btn = formProducto.querySelector('button[type="submit"]');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Enviando...";

    try {
      const res = await fetch(crmPublicUrl("/public/consulta"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono,
          ciudad,
          producto: refProducto,
          tipo_consulta: "Solicitud de producto",
          mensaje: `[${categoria}] Consulta sobre: ${refProducto}\n\n${mensaje}`,
          ...perfil
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
