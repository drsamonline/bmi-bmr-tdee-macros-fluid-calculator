/* Clinical Health Calculator — service worker.
 *
 * What this fixes: a cache-first worker with a cache name that never changes
 * answers the HTML from cache forever, so a shipped release is invisible to a
 * returning reader and there is no way to tell from the page. So:
 *
 *   the document  -> network first, cache only as the offline fallback
 *   the assets    -> cache first, refreshed in the background
 *   CACHE         -> bumped by scripts/build.js on every version bump
 *
 * The app is one HTML file, so "offline" here means the shell plus its icons;
 * there is no data to cache and nothing is ever uploaded.
 */
"use strict";

const CACHE = "chc-2.7.0-20261101"; /* rewritten by scripts/build.js */
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (event) {
  if (event.data === "version") {
    event.source && event.source.postMessage({ cache: CACHE });
  }
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const wantsDocument = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") !== -1;

  if (wantsDocument) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          const copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || caches.match("./index.html");
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      const network = fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () { return hit; });
      return hit || network;
    })
  );
});
