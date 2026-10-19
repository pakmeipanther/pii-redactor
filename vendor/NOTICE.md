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
