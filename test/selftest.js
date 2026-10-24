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

  console.log(fail ? "\n" + fail + " FAILED" : "\nAll tests passed");
  process.exit(fail ? 1 : 0);
}, 500);
