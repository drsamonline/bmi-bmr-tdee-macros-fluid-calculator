#!/usr/bin/env python3
"""Screenshot the landing page and the app with headless Chromium.

    python3 scripts/shot.py            # landing, app, og
    python3 scripts/shot.py landing
    python3 scripts/shot.py app
    python3 scripts/shot.py og

Two things this does that a bare `chromium --screenshot` does not:

* **The landing page is shot over HTTP, not `file://`.** The page embeds the app
  in a frame; Chromium refuses a `file://` frame from a `file://` parent, so the
  frame photographs as a blank rectangle. A throwaway server on 127.0.0.1 serves
  `docs/` for the length of the run — the same way GitHub Pages serves it.
* **The app is shot populated.** A copy is written with a sample patient typed
  into it, so the screenshot shows a calculator that has been used rather than
  an empty form.

Look at the PNGs before committing.
"""
import functools
import http.server
import os
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
OUT = os.path.join(DOCS, "assets")

CHROME = next(
    (shutil.which(c) for c in ("chromium", "chromium-browser", "google-chrome") if shutil.which(c)),
    None,
)

FLAGS = [
    "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--virtual-time-budget=6000",
    # hold still: the page fades its sections in on scroll, and a screenshot
    # taken mid-transition shows a page that looks half-finished
    "--force-prefers-reduced-motion",
]

PREFILL = """
<script>
(function(){
  function set(id, v){
    var el = document.getElementById(id); if(!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  window.addEventListener('load', function(){
    set('patient','OP-1042'); set('age','34'); set('heightCm','172');
    set('weightKg','69'); set('waist','84'); set('hip','96');
    set('activity','active'); set('creat','1.0'); set('doseKg','5');
    var w = document.querySelector('details.working'); if (w) w.open = true;
  });
})();
</script>
"""


def shoot(url, width, height, out):
    os.makedirs(OUT, exist_ok=True)
    subprocess.run(
        [CHROME, *FLAGS, "--window-size=%d,%d" % (width, height), "--screenshot=%s" % out, url],
        check=False, capture_output=True, timeout=180,
    )
    size = os.path.getsize(out) if os.path.exists(out) else 0
    print("wrote %s (%d bytes)" % (os.path.relpath(out, ROOT), size))
    if not size:
        sys.exit("chromium produced nothing for %s" % url)


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, "http://127.0.0.1:%d" % httpd.server_address[1]


def landing():
    httpd, base = serve()
    try:
        shoot(base + "/", 1280, 2600, os.path.join(OUT, "landing-desktop.png"))
        shoot(base + "/", 430, 1500, os.path.join(OUT, "landing-mobile.png"))
    finally:
        httpd.shutdown()


def app():
    src = os.path.join(DOCS, "play", "index.html")
    html = open(src, encoding="utf-8").read().replace("</body>", PREFILL + "</body>")
    tmp = os.path.join(tempfile.gettempdir(), "chc-shot-app.html")
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(html)
    shoot("file://" + tmp, 1280, 1260, os.path.join(OUT, "app-desktop.png"))
    shoot("file://" + tmp, 430, 1080, os.path.join(OUT, "app-mobile.png"))


OG = """<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%}
  body{width:1280px;height:640px;background:#12161a;color:#f2ece1;
    font-family:Georgia,"Iowan Old Style",serif;display:flex;flex-direction:column;
    justify-content:center;padding:0 96px;box-sizing:border-box;
    background-image:radial-gradient(760px 380px at 92% -18%,rgba(217,154,43,.16),transparent 64%),
      linear-gradient(180deg,#151a1f,#0e1215)}
  .rule{width:96px;height:5px;background:#d99a2b;margin-bottom:34px}
  .eyebrow{font-family:ui-sans-serif,system-ui,sans-serif;font-size:19px;letter-spacing:.22em;
    text-transform:uppercase;color:#d99a2b;margin-bottom:20px}
  h1{font-size:72px;line-height:1.05;margin:0 0 24px;font-weight:400}
  p{font-family:ui-sans-serif,system-ui,sans-serif;font-size:25px;color:#b6ada0;margin:0;max-width:900px}
  .foot{font-family:ui-monospace,monospace;font-size:19px;color:#867e72;margin-top:40px}
</style></head><body>
  <div class="rule"></div>
  <div class="eyebrow">Offline · one HTML file · no dependencies</div>
  <h1>Clinical Health Calculator</h1>
  <p>BMI, BMR, TDEE, macros, fluids and body composition — with the working shown.</p>
  <div class="foot">drsamonline.github.io</div>
</body></html>
"""


def og():
    card = os.path.join(tempfile.gettempdir(), "chc-og.html")
    with open(card, "w", encoding="utf-8") as fh:
        fh.write(OG)
    shoot("file://" + card, 1280, 640, os.path.join(OUT, "og.png"))


def main():
    if not CHROME:
        sys.exit("no chromium on PATH")
    which = sys.argv[1:] or ["landing", "app", "og"]
    for step in which:
        {"landing": landing, "app": app, "og": og}[step]()
    return 0


if __name__ == "__main__":
    sys.exit(main())
