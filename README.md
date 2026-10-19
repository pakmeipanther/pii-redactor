# PII Redactor

A single-file, client-side tool that strips personal data and internal
infrastructure secrets out of text, PDFs, and screenshots **before** that
content is pasted into any AI tool — so sensitive information never leaves
your machine in the first place.

> Status: early MVP. Text redaction via regex is working; PDF/image/NER
> support is in progress. See [Roadmap](#roadmap) below.

## Why

AI assistants are extremely useful for analyzing logs, documents, and
screenshots — but copying raw company data into a third-party chat window
is a real risk: employee PII, internal hostnames, database connection
strings, and API keys can all end up stored somewhere outside your control.

This tool runs entirely in the browser with no backend and no outbound
network calls, so you can sanitize a document locally and only ever share
the cleaned version.

## Core guarantee

- **Single `.html` file** — no install, no build step, no server.
- **No network calls** — enforced with a `Content-Security-Policy` meta
  tag (`connect-src 'none'`), not just a promise in this README.
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

*(Architecture diagrams generated during planning — add screenshots to
`docs/images/` and reference them here once committed.)*

## Tech stack

Vanilla JS/HTML only — no framework, to keep the single file auditable at
a glance. External libraries load from CDN at runtime (not bundled):

- [pdf.js](https://mozilla.github.io/pdf.js/) — read PDF content
- [pdf-lib](https://pdf-lib.js.org/) — strip/rewrite PDF content streams
  (or flatten to image for guaranteed non-recoverable text)
- [tesseract.js](https://tesseract.projectnaptha.com/) — OCR for
  screenshots
- [transformers.js](https://huggingface.co/docs/transformers.js) — local
  NER model, cached offline after first load

## Usage

1. Open `index.html` in any modern browser (Chrome, Firefox, Safari,
   Edge). No install needed.
2. Paste text (or upload an image/PDF, once that stage is implemented).
3. Review the highlighted matches.
4. Download the cleaned file.

The UI is available in **English, Français, Deutsch, and Tiếng Việt** —
switch languages from the selector in the top bar.

## Roadmap

- [x] Project scaffolding, CSP, GitHub repo
- [x] Text redaction MVP (regex: email, IP, phone, API keys, card numbers,
      database connection strings/ports)
- [x] 4-language UI (EN/FR/DE/VI)
- [ ] User-defined custom list (UI + `localStorage` + JSON import/export)
- [ ] Image/screenshot handling (OCR + true pixel overwrite)
- [ ] PDF handling (content-stream removal or flatten-to-image)
- [ ] Local NER integration
- [ ] Review UI polish, test suite with synthetic data, demo GIF

## Known limitations

- Regex-based detection can both miss things (false negatives) and
  over-match (false positives) — always review highlighted matches before
  exporting. This is by design: the tool assists, it does not replace
  human judgment.
- NER is not yet implemented; until it is, names not caught by regex or
  the custom list will not be redacted.
- Testing has used synthetic/fake data only — never real company secrets.

## Security notes

- The `Content-Security-Policy` meta tag blocks outbound network requests
  at the browser level (`connect-src 'none'`), independent of what the
  JavaScript tries to do.
- All processing (regex matching, OCR, NER inference) happens in-browser;
  nothing is uploaded anywhere.
- The custom keyword list (once implemented) is stored only in
  `localStorage` on the user's own machine.

## License

TBD — add a license (e.g. MIT) before making the repository public.
