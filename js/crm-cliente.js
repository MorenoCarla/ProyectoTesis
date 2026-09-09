const usuario = verificarSesion(["cliente"]);
if (!usuario) throw new Error("Sin sesión");

let perfilCliente = null;

document.getElementById("nombreUsuario").textContent = usuario.nombre + " " + (usuario.apellido || "");

const saludoNombre = document.getElementById("clienteSaludoNombre");
if (saludoNombre) saludoNombre.textContent = usuario.nombre || "Cliente";

function escaparHtml(texto) {
  if (texto == null) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.querySelectorAll(".menu-item[data-section]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
    document.getElementById("tituloSeccion").textContent = btn.textContent.trim();
    if (btn.dataset.section === "mi-perfil") cargarMiPerfil();
  });
});

function irSeccion(id) {
  const btn = document.querySelector(`.menu-item[data-section="${id}"]`);
  if (btn) btn.click();
}

function toast(msg, err) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (err ? " error" : "");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function actualizarAvisoPerfil() {
  const aviso = document.getElementById("avisoPerfilIncompleto");
  if (!aviso) return;
  aviso.style.display = perfilCliente?.perfil_incompleto ? "block" : "none";
}

function toggleRubroPerfilCliente() {
  const tipo = document.getElementById("perfilTipoCliente")?.value;
  const wrap = document.getElementById("wrapPerfilRubro");
  const rubro = document.getElementById("perfilRubro");
  const pro = ["profesional", "empresa", "municipalidad"].includes(tipo);
  if (wrap) wrap.style.display = pro ? "block" : "none";
  if (rubro) rubro.required = pro;
}

async function cargarMiPerfil() {
  try {
    perfilCliente = await apiGet("/clientes/mi-perfil");
    document.getElementById("perfilNombre").value = perfilCliente.nombre || "";
    document.getElementById("perfilApellido").value = perfilCliente.apellido || "";
    document.getElementById("perfilEmail").value = perfilCliente.email || usuario.email;
    document.getElementById("perfilTelefono").value = perfilCliente.telefono || "";
    document.getElementById("perfilCiudad").value = perfilCliente.ciudad || "";
    document.getElementById("perfilEmpresa").value = perfilCliente.empresa || "";
    document.getElementById("perfilTipoCliente").value = perfilCliente.tipo_cliente || "particular";
    document.getElementById("perfilRubro").value = perfilCliente.rubro || "";
    document.getElementById("perfilNacimiento").value = perfilCliente.fecha_nacimiento
      ? String(perfilCliente.fecha_nacimiento).slice(0, 10)
      : "";
    toggleRubroPerfilCliente();
    actualizarAvisoPerfil();
  } catch (e) {
    toast(e.message, true);
  }
}

async function guardarMiPerfil(e) {
  e.preventDefault();
  toggleRubroPerfilCliente();

  const tipo = document.getElementById("perfilTipoCliente").value;
  const rubro = document.getElementById("perfilRubro").value;
  if (["profesional", "empresa", "municipalidad"].includes(tipo) && !rubro) {
    toast("Seleccioná tu rubro o actividad", true);
    return;
  }

  try {
    const res = await apiPut("/clientes/mi-perfil", {
      nombre: document.getElementById("perfilNombre").value,
      apellido: document.getElementById("perfilApellido").value,
      telefono: document.getElementById("perfilTelefono").value,
      ciudad: document.getElementById("perfilCiudad").value,
      empresa: document.getElementById("perfilEmpresa").value,
      tipo_cliente: tipo,
      rubro: tipo === "particular" ? null : rubro,
      fecha_nacimiento: document.getElementById("perfilNacimiento").value || null
    });
    perfilCliente = { ...res.cliente, perfil_incompleto: res.perfil_incompleto };
    actualizarAvisoPerfil();
    toast("Perfil guardado correctamente");
  } catch (e) {
    toast(e.message, true);
  }
}

document.getElementById("perfilTipoCliente")?.addEventListener("change", toggleRubroPerfilCliente);

async function cargarTipos() {
  const res = await fetch(API_URL + "/public/tipos-consulta");
  const tipos = await res.json();
  document.getElementById("tipoConsulta").innerHTML = tipos
    .map(t => `<option value="${t.nombre}">${t.nombre}</option>`)
    .join("");
}

