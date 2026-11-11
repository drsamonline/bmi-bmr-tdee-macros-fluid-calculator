# Clinical Health Calculator — user guide

**Version 2.7.0 · PolyForm Noncommercial 1.0.0 · one self-contained HTML file**

A single-file clinical calculator: BMI, BMR (Mifflin–St Jeor), TDEE, macros, fluids, body
composition, renal clearance, weight- and BSA-based dosing and a risk score — with Indian and WHO
BMI cut-offs, in English, हिन्दी and ગુજરાતી.

- Online: <https://drsamonline.github.io/bmi-bmr-tdee-macros-fluid-calculator/play/>
- Offline: download `index.html` and open it in any modern browser.
- On a phone: open it, then **Add to Home Screen** — the manifest and service worker make that an
  app rather than a bookmark.

## The reason to trust a number

Every result is printed with its formula and your own values substituted, in a **Show the working**
panel:

```
BMI   = 23.3      weight ÷ height² = 69 ÷ 1.72²
BMR   = 1600      10×wt + 6.25×ht − 5×age + 5 = 10×69 + 6.25×172 − 5×34 + 5
TDEE  = 2480      BMR × activity = 1600 × 1.55
CrCl  = 101.6     (140 − age) × wt ÷ (72 × Scr) = (140 − 34) × 69 ÷ (72 × 1.0)
```

A number you can check is worth more than a number you must trust.

## What it computes

| Area | Outputs |
|---|---|
| Body composition | BMI with category and gauge, body-fat % (Deurenberg), lean mass, BSA (Mosteller), ideal body weight (Devine), adjusted body weight, waist-to-height and waist-to-hip ratios, target weight |
| Energy | BMR (Mifflin–St Jeor), TDEE with activity multipliers, maintain/lose/gain targets, projected weekly change |
| Macros | protein, fat, carbohydrate, fibre; protein per meal; macro split as % of calories |
| Fluids | daily requirement from a 30 mL/kg baseline, adjusted for climate, exercise, fever and breastfeeding, in mL / L / glasses |
| Renal | creatinine clearance (Cockcroft–Gault) with its formula and limits |
| Dosing | weight-based (rate × weight) and BSA-based (rate × BSA), unit shown at every step |
| Risk | CHA₂DS₂-VASc for stroke risk in non-valvular atrial fibrillation, with its source and intended population |
| Flags | Indian/Asia-Pacific **and** WHO BMI cut-offs; cautions for renal or hepatic disease, heart failure, athletes and paediatric patients |

## For a returning patient

The results panel states the **difference from their previous saved entry** — weight, BMI, waist,
body fat — with the interval, matched on the patient name or ID. A BMI trend chart runs across saved
entries.

## Batch mode

Paste rows from a spreadsheet (patient, age, sex, height, weight, waist) and compute the whole list,
then export as CSV. Each row goes through the same form and the same functions as a single patient —
there is no second implementation to drift — and your own entries are left untouched.

## The data, and keeping it private

- Saved entries live in `localStorage`, each with an optional patient name/ID and a timestamp.
- **CSV export and import** carry formula-injection protection.
- **Encrypted export**: AES-256-GCM with a passphrase (PBKDF2-SHA-256, 150,000 iterations, fresh salt
  and IV), using the browser's own `crypto.subtle`. A CSV on a shared laptop is a plain list of
  patients; this is not.
- **A sealed log**: every saved entry carries the SHA-256 of the one before it, and **Verify log**
  names the first entry that no longer matches. It detects an edit — not an attacker who holds the
  whole file and rewrites it end to end.

## Printing

The print stylesheet produces a **clinical note**, not a print of the dashboard: patient, age, sex,
measurements, BMI and date in a header, results in three columns, the working underneath in small
type, and a signature line. The form is not printed; the record is.

## Keyboard

`Enter` advances through the form and saves at the end · `Alt+1…5` jump to age, height, weight, waist
and activity · `Ctrl/⌘+S` saves · `Ctrl/⌘+Enter` saves and clears.

## Limits worth stating

It is a calculator, not a diagnosis. The cut-offs are published ones (Indian/Asia-Pacific and WHO),
the formulas are named ones, and the cautions it raises are cautions — not findings. A result here
does not replace a clinical assessment.

## Licence

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).
