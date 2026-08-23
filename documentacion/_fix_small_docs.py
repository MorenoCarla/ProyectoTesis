# -*- coding: utf-8 -*-
import re
from pathlib import Path

DOC = Path(__file__).resolve().parent
WORD = """<html xmlns:o="urn:schemas-microsoft-com:office:office"
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

def wrap(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    body = re.search(r"<body[^>]*>.*</body>", text, re.I | re.S)
    if not body:
        raise SystemExit(f"Sin body: {path.name}")
    head = re.search(r"<head[^>]*>(.*?)</head>", text, re.I | re.S)
    inner = head.group(1) if head else ""
    title = re.search(r"<title>(.*?)</title>", inner, re.I | re.S)
    style = re.search(r"<style[^>]*>.*?</style>", inner, re.I | re.S)
    out = WORD
    out += f"<title>{title.group(1).strip() if title else path.stem}</title>\n"
    if style:
        out += style.group(0) + "\n"
    out += "</head>\n" + body.group(0) + "\n</html>\n"
    path.write_bytes(out.encode("utf-8-sig"))
    print("OK", path.name)

for name in ("00_INDICE_DE_LA_CARPETA.doc", "02_Manual_de_Usuario_CRM_Ituarte.doc"):
    wrap(DOC / name)
