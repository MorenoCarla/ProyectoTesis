# -*- coding: utf-8 -*-
import re
from pathlib import Path

SRC = Path(__file__).resolve().parent / "CARPETA_TFI_ITUARTE.doc"
LOG = Path(__file__).resolve().parent / "_fix_carpeta_log.txt"

def log(msg: str) -> None:
    LOG.write_text((LOG.read_text(encoding="utf-8") if LOG.exists() else "") + msg + "\n", encoding="utf-8")

try:
    raw = SRC.read_bytes()
    log(f"bytes={len(raw)} head={raw[:4].hex()}")

    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        text = raw.decode("utf-16")
        enc = "utf-16"
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
    text = re.sub(
        r'<meta\s+http-equiv=Content-Type\s+content="text/html;\s*charset=utf-8">',
        '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
        text,
        flags=re.I,
    )

    if "acad" not in text.lower() and "Resumen" not in text:
        raise RuntimeError("Contenido sospechoso tras decodificar")

    SRC.write_bytes(text.encode("utf-8-sig"))
    log(f"OK {SRC.name} ({enc} -> utf-8-sig)")
except Exception as e:
    log(f"ERROR: {e}")
    raise
