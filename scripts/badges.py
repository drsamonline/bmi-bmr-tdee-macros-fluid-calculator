#!/usr/bin/env python3
"""Draw this repository's badges as local SVG files.

An offline-first app should not need an image service to describe itself. These
are drawn here, committed to `docs/assets/`, and referenced by relative path, so
they render in the README, on the landing page and from `file://` with no
network at all.

Every value below is a claim about this repository. Keep them true:

    tests       the count `npm test` actually prints
    size        the byte size of the single shipped HTML file
    licence     what LICENSE says

    python3 scripts/badges.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")
APP = os.path.join(ROOT, "docs", "play", "index.html")

INK = "#151a1e"
PAPER = "#f4efe6"
AMBER = "#d99a2b"
RUST = "#c2563a"
MOSS = "#4e6b4a"
SLATE = "#4a5560"

FONT = "ui-sans-serif,-apple-system,Segoe UI,Helvetica,Arial,sans-serif"


def _advance(text, size=11):
    """Width of `text` at `size` px, measured if a real font is available."""
    try:
        from PIL import ImageFont
        for path in (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        ):
            if os.path.exists(path):
                return ImageFont.truetype(path, size).getlength(text)
    except Exception:
        pass
    return len(text) * 6.7


def badge(label, value, colour, value_ink=PAPER):
    lw = int(_advance(label)) + 18
    vw = int(_advance(value)) + 18
    total = lw + vw
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="{total}" height="22" role="img" '
        'aria-label="{label}: {value}">'
        "<title>{label}: {value}</title>"
        '<clipPath id="r"><rect width="{total}" height="22" rx="4"/></clipPath>'
        '<g clip-path="url(#r)">'
        '<rect width="{lw}" height="22" fill="{ink}"/>'
        '<rect x="{lw}" width="{vw}" height="22" fill="{colour}"/>'
        "</g>"
        '<g font-family="{font}" font-size="11" text-anchor="middle">'
        '<text x="{lx}" y="15" fill="{paper}">{label}</text>'
        '<text x="{vx}" y="15" fill="{value_ink}">{value}</text>'
        "</g></svg>"
    ).format(
        total=total, label=label, value=value, lw=lw, vw=vw, colour=colour,
        ink=INK, paper=PAPER, value_ink=value_ink, font=FONT,
        lx=lw // 2, vx=lw + vw // 2,
    )


def app_size_kb():
    try:
        return "%d kB" % round(os.path.getsize(APP) / 1024)
    except OSError:
        return "1 file"


def app_version():
    try:
        with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as fh:
            m = re.search(r'"version"\s*:\s*"([^"]+)"', fh.read())
        return "v" + m.group(1) if m else "v2"
    except OSError:
        return "v2"


def main():
    os.makedirs(OUT, exist_ok=True)
    badges = [
        ("offline", "offline", "no network", MOSS),
        ("deps", "runtime deps", "0", MOSS),
        ("file", "single file", app_size_kb(), SLATE),
        ("tests", "tests", "74 passing", MOSS),
        ("i18n", "i18n", "EN / HI / GU", AMBER),
        ("licence", "licence", "PolyForm NC 1.0.0", RUST),
        ("version", "version", app_version(), SLATE),
    ]
    for name, label, value, colour in badges:
        path = os.path.join(OUT, "badge-%s.svg" % name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(badge(label, value, colour))
        print("wrote", os.path.relpath(path, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
