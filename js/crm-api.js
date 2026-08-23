// Si abrís el CRM desde http://localhost:3000/login.html usa la misma URL.
// Si lo abrís con doble clic o Live Server, apunta al backend en el puerto 3000.
const API_URL =
  window.location.port === "3000" && window.location.protocol.startsWith("http")
    ? ""
    : "http://localhost:3000";

async function leerRespuesta(res) {
  const texto = await res.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch {
    if (texto.trim().startsWith("<")) {
      if (res.status === 404) {
        throw new Error(
          "Ruta no encontrada en el servidor (" + res.status + "). " +
          "Detené el backend con Ctrl+C y volvé a ejecutar: npm start en la carpeta backend."
        );
      }
      throw new Error(
        "El servidor respondió HTML en lugar de JSON (" + res.status + "). " +
        "Abrí http://localhost:3000/login.html y reiniciá el backend (npm start)."
      );
    }
    throw new Error("El servidor respondió de forma inesperada (" + res.status + ")");
  }
}

async function fetchApi(ruta, opciones) {
  let res;
  try {
    res = await fetch(API_URL + ruta, opciones);
  } catch {
    throw new Error(
      "Sin conexión al servidor. Abrí una terminal en backend y ejecutá: npm start"
    );
  }
  const data = await leerRespuesta(res);
  if (!res.ok) throw new Error(data.error || "Error en la solicitud");
  return data;
}

function obtenerToken() {
  return localStorage.getItem("token");
}

function obtenerUsuario() {
  const data = localStorage.getItem("usuario");
  return data ? JSON.parse(data) : null;
}

function headersAuth() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + obtenerToken()
  };
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

function verificarSesion(rolesPermitidos) {
  const token = obtenerToken();
  const usuario = obtenerUsuario();

  if (!token || !usuario) {
    window.location.href = "login.html";
    return null;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    if (usuario.rol === "cliente") {
      window.location.href = "crm-cliente.html";
    } else {
      window.location.href = "crm-admin.html";
    }
    return null;
  }

  return usuario;
}

async function apiGet(ruta) {
  return fetchApi(ruta, { headers: headersAuth() });
}

async function apiPost(ruta, body) {
  return fetchApi(ruta, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(body)
  });
}

async function apiPut(ruta, body) {
  return fetchApi(ruta, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify(body)
  });
}

async function apiDelete(ruta) {
  return fetchApi(ruta, {
    method: "DELETE",
    headers: headersAuth()
  });
}

async function apiSubirArchivos(ruta, inputArchivos) {
  const fd = new FormData();
  for (const f of inputArchivos) {
    fd.append("archivos", f);
  }
  let res;
  try {
    res = await fetch(API_URL + ruta, {
      method: "POST",
      headers: { Authorization: "Bearer " + obtenerToken() },
      body: fd
    });
  } catch {
    throw new Error("Sin conexión al servidor");
  }
  const data = await leerRespuesta(res);
  if (!res.ok) throw new Error(data.error || "Error al subir archivos");
  return data;
}

async function apiSubirPresupuesto(formData) {
  let res;
  try {
    res = await fetch(API_URL + "/presupuestos", {
      method: "POST",
      headers: { Authorization: "Bearer " + obtenerToken() },
      body: formData
    });
  } catch {
    throw new Error("Sin conexión al servidor");
  }
  const data = await leerRespuesta(res);
  if (!res.ok) throw new Error(data.error || "Error al subir presupuesto");
  return data;
}

function etiquetaTipoCampana(tipo, tituloCampana) {
  const map = {
    cumpleanos: "Cumpleaños",
    cumpleanos_proximo: "Cumpleaños próximo",
    dia_especial: "Día especial",
    cuenta_corriente: "Cuenta corriente"
  };
  if (map[tipo]) return map[tipo];
  if (tipo && tipo.startsWith("dia_especial_")) return "Día especial";
  if (tipo && tipo.startsWith("campana_")) {
    return tituloCampana ? "Campaña: " + tituloCampana : "Campaña promocional";
  }
  return (tipo || "").replace(/_/g, " ");
}

function etiquetaEstadoMarketing(estado) {
  const map = { enviado: "Enviado", pendiente: "Pendiente", programado: "Programado" };
  return map[estado] || estado;
}

function formatearFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour12: false
  });
}

function fechaRelativa(fecha) {
  if (!fecha) return "—";
  const ahora = Date.now();
  const ms = ahora - new Date(fecha).getTime();
  const dias = Math.floor(ms / 86400000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem.`;
  return formatearFecha(fecha).split(",")[0];
}

function etiquetaRol(rol) {
  const map = {
    admin: "Gerente",
    empleado: "Empleado",
    cliente: "Cliente"
  };
  return map[rol] || rol;
}

function badgeEstado(estado) {
  const map = {
    pendiente: "badge-pendiente",
    en_proceso: "badge-proceso",
    finalizado: "badge-finalizado",
    cancelado: "badge-cancelado"
  };
  const texto = (estado || "").replace("_", " ");
  return `<span class="badge ${map[estado] || ""}">${texto}</span>`;
}
