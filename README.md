<p align="center"><img src="docs/images/logo.svg" alt="PII Redactor logo: a shield around a document with one line blacked out" width="120"></p>

# PII Redactor <sup>v1.3.2</sup>

**Share documents. Not identities.**

A single-file, client-side tool that strips personal data and internal
infrastructure secrets out of text, Word documents, PowerPoint decks,
PDFs, and screenshots **before** that content is pasted into any AI
tool — so sensitive information never leaves your machine in the
first place.

**Who it is for.** Anyone who has to share a document without sharing who
is in it or how a system is built: a doctor or clinic preparing a case to
discuss, a lawyer sharing a matter, HR and finance teams, support staff and
SOC analysts pasting logs and screenshots into an AI assistant. The tool
removes what it finds and you confirm every result before download. It is
a helper, not a legal guarantee of anonymisation or compliance — see
[Known limitations](#known-limitations).

> Status (v1.3.2): one unified input (paste text, or drop/pick an
> image, PDF, Word, or PowerPoint file — the type is auto-detected,
> no need to pick the right box yourself), text redaction (regex +
> custom term list + entropy-based secret detection), image/screenshot
> OCR redaction, PDF redaction, Word (.docx) → redacted-PDF
> conversion, and PowerPoint (.pptx) → redacted-PDF conversion are all
> working, with a synthetic-data test suite and a demo GIF above.
> Since v1.2.1 it also reports the metadata a loaded file carries and
> re-scans every export before download (see
> [Architecture](#architecture)). Since v1.3.0 images get one editable
> list of regions (OCR hits, detected faces and hand-drawn areas), face
> detection with honest cover styles, and a "Delete all terms" button.
> Local NER was investigated and deferred for now — see
> [Known limitations](#known-limitations) for why. Looking for an
> earlier release instead? See [Versioning](#versioning) below.
> See [Roadmap](#roadmap) below.

> **Note on Word/PowerPoint:** this tool deliberately converts .docx
> and .pptx input into a **plain-text-only PDF** — never a redacted
> copy of the original file. That's a security choice, not a missing
> feature (see [Architecture](#architecture) for why), and it means
> layout, tables, and images in the original don't carry over. If you
> need the PDF pipeline's page-image output instead (which preserves
> layout), save your Word/PowerPoint file as a PDF yourself first,
> then drop that PDF in.

![Demo: dropping a fake staff badge into the image panel, OCR blacking out the email, phone and IP, detecting the face and covering it with a mosaic, confirming suspected secrets, drawing an extra area by hand, and reviewing the single list of regions](docs/images/demo.gif)

*(All data shown is synthetic/fake, invented for this recording —
never a real person, company, or secret.)*

**Full user guide (step-by-step, for non-technical users):**
[English](docs/guide.en.md) · [Tiếng Việt](docs/guide.vi.md) · [Deutsch](docs/guide.de.md) · [Français](docs/guide.fr.md)

## Why

AI assistants are extremely useful for analyzing logs, documents, and
screenshots — but copying raw company data into a third-party chat window
is a real risk: employee PII, internal hostnames, database connection
strings, and API keys can all end up stored somewhere outside your control.

This tool runs entirely in the browser with no backend and no outbound
network calls, so you can sanitize a document locally and only ever share
the cleaned version.

## How this compares to other tools

A number of browser extensions and web tools already offer "redact before
you paste into AI" functionality — e.g. Private Data Redactor, Velum Lite,
PromptShield, Rescriber, and PasteSecure for browsers; enterprise DLP
platforms like Nightfall AI or Shadow AI; and open-source detection
libraries like Microsoft Presidio. Most of them, though, only operate on
**plain text**. Enterprise DLP platforms cover more ground but route your
data through a vendor's own servers — the opposite of "nothing leaves your
machine." Open-source libraries like Presidio give you strong detection
primitives, but no ready-to-use interface; you still have to build the
app around them.

PII Redactor additionally redacts:

- **Screenshots** — real OCR (`tesseract.js`) finds the sensitive text,
  and the matched regions are overwritten as solid black pixels directly
  on an HTML `<canvas>`, not a transparent box layered on top.
- **PDFs** — each page is rendered to canvas, matched regions' actual
  pixels are overwritten, and the file is reassembled from scratch with
  `pdf-lib` — so there's no hidden text layer left to recover.
- **Word documents (.docx)** — the visible text is extracted, redacted,
  and rendered into a brand-new, simple PDF — built from scratch, never
  by editing the original file, so none of its hidden XML, styles, or
  metadata ever reach the output.
- **PowerPoint decks (.pptx)** — same approach as Word: the visible
  slide text is extracted (speaker notes are deliberately excluded —
  not visible slide content) and rendered into a brand-new PDF, never
  by editing the original file.

All of this runs **100% locally**, with no backend and no outbound network
calls at all (enforced at the browser level by the page's own
Content-Security-Policy) — a combination that's uncommon among free and
open-source tools in this space, where most alternatives either handle
text only, or need a server/cloud component to touch images and PDFs.

## Core guarantee

- **Single `.html` file, plus a `vendor/` folder for offline OCR** — no
  build step. Text redaction needs nothing but the browser; image/OCR/
  PDF/Word/PowerPoint redaction need the vendored files beside them
  (see
  [Running the image/OCR/PDF/Word/PowerPoint features](#running-the-imageocrpdfwordpowerpoint-features)).
- **No network calls** — enforced with a `Content-Security-Policy` meta
  tag. `connect-src` is scoped to `'self'` only (not a wildcard or a CDN
  domain) so the page can read the vendored OCR engine and language
  files sitting next to it, but it is blocked from reaching any other
  host — this is a CSP-level guarantee, not just a promise in this
  README.
- **Real redaction, not cosmetic masking** — the goal is removing the
  underlying data (not just drawing a black box on top of it), so nothing
  can be recovered by copy-pasting or extracting layers. See
  [Architecture](#architecture).
- **Human review before export** — automated detection (regex / NER) is
  never 100% accurate, so flagged content is always highlighted for the
  user to confirm before anything is downloaded.

## Architecture

**Detection — four sources, merged by priority, with two different
trust levels:**

1. **User-defined list** (highest priority, applied without
   re-confirmation) — company names, internal server names, project
   codenames that no model could ever guess on its own. The list can be exported and imported as .json and emptied with one button; that button first warns that the list will be removed from the browser's local storage and offers an export, and deletes only after an explicit choice.
2. **Regex** — structured patterns: emails, IPs, phone numbers, API
   keys/tokens, card numbers, and database connection strings (both URI
   form like `postgres://user:pass@host:port/dbname` and key-value form
   like `Server=...;Database=...;Password=...;` — covering both direct
   and pooler connections in one pattern).
3. **Entropy-based detection** (optional, off by default like every
   other rule — toggle it in "Data Types to Detect") — flags
   high-entropy strings (Shannon entropy over the string's character
   distribution) that look like random passwords, tokens, or API keys
   but don't match any fixed regex pattern. Sources 1 and 2 above are
   **certain matches** and get redacted immediately; an entropy hit is
   only ever a **suspect** — it's highlighted in yellow and NEVER
   blacked out / included in the output until a human explicitly
   confirms it (see each panel below for exactly how). This is a
   deliberate trust split: a regex match for "looks like an email" is
   essentially never wrong, but "this string's entropy is high" has a
   real false-positive rate (a random invoice number, a hash, a
   generated ID), so it gets a human in the loop instead of an
   automatic black box.
4. **Local NER model** (deferred — see
   [Known limitations](#known-limitations)) — would catch person and
   organization names that regex can't, by running a small pretrained
   transformer model (via `transformers.js`, WebAssembly/WebGPU) entirely
   in the browser.

**How an entropy suspect gets confirmed, per panel** (never automatic,
always a deliberate human action):

- **Text panel** — a suspect renders as a clickable amber `<mark>`;
  clicking it toggles it into a confirmed, masked state (and back).
- **Image panel** — same idea, but on a raster canvas there's no way
  to "undo" a pixel fill, so confirming/un-confirming a suspect redraws
  the whole image fresh from the untouched original and re-applies
  every certain match plus every *currently* confirmed suspect. A
  checklist below the image lists each suspect string so you can tick
  the ones that are really secrets.
- **PDF and Word/PowerPoint panels** — no per-page interactive
  checklist (redrawing a multi-page canvas on every tick is much more
  expensive than one image). A suspect instead gets a yellow outline
  stroked onto the page (PDF) or is simply left untouched in the
  output text (Word/PowerPoint, which build a fresh vector-text PDF
  with no canvas to outline) — in both cases the guidance is the
  same: if it's really a secret, add it to the custom term list above
  and re-scan, which redacts it through the already-trusted,
  no-re-confirmation path.

**Pipeline:** Input (text / image / PDF / Word / PowerPoint) →
Detection (4 sources above) → Review & confirm (certain matches
redacted outright; suspects highlighted and gated behind confirmation)
→ Real redaction (format-specific) → Export clean file.

**Image/screenshot redaction specifically:** the image is OCR'd locally
(see [Tech stack](#tech-stack)), each recognized word is run through the
same detection pipeline as the text panel, and any flagged word's
bounding box is filled with solid black pixels directly on an HTML
`<canvas>` — overwriting the original pixels, not layering a transparent
box on top. The exported PNG is the flattened canvas, so there is no
hidden layer to peel back. Known limitation: detection runs word-by-word,
so a value OCR splits across multiple words (e.g. a phone number with
spaces) may only be partially redacted — always review the result.

**PDF redaction specifically:** each page is rendered to a `<canvas>`
with pdf.js (this rasterizes any embedded images too, not just text).
Every text run pdf.js reports for that page is run through the same
detection pipeline, and any matched run's bounding box is filled with
solid black pixels directly on that canvas — the same "overwrite real
pixels" approach as the image panel. The redacted page canvases are then
reassembled into a brand new PDF with pdf-lib, one embedded PNG per
page. Because the output PDF is built from scratch out of flattened
images, none of the original text objects, fonts, or document metadata
are carried over into it — there is no hidden layer to peel back,
exactly like the image path. The trade-off: the exported PDF is no
longer selectable or searchable text, the same way a scanned document
isn't. An optional checkbox also runs OCR over each rendered page (the
same engine as the image panel) to catch sensitive data baked into an
image rather than the PDF's text layer — useful for scanned PDFs, off
by default since it's slower.

To catch a sensitive value that pdf.js splits across more than one text
run (e.g. at a font or color change), all of a page's text runs are
joined into one string before detection runs, and any run that
contributes a character to a match gets fully blacked out — stricter
than the image panel's word-by-word OCR matching, though it can still
miss a value split across runs with no space between them in the
original PDF.

**Word (.docx) → PDF redaction specifically:** a `.docx` file is itself
a ZIP archive of XML parts. The uploaded file is unzipped in-browser
with JSZip, and only the parts holding the document's *currently
visible* text are read (`word/document.xml`, plus any headers,
footers, footnotes, and endnotes that exist) — specifically only the
`<w:t>` run text inside them. Text deleted under Track Changes
(`<w:delText>`) and comments (`comments.xml`) are deliberately excluded,
since neither is currently-visible document content. The extracted
text is run through the exact same detection pipeline as every other
panel and redacted with the same localized mask labels, then rendered
into a brand-new, simple PDF built from scratch with `pdf-lib` plus an
embedded DejaVu Sans font (via `fontkit`, so Vietnamese/French/German
accented characters render correctly — the 14 standard PDF fonts
can't). Because the output PDF is built purely from the redacted
text, none of the original file's XML, styles, comments, tracked
changes, or metadata are ever copied over — unlike redacting a Word
file in place, there is no hidden layer to leave behind. The
trade-off: this feature only ever outputs a PDF (never a redacted
`.docx`), and that PDF does not preserve the original's layout,
tables, or images — see [Known limitations](#known-limitations).

**PowerPoint (.pptx) → PDF redaction specifically:** same approach as
Word, since `.pptx` is also a ZIP of XML parts. Only
`ppt/slides/slideN.xml` is read (in numeric slide order), and only the
`<a:t>` run text inside `<a:p>` paragraphs — PowerPoint's DrawingML
text model is flatter than Word's, so there's no header/footer/
footnote chasing needed. Speaker notes (`ppt/notesSlides/*`) are
deliberately never read at all — they aren't part of what's shown on
the slide, so whether or not they contain something sensitive, that
content simply never reaches the output PDF. The extracted text goes
through the identical `redactParagraphs` pipeline and
`buildSimplePdfFromText` renderer already used for Word — same
DejaVu Sans font, same "built from scratch, nothing from the original
file copied over" guarantee, same PDF-only output.

**Image matching and the thorough scan (v1.2.1):** custom terms are
matched on the OCR text without regard to accents (OCR often drops them:
"TOÀN" read as "TOAN") and, unless the case-sensitive box is ticked,
without regard to case. A multi-word term is also matched by the words'
geometry rather than only by OCR lines, so "an" ending one line and
"toàn" starting the next is caught even when the engine's own line
grouping merges unrelated text or puts stray noise words in between. The
"Thorough scan" option (on by default, slower) reads the image twice
more — enlarged 2×, once in darkest-channel grayscale and once inverted,
in sparse-text mode — to catch text the engine misses in the original
colours, such as white on orange or orange on grey. Boxes from those
passes are mapped back to the original image, a region is never filled
or counted twice, and the extra passes never add entropy suspects. In those extra passes a pattern-based match (phone or card number) must also look like real digits, because noise such as "1111110)" would otherwise blacken a bogus box. A collapsible box under the image shows what the OCR actually read and lists every blacked-out region with its reason, the pass that read it and the text it saw, so both a miss and an unexpected black box can be explained.

**Face detection (v1.3.0):** "Detect faces" runs a small pure-JavaScript
detector (pico.js, MIT, vendored in `vendor/pico/`, no WebAssembly, so it also works
in Safari Lockdown Mode) on a copy of the image. Each face becomes a region in the
same list as OCR hits and hand-drawn areas, so it can be switched off, undone and
reviewed like any other. The person chooses how faces are covered, and the labels
say what each option really does: **solid black** replaces the pixels (irreversible);
**large mosaic** leaves one average colour per block, about 5x5 blocks per face
(hard to reverse, not a guarantee); **blur** is cosmetic and can be partly
reversed, so it is never described as anonymisation. The detector only finds faces
looking roughly at the camera, which is why the review step and the drawing tool
stay. The detector files are pinned by sha256 in a test and documented, including
the licence history, in `vendor/NOTICE.md`.

**Regions and hand-drawn areas (v1.3.0):** everything the
image panel will cover is a region — a box in the original image's
pixels — in one list. The automatic detectors (OCR, rules, custom terms,
confirmed entropy suspects) add regions; the person adds more by
switching on "Draw a covered area" and dragging over anything the OCR
missed (a logo, handwriting, a QR code, a face). Any region, automatic
or drawn, can be switched off from the list, drawn ones can be removed,
and every change can be undone and redone (Ctrl/Cmd+Z). The exported
image is always rebuilt from the untouched original with every enabled
region filled solid black, so a drawn area deletes pixels exactly like
an automatic one; the rubber band and the highlights live on a separate
overlay canvas that is never part of the export. Drawing needs no OCR,
so it also works where WebAssembly is unavailable. The model
(rectangles, coordinate scaling, the undo/redo store, the painter) is
pure and tested without a browser; the pointer and list code is tested
against a small fake DOM.

**Metadata report and export verification (v1.2.1):** two checks wrap
every file, both built on one pure, DOM-free function,
`scanMetadata(bytes)`.

- *Before processing* — as soon as a file is loaded, the input report
  lists the metadata it carries, with the values: EXIF tags and the GPS
  position, XMP, IPTC, PNG text chunks and JPEG comments (images); the
  Info dictionary fields with formatted dates (PDF, read through
  `pdf.js`); the core and app properties, comments, custom properties
  and preview thumbnail (Word/PowerPoint, read through JSZip). A
  Show/Hide button masks the values (screen sharing, demos); they are
  only ever shown on the page and never leave the machine.
- *At download* — every export path (image, image → PDF, flattened PDF,
  Word/PowerPoint → PDF) goes through one function,
  `deliverVerifiedFile()`, which scans the exact bytes about to be
  handed to the browser. The download is **blocked** if anything
  identifying is found or the file cannot be verified at all (unknown
  format, encrypted PDF, compressed PDF object streams, internal error)
  — it fails closed. Technical-only items such as an ICC colour profile
  do not block. The verdict names the fields but never repeats their
  values.

The scanner reads JPEG segments, PNG chunks, WebP RIFF chunks and PDF
name tokens directly. Every read is bounds-checked and capped (IFD and
entry counts, value sizes), values are cut to 300 characters and
stripped of control characters, and all text that came out of a file is
rendered with `textContent`, never `innerHTML`. For PDFs it also matters
*how* the output is written: pdf-lib, left on its defaults, stamps its
own Producer and Creator strings and the current date into every new
document, and packs them into compressed object streams where a plain
byte scan cannot see them. `createCleanPdf()` (`updateMetadata: false`)
and `saveCleanPdf()` (`useObjectStreams: false`) remove the fields and
keep the output scannable; the test suite fails if any export path
bypasses them.

See the demo GIF near the top of this README for the full flow in
action (text → scan → custom term → multilingual UI).

## Tech stack

Vanilla JS/HTML only — no framework, to keep the single file auditable at
a glance.

- [pdf.js](https://mozilla.github.io/pdf.js/) (v6.4.299) — renders each
  PDF page to a canvas and extracts its text layer. **Vendored locally**
  under `/vendor/pdf` so it never makes a network request. See
  [NOTICE.md](vendor/NOTICE.md) for license details.
- [pdf-lib](https://pdf-lib.js.org/) (v1.17.1) — assembles the redacted
  page images into the output PDF. **Vendored locally** under
  `/vendor/pdf`. See [NOTICE.md](vendor/NOTICE.md).
- [@pdf-lib/fontkit](https://github.com/Hopding/fontkit) (v1.1.1) — lets
  pdf-lib embed a custom TrueType font, needed for the Word→PDF
  feature (see below). **Vendored locally** under `/vendor/pdf`. See
  [NOTICE.md](vendor/NOTICE.md).
- [DejaVu Sans](https://dejavu-fonts.github.io/) — the embedded font
  for generated PDFs; chosen for its full Vietnamese/French/German
  diacritic coverage, which the 14 standard PDF fonts lack. **Vendored
  locally** under `/vendor/fonts`. See [NOTICE.md](vendor/NOTICE.md).
- [JSZip](https://stuk.github.io/jszip/) (v3.10.1) — unzips an uploaded
  `.docx` or `.pptx` file (both are themselves ZIP archives of XML) so
  their visible text can be extracted and redacted. **Vendored
  locally** under `/vendor/jszip`. See [NOTICE.md](vendor/NOTICE.md).
- [tesseract.js](https://tesseract.projectnaptha.com/) — OCR for
  screenshots and (optionally) scanned PDF pages. **Vendored locally**
  under `/vendor/tesseract` and `/vendor/tessdata` (English, Vietnamese,
  French, German trained data) so OCR never makes a network request.
  See [NOTICE.md](vendor/NOTICE.md) for license details.
- [transformers.js](https://huggingface.co/docs/transformers.js) — would
  run a local NER model fully offline; evaluated but not integrated yet,
  see [Known limitations](#known-limitations)
- **No library for entropy detection** — Shannon entropy over a
  string's character distribution is plain arithmetic, implemented
  directly with no dependency.

## Usage

1. For text-only redaction: open `index.html` directly in any modern
   browser (Chrome, Firefox, Safari, Edge) — no install, no server.
2. For image/screenshot, PDF, Word, or PowerPoint redaction: see
   [Running the image/OCR/PDF/Word/PowerPoint features](#running-the-imageocrpdfwordpowerpoint-features)
   below — all of them need a local server due to a browser
   restriction on reading local files.
3. Paste text directly into the text box, or drop/pick a file — one
   image, PDF, Word (.docx), or PowerPoint (.pptx) file — on the single
   drop zone right below it. There's no need to sort the file into the
   right box yourself: the type is detected automatically (by the
   browser's own MIME sniffing first, falling back to the file
   extension, and finally the file's actual magic bytes if neither of
   those is trustworthy — so a mislabeled file still lands in the
   right pipeline), and the matching panel appears once it's known.
4. Review the highlighted matches (text), the blacked-out regions
   (image), or the redacted page previews (PDF) — always look before
   exporting, and explicitly confirm any yellow-highlighted entropy
   suspect you agree is actually sensitive (see
   [Architecture](#architecture)). For a Word or PowerPoint file, the
   output is a new PDF built from the redacted text (see
   [Known limitations](#known-limitations)) rather than a previewable
   page.
5. Download the cleaned file — images offer their original format
   (PNG/JPEG/WEBP) by default, with an optional "download as PDF"
   button alongside it.

The UI is available in **English, Français, Deutsch, and Tiếng Việt** —
switch languages from the selector in the top bar. For a full,
beginner-friendly walkthrough with screenshots-free step-by-step
instructions in each of those languages, see the full user guide:
[English](docs/guide.en.md) · [Tiếng Việt](docs/guide.vi.md) ·
[Deutsch](docs/guide.de.md) · [Français](docs/guide.fr.md).

## Running the image/OCR/PDF/Word/PowerPoint features

Opening `index.html` by double-clicking it uses the `file://` protocol,
under which browsers block a page from fetching other local files (the
OCR engine's `.wasm` core, the language data, the pdf.js/pdf-lib
modules, and — for the Word/PowerPoint→PDF features — the embedded
font and JSZip) for security reasons. The text-only redaction panel is
unaffected and works directly via `file://`. For the image, PDF,
Word, and PowerPoint panels:

```sh
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

This still runs 100% on your machine — `localhost` never leaves your
computer — it is only a workaround for the browser's local-file
restriction.

## Testing

`test/run-tests.mjs` is a small, dependency-free regression suite. It
doesn't duplicate the shipped logic into a second file — it extracts the
real code straight out of `index.html` (the detection pipeline:
`RULES`/`findMatches`/`findCustomMatches`/`findEntropyMatches`; the
Word/PowerPoint text extraction; the clean-PDF helpers; `scanMetadata`;
and the metadata report/verification logic and UI block) and runs it
as-is, so a test failure always means the shipped file actually changed
behavior. All fixtures are synthetic/fake data invented for the test,
never real secrets. Since v1.2.1 that includes metadata fixtures built
byte by byte (JPEG, PNG and WebP with EXIF/GPS, XMP, IPTC and text
chunks), a clean case for every dirty one, negative controls that prove
the scanner can see a leak, about 6,000 randomly corrupted files to
check the scanner never crashes, a tiny fake DOM to exercise the report
and the blocked-download path, i18n completeness checks for all four
languages, and static guards on the wiring (for example: every export
must go through `deliverVerifiedFile`). As of v1.3.2: 212 tests, all passing.

```sh
node test/run-tests.mjs
```

## Roadmap

- [x] Project scaffolding, CSP, GitHub repo
- [x] Text redaction MVP (regex: email, IP, phone, API keys, card numbers,
      database connection strings/ports)
- [x] 4-language UI (EN/FR/DE/VI)
- [x] User-defined custom list (UI + `localStorage` + JSON import/export)
- [x] Image/screenshot handling (offline OCR + true pixel overwrite)
- [x] PDF handling (flatten-to-image, with optional OCR fallback for
      scanned pages)
- [x] Word (.docx) input → extract, redact, and render as a simple PDF
      (no redacted-.docx output — by design, see
      [Known limitations](#known-limitations))
- [ ] Local NER integration — investigated and deferred, see
      [Known limitations](#known-limitations)
- [x] UI polish (default language for international readers, keyboard-
      accessible drop zones, GitHub link in the footer)
- [x] Test suite with synthetic data (see [Testing](#testing))
- [x] Demo GIF
- [x] Multi-language user guide (EN/VI/DE/FR) in [docs/](docs/)
- [x] **v1.1** PowerPoint (.pptx) input → extract, redact, and render
      as a simple PDF, mirroring the Word pipeline
- [x] **v1.1** Entropy-based detection (Shannon entropy) as an
      optional, confirm-before-redact "Data Types to Detect" category
      — catches high-entropy passwords/tokens/secrets that regex and
      the custom term list miss, across every panel
- [x] **v1.1** Image panel: export in the uploaded file's own format
      (PNG/JPEG/WEBP) by default, with an optional "download as PDF"
      button
- [x] **v1.1** Versioning — see [Versioning](#versioning)
- [x] **v1.2** Unified input — the five separate drop zones (text/
      image/PDF/Word/PowerPoint) are now one drop zone plus the text
      box; `detectFileType()` sorts the file by MIME type, extension,
      and (as the final, unspoofable check) its own magic bytes, then
      opens the matching result panel automatically
- [x] **v1.2.1** Metadata: every exported PDF is built without pdf-lib's
      default Producer/Creator/dates; a pure-JS `scanMetadata()` reads
      JPEG/PNG/WebP/PDF metadata; an input report lists what a loaded
      file carries (with values and a Show/Hide toggle); every export is
      re-scanned and the download is blocked if anything identifying
      remains (EN/FR/DE/VI)
- [x] **v1.3.0** Image regions: one editable list of regions
      (automatic + hand-drawn), a drawing tool with undo/redo, a region
      list with on/off switches and highlighting; works without OCR
- [x] **v1.3.0** "Delete all terms" for the custom list, with a
      warning and an export offer before anything is deleted
- [x] **v1.3.0** Face detection (pico.js, pure JavaScript) as
      regions in the same list, with three cover styles and honest labels
      about which ones are irreversible

## Versioning

This project uses tagged releases, and every tag stays downloadable on
GitHub forever — publishing a new version never removes an older one.
See [CHANGELOG.md](CHANGELOG.md) for exactly what changed in each one.

- **v1.0.0** — the first stable release: text (regex + custom list),
  image/screenshot OCR, PDF, and Word (.docx) redaction. Tag:
  [`v1.0.0`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.0.0).
- **v1.1.0** — adds PowerPoint (.pptx) support, entropy-based
  secret detection, and native-format image export with an optional
  PDF option. Tag:
  [`v1.1.0`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.1.0).
- **v1.2.0** — merges the five separate text/image/PDF/Word/
  PowerPoint drop zones into one unified input with automatic file-type
  detection; no change to the underlying detection/redaction pipelines.
  Tag:
  [`v1.2.0`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.2.0).
- **v1.2.1** — metadata report and export verification: shows the
  metadata a loaded file carries, builds every PDF without pdf-lib's default
  Producer/Creator/dates, and re-scans every export, blocking the download
  if anything identifying is left. Tag:
  [`v1.2.1`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.2.1).
- **v1.3.0** — image regions and faces: one editable list of
  regions (OCR, detected faces, hand-drawn areas) with undo/redo; face
  detection (pico.js, pure JavaScript) with solid / mosaic / blur cover
  styles labelled by how reversible they are; "Delete all terms" with a
  backup offer. Tag:
  [`v1.3.0`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.3.0).

- **v1.3.1** — a face for the project: new logo (inline SVG and
  data-URI favicon, no file is fetched), the tagline "Share documents. Not
  identities." and a new description line in all four languages. Tag:
  [`v1.3.1`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.3.1).

- **v1.3.2** (current) — presentation only, the program itself is unchanged:
  a social preview image (`docs/images/social-preview.png`, 1280×640, with an
  editable SVG source) and a demo GIF re-recorded with the new header and logo.
  Tag: [`v1.3.2`](https://github.com/pakmeipanther/pii-redactor/releases/tag/v1.3.2).

To use a specific version instead of the latest `main`, download the
`index.html` (plus the matching `vendor/` folder) from that tag's
"Source code" archive on the [Releases page](https://github.com/pakmeipanther/pii-redactor/releases),
or `git checkout v1.0.0` locally — a tagged version never changes
underneath you, even as `main` keeps moving forward.

## Known limitations

- Regex-based detection can both miss things (false negatives) and
  over-match (false positives) — always review highlighted matches before
  exporting. This is by design: the tool assists, it does not replace
  human judgment.
- **Local NER was evaluated and deferred, not implemented.** Several
  pretrained NER models with clean open-source licenses were checked
  (multilingual and English-only), and every one of them, even after
  int8 quantization for browser inference, came out at **100–280MB** —
  over GitHub's 100MB-per-file push limit. Most of that size is the
  model's vocabulary/embedding table (needed to support multiple
  languages or large vocabularies), which quantization alone doesn't
  shrink much. Shipping one as-is would mean adding Git LFS to the
  project for a single file, which didn't seem worth it for an early
  MVP. Until this is revisited (most likely with Git LFS, or a smaller
  task-specific model), names and organizations not caught by the
  custom term list or regex are **not** redacted — always review the
  highlighted matches before exporting.
- **Entropy-based detection is a statistical heuristic, not a
  classifier** — it flags *any* sufficiently random-looking string
  above a length/entropy threshold, so it will suspect things that
  aren't secrets (a hash, a generated invoice/order ID, a UUID) and
  can still miss a short or low-entropy "real" secret (e.g. a short,
  dictionary-word-based password). This is exactly why it's
  confirm-before-redact instead of auto-redact like regex/custom-list
  matches — see [Architecture](#architecture).
- Image OCR runs word-by-word, so a sensitive value split across
  multiple OCR words (e.g. a phone number with spaces) may only be
  partially blacked out.
- OCR accuracy depends on image quality and the selected OCR language
  matching the text in the image.
- Exported PDFs are flattened to images, so they lose selectable text
  and get noticeably larger than the original — a deliberate trade-off
  for a stronger "real redaction" guarantee (see
  [Architecture](#architecture)).
- A PDF value split across more than one pdf.js text run with no actual
  space between them in the original file may not be joined into a
  single match (the same class of limitation as image OCR, just at a
  different layer).
- The optional OCR pass on PDF pages (for scanned/image-only pages)
  noticeably slows down multi-page files — enable it only when the PDF
  doesn't have a real text layer.
- The IPv6 regex does not special-case `::` zero-compression, so a
  compressed address (e.g. `2001:db8::ff00:42:8329`) is only partially
  matched (the part after `::`) rather than the whole address. Found
  and pinned down by [test/run-tests.mjs](test/run-tests.mjs) — see
  that file's IPv6 test for the exact behavior.
- **Word (.docx) → PDF is text-only and does not preserve the
  original's layout, tables, or images** — the output is a simple,
  word-wrapped rendering of the redacted text, built for an AI tool to
  read, not a visual copy of the source document. This is intentional
  project scope, not a bug.
- **Word comments and text deleted under Track Changes are never
  included** in the extracted/redacted text — only the document's
  currently-visible content is read. If a sensitive value exists only
  inside a comment or a tracked deletion, it was never in the output
  to begin with (there's nothing to redact, since it's never shown).
- **There is no redacted-.docx output** — by explicit design, this
  feature only ever produces a PDF. Rebuilding a `.docx` in place
  risks the classic Word-redaction failure mode (hidden metadata,
  comments, or tracked changes surviving underneath); building a
  brand-new PDF from only the extracted, redacted text sidesteps that
  risk entirely. If you need to send the document to someone else,
  send the generated PDF.
- **PowerPoint (.pptx) → PDF has the same scope as Word → PDF**: text
  only, no original layout/images/charts/animations, PDF-only output,
  built from scratch. Additionally, **speaker notes are never read or
  included** — only the text actually shown on a slide is extracted,
  so if a secret exists only in a presenter's notes, it was never in
  the output to begin with (nothing to redact, since it's never
  shown to an audience).
- **PDF and Word/PowerPoint entropy suspects are flag-only, with no
  per-document interactive checklist** (unlike the text and image
  panels) — see [Architecture](#architecture) for exactly what each
  panel does instead. The confirmation path is always the same: add
  the string to the custom term list and re-scan.
- Testing has used synthetic/fake data only — never real company secrets.
- **(Fixed)** PDF redaction used to black out a matched text item's
  *entire* bounding box — which could mean a whole line — whenever a
  match touched any part of it. It now computes the matched value's own
  character range within the item and blacks out only that sub-range.
  Because pdf.js doesn't expose per-character positions, the sub-range
  is estimated by treating characters as evenly spaced across the
  item's width, so on a proportional (non-monospace) font the edges can
  be off by a few pixels — a small, padded margin of error, not the
  "redacts the whole line" bug this replaced. See
  [test/run-tests.mjs](test/run-tests.mjs)'s `textItemBBox` tests.
- **(Fixed)** Re-scanning a PDF a second time (e.g. after adding a
  custom term and clicking "Scan & black out PDF" again) could fail
  with "Cannot perform Construct on a detached ArrayBuffer". pdf.js
  transfers (not copies) the ArrayBuffer it's given to its worker
  thread, which detaches that buffer in this thread — the first scan
  was detaching the single cached `pdfOriginalBytes` buffer itself. It
  now slices a disposable copy for pdf.js on every scan, so the cached
  original survives any number of re-scans. See
  [test/run-tests.mjs](test/run-tests.mjs)'s re-scan tests.
- **(Fixed)** Even after the sub-range fix above, a redacted box could
  still leave one edge character peeking out (e.g. blacking out "16"
  inside "164" but leaving the "4" visible). The sub-range box's edges
  are an *estimate* (uniform character width), and the fixed 3px margin
  meant to absorb that estimate's error was too small whenever real
  character widths vary a lot on a proportional font (a narrow "1" next
  to a wider "6"/"4"). The horizontal margin is now a dedicated
  `redactionPadX()` that scales with the text item's own average
  character width (with a safe minimum), instead of a flat 3px. A
  full-item box, whose edges are exact rather than estimated, keeps the
  old small cosmetic padding. See
  [test/run-tests.mjs](test/run-tests.mjs)'s `redactionPadX` tests.
- **(Fixed)** A custom term typed in lowercase (e.g. `quangcao`) could
  fail to redact a mixed-case occurrence of it in an image or scanned
  PDF (e.g. a logo/brand rendering like "QuangCao"), even though
  matching is case-insensitive by default. The real cause: the OCR
  engine can segment one glued-together word into two separate word
  boxes (e.g. "Quang" + "Cao"), and each box was only ever checked on
  its own — neither fragment contains the full term. Detection now
  also rejoins each OCR line's words (gluing two words back together
  with no gap when the space between their boxes is small relative to
  their height, since that's almost always one word OCR cut in two)
  and checks that joined line text too, so a value split this way is
  still found. See [test/run-tests.mjs](test/run-tests.mjs)'s
  `wordsToRedact` tests.

- **Metadata scanning is byte-level and bounded, not a full parser.**
  XMP and IPTC values come from a forgiving extractor rather than a real
  XML/IIM parser, so an unusual packet may show fewer fields than it
  holds; PNG `zTXt` and compressed `iTXt` values are deflated and are
  reported by keyword only.
- **OCR can still miss text.** Stylised or very small type, strong
  gradients, textures and low-contrast text can defeat the engine even
  with the thorough scan, which raises coverage but is not a guarantee.
  It was checked against real Tesseract output for synthetic flyers (a
  phrase split across lines was missed before and found after; a heavily
  degraded copy needed the extra passes), not against every kind of
  real-world design. In replays of blurred, JPEG-compressed copies the most common miss was a short word such as "an" being dropped while the word after it was read, so a multi-word term was not matched. Always look at the result, and open "What the OCR read" under the image to see whether the engine read the text at all.
- **Image OCR needs WebAssembly.** Browsers or modes that switch it off
  — most commonly Safari with Apple's Lockdown Mode — cannot run the OCR
  engine. The image panel (and the PDF panel's optional OCR pass) then
  says so and refuses, instead of failing obscurely or quietly skipping
  OCR. Text redaction, the metadata report and Word/PowerPoint
  conversion are plain JavaScript and keep working. Use another browser
  (Firefox is not subject to Lockdown Mode) or exclude the site from
  Lockdown Mode in Safari — Apple's exclusion has been reported not to
  restore WebAssembly on some iOS versions, and excluding a site weakens
  the protection it was turned on for.
- **Hand-drawn areas are rectangles made with a pointer.** There is no
  freehand brush and no keyboard-only way to create one yet, and drawing
  is for images only (the PDF panel's flattened pages have no editor).
- **It cannot see inside pixels or page content.** Invisible watermarks,
  steganography and printer tracking dots are out of scope for the
  scanner (and for the tool).
- **Original PDFs are read through pdf.js, not the byte scanner**,
  because most carry compressed object streams that a byte scan cannot
  see into. The byte scanner is for the files the tool *produces*; it
  reports a compressed or encrypted PDF as "cannot be verified" and
  blocks it.
- **The export gate can block a download that is actually fine** if a
  browser's canvas encoder writes unexpected metadata or trailing bytes
  into an exported JPEG/PNG/WebP. That is the intended failure direction
  (fail closed); the red line names the field so it can be investigated.
  Chrome is the browser this was developed against; the image workflow was also verified in Firefox on macOS. Safari's exported-file output has not been checked.
- **Values appear on screen** in the input report (GPS positions, author
  names...). They stay on the machine, but use the Hide button before
  screen sharing or recording a demo.

## Security notes

- The `Content-Security-Policy` meta tag blocks outbound network requests
  at the browser level (`connect-src 'self'`, scoped to this page's own
  origin only — never a remote host), independent of what the
  JavaScript tries to do.
- `script-src` also includes `'wasm-unsafe-eval'`, which the browser
  requires before it will compile/run *any* WebAssembly module (the OCR
  engine is WASM). This keyword only permits compiling WASM bytecode —
  it grants no extra network or eval access, and does not loosen the
  `connect-src 'self'` guarantee above.
- All processing (regex matching, OCR) happens in-browser; nothing is
  uploaded anywhere. Local NER, if added later, would run fully
  in-browser too — see [Known limitations](#known-limitations) for why
  it isn't included yet.
- The custom keyword list is stored only in `localStorage` on the user's
  own machine.
- The OCR engine and language data, and the pdf.js/pdf-lib PDF
  libraries, are all vendored (bundled as files in this repo) rather
  than fetched from a CDN at runtime, so no outbound request is ever
  made to load them.
- The output PDF is assembled from scratch with pdf-lib rather than by
  editing the uploaded file in place, so no original PDF object,
  embedded font, or metadata field (e.g. author, producer, XMP data)
  is ever copied into the exported file. pdf-lib itself, left on its
  defaults, would add its own Producer/Creator strings and the current
  date; since v1.2.1 every export path disables that (see
  [Architecture](#architecture)) and every export is scanned again
  before download.
- Text that comes out of an uploaded file (metadata values, PNG text
  keywords...) is untrusted: the metadata report renders it with
  `textContent` only, never `innerHTML`, and the test suite enforces
  that.

## Author

**Nguyễn Tiến Trung** — tientrung.nguyen.de@gmail.com

Built with the help of Claude (Anthropic) as a coding assistant —
architecture decisions, detection-pipeline design, and the "real
redaction vs. cosmetic masking" requirement throughout the codebase
are mine; Claude helped write and review the implementation.

## License

[MIT](LICENSE) — this project's own code. Vendored third-party assets
under `vendor/` keep their own licenses (Apache-2.0 for tesseract.js/
pdf.js; MIT for pdf-lib, fontkit, and JSZip; a Bitstream Vera-derived,
redistribution-permissive license for DejaVu Sans) — see
[vendor/NOTICE.md](vendor/NOTICE.md).
