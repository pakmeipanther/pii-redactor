# Changelog

All notable changes to this project are documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses simple `MAJOR.MINOR.PATCH` tags (no strict semver
contract yet — see [README: Versioning](README.md#versioning)). Every
tagged version stays downloadable on GitHub forever; publishing a new
one never removes an older one.

## [1.2.0] — 2026-10-23

### Added

- **Unified file input.** The five separate drop zones (text / image /
  PDF / Word / PowerPoint), each requiring the person to already know
  what kind of file they were holding, are now one drop zone beside
  the text box. A new `detectFileType()` router sorts the dropped or
  picked file in three passes of decreasing trust — MIME type, then
  file extension, then (as the final, unspoofable tie-breaker) the
  file's own magic bytes, including reading a ZIP's internal entry
  names to tell `.docx` apart from `.pptx` — and reveals the matching
  result panel automatically. None of the underlying detection or
  redaction logic changed; this only touches how a file gets routed
  to the pipeline it already had.
- **README:** a new note near the top states explicitly that Word/
  PowerPoint input is deliberately converted to a plain-text-only PDF
  for data-security reasons, and that a Word/PowerPoint file saved as
  a PDF first can go through the full PDF pipeline instead — this was
  previously only documented in depth further down, in Architecture.

### Notes

- 57/57 tests passing (`test/run-tests.mjs`), unchanged from v1.1.0 —
  this release doesn't touch the detection/redaction pipeline the test
  suite covers, only the surrounding UI.

## [1.1.0] — 2026-10-23

### Added

- **PowerPoint (.pptx) support**, mirroring the existing Word (.docx)
  pipeline: extract visible slide text (`ppt/slides/slideN.xml`,
  `<a:p>`/`<a:t>` runs, in numeric slide order), run it through the
  shared detection/redaction pipeline, and render it into a brand-new
  PDF with the same `buildSimplePdfFromText` renderer Word already
  uses. Speaker notes are deliberately never read.
- **Entropy-based secret detection** (Shannon entropy over a string's
  character distribution), as a new, optional "Data Types to Detect"
  category — catches high-entropy passwords/tokens/API keys that
  regex and the custom term list miss. Unlike every other detection
  source, an entropy hit is only ever a **suspect**: it is highlighted
  in yellow and is never auto-redacted or included in any exported
  output until a human explicitly confirms it.
  - Text panel: suspects render as clickable amber marks; clicking
    toggles confirmed/unconfirmed.
  - Image panel: a checklist below the canvas lists each suspect;
    ticking one redraws the image from the untouched original with
    that suspect (and only that one) now really redacted.
  - PDF panel: a suspect gets a yellow outline stroked onto the
    rendered page — visible in the exported PDF, pixels underneath
    untouched.
  - Word/PowerPoint panels: flag-only (a count + guidance message),
    since the output is freshly-drawn vector text with no canvas to
    outline. Confirming a suspect anywhere always goes through the
    same path: add it to the custom term list and re-scan.
- **Image panel: native-format export by default.** The "download
  processed image" button now re-encodes to the *uploaded* file's own
  format (PNG/JPEG/WEBP) instead of always forcing PNG, falling back
  to PNG only for formats a browser canvas can't re-encode to (gif,
  bmp, svg, ...).
- **Image panel: optional PDF export.** A second button wraps the
  same already-redacted canvas into a one-page PDF.
- **Versioning.** This file, a version tag in the UI's top bar, and a
  tagged `v1.0.0` release marking the pre-v1.1 state so it stays
  downloadable going forward (see [README: Versioning](README.md#versioning)).
- **Author credit** in the app footer and this README.

### Notes

- Local NER integration remains deliberately deferred — see
  [README: Known limitations](README.md#known-limitations). It's
  still planned as a future, intentionally small/lightweight addition,
  not abandoned.
- 57/57 tests passing (`test/run-tests.mjs`), up from 38 at v1.0.0 —
  new coverage for entropy detection, `redactParagraphs`'s
  suspect-counting behavior, and PowerPoint text extraction.

## [1.0.0] — 2026-10-22

First stable release.

### Added

- Text redaction: regex rules (email, IP, phone, API keys/tokens,
  card numbers, database connection strings) merged with a
  user-defined custom term list (highest priority, `localStorage`,
  JSON import/export).
- Image/screenshot redaction: fully offline OCR (`tesseract.js`),
  matched regions overwritten as real black pixels on an HTML
  `<canvas>` — not a transparent overlay.
- PDF redaction: each page rendered to canvas via `pdf.js`, matched
  text runs' bounding boxes overwritten with real black pixels, pages
  reassembled from scratch into a new PDF with `pdf-lib` (no hidden
  text layer survives). Optional OCR fallback pass for scanned pages.
- Word (.docx) → redacted-PDF conversion: visible text extracted via
  JSZip + XML parsing (comments and Track-Changes deletions excluded
  on purpose), redacted, and rendered into a brand-new PDF with an
  embedded DejaVu Sans font (via `fontkit`) for full Vietnamese/
  French/German diacritic support.
- 4-language UI (English, Français, Deutsch, Tiếng Việt).
- Hard CSP (`connect-src 'self'`) blocking all outbound network
  requests at the browser level.
- Synthetic-data regression test suite (`test/run-tests.mjs`),
  extracting and running the real shipped detection code rather than
  a duplicated copy.
- Multi-language user guide and demo GIF.

[1.2.0]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.2.0
[1.1.0]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.1.0
[1.0.0]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.0.0
