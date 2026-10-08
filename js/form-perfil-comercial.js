/** Campos de perfil comercial (tipo, rubro, empresa) — sitio web y registro */

function htmlSelectTipoCliente(id) {
  return `<div class="form-campo"><label>Tipo de cliente</label>
    <select id="${id}">
      <option value="particular">Particular</option>
      <option value="profesional">Profesional</option>
      <option value="empresa">Empresa</option>
      <option value="municipalidad">Municipalidad</option>
    </select></div>`;
}

function htmlSelectRubro(id) {
  return `<div class="form-campo"><label>Rubro / Profesión</label>
    <select id="${id}">
      <option value="">Sin especificar</option>
      <option value="arquitecto">Arquitecto</option>
      <option value="ingeniero">Ingeniero</option>
      <option value="electricista">Electricista</option>
      <option value="diseñador_interiores">Diseñador de interiores</option>
      <option value="constructor">Constructor</option>
      <option value="municipalidad">Municipalidad / Alumbrado público</option>
      <option value="empresa_industrial">Empresa industrial</option>
      <option value="comercio">Comercio</option>
      <option value="otro">Otro</option>
    </select></div>`;
}

function htmlEmpresa(id) {
  return `<div class="form-campo"><label>Empresa / Estudio</label>
    <input type="text" id="${id}" placeholder="Opcional"></div>`;
}

/** suffix: '' → tipoCliente; 'Comercial' → tipoClienteComercial */
function leerPerfilComercial(suffix) {
  const s = suffix || "";
  const tipo = document.getElementById("tipoCliente" + s);
  const rubro = document.getElementById("rubro" + s);
  const empresa = document.getElementById("empresa" + s);
  return {
    tipo_cliente: tipo && tipo.value ? tipo.value : "particular",
    rubro: rubro && rubro.value ? rubro.value : null,
    empresa: empresa && empresa.value.trim() ? empresa.value.trim() : null
  };
}

function inyectarPerfilEnFormulario(formId, suffix, antesDeSelector) {
  const form = document.getElementById(formId);
  if (!form || form.querySelector("[data-perfil-comercial]")) return;

  const s = suffix || "";
  const anchor =
    form.querySelector(antesDeSelector) ||
    form.querySelector("textarea") ||
    form.querySelector('button[type="submit"]');
  if (!anchor) return;

  const wrap = document.createElement("div");
  wrap.setAttribute("data-perfil-comercial", "1");
  wrap.className = "form-fila form-perfil-comercial";
  wrap.innerHTML =
    htmlSelectTipoCliente("tipoCliente" + s) +
    htmlSelectRubro("rubro" + s) +
    htmlEmpresa("empresa" + s);

  anchor.parentNode.insertBefore(wrap, anchor);
}

document.addEventListener("DOMContentLoaded", () => {
  inyectarPerfilEnFormulario("formTecnico", "", "textarea");
  inyectarPerfilEnFormulario("formComercial", "Comercial", "textarea");
  inyectarPerfilEnFormulario("formAsesoramiento", "Asesoramiento", "textarea");
  inyectarPerfilEnFormulario("formQueja", "Queja", "textarea");
});
