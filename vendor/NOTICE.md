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
