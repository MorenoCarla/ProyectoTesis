/**
 * Prueba publicación de una ficha (sin CRM).
 *   node scripts/publicar-producto-por-id.js 42
 */
const { publicarProductoEnWeb } = require("../services/catalogo-web");

const id = process.argv[2];
if (!id) {
  console.error("Uso: node scripts/publicar-producto-por-id.js <id_producto>");
  process.exit(1);
}

publicarProductoEnWeb(id)
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ficha_error ? 1 : 0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
