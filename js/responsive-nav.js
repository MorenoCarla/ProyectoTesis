/**
 * Menú hamburguesa para headers con .nav-links o .navbar > .menu
 * Se carga desde los JS principales de cada sección del sitio.
 */
(function () {
  function setupNavToggle(header, navEl) {
    if (!navEl || header.querySelector(".nav-toggle")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "Abrir menú de navegación");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';

    const logo = header.querySelector(".logo");
    if (logo) {
      logo.after(btn);
    } else {
      header.prepend(btn);
    }

    function closeNav() {
      header.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = header.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = open
        ? '<i class="fa fa-times" aria-hidden="true"></i>'
        : '<i class="fa fa-bars" aria-hidden="true"></i>';
    });

    navEl.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("click", (e) => {
      if (!header.contains(e.target)) closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 992) closeNav();
    });
  }

  function initResponsiveNav() {
    const header = document.querySelector("header");
    if (!header) return;

    const navLinks = header.querySelector(".nav-links");
    const mainMenu = header.querySelector(".navbar > .menu:not(#menu)");

    if (navLinks) {
      setupNavToggle(header, navLinks);
    } else if (mainMenu) {
      setupNavToggle(header, mainMenu);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResponsiveNav);
  } else {
    initResponsiveNav();
  }
})();
