document.addEventListener("DOMContentLoaded", () => {

  console.log("JS cargado");

  // 🔹 TABS
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });

  // 🔥 FORMULARIO (solo el primero por ahora)
  const form = document.getElementById("formContacto");

  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();

      console.log("FORM ENVIADO");

      const cliente = {
        nombre: document.getElementById("nombre").value,
        ciudad: document.getElementById("ciudad").value,
        email: document.getElementById("email").value,
        telefono: document.getElementById("telefono").value,
        mensaje: document.getElementById("mensaje").value,
        producto: "Consulta técnica"
      };

      fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cliente)
      })
      .then(res => res.text())
      .then(() => {
        alert("Consulta enviada correctamente");
        form.reset(); // limpia el form después de enviar
      })
      .catch(err => {
        console.error("Error:", err);
      });
    });
  }

});

// 🔹 EFECTO SCROLL
function revealOnScroll() {
  const elements = document.querySelectorAll('.reveal');

  elements.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    const elementVisible = 100;

    if (elementTop < windowHeight - elementVisible) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);