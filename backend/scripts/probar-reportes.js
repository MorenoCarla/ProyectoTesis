const fs = require("fs");
const path = require("path");
const { generarExcel, generarPdf } = require("../utils/reportes");

const outDir = path.join(__dirname, "..", "tmp-reportes");
fs.mkdirSync(outDir, { recursive: true });

const filasClientes = [
  {
    id: 1,
    cliente_completo: "Juan Pérez García",
    email: "juan.perez@empresa.com.ar",
    telefono: "3865-123456",
    ciudad: "Concepción",
    rubro: "comercio",
    cuenta_corriente: 1,
    total_consultas: 3,
    creado_en: "2025-11-15T10:00:00.000Z"
  },
  {
    id: 2,
    cliente_completo: "María Elena Rodríguez",
    email: "maria.rodriguez@industrias.com",
    telefono: "381-5551234",
    ciudad: "San Miguel de Tucumán",
    rubro: "industria",
    cuenta_corriente: 0,
    total_consultas: 7,
    creado_en: "2025-12-01T14:30:00.000Z"
  }
];

const columnasPdf = [
  { header: "ID", key: "id", pdfPeso: 0.35 },
  { header: "Cliente", key: "cliente_completo", pdfPeso: 1.5 },
  { header: "Email", key: "email", pdfPeso: 1.7 },
  { header: "Teléfono", key: "telefono", pdfPeso: 0.9 },
  { header: "Ciudad", key: "ciudad", pdfPeso: 0.9 },
  { header: "Rubro", key: "rubro", format: "estado", pdfPeso: 1 },
  { header: "Cta. cte.", key: "cuenta_corriente", format: "si_no", pdfPeso: 0.55 },
  { header: "Consultas", key: "total_consultas", pdfPeso: 0.55 },
  { header: "Alta", key: "creado_en", format: "fecha_corta", pdfPeso: 0.95 }
];

const columnasExcel = [
  { header: "ID", key: "id", minWidth: 6, maxWidth: 10 },
  { header: "Nombre", key: "nombre", minWidth: 14, maxWidth: 22 },
  { header: "Apellido", key: "apellido", minWidth: 14, maxWidth: 22 },
  { header: "Email", key: "email", minWidth: 22, maxWidth: 36 },
  { header: "Rubro", key: "rubro", minWidth: 12, format: "estado", maxWidth: 20 },
  { header: "Alta", key: "creado_en", minWidth: 18, format: "fecha", maxWidth: 22 }
];

const filasExcel = filasClientes.map(f => ({
  id: f.id,
  nombre: f.cliente_completo.split(" ")[0],
  apellido: f.cliente_completo.split(" ").slice(1).join(" "),
  email: f.email,
  rubro: f.rubro,
  creado_en: f.creado_en
}));

async function escribir(resWriter, filePath) {
  const chunks = [];
  const res = {
    setHeader() {},
    write(c) { chunks.push(Buffer.from(c)); return true; },
    end(c) { if (c) chunks.push(Buffer.from(c)); }
  };
  await resWriter(res);
  fs.writeFileSync(filePath, Buffer.concat(chunks));
}

(async () => {
  const pdfPath = path.join(outDir, "test_clientes.pdf");
  const xlsxPath = path.join(outDir, "test_clientes.xlsx");

  await escribir(
    res => generarPdf(res, {
      titulo: "Reporte de Clientes",
      subtitulo: "Prueba local",
      columnas: columnasPdf,
      filas: filasClientes,
      filtrosTexto: "Prueba"
    }),
    pdfPath
  );

  const pdfBytes = fs.readFileSync(pdfPath).toString("latin1");
  const pageMatches = pdfBytes.match(/\/Type\s*\/Page\b/g) || [];
  console.log("PDF paginas:", pageMatches.length);

  await escribir(
    res => generarExcel(res, {
      titulo: "Reporte de Clientes",
      subtitulo: "Prueba local",
      hojaNombre: "clientes",
      columnas: columnasExcel,
      filas: filasExcel,
      filtrosTexto: "Prueba"
    }),
    xlsxPath
  );

  const ExcelJS = require("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  console.log("PDF:", pdfPath, fs.statSync(pdfPath).size, "bytes");
  console.log("Excel hojas:", wb.worksheets.length, "->", wb.worksheets.map(w => w.name).join(", "));
  console.log("Excel OK:", xlsxPath);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
