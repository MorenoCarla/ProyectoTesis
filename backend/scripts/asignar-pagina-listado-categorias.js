/**
 * Rellena categorias_catalogo.pagina_listado desde los productos (pagina_categoria)
 * y un mapa fijo del sitio Ituarte.
 *
 *   node scripts/asignar-pagina-listado-categorias.js
 */
const pool = require("../config/db");

/** Nombre en data-categoria → archivo grilla en el sitio */
const PAGINA_POR_NOMBRE = {
  "Alumbrado público": "alumbradopublico.html",
  Apliques: "apliques.html",
  Colgantes: "colgantes.html",
  Bifocales: "bifocales.html",
  Unifocales: "unifocales.html",
  Reflectores: "reflectores.html",
  Ventiladores: "ventiladores.html",
  Veladores: "veladores.html",
  Farolas: "farolas.html",
  Plafones: "plafones.html",
  Paneles: "paneles.html",
  Tortugas: "tortugas.html",
  Estacas: "estacas.html",
  Solares: "solares.html",
  Smart: "smart.html",
  "Lámparas de Pie": "lamparasdepie.html",
  "Luminaria de Pileta": "pileta.html",
  Cámaras: "camaras.html",
  Espejos: "espejos.html",
};

async function main() {
  const conn = await pool.getConnection();
  try {
    const [cats] = await conn.query("SELECT id, nombre, pagina_listado FROM categorias_catalogo");

    for (const cat of cats) {
      let pag = cat.pagina_listado;

      if (!pag && PAGINA_POR_NOMBRE[cat.nombre]) {
        pag = PAGINA_POR_NOMBRE[cat.nombre];
      }

      if (!pag) {
        const [rows] = await conn.query(
          `SELECT pagina_categoria FROM productos_catalogo
           WHERE categoria_id = ? AND pagina_categoria IS NOT NULL AND pagina_categoria != ''
           LIMIT 1`,
          [cat.id]
        );
        if (rows.length) pag = rows[0].pagina_categoria;
      }

      if (!pag) {
        console.warn("Sin página:", cat.nombre);
        continue;
      }

      await conn.query("UPDATE categorias_catalogo SET pagina_listado = ? WHERE id = ?", [
        pag,
        cat.id
      ]);
      console.log(cat.nombre, "→", pag);
    }

    const [check] = await conn.query(
      "SELECT COUNT(*) AS n FROM categorias_catalogo WHERE pagina_listado IS NULL OR pagina_listado = ''"
    );
    console.log("\nCategorías sin pagina_listado:", check[0].n);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
