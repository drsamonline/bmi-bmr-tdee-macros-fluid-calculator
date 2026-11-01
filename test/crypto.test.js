// Crypto checks, run in a child process.
//
// The encrypted export and the sealed log are the two things in this app that
// fail silently if they are wrong, so they are tested for real rather than
// reasoned about. They need SubtleCrypto, which jsdom does not implement; the
// checks below lend the page Node's WebCrypto and drive the app's own functions
// through `window.__chc`.
//
// They live in their own process for one reason: on a runtime where WebCrypto
// cannot start at all (some containers refuse the WASM that Node's crypto
// initialises), the failure is a hard process crash, and a crash here must not
// take the whole suite down with it. selftest.js treats a crash with no output
// as "skipped", and says so.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });

let fail = 0;
const ok = (name, cond) => { console.log((cond ? "PASS " : "FAIL ") + name); if (!cond) fail++; };

setTimeout(async () => {
  const keepAlive = setInterval(function () {}, 500);
  const w = dom.window;
  const d = w.document;

  try {
    const { webcrypto } = require("crypto");
    if (!w.crypto.subtle) {
      Object.defineProperty(w.crypto, "subtle", { value: webcrypto.subtle, configurable: true });
    }
    if (!w.crypto.getRandomValues) {
      w.crypto.getRandomValues = webcrypto.getRandomValues.bind(webcrypto);
    }
    if (typeof w.TextEncoder === "undefined") w.TextEncoder = TextEncoder;
    if (typeof w.TextDecoder === "undefined") w.TextDecoder = TextDecoder;

    ok("the page has SubtleCrypto to work with", w.__chc.hasCrypto());

    const sample = [
      { ts: 1700000000000, patient: "A-1", age: 40, gender: "M", heightCm: 175, weightKg: 70,
        waistCm: 84, bmi: 22.9, tdee: 2400, fluidMl: 2100 },
      { ts: 1700000600000, patient: "A-2", age: 51, gender: "F", heightCm: 158, weightKg: 74,
        waistCm: 96, bmi: 29.6, tdee: 2100, fluidMl: 2220 },
    ];
    w.__chc.setEntries(sample.slice());

    // ---- the sealed log
    await w.__chc.resealAll();
    const sealed = w.__chc.entries();
    ok("every entry carries a 64-hex digest", sealed.every((e) => typeof e.hash === "string" && e.hash.length === 64));
    ok("each entry links to the one before it", sealed[1].prevHash === sealed[0].hash);

    await w.__chc.verifyLog();
    ok("an untouched log verifies", /verified/.test(d.getElementById("toast").textContent),
      d.getElementById("toast").textContent);

    sealed[0].weightKg = 71;
    await w.__chc.verifyLog();
    ok("an edited record breaks the chain at that entry",
      /broken at entry 1/.test(d.getElementById("toast").textContent),
      d.getElementById("toast").textContent);

    // ---- the encrypted export
    const box = await w.__chc.encryptEntries("correct horse battery");
    ok("the container declares its format and parameters",
      box.format === "chc-encrypted-v1" && box.kdf.name === "PBKDF2" &&
      box.kdf.iterations === 150000 && box.cipher.name === "AES-GCM");
    ok("the patient name is not in the ciphertext", JSON.stringify(box).indexOf("A-1") === -1);
    ok("a fresh salt and IV are used for each export",
      (await w.__chc.encryptEntries("correct horse battery")).data !== box.data);

    const back = await w.__chc.decryptFile(box, "correct horse battery");
    ok("the right passphrase recovers every entry",
      back.entries.length === 2 && back.entries[0].patient === "A-1");

    let wrong = false;
    try { await w.__chc.decryptFile(box, "wrong passphrase"); } catch (e) { wrong = true; }
    ok("the wrong passphrase fails rather than returning rubbish", wrong);

    let damaged = false;
    try {
      const broken = JSON.parse(JSON.stringify(box));
      broken.data = broken.data.slice(0, -8) + "AAAAAAAA";
      await w.__chc.decryptFile(broken, "correct horse battery");
    } catch (e) { damaged = true; }
    ok("a damaged file fails its authentication tag", damaged);
  } catch (e) {
    console.log("FAIL the crypto checks threw: " + (e && e.message ? e.message : e));
    fail++;
  } finally {
    clearInterval(keepAlive);
  }

  console.log(fail ? "\n" + fail + " FAILED" : "\nAll crypto checks passed");
  process.exit(fail ? 1 : 0);
}, 600);
