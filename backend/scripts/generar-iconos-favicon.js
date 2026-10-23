const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const root = path.join(__dirname, "..", "..");
const src = path.join(root, "favicon.png");

async function main() {
  if (!fs.existsSync(src)) {
    console.error("No existe favicon.png en la raíz del sitio.");
    process.exit(1);
  }
  await sharp(src).resize(180, 180).png().toFile(path.join(root, "apple-touch-icon.png"));
  await sharp(src).resize(48, 48).png().toFile(path.join(root, "favicon-48.png"));
  console.log("apple-touch-icon.png y favicon-48.png generados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
