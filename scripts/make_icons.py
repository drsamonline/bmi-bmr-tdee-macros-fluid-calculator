#!/usr/bin/env python3
"""Generate the app icon at every size the release builds and the web need.

The pipeline's `make_icons.py` looks for `docs/play/icon.png` (or `.svg`) inside
the app source directory and stamps it into the Windows EXE and the Android
launcher. This repository kept its icon at `docs/icon.svg` — one level above
the app — so the released binaries were built with the builder's fallback glyph
instead of this app's own mark. Writing the artwork into `docs/play/` is what
puts the real icon on the released EXE and APK.

Outputs:
    docs/play/icon.svg       the master artwork (also used as the page favicon)
    docs/play/icon.png       1024 px master, what the release pipeline picks up
    docs/assets/icon-512.png / icon-192.png / icon-180.png   web + PWA sizes
    docs/assets/icon.ico     multi-size Windows icon (16 … 256)

    python3 scripts/make_icons.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAY = os.path.join(ROOT, "docs", "play")
ASSETS = os.path.join(ROOT, "docs", "assets")

# The app's own mark: an ECG trace on a deep-teal tile. Teal is the app's colour
# and only the app's — the landing page is deliberately a different object.
SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="Clinical Health Calculator">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12b3a4"/>
      <stop offset="1" stop-color="#0b6f66"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="232" fill="url(#tile)"/>
  <path d="M170 532h150l64-192 106 384 84-256 64 64h216"
        fill="none" stroke="#ffffff" stroke-width="52"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
"""

SIZES = [("icon-512.png", 512), ("icon-192.png", 192), ("icon-180.png", 180)]
# the manifest and the service-worker shell live in docs/play, so the two
# launcher sizes have to exist there as well as in docs/assets
PLAY_SIZES = [("icon-512.png", 512), ("icon-192.png", 192)]
ICO = [16, 24, 32, 48, 64, 128, 256]



# Small platform glyphs, drawn once and used by both the README and the landing
# page. An icon that is fetched from a CDN is an icon that disappears offline.
GLYPHS = {
    "windows": '<path d="M3 4.9 10.2 3.9v7.2H3V4.9Zm8.3-1.1L21 2.6v8.5h-9.7V3.8ZM3 12.1h7.2v7.2L3 18.3v-6.2Zm8.3 0H21v8.5l-9.7-1.2v-7.3Z"/>',
    "android": '<path d="M17.6 9.5l1.8-3.2a.4.4 0 0 0-.7-.4l-1.9 3.2a11.4 11.4 0 0 0-9.8 0L5.1 5.9a.4.4 0 0 0-.7.4l1.8 3.2A10.8 10.8 0 0 0 1.5 18h21a10.8 10.8 0 0 0-4.9-8.5ZM7 15.2a1.2 1.2 0 1 1 0-2.5 1.2 1.2 0 0 1 0 2.5Zm10 0a1.2 1.2 0 1 1 0-2.5 1.2 1.2 0 0 1 0 2.5Z"/>',
    "linux": '<path d="M4.5 6.5 9.5 12l-5 5.5M11.5 18H19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    "checksums": '<path d="M12 2.6l7 2.8v6.1c0 4.4-2.9 8.1-7 9.9-4.1-1.8-7-5.5-7-9.9V5.4l7-2.8Zm-3.2 9.6 2.3 2.3 4.2-4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    "web": '<path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 0c2.6 2.6 2.6 16.4 0 19M2.8 12h18.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
}

GLYPH_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" '
    'role="img" aria-label="{name}"><title>{name}</title>'
    '<g fill="{ink}" color="{ink}">{body}</g></svg>'
)


def write_glyphs():
    for name, body in GLYPHS.items():
        out = os.path.join(ASSETS, "icon-%s.svg" % name)
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(GLYPH_SVG.format(name=name, ink="#151a1e", body=body))
        print("wrote", os.path.relpath(out, ROOT))

def main():
    os.makedirs(PLAY, exist_ok=True)
    os.makedirs(ASSETS, exist_ok=True)

    svg_path = os.path.join(PLAY, "icon.svg")
    with open(svg_path, "w", encoding="utf-8") as fh:
        fh.write(SVG)
    print("wrote", os.path.relpath(svg_path, ROOT))

    try:
        import cairosvg
    except ImportError:
        sys.exit("cairosvg is required: pip install cairosvg")

    master = os.path.join(PLAY, "icon.png")
    cairosvg.svg2png(bytestring=SVG.encode(), write_to=master,
                     output_width=1024, output_height=1024)
    print("wrote", os.path.relpath(master, ROOT))

    from PIL import Image
    img = Image.open(master).convert("RGBA")
    for name, px in SIZES:
        out = os.path.join(ASSETS, name)
        img.resize((px, px), Image.LANCZOS).save(out)
        print("wrote", os.path.relpath(out, ROOT))

    for name, px in PLAY_SIZES:
        out = os.path.join(PLAY, name)
        img.resize((px, px), Image.LANCZOS).save(out)
        print("wrote", os.path.relpath(out, ROOT))

    write_glyphs()

    ico = os.path.join(ASSETS, "icon.ico")
    img.save(ico, sizes=[(s, s) for s in ICO])
    print("wrote", os.path.relpath(ico, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
