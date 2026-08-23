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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteChrome);
  } else {
    initSiteChrome();
  }
})();
