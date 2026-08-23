# -*- coding: utf-8 -*-
"""Convierte .doc HTML para que Word en Windows muestre bien el espanol."""
from __future__ import annotations

import re
from pathlib import Path

DOC_DIR = Path(__file__).resolve().parent
SKIP = {"~$", "_fix_doc_encoding.py"}

WORD_HEAD = """<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<!--[if gte mso 9]><xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
"""


def detect_and_read(path: Path) -> tuple[str, str]:
    raw = path.read_bytes()
    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        for enc in ("utf-16", "utf-16-le", "utf-16-be"):
            try:
                return raw.decode(enc), enc
            except UnicodeDecodeError:
                continue
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig"), "utf-8-sig"
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"No se pudo decodificar: {path.name}")


def normalize_meta(text: str) -> str:
    text = re.sub(
        r'<meta\s+http-equiv=Content-Type\s+content="text/html;\s*charset=unicode">',
        '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
        text,
        flags=re.I,
    )
    text = re.sub(
        r'<meta\s+charset="utf-8"\s*/?>',
        '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
        text,
        flags=re.I,
    )
    text = re.sub(
        r'<meta\s+charset=utf-8\s*/?>',
        '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
        text,
        flags=re.I,
    )
    return text


def ensure_word_shell(text: str) -> str:
    lower = text.lower()
    if "xmlns:w=" in lower and "progId content=Word.Document".lower() in lower.replace(" ", ""):
        return text
    m = re.search(r"<head[^>]*>(.*?)</head>", text, re.I | re.S)
    body_m = re.search(r"<body[^>]*>.*</body>", text, re.I | re.S)
    if not body_m:
        raise RuntimeError("Sin etiqueta body")
    head_inner = m.group(1) if m else ""
    title_m = re.search(r"<title>(.*?)</title>", head_inner, re.I | re.S)
    title = title_m.group(1).strip() if title_m else "Documento"
    style_m = re.search(r"<style[^>]*>.*?</style>", head_inner, re.I | re.S)
    style = style_m.group(0) if style_m else ""
    return (
        WORD_HEAD
        + f"<title>{title}</title>\n"
        + (style + "\n" if style else "")
        + "</head>\n"
        + body_m.group(0)
        + "\n</html>\n"
    )


def write_utf8_bom(path: Path, text: str) -> None:
    path.write_bytes(text.encode("utf-8-sig"))


def main() -> None:
    files = sorted(
        p
        for p in DOC_DIR.glob("*.doc")
        if not any(p.name.startswith(s) for s in SKIP)
    )
    for path in files:
        text, enc = detect_and_read(path)
        text = normalize_meta(text)
        text = ensure_word_shell(text)
        write_utf8_bom(path, text)
        print(f"OK  {path.name}  ({enc} -> utf-8-sig)")


if __name__ == "__main__":
    main()
