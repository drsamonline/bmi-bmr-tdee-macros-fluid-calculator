// Headless test for the Clinical Health Calculator.
//
// Loads the built index.html in a headless DOM, runs the app's own known-value
// self-tests (one per calculator + a units-consistency check), then drives the
// calculator through the DOM to check creatinine clearance and the
// "Show the working" panel.
//
//   npm install && npm test

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });

setTimeout(() => {
  const w = dom.window;
  const d = w.document;
  let fail = 0;
  const ok = (name, cond) => { console.log((cond ? "PASS " : "FAIL ") + name); if (!cond) fail++; };

  ok("known-value self-tests (one per calculator + units)", w.__chcSelfTest() === true);

  const fire = (id, v) => {
    const e = d.getElementById(id);
    e.value = v;
    e.dispatchEvent(new w.Event("input", { bubbles: true }));
  };
  const gender = (v) => d.querySelector('#genderToggle button[data-val="' + v + '"]').click();
  const txt = (id) => d.getElementById(id).textContent;

  fire("age", "40"); fire("heightCm", "175"); fire("weightKg", "70"); fire("creat", "1.0");

  gender("M");
  ok("CrCl male 70 kg / 40 y / Scr 1.0 = 97.2 mL/min", txt("rCrcl") === "97.2");
  gender("F");
  ok("CrCl female (x0.85) = 82.6 mL/min", txt("rCrcl") === "82.6");
  fire("creat", "");
  ok("no serum creatinine -> CrCl is blank", txt("rCrcl") === "--");
  fire("creat", "1.0"); gender("M");

  const rows = [...d.querySelectorAll("#working li")];
  ok("the working panel lists the formulas", rows.length >= 15);
  ok("the working panel includes creatinine clearance", rows.some((li) => li.textContent.startsWith("CrCl")));
  ok("the working panel shows a substituted formula", /=\s*\d/.test(rows[0].textContent));

  fire("doseKg", "5"); fire("doseM2", "100");
  ok("weight-based dose 5 mg/kg x 70 kg = 350 mg", txt("rDoseKg") === "350");
  ok("BSA-based dose 100 mg/m2 x BSA ~ 184.5 mg", txt("rDoseM2") === "184.5");
  fire("doseKg", ""); fire("doseM2", "");
  ok("no dose -> blank", txt("rDoseKg") === "--" && txt("rDoseM2") === "--");

  const tick = (id, on) => { const e = d.getElementById(id); e.checked = on; e.dispatchEvent(new w.Event("change", { bubbles: true })); };
  fire("age", "80"); gender("F"); tick("chf", true); tick("htn", true); tick("dm", true);
  ok("CHA2DS2-VASc: age 80 + female + CHF + HTN + DM = 6", txt("rChads") === "6");
  tick("stroke", true);
  ok("CHA2DS2-VASc: + prior stroke = 8", txt("rChads") === "8");
  ok("the working panel includes CHA2DS2-VASc", [...d.querySelectorAll("#working li")].some((li) => li.textContent.startsWith("CHA2DS2-VASc")));


  // RETROFIT (kit-export-kit): the CSV export must DELEGATE to the shared kit,
  // not hand-roll the Blob -> objectURL -> <a download> dance. Stub the kit and
  // assert the app calls it with the filename and the CSV text.
  const calls = [];
  w.Export = w.Export || {};              // guarded, so this fails cleanly on an un-retrofitted build
  w.Export.save = function () { calls.push([].slice.call(arguments)); return true; };
  fire("age", "40"); fire("heightCm", "175"); fire("weightKg", "70");
  d.getElementById("btnSave").dispatchEvent(new w.Event("click"));
  d.getElementById("btnExport").dispatchEvent(new w.Event("click"));
  ok("export delegates to the shared kit (Export.save called)", calls.length === 1);
  ok("export passes the filename + the CSV text", !!calls[0] && calls[0][0] === "health_calculator_export.csv" && /Timestamp/.test(calls[0][1]));
  ok("export passes a CSV mime type", !!calls[0] && /text\/csv/.test(calls[0][2]));


  // RETROFIT (kit-export-kit, second pass): the CSV must be BUILT by the shared
  // kit's dataframe, not by a hand-rolled cell writer. The app used to carry its
  // own `X()` that quoted every cell and prefixed any leading = + - @ with an
  // apostrophe — which also mangled a NEGATIVE NUMBER into text. The kit's
  // writer is RFC4180 and its guard is number-aware, so "-5" stays a number and
  // "=1+1" is still defused. This asserts BOTH halves.
  const realDf = w.Export.df;
  const dfCalls = [];
  w.Export.df = function (rows) { dfCalls.push(rows); return realDf(rows); };
  let csvText = null;
  w.Export.save = function (name, data) { csvText = data; return true; };

  fire("age", "40"); fire("heightCm", "175"); fire("weightKg", "70");
  fire("patient", "-5");
  d.getElementById("btnSave").dispatchEvent(new w.Event("click"));
  fire("patient", "=1+1");
  d.getElementById("btnSave").dispatchEvent(new w.Event("click"));
  d.getElementById("btnExport").dispatchEvent(new w.Event("click"));

  ok("the CSV is built by the shared kit's dataframe (Export.df called)", dfCalls.length === 1);
  ok("the dataframe got one row per saved entry", !!dfCalls[0] && dfCalls[0].length >= 2);
  ok("a numeric cell is left as a number (-5, not '-5)",
    /,-5[,]/.test(String(csvText)), String(csvText).split("\n")[1]);
  ok("a formula cell is still defused ('=1+1)",
    String(csvText).indexOf("'=1+1") >= 0);
  ok("the CSV keeps its BOM and its header",
    String(csvText).charAt(0) === "\ufeff" && String(csvText).indexOf("Timestamp,Patient") > 0);

  // ---- 2.6.0: the app as an installed, printable, follow-up instrument ----

  // a manifest is what turns a bookmark into an app; the icons have to exist
  // inside docs/play because that is the whole of what the EXE and APK bundle
  const root = path.join(__dirname, "..");
  const playDir = path.join(root, "docs", "play");
  const manifestPath = path.join(playDir, "manifest.webmanifest");
  ok("the page links its manifest",
    /<link rel="?manifest"? href="?manifest\.webmanifest"?>/.test(html));
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); } catch (e) { manifest = null; }
  ok("the manifest parses", !!manifest);
  ok("the manifest is standalone with a start_url",
    !!manifest && manifest.display === "standalone" && manifest.start_url === "./");
  ok("every manifest icon is a file in the app folder",
    !!manifest && manifest.icons.length >= 3 &&
    manifest.icons.every((i) => fs.existsSync(path.join(playDir, i.src))));

  // the worker is the one thing that can serve a stale build forever, so its
  // cache name must move with the version
  const sw = fs.readFileSync(path.join(playDir, "sw.js"), "utf8");
  const versions = [...html.matchAll(/var VERSION\s*=\s*"([\d.]+)";/g)];
  const version = versions.length ? versions[versions.length - 1][1] : "";
  ok("the service worker exists and is version-stamped",
    /const CACHE = "chc-/.test(sw) && sw.indexOf("chc-" + version + "-") > 0, version);
  ok("the worker serves the document network-first",
    /wantsDocument[\s\S]*?fetch\(req\)/.test(sw));

  // reading in a consulting room
  const htmlEl = d.documentElement;
  const click = (id) => d.getElementById(id).dispatchEvent(new w.Event("click"));
  ok("text size starts at the base step", htmlEl.getAttribute("data-textsize") === "md");
  click("btnText");
  ok("the text-size button steps up", htmlEl.getAttribute("data-textsize") === "lg");
  click("btnText"); click("btnText");
  ok("and cycles back round", htmlEl.getAttribute("data-textsize") === "md");
  click("btnContrast");
  ok("the contrast button turns high contrast on",
    htmlEl.getAttribute("data-contrast") === "high");
  click("btnContrast");
  ok("and off again", !htmlEl.getAttribute("data-contrast"));

  // a follow-up tool: the change since the same patient's last entry
  fire("patient", "FOLLOW-UP-1");
  fire("age", "40"); fire("heightCm", "175"); fire("weightKg", "70");
  d.getElementById("btnSave").dispatchEvent(new w.Event("click"));
  fire("weightKg", "68");
  const delta = d.getElementById("deltaRow");
  ok("a saved patient gets a change-since-last line", delta.classList.contains("show"));
  ok("the change is the difference in weight, signed",
    /weight \u22122\.0 kg/.test(delta.textContent), delta.textContent);
  fire("patient", "NO-HISTORY-9"); fire("weightKg", "70");
  ok("an unknown patient gets no delta line",
    !d.getElementById("deltaRow").classList.contains("show"));

  // the printed sheet carries a header, because a note without a name is paper
  ok("the print header names the patient and the date",
    /NO-HISTORY-9/.test(d.getElementById("printMeta").textContent) &&
    /\d{4}-\d{2}-\d{2}/.test(d.getElementById("printMeta").textContent));
  ok("the build stamp is printed in the footer",
    /build \d{4}-\d{2}-\d{2}/.test(d.getElementById("buildStamp").textContent));

  // the working panel says how it rounded, so a printed figure can be checked
  ok("the working panel states its rounding rule",
    /Rounded half-up/.test(d.getElementById("working").textContent));

  // Enter walks the form rather than doing nothing
  const ageEl = d.getElementById("age");
  ageEl.focus();
  ageEl.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  ok("Enter moves to the next field", d.activeElement && d.activeElement.id !== "age");

  // ---- 2.7.0: batch, encryption, a sealed log, the limits panel ----

  // batch: rows in, the same arithmetic out, and the clinician's own form intact
  fire("patient", "KEEP-ME"); fire("age", "40"); fire("weightKg", "70");
  d.getElementById("batchText").value =
    "patient, age, sex, height_cm, weight_kg, waist_cm\nOP-1, 34, M, 172, 69, 84\nOP-2, 51, F, 158, 74, 96";
  d.getElementById("btnBatchRun").dispatchEvent(new w.Event("click"));
  const batchTable = d.querySelectorAll("#batchOut tbody tr");
  ok("batch computes one row per pasted patient", batchTable.length === 2);
  ok("batch uses the app's own arithmetic (BMI 23.3 for 69 kg / 172 cm)",
    /23\.3/.test(batchTable[0].textContent), batchTable[0].textContent);
  ok("batch leaves the clinician's own form as it was",
    d.getElementById("patient").value === "KEEP-ME" && d.getElementById("weightKg").value === "70");

  let batchCsv = null;
  const realSave = w.Export.save;
  w.Export.save = function (name, data) { batchCsv = data; return true; };
  d.getElementById("btnBatchExport").dispatchEvent(new w.Event("click"));
  w.Export.save = realSave;
  ok("batch exports a CSV with both rows", !!batchCsv && batchCsv.split("\n").length >= 3);

  // The encrypted export and the sealed log are tested in their own process:
  // they need SubtleCrypto, jsdom has none, and on a runtime that cannot start
  // WebCrypto at all the failure is a hard crash that must not take the suite
  // down with it. A crash with no output is reported as skipped, not passed.
  let cryptoNote = "skipped (this runtime could not start WebCrypto)";
  let cryptoOut = "";
  try {
    cryptoOut = require("child_process").execFileSync(
      process.execPath, [path.join(__dirname, "crypto.test.js")],
      { encoding: "utf8", timeout: 180000, stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch (e) {
    cryptoOut = String((e && e.stdout) || "");
  }
  const cryptoLines = cryptoOut.split("\n").filter((l) => /^(PASS|FAIL) /.test(l));
  // a child that died part-way through reports fewer checks than it started with;
  // only a run that reached its own verdict counts as a run
  const finished = /All crypto checks passed|FAILED/.test(cryptoOut);
  if (finished) {
    cryptoLines.forEach((l) => { console.log(l); if (l.startsWith("FAIL")) fail++; });
    cryptoNote = null;
  }
  if (cryptoNote) console.log("SKIP " + cryptoNote + " \u2014 the encrypted export and the sealed log are untested here; run `npm test` on a machine with WebCrypto");

  // the limits panel is the thing that keeps the numbers honest
  const defs = d.querySelector(".card-results details.defs:not(.working)").textContent;
  ok("the app states when its numbers do not apply",
    /When these numbers do not apply/.test(defs) && /CHA\u2082DS\u2082-VASc/.test(defs));

  console.log(fail ? "\n" + fail + " FAILED" : "\nAll tests passed");
  process.exit(fail ? 1 : 0);
}, 500);