async function cargarMisConsultas() {
  try {
    const consultas = await apiGet("/consultas");
    const lista = document.getElementById("listaConsultasCliente");
    if (!lista) return;

    if (consultas.length === 0) {
      lista.innerHTML = `
        <div class="cliente-vacio">
          <i class="fa fa-inbox" aria-hidden="true"></i>
          <p>Todavía no enviaste consultas.<br>Contanos qué necesitás y el equipo Ituarte te responde.</p>
          <button type="button" class="btn btn-primary" onclick="irSeccion('nueva-consulta')">
            <i class="fa fa-paper-plane" aria-hidden="true"></i> Enviar mi primera consulta
          </button>
        </div>`;
      return;
    }

    lista.innerHTML = consultas.map(c => `
      <article class="cliente-consulta-card">
        <div class="cliente-consulta-top">
          <strong>Consulta #${c.id}</strong>
          ${badgeEstado(c.estado)}
        </div>
        <div class="cliente-consulta-datos">
          <span><i class="fa fa-tag" aria-hidden="true"></i>${escaparHtml(c.tipo_consulta)}</span>
          <span><i class="fa fa-lightbulb" aria-hidden="true"></i>${escaparHtml(c.producto_interes || "Sin producto indicado")}</span>
          <span><i class="fa fa-calendar" aria-hidden="true"></i>Enviada el ${formatearFecha(c.creado_en)}</span>
        </div>
        <div class="cliente-consulta-acciones">
          <button type="button" class="btn btn-secondary btn-sm" onclick="verDetalle(${c.id})">Ver detalle</button>
        </div>
      </article>
    `).join("");
  } catch (e) {
    toast(e.message, true);
  }
}

async function verDetalle(id) {
  try {
    const c = await apiGet("/consultas/" + id);
    document.getElementById("detalleId").textContent = id;
    document.getElementById("detalleContenido").innerHTML = `
      <div class="detalle-grid">
        <div><strong>Tipo</strong>${c.tipo_consulta}</div>
        <div><strong>Estado</strong>${badgeEstado(c.estado)}</div>
        <div><strong>Producto</strong>${c.producto_interes || "—"}</div>
        <div><strong>Fecha</strong>${formatearFecha(c.creado_en)}</div>
        <div style="grid-column:1/-1"><strong>Mensaje</strong>${c.mensaje}</div>
      </div>
      <h3 style="font-size:15px;margin-bottom:10px;">Seguimientos del equipo</h3>
      ${(c.seguimientos || []).map(s => `
        <div class="seguimiento-item">${s.nota}<small>${formatearFecha(s.creado_en)}</small></div>
      `).join("") || "<p style='color:#64748b;font-size:13px;'>Aún no hay seguimientos</p>"}
    `;
    document.getElementById("modalDetalle").classList.add("open");
  } catch (e) {
    toast(e.message, true);
  }
}

async function enviarConsulta(e) {
  e.preventDefault();

  if (!perfilCliente) {
    try {
      perfilCliente = await apiGet("/clientes/mi-perfil");
    } catch {
      toast("Completá tu perfil antes de enviar consultas", true);
      irSeccion("mi-perfil");
      return;
    }
  }

  if (perfilCliente.perfil_incompleto) {
    toast("Completá teléfono, ciudad y rubro en Mi perfil", true);
    irSeccion("mi-perfil");
    return;
  }

  try {
    const res = await fetch(API_URL + "/public/consulta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: perfilCliente.nombre || usuario.nombre,
        apellido: perfilCliente.apellido || usuario.apellido || "",
        email: perfilCliente.email || usuario.email,
        telefono: perfilCliente.telefono,
        ciudad: perfilCliente.ciudad,
        tipo_cliente: perfilCliente.tipo_cliente,
        rubro: perfilCliente.rubro,
        empresa: perfilCliente.empresa,
        fecha_nacimiento: perfilCliente.fecha_nacimiento,
        mensaje: document.getElementById("mensajeConsulta").value,
        producto: document.getElementById("productoInteres").value,
        tipo_consulta: document.getElementById("tipoConsulta").value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al enviar");

    toast("Consulta enviada correctamente");
    document.getElementById("formNuevaConsulta").reset();
    await cargarMisConsultas();
  } catch (err) {
    toast(err.message || "Error al enviar", true);
  }
}

cargarTipos();
cargarMiPerfil().then(() => cargarMisConsultas());
