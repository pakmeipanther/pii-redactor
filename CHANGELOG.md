# Changelog

All notable changes to this project are documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses simple `MAJOR.MINOR.PATCH` tags (no strict semver
contract yet — see [README: Versioning](README.md#versioning)). Every
tagged version stays downloadable on GitHub forever; publishing a new
one never removes an older one.

## [Unreleased]

### Added

- **Face detection** ("Detect faces", image panel): finds faces with
  pico.js (MIT, pure JavaScript, no WebAssembly, works in Safari Lockdown
  Mode; vendored in `vendor/pico/`, loaded only from this folder).
  Faces are regions in the same list as OCR and hand-drawn areas
  (switch off, undo, highlight, export all shared). Cover style:
  solid black (irreversible), large mosaic (hard to reverse, not
  guaranteed) or blur (cosmetic, may be partly reversible); the
  interface says so. Only faces looking roughly at the camera are found.
  The vendored files are pinned by hash in a test; `vendor/NOTICE.md`
  records the licence history.

- **Hand-drawn regions** in the image panel. "Draw a covered area"
  switches on a drawing tool: drag (mouse, finger or pen) over anything
  the OCR missed, such as a logo, handwriting, a QR code or a face. Drawn
  areas are filled solid black like the automatic ones, kept inside the
  image, and ignored when they are only a click. Undo and redo (buttons,
  Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, Ctrl+Y), "remove my drawn areas", and
  Esc cancels a stroke in progress.
- A **region list** under the image: every area that will be covered,
  automatic and drawn, each with an on/off switch (so a false positive
  can be switched off) and a highlight on the image when hovered or
  focused; drawn areas can be removed.
- Drawing works **without OCR**, so an image can be redacted by hand where
  WebAssembly is unavailable (for example Safari in Lockdown Mode).
- Hand-drawn regions in the four languages and in the four user guides.
- **"Delete all terms"** for the custom term list. Clicking it opens a
  warning instead of deleting: the list will be removed from this
  browser's local storage and cannot be recovered, so export it as .json
  first. "Export list first" downloads the usual backup and then asks
  again; "Delete without exporting" is also available; Cancel and Esc
  close the warning. Only an explicit confirm deletes, and the button is
  off when the list is empty.

### Changed

- The image panel now works from **one list of regions** (a box in the
  original image's pixels). The export is always rebuilt from the
  untouched original with every enabled region filled solid black; the
  drawing preview and highlights live on a separate overlay canvas that
  is never part of an export.
- `redactWordsOnCanvas` is split into a pure `findWordRedactions` (what to
  cover) and a painter; the PDF panel's OCR pass behaves as before.

### Testing

- Test suite grown from 161 to 206 tests: face detection (box mapping, mosaic and blur on real pixels, painter, UI with a stub detector, honest labels, vendored-file hashes), the pure region model (geometry,
  the undo/redo store, the painter, the drawing tool), and the pointer,
  keyboard and region-list code run against a fake DOM.
  The delete-all flow is tested exhaustively: no sequence of actions
  deletes anything without a confirm from an open warning.

## [1.2.1] — 2026-10-28

### Added

- **Metadata report.** As soon as a file is loaded, a box lists the
  metadata it carries, with the values: EXIF tags and GPS position,
  XMP, IPTC, PNG text chunks and JPEG comments (images); Info
  dictionary fields with formatted dates (PDF, via `pdf.js`);
  core/app properties, comments, custom properties and preview
  thumbnail (Word/PowerPoint, via JSZip). A Show/Hide button masks the
  values; they are only ever displayed on the page.
- **Export verification.** Every export path (image, image → PDF,
  flattened PDF, Word/PowerPoint → PDF) now goes through
  `deliverVerifiedFile()`, which scans the exact bytes about to be
  downloaded. The download is blocked if anything identifying remains
  or the file cannot be verified (fail closed); a clean file shows a
  green "verified" line. The verdict names fields but never repeats
  their values. ICC colour profiles are reported but do not block.
- `scanMetadata(bytes)`: a pure-JS, DOM-free metadata scanner for JPEG,
  PNG, WebP and PDF, with stable finding codes, bounds-checked and
  capped parsing, and fail-closed handling of unknown formats,
  encrypted PDFs and compressed PDF object streams.
- **Thorough scan** for images (on by default): the image is read two
  more times, enlarged 2x, once in darkest-channel grayscale and once
  inverted, in sparse-text mode, to catch text the OCR engine misses in
  the original colours (white on orange, orange on grey). Boxes are
  mapped back to the original image; a failure in an extra pass never
  loses the first pass.
- A collapsible **"What the OCR read"** box under the image, to
  diagnose a missed term, and a hint when custom terms contain accents
  but the OCR language is English.
- UI strings for the report and the verification messages in English,
  Français, Deutsch and Tiếng Việt, plus a new "metadata check" step in
  the four user guides.

### Fixed

- **Exported PDFs carried pdf-lib's default metadata.** All three PDF
  export paths wrote pdf-lib's own `Producer` and `Creator` strings and
  the current date as `CreationDate`/`ModDate`. They now build documents
  with `updateMetadata: false` and save without object streams, so the
  output has no Info dictionary and stays byte-scannable. (The README
  previously said no metadata was written; that was only true of
  metadata copied from the original file.)
- **Image redaction let custom terms through.** Reported on a
  Vietnamese flyer where several "an toàn" occurrences stayed visible.
  Causes found and fixed: custom terms were matched with exact accents
  and case against OCR text (OCR often drops accents), now they match
  without regard to accents (and to case unless the case-sensitive box
  is ticked); a multi-word term split across a line break, or
  interrupted by stray OCR noise words, was never matched, now
  multi-word terms are also matched by the words' geometry; text the
  engine cannot read in the original colours is covered by the thorough
  scan above. A region found by more than one route is filled and
  counted once. Checked by replaying real Tesseract output for a
  synthetic flyer through the old and new code: the cross-line case was
  missed before and found after, and a heavily degraded copy needed the
  extra passes.
- **A stray black box in image redaction.** Noise read by an extra OCR pass could match a pattern rule (replaying real Tesseract output showed "1111110)", read from decoration, matching the phone rule). In the extra passes, phone and card-number matches must now contain at least four different digits; custom terms and the first pass are unaffected. The box under the image now also lists every blacked-out region with its reason, the OCR pass that read it and the text it saw, so any black box can be explained. Across 8 degradation levels of a synthetic flyer the bogus region appeared twice before the change and never after.
- **Safari in Lockdown Mode** (WebAssembly switched off) failed image OCR with `Can't find variable: WebAssembly`, shown under a misleading "run via a local server" message. The image panel now checks up front and explains that OCR needs WebAssembly and what to do (another browser, or excluding the site); the PDF panel refuses a requested OCR pass instead of silently skipping it.
- `doc.destroy is not a function` in the PDF metadata report: with the
  vendored pdf.js the loading task, not the document, is destroyed, and
  a cleanup failure can no longer replace the metadata that was read.
- The report title no longer says "found" when nothing was found.

### Security

- Text that comes out of an uploaded file is treated as untrusted and
  is rendered with `textContent` only; a test fails if `innerHTML` and
  similar APIs appear in the metadata UI.

### Testing

- Test suite grown from 58 to 161 tests: metadata fixtures built from
  synthetic bytes (clean and dirty variants), negative controls,
  random-corruption fuzzing, a fake-DOM harness for the report and the
  blocked-download path, i18n completeness checks, static wiring
  guards, and consistency checks for version labels and the four
  guides. Tests were also checked by deliberately breaking the code to
  confirm they fail.

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

[1.2.1]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.2.1
[1.2.0]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.2.0
[1.1.0]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.1.0
[1.0.0]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.0.0
