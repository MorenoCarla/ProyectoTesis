/**
 * Sidebar deslizable en móvil para CRM admin y cliente.
 */
(function () {
  function initCrmSidebar() {
    const layout = document.querySelector(".layout");
    const sidebar = document.querySelector(".sidebar");
    const topbar = document.querySelector(".topbar");
    if (!layout || !sidebar || !topbar || topbar.querySelector(".crm-nav-toggle")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "crm-nav-toggle";
    toggle.setAttribute("aria-label", "Abrir menú");
    toggle.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';

    const overlay = document.createElement("div");
    overlay.className = "crm-sidebar-overlay";
    overlay.setAttribute("aria-hidden", "true");
    layout.appendChild(overlay);

    topbar.prepend(toggle);

    function closeSidebar() {
      document.body.classList.remove("crm-sidebar-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';
    }

    function openSidebar() {
      document.body.classList.add("crm-sidebar-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
    }

    toggle.addEventListener("click", () => {
      if (document.body.classList.contains("crm-sidebar-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener("click", closeSidebar);

    sidebar.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (window.innerWidth <= 992) closeSidebar();
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 992) closeSidebar();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCrmSidebar);
  } else {
    initCrmSidebar();
  }
})();
