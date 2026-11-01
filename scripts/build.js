#!/usr/bin/env node
/**
 * Build the single-file app from its commented source.
 *
 *   node scripts/build.js
 *
 * One source, two identical artefacts:
 *
 *   src/clinical-health-calculator.html   the app, commented, for editing
 *   index.html                            the build (what the README links to)
 *   docs/play/index.html                  the same build, served by Pages
 *
 * The build pipeline refuses a repo whose demo is not the app, comparing the
 * two files after stripping an SEO block, so they are written from one string
 * here and can never drift.
 *
 * The minifier is a devDependency and runs at build time only: the shipped file
 * has no runtime dependency of any kind, which is the point of the app.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { minify } = require("html-minifier-terser");

const ROOT = path.dirname(__dirname);
const SRC = path.join(ROOT, "src", "clinical-health-calculator.html");
const OUT = [path.join(ROOT, "index.html"), path.join(ROOT, "docs", "play", "index.html")];

const OPTIONS = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  minifyCSS: true,
  // compress, but do not rename: the shipped file is the file a colleague is
  // meant to be able to audit, and `function calculate` beats `function n()`
  minifyJS: { compress: { inline: false, reduceVars: false, passes: 1 }, mangle: false },
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: false,
  useShortDoctype: false,
  caseSensitive: true,
  keepClosingSlash: true,
  // an inline <script> is JavaScript, not HTML: never let the HTML pass inside
  ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/],
};

async function main() {
  const source = fs.readFileSync(SRC, "utf8");
  const built = await minify(source, OPTIONS);

  // a build that lost the app is not a build
  const required = [
    "rBmi", "calculate", "renderWorking", "Cockcroft", "Mifflin",
    "manifest.webmanifest", "chc_entries_v2", "beforeprint",
  ];
  const missing = required.filter((needle) => !built.includes(needle));
  if (missing.length) {
    console.error("build is missing:", missing.join(", "));
    process.exit(1);
  }

  // The cache name is the one thing a stale worker cannot be talked out of, so
  // it is stamped from the version in the source: bump the version, the cache
  // moves with it, and a returning reader gets the new build.
  // the export kit inlined above the app carries its own VERSION, so take the last
  const versions = [...source.matchAll(/var VERSION = "([^"]+)";/g)];
  const version = versions.length ? versions[versions.length - 1][1] : "0";
  const build = (source.match(/var BUILD = "([^"]+)"/) || [])[1] || "0";
  const swPath = path.join(ROOT, "docs", "play", "sw.js");
  const sw = fs
    .readFileSync(swPath, "utf8")
    .replace(/const CACHE = "[^"]*";/, 'const CACHE = "chc-' + version + "-" + build.replace(/-/g, "") + '";');
  fs.writeFileSync(swPath, sw);
  console.log("%s  cache chc-%s-%s", "docs/play/sw.js".padEnd(24), version, build.replace(/-/g, ""));

  for (const target of OUT) {
    fs.writeFileSync(target, built);
    console.log(
      "%s  %d bytes (from %d)",
      path.relative(ROOT, target).padEnd(24),
      Buffer.byteLength(built),
      Buffer.byteLength(source)
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
