/** Perfil comercial y layout del formulario de producto (como en catálogo / defensa). */

const RUBRO_OPCIONES = [
  { value: "", label: "Seleccioná…" },
  { value: "arquitecto", label: "Arquitecto" },
  { value: "ingeniero", label: "Ingeniero" },
  { value: "electricista", label: "Electricista" },
  { value: "diseñador_interiores", label: "Diseñador de interiores" },
  { value: "constructor", label: "Constructor" },
  { value: "municipalidad", label: "Municipalidad / Alumbrado público" },
  { value: "empresa_industrial", label: "Empresa industrial" },
  { value: "comercio", label: "Comercio" },
  { value: "otro", label: "Otro" }
];

function opcionesRubroHtml() {
  return RUBRO_OPCIONES.map(
    (o) => `<option value="${o.value}">${o.label}</option>`
  ).join("");
}

function leerPerfilComercial(suffix) {
  const s = suffix || "";
  const tipo = document.getElementById("tipoCliente" + s);
  const rubro = document.getElementById("rubro" + s);
  const empresa = document.getElementById("empresa" + s);
  const fecha = document.getElementById("fechaNacimiento" + s);
  return {
    tipo_cliente: tipo && tipo.value ? tipo.value : "particular",
    rubro: rubro && rubro.value ? rubro.value : null,
    empresa: empresa && empresa.value.trim() ? empresa.value.trim() : null,
    fecha_nacimiento:
      fecha && fecha.value ? fecha.value : null
  };
}

function mejorarFormularioProducto() {
  const form = document.querySelector(".formulario form");
  if (!form || form.dataset.layoutProducto === "2") return;

  const btnOld = form.querySelector('button[type="submit"]');
  const btnText = btnOld ? btnOld.textContent.trim() : "Enviar";

  form.classList.add("form-consulta-producto");
  form.innerHTML = `
    <div class="form-producto-scroll">
      <div class="form-producto-grid">
        <div class="form-producto-campo">
          <label for="nombre">Nombre <span class="form-req">*</span></label>
          <input type="text" id="nombre" placeholder="Tu nombre" required autocomplete="given-name">
        </div>
        <div class="form-producto-campo">
          <label for="apellido">Apellido</label>
          <input type="text" id="apellido" placeholder="Tu apellido" autocomplete="family-name">
        </div>
        <div class="form-producto-campo">
          <label for="email">Email <span class="form-req">*</span></label>
          <input type="email" id="email" placeholder="tu@email.com" required autocomplete="email">
        </div>
        <div class="form-producto-campo">
          <label for="telefono">Teléfono <span class="form-req">*</span></label>
          <input type="tel" id="telefono" placeholder="3865…" required autocomplete="tel">
        </div>
        <div class="form-producto-campo form-producto-campo--full">
          <label for="ciudad">Ciudad <span class="form-req">*</span></label>
          <input type="text" id="ciudad" placeholder="Concepción" required autocomplete="address-level2">
        </div>
      </div>

      <div class="form-sobre-vos">
        <p class="form-sobre-vos-titulo">
          <span class="form-sobre-vos-marca">SOBRE VOS</span>
          <span class="form-sobre-vos-sub">· nos ayuda a asesorarte</span>
        </p>
        <div class="form-producto-grid">
          <div class="form-producto-campo">
            <label for="tipoClienteProducto">Tipo de cliente <span class="form-req">*</span></label>
            <select id="tipoClienteProducto" required>
              <option value="" disabled selected>Seleccioná…</option>
              <option value="particular">Particular</option>
              <option value="profesional">Profesional</option>
              <option value="empresa">Empresa</option>
              <option value="municipalidad">Municipalidad</option>
            </select>
          </div>
          <div class="form-producto-campo">
            <label for="fechaNacimientoProducto">Fecha de nacimiento <span class="form-opc">(opcional)</span></label>
            <input type="date" id="fechaNacimientoProducto">
          </div>
          <div class="form-producto-campo">
            <label for="rubroProducto">Rubro o actividad <span class="form-req">*</span></label>
            <select id="rubroProducto" required>${opcionesRubroHtml()}</select>
          </div>
          <div class="form-producto-campo">
            <label for="empresaProducto">Empresa u organización</label>
            <input type="text" id="empresaProducto" placeholder="Opcional">
          </div>
        </div>
      </div>

      <div class="form-producto-campo form-producto-campo--full form-producto-mensaje">
        <label for="mensaje">Mensaje <span class="form-req">*</span></label>
        <textarea id="mensaje" rows="3" placeholder="Tu consulta sobre este producto…" required></textarea>
      </div>
    </div>
    <button type="submit">${btnText}</button>
  `;

  form.dataset.layoutProducto = "2";
}

function inyectarPerfilComercialEnFormularioProducto() {
  mejorarFormularioProducto();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".formulario form")) {
    inyectarPerfilComercialEnFormularioProducto();
  }
});
