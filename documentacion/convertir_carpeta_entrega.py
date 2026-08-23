# -*- coding: utf-8 -*-
"""Genera CARPETA_TFI_ITUARTE_ENTREGA.doc en UTF-8 para Word."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "CARPETA_TFI_ITUARTE.doc"
OUT = HERE / "CARPETA_TFI_ITUARTE_ENTREGA.doc"

raw = SRC.read_bytes()

if raw.startswith(b"\xff\xfe"):
    text = raw.decode("utf-16-le")
    enc = "utf-16-le (BOM)"
elif raw.startswith(b"\xfe\xff"):
    text = raw.decode("utf-16-be")
    enc = "utf-16-be (BOM)"
elif len(raw) > 3 and raw[1] == 0 and raw[3] == 0:
    # UTF-16 LE sin BOM (Word HTML: "<html" -> 3c 00 68 00)
    text = raw.decode("utf-16-le")
    enc = "utf-16-le"
elif raw.startswith(b"\xef\xbb\xbf"):
    text = raw.decode("utf-8-sig")
    enc = "utf-8-sig"
else:
    text = raw.decode("utf-8")
    enc = "utf-8"

text = re.sub(
    r'<meta\s+http-equiv=Content-Type\s+content="text/html;\s*charset=unicode">',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    text,
    flags=re.I,
)

if "Electricidad" not in text:
    raise SystemExit("ERROR: no se leyo bien el contenido.")

OUT.write_bytes(text.encode("utf-8-sig"))
print(f"OK: {OUT.name} ({enc} -> utf-8-sig)")
