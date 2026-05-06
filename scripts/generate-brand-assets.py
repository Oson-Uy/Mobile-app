"""Generate Expo icon, adaptive icon, and splash from the site logo (one-off / CI)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SITE_LOGO = (
    ROOT.parent / "frontend" / "public" / "osonuy-logo-removebg-preview.png"
)
OUT_DIR = ROOT / "assets"
BRAND_BLUE = (0x1E, 0x3A, 0x8A, 255)
# Светлый фон splash: тёмно-синие буквы «Oson» на фирменном синем сливались.
SPLASH_BG = (0xF8, 0xFA, 0xFC, 255)


def _paste_logo_center(canvas: Image.Image, logo: Image.Image, max_frac: float) -> None:
    w, h = canvas.size
    max_l = int(min(w, h) * max_frac)
    lw, lh = logo.size
    scale = min(max_l / lw, max_l / lh)
    nw, nh = int(lw * scale), int(lh * scale)
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    ox, oy = (w - nw) // 2, (h - nh) // 2
    canvas.paste(resized, (ox, oy), resized)


def make_square_icon(size: int) -> Image.Image:
    logo = Image.open(SITE_LOGO).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), BRAND_BLUE)
    _paste_logo_center(canvas, logo, 0.62)
    return canvas


def make_splash(w: int, h: int) -> Image.Image:
    logo = Image.open(SITE_LOGO).convert("RGBA")
    canvas = Image.new("RGBA", (w, h), SPLASH_BG)
    _paste_logo_center(canvas, logo, 0.56)
    return canvas


def main() -> None:
    if not SITE_LOGO.is_file():
        raise SystemExit(f"Site logo not found: {SITE_LOGO}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    icon = make_square_icon(1024)
    icon.save(OUT_DIR / "icon.png", optimize=True)

    adaptive = make_square_icon(1024)
    adaptive.save(OUT_DIR / "adaptive-icon.png", optimize=True)

    splash = make_splash(1284, 2778)
    splash.save(OUT_DIR / "splash.png", optimize=True)

    # In-app asset (same source as web footer)
    brand_dest = OUT_DIR / "brand-logo.png"
    brand_dest.write_bytes(SITE_LOGO.read_bytes())

    fav = make_square_icon(48)
    fav.save(OUT_DIR / "favicon.png", optimize=True)

    print(f"Wrote icon, adaptive-icon, splash, favicon, brand-logo in {OUT_DIR}")


if __name__ == "__main__":
    main()
