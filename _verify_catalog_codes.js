const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const CATALOGS = [
  "apliques.html","colgantes.html","plafones.html","espejos.html","lamparasdepie.html",
  "bifocales.html","unifocales.html","farolas.html","estacas.html","tortugas.html",
  "reflectores.html","pileta.html","solares.html","alumbradopublico.html","paneles.html",
  "ventiladores.html","smart.html","veladores.html","camaras.html",
];

function officialCodes(file) {
  if (!fs.existsSync(file)) return null;
  const codes = [];
  const re = /<p class="codigo\w+">([^<]*)<\/p>/g;
  let m;
  const content = fs.readFileSync(file, "utf8");
  while ((m = re.exec(content)) !== null) {
    const c = m[1].trim();
    if (c && c.toLowerCase() !== "xxxx" && !/^x+$/i.test(c)) codes.push(c);
  }
  return [...new Set(codes)].join(", ");
}

let mismatches = 0;
for (const cat of CATALOGS) {
  const content = fs.readFileSync(path.join(ROOT, cat), "utf8");
  const re = /<a\s+href="([^"]+)"\s+class="link-producto">[\s\S]*?data-codigo="([^"]*)"/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const [, href, catalogCodes] = m;
    const official = officialCodes(path.join(ROOT, href));
    if (official === null) continue;
    if (catalogCodes !== official) {
      mismatches++;
      console.log(`MISMATCH [${cat}] ${href}`);
      console.log(`  catalog:  ${catalogCodes}`);
      console.log(`  official: ${official}`);
    }
  }
}
console.log(mismatches === 0 ? "OK: all catalog codes match product pages" : `Total mismatches: ${mismatches}`);
