const usuario = verificarSesion(["cliente"]);
if (!usuario) throw new Error("Sin sesión");

document.getElementById("nombreUsuario").textContent = usuario.nombre + " " + (usuario.apellido || "");

document.querySelectorAll(".menu-item[data-section]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
    document.getElementById("tituloSeccion").textContent = btn.textContent.trim();
  });
});

function toast(msg, err) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (err ? " error" : "");
  setTimeout(() => t.classList.remove("show"), 3000);
}

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
    const tbody = document.getElementById("tablaConsultasCliente");

    if (consultas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#64748b;">No tenés consultas aún</td></tr>`;
      return;
    }

    tbody.innerHTML = consultas.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.tipo_consulta}</td>
        <td>${c.producto_interes || "—"}</td>
        <td>${badgeEstado(c.estado)}</td>
        <td>${formatearFecha(c.creado_en)}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="verDetalle(${c.id})">Ver</button></td>
      </tr>
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
  try {
    await fetch(API_URL + "/public/consulta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: usuario.nombre,
        apellido: usuario.apellido || "",
        email: usuario.email,
        mensaje: document.getElementById("mensajeConsulta").value,
        producto: document.getElementById("productoInteres").value,
        tipo_consulta: document.getElementById("tipoConsulta").value
      })
    });
    toast("Consulta enviada correctamente");
    document.getElementById("formNuevaConsulta").reset();
    await cargarMisConsultas();
  } catch {
    toast("Error al enviar", true);
  }
}

cargarTipos();
cargarMisConsultas();
