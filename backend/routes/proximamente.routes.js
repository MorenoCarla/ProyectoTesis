const express = require("express");
const pool = require("../config/db");
const { verificarToken, soloRoles } = require("../middleware/auth");

const router = express.Router();

function mapItem(row) {
  if (!row) return row;
  return {
    ...row,
    publicado: !!row.publicado,
    activo: !!row.activo,
    likes_count: Number(row.likes_count) || 0
  };
}

// GET /proximamente-items — admin/empleado
router.get("/", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM consultas c WHERE c.proximamente_item_id = p.id) AS consultas_count
       FROM proximamente_items p
       WHERE p.activo = 1
       ORDER BY p.orden ASC, p.id DESC`
    );
    res.json(rows.map(mapItem));
  } catch (e) {
    console.error(e);
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.status(503).json({
        error: "Ejecutá backend/database/migrate-proximamente.sql en MySQL"
      });
    }
    res.status(500).json({ error: "No se pudo listar Próximamente" });
  }
});

// GET /proximamente-items/:id
router.get("/:id", verificarToken, soloRoles("admin", "empleado"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM proximamente_items WHERE id = ? AND activo = 1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "No encontrado" });
    res.json(mapItem(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener ítem" });
  }
});

// POST /proximamente-items
router.post("/", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const {
      titulo,
      subtitulo,
      descripcion,
      imagen,
      imagen_hover,
      categoria_etiqueta,
      orden,
      publicado
    } = req.body;
    const t = String(titulo || "").trim();
    const img = String(imagen || "").trim();
    if (!t || !img) {
      return res.status(400).json({ error: "Título e imagen son obligatorios" });
    }
    const [ins] = await pool.query(
      `INSERT INTO proximamente_items
        (titulo, subtitulo, descripcion, imagen, imagen_hover, categoria_etiqueta, orden, publicado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        t,
        subtitulo != null ? String(subtitulo).trim() || null : null,
        descripcion != null ? String(descripcion).trim() || null : null,
        img,
        imagen_hover != null ? String(imagen_hover).trim() || null : null,
        categoria_etiqueta != null ? String(categoria_etiqueta).trim() || null : null,
        parseInt(orden, 10) || 0,
        publicado === false || publicado === 0 || publicado === "0" ? 0 : 1
      ]
    );
    const [rows] = await pool.query("SELECT * FROM proximamente_items WHERE id = ?", [ins.insertId]);
    res.status(201).json(mapItem(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo crear el ítem" });
  }
});

// PUT /proximamente-items/:id
router.put("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const [actual] = await pool.query(
      "SELECT id FROM proximamente_items WHERE id = ? AND activo = 1",
      [id]
    );
    if (!actual.length) return res.status(404).json({ error: "No encontrado" });

    const campos = [];
    const vals = [];
    const set = (col, val) => {
      campos.push(`${col} = ?`);
      vals.push(val);
    };

    if (req.body.titulo !== undefined) set("titulo", String(req.body.titulo).trim());
    if (req.body.subtitulo !== undefined) {
      set("subtitulo", String(req.body.subtitulo).trim() || null);
    }
    if (req.body.descripcion !== undefined) {
      set("descripcion", String(req.body.descripcion).trim() || null);
    }
    if (req.body.imagen !== undefined) set("imagen", String(req.body.imagen).trim());
    if (req.body.imagen_hover !== undefined) {
      set("imagen_hover", String(req.body.imagen_hover).trim() || null);
    }
    if (req.body.categoria_etiqueta !== undefined) {
      set("categoria_etiqueta", String(req.body.categoria_etiqueta).trim() || null);
    }
    if (req.body.orden !== undefined) set("orden", parseInt(req.body.orden, 10) || 0);
    if (req.body.publicado !== undefined) {
      set("publicado", req.body.publicado ? 1 : 0);
    }

    if (!campos.length) return res.status(400).json({ error: "Sin cambios" });

    vals.push(id);
    await pool.query(
      `UPDATE proximamente_items SET ${campos.join(", ")}, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      vals
    );
    const [rows] = await pool.query("SELECT * FROM proximamente_items WHERE id = ?", [id]);
    res.json(mapItem(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo actualizar" });
  }
});

// DELETE /proximamente-items/:id — baja lógica
router.delete("/:id", verificarToken, soloRoles("admin"), async (req, res) => {
  try {
    await pool.query(
      "UPDATE proximamente_items SET activo = 0, publicado = 0 WHERE id = ?",
      [req.params.id]
    );
    res.json({ mensaje: "Ítem dado de baja" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo dar de baja" });
  }
});

module.exports = router;
