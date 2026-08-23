let consultasPagina = 1;
let consultasBuscarTimer = null;
let consultasMeta = { total: 0, pagina: 1, limite: 10, total_paginas: 1, vista: "activas" };
const LIMITE_CONSULTAS_AGRUPADAS = 10;
let clientesPagina = 1;
let clientesBuscarTimer = null;
let clientesMeta = { total: 0, pagina: 1, limite: 3, total_paginas: 1, rubro: null, dias: null };
const LIMITE_CLIENTES_INICIO = 3;
const LIMITE_CLIENTES_LISTA = 15;

const RUBROS_CLIENTE_LABEL = {
  sin_rubro: "Sin rubro",
  arquitecto: "Arquitectos",
  ingeniero: "Ingenieros",
  electricista: "Electricistas",
  diseñador_interiores: "Diseñadores de interiores",
  constructor: "Constructores",
  municipalidad: "Municipalidad / Alumbrado",
  empresa_industrial: "Empresa industrial",
  comercio: "Comercios",
  otro: "Otros"
};
let empleadosGlobal = [];
let empleadosPagina = 1;
let empleadosBuscarTimer = null;
let empleadosMeta = { total: 0, pagina: 1, limite: 10, total_paginas: 1 };
const LIMITE_EMPLEADOS_LISTA = 10;
let consultaActualId = null;
let chartEstados = null;
let chartTipos = null;

const COLORES_ITUARTE = {
  rojo: "#c62828",
  rojoOscuro: "#8e0000",
  rojoClaro: "#ef5350",
  gris: "#64748b",
  grisClaro: "#e2e8f0",
  ambar: "#f59e0b",
  verde: "#2e7d32",
  slate: "#475569"
};

const COLORES_ESTADO_CHART = {
  pendiente: "#f59e0b",
  en_proceso: "#c62828",
  finalizado: "#2e7d32",
  cancelado: "#94a3b8"
};
const LIMITE_TABLA = 20;

function paginarLista(lista, pagina, limite) {
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const pag = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (pag - 1) * limite;
  return {
    items: lista.slice(inicio, inicio + limite),
    total,
    pagina: pag,
    limite,
    total_paginas: totalPaginas
  };
}

function renderPaginacionTabla(containerId, data, fnCambiarPagina) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (data.total === 0) {
    el.innerHTML = "<small>No hay resultados</small>";
    return;
  }

  const desde = (data.pagina - 1) * data.limite + 1;
  const hasta = Math.min(data.pagina * data.limite, data.total);

  el.innerHTML = `
    <small>Mostrando ${desde}-${hasta} de ${data.total}</small>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" ${data.pagina <= 1 ? "disabled" : ""}
        onclick="${fnCambiarPagina}(${data.pagina - 1})">Anterior</button>
      <span style="align-self:center;font-size:13px;color:#64748b;">Página ${data.pagina} de ${data.total_paginas}</span>
      <button class="btn btn-secondary btn-sm" ${data.pagina >= data.total_paginas ? "disabled" : ""}
        onclick="${fnCambiarPagina}(${data.pagina + 1})">Siguiente</button>
    </div>
  `;
}

const usuario = verificarSesion(["admin", "empleado"]);
if (!usuario) throw new Error("Sin sesión");

const esGerente = usuario.rol === "admin";
let miEmpleadoId = null;
let consultaModalActual = null;
let marketingTabActiva = "calendario";

document.getElementById("nombreUsuario").textContent =
  usuario.nombre + " " + (usuario.apellido || "");
document.getElementById("rolUsuario").textContent = etiquetaRol(usuario.rol);

function configurarInterfazPorRol() {
  const sidebar = document.querySelector(".sidebar");
  const subtitulo = document.getElementById("sidebarSubtitulo");
  const menuDash = document.getElementById("menuDashboardText");
  const menuDashIcon = document.getElementById("menuDashboardIcon");
  const filtroConsultas = document.getElementById("filtroEstadoConsulta");
  const periodoCliente = document.getElementById("filtroPeriodoCliente");

  if (esGerente) {
    document.getElementById("menuEmpleados").style.display = "flex";
    document.getElementById("panelCampanas").style.display = "block";
    document.getElementById("panelGestionDiasCalendario").style.display = "block";
    document.getElementById("tabPlantillasMarketing").style.display = "inline-flex";
    document.getElementById("dashboardGerente").style.display = "block";
    document.getElementById("dashboardEmpleado").style.display = "none";
    if (subtitulo) subtitulo.textContent = "Panel gerencial";
    sidebar?.classList.add("sidebar-gerente");
    return;
  }

  sidebar?.classList.add("sidebar-operativo");
  if (subtitulo) subtitulo.textContent = "Panel operativo";
  if (menuDash) menuDash.textContent = "Mi día";
  if (menuDashIcon) menuDashIcon.className = "fa fa-sun";

  document.getElementById("menuReportes").style.display = "none";
  document.getElementById("dashboardGerente").style.display = "none";
  document.getElementById("dashboardEmpleado").style.display = "block";
  document.getElementById("introConsultas").style.display = "block";
  document.getElementById("introSeguimientos").style.display = "block";
  document.getElementById("panelSeguimientosRecientes").style.display = "block";
  document.getElementById("tituloSeccionConsultas").textContent = "Mis consultas";

  const tabCampanas = document.querySelector('[data-marketing-tab="campanas"]');
  if (tabCampanas) tabCampanas.style.display = "none";

  if (filtroConsultas) {
    filtroConsultas.innerHTML = `
      <option value="operativas_30" selected>Mis consultas + sin asignar (30 días)</option>
      <option value="mias">Solo mis consultas activas</option>
      <option value="sin_asignar">Sin asignar (para tomar)</option>
      <option value="pendiente">Pendientes (mías + sin asignar)</option>
      <option value="en_proceso">En proceso (mías + sin asignar)</option>
      <option value="finalizado">Mis consultas finalizadas</option>
    `;
  }

  if (periodoCliente) {
    [...periodoCliente.options].forEach(opt => {
      if (opt.value === "0") opt.remove();
    });
  }

  marketingTabActiva = "oportunidades";
}

function irASeccion(seccion, tabMarketing) {
  const btn = document.querySelector(`.menu-item[data-section="${seccion}"]`);
  if (btn) btn.click();
  if (seccion === "marketing" && tabMarketing) {
    cambiarTabMarketing(tabMarketing);
  }
}

function paramsConsultasPorRol(filtro) {
  const params = { asignacion: null, vista: null, estado: null, dias: null };

  if (esGerente) {
    if (filtro === "activas" || filtro === "activas_todas") {
      params.vista = "activas";
      if (filtro === "activas") params.dias = "30";
    } else if (filtro === "todas") {
      params.vista = "todas";
    } else {
      params.estado = filtro;
    }
    return params;
  }

  switch (filtro) {
    case "operativas_30":
      params.asignacion = "operativas";
      params.vista = "activas";
      params.dias = "30";
      break;
    case "mias":
      params.asignacion = "mias";
      params.vista = "activas";
      break;
    case "sin_asignar":
      params.asignacion = "sin_asignar";
      params.vista = "activas";
      break;
    case "pendiente":
    case "en_proceso":
      params.asignacion = "operativas";
      params.estado = filtro;
      break;
    case "finalizado":
      params.asignacion = "mias";
      params.estado = "finalizado";
      break;
    default:
      params.asignacion = "operativas";
      params.vista = "activas";
      params.dias = "30";
  }
  return params;
}

configurarInterfazPorRol();

document.querySelectorAll(".menu-item[data-section]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
    document.getElementById("tituloSeccion").textContent =
      btn.textContent.trim();
    if (btn.dataset.section === "marketing") cambiarTabMarketing(marketingTabActiva || "calendario");
  });
});

function mostrarToast(msg, esError) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (esError ? " error" : "");
  setTimeout(() => t.classList.remove("show"), 3000);
}

