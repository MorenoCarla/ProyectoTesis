# -*- coding: utf-8 -*-
"""Genera CARPETA_TFI_ITUARTE_ENTREGA.doc legible en Word (como el Manual)."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "CARPETA_TFI_ITUARTE_ENTREGA.doc"
TRANSCRIPT = Path(r"C:\Users\Estudiante\.cursor\projects\c-Users-Estudiante-Desktop\agent-transcripts\df7d9efc-8c80-4038-882e-5963c59245a2\df7d9efc-8c80-4038-882e-5963c59245a2.jsonl")

HEAD = """<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument>
</xml><![endif]-->
"""

def load_original_html() -> str:
    if not TRANSCRIPT.exists():
        raise SystemExit("No se encontro el historial con el contenido original.")
    for line in TRANSCRIPT.open(encoding="utf-8"):
        if "CARPETA_TFI_ITUARTE.doc" not in line or "Resumen ejecutivo" not in line:
            continue
        data = json.loads(line)
        for part in data.get("message", {}).get("content", []):
            if part.get("type") != "tool_use":
                continue
            inp = part.get("input") or {}
            if inp.get("path", "").endswith("CARPETA_TFI_ITUARTE.doc") and inp.get("contents"):
                return inp["contents"]
    raise SystemExit("No se encontro el contenido original en el historial.")

def patch(html: str) -> str:
    html = re.sub(r"<meta charset=\"utf-8\">", "", html)
    html = re.sub(
        r"<li><strong>Sitio web corporativo:</strong> catálogo de productos con fichas individuales.*?</li>",
        "<li><strong>Sitio web corporativo:</strong> catálogo con más de 350 fichas, header y footer unificados (site-chrome), páginas por categoría, diseño responsive y formulario de contacto conectado al CRM.</li>",
        html,
        flags=re.S,
    )
    html = re.sub(
        r"<h3>4\.2\.1 Sitio web corporativo \(frontend público\)</h3>\s*<ul>.*?</ul>",
        """<h3>4.2.1 Sitio web corporativo (frontend público)</h3>
<ul>
<li>Home rediseñada con identidad visual Ituarte, paneles promocionales y accesos rápidos.</li>
<li>Header y footer unificados en todo el sitio (<em>site-chrome.css</em> / <em>site-chrome.js</em>).</li>
<li>Páginas institucionales: Conócenos, Contacto, Catálogo.</li>
<li>Más de 350 fichas de producto en categorías: apliques, colgantes, plafones, reflectores, ventiladores, veladores, farolas, paneles solares, cámaras, entre otras.</li>
<li>Plantilla de producto responsive con carrusel de imágenes y tipografía Work Sans.</li>
<li>Fondos visuales por categoría (por ejemplo, colgantes) para mejorar la experiencia de navegación.</li>
<li>Formulario de contacto/consulta conectado al backend del CRM.</li>
<li>Acceso al login del CRM para usuarios registrados.</li>
</ul>""",
        html,
        flags=re.S,
    )
    html = html.replace(
        "<tr><td>RNF-06</td><td><strong>Compatibilidad:</td><td>Funcionamiento en navegadores modernos (Chrome, Firefox, Edge).</td></tr>",
        "<tr><td>RNF-06</td><td><strong>Compatibilidad:</strong> Funcionamiento en navegadores modernos (Chrome, Firefox, Edge).</td></tr>",
    )
    html = html.replace(
        "<tr><td>RNF-07</td><td><strong>Disponibilidad:</td><td>Sistema diseñado para operar en horario comercial con posibilidad de hosting local o en la nube.</td></tr>",
        "<tr><td>RNF-07</td><td><strong>Disponibilidad:</strong> Sistema diseñado para operar en horario comercial con posibilidad de hosting local o en la nube.</td></tr>",
    )
    html = html.replace(
        "Electricidad Ituarte es una empresa con trayectoria en la región de Concepción",
        "Electricidad Ituarte es una empresa con 50 años de trayectoria en Concepción y Juan Bautista Alberdi",
    )
    html = html.replace(
        "<tr><td>Sprint 3 — Catálogo web</td><td>Categorías, plantilla producto, apliques (50+ fichas)</td>",
        "<tr><td>Sprint 3 — Catálogo web</td><td>Categorías, plantilla producto, migración header/footer, más de 350 fichas</td>",
    )
    html = html.replace(
        "<tr><td>Sprint 11 — Correcciones</td><td>Feedback tutora: filtros backend, paginación, UI roles</td>",
        "<tr><td>Sprint 11 — Correcciones</td><td>Feedback tutora: filtros backend, paginación, UI roles, rediseño sitio web unificado</td>",
    )
    html = html.replace(
        "<li>Sitio web corporativo funcional con catálogo de productos en carga progresiva.</li>",
        "<li>Sitio web corporativo funcional con diseño unificado, más de 350 fichas de producto y navegación responsive.</li>",
    )
    return html

def main() -> None:
    body = patch(load_original_html())
    body = re.sub(r"^<html[^>]*>\s*<head>.*?</head>\s*", "", body, count=1, flags=re.S)
    out = HEAD + body
    if not out.rstrip().endswith("</html>"):
        out += "\n</html>\n"
    OUT.write_bytes(out.encode("utf-8-sig"))
    print(f"Generado: {OUT.name}")

if __name__ == "__main__":
    main()
