const express = require("express");
const {
  listarCategoriasPublicas,
  listarProductosCategoriaPublico,
  obtenerProductoPublico
} = require("../services/catalogo-publico");
const { obtenerHomeVitrinas } = require("../services/home-vitrinas");

const router = express.Router();

router.get("/home-vitrinas", async (req, res) => {
  try {
    const data = await obtenerHomeVitrinas();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo cargar la vitrina del home" });
  }
});

router.get("/categorias", async (req, res) => {
  try {
    const categorias = await listarCategoriasPublicas();
    res.json({ categorias });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo cargar el catálogo" });
  }
});

router.get("/categorias/:slug/productos", async (req, res) => {
  try {
    const data = await listarProductosCategoriaPublico({ slug: req.params.slug });
    if (!data) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo cargar la categoría" });
  }
});

router.get("/listado/:archivo/productos", async (req, res) => {
  try {
    const listado = req.params.archivo;
    if (!/^[a-zA-Z0-9._-]+\.html$/i.test(listado)) {
      return res.status(400).json({ error: "Nombre de listado inválido" });
    }
    const data = await listarProductosCategoriaPublico({ listado });
    if (!data) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo cargar la categoría" });
  }
});

router.get("/productos/:slug", async (req, res) => {
  try {
    const producto = await obtenerProductoPublico(req.params.slug);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ producto });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo cargar el producto" });
  }
});

module.exports = router;
