const express = require("express");
const crypto = require("crypto");
const pool = require("../config/db");
const { normalizarDatosPersonales } = require("../utils/texto");

const router = express.Router();

function mapPublicItem(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    subtitulo: row.subtitulo,
    descripcion: row.descripcion,
    imagen: row.imagen,
    imagen_hover: row.imagen_hover || null,
    categoria_etiqueta: row.categoria_etiqueta,
    likes_count: Number(row.likes_count) || 0
  };
}

function visitorKeyFromRequest(req, bodyKey) {
  const fromBody = String(bodyKey || "").trim();
  if (/^[a-f0-9-]{16,64}$/i.test(fromBody)) return fromBody.slice(0, 64);
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";
  const ua = String(req.headers["user-agent"] || "").slice(0, 120);
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 64);
}

async function upsertClientePorTelefono(nombre, telefono) {
  const tel = String(telefono || "").trim();
  const digits = tel.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;

  const normalizado = normalizarDatosPersonales({ nombre, apellido: "" });
  const emailNorm = `proximamente.${digits}@contacto.ituarte.local`;

  const [porTel] = await pool.query(
    "SELECT id FROM clientes WHERE telefono = ? AND activo = 1 ORDER BY id DESC LIMIT 1",
    [tel]
  );
  if (porTel.length) {
    await pool.query("UPDATE clientes SET nombre = ? WHERE id = ?", [
      normalizado.nombre,
      porTel[0].id
    ]);
    return porTel[0].id;
  }

  const [porMail] = await pool.query(
    "SELECT id FROM clientes WHERE email = ? AND activo = 1 LIMIT 1",
    [emailNorm]
  );
  if (porMail.length) {
    await pool.query("UPDATE clientes SET nombre = ?, telefono = ? WHERE id = ?", [
      normalizado.nombre,
      tel,
      porMail[0].id
    ]);
    return porMail[0].id;
  }

  const [ins] = await pool.query(
    `INSERT INTO clientes (nombre, apellido, email, telefono, ciudad, tipo_cliente)
     VALUES (?, '', ?, ?, NULL, 'particular')`,
    [normalizado.nombre, emailNorm, tel]
  );
  return ins.insertId;
}

async function tipoConsultaProximamenteId() {
  const nombre = "Interés — Próximamente";
  const [rows] = await pool.query("SELECT id FROM tipos_consulta WHERE nombre = ? LIMIT 1", [
    nombre
  ]);
  if (rows.length) return rows[0].id;
  const [ins] = await pool.query(
    "INSERT INTO tipos_consulta (nombre, descripcion) VALUES (?, ?)",
    [nombre, "Vitrina Próximamente"]
  );
  return ins.insertId;
}

