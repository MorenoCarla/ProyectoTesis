const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "carlaUTN", 
  database: "crm_ituarte"
});

// conectar
db.connect(err => {
  if (err) {
    console.log("Error conexión:", err);
  } else {
    console.log("Conectado a MySQL");
  }
});

// CREATE
app.post("/clientes", (req, res) => {
  const { nombre, email, telefono, mensaje, producto, ciudad } = req.body;

  const sql = `
    INSERT INTO clientes (nombre, email, telefono, mensaje, producto, ciudad)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, email, telefono, mensaje, producto, ciudad], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Cliente guardado");
  });
});

// READ
app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM clientes", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});