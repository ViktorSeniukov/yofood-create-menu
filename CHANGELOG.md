# CHANGELOG

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

_Nothing yet._

---

## [1.1.1] — 2026-05-04

### Added
- **Filename input before generate** — users can now set a custom name for the output `.xlsx` file. The field is pre-filled with `Meals for dd.mm-dd.mm` based on next week's Monday–Friday dates and falls back to the default if left empty.

---

## [1.1.0] — 2026-04-26

### Changed
- **Switched .doc conversion from ConvertAPI to CloudConvert** — the `convertapi-js` dependency has been removed; `.doc → .txt` conversion now uses the [CloudConvert](https://cloudconvert.com/) REST API (job-based flow with polling). The UI label and localStorage key have been updated accordingly.

---

## [1.0.1] — 2026-03-29

### Fixed
- **Tech sheet stale rows** — after merging, rows from the previous week's template no longer remain in the Tech sheet. The data range (columns F–L) is now cleared before inserting new menu data, consistent with how day sheets are handled.

---

## [1.0.0] — 2026-03-25

### Added
- **Google Sheets import** — users can now paste a Google Sheets URL instead of uploading an `.xlsx` template file. The app fetches the spreadsheet directly via Google's export API (no proxy, no API keys — sheet must be shared by link).
- **.doc file support** — users can upload `.doc` files in addition to `.txt` and `.docx`. Conversion is handled client-side via [ConvertAPI](https://www.convertapi.com/) using a user-provided key stored in localStorage.
- **ConvertAPI key management** — new settings panel in the header allows entering and saving the ConvertAPI key. Header indicator turns green only when both Claude and ConvertAPI keys are configured.
- **Progressive translation preview** — translated days appear in the preview panel one by one as each day completes, instead of waiting for the full menu to finish.
- **Abort on reset** — clicking "Reset" cancels all in-flight Claude API requests immediately via `AbortController`, no orphaned requests remain.
- **Inline day progress** — per-day progress indicators are shown inline with the "Переводим меню…" label during translation.
- **App version in header** — current version from `package.json` is displayed in the top-right of the header (injected at build time via Vite `define`).
- **Project documentation** — added `CLAUDE.md`, `VERSIONING.md`, `CODE_STYLE.md` references and versioning flow for contributors.

### Foundation (v0.0.1 → included in 1.0.0)
- Core menu translation flow: upload `.txt` / `.docx` menu → Claude API translates day-by-day → bilingual result merged into Excel template.
- Two-column layout: upload + settings on the left, live preview on the right.
- Excel merge via JSZip/XML for preserving cell styles, borders, and fills.
- Claude prompt tuned for stable bilingual dish and ingredient translation.
- CI/CD pipeline: ESLint, TypeScript type-check, Vitest tests, GitHub Pages deploy.
- First-week UX patches: file drag-and-drop, error handling, token limit increase, password field protection.
