# PII Redactor

A single-file, client-side tool that strips personal data and internal
infrastructure secrets out of text, PDFs, and screenshots **before** that
content is pasted into any AI tool — so sensitive information never leaves
your machine in the first place.

> Status: text redaction (regex + custom term list), image/screenshot
> OCR redaction, and PDF redaction are working, with a synthetic-data
> test suite and a demo GIF above. Local NER was investigated and
> deferred for now — see [Known limitations](#known-limitations) for
> why. See [Roadmap](#roadmap) below.

![Demo: pasting text with fake PII, scanning, adding a custom internal term, and switching the UI to German](docs/images/demo.gif)

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

All of this runs **100% locally**, with no backend and no outbound network
calls at all (enforced at the browser level by the page's own
Content-Security-Policy) — a combination that's uncommon among free and
open-source tools in this space, where most alternatives either handle
text only, or need a server/cloud component to touch images and PDFs.

## Core guarantee

- **Single `.html` file, plus a `vendor/` folder for offline OCR** — no
  build step. Text redaction needs nothing but the browser; image/OCR/
  PDF redaction need the vendored files beside them (see
  [Running the image/OCR/PDF features](#running-the-imageocrpdf-features)).
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
3. **Local NER model** (deferred — see
   [Known limitations](#known-limitations)) — would catch person and
   organization names that regex can't, by running a small pretrained
   transformer model (via `transformers.js`, WebAssembly/WebGPU) entirely
   in the browser.

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
- [tesseract.js](https://tesseract.projectnaptha.com/) — OCR for
  screenshots and (optionally) scanned PDF pages. **Vendored locally**
  under `/vendor/tesseract` and `/vendor/tessdata` (English, Vietnamese,
  French, German trained data) so OCR never makes a network request.
  See [NOTICE.md](vendor/NOTICE.md) for license details.
- [transformers.js](https://huggingface.co/docs/transformers.js) — would
  run a local NER model fully offline; evaluated but not integrated yet,
  see [Known limitations](#known-limitations)

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
switch languages from the selector in the top bar. For a full,
beginner-friendly walkthrough with screenshots-free step-by-step
instructions in each of those languages, see the
[full user guide](#pii-redactor) linked at the top of this README.

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

## Testing

`test/run-tests.mjs` is a small, dependency-free regression suite for
the detection pipeline (the regex rules, the custom-term list, and how
they merge by priority). It doesn't duplicate that logic into a second
file — it extracts the real `RULES`/`findMatches`/`findCustomMatches`
code straight out of `index.html` and runs it as-is, so a test failure
always means the shipped file actually changed behavior. All fixtures
are synthetic/fake data invented for the test, never real secrets.

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
- [ ] Local NER integration — investigated and deferred, see
      [Known limitations](#known-limitations)
- [x] UI polish (default language for international readers, keyboard-
      accessible drop zones, GitHub link in the footer)
- [x] Test suite with synthetic data (see [Testing](#testing))
- [x] Demo GIF
- [x] Multi-language user guide (EN/VI/DE/FR) in [docs/](docs/)

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
  is ever copied into the exported file.

## License

[MIT](LICENSE) — this project's own code. Vendored third-party assets
under `vendor/` keep their own licenses (Apache-2.0 for tesseract.js/
pdf.js, MIT for pdf-lib) — see [vendor/NOTICE.md](vendor/NOTICE.md).
