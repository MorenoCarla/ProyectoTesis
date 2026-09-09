/** Campos de perfil comercial compartidos (contacto, registro, productos, portal cliente) */

const PERFIL_RUBRO_OPCIONES = [
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

function htmlOpcionesRubro(seleccionado) {
  return PERFIL_RUBRO_OPCIONES.map((o) =>
    `<option value="${o.value}"${seleccionado === o.value ? " selected" : ""}>${o.label}</option>`
  ).join("");
}

function insertarBloquePerfilComercial(formulario, sufijo) {
  if (!formulario || formulario.querySelector(`[data-perfil-sufijo="${sufijo}"]`)) return;

  const boton = formulario.querySelector('button[type="submit"]');
  const fieldset = document.createElement("fieldset");
  fieldset.className = "perfil-comercial-bloque";
  fieldset.dataset.perfilSufijo = sufijo;
  fieldset.innerHTML = `
    <legend>Perfil comercial <span>· nos ayuda a asesorarte mejor</span></legend>
    <div class="form-fila">
      <div class="form-campo">
        <label>Tipo de cliente *</label>
        <select id="tipoCliente${sufijo}" name="tipo_cliente" required class="perfil-tipo-cliente">
          <option value="" disabled selected hidden>Seleccioná...</option>
          <option value="particular">Particular / Hogar</option>
          <option value="profesional">Profesional</option>
          <option value="empresa">Empresa / Comercio</option>
          <option value="municipalidad">Municipalidad / Institución</option>
        </select>
      </div>
      <div class="form-campo">
        <label>Fecha de nacimiento <small>(opcional · beneficios)</small></label>
        <input type="date" id="fechaNacimiento${sufijo}" name="fecha_nacimiento">
      </div>
    </div>
    <div class="form-fila perfil-campo-rubro" id="wrapRubro${sufijo}" hidden>
      <div class="form-campo">
        <label>Rubro o actividad *</label>
        <select id="rubro${sufijo}" name="rubro" class="perfil-rubro">
          <option value="" disabled selected hidden>Seleccioná...</option>
          ${htmlOpcionesRubro()}
        </select>
      </div>
      <div class="form-campo">
        <label>Empresa, estudio u organización</label>
        <input type="text" id="empresa${sufijo}" name="empresa" placeholder="Ej: Estudio López, Ferretería Sur">
      </div>
    </div>
  `;

  if (boton) formulario.insertBefore(fieldset, boton);
  else formulario.appendChild(fieldset);

  enlazarPerfilComercial(sufijo);
}

/** Variante compacta para fichas de producto (grid de 2 columnas, sin caja pesada) */
function insertarBloquePerfilComercialProducto(formulario) {
  const sufijo = "Producto";
  if (!formulario || formulario.querySelector(`[data-perfil-sufijo="${sufijo}"]`)) return;

  const mensajeCampo = formulario.querySelector("#mensaje")?.closest(".form-campo--full")
    || formulario.querySelector("#mensaje")?.parentElement;
  const seccion = document.createElement("div");
  seccion.className = "form-producto-seccion-perfil";
  seccion.dataset.perfilSufijo = sufijo;
  seccion.innerHTML = `
    <p class="form-producto-seccion-titulo">Sobre vos <span>· nos ayuda a asesorarte</span></p>
    <div class="form-producto-grid">
      <div class="form-campo">
        <label for="tipoCliente${sufijo}">Tipo de cliente *</label>
        <select id="tipoCliente${sufijo}" required class="perfil-tipo-cliente">
          <option value="" disabled selected hidden>Seleccioná...</option>
          <option value="particular">Particular / Hogar</option>
          <option value="profesional">Profesional</option>
          <option value="empresa">Empresa / Comercio</option>
          <option value="municipalidad">Municipalidad / Institución</option>
        </select>
      </div>
      <div class="form-campo">
        <label for="fechaNacimiento${sufijo}">Fecha de nacimiento <span class="perfil-opcional">(opcional)</span></label>
        <input type="date" id="fechaNacimiento${sufijo}">
      </div>
    </div>
    <div id="wrapRubro${sufijo}" class="form-producto-grid perfil-campo-rubro" hidden>
      <div class="form-campo">
        <label for="rubro${sufijo}">Rubro o actividad *</label>
        <select id="rubro${sufijo}" class="perfil-rubro">
          <option value="" disabled selected hidden>Seleccioná...</option>
          ${htmlOpcionesRubro()}
        </select>
      </div>
      <div class="form-campo">
        <label for="empresa${sufijo}">Empresa u organización</label>
        <input type="text" id="empresa${sufijo}" placeholder="Opcional">
      </div>
    </div>
  `;

  if (mensajeCampo) formulario.insertBefore(seccion, mensajeCampo);
  else formulario.appendChild(seccion);

  enlazarPerfilComercial(sufijo);
}

function estandarizarFormularioProducto(form) {
  if (!form || form.dataset.estandarizado === "1") return;
  form.dataset.estandarizado = "1";
  form.id = "formConsultaProducto";
  form.className = "form-producto-consulta";

  form.innerHTML = `
    <div class="form-producto-grid">
      <div class="form-campo">
        <label for="nombre">Nombre *</label>
        <input type="text" id="nombre" required placeholder="Tu nombre">
      </div>
      <div class="form-campo">
        <label for="apellido">Apellido</label>
        <input type="text" id="apellido" placeholder="Tu apellido">
      </div>
      <div class="form-campo">
        <label for="email">Email *</label>
        <input type="email" id="email" required placeholder="tu@email.com">
      </div>
      <div class="form-campo">
        <label for="telefono">Teléfono *</label>
        <input type="tel" id="telefono" required placeholder="3865...">
      </div>
      <div class="form-campo form-campo--full">
        <label for="ciudad">Ciudad *</label>
        <input type="text" id="ciudad" required placeholder="Concepción">
      </div>
    </div>
    <div class="form-campo form-campo--full">
      <label for="mensaje">Mensaje *</label>
      <textarea id="mensaje" rows="3" required placeholder="Tu consulta sobre este producto..."></textarea>
    </div>
  `;

  insertarBloquePerfilComercialProducto(form);

  const contenedor = form.closest(".formulario");
  if (contenedor && !contenedor.querySelector(".btn-enviar-producto")) {
    const btn = document.createElement("button");
    btn.type = "submit";
    btn.className = "btn-enviar-producto";
    btn.setAttribute("form", "formConsultaProducto");
    btn.textContent = "Enviar consulta";
    contenedor.appendChild(btn);
  }
}

function enlazarPerfilComercial(sufijo) {
  const tipo = document.getElementById(`tipoCliente${sufijo}`);
  const wrapRubro = document.getElementById(`wrapRubro${sufijo}`);
  const rubro = document.getElementById(`rubro${sufijo}`);
  if (!tipo) return;

  const actualizar = () => {
    const valor = tipo.value;
    const profesional = ["profesional", "empresa", "municipalidad"].includes(valor);

    if (wrapRubro) wrapRubro.hidden = !profesional;
    if (rubro) rubro.required = profesional;

    if (valor === "municipalidad" && rubro) {
      rubro.value = rubro.value || "municipalidad";
    }
  };

  tipo.addEventListener("change", actualizar);
  actualizar();
}

function leerPerfilComercial(sufijo) {
  const tipo = document.getElementById(`tipoCliente${sufijo}`)?.value || "";
  const rubroEl = document.getElementById(`rubro${sufijo}`);
  const rubro = rubroEl?.value || null;
  const empresa = document.getElementById(`empresa${sufijo}`)?.value.trim() || null;
  const fecha = document.getElementById(`fechaNacimiento${sufijo}`)?.value || null;

  return {
    tipo_cliente: tipo || null,
    rubro: tipo === "particular" ? null : rubro,
    empresa,
    fecha_nacimiento: fecha
  };
}

function validarPerfilComercialFront(sufijo) {
  const perfil = leerPerfilComercial(sufijo);
  if (!perfil.tipo_cliente) {
    return "Seleccioná el tipo de cliente (particular, profesional, etc.)";
  }
  if (["profesional", "empresa", "municipalidad"].includes(perfil.tipo_cliente) && !perfil.rubro) {
    return "Seleccioná tu rubro o actividad";
  }
  return null;
}

function rellenarPerfilComercial(sufijo, datos = {}) {
  const tipo = document.getElementById(`tipoCliente${sufijo}`);
  if (tipo && datos.tipo_cliente) tipo.value = datos.tipo_cliente;

  const rubro = document.getElementById(`rubro${sufijo}`);
  if (rubro && datos.rubro) rubro.value = datos.rubro;

  const empresa = document.getElementById(`empresa${sufijo}`);
  if (empresa && datos.empresa) empresa.value = datos.empresa;

  const fecha = document.getElementById(`fechaNacimiento${sufijo}`);
  if (fecha && datos.fecha_nacimiento) {
    fecha.value = String(datos.fecha_nacimiento).slice(0, 10);
  }

  if (tipo) tipo.dispatchEvent(new Event("change"));
}
