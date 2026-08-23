/**
 * Reemplaza el footer viejo por el footer institucional (igual que Home).
 * Ejecutar: node scripts/migrate-product-footer.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const FOOTER_BLOCK = `        <footer class="site-footer">
            <div class="site-footer-grid">
                <div>
                    <h3>Electricidad Ituarte</h3>
                    <p>Más de 50 años iluminando proyectos en Tucumán.</p>
                    <div class="site-footer-social">
                        <a href="https://www.instagram.com/electricidadituarte.sur?" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.facebook.com/share/19tbHw23mm/?" target="_blank" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
                        <a href="https://www.tiktok.com/@ituarte.electricidad?" target="_blank" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
                    </div>
                </div>
                <div class="site-footer-links">
                    <h3>Navegación</h3>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="conócenos.html">Conócenos</a></li>
                        <li><a href="productos.html">Productos</a></li>
                        <li><a href="catalogo.html">Catálogo</a></li>
                        <li><a href="contacto.html">Contacto</a></li>
                        <li><a href="registro.html">Registrarse</a></li>
                    </ul>
                </div>
                <div>
                    <h3>Horarios de atención</h3>
                    <ul>
                        <li>Lunes a viernes: 8:30 a 12:30 hs / 16:30 a 20:30 hs</li>
                        <li>Sábados: 8:30 a 13:00 hs</li>
                    </ul>
                </div>
            </div>
            <p class="site-footer-copy">© Electricidad Ituarte — Concepción &amp; J. B. Alberdi, Tucumán</p>
        </footer>
        <button type="button" class="scroll-top" id="scroll-top" aria-label="Volver arriba">↑</button>
        <a href="https://wa.me/5493865601388" class="whatsapp-float" target="_blank" aria-label="WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>`;

const OLD_FOOTER_RE = /<footer>[\s\S]*?<\/footer>\s*(?:<div class="scroll-top"[\s\S]*?<\/div>\s*)?<a href="https:\/\/wa\.me\/5493865601388"[\s\S]*?<\/a>/i;

let updated = 0;
let skipped = 0;

for (const file of fs.readdirSync(root)) {
  if (!file.endsWith(".html")) continue;
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, "utf8");

  if (!html.includes("stylescadaproducto.css")) continue;
  if (!html.includes("footer-left")) {
    if (html.includes('class="site-footer"')) skipped++;
    continue;
  }

  html = html.replace(/(\s*<br>\s*)+(?=\s*<footer>)/gi, "\n");
  if (!OLD_FOOTER_RE.test(html)) {
    console.log("SKIP (patrón no encontrado):", file);
    skipped++;
    continue;
  }

  html = html.replace(OLD_FOOTER_RE, FOOTER_BLOCK);
  fs.writeFileSync(filePath, html, "utf8");
  updated++;
}

console.log(`Listo: ${updated} actualizados, ${skipped} omitidos.`);
