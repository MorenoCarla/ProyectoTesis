/**
 * Paso 4: comprimir PNG/JPEG grandes en img/ (requiere: npm install sharp)
 * Uso:
 *   node scripts/optimizar-imagenes.js           → solo lista candidatos
 *   node scripts/optimizar-imagenes.js --apply   → comprime (backup en img/.backup-paso4/)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "img");
const backupRoot = path.join(root, ".backup-paso4");
const MIN_MB = 0.35;
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const PNG_QUALITY = 80;
const apply = process.argv.includes("--apply");

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.log("Instalá sharp una vez:");
  console.log("  cd backend && npm install sharp --save-dev");
  console.log("  node ../scripts/optimizar-imagenes.js");
  process.exit(1);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === ".backup-paso4") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g)$/i.test(name)) out.push(p);
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
  if (before < MIN_MB * 1024 * 1024) return null;

  const img = sharp(filePath);
  const meta = await img.metadata();
  let pipeline = img.rotate();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const ext = path.extname(filePath).toLowerCase();
  const tmp = filePath + ".opt.tmp";
  if (ext === ".png") {
    await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toFile(tmp);
  } else {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tmp);
  }

  const after = fs.statSync(tmp).size;
  if (after >= before) {
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
    const pct = Math.round((1 - info.after / info.before) * 100);
    console.log(
      `${rel}: ${(info.before / 1024 / 1024).toFixed(2)} MB → ${(info.after / 1024 / 1024).toFixed(2)} MB (-${pct}%)`
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
    console.log(`Ningun archivo supera ${MIN_MB} MB (o no mejora al comprimir).`);
    return;
  }
  if (!apply) {
    console.log("\nSimulacion lista. Para aplicar con backup:");
    console.log("  node scripts/optimizar-imagenes.js --apply");
    return;
  }
  console.log(`\nListo. Ahorro total: ${(saved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Originales en: img/.backup-paso4/`);
})();
