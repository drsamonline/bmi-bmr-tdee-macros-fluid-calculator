# Enhancements

Everything here keeps the app's three promises: **offline**, **no internet at
any point**, **no external dependency**. If an idea needs a library, it needs a
vendored file committed to this repository — otherwise it is not on this list.

Ordered by what a clinician would notice first, not by effort.

## Status

| # | Item | Status |
|---|------|--------|
| 1 | A real manifest and service worker | **shipped 2.6.0** |
| 2 | A printable clinical note | **shipped 2.6.0** |
| 3 | Visit-to-visit deltas | **shipped 2.6.0** |
| 8 | Rounding, stated | **shipped 2.6.0** |
| 9 | Fast OPD entry | **shipped 2.6.0** |
| 10 | Readable in the consulting room | **shipped 2.6.0** |
| 4 | Batch mode | **shipped 2.7.0** |
| 5 | Encrypted case export | **shipped 2.7.0** |
| 6 | Tamper-evident local log | **shipped 2.7.0** |
| 11 | Offline help and the limits | **shipped 2.7.0** (limits panel; the FAQ panel is still English-only) |
| 12 | Verify what you downloaded | **shipped** — `SHA256SUMS.txt` per release |
| 13 | A hand-carry bundle | **shipped** — `-web.zip` per release |
| 14 | Release notes that say what changed | **shipped** — generated from this changelog |
| 7 | Paediatric growth references | **not shipped — see below** |

Items 12–14 are done in this repository (`.github/workflows/release-extras.yml`)
rather than in the shared `app-builder` kit, so no other app's build is touched.

### 7. Paediatric growth references — why it is still open

A paediatric mode needs the WHO 0–5 and 5–19 LMS tables committed as a local
data file, with z-scores computed in the app: no network, no dependency, but
real reference data that has to be transcribed and checked. Guessing it, or
generating it, would put wrong centiles in front of a child. It needs the
tables sourced from WHO, a written review of the transcription, and its own
release. The app's adult-only guard stays until then.

## 1. Make "Add to Home Screen" real

The app carries `apple-mobile-web-app-capable` but no manifest, so a phone gets
a bookmark rather than an installed app. Add `docs/play/manifest.webmanifest`
with `start_url`, `display: standalone`, `theme_color` and the icons that now
exist (`icon-192.png`, `icon-512.png`, plus a maskable variant), and a
`sw.js` that serves **the HTML network-first** (cache only as the offline
fallback), keeps assets cache-first with a background refresh, **bumps its
cache name on every release**, and prints a build stamp in the footer so
"am I on the new one?" is answerable from the page itself.

*Cost: one manifest, one worker, one footer line. Highest value on this list.*

## 2. A printable clinical note, not a print of the dashboard

Printing today lays out the app. A clinician wants an A4 sheet: patient ID and
date, the measured values, the results table, the working underneath in small
type, the cut-offs applied, and a signature line. One dedicated print
stylesheet, no second renderer.

*Cost: CSS only. It is the artefact that leaves the room.*

## 3. Visit-to-visit deltas

Saved entries already carry timestamps and feed a BMI trend chart. Add, next to
each result, the change since the previous entry for the same patient ID —
weight, BMI, waist, body fat — with the direction and the interval ("−1.8 kg in
6 weeks"). Offline, from `localStorage` alone.

*Cost: small. Turns a calculator into a follow-up tool.*

## 4. Batch mode for a camp or an OPD

Paste a CSV of patients (age, sex, height, weight, waist), compute the whole
set, and export a results CSV. No server, no upload — the file never leaves the
device. The export path and the formula-injection guard already exist.

*Cost: a second view over the same functions. Fits the screening-camp use.*

## 5. Encrypted case export

CSV export is plain text on disk. Offer an encrypted export: AES-256-GCM with a
passphrase, via `crypto.subtle`, which is in the browser already — no library.
Same pattern as `app-encrypted-case-log` in this estate.

*Cost: one module, no dependency. Worth it the moment a laptop is shared.*

## 6. Tamper-evident local log

An append-only JSON log of saved entries where each record carries the hash of
the one before it. Nothing leaves the device; the point is that a record cannot
be quietly edited afterwards. Verifiable with the same `crypto.subtle` digest.

*Cost: small. Matters if entries are ever used as a record of care.*

## 7. Paediatric growth references

The app is adult-only by design and guards against children. A proper paediatric
mode would need WHO 0–5 and 5–19 LMS tables — a few hundred kilobytes of numbers
committed as a local data file, with z-scores computed in the app. No network,
no dependency, but real work and real clinical review.

*Cost: high, and it must not be rushed. Treat as its own release.*

## 8. Significant figures and rounding, stated

A printed `23.3` should say whether it is 23.25 rounded or 23.34 truncated, and
the working panel should round the same way. Add the rounding rule to the
working line for every metric.

*Cost: small; it removes a class of "your app and my calculator disagree".*

## 9. Fast OPD entry

Keyboard-first flow: Enter advances to the next field, Alt+1…9 jumps to a
section, Esc clears the current field, and the sticky action bar stops covering
the last result on a laptop screen. Touch targets to at least 44 px on phones.

*Cost: small, and it is what a busy desk actually feels.*

## 10. Readable in the consulting room

A text-size control (three steps), a high-contrast toggle, and `lang` attributes
that follow the language switch so a screen reader pronounces Hindi and Gujarati
correctly. The app already sets `data-i18n` keys, so this is mostly plumbing.

*Cost: small. Accessibility is a clinical requirement, not a nicety.*

## 11. Offline help and a pocket formula card

Bundle the FAQ, each formula's derivation and its limits as an in-app panel in
all three languages, plus a one-page printable card of the equations and
cut-offs. Everything is already written in the README — it needs to be in the
app, where the clinician is.

*Cost: writing, not engineering.*

## 12. Verify what you downloaded

Publish `SHA256SUMS.txt` beside the `.exe`, `.apk` and Linux binary in every
release, and print the same hashes on the landing page's download section. A
clinician installing a sideloaded APK should be able to check it without
network tooling.

*Cost: three lines in the release job.*

## 13. A hand-carry bundle

Besides the three binaries, attach a `bmi-bmr-tdee-macros-fluid-calculator-web.zip`
containing `index.html`, `LICENSE` and a one-page README. It is the build that
works from a USB stick on a machine with no installer rights, which is most
clinic machines.

*Cost: one zip step in the pipeline.*

## 14. Release notes that say what changed

The rolling release rewrites its notes to a single line about the commit SHA.
Generate a short, human note from the changelog section for the version being
built, and keep the asset table with its platform icons.

*Cost: small. The release page is the only place a user looks before
downloading.*

## Not on this list, deliberately

- **Cloud sync, accounts, telemetry** — they break the first promise.
- **A CDN font, icon set or chart library** — an offline app that fetches its
  own interface is not offline.
- **AI interpretation of results** — it would turn a transparent calculator
  into an opaque opinion, which is the opposite of "show the working".
