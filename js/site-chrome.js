(function () {
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteChrome);
  } else {
    initSiteChrome();
  }
})();
