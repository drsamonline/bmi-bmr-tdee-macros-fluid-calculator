#!/usr/bin/env python3
"""Write the release notes for the current version, from the changelog.

    python3 scripts/release_notes.py > notes.md

The rolling release used to be described in one line about a commit SHA, which
tells a clinician nothing. This takes the section for the version in
package.json out of CHANGELOG.md and appends the asset table, so the release
page says what changed and what there is to download.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = "bmi-bmr-tdee-macros-fluid-calculator"
BASE = "https://github.com/drsamonline/%s/releases/latest/download/" % APP

ASSETS = [
    ("Windows", "%s-portable.exe" % APP, "Portable executable — no installer, no registry writes"),
    ("Android", "%s.apk" % APP, "Signed APK — sideload, no Play account"),
    ("Linux", "%s-linux" % APP, "Single portable binary — chmod +x and run"),
    ("Any browser", "%s-web.zip" % APP, "index.html, the manifest, the worker and the icons — open it from a USB stick"),
    ("Checksums", "SHA256SUMS.txt", "SHA-256 of every asset above"),
]


def version():
    with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as fh:
        return json.load(fh)["version"]


def section(ver):
    with open(os.path.join(ROOT, "CHANGELOG.md"), encoding="utf-8") as fh:
        text = fh.read()
    m = re.search(r"^##\s+%s\b.*?(?=^##\s|\Z)" % re.escape(ver), text, re.M | re.S)
    if not m:
        return None
    body = m.group(0)
    # drop the heading itself; the release title carries the version
    return re.sub(r"^##[^\n]*\n", "", body).strip()


def main():
    ver = version()
    body = section(ver)
    out = []
    out.append("## Clinical Health Calculator %s\n" % ver)
    out.append(
        "Offline clinical calculator: BMI, BMR, TDEE, macros, fluids, body composition, "
        "creatinine clearance, dosing and CHA\u2082DS\u2082-VASc \u2014 with the working shown. "
        "One HTML file, no accounts, no tracking.\n"
    )
    if body:
        out.append(body + "\n")
    else:
        out.append("_No changelog section found for %s._\n" % ver)
    out.append("### Downloads\n")
    out.append("| | Asset | What it is |")
    out.append("|---|---|---|")
    for label, name, what in ASSETS:
        out.append("| **%s** | [%s](%s%s) | %s |" % (label, name, BASE, name, what))
    out.append("")
    out.append(
        "The Windows and Android builds carry the app's own icon. Every asset's "
        "SHA-256 is in `SHA256SUMS.txt` \u2014 check a sideloaded APK before you install it.\n"
    )
    sys.stdout.write("\n".join(out))


if __name__ == "__main__":
    main()
