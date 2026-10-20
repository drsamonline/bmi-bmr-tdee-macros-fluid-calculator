# Clinical Health Calculator

**BMI · BMR · TDEE · Macros · Fluids · Body Composition** — a single-file, offline-capable clinical calculator for adult outpatients.

One self-contained HTML file. No build step, no dependencies, no server, no tracking. Open it and it works — including offline.

**Live demo:** https://drsamonline.github.io/bmi-bmr-tdee-macros-fluid-calculator/

---

## Author

Developed by **Dr. Sohil Momin, BHMS** — Vadodara, Gujarat, India.

The original calculator, its clinical design and the choice of formulas are his work. This repository is the maintained, enhanced and minified release of that original code.

---

## What it computes

| Area | Outputs |
|------|---------|
| **Body composition** | BMI with category, body-fat % (Deurenberg), lean body mass, body surface area (Mosteller), ideal body weight (Devine), adjusted body weight, waist-to-height ratio |
| **Energy** | BMR (Mifflin–St Jeor), TDEE (activity multipliers), calorie targets (maintain / lose / gain) and projected weekly weight change |
| **Macros** | Protein, fat, carbohydrate and fiber |
| **Fluids** | Daily fluid requirement (30 mL/kg baseline, adjusted for climate, exercise, fever and breastfeeding), shown in mL / L / glasses |
| **Risk & flags** | Indian/Asia-Pacific **and** WHO BMI cut-offs; cautions for renal/hepatic disease, heart failure, athletes and paediatric patients |

## Features

- **Real-time** recalculation as you type.
- **Unit conversion that preserves values** — cm / m / ft+in and kg / lbs switch without losing what you entered.
- **Saved entries** in `localStorage`, each with an optional patient name/ID and a timestamp; delete with undo, filter, and load an entry back into the form.
- **CSV export and import** (with formula-injection protection) and **print / PDF** output.
- **Trilingual UI** — English, हिन्दी and ગુજરાતી.
- **Light / dark theme**, respecting the system preference.
- **Accessible** — ARIA radiogroups, live result region, keyboard navigation, focus-visible states, print stylesheet.
- **Fully offline** — self-contained, no external requests; add to home screen on mobile.

## Usage

- **Online:** open the live demo link above.
- **Offline:** download `index.html` and open it in any modern browser.
- **On mobile:** open the file/link, then "Add to Home Screen".

## Repository contents

| File | Purpose |
|------|---------|
| `index.html` | Production build — the minified single-file app (this is what GitHub Pages serves). |
| `src/clinical-health-calculator.html` | The same app, un-minified and commented, for editing. |
| `LICENSE` | MIT licence. |

To rebuild after editing the source, minify `src/clinical-health-calculator.html` into `index.html` with any HTML minifier.

## Formulas & references

- **BMR** — Mifflin MD, St Jeor ST, et al. *Am J Clin Nutr* 1990;51:241–7.
- **TDEE** — standard activity multipliers (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
- **BMI cut-offs** — WHO international and WHO Asia-Pacific / ICMR Indian cut-offs.
- **Protein & fiber** — IOM Dietary Reference Intakes; ACSM/NSCA protein range 0.8–2.0 g/kg.
- **Fluid** — 30 mL/kg/day adult baseline (EFSA / IOM general guidance).
- **Ideal body weight** — Devine BJ. *Drug Intell Clin Pharm* 1974. Adjusted BW = IBW + 0.25 × (actual − IBW).
- **BSA** — Mosteller RD. *N Engl J Med* 1987;317:1098.
- **Body fat** — Deurenberg P, et al. *Br J Nutr* 1991;65:105–14.
- **Waist** — IDF / WHO Asia-Pacific cut-offs (men >90 cm, women >80 cm).

## Disclaimer

This is a **decision-support aid only**. Results are population estimates, not a diagnosis, and do not replace clinical judgement. Use adjusted weights and clinical context for individual patients, and apply appropriate caution for renal, cardiac and paediatric cases.

## License

Released under the **MIT License** — see [LICENSE](LICENSE). © 2026 Dr. Sohil Momin.
