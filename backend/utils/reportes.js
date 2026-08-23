const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const EMPRESA = {
  nombre: "Electricidad Ituarte",
  subtitulo: "Sistema CRM — Gestión comercial",
  direccion: "Concepción, Tucumán — Argentina"
};

const COLOR_TEXTO_ROJO = "FFC62828";
const COLOR_GRIS_CLARO = "FFF8FAFC";
const COLOR_GRIS_FILA = "FFF1F5F9";
const COLOR_BORDE = "FFE2E8F0";
const COLOR_HEADER_TABLA = "FF475569";
const MAX_FILAS_REPORTE = 500;

const LOGO_CANDIDATOS = [
  path.join(__dirname, "..", "..", "img", "LOGO.png"),
  path.join(__dirname, "..", "..", "imagenes", "LOGO.png"),
  path.join(__dirname, "..", "assets", "logo.png"),
  path.join(__dirname, "..", "..", "img", "logologin.png")
];

function obtenerLogo() {
  return LOGO_CANDIDATOS.find(p => fs.existsSync(p)) || null;
}

function letraColumna(n) {
  let s = "";
  let num = n;
  while (num > 0) {
    const m = (num - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  return d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour12: false
  });
}

function formatearFechaCorta(valor) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  return d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

function formatearEstado(estado) {
  return (estado || "—").replace(/_/g, " ");
}

function truncarTexto(texto, max = 120) {
  const s = String(texto ?? "—");
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function nombreArchivo(tipo, extension) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `Ituarte_${tipo}_${fecha}.${extension}`;
}

function parseDias(query) {
  const dias = parseInt(query.dias, 10);
  if (Number.isNaN(dias) || dias <= 0) return null;
  return Math.min(dias, 365);
}

function parseLimite(query) {
  const limite = parseInt(query.limite, 10);
  if (Number.isNaN(limite) || limite <= 0) return MAX_FILAS_REPORTE;
  return Math.min(limite, MAX_FILAS_REPORTE);
}

function valorCelda(fila, col) {
  let val = fila[col.key];
  if (col.format === "fecha") val = formatearFecha(val);
  if (col.format === "fecha_corta") val = formatearFechaCorta(val);
  if (col.format === "estado") val = formatearEstado(val);
  if (col.format === "si_no") val = val ? "Sí" : "No";
  return val ?? "";
}

function calcularAnchoColumnaExcel(textos, min = 10, max = 45) {
  const mayor = textos.reduce((m, t) => Math.max(m, String(t ?? "").length), 0);
  return Math.min(max, Math.max(min, mayor + 2));
}

