(function () {
  /* Versión del chrome: subir número cuando cambie site-chrome.css */
  var SITE_CHROME_CSS_V = "15";
  var FICHA_LAYOUT_CSS_V = "18";
  var bodyEl = document.body;

  document.querySelectorAll('link[href*="site-chrome.css"]').forEach(function (link) {
    var href = link.getAttribute("href") || "";
    var base = href.split("?")[0];
    if (!href.includes("v=" + SITE_CHROME_CSS_V)) {
      link.setAttribute("href", base + "?v=" + SITE_CHROME_CSS_V);
    }
  });

  if (
    bodyEl &&
    (bodyEl.classList.contains("fondo-cada-producto") || bodyEl.classList.contains("producto-exterior"))
  ) {
    document.querySelectorAll('link[href*="stylescadaproducto.css"]').forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var base = href.split("?")[0];
      if (!href.includes("v=" + FICHA_LAYOUT_CSS_V)) {
        link.setAttribute("href", base + "?v=" + FICHA_LAYOUT_CSS_V);
      }
    });
    if (!document.querySelector('link[href*="ficha-producto-layout.css"]')) {
      var fichaLink = document.createElement("link");
      fichaLink.rel = "stylesheet";
      fichaLink.href = "css/ficha-producto-layout.css?v=" + FICHA_LAYOUT_CSS_V;
      document.head.appendChild(fichaLink);
    }
    /* No cambiar src de scriptcadaproducto.js: al ejecutarse site-chrome después del defer,
       reasignar src vuelve a cargar el JS y rompe el Swiper (doble init, dos fotos a la vez). */
  }

  function initSiteChrome() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const toggle = header.querySelector(".site-nav-toggle");
    const nav = header.querySelector(".site-nav");

    if (nav && !nav.querySelector('a[href*="proximamente.html"]')) {
      const contactoLink = nav.querySelector('a[href*="contacto.html"]');
      const proxLink = document.createElement("a");
      proxLink.href = "proximamente.html";
      proxLink.textContent = "Próximamente";
      if (document.body.classList.contains("pagina-proximamente")) {
        proxLink.className = "active";
      }
      if (contactoLink) contactoLink.before(proxLink);
      else nav.insertBefore(proxLink, nav.querySelector(".nav-instagram"));
    }

    if (toggle && nav) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        header.classList.toggle("nav-open");
        const open = header.classList.contains("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.innerHTML = open
          ? '<i class="fa fa-times" aria-hidden="true"></i>'
          : '<i class="fa fa-bars" aria-hidden="true"></i>';
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          header.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';
        });
      });

      document.addEventListener("click", (e) => {
        if (!header.contains(e.target)) {
          header.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';
        }
      });
    }

    const scrollTopBtn = document.getElementById("scroll-top");
    if (scrollTopBtn) {
      window.addEventListener("scroll", () => {
        scrollTopBtn.classList.toggle("visible", window.scrollY > 320);
      });
      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    function revealOnScroll() {
      document.querySelectorAll(".reveal").forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 80) el.classList.add("active");
      });
    }

    window.addEventListener("scroll", revealOnScroll);
    window.addEventListener("load", revealOnScroll);

    const paginasConHome = [
      "pagina-conocenos",
      "pagina-productos",
      "pagina-catalogo",
      "pagina-contacto"
    ];
    const necesitaHome = paginasConHome.some((c) => document.body.classList.contains(c));
    if (necesitaHome && !document.querySelector(".barra-home-back")) {
      const barra = document.createElement("div");
      barra.className = "barra-home-back";
      barra.innerHTML = '<a href="index.html" class="btn-home-back"><i class="fa fa-house" aria-hidden="true"></i> Volver a Home</a>';
      header.insertAdjacentElement("afterend", barra);
    }

    initLazyImages();
    initBotonesCatalogoCategoria();
  }

  /** Fichas de producto: botón Catálogo → PDF (por si el HTML sigue siendo <button>) */
  function initBotonesCatalogoCategoria() {
    var ARCHIVO = { "Luminaria de Pileta": "catalogo/catalogo-luminaria-pileta.pdf" };
    function slug(n) {
      return n
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
    function pdfUrl(cat) {
      if (!cat) return "";
      if (ARCHIVO[cat]) return ARCHIVO[cat];
      return "catalogo/catalogo-" + slug(cat) + ".pdf";
    }
    document.querySelectorAll(".boton-descargas").forEach(function (el) {
      if (el.tagName === "A" && el.getAttribute("href")) return;
      if (el.dataset.catalogoListo === "1") return;
      var text = (el.textContent || "").trim();
      var cat = text.indexOf("Catálogo ") === 0 ? text.slice(9).trim() : "";
      if (!cat) cat = (document.body.getAttribute("data-categoria") || "").trim();
      var pdf = pdfUrl(cat);
      if (!pdf) return;
      var a = document.createElement("a");
      a.href = pdf;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = el.className;
      a.textContent = text || "Catálogo " + cat;
      a.dataset.catalogoListo = "1";
      el.replaceWith(a);
    });
  }

  /** Paso 4: no descargar de golpe fotos que están abajo del scroll */
  function initLazyImages() {
    var gridImgs = document.querySelectorAll(".cat-catalog-grid img");
    gridImgs.forEach(function (img, idx) {
      if (idx < 6) {
        img.loading = "eager";
        img.decoding = "async";
      } else {
        img.loading = "lazy";
        img.decoding = "async";
        if ("fetchPriority" in img) img.fetchPriority = "low";
      }
    });

    function esImagenPrioritaria(img) {
      if (img.closest(".cat-catalog-grid")) return true;
      if (img.closest(".site-logo, .hero, .hero-swiper")) return true;
      if (img.getAttribute("loading") === "eager" || img.dataset.lcp === "eager") return true;
      var slide = img.closest(".swiper-slide");
      if (slide && slide.parentElement && slide.parentElement.querySelector(".swiper-slide") === slide) {
        return true;
      }
      return false;
    }

    document.querySelectorAll("img").forEach(function (img) {
      if (img.closest(".site-logo") && "fetchPriority" in img) {
        img.fetchPriority = "high";
      }
      if (esImagenPrioritaria(img)) return;
      if (!img.hasAttribute("loading")) img.loading = "lazy";
      if (!img.hasAttribute("decoding")) img.decoding = "async";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteChrome);
  } else {
    initSiteChrome();
  }
})();
