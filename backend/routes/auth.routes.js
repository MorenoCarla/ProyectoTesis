const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const { JWT_SECRET, verificarToken } = require("../middleware/auth");
const { normalizarDatosPersonales } = require("../utils/texto");

const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const [filas] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.email = ? AND u.eliminado_en IS NULL`,
      [email]
    );

    if (filas.length === 0) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const usuario = filas[0];

    if (!usuario.activo) {
      return res.status(403).json({ error: "Usuario desactivado" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// POST /auth/registro  (clientes que se registran desde el sitio)
router.post("/registro", async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, ciudad } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const [existente] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (existente.length > 0) {
      return res.status(409).json({ error: "Ese email ya está registrado" });
    }

    const hash = await bcrypt.hash(password, 10);

    const normalizado = normalizarDatosPersonales({ nombre, apellido, ciudad });
    const emailNorm = email.trim().toLowerCase();

    const [rolCliente] = await pool.query(
      "SELECT id FROM roles WHERE nombre = 'cliente'"
    );

    const [resultado] = await pool.query(
      `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rolCliente[0].id, normalizado.nombre, normalizado.apellido || "", emailNorm, hash, telefono || null]
    );

    await pool.query(
      `INSERT INTO clientes (usuario_id, nombre, apellido, email, telefono, ciudad)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resultado.insertId, normalizado.nombre, normalizado.apellido || "", emailNorm, telefono || null, normalizado.ciudad]
    );

    res.status(201).json({ mensaje: "Registro exitoso. Ya podés iniciar sesión." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrarse" });
  }
});

// POST /auth/recuperar  (olvidé mi contraseña)
router.post("/recuperar", async (req, res) => {
  try {
    const { email } = req.body;

    const [filas] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ? AND activo = 1",
      [email]
    );

    if (filas.length === 0) {
      return res.json({
        mensaje: "Si el email está registrado, podés restablecer la contraseña con el link que aparece abajo."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiracion = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "UPDATE usuarios SET token_recuperacion = ?, token_expiracion = ? WHERE id = ?",
      [token, expiracion, filas[0].id]
    );

    // Modo tesis/desarrollo: no hay servidor de email (Gmail SMTP).
    // El link se muestra en pantalla y en la consola del servidor.
    const link = `restablecer.html?token=${token}`;
    console.log("Link recuperación:", link);

    res.json({
      mensaje: "Solicitud procesada. Si el email está registrado, usá el link de abajo para restablecer tu contraseña.",
      link_recuperacion: link
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// POST /auth/restablecer
router.post("/restablecer", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token y nueva contraseña son obligatorios" });
    }

    const [filas] = await pool.query(
      `SELECT id FROM usuarios
       WHERE token_recuperacion = ? AND token_expiracion > NOW()`,
      [token]
    );

    if (filas.length === 0) {
      return res.status(400).json({ error: "El link expiró o no es válido" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE usuarios
       SET password_hash = ?, token_recuperacion = NULL, token_expiracion = NULL
       WHERE id = ?`,
      [hash, filas[0].id]
    );

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
});

// POST /auth/cambiar-password  (usuario logueado)
router.post("/cambiar-password", verificarToken, async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: "Completá todos los campos" });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const [filas] = await pool.query(
      "SELECT id, password_hash FROM usuarios WHERE id = ? AND activo = 1",
      [req.usuario.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const valida = await bcrypt.compare(password_actual, filas[0].password_hash);

    if (!valida) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }

    const hash = await bcrypt.hash(password_nueva, 10);

    await pool.query(
      "UPDATE usuarios SET password_hash = ? WHERE id = ?",
      [hash, req.usuario.id]
    );

    res.json({ mensaje: "Contraseña cambiada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

module.exports = router;
