document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      // desactivar todos los botones y contenido
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      // activar el botón clickeado
      btn.classList.add("active");
      // mostrar el contenido correspondiente
      document.getElementById(targetTab).classList.add("active");
    });
  });
});
