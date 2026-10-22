const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const { setStaticCacheHeaders } = require("./middleware/static-cache");
const { createFichaHtmlMiddleware } = require("./middleware/ficha-html-swiper");
const { createLegacyProductoRedirectMiddleware } = require("./middleware/legacy-producto-redirect");
const { SITE_ROOT } = require("./config/site-root");

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
const catalogoProductosRoutes = require("./routes/catalogo-productos.routes");
const proximamenteRoutes = require("./routes/proximamente.routes");
const publicProximamenteRoutes = require("./routes/public-proximamente.routes");

const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    mensaje: "API CRM Ituarte funcionando correctamente",
    modulos: { proximamente: true }
  });
});

app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/consultas", consultasRoutes);
app.use("/seguimientos", seguimientosRoutes);
/* Montaje explícito (antes de /public) para que no falle si public.routes quedó viejo */
app.use("/public/proximamente", publicProximamenteRoutes);
app.use("/public", publicRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/exportar", exportRoutes);
app.use("/empleados", empleadosRoutes);
app.use("/marketing", marketingRoutes);
app.use("/presupuestos", presupuestosRoutes);
app.use("/catalogo-productos", catalogoProductosRoutes);
app.use("/proximamente-items", proximamenteRoutes);

// Respuestas JSON para rutas API inexistentes (evita el error confuso de HTML)
app.use((req, res, next) => {
  const esApi = /^\/(auth|clientes|consultas|seguimientos|public|dashboard|exportar|empleados|marketing|presupuestos|catalogo-productos|proximamente-items)\b/.test(req.path);
  if (esApi) {
    return res.status(404).json({
      error: `Ruta no encontrada: ${req.method} ${req.originalUrl}. Reiniciá el backend con npm start.`
    });
  }
  next();
});

const staticRoot = path.join(__dirname, "..");
const staticOpts = {
  setHeaders: setStaticCacheHeaders
};

app.use("/uploads", express.static(path.join(__dirname, "uploads"), { setHeaders: setStaticCacheHeaders }));

app.get("/p/:slug", (req, res) => {
  res.sendFile(path.join(SITE_ROOT, "producto.html"));
});

app.use(createLegacyProductoRedirectMiddleware());

// Fichas de producto: inyectar js/ficha-swiper-init.js en todas las páginas con carrusel
app.use(createFichaHtmlMiddleware(staticRoot));

// Sitio web + CRM (abrir login desde acá, no con doble clic al HTML)
app.use(express.static(staticRoot, staticOpts));

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
  console.log(`  Próximamente: http://localhost:${port}/public/proximamente/items`);
  console.log("========================================");
});
