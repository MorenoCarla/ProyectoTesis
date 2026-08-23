const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const clientesRoutes = require("./routes/clientes.routes");
const consultasRoutes = require("./routes/consultas.routes");
const seguimientosRoutes = require("./routes/seguimientos.routes");
const publicRoutes = require("./routes/public.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const exportRoutes = require("./routes/export.routes");
const empleadosRoutes = require("./routes/empleados.routes");
const marketingRoutes = require("./routes/marketing.routes");
const presupuestosRoutes = require("./routes/presupuestos.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensaje: "API CRM Ituarte funcionando correctamente" });
});

app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/consultas", consultasRoutes);
app.use("/seguimientos", seguimientosRoutes);
app.use("/public", publicRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/exportar", exportRoutes);
app.use("/empleados", empleadosRoutes);
app.use("/marketing", marketingRoutes);
app.use("/presupuestos", presupuestosRoutes);

// Respuestas JSON para rutas API inexistentes (evita el error confuso de HTML)
app.use((req, res, next) => {
  const esApi = /^\/(auth|clientes|consultas|seguimientos|public|dashboard|exportar|empleados|marketing|presupuestos)\b/.test(req.path);
  if (esApi) {
    return res.status(404).json({
      error: `Ruta no encontrada: ${req.method} ${req.originalUrl}. Reiniciá el backend con npm start.`
    });
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Sitio web + CRM (abrir login desde acá, no con doble clic al HTML)
app.use(express.static(path.join(__dirname, "..")));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

app.listen(process.env.PORT || 3000, () => {
  const port = process.env.PORT || 3000;
  console.log("========================================");
  console.log(`  Servidor CRM corriendo en puerto ${port}`);
  console.log(`  CRM:  http://localhost:${port}/login.html`);
  console.log(`  API:  http://localhost:${port}`);
  console.log("========================================");
});
