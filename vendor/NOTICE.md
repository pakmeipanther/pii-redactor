# Third-party notices

This `vendor/` folder bundles pre-built, redistributable assets from two
open-source projects so OCR can run fully offline, with zero outbound
network requests, as required by this project's security guarantee.

## tesseract.js / tesseract.js-core

- Project: https://github.com/naptha/tesseract.js
- License: Apache License 2.0
- Files: `tesseract/tesseract.min.js`, `tesseract/worker.min.js`,
  `tesseract/tesseract-core*.wasm.js`, `tesseract/tesseract-core*.wasm`
- Obtained from the official npm packages `tesseract.js` and
  `tesseract.js-core`, unmodified.

## Tesseract OCR trained data (fast models)

- Project: https://github.com/naptha/tessdata
- License: Apache License 2.0
- Files: `tessdata/eng.traineddata.gz`, `tessdata/vie.traineddata.gz`,
  `tessdata/fra.traineddata.gz`, `tessdata/deu.traineddata.gz`
- Obtained from the `4.0.0_fast` branch of the above repository,
  unmodified.

Full license text: https://www.apache.org/licenses/LICENSE-2.0

## pdf.js

- Project: https://github.com/mozilla/pdf.js
- License: Apache License 2.0
- Files: `pdf/pdf.min.mjs`, `pdf/pdf.worker.min.mjs`
- Obtained from the official npm package `pdfjs-dist` (v6.4.299),
  unmodified.

Full license text: https://www.apache.org/licenses/LICENSE-2.0

## pdf-lib

- Project: https://github.com/Hopding/pdf-lib
- License: MIT License
- Files: `pdf/pdf-lib.min.js`
- Obtained from the official npm package `pdf-lib` (v1.17.1), unmodified.

```
MIT License

Copyright (c) 2019 Andrew Dillon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## @pdf-lib/fontkit

- Project: https://github.com/Hopding/fontkit
- License: MIT License
- Files: `pdf/fontkit.umd.min.js`
- Obtained from the official npm package `@pdf-lib/fontkit` (v1.1.1),
  unmodified. Lets pdf-lib embed a custom TrueType font so generated PDFs
  can render Vietnamese, German, and French accented characters correctly
  (the 14 built-in PDF fonts can't).

## DejaVu Sans

- Project: https://dejavu-fonts.github.io/
- License: Bitstream Vera-derived license (free redistribution permitted)
- Files: `fonts/DejaVuSans.ttf`
- A single TrueType font with broad Unicode coverage, including the
  precomposed Vietnamese characters (Latin Extended Additional block)
  and German/French accented Latin letters. Unmodified.

## JSZip

- Project: https://github.com/Stuk/jszip
- License: MIT License (JSZip is dual MIT/GPLv3; this project uses it
  under the MIT license)
- Files: `jszip/jszip.min.js`
- Obtained from the official npm package `jszip` (v3.10.1), unmodified.
  Used to read the internal XML of an uploaded .docx file (a .docx is
  itself a zip archive) so its text can be redacted before conversion
  to PDF.

## pico.js and the `facefinder` cascade (face detection)

- Project: https://github.com/nenadmarkus/picojs (runtime) and
  https://github.com/nenadmarkus/pico (trained cascade)
- License: MIT License, Copyright (c) 2013 Nenad Markus
  (full text: `pico/LICENSE-pico.txt`, taken from the `master` branch of
  the `pico` repository; `pico.js` itself carries "released under the MIT
  license" in its first line)
- Files: `pico/pico.js` (5,589 bytes), `pico/facefinder` (239,632 bytes),
  `pico/LICENSE-pico.txt`; all unmodified.
  - `pico.js` sha256: `785b981cc79e5fa3f7557dc3fa7773629d7529994d7627de41b77d8687649309`
  - `facefinder` sha256: `d8014993e7298c7b1865d1f8b855d6dbf4ec5c808bf879e2091ab6837abf90cd`
- Licence history, stated openly: an early version of the `pico`
  repository (for example commit `c2e81f9`) carried a custom licence that
  forbade commercial and military use without permission. The current
  `master` branch is MIT. The `facefinder` file is byte-for-byte identical
  in both. This project uses the current MIT terms, is non-commercial
  open source, and cites the algorithm paper as the old licence asked:
  N. Markus, M. Frljak, I. S. Pandzic, J. Ahlberg, R. Forchheimer,
  "Object Detection with Pixel Intensity Comparisons Organized in
  Decision Trees", http://arxiv.org/abs/1305.4537
- Pure JavaScript: no WebAssembly, so it also works in Safari Lockdown
  Mode. It only finds faces that look roughly at the camera; hand-drawn
  regions cover the rest.
- A test (`test/run-tests.mjs`) compares both files with the hashes above,
  so a changed or replaced file turns the suite red.
