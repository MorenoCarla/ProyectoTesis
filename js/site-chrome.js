(function () {
  /* Versión del chrome: subir número cuando cambie site-chrome.css */
  var SITE_CHROME_CSS_V = "11";
  document.querySelectorAll('link[href*="site-chrome.css"]').forEach(function (link) {
    var href = link.getAttribute("href") || "";
    var base = href.split("?")[0];
    if (!href.includes("v=" + SITE_CHROME_CSS_V)) {
      link.setAttribute("href", base + "?v=" + SITE_CHROME_CSS_V);
    }
  });

  function initSiteChrome() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const toggle = header.querySelector(".site-nav-toggle");
    const nav = header.querySelector(".site-nav");

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
  }

  /** Paso 4: no descargar de golpe fotos que están abajo del scroll */
  function initLazyImages() {
    function esImagenPrioritaria(img) {
      if (img.closest(".site-logo, .hero, .hero-swiper")) return true;
      if (img.getAttribute("loading") === "eager" || img.dataset.lcp === "eager") return true;
      const slide = img.closest(".swiper-slide");
      if (slide && slide.parentElement && slide.parentElement.querySelector(".swiper-slide") === slide) {
        return true;
      }
      return false;
    }

    document.querySelectorAll("img").forEach((img) => {
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
