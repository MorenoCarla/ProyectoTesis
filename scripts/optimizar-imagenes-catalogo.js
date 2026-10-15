/**
 * Miniaturas de productos en páginas de categoría (PNG/JPG en img/, sin fondos).
 * Redimensiona a ancho máx. 720px y comprime.
 *
 *   cd backend && npm run optimizar-catalogo          → simulación
 *   cd backend && npm run optimizar-catalogo:apply    → aplica (backup en img/.backup-paso4/)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "img");
const backupRoot = path.join(root, ".backup-paso4");
const MIN_KB = 80;
const MAX_WIDTH = 720;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 78;
const apply = process.argv.includes("--apply");

function loadSharp() {
  const searchPaths = [
    path.join(__dirname, "..", "backend", "node_modules"),
    path.join(__dirname, "..", "node_modules"),
  ];
  for (const base of searchPaths) {
    try {
      return require(require.resolve("sharp", { paths: [base] }));
    } catch (_) {}
  }
  return null;
}

const sharp = loadSharp();
if (!sharp) {
  console.log("Instalá sharp: cd backend && npm install sharp --save-dev");
  process.exit(1);
}

function esFondoDePagina(name) {
  const n = name.toLowerCase();
  return (
    n.startsWith("fondo") ||
    n.includes("fondogris") ||
    n === "fondo1.png" ||
    n.includes("fondointerior") ||
    n.includes("fondoexterior") ||
    n.includes("fondoprincipal") ||
    n.includes("maps")
  );
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === ".backup-paso4" || name === "proyectos" || name === "mobile") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g)$/i.test(name) && !esFondoDePagina(name)) out.push(p);
  }
  return out;
}

function backup(filePath) {
  const rel = path.relative(root, filePath);
  const dest = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest)) fs.copyFileSync(filePath, dest);
}

async function optimize(filePath) {
  const before = fs.statSync(filePath).size;
  if (before < MIN_KB * 1024) return null;

  const img = sharp(filePath);
  const meta = await img.metadata();
  let pipeline = img.rotate();
  if (!meta.width || meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const ext = path.extname(filePath).toLowerCase();
  const tmp = filePath + ".cat.tmp";
  if (ext === ".png") {
    await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toFile(tmp);
  } else {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tmp);
  }

  const after = fs.statSync(tmp).size;
  if (after >= before * 0.98) {
    fs.unlinkSync(tmp);
    return null;
  }
  return { before, after, tmp };
}

(async () => {
  const files = walk(root);
  let saved = 0;
  let count = 0;

  for (const filePath of files) {
    const rel = path.relative(root, filePath);
    const info = await optimize(filePath);
    if (!info) continue;
    count++;
    console.log(
      `${rel}: ${(info.before / 1024).toFixed(0)} KB → ${(info.after / 1024).toFixed(0)} KB`
    );
    if (apply) {
      backup(filePath);
      fs.renameSync(info.tmp, filePath);
      saved += info.before - info.after;
    } else {
      fs.unlinkSync(info.tmp);
    }
  }

  if (!count) {
    console.log("Nada que optimizar (archivos chicos o ya comprimidos).");
    return;
  }
  if (!apply) {
    console.log("\nSimulación. Para aplicar:");
    console.log("  cd backend && npm run optimizar-catalogo:apply");
    return;
  }
  console.log(`\nListo. Ahorro: ${(saved / 1024 / 1024).toFixed(2)} MB`);
})();