async function queryPublicProximamenteItems() {
  const baseFrom = `FROM proximamente_items
       WHERE activo = 1 AND publicado = 1
       ORDER BY orden ASC, id DESC`;
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, subtitulo, descripcion, imagen, imagen_hover, categoria_etiqueta, likes_count ${baseFrom}`
    );
    return rows;
  } catch (e) {
    if (e.code !== "ER_BAD_FIELD_ERROR") throw e;
    const [rows] = await pool.query(
      `SELECT id, titulo, subtitulo, descripcion, imagen, categoria_etiqueta, likes_count ${baseFrom}`
    );
    return rows.map((row) => ({ ...row, imagen_hover: null }));
  }
}

// GET /public/proximamente/items
router.get("/items", async (req, res) => {
  try {
    const rows = await queryPublicProximamenteItems();
    res.json({ items: rows.map(mapPublicItem) });
  } catch (e) {
    console.error("[proximamente GET /items]", e.code, e.message);
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.status(503).json({
        error: "Próximamente no está activado en la base. En backend: npm run migrate-proximamente"
      });
    }
    if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND" || e.code === "ER_ACCESS_DENIED_ERROR") {
      return res.status(503).json({
        error: "No hay conexión a MySQL. Revisá backend/.env y que MySQL esté encendido."
      });
    }
    res.status(500).json({
      error: "No se pudo cargar Próximamente. Reiniciá el backend (npm start) y, si sigue, npm run migrate-proximamente"
    });
  }
});

// POST /public/proximamente/items/:id/like
router.post("/items/:id/like", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (!itemId) return res.status(400).json({ error: "Ítem inválido" });

    const [item] = await pool.query(
      "SELECT id, likes_count FROM proximamente_items WHERE id = ? AND activo = 1 AND publicado = 1",
      [itemId]
    );
    if (!item.length) return res.status(404).json({ error: "Producto no disponible" });

    const vkey = visitorKeyFromRequest(req, req.body?.visitor_key);
    const [existing] = await pool.query(
      "SELECT id FROM proximamente_likes WHERE item_id = ? AND visitor_key = ? LIMIT 1",
      [itemId, vkey]
    );

    let likes = item[0].likes_count;
    if (existing.length) {
      await pool.query("DELETE FROM proximamente_likes WHERE item_id = ? AND visitor_key = ?", [
        itemId,
        vkey
      ]);
      await pool.query(
        "UPDATE proximamente_items SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?",
        [itemId]
      );
      likes = Math.max(likes - 1, 0);
      return res.json({ likes_count: likes, liked: false });
    }

    await pool.query("INSERT INTO proximamente_likes (item_id, visitor_key) VALUES (?, ?)", [
      itemId,
      vkey
    ]);
    await pool.query(
      "UPDATE proximamente_items SET likes_count = likes_count + 1 WHERE id = ?",
      [itemId]
    );
    likes += 1;
    res.json({ likes_count: likes, liked: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo registrar el me gusta" });
  }
});

// DELETE /public/proximamente/items/:id/like — quitar me gusta (mismo visitante)
router.delete("/items/:id/like", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (!itemId) return res.status(400).json({ error: "Ítem inválido" });

    const [item] = await pool.query(
      "SELECT id, likes_count FROM proximamente_items WHERE id = ? AND activo = 1 AND publicado = 1",
      [itemId]
    );
    if (!item.length) return res.status(404).json({ error: "Producto no disponible" });

    const vkey = visitorKeyFromRequest(req, req.body?.visitor_key);
    const [del] = await pool.query(
      "DELETE FROM proximamente_likes WHERE item_id = ? AND visitor_key = ?",
      [itemId, vkey]
    );

    let likes = item[0].likes_count;
    if (del.affectedRows > 0) {
      await pool.query(
        "UPDATE proximamente_items SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?",
        [itemId]
      );
      likes = Math.max(likes - 1, 0);
    } else {
      const [fresh] = await pool.query(
        "SELECT likes_count FROM proximamente_items WHERE id = ?",
        [itemId]
      );
      likes = fresh[0]?.likes_count ?? likes;
    }

    res.json({ likes_count: likes, liked: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo quitar el me gusta" });
  }
});

// POST /public/proximamente/items/:id/consulta  — nombre + teléfono
router.post("/items/:id/consulta", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const nombre = String(req.body?.nombre || "").trim();
    const telefono = String(req.body?.telefono || "").trim();
    const nota = String(req.body?.mensaje || "").trim();

    if (!itemId) return res.status(400).json({ error: "Ítem inválido" });
    if (!nombre || nombre.length < 2) {
      return res.status(400).json({ error: "Indicá tu nombre" });
    }
    if (!telefono || telefono.replace(/\D/g, "").length < 8) {
      return res.status(400).json({ error: "Indicá un teléfono válido" });
    }

    const [item] = await pool.query(
      "SELECT id, titulo FROM proximamente_items WHERE id = ? AND activo = 1 AND publicado = 1",
      [itemId]
    );
    if (!item.length) return res.status(404).json({ error: "Producto no disponible" });

    const clienteId = await upsertClientePorTelefono(nombre, telefono);
    if (!clienteId) {
      return res.status(400).json({ error: "No se pudo registrar el contacto" });
    }

    const tipoId = await tipoConsultaProximamenteId();
    const titulo = item[0].titulo;
    const mensaje =
      `Interés en producto «Próximamente»: ${titulo}.` +
      (nota ? ` Nota: ${nota}` : " Quiero que me avisen cuando esté disponible.");

    const [consulta] = await pool.query(
      `INSERT INTO consultas (cliente_id, tipo_consulta_id, producto_interes, mensaje, estado, prioridad, proximamente_item_id)
       VALUES (?, ?, ?, ?, 'pendiente', 'media', ?)`,
      [clienteId, tipoId, `Próximamente: ${titulo}`, mensaje, itemId]
    );

    await pool.query(
      `INSERT INTO historial_estados (consulta_id, estado_anterior, estado_nuevo, observacion)
       VALUES (?, 'nuevo', 'pendiente', 'Consulta desde vitrina Próximamente')`,
      [consulta.insertId]
    );

    res.status(201).json({ mensaje: "¡Gracias! Te vamos a contactar." });
  } catch (e) {
    console.error(e);
    if (e.code === "ER_BAD_FIELD_ERROR") {
      return res.status(503).json({
        error: "Falta migración proximamente_item_id en consultas. Ejecutá migrate-proximamente.sql"
      });
    }
    res.status(500).json({ error: "No se pudo enviar la consulta" });
  }
});

module.exports = router;