async function generarExcel(res, { titulo, subtitulo, hojaNombre, columnas, filas, filtrosTexto }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = EMPRESA.nombre;
  workbook.created = new Date();

  const nombreHoja = (hojaNombre || "Reporte").slice(0, 31);
  const ws = workbook.addWorksheet(nombreHoja, {
    views: [{ state: "normal" }]
  });

  const numCols = columnas.length;
  const ultimaCol = letraColumna(numCols);
  const usarLandscape = numCols > 7;

  ws.mergeCells(`A1:${ultimaCol}1`);
  const c1 = ws.getCell("A1");
  c1.value = EMPRESA.nombre.toUpperCase();
  c1.font = { bold: true, size: 16, color: { argb: COLOR_TEXTO_ROJO } };
  c1.alignment = { vertical: "middle", horizontal: "center" };
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GRIS_CLARO } };
  ws.getRow(1).height = 26;

  ws.mergeCells(`A2:${ultimaCol}2`);
  const c2 = ws.getCell("A2");
  c2.value = titulo;
  c2.font = { bold: true, size: 13, color: { argb: "FF1E293B" } };
  c2.alignment = { horizontal: "center", vertical: "middle" };
  c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GRIS_CLARO } };

  ws.mergeCells(`A3:${ultimaCol}3`);
  const c3 = ws.getCell("A3");
  c3.value = subtitulo || EMPRESA.subtitulo;
  c3.font = { size: 11, color: { argb: "FF64748B" } };
  c3.alignment = { horizontal: "center", wrapText: true };

  ws.mergeCells(`A4:${ultimaCol}4`);
  const c4 = ws.getCell("A4");
  c4.value = `Generado: ${formatearFecha(new Date())}${filtrosTexto ? "  |  " + filtrosTexto : ""}`;
  c4.font = { size: 10, italic: true, color: { argb: "FF94A3B8" } };
  c4.alignment = { horizontal: "center", wrapText: true };
  ws.getRow(4).height = 22;

  ws.addRow([]);

  const headerRow = ws.addRow(columnas.map(c => c.header));
  headerRow.height = 24;
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > numCols) return;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_TABLA } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = bordeCelda();
  });

  const textosPorColumna = columnas.map(c => [c.header]);
  const filaInicioDatos = headerRow.number;

  filas.forEach((fila, i) => {
    const valores = columnas.map(c => valorCelda(fila, c));
    valores.forEach((v, idx) => textosPorColumna[idx].push(v));
    const row = ws.addRow(valores);
    row.height = 22;
    const bg = i % 2 === 0 ? "FFFFFFFF" : COLOR_GRIS_FILA;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > numCols) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.border = bordeCelda();
      cell.alignment = { vertical: "top", wrapText: true };
    });
  });

  columnas.forEach((col, i) => {
    const ancho = calcularAnchoColumnaExcel(textosPorColumna[i], col.minWidth || 10, col.maxWidth || 42);
    ws.getColumn(i + 1).width = ancho;
  });

  ws.views = [{ state: "frozen", ySplit: filaInicioDatos, activeCell: `A${filaInicioDatos + 1}` }];

  if (filas.length > 0) {
    ws.autoFilter = {
      from: { row: filaInicioDatos, column: 1 },
      to: { row: filaInicioDatos, column: numCols }
    };
  }

  const footerRow = ws.rowCount + 2;
  ws.mergeCells(`A${footerRow}:${ultimaCol}${footerRow}`);
  const cf = ws.getCell(`A${footerRow}`);
  cf.value = `${EMPRESA.nombre} — ${EMPRESA.direccion} — Total registros: ${filas.length}`;
  cf.font = { size: 9, color: { argb: "FF94A3B8" } };
  cf.alignment = { horizontal: "center" };

  ws.pageSetup = {
    paperSize: 9,
    orientation: usarLandscape ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 }
  };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${nombreArchivo(nombreHoja, "xlsx")}`);
  await workbook.xlsx.write(res);
}

function bordeCelda() {
  return {
    top: { style: "thin", color: { argb: COLOR_BORDE } },
    bottom: { style: "thin", color: { argb: COLOR_BORDE } },
    left: { style: "thin", color: { argb: COLOR_BORDE } },
    right: { style: "thin", color: { argb: COLOR_BORDE } }
  };
}

function calcularAnchosPdf(columnas, anchoDisponible) {
  const pesos = columnas.map(c => c.pdfPeso || 1);
  const total = pesos.reduce((a, b) => a + b, 0);
  const widths = pesos.map(p => Math.floor((anchoDisponible * p) / total));
  const usado = widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += anchoDisponible - usado;
  return widths;
}

function generarPdf(res, { titulo, subtitulo, columnas, filas, filtrosTexto }) {
  const pageMargins = { top: 40, bottom: 44, left: 40, right: 40 };

  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: pageMargins
  });

  const logo = obtenerLogo();
  let numPagina = 1;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${nombreArchivo(titulo.replace(/\s+/g, "_").toLowerCase(), "pdf")}`
  );
  doc.pipe(res);

  function medidasPagina() {
    const ml = doc.page.margins.left;
    const mr = doc.page.margins.right;
    const anchoUtil = doc.page.width - ml - mr;
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 24;
    return { marginLeft: ml, anchoUtil, bottomLimit };
  }

  function resetCursor(yPos) {
    doc.x = medidasPagina().marginLeft;
    doc.y = yPos;
  }

  function dibujarPiePagina() {
    const { marginLeft, anchoUtil } = medidasPagina();
    const pieY = doc.page.height - doc.page.margins.bottom - 10;
    doc.save();
    doc.fillColor("#94a3b8").font("Helvetica").fontSize(7);
    doc.text(
      `${EMPRESA.nombre}  ·  Página ${numPagina}  ·  ${filas.length} registros`,
      marginLeft,
      pieY,
      { width: anchoUtil, align: "center", lineBreak: false }
    );
    doc.restore();
    resetCursor(doc.y);
  }

  function dibujarEncabezadoPrincipal() {
    const { marginLeft, anchoUtil } = medidasPagina();
    const top = doc.page.margins.top;
    const altoCaja = 72;
    const logoAncho = 118;
    const logoAlto = 50;
    let contenidoX = marginLeft + 12;

    doc.save();
    doc.rect(marginLeft, top, anchoUtil, altoCaja).fill("#ffffff");
    doc.rect(marginLeft, top, anchoUtil, altoCaja).strokeColor("#e2e8f0").lineWidth(0.8).stroke();
    doc.moveTo(marginLeft, top + altoCaja)
      .lineTo(marginLeft + anchoUtil, top + altoCaja)
      .lineWidth(1)
      .strokeColor("#c62828")
      .stroke();

    if (logo) {
      try {
        doc.image(logo, marginLeft + 12, top + (altoCaja - logoAlto) / 2, {
          fit: [logoAncho, logoAlto]
        });
        contenidoX = marginLeft + 12 + logoAncho + 14;
      } catch {
        contenidoX = marginLeft + 12;
      }
    }

    const anchoTexto = marginLeft + anchoUtil - contenidoX - 12;
    const meta = `Generado: ${formatearFechaCorta(new Date())}${filtrosTexto ? "  ·  " + filtrosTexto : ""}`;

    const bloques = [];
    if (!logo) {
      bloques.push({ texto: EMPRESA.nombre, font: "Helvetica-Bold", size: 15, color: "#c62828", gap: 4 });
    }
    bloques.push({ texto: titulo, font: "Helvetica-Bold", size: 13, color: "#c62828", gap: 3 });
    if (subtitulo) {
      bloques.push({ texto: subtitulo, font: "Helvetica", size: 9, color: "#64748b", gap: 3 });
    }
    bloques.push({
      texto: truncarTexto(meta, 120),
      font: "Helvetica",
      size: 8,
      color: "#94a3b8",
      gap: 0
    });

    let altoTexto = 0;
    bloques.forEach(b => {
      doc.font(b.font).fontSize(b.size);
      altoTexto += doc.heightOfString(b.texto, { width: anchoTexto, lineBreak: false }) + b.gap;
    });

    let yPos = top + Math.max(8, (altoCaja - altoTexto) / 2);
    bloques.forEach(b => {
      doc.fillColor(b.color).font(b.font).fontSize(b.size);
      doc.text(b.texto, contenidoX, yPos, { width: anchoTexto, lineBreak: false });
      yPos = doc.y + b.gap;
    });

    doc.restore();
    return top + altoCaja + 10;
  }

  function dibujarEncabezadoContinuacion() {
    const { marginLeft, anchoUtil } = medidasPagina();
    const top = doc.page.margins.top;
    doc.save();
    doc.fillColor("#64748b").font("Helvetica").fontSize(9);
    doc.text(`${titulo} (continúa)`, marginLeft, top, { width: anchoUtil, lineBreak: false });
    doc.moveTo(marginLeft, top + 14)
      .lineTo(marginLeft + anchoUtil, top + 14)
      .lineWidth(0.5)
      .strokeColor("#e2e8f0")
      .stroke();
    doc.restore();
    return top + 20;
  }

  let y = dibujarEncabezadoPrincipal();
  resetCursor(y);

  let { marginLeft, anchoUtil, bottomLimit } = medidasPagina();
  const colWidths = calcularAnchosPdf(columnas, anchoUtil);
  const altoFilaBase = 16;

  function dibujarFilaEncabezadoTabla() {
    ({ marginLeft, anchoUtil, bottomLimit } = medidasPagina());
    let altoHeader = altoFilaBase;
    columnas.forEach((col, i) => {
      doc.font("Helvetica-Bold").fontSize(8);
      const h = doc.heightOfString(col.header, { width: colWidths[i] - 6, lineBreak: true });
      altoHeader = Math.max(altoHeader, h + 8);
    });

    let x = marginLeft;
    doc.save();
    doc.rect(x, y, anchoUtil, altoHeader).fill("#f1f5f9");
    doc.rect(x, y, anchoUtil, altoHeader).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    columnas.forEach((col, i) => {
      doc.fillColor("#c62828").font("Helvetica-Bold").fontSize(8);
      doc.text(col.header, x + 3, y + 4, { width: colWidths[i] - 6, lineBreak: true });
      x += colWidths[i];
    });
    doc.restore();
    y += altoHeader;
    resetCursor(y);
  }

  function nuevaPagina() {
    dibujarPiePagina();
    numPagina += 1;
    doc.addPage({ size: "A4", layout: "portrait", margins: pageMargins });
    y = dibujarEncabezadoContinuacion();
    resetCursor(y);
    dibujarFilaEncabezadoTabla();
  }

  dibujarFilaEncabezadoTabla();

  filas.forEach((fila, idx) => {
    ({ marginLeft, anchoUtil, bottomLimit } = medidasPagina());

    let maxAlto = altoFilaBase;
    const valores = columnas.map(col => {
      let val = valorCelda(fila, col);
      if (col.pdfCorto) val = truncarTexto(val, col.pdfCorto);
      return String(val);
    });

    valores.forEach((texto, i) => {
      const h = doc.heightOfString(texto, { width: colWidths[i] - 6, align: "left" });
      maxAlto = Math.max(maxAlto, h + 6);
    });

    if (y + maxAlto > bottomLimit) {
      nuevaPagina();
      ({ marginLeft, anchoUtil, bottomLimit } = medidasPagina());
    }

    let x = marginLeft;
    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";

    doc.save();
    doc.rect(x, y, anchoUtil, maxAlto).fill(bg);
    valores.forEach((texto, i) => {
      doc.fillColor("#334155").font("Helvetica").fontSize(8);
      doc.text(texto, x + 3, y + 4, { width: colWidths[i] - 6, align: "left", lineBreak: true });
      x += colWidths[i];
    });
    doc.rect(marginLeft, y, anchoUtil, maxAlto).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    doc.restore();

    y += maxAlto;
    resetCursor(y);
  });

  if (filas.length === 0) {
    const m = medidasPagina();
    doc.save();
    doc.fillColor("#64748b").font("Helvetica").fontSize(10);
    doc.text("No hay registros para los filtros seleccionados.", m.marginLeft, y + 6, {
      width: m.anchoUtil,
      lineBreak: false
    });
    doc.restore();
  }

  dibujarPiePagina();
  doc.end();
}

module.exports = {
  EMPRESA,
  MAX_FILAS_REPORTE,
  obtenerLogo,
  formatearFecha,
  formatearEstado,
  nombreArchivo,
  parseDias,
  parseLimite,
  generarExcel,
  generarPdf
};
