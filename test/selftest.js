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

  console.log(fail ? "\n" + fail + " FAILED" : "\nAll tests passed");
  process.exit(fail ? 1 : 0);
}, 500);