async function cargarDashboard() {
  try {
    const data = await apiGet("/dashboard");

    if (data.tipo === "operativo") {
      await renderDashboardOperativo(data);
      return;
    }

    renderDashboardGerencial(data);
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function renderDashboardGerencial(data) {
  const estados = { pendiente: 0, en_proceso: 0, finalizado: 0, cancelado: 0 };
  (data.por_estado || []).forEach(e => { estados[e.estado] = e.cantidad; });
  const totalConsultas = Object.values(estados).reduce((a, b) => a + b, 0);

  const bienvenida = document.getElementById("dashGerenteBienvenida");
  if (bienvenida) {
    bienvenida.textContent = `${usuario.nombre}, acá tenés el pulso comercial de Ituarte al ${new Date().toLocaleDateString("es-AR")}.`;
  }

  const labelTotal = document.getElementById("dashTotalConsultasLabel");
  if (labelTotal) labelTotal.textContent = `${totalConsultas} consultas en total`;

  document.getElementById("kpiDashboardGerente").innerHTML = `
    <article class="dash-kpi dash-kpi-principal">
      <div class="dash-kpi-icono"><i class="fa fa-users"></i></div>
      <div><strong>${data.total_clientes}</strong><span>Clientes activos</span></div>
    </article>
    <article class="dash-kpi">
      <div class="dash-kpi-icono"><i class="fa fa-bolt"></i></div>
      <div><strong>${data.consultas_activas}</strong><span>Consultas activas</span></div>
    </article>
    <article class="dash-kpi dash-kpi-alerta">
      <div class="dash-kpi-icono"><i class="fa fa-clock"></i></div>
      <div><strong>${estados.pendiente}</strong><span>Pendientes</span></div>
    </article>
    <article class="dash-kpi">
      <div class="dash-kpi-icono"><i class="fa fa-user-slash"></i></div>
      <div><strong>${data.consultas_sin_asignar}</strong><span>Sin asignar</span></div>
    </article>
    <article class="dash-kpi">
      <div class="dash-kpi-icono"><i class="fa fa-calendar-day"></i></div>
      <div><strong>${data.consultas_hoy}</strong><span>Consultas hoy</span></div>
    </article>
    <article class="dash-kpi">
      <div class="dash-kpi-icono"><i class="fa fa-calendar-week"></i></div>
      <div><strong>${data.consultas_semana}</strong><span>Últimos 7 días</span></div>
    </article>
    <article class="dash-kpi">
      <div class="dash-kpi-icono"><i class="fa fa-bullhorn"></i></div>
      <div><strong>${data.envios_marketing_30d}</strong><span>Contactos marketing (30d)</span></div>
    </article>
    <article class="dash-kpi">
      <div class="dash-kpi-icono"><i class="fa fa-file-invoice-dollar"></i></div>
      <div><strong>${data.clientes_cuenta_corriente}</strong><span>Cta. cte. activas</span></div>
    </article>
  `;

  const leyenda = document.getElementById("leyendaEstadosDash");
  if (leyenda) {
    const items = [
      { key: "pendiente", label: "Pendientes" },
      { key: "en_proceso", label: "En proceso" },
      { key: "finalizado", label: "Finalizadas" },
      { key: "cancelado", label: "Canceladas" }
    ];
    leyenda.innerHTML = items.map(it => `
      <div class="dash-leyenda-item">
        <span class="dash-leyenda-punto" style="background:${COLORES_ESTADO_CHART[it.key]}"></span>
        <span>${it.label}</span>
        <strong>${estados[it.key]}</strong>
      </div>
    `).join("");
  }

  const ctxEstados = document.getElementById("graficoEstados");
  if (ctxEstados) {
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(ctxEstados, {
      type: "doughnut",
      data: {
        labels: ["Pendientes", "En proceso", "Finalizadas", "Canceladas"],
        datasets: [{
          data: [estados.pendiente, estados.en_proceso, estados.finalizado, estados.cancelado],
          backgroundColor: [
            COLORES_ESTADO_CHART.pendiente,
            COLORES_ESTADO_CHART.en_proceso,
            COLORES_ESTADO_CHART.finalizado,
            COLORES_ESTADO_CHART.cancelado
          ],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1e293b",
            titleFont: { family: "Work Sans" },
            bodyFont: { family: "Work Sans" }
          }
        }
      }
    });
  }

  const tipos = data.por_tipo || [];
  const ctxTipos = document.getElementById("graficoTipos");
  if (ctxTipos) {
    if (chartTipos) chartTipos.destroy();
    if (!tipos.length) {
      ctxTipos.parentElement.innerHTML = "<p class='consultas-vacio'>Sin consultas por tipo todavía.</p>";
    } else {
      if (!ctxTipos.parentElement.querySelector("canvas")) {
        ctxTipos.parentElement.innerHTML = '<canvas id="graficoTipos"></canvas>';
      }
      const canvasTipos = document.getElementById("graficoTipos");
      const coloresTipo = tipos.map((_, i) => {
        const opacidad = 1 - i * 0.12;
        return i === 0 ? COLORES_ITUARTE.rojo : `rgba(198, 40, 40, ${Math.max(0.35, opacidad)})`;
      });
      chartTipos = new Chart(canvasTipos, {
        type: "bar",
        data: {
          labels: tipos.map(t => t.nombre),
          datasets: [{
            label: "Consultas",
            data: tipos.map(t => t.cantidad),
            backgroundColor: coloresTipo,
            borderRadius: 8,
            barThickness: 22
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: "#f1f5f9" },
              ticks: { color: COLORES_ITUARTE.gris, font: { family: "Work Sans" } }
            },
            y: {
              grid: { display: false },
              ticks: { color: COLORES_ITUARTE.slate, font: { family: "Work Sans", size: 11 } }
            }
          }
        }
      });
    }
  }

  const rubros = data.por_rubro || [];
  const maxRubro = rubros.reduce((m, r) => Math.max(m, r.cantidad), 1);
  const listaRubros = document.getElementById("listaRubrosDash");
  if (listaRubros) {
    if (!rubros.length) {
      listaRubros.innerHTML = "<p class='consultas-vacio'>Sin datos de rubros todavía.</p>";
    } else {
      listaRubros.innerHTML = rubros.map(r => {
        const pct = Math.round((r.cantidad / maxRubro) * 100);
        const label = etiquetaRubroCliente(r.rubro);
        return `
          <div class="dash-rubro-item">
            <div class="dash-rubro-top">
              <span>${escaparHtml(label)}</span>
              <strong>${r.cantidad}</strong>
            </div>
            <div class="dash-rubro-bar"><span style="width:${pct}%"></span></div>
          </div>
        `;
      }).join("");
    }
  }

  const lista = document.getElementById("listaSeguimientos");
  if (lista) {
    if (!data.proximos_seguimientos?.length) {
      lista.innerHTML = "<p class='consultas-vacio'>No hay seguimientos programados.</p>";
    } else {
      lista.innerHTML = data.proximos_seguimientos.map(s => `
        <div class="dash-actividad-item">
          <div>
            <strong>#${s.id} · ${s.nombre} ${s.apellido || ""}</strong>
            <small>${formatearFecha(s.fecha_seguimiento)} · Prioridad ${s.prioridad || "media"}</small>
          </div>
          ${badgeEstado(s.estado)}
        </div>
      `).join("");
    }
  }

  const listaRecientes = document.getElementById("listaConsultasRecientesDash");
  if (listaRecientes) {
    if (!data.consultas_recientes?.length) {
      listaRecientes.innerHTML = "<p class='consultas-vacio'>No hay consultas recientes.</p>";
    } else {
      listaRecientes.innerHTML = data.consultas_recientes.map(c => `
        <div class="dash-actividad-item dash-actividad-clic" onclick="verConsulta(${c.id})">
          <div>
            <strong>#${c.id} · ${c.cliente_nombre} ${c.cliente_apellido || ""}</strong>
            <small>${c.tipo_consulta} · ${c.empleado_nombre || "Sin asignar"} · ${fechaRelativa(c.creado_en)}</small>
          </div>
          ${badgeEstado(c.estado)}
        </div>
      `).join("");
    }
  }
}

async function renderDashboardOperativo(data) {
  document.getElementById("cardsDashboardEmpleado").innerHTML = `
    <div class="card card-operativo"><h2>${data.mis_consultas_activas}</h2><p>Mis consultas activas</p></div>
    <div class="card card-operativo card-destacada"><h2>${data.sin_asignar}</h2><p>Sin asignar</p></div>
    <div class="card card-operativo"><h2>${data.seguimientos_hoy}</h2><p>Seguimientos hoy</p></div>
    <div class="card card-operativo ${data.seguimientos_vencidos > 0 ? "card-alerta" : ""}"><h2>${data.seguimientos_vencidos}</h2><p>Seguimientos vencidos</p></div>
  `;

  const listaConsultas = document.getElementById("listaConsultasOperativas");
  if (!data.consultas_prioritarias?.length) {
    listaConsultas.innerHTML = "<p class='consultas-vacio'>No tenés consultas activas pendientes por ahora.</p>";
  } else {
    listaConsultas.innerHTML = data.consultas_prioritarias.map(c => `
      <article class="consulta-card consulta-card-operativa">
        <div class="consulta-card-main">
          <strong>#${c.id} · ${c.cliente_nombre} ${c.cliente_apellido || ""}</strong>
          <span class="consulta-card-meta">${c.tipo_consulta} · ${c.producto_interes || "Sin producto"}</span>
          <span class="consulta-card-meta">${c.empleado_nombre || "Sin asignar"} · Prioridad ${c.prioridad}</span>
        </div>
        <div class="consulta-card-side">
          ${badgeEstado(c.estado)}
          <button class="btn btn-secondary btn-sm" onclick="verConsulta(${c.id})">Atender</button>
        </div>
      </article>
    `).join("");
  }

  const listaSeg = document.getElementById("listaSeguimientosOperativos");
  if (!data.proximos_seguimientos?.length) {
    listaSeg.innerHTML = "<p class='consultas-vacio'>No tenés seguimientos programados.</p>";
  } else {
    listaSeg.innerHTML = data.proximos_seguimientos.map(s => `
      <div class="seguimiento-item">
        <strong>#${s.id} · ${s.nombre} ${s.apellido || ""}</strong>
        <small>${formatearFecha(s.fecha_seguimiento)} · ${badgeEstado(s.estado)} · Prioridad ${s.prioridad || "media"}</small>
      </div>
    `).join("");
  }

  const listaRecientes = document.getElementById("listaMisSeguimientosRecientes");
  const panelRecientesSeg = document.getElementById("listaSeguimientosEmpleado");
  const htmlSeguimientos = !data.seguimientos_recientes?.length
    ? "<p class='consultas-vacio'>Todavía no registraste seguimientos.</p>"
    : data.seguimientos_recientes.map(s => `
      <div class="seguimiento-item">
        <strong>#${s.consulta_id} · ${s.cliente_nombre} ${s.cliente_apellido || ""}</strong>
        <p style="font-size:13px;margin:6px 0 0;">${escaparHtml(s.nota)}</p>
        <small>${formatearFecha(s.creado_en)}${s.proximo_contacto ? " · Próximo: " + formatearFecha(s.proximo_contacto) : ""}</small>
      </div>
    `).join("");

  if (listaRecientes) listaRecientes.innerHTML = htmlSeguimientos;
  if (panelRecientesSeg) panelRecientesSeg.innerHTML = htmlSeguimientos;

  try {
    const mk = await apiGet("/marketing/oportunidades?limite=1");
    const el = document.getElementById("resumenMarketingOperativo");
    if (el) {
      el.textContent = mk.total > 0
        ? `Tenés ${mk.total} oportunidad${mk.total !== 1 ? "es" : ""} de contacto pendiente${mk.total !== 1 ? "s" : ""}. Revisalas en Marketing → Oportunidades.`
        : "No hay contactos de marketing urgentes por ahora.";
    }
  } catch {
    /* marketing opcional en dashboard operativo */
  }
}

async function cargarConsultas() {
  try {
    const params = new URLSearchParams();
    params.set("pagina", consultasPagina);
    params.set("incluir_resumen", "1");

    const filtro = document.getElementById("filtroEstadoConsulta")?.value || (esGerente ? "activas" : "operativas_30");
    const vistaAgrupada = esVistaConsultasAgrupada(filtro);

    params.set("limite", vistaAgrupada ? LIMITE_CONSULTAS_AGRUPADAS : LIMITE_TABLA);

    const rolParams = paramsConsultasPorRol(filtro);
    if (rolParams.vista) params.set("vista", rolParams.vista);
    if (rolParams.estado) params.set("estado", rolParams.estado);
    if (rolParams.dias) params.set("dias", rolParams.dias);
    if (rolParams.asignacion) params.set("asignacion", rolParams.asignacion);

    const buscar = (document.getElementById("buscarConsulta")?.value || "").trim();
    if (buscar) params.set("buscar", buscar);

    const data = await apiGet("/consultas?" + params.toString());
    consultasMeta = {
      total: data.total,
      pagina: data.pagina,
      limite: data.limite,
      total_paginas: data.total_paginas,
      vista: data.vista,
      dias: data.dias,
      resumen: data.resumen
    };
    consultasPagina = data.pagina;

    if (vistaAgrupada) {
      document.getElementById("consultasListaAgrupada").style.display = "block";
      document.getElementById("tablaConsultasWrap").style.display = "none";
      renderConsultasAgrupadas(data.consultas || []);
    } else {
      document.getElementById("consultasListaAgrupada").style.display = "none";
      document.getElementById("tablaConsultasWrap").style.display = "block";
      renderConsultasTabla(data.consultas || []);
    }

    renderPaginacionTabla("paginacionConsultas", consultasMeta, "cambiarPaginaConsultas");
    renderResumenConsultas();
    actualizarSelectConsultas();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function esVistaConsultasAgrupada(filtro) {
  if (esGerente) {
    return ["activas", "activas_todas", "pendiente", "en_proceso"].includes(filtro);
  }
  return ["operativas_30", "mias", "sin_asignar", "pendiente", "en_proceso"].includes(filtro);
}

function agruparConsultasPorEstado(lista) {
  const orden = ["pendiente", "en_proceso", "finalizado", "cancelado"];
  const grupos = {};
  lista.forEach(c => {
    if (!grupos[c.estado]) grupos[c.estado] = [];
    grupos[c.estado].push(c);
  });
  return orden
    .filter(est => grupos[est]?.length)
    .map(est => ({ estado: est, items: grupos[est] }));
}

function tituloGrupoConsulta(estado) {
  const map = {
    pendiente: "Pendientes",
    en_proceso: "En proceso",
    finalizado: "Finalizadas",
    cancelado: "Canceladas"
  };
  return map[estado] || estado;
}

function renderConsultasAgrupadas(lista) {
  const cont = document.getElementById("consultasListaAgrupada");
  if (!cont) return;

  if (lista.length === 0) {
    cont.innerHTML = `<p class="consultas-vacio">No hay consultas activas recientes con esos criterios.</p>`;
    return;
  }

  const grupos = agruparConsultasPorEstado(lista);
  cont.innerHTML = grupos.map(g => `
    <div class="consultas-grupo">
      <div class="consultas-grupo-header">
        <h3>${tituloGrupoConsulta(g.estado)}</h3>
        <span>${g.items.length} en esta página · ${badgeEstado(g.estado)}</span>
      </div>
      <div class="consultas-grupo-lista">
        ${g.items.map(c => `
          <article class="consulta-card">
            <div class="consulta-card-main">
              <strong>${c.cliente_nombre} ${c.cliente_apellido || ""}</strong>
              <span class="consulta-card-meta">${c.tipo_consulta} · ${c.producto_interes || "Sin producto"}</span>
              <span class="consulta-card-meta">${c.empleado_nombre || "Sin asignar"} · Prioridad ${c.prioridad}</span>
            </div>
            <div class="consulta-card-side">
              <span class="consulta-card-fecha" title="${formatearFecha(c.creado_en)}">${fechaRelativa(c.creado_en)}</span>
              <button class="btn btn-secondary btn-sm" onclick="verConsulta(${c.id})">Ver</button>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function renderConsultasTabla(lista) {
  const tbody = document.getElementById("tablaConsultas");
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#64748b;padding:24px;">No hay consultas con esos filtros</td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.cliente_nombre} ${c.cliente_apellido || ""}</td>
      <td>${c.tipo_consulta}</td>
      <td>${c.producto_interes || c.tipo_consulta || "Sin producto"}</td>
      <td>${c.empleado_nombre || '<span style="color:#999;">Sin asignar</span>'}</td>
      <td>${badgeEstado(c.estado)}</td>
      <td>${c.prioridad}</td>
      <td>${formatearFecha(c.creado_en)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="verConsulta(${c.id})">Ver</button>
      </td>
    </tr>
  `).join("");
}

function renderResumenConsultas() {
  const el = document.getElementById("resumenConsultas");
  if (!el) return;

  const r = consultasMeta.resumen;
  const filtro = document.getElementById("filtroEstadoConsulta")?.value || "activas";
  const vistaAgrupada = esVistaConsultasAgrupada(filtro);

  let texto = vistaAgrupada
    ? (esGerente
      ? "Vista resumida agrupada por estado, ordenadas de más nuevas a más antiguas. "
      : "Consultas asignadas a vos o sin asignar, agrupadas por estado. ")
    : (esGerente ? "Vista de historial en tabla. " : "Historial de tus consultas finalizadas. ");

  texto += `Mostrando ${consultasMeta.total} resultado${consultasMeta.total !== 1 ? "s" : ""}`;

  if ((filtro === "activas" || filtro === "operativas_30") && consultasMeta.dias) {
    texto += ` de los últimos ${consultasMeta.dias} días`;
  }
  texto += ".";

  if (r && (filtro === "activas" || filtro === "activas_todas") && esGerente) {
    texto += ` Total en sistema: ${r.pendiente + r.en_proceso} activas, ${r.finalizado} finalizadas.`;
  }

  el.textContent = texto;
}

function cambiarPaginaConsultas(pagina) {
  consultasPagina = pagina;
  cargarConsultas();
}

async function actualizarSelectConsultas() {
  const select = document.getElementById("segConsultaId");
  if (!select) return;

  try {
    const params = new URLSearchParams({ vista: "activas", limite: "100" });
    if (!esGerente) params.set("asignacion", "mias");
    const data = await apiGet("/consultas?" + params.toString());
    const lista = data.consultas || data;
    select.innerHTML = '<option value="">Elegí una consulta...</option>' +
      lista.map(c =>
        `<option value="${c.id}">#${c.id} - ${c.cliente_nombre} - ${c.tipo_consulta} (${c.estado})</option>`
      ).join("");
  } catch (e) {
    console.error(e);
  }
}

document.getElementById("buscarConsulta").addEventListener("input", function() {
  consultasPagina = 1;
  clearTimeout(consultasBuscarTimer);
  consultasBuscarTimer = setTimeout(() => cargarConsultas(), 350);
});

document.getElementById("filtroEstadoConsulta").addEventListener("change", function() {
  consultasPagina = 1;
  cargarConsultas();
});

async function cargarEmpleados() {
  if (!esGerente) {
    try {
      const yo = await apiGet("/empleados");
      const match = yo.find(e => e.usuario_id === usuario.id);
      miEmpleadoId = match?.id || null;
    } catch (e) {
      console.error(e);
    }
    return;
  }

  try {
    empleadosGlobal = await apiGet("/empleados");
    const select = document.getElementById("modalEmpleado");
    if (select) {
      select.innerHTML = '<option value="">Sin asignar</option>' +
        empleadosGlobal.map(e =>
          `<option value="${e.id}">${e.nombre_completo} (${e.cargo} - ${e.sucursal})</option>`
        ).join("");
    }
  } catch (e) {
    console.error(e);
  }
}

function actualizarModalAsignacion(c) {
  const bloqueAsignar = document.getElementById("bloqueAsignarEmpleado");
  const btnTomar = document.getElementById("btnTomarConsulta");
  consultaModalActual = c;

  if (esGerente) {
    if (bloqueAsignar) bloqueAsignar.style.display = "block";
    if (btnTomar) btnTomar.style.display = "none";
    return;
  }

  if (bloqueAsignar) bloqueAsignar.style.display = "none";
  if (btnTomar) {
    btnTomar.style.display = !c.empleado_id ? "inline-flex" : "none";
  }
}

async function tomarConsulta() {
  if (!consultaModalActual || !miEmpleadoId) {
    mostrarToast("No se pudo asignar la consulta", true);
    return;
  }
  try {
    await apiPut("/consultas/" + consultaModalActual.id, {
      empleado_id: miEmpleadoId,
      estado: consultaModalActual.estado === "pendiente" ? "en_proceso" : consultaModalActual.estado
    });
    mostrarToast("Consulta asignada a vos");
    cerrarModal();
    await cargarConsultas();
    await cargarDashboard();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function verConsulta(id) {
  try {
    const c = await apiGet("/consultas/" + id);
    consultaActualId = id;
    document.getElementById("modalId").textContent = id;
    document.getElementById("modalEstado").value = c.estado;
    document.getElementById("modalPrioridad").value = c.prioridad || "media";
    document.getElementById("modalEmpleado").value = c.empleado_id || "";
    document.getElementById("modalDetalle").innerHTML = `
      <div><strong>Cliente</strong>${c.cliente_nombre} ${c.cliente_apellido || ""}</div>
      <div><strong>Email</strong>${c.cliente_email}</div>
      <div><strong>Teléfono</strong>${c.cliente_telefono || "—"}</div>
      <div><strong>Ciudad</strong>${c.cliente_ciudad || "—"}</div>
      <div><strong>Tipo</strong>${c.tipo_consulta}</div>
      <div><strong>Producto</strong>${c.producto_interes || "—"}</div>
      <div style="grid-column:1/-1"><strong>Mensaje</strong>${c.mensaje}</div>
      <div><strong>Empleado</strong>${c.empleado_nombre || "Sin asignar"}</div>
      <div><strong>Fecha</strong>${formatearFecha(c.creado_en)}</div>
    `;

    document.getElementById("modalHistorial").innerHTML = (c.historial || []).map(h => `
      <div class="seguimiento-item">
        ${h.estado_anterior} → <strong>${h.estado_nuevo}</strong>
        <small>${formatearFecha(h.creado_en)} | ${h.empleado_nombre || "Sistema"} | ${h.observacion || ""}</small>
      </div>
    `).join("") || "<p style='color:#64748b;font-size:13px;'>Sin historial</p>";

    document.getElementById("modalSeguimientos").innerHTML = (c.seguimientos || []).map(s => `
      <div class="seguimiento-item">
        ${s.nota}
        <small>${formatearFecha(s.creado_en)} | ${s.empleado_nombre}${s.proximo_contacto ? " | Próximo: " + formatearFecha(s.proximo_contacto) : ""}</small>
      </div>
    `).join("") || "<p style='color:#64748b;font-size:13px;'>Sin seguimientos aún</p>";

    actualizarModalAsignacion(c);
    document.getElementById("modalConsulta").classList.add("open");
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function cerrarModal() {
  document.getElementById("modalConsulta").classList.remove("open");
}

async function guardarCambiosModal() {
  try {
    const body = {
      estado: document.getElementById("modalEstado").value,
      prioridad: document.getElementById("modalPrioridad").value
    };

    if (esGerente) {
      const empleadoVal = document.getElementById("modalEmpleado").value;
      body.empleado_id = empleadoVal ? parseInt(empleadoVal, 10) : null;
    }

    await apiPut("/consultas/" + consultaActualId, body);
    mostrarToast("Consulta actualizada");
    cerrarModal();
    await cargarConsultas();
    await cargarDashboard();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function cargarRubrosClientes() {
  const select = document.getElementById("filtroRubroCliente");
  if (!select) return;

  const valorActual = select.value;

  try {
    const rubros = await apiGet("/clientes/rubros");
    const opciones = rubros.map(r => {
      const label = etiquetaRubroCliente(r.rubro);
      return `<option value="${r.rubro}">${label} (${r.cantidad})</option>`;
    });

    select.innerHTML = '<option value="">Todos los rubros</option>' + opciones.join("");
    if (valorActual && [...select.options].some(o => o.value === valorActual)) {
      select.value = valorActual;
    }
  } catch (e) {
    console.error(e);
  }
}

function etiquetaRubroCliente(rubro) {
  if (!rubro || rubro === "sin_rubro") return RUBROS_CLIENTE_LABEL.sin_rubro;
  return RUBROS_CLIENTE_LABEL[rubro] || formatearRubro(rubro);
}

function esVistaRapidaClientes() {
  const periodo = document.getElementById("filtroPeriodoCliente")?.value || "inicio";
  const rubro = document.getElementById("filtroRubroCliente")?.value || "";
  const buscar = (document.getElementById("buscarCliente")?.value || "").trim();
  return periodo === "inicio" && !buscar;
}

async function cargarClientes() {
  try {
    const params = new URLSearchParams();
    params.set("pagina", clientesPagina);

    const rubro = document.getElementById("filtroRubroCliente")?.value || "";
    const periodo = document.getElementById("filtroPeriodoCliente")?.value || "inicio";
    const buscar = (document.getElementById("buscarCliente")?.value || "").trim();
    const vistaRapida = esVistaRapidaClientes();

    if (rubro) params.set("rubro", rubro);
    if (buscar) params.set("buscar", buscar);

    if (vistaRapida) {
      params.set("limite", String(LIMITE_CLIENTES_INICIO));
    } else {
      params.set("limite", String(LIMITE_CLIENTES_LISTA));
      if (periodo !== "0") params.set("dias", periodo);
    }

    const data = await apiGet("/clientes?" + params.toString());
    clientesMeta = {
      total: data.total,
      pagina: data.pagina,
      limite: data.limite,
      total_paginas: data.total_paginas,
      rubro: data.rubro,
      dias: data.dias
    };
    clientesPagina = data.pagina;

    renderClientesLista(data.clientes || []);
    renderPaginacionClientes();
    renderResumenClientes();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function renderClientesLista(lista) {
  const cont = document.getElementById("clientesLista");
  if (!cont) return;

  if (lista.length === 0) {
    cont.innerHTML = `<p class="consultas-vacio">No hay clientes con esos criterios.</p>`;
    return;
  }

  cont.innerHTML = lista.map(c => `
    <article class="consulta-card">
      <div class="consulta-card-main">
        <strong>${c.nombre} ${c.apellido || ""}</strong>
        <span class="consulta-card-meta">${c.email} · ${c.ciudad || "Sin ciudad"}</span>
        <span class="consulta-card-meta">
          ${etiquetaRubroCliente(c.rubro || "sin_rubro")}
          · ${c.telefono || "Sin teléfono"}
          · ${c.total_consultas || 0} consulta${(c.total_consultas || 0) !== 1 ? "s" : ""}
          · ${c.total_presupuestos || 0} presupuesto${(c.total_presupuestos || 0) !== 1 ? "s" : ""}
          ${c.cuenta_corriente ? " · Cta. cte." : ""}
        </span>
      </div>
      <div class="consulta-card-side">
        <span class="consulta-card-fecha" title="${formatearFecha(c.creado_en)}">${fechaRelativa(c.creado_en)}</span>
        <div class="consulta-card-acciones">
          <button class="btn btn-primary btn-sm" onclick="verPresupuestos(${c.id})">
            <i class="fa fa-file-pdf"></i> Presupuestos${c.total_presupuestos > 0 ? ` (${c.total_presupuestos})` : ""}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="editarCliente(${c.id})">Editar</button>
          ${esGerente ? `<button class="btn btn-danger btn-sm" onclick="desactivarCliente(${c.id})">Desactivar</button>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function renderPaginacionClientes() {
  const el = document.getElementById("paginacionClientes");
  if (!el) return;

  if (esVistaRapidaClientes()) {
    el.innerHTML = clientesMeta.total > LIMITE_CLIENTES_INICIO
      ? `<small>Vista rápida: ${LIMITE_CLIENTES_INICIO} de ${clientesMeta.total} recientes. Elegí un rubro o cambiá el período para ver más.</small>`
      : "";
    return;
  }

  renderPaginacionTabla("paginacionClientes", clientesMeta, "cambiarPaginaClientes");
}

function renderResumenClientes() {
  const el = document.getElementById("resumenClientes");
  if (!el) return;

  const rubro = document.getElementById("filtroRubroCliente")?.value || "";
  const periodo = document.getElementById("filtroPeriodoCliente")?.value || "inicio";
  const buscar = (document.getElementById("buscarCliente")?.value || "").trim();
  const vistaRapida = esVistaRapidaClientes();

  let texto = vistaRapida
    ? `Vista rápida: los ${Math.min(LIMITE_CLIENTES_INICIO, clientesMeta.total)} clientes más recientes`
    : `Mostrando ${clientesMeta.total} cliente${clientesMeta.total !== 1 ? "s" : ""}`;

  if (rubro) texto += ` · Rubro: ${etiquetaRubroCliente(rubro)}`;
  if (buscar) texto += ` · Búsqueda: “${buscar}”`;
  if (!vistaRapida && periodo === "0") texto += " · Todo el historial";
  else if (!vistaRapida && periodo !== "0") texto += ` · Últimos ${periodo} días`;
  texto += " · Orden: más nuevos primero.";

  el.textContent = texto;
}

function cambiarPaginaClientes(pagina) {
  clientesPagina = pagina;
  cargarClientes();
}

function formatearRubro(r) {
  if (!r) return "—";
  return r.replace(/_/g, " ");
}

async function editarCliente(id) {
  try {
    const c = await apiGet("/clientes/" + id);
    document.getElementById("editClienteId").value = c.id;
    document.getElementById("editNombre").value = c.nombre || "";
    document.getElementById("editApellido").value = c.apellido || "";
    document.getElementById("editEmail").value = c.email || "";
    document.getElementById("editTelefono").value = c.telefono || "";
    document.getElementById("editCiudad").value = c.ciudad || "";
    document.getElementById("editEmpresa").value = c.empresa || "";
    document.getElementById("editTipoCliente").value = c.tipo_cliente || "particular";
    document.getElementById("editRubro").value = c.rubro || "";
    document.getElementById("editNacimiento").value = c.fecha_nacimiento
      ? c.fecha_nacimiento.split("T")[0] : "";
    document.getElementById("editCuentaCorriente").value = c.cuenta_corriente ? "1" : "0";
    document.getElementById("editNotas").value = c.notas_comerciales || "";
    document.getElementById("modalCliente").classList.add("open");
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function cerrarModalCliente() {
  document.getElementById("modalCliente").classList.remove("open");
}

async function guardarCliente(e) {
  e.preventDefault();
  const id = document.getElementById("editClienteId").value;
  try {
    await apiPut("/clientes/" + id, {
      nombre: document.getElementById("editNombre").value,
      apellido: document.getElementById("editApellido").value,
      email: document.getElementById("editEmail").value,
      telefono: document.getElementById("editTelefono").value,
      ciudad: document.getElementById("editCiudad").value,
      empresa: document.getElementById("editEmpresa").value,
      tipo_cliente: document.getElementById("editTipoCliente").value,
      rubro: document.getElementById("editRubro").value || null,
      fecha_nacimiento: document.getElementById("editNacimiento").value || null,
      cuenta_corriente: document.getElementById("editCuentaCorriente").value === "1",
      notas_comerciales: document.getElementById("editNotas").value
    });
    mostrarToast("Perfil del cliente actualizado");
    cerrarModalCliente();
    await cargarRubrosClientes();
    await cargarClientes();
    await cargarMarketing();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

let presupuestoClienteId = null;
let presupuestosPagina = 1;
let presupuestosMeta = { total: 0, pagina: 1, total_paginas: 1 };
let presupuestosFiltros = { numero: "", buscar: "", dias: 30, empleado_id: "" };
let presupuestoBusquedaGlobalPagina = 1;
let presupuestosBuscarTimer = null;

function paramsPresupuestosCliente() {
  const p = new URLSearchParams();
  p.set("pagina", presupuestosPagina);
  p.set("limite", "15");
  if (presupuestosFiltros.numero) p.set("numero", presupuestosFiltros.numero);
  if (presupuestosFiltros.buscar) p.set("buscar", presupuestosFiltros.buscar);
  if (presupuestosFiltros.dias > 0) p.set("dias", presupuestosFiltros.dias);
  if (presupuestosFiltros.empleado_id) p.set("empleado_id", presupuestosFiltros.empleado_id);
  return p.toString();
}

async function cargarSelectEmpleadosPresupuesto() {
  try {
    const empleados = empleadosGlobal.length
      ? empleadosGlobal
      : await apiGet("/empleados");
    if (!empleadosGlobal.length) empleadosGlobal = empleados;

    const opts = empleados.map(e =>
      `<option value="${e.id}">${escaparHtml(e.nombre_completo)} — ${escaparHtml(e.cargo || "Empleado")}</option>`
    ).join("");

    const selectUpload = document.getElementById("presupuestoEmpleado");
    if (selectUpload) {
      selectUpload.innerHTML = '<option value="">Seleccionar empleado...</option>' + opts;
      if (miEmpleadoId) selectUpload.value = String(miEmpleadoId);
    }

    const selectFiltro = document.getElementById("filtroEmpleadoPresupuesto");
    if (selectFiltro) {
      selectFiltro.innerHTML = '<option value="">Todos los empleados</option>' + opts;
    }
  } catch (e) {
    console.error(e);
  }
}

function etiquetaEmpleadoPresupuesto(p) {
  if (!p.empleado_nombre || p.empleado_nombre.trim() === "") {
    return '<span class="presupuesto-empleado-badge presupuesto-empleado-sin">Sin registrar empleado</span>';
  }
  const cargo = p.empleado_cargo ? ` · ${escaparHtml(p.empleado_cargo)}` : "";
  return `<span class="presupuesto-empleado-badge"><i class="fa fa-user-tie"></i> Elaborado por: <strong>${escaparHtml(p.empleado_nombre.trim())}</strong>${cargo}</span>`;
}

function urlPresupuestoPdf(ruta) {
  const base = API_URL || "";
  return base + ruta;
}

async function verPresupuestos(clienteId) {
  presupuestoClienteId = clienteId;
  presupuestosPagina = 1;
  presupuestosFiltros = { numero: "", buscar: "", dias: 30, empleado_id: "" };
  document.getElementById("presupuestoClienteId").value = clienteId;
  document.getElementById("formSubirPresupuesto").reset();
  document.getElementById("presupuestoClienteId").value = clienteId;
  document.getElementById("filtroNumeroPresupuesto").value = "";
  document.getElementById("filtroTextoPresupuesto").value = "";
  document.getElementById("filtroPeriodoPresupuesto").value = "30";
  document.getElementById("filtroEmpleadoPresupuesto").value = "";
  document.getElementById("modalPresupuestos").classList.add("open");
  await cargarSelectEmpleadosPresupuesto();
  if (miEmpleadoId) {
    document.getElementById("presupuestoEmpleado").value = String(miEmpleadoId);
  }
  await cargarPresupuestosCliente();
}

function cerrarModalPresupuestos() {
  document.getElementById("modalPresupuestos").classList.remove("open");
  presupuestoClienteId = null;
}

async function cargarPresupuestosCliente() {
  if (!presupuestoClienteId) return;
  const lista = document.getElementById("listaPresupuestos");
  lista.innerHTML = "<p class='consultas-vacio'>Cargando presupuestos...</p>";

  try {
    const data = await apiGet(
      `/presupuestos/cliente/${presupuestoClienteId}?${paramsPresupuestosCliente()}`
    );

    const hayFiltros = presupuestosFiltros.numero || presupuestosFiltros.buscar || presupuestosFiltros.dias > 0;
    document.getElementById("tituloModalPresupuestos").textContent =
      `Presupuestos — ${data.cliente.nombre} ${data.cliente.apellido || ""}`.trim();
    document.getElementById("subtituloModalPresupuestos").textContent =
      hayFiltros
        ? `${data.total} resultado${data.total !== 1 ? "s" : ""} con el filtro aplicado`
        : `${data.cliente.email} · ${data.total} PDF${data.total !== 1 ? "s" : ""} registrado${data.total !== 1 ? "s" : ""}`;
    document.getElementById("presupuestosContador").textContent =
      data.total ? `${data.total} en total` : "Sin presupuestos todavía";

    presupuestosMeta = {
      total: data.total,
      pagina: data.pagina,
      limite: data.limite,
      total_paginas: data.total_paginas
    };

    if (!data.presupuestos.length) {
      lista.innerHTML = "<p class='consultas-vacio'>Todavía no hay presupuestos cargados para este cliente.</p>";
    } else {
      lista.innerHTML = data.presupuestos.map(p => renderPresupuestoItem(p, false)).join("");
    }

    renderPaginacionTabla("paginacionPresupuestos", presupuestosMeta, "cambiarPaginaPresupuestos");
  } catch (e) {
    lista.innerHTML = `<p class='consultas-vacio'>${escaparHtml(e.message)}</p>`;
  }
}

function cambiarPaginaPresupuestos(pagina) {
  presupuestosPagina = pagina;
  cargarPresupuestosCliente();
}

async function subirPresupuesto(e) {
  e.preventDefault();
  const archivo = document.getElementById("presupuestoArchivo").files[0];
  if (!archivo) {
    mostrarToast("Seleccioná un archivo PDF", true);
    return;
  }

  const maxMb = 150;
  if (archivo.size > maxMb * 1024 * 1024) {
    mostrarToast(
      `El PDF pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB. Máximo ${maxMb} MB. Comprimilo o sacale imágenes pesadas.`,
      true
    );
    return;
  }

  const fd = new FormData();
  fd.append("cliente_id", presupuestoClienteId);
  fd.append("pdf", archivo);
  fd.append("titulo", document.getElementById("presupuestoTitulo").value.trim());
  fd.append("numero", document.getElementById("presupuestoNumero").value.trim());
  fd.append("notas", document.getElementById("presupuestoNotas").value.trim());
  fd.append("empleado_id", document.getElementById("presupuestoEmpleado").value);

  const btn = document.getElementById("btnSubirPresupuesto");
  btn.disabled = true;
  btn.textContent = "Subiendo...";

  try {
    await apiSubirPresupuesto(fd);
    mostrarToast("Presupuesto PDF cargado correctamente");
    document.getElementById("formSubirPresupuesto").reset();
    document.getElementById("presupuestoClienteId").value = presupuestoClienteId;
    presupuestosPagina = 1;
    await cargarPresupuestosCliente();
    await cargarClientes();
  } catch (err) {
    mostrarToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-upload"></i> Cargar presupuesto PDF';
  }
}

async function eliminarPresupuesto(id) {
  if (!confirm("¿Eliminar este presupuesto del historial del cliente?")) return;
  try {
    await apiDelete("/presupuestos/" + id);
    mostrarToast("Presupuesto eliminado");
    await cargarPresupuestosCliente();
    await cargarClientes();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function renderPresupuestoItem(p, mostrarCliente) {
  return `
    <article class="presupuesto-item">
      <div class="presupuesto-icono"><i class="fa fa-file-pdf"></i></div>
      <div class="presupuesto-info">
        <strong>${escaparHtml(p.titulo)}</strong>
        ${p.numero ? `<span class="presupuesto-numero">N° ${escaparHtml(p.numero)}</span>` : ""}
        ${etiquetaEmpleadoPresupuesto(p)}
        ${mostrarCliente ? `<div class="presupuesto-cliente-link"><strong>${escaparHtml(p.cliente_nombre)} ${escaparHtml(p.cliente_apellido || "")}</strong> · ${escaparHtml(p.cliente_email || "")}</div>` : ""}
        <small>
          ${escaparHtml(p.nombre_archivo)}
          · ${formatearFecha(p.creado_en)}
          ${p.tamano_bytes ? ` · ${Math.round(p.tamano_bytes / 1024)} KB` : ""}
        </small>
        ${p.notas ? `<p class="presupuesto-notas">${escaparHtml(p.notas)}</p>` : ""}
      </div>
      <div class="presupuesto-acciones">
        <a class="btn btn-primary btn-sm" href="${urlPresupuestoPdf(p.url)}" target="_blank" rel="noopener">
          <i class="fa fa-eye"></i> Ver PDF
        </a>
        ${mostrarCliente ? `<button type="button" class="btn btn-secondary btn-sm" onclick="verPresupuestos(${p.cliente_id})">Ver cliente</button>` : ""}
        <button type="button" class="btn btn-danger btn-sm" onclick="eliminarPresupuesto(${p.id})">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </article>
  `;
}

async function buscarPresupuestoGlobal(pagina) {
  const numero = (document.getElementById("buscarPresupuestoGlobal")?.value || "").trim();
  const cont = document.getElementById("resultadosPresupuestoGlobal");
  if (!cont) return;

  if (!numero) {
    cont.style.display = "none";
    cont.innerHTML = "";
    return;
  }

  presupuestoBusquedaGlobalPagina = pagina || 1;
  cont.style.display = "block";
  cont.innerHTML = "<p class='consultas-vacio'>Buscando presupuesto...</p>";

  try {
    const data = await apiGet(
      `/presupuestos/buscar?numero=${encodeURIComponent(numero)}&pagina=${presupuestoBusquedaGlobalPagina}&limite=10`
    );

    if (!data.presupuestos.length) {
      cont.innerHTML = `<p class='consultas-vacio'>No se encontró ningún presupuesto con N° “${escaparHtml(numero)}”.</p>`;
      return;
    }

    cont.innerHTML = `
      <div class="presupuestos-busqueda-header">
        <h3>Resultados por N° de presupuesto</h3>
        <small>${data.total} encontrado${data.total !== 1 ? "s" : ""}</small>
      </div>
      <div class="presupuestos-lista">
        ${data.presupuestos.map(p => renderPresupuestoItem(p, true)).join("")}
      </div>
      <div id="resultadosPresupuestoGlobalPag" class="marketing-paginacion"></div>
    `;

    if (data.total_paginas > 1) {
      renderPaginacionTabla("resultadosPresupuestoGlobalPag", {
        total: data.total,
        pagina: data.pagina,
        limite: data.limite,
        total_paginas: data.total_paginas
      }, "buscarPresupuestoGlobalPagina");
    } else {
      document.getElementById("resultadosPresupuestoGlobalPag").innerHTML = "";
    }
  } catch (e) {
    cont.innerHTML = `<p class='consultas-vacio'>${escaparHtml(e.message)}</p>`;
  }
}

function buscarPresupuestoGlobalPagina(pagina) {
  buscarPresupuestoGlobal(pagina);
}

function aplicarFiltrosPresupuestosCliente() {
  presupuestosFiltros.numero = (document.getElementById("filtroNumeroPresupuesto")?.value || "").trim();
  presupuestosFiltros.buscar = (document.getElementById("filtroTextoPresupuesto")?.value || "").trim();
  presupuestosFiltros.dias = parseInt(document.getElementById("filtroPeriodoPresupuesto")?.value || "0", 10);
  presupuestosFiltros.empleado_id = document.getElementById("filtroEmpleadoPresupuesto")?.value || "";
  presupuestosPagina = 1;
  cargarPresupuestosCliente();
}

let marketingFiltros = { buscar: "", categoria: "todos", rubro: "", pagina: 1, limite: 15 };
let marketingClientes = [];
let marketingItemSeleccionado = {};
let marketingBuscarTimer = null;
let diasEspecialesGlobal = [];

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DIAS_SEMANA_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const COLORES_RUBRO_CALENDARIO = {
  arquitecto: "#1565c0",
  ingeniero: "#ef6c00",
  electricista: "#f9a825",
  diseñador_interiores: "#7b1fa2",
  constructor: "#546e7a",
  municipalidad: "#00838f",
  empresa_industrial: "#455a64",
  comercio: "#6d4c41",
  particular: "#78909c",
  otro: "#9e9e9e",
  general: "#c62828"
};

function actualizarFechaHeader() {
  const el = document.getElementById("fechaActualCRM");
  if (!el) return;
  const ahora = new Date();
  const texto = ahora.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires"
  });
  el.innerHTML = `<i class="fa fa-calendar-day"></i>${texto}`;
}

function colorRubroCalendario(rubro) {
  return COLORES_RUBRO_CALENDARIO[rubro] || COLORES_RUBRO_CALENDARIO.general;
}

function etiquetaRubroCalendario(rubro) {
  if (!rubro) return "Todos los clientes";
  return rubro.replace(/_/g, " ");
}

function diasEspecialesEnMes(dias, mes) {
  const map = {};
  dias.forEach(d => {
    if (d.mes === mes) map[d.dia] = d;
  });
  return map;
}

function renderCalendarioAnual(dias) {
  const anio = new Date().getFullYear();
  const hoy = new Date();
  const mesHoy = hoy.getMonth() + 1;
  const diaHoy = hoy.getDate();

  document.getElementById("anioCalendarioComercial").textContent = anio;

  const rubrosUsados = new Set();
  dias.forEach(d => rubrosUsados.add(d.rubro_objetivo || "general"));

  document.getElementById("leyendaCalendario").innerHTML = [
    ...Array.from(rubrosUsados).map(r => {
      const key = r || "general";
      return `<span class="calendario-leyenda-item">
        <span class="calendario-leyenda-color" style="background:${colorRubroCalendario(key === "general" ? null : key)}"></span>
        ${key === "general" ? "General" : etiquetaRubroCalendario(key)}
      </span>`;
    }),
    `<span class="calendario-leyenda-item">
      <span class="calendario-leyenda-color" style="background:#fff;border:2px solid #2e7d32;"></span>
      1° del mes (cuenta corriente)
    </span>`,
    `<span class="calendario-leyenda-item">
      <span class="calendario-leyenda-color" style="background:#fff;border:2px solid #c62828;"></span>
      Hoy
    </span>`
  ].join("");

  document.getElementById("gridCalendarioAnual").innerHTML = MESES_ES.map((nombreMes, idx) => {
    const mes = idx + 1;
    const especiales = diasEspecialesEnMes(dias, mes);
    const primerDia = new Date(anio, idx, 1);
    const offset = (primerDia.getDay() + 6) % 7;
    const totalDias = new Date(anio, mes, 0).getDate();

    let celdas = DIAS_SEMANA_ES.map(d => `<span>${d}</span>`).join("");
    celdas = `<div class="calendario-dias-semana">${celdas}</div><div class="calendario-celdas">`;

    for (let i = 0; i < offset; i++) {
      celdas += `<div class="calendario-dia vacio"></div>`;
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const esHoy = mes === mesHoy && dia === diaHoy;
      const especial = especiales[dia];
      const esCtaCte = dia === 1;
      let clases = "calendario-dia";
      let estilo = "";
      let title = "";

      if (especial) {
        clases += " especial";
        estilo = `background:${colorRubroCalendario(especial.rubro_objetivo)};`;
        title = `${especial.nombre} — ${etiquetaRubroCalendario(especial.rubro_objetivo)}`;
      }
      if (esCtaCte) {
        clases += " cta-cte";
        title = title ? title + " | Recordatorio cuenta corriente" : "Recordatorio mensual cuenta corriente";
      }
      if (esHoy) clases += " hoy";

      celdas += `<div class="${clases}" style="${estilo}" title="${(title || "").replace(/"/g, "&quot;")}">${dia}</div>`;
    }

    celdas += "</div>";

    return `<div class="calendario-mes"><h4>${nombreMes}</h4>${celdas}</div>`;
  }).join("");
}

function renderProximosDiasEspeciales(dias) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const anio = hoy.getFullYear();

  const proximos = dias.map(d => {
    let fecha = new Date(anio, d.mes - 1, d.dia);
    if (fecha < hoy) fecha = new Date(anio + 1, d.mes - 1, d.dia);
    const diff = Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
    return { ...d, fecha, diff };
  }).sort((a, b) => a.diff - b.diff).slice(0, 6);

  const el = document.getElementById("proximosDiasEspeciales");
  if (!el) return;

  if (proximos.length === 0) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = proximos.map(d => {
    const fechaTxt = d.fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
    const cuando = d.diff === 0 ? "¡Hoy!" : d.diff === 1 ? "Mañana" : `En ${d.diff} días`;
    return `<div class="proximo-dia-chip${d.diff === 0 ? " hoy" : ""}">
      <strong>${escaparHtml(d.nombre)}</strong>
      <small>${fechaTxt} · ${cuando} · ${escaparHtml(etiquetaRubroCalendario(d.rubro_objetivo))}</small>
    </div>`;
  }).join("");
}

function mostrarAlertaDiaEspecial(diasHoy) {
  const el = document.getElementById("alertaDiaEspecial");
  if (!el || diasHoy.length === 0) return;

  const clave = "alerta_dia_" + new Date().toISOString().split("T")[0];
  if (sessionStorage.getItem(clave) === "cerrada") {
    el.style.display = "none";
    return;
  }

  const nombres = diasHoy.map(d => d.nombre).join(", ");
  el.innerHTML = `
    <div>
      <strong><i class="fa fa-bell"></i> Día especial comercial — ${escaparHtml(nombres)}</strong>
      <p>Hoy es un día importante del calendario Ituarte. Revisá Marketing → Oportunidades de contacto para ver clientes sugeridos.</p>
    </div>
    <button type="button" class="btn-cerrar-alerta" onclick="cerrarAlertaDiaEspecial()" title="Cerrar">&times;</button>
  `;
  el.style.display = "flex";
}

function cerrarAlertaDiaEspecial() {
  const clave = "alerta_dia_" + new Date().toISOString().split("T")[0];
  sessionStorage.setItem(clave, "cerrada");
  document.getElementById("alertaDiaEspecial").style.display = "none";
}

function notificarDiaEspecialNavegador(diasHoy) {
  if (!diasHoy.length || !("Notification" in window)) return;

  const clave = "notif_nav_" + new Date().toISOString().split("T")[0];
  if (sessionStorage.getItem(clave) === "1") return;

  const mostrar = () => {
    const titulo = diasHoy.length === 1
      ? `Hoy: ${diasHoy[0].nombre}`
      : `Hoy: ${diasHoy.length} días especiales en Ituarte`;
    new Notification("CRM Ituarte — Calendario comercial", {
      body: "Revisá las oportunidades de contacto en Marketing.",
      icon: "/img/logologin.png"
    });
    sessionStorage.setItem(clave, "1");
  };

  if (Notification.permission === "granted") {
    mostrar();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => {
      if (p === "granted") mostrar();
    });
  }
}

function verificarDiaEspecialHoy(dias) {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const dia = hoy.getDate();
  const diasHoy = dias.filter(d => d.mes === mes && d.dia === dia);

  if (diasHoy.length > 0) {
    mostrarAlertaDiaEspecial(diasHoy);
    notificarDiaEspecialNavegador(diasHoy);
    mostrarToast(`Hoy es ${diasHoy.map(d => d.nombre).join(" y ")} — revisá Marketing`);
  }

  return diasHoy;
}

async function cargarCalendarioComercial() {
  try {
    diasEspecialesGlobal = await apiGet("/marketing/dias-especiales");
    renderCalendarioAnual(diasEspecialesGlobal);
    renderProximosDiasEspeciales(diasEspecialesGlobal);
    verificarDiaEspecialHoy(diasEspecialesGlobal);
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function paramsOportunidades() {
  const p = new URLSearchParams();
  if (marketingFiltros.buscar) p.set("buscar", marketingFiltros.buscar);
  if (marketingFiltros.categoria && marketingFiltros.categoria !== "todos") {
    p.set("categoria", marketingFiltros.categoria);
  }
  if (marketingFiltros.rubro) p.set("rubro", marketingFiltros.rubro);
  p.set("pagina", marketingFiltros.pagina);
  p.set("limite", marketingFiltros.limite);
  return p.toString();
}

function claseMotivo(categoria) {
  return categoria || "";
}

function renderResumenMarketing(resumen) {
  const el = document.getElementById("resumenMarketing");
  if (!el || !resumen) return;
  el.innerHTML = `
    <span class="chip-resumen"><strong>${resumen.total_clientes}</strong> pendientes</span>
    <span class="chip-resumen chip-enviado"><strong>${resumen.enviados_semana || 0}</strong> enviados (7 días)</span>
    <span class="chip-resumen"><strong>${resumen.urgente}</strong> urgentes hoy</span>
    <span class="chip-resumen"><strong>${resumen.semana}</strong> esta semana</span>
    <span class="chip-resumen"><strong>${resumen.campana}</strong> en campañas</span>
    <span class="chip-resumen"><strong>${resumen.cuenta_corriente}</strong> cuenta corriente</span>
  `;
}

function renderPaginacionMarketing(data) {
  const el = document.getElementById("paginacionMarketing");
  if (!el) return;

  if (data.total === 0) {
    el.innerHTML = "";
    return;
  }

  const desde = (data.pagina - 1) * data.limite + 1;
  const hasta = Math.min(data.pagina * data.limite, data.total);

  el.innerHTML = `
    <small>Mostrando ${desde}-${hasta} de ${data.total} clientes</small>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" ${data.pagina <= 1 ? "disabled" : ""}
        onclick="cambiarPaginaMarketing(${data.pagina - 1})">Anterior</button>
      <span style="align-self:center;font-size:13px;color:#64748b;">Página ${data.pagina} de ${data.total_paginas}</span>
      <button class="btn btn-secondary btn-sm" ${data.pagina >= data.total_paginas ? "disabled" : ""}
        onclick="cambiarPaginaMarketing(${data.pagina + 1})">Siguiente</button>
    </div>
  `;
}

function cambiarPaginaMarketing(pagina) {
  marketingFiltros.pagina = Math.max(1, pagina);
  cargarOportunidadesMarketing().catch(e => mostrarToast(e.message, true));
}

function cambiarMotivoOportunidad(cardIndex, itemIndex) {
  marketingItemSeleccionado[cardIndex] = itemIndex;
  const cliente = marketingClientes[cardIndex];
  if (!cliente) return;
  const item = cliente.items[itemIndex];
  const ta = document.getElementById("msg_" + cardIndex);
  if (ta && item) ta.value = item.mensaje;
  const archivosDiv = document.getElementById("archivos_" + cardIndex);
  if (archivosDiv) archivosDiv.innerHTML = renderArchivosCampana(item.archivos);
}

function renderOportunidadesMarketing(clientes) {
  marketingClientes = clientes;
  marketingItemSeleccionado = {};
  const lista = document.getElementById("listaMarketing");

  if (clientes.length === 0) {
    const msg = marketingFiltros.categoria === "cuenta_corriente"
      ? "Los recordatorios de cuenta corriente aparecen el <strong>1° de cada mes</strong> para clientes marcados con cta. cte. en su perfil."
      : "No hay oportunidades con esos filtros. Probá otra categoría o actualizá la lista.";
    lista.innerHTML = `<p style='color:#64748b;'>${msg}</p>`;
    return;
  }

  lista.innerHTML = clientes.map((c, i) => {
    marketingItemSeleccionado[i] = 0;
    const item = c.items[0];
    const selectMotivos = c.items.length > 1
      ? `<label style="font-size:12px;color:#64748b;display:block;margin-top:8px;">Motivo a contactar:</label>
         <select class="marketing-item-select" onchange="cambiarMotivoOportunidad(${i}, parseInt(this.value, 10))">
           ${c.items.map((it, j) => `<option value="${j}">${escaparHtml(it.motivo)}</option>`).join("")}
         </select>`
      : "";

    return `
      <div class="seguimiento-item oportunidad-card" data-opp-index="${i}" style="margin-bottom:16px;">
        <strong>${escaparHtml(c.cliente_nombre)}</strong>
        ${c.cuenta_corriente ? " · Cta. cte." : ""}
        ${c.rubro ? " · " + escaparHtml(c.rubro) : ""}
        ${c.empresa ? " · " + escaparHtml(c.empresa) : ""}
        <br>
        <div class="marketing-motivos">
          ${c.items.map(it => `<span class="marketing-motivo ${claseMotivo(it.categoria)}">${escaparHtml(it.motivo)}</span>`).join("")}
        </div>
        <small style="display:block;margin:4px 0;">${escaparHtml(c.email || "")} ${c.telefono ? "· " + escaparHtml(c.telefono) : ""}</small>
        ${selectMotivos}
        <label style="font-size:12px;color:#64748b;margin-top:8px;display:block;">Mensaje (editable):</label>
        <textarea id="msg_${i}" rows="3" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;font-size:14px;margin-top:4px;">${escaparHtml(item.mensaje)}</textarea>
        <div id="archivos_${i}">${renderArchivosCampana(item.archivos)}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px;margin-right:6px;"
          onclick="copiarMensajeEditado(${i})">Copiar mensaje</button>
        <button class="btn btn-success btn-sm" style="margin-top:8px;"
          onclick="marcarEnviadoEditado(${i})">
          <i class="fa fa-check"></i> Marcar como enviado
        </button>
      </div>
    `;
  }).join("");
}

async function cargarOportunidadesMarketing() {
  const data = await apiGet("/marketing/oportunidades?" + paramsOportunidades());
  renderResumenMarketing(data.resumen);
  renderOportunidadesMarketing(data.clientes || []);
  renderPaginacionMarketing(data);

  const avisoEl = document.getElementById("avisoMarketing");
  if (avisoEl) {
    if (data.aviso) {
      avisoEl.textContent = data.aviso;
      avisoEl.style.display = "block";
    } else {
      avisoEl.style.display = "none";
    }
  }
}

async function cargarDatosTabMarketing(tab) {
  switch (tab) {
    case "calendario":
      await cargarCalendarioComercial();
      if (esGerente) await cargarEditorDiasCalendario();
      break;
    case "campanas":
      await cargarCampanasActivas();
      break;
    case "oportunidades":
      await cargarOportunidadesMarketing();
      break;
    case "plantillas":
      if (esGerente) await cargarEditorPlantillasAuto();
      break;
  }
}

function cambiarTabMarketing(tab) {
  marketingTabActiva = tab;

  document.querySelectorAll(".marketing-seccion-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.marketingTab === tab);
  });

  document.querySelectorAll(".marketing-seccion-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  const panel = document.getElementById("marketingTab" + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (panel) panel.classList.add("active");

  cargarDatosTabMarketing(tab);
}

async function cargarMarketing() {
  try {
    if (marketingTabActiva === "oportunidades") await cargarOportunidadesMarketing();
    if (marketingTabActiva === "campanas") await cargarCampanasActivas();
    if (marketingTabActiva === "calendario") {
      await cargarCalendarioComercial();
      if (esGerente) await cargarEditorDiasCalendario();
    }
    if (marketingTabActiva === "plantillas" && esGerente) {
      await cargarEditorPlantillasAuto();
    }
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function escaparHtml(texto) {
  return (texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderArchivosCampana(archivos) {
  if (!archivos || archivos.length === 0) return "";
  const icono = { imagen: "fa-image", video: "fa-video", documento: "fa-file" };
  return `
    <div style="margin-top:8px;padding:8px;background:#f0f9ff;border-radius:8px;">
      <small style="color:#0369a1;font-weight:600;display:block;margin-bottom:6px;">
        <i class="fa fa-paperclip"></i> Material de la campaña (descargar para WhatsApp / Instagram):
      </small>
      ${archivos.map(a => `
        <a href="${a.url}" download="${escaparHtml(a.nombre)}" target="_blank"
           class="btn btn-secondary btn-sm" style="margin:2px 4px 2px 0;display:inline-block;">
          <i class="fa ${icono[a.tipo] || "fa-file"}"></i> ${escaparHtml(a.nombre)}
        </a>
      `).join("")}
    </div>`;
}

function obtenerMensajeEditado(index) {
  const ta = document.getElementById("msg_" + index);
  if (ta) return ta.value;
  const cliente = marketingClientes[index];
  if (!cliente) return "";
  const itemIndex = marketingItemSeleccionado[index] || 0;
  return cliente.items[itemIndex]?.mensaje || "";
}

function obtenerItemSeleccionado(index) {
  const cliente = marketingClientes[index];
  if (!cliente) return null;
  const itemIndex = marketingItemSeleccionado[index] || 0;
  return cliente.items[itemIndex] || null;
}

function copiarMensajeEditado(index) {
  const msg = obtenerMensajeEditado(index);
  navigator.clipboard.writeText(msg).then(() => mostrarToast("Mensaje copiado"));
}

async function marcarEnviadoEditado(index) {
  const item = obtenerItemSeleccionado(index);
  const cliente = marketingClientes[index];
  if (!item || !cliente) return;

  const card = document.querySelector(`.oportunidad-card[data-opp-index="${index}"]`);
  if (card) card.classList.add("oportunidad-enviada");

  try {
    const res = await apiPost("/marketing/registrar-envio", {
      cliente_id: cliente.cliente_id,
      tipo_campana: item.tipo_campana,
      mensaje: obtenerMensajeEditado(index),
      estado: "enviado"
    });

    if (res.ya_registrado) {
      mostrarToast("Este contacto ya estaba registrado — se quitó de la lista");
    } else {
      mostrarToast("Enviado — quitado de pendientes");
    }

    setTimeout(async () => {
      marketingClientes.splice(index, 1);
      if (marketingClientes.length === 0 && marketingFiltros.pagina > 1) {
        marketingFiltros.pagina--;
      }
      await cargarOportunidadesMarketing();
    }, 600);
  } catch (e) {
    if (card) card.classList.remove("oportunidad-enviada");
    mostrarToast(e.message, true);
  }
}

async function cargarCampanasActivas() {
  const campanas = await apiGet("/marketing/campanas");
  const activas = campanas.filter(c => c.activo);
  const lista = document.getElementById("listaCampanasActivas");
  if (!lista) return;

  if (activas.length === 0) {
    lista.innerHTML = "<p style='color:#64748b;font-size:14px;'>No hay campañas activas en este momento.</p>";
    return;
  }

  const esAdmin = esGerente;

  lista.innerHTML = activas.map(c => `
    <div class="seguimiento-item" style="margin-bottom:12px;">
      <strong>${escaparHtml(c.titulo)}</strong>
      ${c.fecha_inicio ? `<small> · ${c.fecha_inicio} al ${c.fecha_fin || "..."}</small>` : ""}
      ${c.rubro_objetivo ? `<small> · Rubro: ${escaparHtml(c.rubro_objetivo.replace(/_/g, " "))}</small>` : ""}
      <p style="font-size:13px;margin:8px 0;white-space:pre-wrap;">${escaparHtml(c.mensaje_plantilla)}</p>
      ${renderArchivosCampana(c.archivos)}
      ${esAdmin ? `
        <div style="margin-top:8px;">
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin-right:6px;">
            <i class="fa fa-upload"></i> Agregar archivos
            <input type="file" multiple accept="image/*,video/*,.pdf,.txt" style="display:none;"
              onchange="subirArchivosCampana(${c.id}, this)">
          </label>
          <button class="btn btn-danger btn-sm" onclick="desactivarCampana(${c.id})">Desactivar</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

async function cargarCampanas() {
  await cargarCampanasActivas();
}

async function subirArchivosCampana(campanaId, input) {
  if (!input.files.length) return;
  try {
    await apiSubirArchivos("/marketing/campanas/" + campanaId + "/archivos", input.files);
    mostrarToast("Archivos subidos");
    input.value = "";
    await cargarMarketing();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function guardarCampana(e) {
  e.preventDefault();
  try {
    const campana = await apiPost("/marketing/campanas", {
      titulo: document.getElementById("campTitulo").value,
      mensaje_plantilla: document.getElementById("campMensaje").value,
      rubro_objetivo: document.getElementById("campRubro").value || null,
      fecha_inicio: document.getElementById("campInicio").value || null,
      fecha_fin: document.getElementById("campFin").value || null
    });
    const archivos = document.getElementById("campArchivos").files;
    if (archivos.length > 0) {
      await apiSubirArchivos("/marketing/campanas/" + campana.id + "/archivos", archivos);
    }
    mostrarToast(archivos.length > 0 ? "Campaña publicada con archivos" : "Campaña publicada");
    document.getElementById("formCampana").reset();
    await cargarMarketing();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function desactivarCampana(id) {
  if (!confirm("¿Desactivar esta campaña?")) return;
  await apiDelete("/marketing/campanas/" + id);
  mostrarToast("Campaña desactivada");
  await cargarMarketing();
}

async function cargarEditorPlantillasAuto() {
  const plantillas = await apiGet("/marketing/plantillas");
  document.getElementById("editorPlantillas").innerHTML = plantillas.map(p => `
    <div style="margin-bottom:16px;padding:12px;background:#f8f9fa;border-radius:8px;">
      <strong>${p.nombre}</strong>
      <textarea id="tpl_${p.codigo}" rows="3" style="width:100%;margin-top:8px;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;">${escaparHtml(p.plantilla)}</textarea>
      <button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="guardarPlantilla('${p.codigo}')">Guardar plantilla</button>
    </div>
  `).join("");
}

async function cargarEditorDiasCalendario() {
  const dias = await apiGet("/marketing/dias-especiales");
  document.getElementById("editorDiasEspeciales").innerHTML = dias.length === 0
    ? "<p style='color:#64748b;font-size:14px;'>No hay días cargados. Agregá uno con el formulario de arriba.</p>"
    : dias.map(d => `
    <div style="margin-bottom:16px;padding:12px;background:#f8f9fa;border-radius:8px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
        <div class="form-grupo" style="margin:0;">
          <label style="font-size:12px;">Nombre</label>
          <input type="text" id="dia_nombre_${d.id}" value="${escaparHtml(d.nombre)}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="form-grupo" style="margin:0;">
            <label style="font-size:12px;">Mes</label>
            <input type="number" id="dia_mes_${d.id}" value="${d.mes}" min="1" max="12" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
          </div>
          <div class="form-grupo" style="margin:0;">
            <label style="font-size:12px;">Día</label>
            <input type="number" id="dia_dia_${d.id}" value="${d.dia}" min="1" max="31" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
          </div>
        </div>
      </div>
      <div class="form-grupo" style="margin-bottom:8px;">
        <label style="font-size:12px;">Rubro objetivo (vacío = todos)</label>
        <select id="dia_rubro_${d.id}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
          <option value="" ${!d.rubro_objetivo ? "selected" : ""}>Todos</option>
          <option value="arquitecto" ${d.rubro_objetivo === "arquitecto" ? "selected" : ""}>Arquitecto</option>
          <option value="electricista" ${d.rubro_objetivo === "electricista" ? "selected" : ""}>Electricista</option>
          <option value="ingeniero" ${d.rubro_objetivo === "ingeniero" ? "selected" : ""}>Ingeniero</option>
          <option value="diseñador_interiores" ${d.rubro_objetivo === "diseñador_interiores" ? "selected" : ""}>Diseñador</option>
          <option value="comercio" ${d.rubro_objetivo === "comercio" ? "selected" : ""}>Comercio</option>
        </select>
      </div>
      <label style="font-size:12px;color:#64748b;">Mensaje</label>
      <textarea id="dia_${d.id}" rows="3" style="width:100%;margin-top:4px;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;">${escaparHtml(d.plantilla)}</textarea>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="guardarDiaEspecial(${d.id})">Guardar cambios</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarDiaEspecial(${d.id}, '${escaparHtml(d.nombre).replace(/'/g, "\\'")}')">Quitar del calendario</button>
      </div>
    </div>
  `).join("");
}

async function crearDiaEspecial(e) {
  e.preventDefault();
  try {
    await apiPost("/marketing/dias-especiales/nuevo", {
      nombre: document.getElementById("nuevoDiaNombre").value,
      mes: parseInt(document.getElementById("nuevoDiaMes").value, 10),
      dia: parseInt(document.getElementById("nuevoDiaDia").value, 10),
      rubro_objetivo: document.getElementById("nuevoDiaRubro").value || null,
      plantilla: document.getElementById("nuevoDiaPlantilla").value
    });
    mostrarToast("Fecha agregada al calendario");
    document.getElementById("formNuevoDiaEspecial").reset();
    await cargarEditorDiasCalendario();
    await cargarCalendarioComercial();
    await cargarMarketing();
  } catch (err) {
    mostrarToast(err.message, true);
  }
}

async function guardarPlantilla(codigo) {
  try {
    await apiPut("/marketing/plantillas/" + codigo, {
      plantilla: document.getElementById("tpl_" + codigo).value
    });
    mostrarToast("Plantilla guardada");
    await cargarEditorPlantillasAuto();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function guardarDiaEspecial(id) {
  try {
    await apiPut("/marketing/dias-especiales/" + id, {
      nombre: document.getElementById("dia_nombre_" + id).value,
      mes: parseInt(document.getElementById("dia_mes_" + id).value, 10),
      dia: parseInt(document.getElementById("dia_dia_" + id).value, 10),
      rubro_objetivo: document.getElementById("dia_rubro_" + id).value || null,
      plantilla: document.getElementById("dia_" + id).value
    });
    mostrarToast("Día del calendario actualizado");
    await cargarEditorDiasCalendario();
    await cargarCalendarioComercial();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function eliminarDiaEspecial(id, nombre) {
  if (!confirm(`¿Quitar "${nombre}" del calendario comercial?`)) return;
  try {
    await apiDelete("/marketing/dias-especiales/" + id);
    mostrarToast("Día eliminado del calendario");
    await cargarEditorDiasCalendario();
    await cargarCalendarioComercial();
    await cargarMarketing();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

document.getElementById("buscarCliente").addEventListener("input", function() {
  clientesPagina = 1;
  clearTimeout(clientesBuscarTimer);
  clientesBuscarTimer = setTimeout(() => cargarClientes(), 350);
});

document.getElementById("filtroRubroCliente").addEventListener("change", function() {
  clientesPagina = 1;
  cargarClientes();
});

document.getElementById("filtroPeriodoCliente").addEventListener("change", function() {
  clientesPagina = 1;
  cargarClientes();
});

const buscarEmpleadoEl = document.getElementById("buscarEmpleado");
if (buscarEmpleadoEl) {
  buscarEmpleadoEl.addEventListener("input", function() {
    empleadosPagina = 1;
    clearTimeout(empleadosBuscarTimer);
    empleadosBuscarTimer = setTimeout(() => cargarTablaEmpleados(), 350);
  });
}

const filtroEstadoEmpleadoEl = document.getElementById("filtroEstadoEmpleado");
if (filtroEstadoEmpleadoEl) {
  filtroEstadoEmpleadoEl.addEventListener("change", function() {
    empleadosPagina = 1;
    cargarTablaEmpleados();
  });
}

const filtroSucursalEmpleadoEl = document.getElementById("filtroSucursalEmpleado");
if (filtroSucursalEmpleadoEl) {
  filtroSucursalEmpleadoEl.addEventListener("change", function() {
    empleadosPagina = 1;
    cargarTablaEmpleados();
  });
}

const btnBuscarPresupuestoGlobal = document.getElementById("btnBuscarPresupuestoGlobal");
if (btnBuscarPresupuestoGlobal) {
  btnBuscarPresupuestoGlobal.addEventListener("click", () => buscarPresupuestoGlobal(1));
}
const buscarPresupuestoGlobalEl = document.getElementById("buscarPresupuestoGlobal");
if (buscarPresupuestoGlobalEl) {
  buscarPresupuestoGlobalEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarPresupuestoGlobal(1);
    }
  });
  buscarPresupuestoGlobalEl.addEventListener("input", function() {
    if (!this.value.trim()) {
      const cont = document.getElementById("resultadosPresupuestoGlobal");
      if (cont) { cont.style.display = "none"; cont.innerHTML = ""; }
    }
  });
}

["filtroNumeroPresupuesto", "filtroTextoPresupuesto"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", function() {
      clearTimeout(presupuestosBuscarTimer);
      presupuestosBuscarTimer = setTimeout(aplicarFiltrosPresupuestosCliente, 350);
    });
  }
});
const filtroPeriodoPresupuestoEl = document.getElementById("filtroPeriodoPresupuesto");
if (filtroPeriodoPresupuestoEl) {
  filtroPeriodoPresupuestoEl.addEventListener("change", aplicarFiltrosPresupuestosCliente);
}
const filtroEmpleadoPresupuestoEl = document.getElementById("filtroEmpleadoPresupuesto");
if (filtroEmpleadoPresupuestoEl) {
  filtroEmpleadoPresupuestoEl.addEventListener("change", aplicarFiltrosPresupuestosCliente);
}

const buscarOportunidadEl = document.getElementById("buscarOportunidad");
if (buscarOportunidadEl) {
  buscarOportunidadEl.addEventListener("input", function() {
    clearTimeout(marketingBuscarTimer);
    marketingBuscarTimer = setTimeout(() => {
      marketingFiltros.buscar = this.value.trim();
      marketingFiltros.pagina = 1;
      cargarOportunidadesMarketing().catch(e => mostrarToast(e.message, true));
    }, 350);
  });
}

const filtroRubroOportunidadEl = document.getElementById("filtroRubroOportunidad");
if (filtroRubroOportunidadEl) {
  filtroRubroOportunidadEl.addEventListener("change", function() {
    marketingFiltros.rubro = this.value;
    marketingFiltros.pagina = 1;
    cargarOportunidadesMarketing().catch(e => mostrarToast(e.message, true));
  });
}

document.querySelectorAll(".marketing-seccion-tab").forEach(btn => {
  btn.addEventListener("click", () => cambiarTabMarketing(btn.dataset.marketingTab));
});

document.querySelectorAll(".marketing-tab").forEach(btn => {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".marketing-tab").forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    marketingFiltros.categoria = this.dataset.categoria;
    marketingFiltros.pagina = 1;
    cargarOportunidadesMarketing().catch(e => mostrarToast(e.message, true));
  });
});

async function desactivarCliente(id) {
  if (!confirm("¿Desactivar este cliente? (soft delete - no se borra de la base)")) return;
  try {
    await apiDelete("/clientes/" + id);
    mostrarToast("Cliente desactivado");
    await cargarRubrosClientes();
    await cargarClientes();
    await cargarDashboard();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function guardarSeguimiento(e) {
  e.preventDefault();
  try {
    const consultaId = document.getElementById("segConsultaId").value;
    const proximo = document.getElementById("segProximo").value;

    if (!consultaId) {
      mostrarToast("Seleccioná una consulta de la lista", true);
      return;
    }

    await apiPost("/seguimientos", {
      consulta_id: parseInt(consultaId, 10),
      nota: document.getElementById("segNota").value,
      proximo_contacto: proximo || null
    });

    mostrarToast("Seguimiento guardado correctamente");
    document.getElementById("formSeguimiento").reset();
    actualizarSelectConsultas();
    await cargarDashboard();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

async function exportarReporte(tipo, formato) {
  if (!esGerente) {
    mostrarToast("Solo el gerente puede exportar reportes", true);
    return;
  }
  try {
    const params = new URLSearchParams();

    if (tipo === "consultas") {
      const est = document.getElementById("repConsultasEstado")?.value || "activas";
      if (est === "activas") params.set("vista", "activas");
      else if (est === "todas") params.set("vista", "todas");
      else params.set("estado", est);
      params.set("dias", document.getElementById("repConsultasDias")?.value || "30");
    }

    if (tipo === "clientes") {
      const rubro = document.getElementById("repClientesRubro")?.value;
      const dias = document.getElementById("repClientesDias")?.value;
      if (rubro) params.set("rubro", rubro);
      if (dias) params.set("dias", dias);
    }

    if (tipo === "marketing") {
      params.set("dias", document.getElementById("repMarketingDias")?.value || "30");
    }

    const ext = formato === "excel" ? "xlsx" : "pdf";
    const res = await fetch(
      API_URL + `/exportar/${tipo}/${formato}?` + params.toString(),
      { headers: headersAuth() }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al exportar");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ituarte_${tipo}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast("Reporte descargado");
  } catch (e) {
    mostrarToast(e.message || "Error al exportar", true);
  }
}

async function cargarTablaEmpleados() {
  if (!esGerente) return;
  try {
    const params = new URLSearchParams();
    params.set("pagina", empleadosPagina);
    params.set("limite", String(LIMITE_EMPLEADOS_LISTA));

    const buscar = (document.getElementById("buscarEmpleado")?.value || "").trim();
    const estado = document.getElementById("filtroEstadoEmpleado")?.value || "activos";
    const sucursal = document.getElementById("filtroSucursalEmpleado")?.value || "";

    if (buscar) params.set("buscar", buscar);
    if (estado) params.set("estado", estado);
    if (sucursal) params.set("sucursal", sucursal);

    const data = await apiGet("/empleados/todos?" + params.toString());
    empleadosMeta = {
      total: data.total,
      pagina: data.pagina,
      limite: data.limite,
      total_paginas: data.total_paginas
    };
    empleadosPagina = data.pagina;

    const lista = data.empleados || [];
    const tbody = document.getElementById("tablaEmpleados");

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No hay empleados con esos criterios.</td></tr>`;
    } else {
      tbody.innerHTML = lista.map(e => `
        <tr>
          <td>${escaparHtml(e.nombre_completo)}</td>
          <td>${escaparHtml(e.email)}</td>
          <td>${escaparHtml(e.cargo)}</td>
          <td>${escaparHtml(e.sucursal)}</td>
          <td>${e.activo && e.usuario_activo
            ? '<span class="badge badge-finalizado">Activo</span>'
            : '<span class="badge badge-cancelado">Inactivo</span>'}</td>
          <td>
            ${e.activo && e.usuario_activo && e.usuario_id !== usuario.id
              ? `<button class="btn btn-danger btn-sm" onclick='desactivarEmpleado(${e.id}, ${JSON.stringify(e.nombre_completo)})'>Desactivar</button>`
              : "—"}
          </td>
        </tr>
      `).join("");
    }

    renderResumenEmpleados(data);
    renderPaginacionTabla("paginacionEmpleados", empleadosMeta, "cambiarPaginaEmpleados");
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

function renderResumenEmpleados(data) {
  const el = document.getElementById("resumenEmpleados");
  if (!el) return;

  const estado = document.getElementById("filtroEstadoEmpleado")?.value || "activos";
  const sucursal = document.getElementById("filtroSucursalEmpleado")?.value || "";
  const buscar = (document.getElementById("buscarEmpleado")?.value || "").trim();

  const etiquetaEstado = {
    activos: "solo activos",
    inactivos: "solo inactivos",
    todos: "activos e inactivos"
  }[estado] || "solo activos";

  let texto = `${data.total} empleado${data.total !== 1 ? "s" : ""} · ${etiquetaEstado}`;
  if (sucursal) texto += ` · Sucursal: ${sucursal}`;
  if (buscar) texto += ` · Búsqueda: “${buscar}”`;
  texto += " · Datos filtrados en el servidor (no se trae toda la base).";

  el.textContent = texto;
}

function cambiarPaginaEmpleados(pagina) {
  empleadosPagina = pagina;
  cargarTablaEmpleados();
}

async function crearEmpleado(e) {
  e.preventDefault();
  try {
    const password = document.getElementById("empPassword").value.trim();
    const body = {
      nombre: document.getElementById("empNombre").value,
      apellido: document.getElementById("empApellido").value,
      email: document.getElementById("empEmail").value,
      telefono: document.getElementById("empTelefono").value,
      cargo: document.getElementById("empCargo").value,
      sucursal: document.getElementById("empSucursal").value
    };
    if (password) body.password = password;

    const data = await apiPost("/empleados", body);

    alert(
      `Empleado creado correctamente.\n\n` +
      `Email: ${data.email}\n` +
      `Contraseña: ${data.password_temporal}\n\n` +
      `Copiá estos datos y compartilos con la persona. ` +
      `Puede ingresar en login.html y cambiar la contraseña desde Recuperar contraseña.`
    );

    document.getElementById("formNuevoEmpleado").reset();
    await cargarTablaEmpleados();
    await cargarEmpleados();
  } catch (err) {
    mostrarToast(err.message, true);
  }
}

async function desactivarEmpleado(id, nombre) {
  if (!confirm(`¿Desactivar a ${nombre}? Ya no podrá ingresar al CRM.`)) return;
  try {
    await apiPut("/empleados/" + id + "/desactivar", {});
    mostrarToast("Empleado desactivado");
    await cargarTablaEmpleados();
    await cargarEmpleados();
  } catch (e) {
    mostrarToast(e.message, true);
  }
}

cargarEmpleados().then(() => {
  cargarTablaEmpleados();
});
actualizarFechaHeader();
if (esGerente) {
  cargarCalendarioComercial();
  cargarMarketing();
} else {
  cambiarTabMarketing("oportunidades");
  cargarCalendarioComercial();
  cargarMarketing();
}
cargarDashboard();
cargarConsultas();
cargarRubrosClientes().then(() => cargarClientes());
