<div align="center">

# Clinical Health Calculator

**BMI · BMR · TDEE · Macros · Fluids · Body Composition**

A single-file, offline-capable clinical calculator for adult outpatients — no build step, no dependencies, no server, no tracking.

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-open_app-14b8a6
[![Download](https://img.shields.io/badge/DOWNLOAD-index.html-0f766e

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg
[![Release](https://img.shields.io/github/v/release/drsamonline/bmi-bmr-tdee-macros-fluid-calculator
[![Last commit](https://img.shields.io/github/last-commit/drsamonline/bmi-bmr-tdee-macros-fluid-calculator
[![GitHub stars](https://img.shields.io/github/stars/drsamonline/bmi-bmr-tdee-macros-fluid-calculator

[![Made with HTML5](https://img.shields.io/badge/HTML5-E34F26
[![CSS3](https://img.shields.io/badge/CSS3-1572B6
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E
[![No dependencies](https://img.shields.io/badge/dependencies-none-success
[![Offline ready](https://img.shields.io/badge/offline-ready-success
[![Single file](https://img.shields.io/badge/single--file-1%20HTML-important
[![i18n EN | HI | GU](https://img.shields.io/badge/i18n-EN%20%7C%20HI%20%7C%20GU-orange
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen

</div>

---

## Author

Developed by **Dr. Sohil Momin, BHMS** — Vadodara, Gujarat, India.

The original calculator, its clinical design and the choice of formulas are his work. This repository is the maintained, enhanced and minified release of that original code.

---

## What it computes

| Area | Outputs |
|------|---------|
| **Body composition** | BMI with category and gauge, body-fat % (Deurenberg), lean body mass, body surface area (Mosteller), ideal body weight (Devine), adjusted body weight, waist-to-height ratio, waist-to-hip ratio, ideal weight range and target weight |
| **Energy** | BMR (Mifflin–St Jeor), TDEE (activity multipliers), calorie targets (maintain / lose / gain) and projected weekly weight change |
| **Macros** | Protein, fat, carbohydrate and fiber; protein per meal; macro split (% of calories) |
| **Fluids** | Daily fluid requirement (30 mL/kg baseline, adjusted for climate, exercise, fever and breastfeeding), shown in mL / L / glasses |
| **Risk & flags** | Indian/Asia-Pacific **and** WHO BMI cut-offs; cautions for renal/hepatic disease, heart failure, athletes and paediatric patients |

## Features

- **Responsive layout** — a single mobile column on phones, and a two-column desktop view (inputs and saved entries on the left, a sticky results panel on the right) from 960 px up. Larger type and a three-across result grid on big screens.
- **Real-time** recalculation as you type.
- **Unit conversion that preserves values** — cm / m / ft+in and kg / lbs switch without losing what you entered.
- **Saved entries** in `localStorage`, each with an optional patient name/ID and a timestamp; delete with undo, filter, load back into the form, and a **BMI trend chart** across saved entries.
- **CSV export and import** (with formula-injection protection) and **print / PDF** output.
- **Copy / Share** a formatted text summary of the current result.
- **Trilingual UI** — English, हिन्दी and ગુજરાતી.
- **Light / dark theme**, respecting the system preference.
- **Accessible** — ARIA radiogroups, live result region, keyboard navigation, focus-visible states, hover definitions on every metric, a "What these mean" panel, and a print stylesheet.
- **Fully offline** — self-contained, no external requests; add to home screen on mobile.

## Usage

- **Online:** open the [live demo](https://drsamonline.github.io/bmi-bmr-tdee-macros-fluid-calculator/).
- **Offline:** download [`index.html`](https://raw.githubusercontent.com/drsamonline/bmi-bmr-tdee-macros-fluid-calculator/main/index.html) and open it in any modern browser.
- **On mobile:** open the file/link, then "Add to Home Screen".

## Repository contents

| File | Purpose |
|------|---------|
| `index.html` | Production build — the minified single-file app (this is what GitHub Pages serves). |
| `src/clinical-health-calculator.html` | The same app, un-minified and commented, for editing. |
| `LICENSE` | MIT licence. |

To rebuild after editing the source, minify `src/clinical-health-calculator.html` into `index.html` with any HTML minifier.

## Changelog

**v2.1.0**
- Responsive desktop/tablet layout (two-column, sticky results, three-across tiles).
- New tools: hip circumference and **waist-to-hip ratio**; **ideal weight range** and **target weight** with the change needed; **protein per meal**; **macro split %**.
- New info: hover definitions on every result, a "What these mean" panel.
- New: **BMI trend chart** across saved entries; **Copy** and **Share** summary buttons.
- Extended CSV export/import with the new fields.

**v2.0.0**
- Clinical additions: BMI category with Indian/WHO cut-offs, carbohydrates, IBW/adjusted BW/BSA/body-fat/lean mass, waist-to-height ratio, calorie targets with projected change, fluid adjustments, clinical caution flags, disclaimer, adult-only guard.
- Data: `localStorage`, patient ID and timestamps, delete/undo, filter, CSV import, print.
- Accessibility, trilingual UI, light/dark theme, minified single-file build.

## Formulas & references

- **BMR** — Mifflin MD, St Jeor ST, et al. *Am J Clin Nutr* 1990;51:241–7.
- **TDEE** — standard activity multipliers (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
- **BMI cut-offs** — WHO international and WHO Asia-Pacific / ICMR Indian cut-offs.
- **Protein & fiber** — IOM Dietary Reference Intakes; ACSM/NSCA protein range 0.8–2.0 g/kg.
- **Fluid** — 30 mL/kg/day adult baseline (EFSA / IOM general guidance).
- **Ideal body weight** — Devine BJ. *Drug Intell Clin Pharm* 1974. Adjusted BW = IBW + 0.25 × (actual − IBW).
- **BSA** — Mosteller RD. *N Engl J Med* 1987;317:1098.
- **Body fat** — Deurenberg P, et al. *Br J Nutr* 1991;65:105–14.
- **Waist** — IDF / WHO Asia-Pacific cut-offs (men >90 cm, women >80 cm); waist-to-hip >0.90 (men) / >0.85 (women).

## Disclaimer

This is a **decision-support aid only**. Results are population estimates, not a diagnosis, and do not replace clinical judgement. Use adjusted weights and clinical context for individual patients, and apply appropriate caution for renal, cardiac and paediatric cases.

## License

Released under the **MIT License** — see [LICENSE](LICENSE). © 2026 Dr. Sohil Momin.

<div align="center">

**[⬆ Back to top](#clinical-health-calculator)**

Made with care by [Dr. Sohil Momin](https://github.com/drsamonline)

</div>
