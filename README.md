# PII Redactor

A single-file, client-side tool that strips personal data and internal
infrastructure secrets out of text, PDFs, and screenshots **before** that
content is pasted into any AI tool — so sensitive information never leaves
your machine in the first place.

> Status: early MVP. Text redaction (regex + custom term list),
> image/screenshot OCR redaction, and PDF redaction are working; local
> NER is in progress. See [Roadmap](#roadmap) below.

## Why

AI assistants are extremely useful for analyzing logs, documents, and
screenshots — but copying raw company data into a third-party chat window
is a real risk: employee PII, internal hostnames, database connection
strings, and API keys can all end up stored somewhere outside your control.

This tool runs entirely in the browser with no backend and no outbound
network calls, so you can sanitize a document locally and only ever share
the cleaned version.

## Core guarantee

- **Single `.html` file, plus a `vendor/` folder for offline OCR** — no
  build step. Text redaction needs nothing but the browser; image/OCR
  redaction needs the vendored files beside it (see
  [Running the image/OCR feature](#running-the-imageocr-feature)).
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

**Detection — three sources, merged by priority:**

1. **User-defined list** (highest priority, applied without re-confirmation)
   — company names, internal server names, project codenames that no
   model could ever guess on its own.
2. **Regex** — structured patterns: emails, IPs, phone numbers, API
   keys/tokens, card numbers, and database connection strings (both URI
   form like `postgres://user:pass@host:port/dbname` and key-value form
   like `Server=...;Database=...;Password=...;` — covering both direct
   and pooler connections in one pattern).
3. **Local NER model** (planned, via `transformers.js`, WebAssembly/WebGPU)
   — catches person and organization names that regex can't.

**Pipeline:** Input (text / image / PDF) → Detection (3 sources above) →
Review & confirm (flagged regions highlighted) → Real redaction (format-
specific) → Export clean file.

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

*(Architecture diagrams generated during planning — add screenshots to
`docs/images/` and reference them here once committed.)*

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
- [tesseract.js](https://tesseract.projectnaptha.com/) — OCR for
  screenshots and (optionally) scanned PDF pages. **Vendored locally**
  under `/vendor/tesseract` and `/vendor/tessdata` (English, Vietnamese,
  French, German trained data) so OCR never makes a network request.
  See [NOTICE.md](vendor/NOTICE.md) for license details.
- [transformers.js](https://huggingface.co/docs/transformers.js) — local
  NER model, cached offline after first load (planned)

## Usage

1. For text-only redaction: open `index.html` directly in any modern
   browser (Chrome, Firefox, Safari, Edge) — no install, no server.
2. For image/screenshot or PDF redaction: see
   [Running the image/OCR/PDF features](#running-the-imageocrpdf-features)
   below — both need a local server due to a browser restriction on
   reading local files.
3. Paste text, drop/paste an image, or drop a PDF file.
4. Review the highlighted matches (text), the blacked-out regions
   (image), or the redacted page previews (PDF) — always look before
   exporting.
5. Download the cleaned file.

The UI is available in **English, Français, Deutsch, and Tiếng Việt** —
switch languages from the selector in the top bar.

## Running the image/OCR/PDF features

Opening `index.html` by double-clicking it uses the `file://` protocol,
under which browsers block a page from fetching other local files (the
OCR engine's `.wasm` core, the language data, and the pdf.js/pdf-lib
modules) for security reasons. The text-only redaction panel is
unaffected and works directly via `file://`. For the image and PDF
panels:

```sh
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

This still runs 100% on your machine — `localhost` never leaves your
computer — it is only a workaround for the browser's local-file
restriction.

## Roadmap

- [x] Project scaffolding, CSP, GitHub repo
- [x] Text redaction MVP (regex: email, IP, phone, API keys, card numbers,
      database connection strings/ports)
- [x] 4-language UI (EN/FR/DE/VI)
- [x] User-defined custom list (UI + `localStorage` + JSON import/export)
- [x] Image/screenshot handling (offline OCR + true pixel overwrite)
- [x] PDF handling (flatten-to-image, with optional OCR fallback for
      scanned pages)
- [ ] Local NER integration
- [ ] Review UI polish, test suite with synthetic data, demo GIF

## Known limitations

- Regex-based detection can both miss things (false negatives) and
  over-match (false positives) — always review highlighted matches before
  exporting. This is by design: the tool assists, it does not replace
  human judgment.
- NER is not yet implemented; until it is, names not caught by regex or
  the custom list will not be redacted.
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
- Testing has used synthetic/fake data only — never real company secrets.

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
- All processing (regex matching, OCR, NER inference) happens in-browser;
  nothing is uploaded anywhere.
- The custom keyword list is stored only in `localStorage` on the user's
  own machine.
- The OCR engine and language data, and the pdf.js/pdf-lib PDF
  libraries, are all vendored (bundled as files in this repo) rather
  than fetched from a CDN at runtime, so no outbound request is ever
  made to load them.
- The output PDF is assembled from scratch with pdf-lib rather than by
  editing the uploaded file in place, so no original PDF object,
  embedded font, or metadata field (e.g. author, producer, XMP data)
  is ever copied into the exported file.

## License

TBD — add a license (e.g. MIT) before making the repository public.
