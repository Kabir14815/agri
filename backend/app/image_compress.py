"""Compress uploaded images for storage in MongoDB."""
from __future__ import annotations

import base64
import io
from typing import Optional, Tuple

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None  # type: ignore
    ImageOps = None  # type: ignore

MAX_EDGE = 1280
JPEG_QUALITY = 72
MAX_BYTES = 350_000


def compress_image_bytes(
    raw: bytes,
    *,
    max_edge: int = MAX_EDGE,
    quality: int = JPEG_QUALITY,
    max_bytes: int = MAX_BYTES,
) -> Tuple[str, str, int]:
    """
    Returns (base64_data, mime_type, size_bytes).
    Falls back to original bytes as base64 if Pillow unavailable.
    """
    if not raw:
        raise ValueError("empty_file")

    if Image is None:
        b64 = base64.b64encode(raw).decode("ascii")
        return b64, "application/octet-stream", len(raw)

    try:
        img = Image.open(io.BytesIO(raw))
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        elif img.mode == "L":
            img = img.convert("RGB")

        w, h = img.size
        scale = min(1.0, max_edge / max(w, h))
        if scale < 1.0:
            img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

        q = quality
        for _ in range(6):
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=q, optimize=True)
            data = buf.getvalue()
            if len(data) <= max_bytes or q <= 45:
                break
            q -= 8

        b64 = base64.b64encode(data).decode("ascii")
        return b64, "image/jpeg", len(data)
    except Exception as exc:
        raise ValueError("invalid_image") from exc


def image_data_url(mime: str, b64: str) -> str:
    return f"data:{mime};base64,{b64}"
