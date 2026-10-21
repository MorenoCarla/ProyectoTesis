const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const files = fs.readdirSync(root).filter((f) => f.endsWith(".html"));

let n = 0;
for (const file of files) {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, "utf8");
  if (!html.includes("scriptcadaproducto.js")) continue;
  const next = html
    .replace(/scriptcadaproducto\.js\?v=\d+/g, "scriptcadaproducto.js?v=8")
    .replace(/stylescadaproducto\.css\?v=\d+/g, "stylescadaproducto.css?v=8")
    .replace(/ficha-producto-layout\.css\?v=\d+/g, "ficha-producto-layout.css?v=8")
    .replace(/js\/site-chrome\.js(?!\?v=)/g, "js/site-chrome.js?v=8")
    .replace(/js\/site-chrome\.js\?v=\d+/g, "js/site-chrome.js?v=8");
  if (next !== html) {
    fs.writeFileSync(p, next, "utf8");
    n++;
  }
}
console.log("HTML actualizados:", n);
