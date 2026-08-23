document.addEventListener("DOMContentLoaded", () => {

  // Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });

  configurarFormulario("formTecnico", () => ({
    nombre: val("nombre"),
    apellido: val("apellido"),
    email: val("email"),
    telefono: val("telefono"),
    ciudad: val("ciudad"),
    producto: val("productoTecnico") || "Consulta técnica",
    tipo_consulta: "Consulta técnica",
    mensaje: `[Equipo/instalación: ${val("productoTecnico") || "No especificado"}]\n\n${val("mensaje")}`
  }));

  configurarFormulario("formComercial", () => ({
    nombre: val("nombreComercial"),
    apellido: val("apellidoComercial"),
    email: val("emailComercial"),
    telefono: val("telefonoComercial"),
    ciudad: val("ciudadComercial"),
    producto: val("productoComercial") || "Consulta comercial",
    tipo_consulta: "Consulta comercial",
    mensaje: `[Cantidad aprox.: ${val("cantidadComercial") || "No indicada"}]\n\n${val("mensajeComercial")}`
  }));

  configurarFormulario("formAsesoramiento", () => ({
    nombre: val("nombreAsesoramiento"),
    apellido: val("apellidoAsesoramiento"),
    email: val("emailAsesoramiento"),
    telefono: val("telefonoAsesoramiento"),
    ciudad: val("ciudadAsesoramiento"),
    producto: "Asesoramiento lumínico",
    tipo_consulta: "Asesoramiento lumínico",
    mensaje: `[Sucursal: ${val("sucursalAsesoramiento")} | Tipo de espacio: ${val("tipoEspacio")}]\n\n${val("mensajeAsesoramiento")}`
  }));

  configurarFormulario("formQueja", () => ({
    nombre: val("nombreQueja"),
    apellido: val("apellidoQueja"),
    email: val("emailQueja"),
    telefono: val("telefonoQueja"),
    ciudad: val("ciudadQueja"),
    producto: val("productoQueja") || "Queja / reclamo",
    tipo_consulta: "Queja o reclamo",
    prioridad: "alta",
    mensaje: `[Sucursal: ${val("sucursalQueja")} | N° factura/pedido: ${val("nroReferencia") || "No indicado"}]\n\n${val("mensajeQueja")}`
  }));
});

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

async function enviarAlCRM(datos) {
  const res = await fetch("http://localhost:3000/public/consulta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al enviar");
  return data;
}

function configurarFormulario(formId, obtenerDatos) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Enviando...";

    try {
      await enviarAlCRM(obtenerDatos());
      alert("¡Mensaje enviado correctamente! Nos comunicaremos a la brevedad.");
      form.reset();
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo enviar. Verificá que el servidor esté corriendo.");
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  });
}

function revealOnScroll() {
  document.querySelectorAll(".reveal").forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add("active");
    else el.classList.remove("active");
  });
}
window.addEventListener("scroll", revealOnScroll);
