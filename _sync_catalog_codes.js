const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

const CATALOGS = [
  "apliques.html",
  "colgantes.html",
  "plafones.html",
  "espejos.html",
  "lamparasdepie.html",
  "bifocales.html",
  "unifocales.html",
  "farolas.html",
  "estacas.html",
  "tortugas.html",
  "reflectores.html",
  "pileta.html",
  "solares.html",
  "alumbradopublico.html",
  "paneles.html",
  "ventiladores.html",
  "smart.html",
  "veladores.html",
  "camaras.html",
];

function extractOfficialCodes(productPath) {
  if (!fs.existsSync(productPath)) {
    return { codes: null, error: "missing_file" };
  }

  const content = fs.readFileSync(productPath, "utf8");
  const codes = [];
  const re = /<p class="codigo\w+">([^<]*)<\/p>/g;
  let match;

  while ((match = re.exec(content)) !== null) {
    const code = match[1].trim();
    if (!code) continue;
    if (/^x+$/i.test(code) || code.toLowerCase() === "xxxx") continue;
    codes.push(code);
  }

  const unique = [...new Set(codes)];
  return { codes: unique, error: null };
}

function syncCatalog(catalogName) {
  const catalogPath = path.join(ROOT, catalogName);
  if (!fs.existsSync(catalogPath)) {
    return { catalog: catalogName, error: "catalog_missing", changes: [] };
  }

  let content = fs.readFileSync(catalogPath, "utf8");
  const changes = [];
  const issues = [];

  content = content.replace(
    /<a\s+href="([^"]+)"\s+class="link-producto">([\s\S]*?)<\/a>/g,
    (full, href, inner) => {
      if (!inner.includes('class="imagen')) return full;

      const oldMatch = inner.match(/data-codigo="([^"]*)"/);
      const oldCodigo = oldMatch ? oldMatch[1] : null;
      if (oldCodigo === null) {
        issues.push({ href, reason: "no_data_codigo" });
        return full;
      }

      const productPath = path.join(ROOT, href);
      const { codes, error } = extractOfficialCodes(productPath);

      if (error === "missing_file") {
        issues.push({ href, reason: "product_page_missing" });
        return full;
      }

      const newCodigo = codes.length > 0 ? codes.join(", ") : "";

      if (oldCodigo === newCodigo) {
        return full;
      }

      changes.push({
        href,
        from: oldCodigo,
        to: newCodigo,
      });

      const newInner = inner.replace(
        /data-codigo="[^"]*"/,
        `data-codigo="${newCodigo}"`
      );
      return `<a href="${href}" class="link-producto">${newInner}</a>`;
    }
  );

  if (changes.length > 0) {
    fs.writeFileSync(catalogPath, content, "utf8");
  }

  return { catalog: catalogName, changes, issues };
}

const allChanges = [];
const allIssues = [];

for (const catalog of CATALOGS) {
  const result = syncCatalog(catalog);
  allChanges.push(...result.changes.map((c) => ({ catalog, ...c })));
  allIssues.push(...result.issues.map((i) => ({ catalog, ...i })));
}

console.log("Updated entries:", allChanges.length);
for (const c of allChanges) {
  console.log(`[${c.catalog}] ${c.href}`);
  console.log(`  ${c.from} -> ${c.to}`);
}

if (allIssues.length > 0) {
  console.log("\nIssues:", allIssues.length);
  for (const i of allIssues) {
    console.log(`[${i.catalog}] ${i.href || ""} ${i.reason}`);
  }
}

fs.writeFileSync(
  path.join(ROOT, "_sync_report.txt"),
  `Updated: ${allChanges.length}\n` +
    allChanges.map((c) => `[${c.catalog}] ${c.href}\n  ${c.from} -> ${c.to}`).join("\n") +
    (allIssues.length ? `\n\nIssues:\n${allIssues.map((i) => `[${i.catalog}] ${i.href} ${i.reason}`).join("\n")}` : ""),
  "utf8"
);
