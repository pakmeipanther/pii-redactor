#!/usr/bin/env node
/**
 * Synthetic-data regression tests for the detection pipeline.
 *
 * This does NOT re-implement or copy the detection logic into a second
 * file that could drift out of sync — it extracts the real `RULES`
 * array and `findMatches()` / `findCustomMatches()` functions directly
 * out of ../index.html (the single file that actually ships) and runs
 * them exactly as written. A failure here always means the shipped
 * code itself changed behavior, never that a test-only copy went stale.
 *
 * No npm dependencies, no build step — matches the project's own
 * "vanilla JS, nothing to install" approach. Run with:
 *
 *     node test/run-tests.mjs
 *
 * All text below is synthetic/fake data invented for testing. Nothing
 * in this file is a real secret, real person, or real server.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = readFileSync(htmlPath, 'utf8');

// Pulls the source text strictly between two exact marker strings. Used
// instead of a generic brace-counter because the three pieces we need
// (RULES, findCustomMatches, findMatches) are plain top-level
// declarations in index.html with stable text immediately after them —
// if a future edit renames something, this throws a clear error rather
// than silently extracting the wrong code.
function extractBetween(markerStart, markerEnd, label) {
  const startIdx = html.indexOf(markerStart);
  if (startIdx === -1) {
    throw new Error(`Could not find the start of "${label}" in index.html (looked for: ${JSON.stringify(markerStart)}). Did it get renamed or reformatted?`);
  }
  const endIdx = html.indexOf(markerEnd, startIdx);
  if (endIdx === -1) {
    throw new Error(`Could not find the end of "${label}" in index.html (looked for: ${JSON.stringify(markerEnd)}).`);
  }
  return html.slice(startIdx, endIdx);
}

const rulesCode = extractBetween(
  'const RULES = [',
  '\nconst ruleListEl',
  'RULES'
);
const findCustomMatchesCode = extractBetween(
  'function findCustomMatches(text, terms, caseSensitive) {',
  '\nfunction findMatches(',
  'findCustomMatches'
);
const findMatchesCode = extractBetween(
  'function findMatches(text, activeRules, terms, caseSensitive) {',
  '\nconst ENTROPY_MIN_LENGTH',
  'findMatches'
);
const entropyCode = extractBetween(
  'const ENTROPY_MIN_LENGTH = 12;',
  '\nlet lastScanText',
  'shannonEntropy + classifyAlphabet + findEntropyMatches'
);
const textItemBBoxAndPadCode = extractBetween(
  'function textItemBBox(viewport, item, fracStart = 0, fracEnd = 1) {',
  '\n\n// Renders one page',
  'textItemBBox + redactionPadX'
);
const wordsToRedactCode = extractBetween(
  'function wordsToRedact(lineWords, activeRules, terms, caseSensitive, entropyEnabled, trust) {',
  '\n\n// Creates a Tesseract worker',
  'wordsToRedact'
);
const docxPureFunctionsCode = extractBetween(
  'function decodeXmlText(raw) {',
  '\n\n// Pulls visible text from every relevant part inside the .docx zip',
  'decodeXmlText + extractDocxParagraphs + redactParagraphs'
);
// extractPptxParagraphs sits sandwiched between the two zip-dependent
// (not Node-testable without a real JSZip instance) async functions
// extractDocxVisibleText and extractPptxVisibleText — pulled out on its
// own, same "pure string function only" rule as docxPureFunctionsCode
// above skipping extractDocxVisibleText.
const pptxPureFunctionsCode = extractBetween(
  "// PowerPoint's DrawingML text model is simpler than Word's",
  '\n\n// Slide parts are named slide1.xml',
  'extractPptxParagraphs'
);

const ocrSupportCode = extractBetween('// OCR_SUPPORT_START', '// OCR_SUPPORT_END', 'OCR_SUPPORT');
const regionModelCode = extractBetween('// REGION_MODEL_START', '// REGION_MODEL_END', 'REGION_MODEL');
const redactWordsOnCanvasCode = extractBetween(
  'function findWordRedactions(',
  '\n\n// REGIONS_UI_START',
  'redactWordsOnCanvas'
);

const combined = `${rulesCode}\n${findCustomMatchesCode}\n${findMatchesCode}\n${entropyCode}\n${textItemBBoxAndPadCode}\n${ocrSupportCode}\n${wordsToRedactCode}\n${regionModelCode}\n${redactWordsOnCanvasCode}\n${docxPureFunctionsCode}\n${pptxPureFunctionsCode}\nreturn { RULES, findCustomMatches, findMatches, shannonEntropy, classifyAlphabet, findEntropyMatches, textItemBBox, redactionPadX, wordsToRedact, decodeXmlText, extractDocxParagraphs, redactParagraphs, extractPptxParagraphs, foldForMatch, foldedCustomSpans, findPhraseWordMatches, wordsAreConsecutive, ocrGrayPixels, planOcrPasses, scaleWords, ocrLangMismatch, boxOverlapFraction, redactWordsOnCanvas, wasmAvailable, isWasmError, plausibleRuleMatch, formatRegions, findWordRedactions, normalizeRect, clampRect, rectIsUsable, clientToImagePoint, regionKey, createRegionStore, combineRegions, boxesToPaint, paintRedactionBoxes, createDrawingTool, paintSuspectOutlines, regionToolbarState };`;
const { RULES, findMatches, shannonEntropy, classifyAlphabet, findEntropyMatches, textItemBBox, redactionPadX, wordsToRedact, decodeXmlText, extractDocxParagraphs, redactParagraphs, extractPptxParagraphs, foldForMatch, foldedCustomSpans, findPhraseWordMatches, wordsAreConsecutive, ocrGrayPixels, planOcrPasses, scaleWords, ocrLangMismatch, boxOverlapFraction, redactWordsOnCanvas, wasmAvailable, isWasmError, plausibleRuleMatch, formatRegions, findWordRedactions, normalizeRect, clampRect, rectIsUsable, clientToImagePoint, regionKey, createRegionStore, combineRegions, boxesToPaint, paintRedactionBoxes, createDrawingTool, paintSuspectOutlines, regionToolbarState } = new Function(combined)();

const allRuleIds = RULES.map(r => r.id);
function activeRules(ids) {
  return RULES.filter(r => ids.includes(r.id));
}

// --- minimal test harness (no dependencies) --------------------------
let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
  }
}

function assertMatchCount(name, text, expectedCount, ruleIds = allRuleIds, terms = [], caseSensitive = false) {
  check(name, () => {
    const matches = findMatches(text, activeRules(ruleIds), terms, caseSensitive);
    if (matches.length !== expectedCount) {
      const got = matches.map(m => `${m.ruleId}:"${text.slice(m.start, m.end)}"`).join(', ');
      throw new Error(`expected ${expectedCount} match(es), got ${matches.length} [${got}]`);
    }
  });
}

// --- regex rules: one straightforward case per rule, synthetic data --

assertMatchCount('email: basic address', 'Contact me at jane.doe@example.com for details.', 1);
assertMatchCount('email: two addresses in one string', 'a@example.com and b@test.org', 2);

assertMatchCount('ipv4: basic address', 'Server reachable at 203.0.113.42 on the LAN.', 1);

check('ipv6: known limitation — "::" zero-compression is only partially matched', () => {
  // Confirmed by running the real extracted regex against this fixture:
  // the rule's pattern does not special-case "::", so on a compressed
  // address it only matches the hex groups after the "::", not the
  // whole address. This test exists to document and lock in that known
  // gap (see README > Known limitations) rather than to hide it — if a
  // future change to the ipv6 rule fixes this, this test should start
  // failing and get updated on purpose, not silently keep "passing".
  const text = 'Address: 2001:db8::ff00:42:8329 is internal.';
  const matches = findMatches(text, activeRules(['ipv6']), [], false);
  if (matches.length !== 1) throw new Error(`expected 1 partial match, got ${matches.length}`);
  const got = text.slice(matches[0].start, matches[0].end);
  if (got !== 'ff00:42:8329') {
    throw new Error(`expected the known partial match "ff00:42:8329", got "${got}" — behavior changed, update this test and the README note together`);
  }
});

assertMatchCount('phone: international format with separators', 'Call +49 221 1234567 anytime.', 1);

assertMatchCount('apikey: 32-character token', 'token=sk_live_4f8c9a2b7e1d3f6a9c0b2e4d7f1a3c5e', 1);

assertMatchCount('creditcard: 16 digits grouped with spaces', 'Card: 4111 1111 1111 1111 expires 12/29.', 1);

assertMatchCount(
  'dburi: postgres connection string (host/port/db in one match)',
  'DATABASE_URL=postgres://admin:s3cret@db.example.internal:5432/appdb',
  1
);
assertMatchCount(
  'dbkv: ADO.NET/ODBC-style connection string',
  'Server=sql01.internal;Database=Orders;User ID=svc_app;Password=Tr0ub4dor&3;',
  1
);
assertMatchCount('dbport: standalone known database port', 'tunnel forwarded to localhost:27017 for debugging', 1);

assertMatchCount('plain sentence: no false positive', 'The quarterly report is due next Friday.', 0);

assertMatchCount(
  'disabling a rule actually stops it from matching',
  'Reach me at test@example.com please.',
  0,
  allRuleIds.filter(id => id !== 'email')
);

// --- custom term list: priority and case-sensitivity behavior --------

check('custom term: matched even with no regex rule active', () => {
  const matches = findMatches('internal codename Project Phoenix is confidential', [], ['Project Phoenix'], false);
  if (matches.length !== 1 || matches[0].ruleId !== 'custom') {
    throw new Error(`expected exactly 1 custom match, got ${JSON.stringify(matches)}`);
  }
});

check('custom term: wins priority over an overlapping regex match at the same position', () => {
  // The custom term and the active email rule both match the same
  // span; findMatches() must prefer the custom match (priority 0 beats
  // the regex's priority 1) per its own sort/merge logic.
  const text = 'leak@acme-internal.example is a planted internal alias';
  const matches = findMatches(text, activeRules(['email']), ['leak@acme-internal.example'], false);
  if (matches.length !== 1 || matches[0].ruleId !== 'custom') {
    throw new Error(`expected the custom term to win over the overlapping email match, got ${JSON.stringify(matches)}`);
  }
});

check('custom term: case-insensitive by default', () => {
  const matches = findMatches('Server SRV-DB-PROD-02 rebooted', [], ['srv-db-prod-02'], false);
  if (matches.length !== 1) throw new Error(`expected 1 match, got ${matches.length}`);
});

check('custom term: case-sensitive mode respects case exactly', () => {
  const matches = findMatches('Server SRV-DB-PROD-02 rebooted', [], ['srv-db-prod-02'], true);
  if (matches.length !== 0) throw new Error(`expected 0 matches in case-sensitive mode (different case), got ${matches.length}`);
});

// --- PDF redaction: textItemBBox must redact only the matched
// sub-range of a text item, not the item's entire width -------------

// A minimal fake viewport: page-space coordinates pass through
// unchanged, same as a scale=1, unrotated pdf.js viewport would for a
// plain axis-aligned transform.
const identityViewport = { convertToViewportPoint: (x, y) => [x, y] };

check('textItemBBox: full range (0..1) matches the item\'s whole width', () => {
  const item = { transform: [12, 0, 0, 12, 100, 500], width: 120, height: 12 };
  const box = textItemBBox(identityViewport, item, 0, 1);
  if (box.x0 !== 100 || box.x1 !== 220) {
    throw new Error(`expected x0=100, x1=220 for the full item, got x0=${box.x0}, x1=${box.x1}`);
  }
});

check('textItemBBox: a sub-range redacts a narrower box than the full item, not the whole line', () => {
  // Regression test for the bug where ANY match touching a pdf.js text
  // item blacked out that item's entire bounding box — so a line like
  // "Email: leaked@example.com end" got fully redacted just because the
  // email address inside it matched. The fix: pass the match's own
  // character range (as a 0..1 fraction of the item's string length) so
  // only that sub-range gets boxed.
  const str = 'Email: leaked@example.com end';
  const needle = 'leaked@example.com';
  const charStart = str.indexOf(needle);
  const charEnd = charStart + needle.length;
  const item = { transform: [12, 0, 0, 12, 100, 500], width: 12 * str.length, height: 12 };

  const fullBox = textItemBBox(identityViewport, item, 0, 1);
  const matchBox = textItemBBox(identityViewport, item, charStart / str.length, charEnd / str.length);
  const fullWidth = fullBox.x1 - fullBox.x0;
  const matchWidth = matchBox.x1 - matchBox.x0;

  if (matchBox.x0 <= fullBox.x0) {
    throw new Error(`expected the match box to start after the item's own start (leaving "Email: " unredacted), got x0=${matchBox.x0} vs item x0=${fullBox.x0}`);
  }
  if (matchBox.x1 >= fullBox.x1) {
    throw new Error(`expected the match box to end before the item's own end (leaving " end" unredacted), got x1=${matchBox.x1} vs item x1=${fullBox.x1}`);
  }
  if (matchWidth >= fullWidth) {
    throw new Error(`expected the redacted sub-box (${matchWidth}) to be narrower than the whole line's box (${fullWidth}) — this is the exact bug: a partial match blacking out the entire line`);
  }
});

// --- PDF redaction: a sub-range box's horizontal padding must be
// generous enough to survive real per-character width variance, not
// a tiny fixed amount ----------------------------------------------

check('redactionPadX: a sub-range gets a full average-character-width of padding, not a tiny fixed amount', () => {
  // Regression test for the follow-up bug: once the whole-line-redacted
  // bug above was fixed, a sub-range box's *edges* were still only an
  // estimate (textItemBBox assumes every character is the same width).
  // On real text this estimate can be off by much more than a couple
  // of pixels — e.g. a narrow "1" next to wider digits like "6" or "4"
  // made the box for a match like "164" end before the last "4" was
  // fully covered, leaving it visibly exposed. The old fixed 3px pad
  // was nowhere near enough slack to absorb that; the fix scales the
  // padding with the item's own average character width instead.
  const typicalAvgCharWidthPx = 9; // a normal body-text font at normal zoom
  const subRangePad = redactionPadX(typicalAvgCharWidthPx, true);
  const oldFixedPad = 3;
  if (subRangePad <= oldFixedPad) {
    throw new Error(`expected a sub-range's padding (${subRangePad}px) to be noticeably more generous than the old fixed ${oldFixedPad}px pad it replaced`);
  }
  if (subRangePad < typicalAvgCharWidthPx) {
    throw new Error(`expected the padding to be at least one full average character width (${typicalAvgCharWidthPx}px), got ${subRangePad}px — not enough slack to absorb a narrow-vs-wide character like "1" vs "6"`);
  }
});

check('redactionPadX: a full-item box keeps the old small cosmetic padding (its edges are exact, not estimated)', () => {
  // When the match covers the item's entire width, textItemBBox used
  // the item's real total width directly — there's nothing to
  // estimate, so no extra slack is needed beyond a small cosmetic pad.
  const pad = redactionPadX(/* avgCharWidthPx */ 9, /* isSubRange */ false);
  if (pad !== 2) {
    throw new Error(`expected a full-item box to keep the old 2px cosmetic pad, got ${pad}px`);
  }
});

check('redactionPadX: even a tiny-font item still gets a safe minimum pad, never near-zero', () => {
  const pad = redactionPadX(/* avgCharWidthPx */ 0.4, /* isSubRange */ true);
  if (pad < 4) {
    throw new Error(`expected a sensible floor (>=4px) even when the estimated average character width is tiny, got ${pad}px`);
  }
});

// --- PDF re-scan: the cached upload bytes must survive being handed
// to pdf.js more than once (e.g. scan, add a custom term, scan again) -

// pdf.js hands the `data` option to its worker via postMessage with a
// *transfer* list (a zero-copy optimization), which detaches the
// ArrayBuffer backing it in this thread — any later attempt to build a
// view over that same buffer throws "Cannot perform Construct on a
// detached ArrayBuffer". structuredClone's own transfer option uses
// the exact same detachment mechanism as postMessage, so it reproduces
// pdf.js's real effect on a buffer without needing an actual worker.
function simulateWorkerTransfer(buf) {
  return structuredClone(buf, { transfer: [buf] });
}

check('PDF re-scan bug, reproduced: handing the master buffer itself to the "worker" breaks the next scan', () => {
  // This is the ORIGINAL bug: `getDocument({ data: new Uint8Array(pdfOriginalBytes) })`
  // let pdf.js's worker transfer (detach) `pdfOriginalBytes` itself —
  // so clicking "Scan & black out PDF" a second time threw exactly
  // this error when it tried to build a fresh Uint8Array over it.
  const pdfOriginalBytes = new ArrayBuffer(8);
  simulateWorkerTransfer(pdfOriginalBytes); // what the first scan did to it
  let threw = null;
  try {
    new Uint8Array(pdfOriginalBytes); // what the second scan then tried
  } catch (e) {
    threw = e;
  }
  if (!threw || !/detached ArrayBuffer/.test(threw.message)) {
    throw new Error(`expected the second scan to throw "...detached ArrayBuffer...", got ${threw ? threw.message : 'no error'}`);
  }
});

check('PDF re-scan, fixed: slicing a disposable copy keeps the master buffer scannable any number of times', () => {
  // This is the FIXED call-site pattern: `new Uint8Array(pdfOriginalBytes.slice(0))`.
  // Only the disposable slice ever gets handed to the "worker" and
  // transferred away — the master buffer itself is never touched, so
  // it can be sliced again for every subsequent scan.
  const pdfOriginalBytes = new ArrayBuffer(8);
  new Uint8Array(pdfOriginalBytes).set([1, 2, 3, 4, 5, 6, 7, 8]);

  function scanOnce() {
    const view = new Uint8Array(pdfOriginalBytes.slice(0));
    const sizeSeenByThisScan = view.length; // read BEFORE the transfer — detaching a
    // buffer doesn't throw on an existing view's already-read .length, it just
    // zeroes it out going forward, so this must be captured first.
    simulateWorkerTransfer(view.buffer); // only the copy gets transferred away
    return sizeSeenByThisScan;
  }

  const firstScan = scanOnce();
  const secondScan = scanOnce(); // the exact "scan again after adding a custom term" case
  if (firstScan !== 8 || secondScan !== 8) {
    throw new Error(`expected both scans to see all 8 bytes, got ${firstScan} then ${secondScan}`);
  }
  if (pdfOriginalBytes.byteLength !== 8) {
    throw new Error(`expected the master buffer to stay intact (byteLength 8) after two scans, got ${pdfOriginalBytes.byteLength} — it got detached`);
  }
});

// --- OCR redaction: a value the OCR engine splits across two word
// boxes must still be caught by rejoining the line, not just checked
// word-by-word -------------------------------------------------------

// Builds a fake tesseract.js "word" with a bounding box. x0/x1 are the
// only coordinates wordsToRedact actually looks at (plus y0/y1 for the
// height estimate), so y0/y1 are fixed at a plausible line height.
function fakeWord(text, x0, x1, y0 = 100, y1 = 130) {
  return { text, bbox: { x0, y0, x1, y1 } };
}

// wordsToRedact's 5th argument (entropyEnabled) and its {flagged, suspects}
// return shape are exercised separately further below — these four tests
// predate entropy and only care about certain (custom/regex) matches, so
// they pass entropyEnabled=false and read .flagged.

check('wordsToRedact: a custom term the OCR engine split into two word boxes is still caught', () => {
  // Reproduces the reported bug: typing the custom term "quangcao" (all
  // lowercase) correctly redacts an image where OCR reads the text as
  // one word ("QuangCao"), but a real-world OCR pass can instead
  // segment a mixed-case run like this into two separate word boxes —
  // "Quang" and "Cao" — with almost no gap between them (it's the same
  // glued-together word, not two words). Checking each word on its own
  // (the old behavior) never finds "quangcao" in either fragment.
  const line = [fakeWord('Quang', 100, 150), fakeWord('Cao', 151, 190)]; // 1px gap: clearly the same word
  const { flagged } = wordsToRedact(line, [], ['quangcao'], false, false);
  if (flagged.size !== 2) {
    throw new Error(`expected both OCR word fragments to be flagged, got indices [${[...flagged].join(',')}] (size ${flagged.size})`);
  }
});

check('wordsToRedact: an ordinary single-word match still works (no regression)', () => {
  const line = [fakeWord('Invoice', 20, 120), fakeWord('QuangCao', 130, 260), fakeWord('total', 270, 340)];
  const { flagged } = wordsToRedact(line, [], ['quangcao'], false, false);
  if (flagged.size !== 1 || !flagged.has(1)) {
    throw new Error(`expected only index 1 ("QuangCao") flagged, got [${[...flagged].join(',')}]`);
  }
});

check('wordsToRedact: two genuinely separate words are not wrongly glued together', () => {
  // A normal inter-word gap (wide relative to line height) must NOT be
  // treated as one split word — otherwise unrelated neighboring words
  // could combine into an accidental false-positive match.
  const line = [fakeWord('Quang', 100, 150), fakeWord('Bao', 220, 270)]; // 70px gap vs 30px height
  const { flagged } = wordsToRedact(line, [], ['quangcao'], false, false);
  if (flagged.size !== 0) {
    throw new Error(`expected no match across a real word gap, got indices [${[...flagged].join(',')}]`);
  }
});

check('wordsToRedact: a genuine multi-word custom term still matches across separate OCR words', () => {
  // Bonus of the same fix: the line-rejoin uses a single space for a
  // normal gap, so a custom term that is itself two words (e.g. a
  // server name with a space in it) now matches even when OCR reports
  // it as two separate word boxes — previously impossible, since each
  // word was only ever checked on its own.
  const line = [fakeWord('Project', 20, 110), fakeWord('Quang', 220, 270), fakeWord('Bao', 300, 340)];
  const { flagged } = wordsToRedact(line, [], ['quang bao'], false, false);
  if (flagged.size !== 2 || !flagged.has(1) || !flagged.has(2)) {
    throw new Error(`expected the two words making up "quang bao" flagged, got [${[...flagged].join(',')}]`);
  }
});

check('wordsToRedact: entropyEnabled=false never produces suspects, even for a random-looking word', () => {
  const line = [fakeWord('password:', 20, 110), fakeWord('Xk9mQ2vLtR7zAa1', 120, 260)];
  const { suspects } = wordsToRedact(line, [], [], false, false);
  if (suspects.length !== 0) throw new Error(`expected 0 suspects with entropy disabled, got ${suspects.length}`);
});

check('wordsToRedact: entropyEnabled=true flags a random-looking word as a suspect, not a certain match', () => {
  const line = [fakeWord('password:', 20, 110), fakeWord('Xk9mQ2vLtR7zAa1', 120, 260)];
  const { flagged, suspects } = wordsToRedact(line, [], [], false, true);
  if (flagged.size !== 0) throw new Error(`expected no CERTAIN matches (entropy must never be certain), got ${flagged.size}`);
  if (suspects.length !== 1) throw new Error(`expected 1 suspect, got ${suspects.length}`);
  if (!suspects[0].wordIndices.has(1)) throw new Error('expected the suspect to point at word index 1');
});

check('wordsToRedact: a word already covered by a custom-term match is not also reported as an entropy suspect', () => {
  // Same "don't suspect what's already certain" rule as findEntropyMatches,
  // exercised through the OCR word path specifically.
  const line = [fakeWord('Xk9mQ2vLtR7zAa1', 20, 260)];
  const { flagged, suspects } = wordsToRedact(line, [], ['xk9mq2vltr7zaa1'], false, true);
  if (flagged.size !== 1) throw new Error(`expected the custom term to be a certain match, got ${flagged.size}`);
  if (suspects.length !== 0) throw new Error(`expected 0 suspects once the word is already a certain match, got ${suspects.length}`);
});

// --- Word (.docx) → PDF: XML-entity decoding, visible-text extraction,
// and redaction over the extracted text -------------------------------

check('decodeXmlText: the five standard XML entities', () => {
  const got = decodeXmlText('Fees &amp; expenses &lt;draft&gt; &quot;final&quot; &apos;v2&apos;');
  const expected = 'Fees & expenses <draft> "final" \'v2\'';
  if (got !== expected) throw new Error(`expected "${expected}", got "${got}"`);
});

check('decodeXmlText: numeric character references (decimal and hex)', () => {
  // &#272; is "Đ" (U+0110, Vietnamese đ/Đ); &#x1EA1; is "ạ" (U+1EA1,
  // a precomposed Vietnamese diacritic) — Word escapes characters like
  // this in document.xml, so both forms must decode correctly.
  const got = decodeXmlText('&#272;&#x1EA1;');
  const expected = 'Đạ';
  if (got !== expected) throw new Error(`expected "${expected}", got "${got}" (codepoints: ${[...got].map(c => c.codePointAt(0))})`);
});

check('decodeXmlText: plain text with no entities passes through unchanged', () => {
  const got = decodeXmlText('No entities here, just plain text.');
  if (got !== 'No entities here, just plain text.') throw new Error(`unexpectedly altered: "${got}"`);
});

check('extractDocxParagraphs: a value Word split across several <w:t> runs in one paragraph reads as one contiguous string', () => {
  // Word commonly splits a single visible word across multiple <w:r>
  // runs (spell-check markers, a mid-word formatting change, revision
  // bookkeeping) with no space between the runs in the XML — e.g. a
  // company name typed as one word can come back as "Acme" + "Corp" in
  // two separate <w:t> elements. extractDocxParagraphs must concatenate
  // run text within a paragraph with no inserted separator, or a custom
  // term spanning the split would never match as a contiguous string.
  const xml = '<w:p><w:r><w:t>Contact </w:t></w:r><w:r><w:t>Acme</w:t></w:r><w:r><w:t>Corp</w:t></w:r><w:r><w:t> for details.</w:t></w:r></w:p>';
  const paragraphs = extractDocxParagraphs(xml);
  if (paragraphs.length !== 1 || paragraphs[0] !== 'Contact AcmeCorp for details.') {
    throw new Error(`expected ["Contact AcmeCorp for details."], got ${JSON.stringify(paragraphs)}`);
  }
});

check('extractDocxParagraphs: text deleted under Track Changes (<w:delText>) is excluded', () => {
  // <w:delText> holds text the author deleted with Track Changes on —
  // it is not part of the document's currently-visible content, so it
  // must never leak into the extracted/redacted output.
  const xml = '<w:p><w:r><w:delText>OLD CONFIDENTIAL TERM</w:delText></w:r><w:r><w:t>new text</w:t></w:r></w:p>';
  const paragraphs = extractDocxParagraphs(xml);
  if (paragraphs.length !== 1 || paragraphs[0] !== 'new text') {
    throw new Error(`expected ["new text"] with the deleted run excluded, got ${JSON.stringify(paragraphs)}`);
  }
});

check('extractDocxParagraphs: XML-entity-escaped text inside a run is decoded', () => {
  const xml = '<w:p><w:r><w:t>Company: Smith &amp; Sons</w:t></w:r></w:p>';
  const paragraphs = extractDocxParagraphs(xml);
  if (paragraphs.length !== 1 || paragraphs[0] !== 'Company: Smith & Sons') {
    throw new Error(`expected ["Company: Smith & Sons"], got ${JSON.stringify(paragraphs)}`);
  }
});

check('extractDocxParagraphs: multiple paragraphs are returned in document order', () => {
  const xml = '<w:p><w:r><w:t>First.</w:t></w:r></w:p><w:p><w:r><w:t>Second.</w:t></w:r></w:p>';
  const paragraphs = extractDocxParagraphs(xml);
  if (paragraphs.length !== 2 || paragraphs[0] !== 'First.' || paragraphs[1] !== 'Second.') {
    throw new Error(`expected ["First.", "Second."], got ${JSON.stringify(paragraphs)}`);
  }
});

check('extractPptxParagraphs: a value split across several <a:t> runs in one paragraph reads as one contiguous string', () => {
  // Same run-splitting reality as Word, different namespace prefix:
  // PowerPoint can still split one visible word across <a:r> runs.
  const xml = '<a:p><a:r><a:t>Contact </a:t></a:r><a:r><a:t>Acme</a:t></a:r><a:r><a:t>Corp</a:t></a:r><a:r><a:t> for details.</a:t></a:r></a:p>';
  const paragraphs = extractPptxParagraphs(xml);
  if (paragraphs.length !== 1 || paragraphs[0] !== 'Contact AcmeCorp for details.') {
    throw new Error(`expected ["Contact AcmeCorp for details."], got ${JSON.stringify(paragraphs)}`);
  }
});

check('extractPptxParagraphs: XML-entity-escaped text inside a run is decoded', () => {
  const xml = '<a:p><a:r><a:t>Company: Smith &amp; Sons</a:t></a:r></a:p>';
  const paragraphs = extractPptxParagraphs(xml);
  if (paragraphs.length !== 1 || paragraphs[0] !== 'Company: Smith & Sons') {
    throw new Error(`expected ["Company: Smith & Sons"], got ${JSON.stringify(paragraphs)}`);
  }
});

check('extractPptxParagraphs: paragraphs across several text boxes on the same slide XML are returned in document order', () => {
  // A slide's shapes (title box, body box, ...) each carry their own
  // <a:p> paragraphs one after another in the slide XML — no per-shape
  // grouping needed, a flat document-order walk is enough.
  const xml = '<p:sp><p:txBody><a:p><a:r><a:t>Slide title</a:t></a:r></a:p></p:txBody></p:sp>' +
              '<p:sp><p:txBody><a:p><a:r><a:t>First bullet.</a:t></a:r></a:p><a:p><a:r><a:t>Second bullet.</a:t></a:r></a:p></p:txBody></p:sp>';
  const paragraphs = extractPptxParagraphs(xml);
  const expected = ['Slide title', 'First bullet.', 'Second bullet.'];
  if (JSON.stringify(paragraphs) !== JSON.stringify(expected)) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(paragraphs)}`);
  }
});

check('full pipeline: a custom term split across pptx runs is still caught after extraction + redaction', () => {
  // Mirrors the equivalent docx full-pipeline test below: extraction and
  // redaction are two separate pure functions, so this checks they
  // actually compose correctly for the PowerPoint path too.
  const xml = '<a:p><a:r><a:t>Contact </a:t></a:r><a:r><a:t>Acme</a:t></a:r><a:r><a:t>Corp</a:t></a:r><a:r><a:t> for details.</a:t></a:r></a:p>';
  const paragraphs = extractPptxParagraphs(xml);
  const { text, redactedCount } = redactParagraphs(paragraphs, [], ['acmecorp'], false, { custom: '[INTERNAL TERM]' });
  if (redactedCount !== 1) throw new Error(`expected 1 redaction, got ${redactedCount}`);
  if (text !== 'Contact [INTERNAL TERM] for details.') throw new Error(`unexpected output: "${text}"`);
});

check('redactParagraphs: matches are replaced with the caller-supplied mask label and counted', () => {
  const { text, redactedCount } = redactParagraphs(
    ['Contact jane@example.com today.'],
    activeRules(['email']),
    [],
    false,
    { email: '[EMAIL REDACTED]' }
  );
  if (redactedCount !== 1) throw new Error(`expected 1 redaction, got ${redactedCount}`);
  if (text !== 'Contact [EMAIL REDACTED] today.') throw new Error(`unexpected output: "${text}"`);
});

check('redactParagraphs: falls back to a generic label when no mask is supplied for the matched rule', () => {
  const { text } = redactParagraphs(['internal codename Project Phoenix is confidential'], [], ['Project Phoenix'], false, {});
  if (!text.includes('[REDACTED]')) throw new Error(`expected a [REDACTED] fallback label, got "${text}"`);
});

check('redactParagraphs: paragraphs are joined with newlines and a match in one paragraph does not affect another', () => {
  const { text, redactedCount } = redactParagraphs(
    ['First paragraph with secret term here.', 'Second paragraph, no match.'],
    [],
    ['secret term'],
    false,
    { custom: '[TERM]' }
  );
  if (redactedCount !== 1) throw new Error(`expected 1 redaction, got ${redactedCount}`);
  const expected = 'First paragraph with [TERM] here.\nSecond paragraph, no match.';
  if (text !== expected) throw new Error(`expected "${expected}", got "${text}"`);
});

check('redactParagraphs: entropy suspects are counted but NEVER redacted from the text, even when enabled', () => {
  // the hard rule from the user's own spec: a high-entropy suspect must
  // stay in plain sight unless the user confirms it (via the custom
  // term list) — redactParagraphs must never black it out on its own
  const { text, redactedCount, suspectCount } = redactParagraphs(
    ['The password is Xk9mQ2vLtR7zAa1 and nothing else.'],
    [],
    [],
    false,
    {},
    true // entropyEnabled
  );
  if (suspectCount !== 1) throw new Error(`expected 1 suspect, got ${suspectCount}`);
  if (redactedCount !== 0) throw new Error(`expected 0 real redactions, got ${redactedCount}`);
  if (!text.includes('Xk9mQ2vLtR7zAa1')) throw new Error(`suspect text must survive untouched, got "${text}"`);
});

check('redactParagraphs: entropy suspects are not even counted when entropyEnabled is false/omitted', () => {
  const { suspectCount } = redactParagraphs(
    ['The password is Xk9mQ2vLtR7zAa1 and nothing else.'],
    [], [], false, {}
    // entropyEnabled omitted -> undefined -> falsy
  );
  if (suspectCount !== 0) throw new Error(`expected 0 suspects when entropy detection is off, got ${suspectCount}`);
});

check('full pipeline: a custom term Word split across runs is still caught after extraction + redaction', () => {
  // Combines the two fixes above end to end: the run-split XML from the
  // first extractDocxParagraphs test, fed straight into redactParagraphs
  // with a custom term that only exists as the rejoined whole word.
  const xml = '<w:p><w:r><w:t>Contact </w:t></w:r><w:r><w:t>Acme</w:t></w:r><w:r><w:t>Corp</w:t></w:r><w:r><w:t> for details.</w:t></w:r></w:p>';
  const paragraphs = extractDocxParagraphs(xml);
  const { text, redactedCount } = redactParagraphs(paragraphs, [], ['acmecorp'], false, { custom: '[INTERNAL TERM]' });
  if (redactedCount !== 1) throw new Error(`expected 1 redaction, got ${redactedCount}`);
  if (text !== 'Contact [INTERNAL TERM] for details.') throw new Error(`unexpected output: "${text}"`);
});

// --- entropy detection: synthetic data, no real secrets ----------------

check('shannonEntropy: a repeated character has zero entropy', () => {
  const h = shannonEntropy('aaaaaaaaaaaa');
  if (h !== 0) throw new Error(`expected 0, got ${h}`);
});

check('shannonEntropy: 8 equally-frequent distinct characters hit exactly log2(8)', () => {
  const h = shannonEntropy('abcdefgh');
  if (Math.abs(h - 3) > 1e-9) throw new Error(`expected 3, got ${h}`);
});

check('classifyAlphabet: hex-only string', () => {
  if (classifyAlphabet('deadbeefcafebabe1234') !== 'hex') throw new Error('expected hex');
});

check('classifyAlphabet: real base64 (uses + / or = padding) is base64ish, not mixed', () => {
  if (classifyAlphabet('aW50ZXJuYWxDb21wYW55U2VjcmV0MTIzNA==') !== 'base64ish') throw new Error('expected base64ish');
});

check('classifyAlphabet: a plain mixed-case alphanumeric password is "mixed", not "base64ish"', () => {
  // Deliberately NOT base64ish even though it only uses letters/digits —
  // see the comment on classifyAlphabet in index.html for why: it
  // measurably sits at a lower entropy than real base64 of the same
  // length, so holding it to base64's higher threshold would miss it.
  if (classifyAlphabet('Xk9mQ2vLtR7zAa1') !== 'mixed') throw new Error('expected mixed');
});

check('findEntropyMatches: a random-looking mixed-case token in a sentence is flagged', () => {
  const matches = findEntropyMatches('The password is Xk9mQ2vLtR7zAa1 and nothing else.', []);
  if (matches.length !== 1) throw new Error(`expected 1 suspect, got ${matches.length}`);
  if (matches[0].ruleId !== 'entropy') throw new Error(`expected ruleId "entropy", got "${matches[0].ruleId}"`);
});

check('findEntropyMatches: an ordinary sentence with no random-looking tokens is never flagged', () => {
  const matches = findEntropyMatches('This is just an ordinary sentence with no secrets at all here.', []);
  if (matches.length !== 0) throw new Error(`expected 0 suspects, got ${matches.length}`);
});

check('findEntropyMatches: a token shorter than ENTROPY_MIN_LENGTH is never flagged, however random it looks', () => {
  const matches = findEntropyMatches('pw: Xk9mQ2v', []);
  if (matches.length !== 0) throw new Error(`expected 0 suspects (token too short), got ${matches.length}`);
});

check('findEntropyMatches: a span already covered by a certain match is skipped, even if high-entropy', () => {
  const text = 'contact jane.doe123456789012@example.com now';
  const matches = findEntropyMatches(text, [{ start: 8, end: 20 }]);
  if (matches.length !== 0) throw new Error(`expected the overlapping span to be skipped, got ${matches.length} suspect(s)`);
});

check('findEntropyMatches: known false-positive class — a long camelCase compound identifier can clear the threshold', () => {
  // Documents a real limitation rather than hiding it (same spirit as
  // the ipv6 "known limitation" test above): Shannon entropy cannot
  // distinguish "random secret" from "long compound word with mixed
  // case", because both have an unpredictable-looking character
  // distribution. This is exactly why entropy suspects are never
  // auto-redacted anywhere in the app — see the big comment above
  // ENTROPY_MIN_LENGTH in index.html.
  const matches = findEntropyMatches('Variable name: ThisIsAnOrdinaryEnglishSentenceVariable used here.', []);
  if (matches.length !== 1) throw new Error(`expected this known false positive to still occur (documenting current behavior), got ${matches.length} suspect(s) — if this now passes with 0, the threshold changed; update this test and the README note together`);
});

// --- clean PDF output (v1.2.1) ------------------------------------------
// Every exported PDF must carry no document metadata. pdf-lib, left on
// its defaults, writes its own Producer/Creator strings and "now" as
// CreationDate/ModDate; index.html routes all three PDF export paths
// through createCleanPdf()/saveCleanPdf() to prevent that. These tests
// run the *real* helpers pulled out of index.html against the vendored
// pdf-lib build, plus a negative control proving the byte scan below
// really can see the leak when the helpers are NOT used (a scanner
// that has never been shown a dirty sample can't be trusted to say
// "clean"). All fixtures are synthetic.

const pdfLibSource = readFileSync(path.join(__dirname, '..', 'vendor', 'pdf', 'pdf-lib.min.js'), 'utf8');
const pdfLibModule = { exports: {} };
new Function('module', 'exports', 'self', 'window', pdfLibSource + ';')(pdfLibModule, pdfLibModule.exports, globalThis, globalThis);
const PDFLib = pdfLibModule.exports.PDFDocument ? pdfLibModule.exports : globalThis.PDFLib;

const cleanPdfHelpersCode = extractBetween(
  '// CLEAN_PDF_HELPERS_START',
  '// CLEAN_PDF_HELPERS_END',
  'createCleanPdf + saveCleanPdf'
);
const { createCleanPdf, saveCleanPdf } = new Function('PDFLib', `${cleanPdfHelpersCode}\nreturn { createCleanPdf, saveCleanPdf };`)(PDFLib);

// Smallest valid PNG (1x1), so the image->PDF path (embedPng) is exercised too.
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// Anything in this list appearing in the raw bytes of an exported PDF is a leak.
// (These are PDF name tokens, always plain ASCII; the *values* pdf-lib writes
// are hex-encoded UTF-16, so scanning for the tool's name as text would miss it.)
const PDF_METADATA_MARKERS = ['/Info', '/Producer', '/Creator', '/CreationDate', '/ModDate', '/Author', '/Title', '/Subject', '/Keywords', '/Metadata'];
function pdfMetadataMarkersIn(bytes) {
  const raw = Buffer.from(bytes).toString('latin1');
  return PDF_METADATA_MARKERS.filter(m => raw.includes(m));
}

async function checkAsync(name, fn) {
  try {
    await fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
  }
}

check('clean PDF guard: index.html has exactly one direct pdf-lib document constructor call, and it is inside createCleanPdf', () => {
  const direct = html.split('PDFLib.PDFDocument.create(').length - 1;
  if (direct !== 1) throw new Error(`expected exactly 1 direct "PDFLib.PDFDocument.create(" call (inside createCleanPdf), found ${direct} -- every export path must call createCleanPdf() instead`);
  if (!cleanPdfHelpersCode.includes('PDFLib.PDFDocument.create({ updateMetadata: false })')) {
    throw new Error('createCleanPdf no longer passes { updateMetadata: false } to pdf-lib');
  }
});

check('clean PDF guard: no direct save() call on an output PDF document remains outside saveCleanPdf', () => {
  if (/\boutPdf\.save\(/.test(html)) throw new Error('found a direct outPdf.save( call -- use saveCleanPdf(outPdf) so the byte-scannable, no-object-streams layout is kept');
  const viaHelper = html.split('saveCleanPdf(outPdf)').length - 1;
  if (viaHelper !== 3) throw new Error(`expected 3 saveCleanPdf(outPdf) calls (image->PDF, flattened PDF, Word/PowerPoint->PDF), found ${viaHelper}`);
  if (!cleanPdfHelpersCode.includes('useObjectStreams: false')) throw new Error('saveCleanPdf no longer disables object streams');
});

await checkAsync('createCleanPdf + saveCleanPdf: blank-page PDF has no metadata markers', async () => {
  const doc = await createCleanPdf();
  doc.addPage([200, 200]);
  const found = pdfMetadataMarkersIn(await saveCleanPdf(doc));
  if (found.length) throw new Error('metadata markers found in clean PDF output: ' + found.join(', '));
});

await checkAsync('createCleanPdf + saveCleanPdf: PDF with an embedded PNG page (the image/flattened-PDF path) has no metadata markers', async () => {
  const doc = await createCleanPdf();
  const png = await doc.embedPng(TINY_PNG);
  const page = doc.addPage([200, 200]);
  page.drawImage(png, { x: 0, y: 0, width: 200, height: 200 });
  const found = pdfMetadataMarkersIn(await saveCleanPdf(doc));
  if (found.length) throw new Error('metadata markers found in clean PDF output: ' + found.join(', '));
});

await checkAsync('negative control: pdf-lib defaults (no helpers) DO leak Producer, Creator and dates -- proves the scan can see a leak', async () => {
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([200, 200]);
  const found = pdfMetadataMarkersIn(await doc.save({ useObjectStreams: false }));
  for (const needed of ['/Producer', '/Creator', '/CreationDate', '/ModDate']) {
    if (!found.includes(needed)) throw new Error(`scan failed to detect ${needed} in a default pdf-lib PDF -- the clean-output tests above would prove nothing`);
  }
});

await checkAsync('documents the trap: with pdf-lib default object streams the Producer string is NOT visible to a raw byte scan', async () => {
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([200, 200]);
  const found = pdfMetadataMarkersIn(await doc.save());
  if (found.includes('/Producer')) throw new Error('the default-packing PDF now shows /Producer in raw bytes; the vendored pdf-lib behavior changed -- re-evaluate why saveCleanPdf sets useObjectStreams: false and update this test and the comment above createCleanPdf together');
});

// --- scanMetadata (v1.2.1) -----------------------------------------------
// The scanner is pulled straight out of index.html and run as shipped.
// Fixtures are built byte-by-byte here from synthetic values (a made-up
// camera "FakeCam", a made-up author) -- never from a real photo. Every
// "dirty" case has a matching "clean" case, because a scanner that has
// only ever been shown dirty files can't be trusted to say "clean".

const scanMetadataCode = extractBetween(
  '// SCAN_METADATA_START',
  '// SCAN_METADATA_END',
  'scanMetadata'
);
const { scanMetadata } = new Function(`${scanMetadataCode}\nreturn { scanMetadata };`)();

const bytesOf = (...parts) => {
  const arr = [];
  for (const p of parts) {
    if (typeof p === 'string') for (const b of Buffer.from(p, 'latin1')) arr.push(b);
    else for (const b of p) arr.push(b);
  }
  return Uint8Array.from(arr);
};
const codesOf = r => r.findings.map(f => f.code);
const detailOf = (r, code) => (r.findings.find(f => f.code === code) || {}).detail || '';

// ---- JPEG fixtures ----
function jpegSegment(marker, payload) {
  const len = payload.length + 2;
  return bytesOf([0xFF, marker, len >> 8, len & 255], payload);
}
const JFIF = jpegSegment(0xE0, bytesOf('JFIF\0', [1, 1, 0, 0, 1, 0, 1, 0, 0]));
const JPEG_SCAN = bytesOf([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00], [0x12, 0x34, 0xFF, 0x00, 0x56], [0xFF, 0xD9]);
const SOI = [0xFF, 0xD8];

function buildExifTiff({ littleEndian = true, gps = true, thumbnail = true, latRef = 'N', lonRef = 'E' } = {}) {
  const le = littleEndian;
  const u16 = v => le ? [v & 255, (v >> 8) & 255] : [(v >> 8) & 255, v & 255];
  const u32 = v => le
    ? [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]
    : [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const asciiZ = s => [...Buffer.from(s + '\0', 'latin1')];
  const entry = (tag, type, count, value) => [...u16(tag), ...u16(type), ...u32(count), ...value];
  const rational = (num, den) => [...u32(num), ...u32(den)];
  const make = asciiZ('FakeCam'), model = asciiZ('Model-X'), software = asciiZ('FakeSoft 1.0'), dto = asciiZ('2026:01:02 03:04:05');
  // Synthetic position: 10 deg 30' 0" = 10.5, 20 deg 15' 0" = 20.25 (nowhere in particular).
  const latData = [...rational(10, 1), ...rational(30, 1), ...rational(0, 1)];
  const lonData = [...rational(20, 1), ...rational(15, 1), ...rational(0, 1)];
  const ifd0Entries = gps ? 5 : 4;
  const ifd0Off = 8;
  const makeOff = ifd0Off + 2 + ifd0Entries * 12 + 4;
  const modelOff = makeOff + make.length;
  const softwareOff = modelOff + model.length;
  const exifOff = softwareOff + software.length;
  const dtoOff = exifOff + 2 + 12 + 4;
  const gpsOff = dtoOff + dto.length;
  const latOff = gpsOff + (gps ? 2 + 4 * 12 + 4 : 0);
  const lonOff = latOff + (gps ? 24 : 0);
  const thumbOff = lonOff + (gps ? 24 : 0);
  const out = [le ? 0x49 : 0x4D, le ? 0x49 : 0x4D, ...u16(42), ...u32(ifd0Off)];
  out.push(...u16(ifd0Entries),
    ...entry(0x010F, 2, make.length, u32(makeOff)),
    ...entry(0x0110, 2, model.length, u32(modelOff)),
    ...entry(0x0131, 2, software.length, u32(softwareOff)),
    ...entry(0x8769, 4, 1, u32(exifOff)));
  if (gps) out.push(...entry(0x8825, 4, 1, u32(gpsOff)));
  out.push(...u32(thumbnail ? thumbOff : 0));
  out.push(...make, ...model, ...software);
  out.push(...u16(1), ...entry(0x9003, 2, dto.length, u32(dtoOff)), ...u32(0));
  out.push(...dto);
  if (gps) {
    out.push(...u16(4),
      ...entry(0x0001, 2, 2, [latRef.charCodeAt(0), 0, 0, 0]),
      ...entry(0x0002, 5, 3, u32(latOff)),
      ...entry(0x0003, 2, 2, [lonRef.charCodeAt(0), 0, 0, 0]),
      ...entry(0x0004, 5, 3, u32(lonOff)),
      ...u32(0), ...latData, ...lonData);
  }
  if (thumbnail) out.push(...u16(1), ...entry(0x0103, 3, 1, [...u16(6), 0, 0]), ...u32(0));
  return Uint8Array.from(out);
}
const exifSegment = opts => jpegSegment(0xE1, bytesOf('Exif\0\0', buildExifTiff(opts)));

const JPEG_CLEAN = bytesOf(SOI, JFIF, JPEG_SCAN);
const JPEG_ICC_ONLY = bytesOf(SOI, JFIF, jpegSegment(0xE2, bytesOf('ICC_PROFILE\0', [1, 1], [0, 0, 0, 0])), JPEG_SCAN);
const JPEG_DIRTY = bytesOf(
  SOI, JFIF,
  exifSegment(),
  jpegSegment(0xE1, bytesOf('http://ns.adobe.com/xap/1.0/\0', '<x:xmpmeta xmlns:x="adobe:ns:meta/"></x:xmpmeta>')),
  jpegSegment(0xED, bytesOf('Photoshop 3.0\0', '8BIM', [4, 4, 0, 0])),
  jpegSegment(0xFE, bytesOf('Made by Fake Person')),
  jpegSegment(0xE2, bytesOf('ICC_PROFILE\0', [1, 1], [0, 0, 0, 0])),
  JPEG_SCAN
);

check('scanMetadata JPEG: a file with only JFIF + scan data is clean', () => {
  const r = scanMetadata(JPEG_CLEAN);
  if (r.format !== 'jpeg') throw new Error('format: ' + r.format);
  if (r.findings.length || r.hasSensitive || r.unscannable) throw new Error('expected nothing, got ' + JSON.stringify(r.findings));
});

check('scanMetadata JPEG: an ICC profile alone is "info", not sensitive', () => {
  const r = scanMetadata(JPEG_ICC_ONLY);
  if (r.hasSensitive) throw new Error('ICC-only file wrongly flagged sensitive: ' + JSON.stringify(r.findings));
  if (JSON.stringify(codesOf(r)) !== '["icc"]' || r.findings[0].severity !== 'info') throw new Error('expected a single info icc finding, got ' + JSON.stringify(r.findings));
});

check('scanMetadata JPEG: dirty file reports EXIF, XMP, IPTC, comment and ICC', () => {
  const r = scanMetadata(JPEG_DIRTY);
  for (const c of ['exif', 'xmp', 'iptc', 'jpeg-comment', 'icc']) {
    if (!codesOf(r).includes(c)) throw new Error(`missing finding "${c}" in ${JSON.stringify(r.findings)}`);
  }
  if (!r.hasSensitive) throw new Error('hasSensitive should be true');
});

check('scanMetadata JPEG: EXIF detail lists identifying tag names, GPS and thumbnail (little-endian)', () => {
  const r = scanMetadata(bytesOf(SOI, exifSegment({ littleEndian: true }), JPEG_SCAN));
  const d = detailOf(r, 'exif');
  for (const needed of ['Make', 'Model', 'Software', 'DateTimeOriginal', 'GPS', 'thumbnail']) {
    if (!d.includes(needed)) throw new Error(`"${needed}" missing from EXIF detail: ${d}`);
  }
  if (!r.hasGps) throw new Error('hasGps should be true');
});

check('scanMetadata JPEG: EXIF is also parsed big-endian', () => {
  const r = scanMetadata(bytesOf(SOI, exifSegment({ littleEndian: false }), JPEG_SCAN));
  const d = detailOf(r, 'exif');
  for (const needed of ['Make', 'Model', 'DateTimeOriginal', 'GPS']) {
    if (!d.includes(needed)) throw new Error(`"${needed}" missing from big-endian EXIF detail: ${d}`);
  }
});

check('scanMetadata JPEG: EXIF without GPS or thumbnail does not claim either', () => {
  const r = scanMetadata(bytesOf(SOI, exifSegment({ gps: false, thumbnail: false }), JPEG_SCAN));
  const d = detailOf(r, 'exif');
  if (r.hasGps || d.includes('GPS') || d.includes('thumbnail')) throw new Error('false GPS/thumbnail claim: ' + d);
  if (!d.includes('Make')) throw new Error('Make should still be listed: ' + d);
});

check('scanMetadata JPEG: bytes hidden after the end-of-image marker are reported', () => {
  const r = scanMetadata(bytesOf(JPEG_CLEAN, 'SECRET-APPENDED-PAYLOAD'));
  if (!codesOf(r).includes('trailing-data')) throw new Error('trailing data not reported: ' + JSON.stringify(r.findings));
  if (detailOf(r, 'trailing-data') !== '23 bytes') throw new Error('wrong size: ' + detailOf(r, 'trailing-data'));
});

check('scanMetadata JPEG: ArrayBuffer and Node Buffer inputs work like Uint8Array', () => {
  const ab = JPEG_DIRTY.buffer.slice(JPEG_DIRTY.byteOffset, JPEG_DIRTY.byteOffset + JPEG_DIRTY.byteLength);
  if (!scanMetadata(ab).hasSensitive) throw new Error('ArrayBuffer input missed the metadata');
  if (!scanMetadata(Buffer.from(JPEG_DIRTY)).hasSensitive) throw new Error('Buffer input missed the metadata');
});

// ---- PNG fixtures ----
const pngChunk = (type, data) => {
  const len = data.length;
  // CRC left as zero: the scanner never validates checksums (documented limit).
  return bytesOf([(len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255], type, data, [0, 0, 0, 0]);
};
const pngInsertAfterIhdr = extra => bytesOf(TINY_PNG.subarray(0, 33), extra, TINY_PNG.subarray(33));

check('scanMetadata PNG: the 1x1 canvas-style PNG is clean', () => {
  const r = scanMetadata(TINY_PNG);
  if (r.format !== 'png') throw new Error('format: ' + r.format);
  if (r.findings.length) throw new Error('expected nothing, got ' + JSON.stringify(r.findings));
});

check('scanMetadata PNG: text chunks report their keyword, plus eXIf, tIME and iCCP', () => {
  const dirty = pngInsertAfterIhdr(bytesOf(
    pngChunk('tEXt', bytesOf('Author\0Fake Person')),
    pngChunk('iTXt', bytesOf('XML:com.adobe.xmp\0', [0, 0], '\0\0<x:xmpmeta/>')),
    pngChunk('eXIf', buildExifTiff()),
    pngChunk('tIME', [0x07, 0xEA, 1, 2, 3, 4, 5]),
    pngChunk('iCCP', bytesOf('icc\0', [0, 0]))
  ));
  const r = scanMetadata(dirty);
  const texts = r.findings.filter(f => f.code === 'png-text').map(f => f.detail);
  if (!texts.includes('tEXt: Author') || !texts.includes('iTXt: XML:com.adobe.xmp')) throw new Error('text keywords not reported: ' + JSON.stringify(texts));
  for (const c of ['exif', 'png-time', 'icc']) if (!codesOf(r).includes(c)) throw new Error(`missing "${c}"`);
  if (!r.hasGps) throw new Error('GPS inside eXIf not detected');
});

check('scanMetadata PNG: bytes after IEND are reported', () => {
  const r = scanMetadata(bytesOf(TINY_PNG, 'HIDDEN'));
  if (!codesOf(r).includes('trailing-data')) throw new Error('trailing data not reported: ' + JSON.stringify(r.findings));
});

check('scanMetadata PNG: a hostile text keyword is passed through verbatim (the UI must escape it)', () => {
  const evil = '<img src=x onerror=1>';
  const r = scanMetadata(pngInsertAfterIhdr(pngChunk('tEXt', bytesOf(evil + '\0v'))));
  if (detailOf(r, 'png-text') !== 'tEXt: ' + evil) throw new Error('detail altered: ' + detailOf(r, 'png-text'));
});

// ---- WebP fixtures ----
const riffChunk = (fourcc, data) => {
  const len = data.length;
  const out = [...bytesOf(fourcc), len & 255, (len >>> 8) & 255, (len >>> 16) & 255, (len >>> 24) & 255, ...data];
  if (len & 1) out.push(0);
  return out;
};
const webp = chunks => {
  const body = [...bytesOf('WEBP'), ...chunks.flat()];
  return bytesOf('RIFF', [body.length & 255, (body.length >>> 8) & 255, (body.length >>> 16) & 255, (body.length >>> 24) & 255], body);
};
const WEBP_IMAGE = riffChunk('VP8 ', new Array(10).fill(0));

check('scanMetadata WebP: image-only file is clean', () => {
  const r = scanMetadata(webp([WEBP_IMAGE]));
  if (r.format !== 'webp') throw new Error('format: ' + r.format);
  if (r.findings.length) throw new Error('expected nothing, got ' + JSON.stringify(r.findings));
});

check('scanMetadata WebP: EXIF (with and without the Exif prefix), XMP and ICC are reported', () => {
  const r1 = scanMetadata(webp([riffChunk('VP8X', new Array(10).fill(0)), riffChunk('EXIF', bytesOf('Exif\0\0', buildExifTiff())), riffChunk('XMP ', bytesOf('<x:xmpmeta/>')), riffChunk('ICCP', [0, 0]), WEBP_IMAGE]));
  for (const c of ['exif', 'xmp', 'icc']) if (!codesOf(r1).includes(c)) throw new Error(`missing "${c}"`);
  if (!detailOf(r1, 'exif').includes('Make')) throw new Error('EXIF names not read: ' + detailOf(r1, 'exif'));
  const r2 = scanMetadata(webp([riffChunk('EXIF', buildExifTiff({ gps: false })), WEBP_IMAGE]));
  if (!detailOf(r2, 'exif').includes('Model')) throw new Error('unprefixed EXIF not read: ' + detailOf(r2, 'exif'));
});

// ---- PDF (uses the real createCleanPdf / saveCleanPdf and pdf-lib defaults) ----
await checkAsync('scanMetadata PDF: output of createCleanPdf + saveCleanPdf is clean and fully scannable', async () => {
  const doc = await createCleanPdf();
  const png = await doc.embedPng(TINY_PNG);
  doc.addPage([200, 200]).drawImage(png, { x: 0, y: 0, width: 200, height: 200 });
  const r = scanMetadata(await saveCleanPdf(doc));
  if (r.format !== 'pdf') throw new Error('format: ' + r.format);
  if (r.findings.length || r.unscannable) throw new Error('expected nothing, got ' + JSON.stringify(r.findings));
});

await checkAsync('scanMetadata PDF: negative control -- a default pdf-lib PDF (plain layout) is flagged for Producer, Creator and dates', async () => {
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([200, 200]);
  const r = scanMetadata(await doc.save({ useObjectStreams: false }));
  const fields = r.findings.filter(f => f.code === 'pdf-field').map(f => f.detail);
  for (const f of ['Producer', 'Creator', 'CreationDate', 'ModDate']) if (!fields.includes(f)) throw new Error(`scanner missed ${f}; got ${JSON.stringify(r.findings)}`);
  if (!codesOf(r).includes('pdf-info') || !r.hasSensitive) throw new Error('pdf-info / hasSensitive missing');
});

await checkAsync('scanMetadata PDF: a default pdf-lib PDF with object streams is reported UNSCANNABLE, never "clean"', async () => {
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([200, 200]);
  const r = scanMetadata(await doc.save());
  if (!r.unscannable || !codesOf(r).includes('pdf-objstm')) throw new Error('compressed layout was not flagged unscannable: ' + JSON.stringify(r.findings));
});

check('scanMetadata PDF: an encrypted PDF is reported unscannable', () => {
  const r = scanMetadata(bytesOf('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Encrypt 9 0 R >>\n%%EOF'));
  if (!r.unscannable || !codesOf(r).includes('pdf-encrypt')) throw new Error(JSON.stringify(r.findings));
});

// ---- values: what the file actually says (v1.2.1 follow-up) ----
// A small TIFF builder for exotic tags; values longer than 4 bytes are placed out of line.
function tiffWithEntries(entries, littleEndian = true) {
  const le = littleEndian;
  const u16 = v => le ? [v & 255, (v >> 8) & 255] : [(v >> 8) & 255, v & 255];
  const u32 = v => le ? [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255] : [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const dataStart = 8 + 2 + entries.length * 12 + 4;
  const data = [];
  const ifd = [];
  for (const e of entries) {
    let value;
    if (e.bytes.length <= 4) value = [...e.bytes, ...new Array(4 - e.bytes.length).fill(0)];
    else { value = u32(dataStart + data.length); data.push(...e.bytes); }
    ifd.push(...u16(e.tag), ...u16(e.type), ...u32(e.count ?? e.bytes.length), ...value);
  }
  return Uint8Array.from([le ? 0x49 : 0x4D, le ? 0x49 : 0x4D, ...u16(42), ...u32(8), ...u16(entries.length), ...ifd, ...u32(0), ...data]);
}
const fieldsOf = (r, code) => Object.fromEntries(((r.findings.find(f => f.code === code) || {}).fields || []).map(f => [f.name, f.value]));
const jpegWith = (...segments) => bytesOf(SOI, ...segments, JPEG_SCAN);

check('values: EXIF tag values and the GPS position are decoded (little-endian and big-endian)', () => {
  for (const littleEndian of [true, false]) {
    const f = fieldsOf(scanMetadata(jpegWith(exifSegment({ littleEndian }))), 'exif');
    const want = { Make: 'FakeCam', Model: 'Model-X', Software: 'FakeSoft 1.0', DateTimeOriginal: '2026:01:02 03:04:05', GPSLatitude: '10.500000° N', GPSLongitude: '20.250000° E', GPSPosition: '10.500000, 20.250000' };
    for (const [k, v] of Object.entries(want)) if (f[k] !== v) throw new Error(`${littleEndian ? 'LE' : 'BE'}: ${k} expected ${JSON.stringify(v)}, got ${JSON.stringify(f[k])} (all: ${JSON.stringify(f)})`);
  }
});

check('values: southern / western hemispheres give a negative GPSPosition', () => {
  const f = fieldsOf(scanMetadata(jpegWith(exifSegment({ latRef: 'S', lonRef: 'W' }))), 'exif');
  if (f.GPSPosition !== '-10.500000, -20.250000') throw new Error('got ' + f.GPSPosition);
  if (f.GPSLatitude !== '10.500000° S' || f.GPSLongitude !== '20.250000° W') throw new Error(JSON.stringify(f));
});

check('values: Windows XP tags (UTF-16), UserComment (charset prefix) and Artist are decoded', () => {
  const utf16 = s => [...Buffer.from(s + '\0', 'utf16le')];
  const tiff = tiffWithEntries([
    { tag: 0x013B, type: 2, bytes: [...Buffer.from('Jane Fake\0', 'latin1')] },
    { tag: 0x9286, type: 7, bytes: [...Buffer.from('ASCII\0\0\0hello comment', 'latin1')] },
    { tag: 0x9C9D, type: 1, bytes: utf16('Fake Author') }
  ]);
  const f = fieldsOf(scanMetadata(jpegWith(jpegSegment(0xE1, bytesOf('Exif\0\0', tiff)))), 'exif');
  if (f.Artist !== 'Jane Fake' || f.UserComment !== 'hello comment' || f.XPAuthor !== 'Fake Author') throw new Error(JSON.stringify(f));
});

check('values: a tag whose value points outside the data is still listed by name, with no value (no throw)', () => {
  const tiff = tiffWithEntries([{ tag: 0x010F, type: 2, count: 100000, bytes: [...Buffer.from('FakeCam\0', 'latin1')] }]);
  const r = scanMetadata(jpegWith(jpegSegment(0xE1, bytesOf('Exif\0\0', tiff))));
  if (!detailOf(r, 'exif').includes('Make')) throw new Error('name missing: ' + detailOf(r, 'exif'));
  if ('Make' in fieldsOf(r, 'exif')) throw new Error('a value was invented for an out-of-range entry');
});

check('values: a JPEG comment carries its text', () => {
  const r = scanMetadata(jpegWith(jpegSegment(0xFE, bytesOf('Made by Fake Person'))));
  if ((r.findings.find(f => f.code === 'jpeg-comment') || {}).value !== 'Made by Fake Person') throw new Error(JSON.stringify(r.findings));
});

const XMP_SAMPLE = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmp:CreatorTool="Fake Editor 1.0"><dc:creator><rdf:Seq><rdf:li>Fake &amp; Co</rdf:li></rdf:Seq></dc:creator><photoshop:City>Fakeville</photoshop:City></rdf:Description></rdf:RDF></x:xmpmeta>';
check('values: XMP attributes, list properties and plain properties are extracted (entities decoded, plumbing skipped)', () => {
  const f = fieldsOf(scanMetadata(jpegWith(jpegSegment(0xE1, bytesOf('http://ns.adobe.com/xap/1.0/\0', XMP_SAMPLE)))), 'xmp');
  if (f['xmp:CreatorTool'] !== 'Fake Editor 1.0' || f['dc:creator'] !== 'Fake & Co' || f['photoshop:City'] !== 'Fakeville') throw new Error(JSON.stringify(f));
  if (Object.keys(f).some(k => k.startsWith('xmlns') || k === 'rdf:about')) throw new Error('namespace plumbing leaked into the fields: ' + JSON.stringify(f));
});

check('values: IPTC datasets (title, by-line, repeated keywords) are extracted from the Photoshop block', () => {
  const ds = (num, text) => [0x1C, 2, num, 0, text.length, ...Buffer.from(text, 'utf8')];
  const iim = [...ds(5, 'Fake Title'), ...ds(80, 'Fake Author'), ...ds(25, 'kw1'), ...ds(25, 'kw2')];
  const size = iim.length;
  const block = bytesOf('Photoshop 3.0\0', '8BIM', [0x04, 0x04], [0, 0], [(size >>> 24) & 255, (size >>> 16) & 255, (size >>> 8) & 255, size & 255], iim, size & 1 ? [0] : []);
  const r = scanMetadata(jpegWith(jpegSegment(0xED, block)));
  const fields = (r.findings.find(f => f.code === 'iptc') || {}).fields || [];
  const names = fields.map(f => f.name + '=' + f.value);
  for (const want of ['ObjectName=Fake Title', 'By-line=Fake Author', 'Keywords=kw1', 'Keywords=kw2']) if (!names.includes(want)) throw new Error(`missing ${want} in ${JSON.stringify(names)}`);
});

check('values: PNG text chunks carry their text; compressed ones report only the keyword; tIME is formatted', () => {
  const png = pngInsertAfterIhdr(bytesOf(
    pngChunk('tEXt', bytesOf('Author\0Fake Person')),
    pngChunk('iTXt', bytesOf('Comment\0', [0, 0], '\0\0', [...Buffer.from('Grüße', 'utf8')])),
    pngChunk('iTXt', bytesOf('XML:com.adobe.xmp\0', [0, 0], '\0\0', XMP_SAMPLE)),
    pngChunk('zTXt', bytesOf('Secret\0', [0], [1, 2, 3])),
    pngChunk('tIME', [0x07, 0xEA, 1, 2, 3, 4, 5])
  ));
  const r = scanMetadata(png);
  const byDetail = d => r.findings.find(f => f.code === 'png-text' && f.detail === d) || {};
  if (byDetail('tEXt: Author').value !== 'Fake Person') throw new Error('tEXt value: ' + JSON.stringify(byDetail('tEXt: Author')));
  if (byDetail('iTXt: Comment').value !== 'Grüße') throw new Error('iTXt value: ' + JSON.stringify(byDetail('iTXt: Comment')));
  const xmpFieldsFound = (byDetail('iTXt: XML:com.adobe.xmp').fields || []).map(f => f.name);
  if (!xmpFieldsFound.includes('xmp:CreatorTool') || !xmpFieldsFound.includes('dc:creator')) throw new Error('XMP-in-PNG fields: ' + JSON.stringify(xmpFieldsFound));
  if ('value' in byDetail('zTXt: Secret') || 'fields' in byDetail('zTXt: Secret')) throw new Error('compressed zTXt must not invent a value');
  if ((r.findings.find(f => f.code === 'png-time') || {}).value !== '2026-01-02 03:04:05') throw new Error('tIME: ' + JSON.stringify(r.findings.find(f => f.code === 'png-time')));
});

check('values: WebP XMP and EXIF carry their fields', () => {
  const r = scanMetadata(webp([riffChunk('EXIF', bytesOf('Exif\0\0', buildExifTiff())), riffChunk('XMP ', bytesOf(XMP_SAMPLE)), WEBP_IMAGE]));
  if (fieldsOf(r, 'exif').Make !== 'FakeCam' || fieldsOf(r, 'xmp')['photoshop:City'] !== 'Fakeville') throw new Error(JSON.stringify(r.findings));
});

check('values: control characters are stripped and long values are cut to 300 characters', () => {
  const nasty = 'A\u0001B\u0007\n\tC' + 'x'.repeat(400);
  const r = scanMetadata(pngInsertAfterIhdr(pngChunk('tEXt', bytesOf('K\0', nasty))));
  const v = r.findings.find(f => f.code === 'png-text').value;
  if (/[\u0000-\u001f]/.test(v)) throw new Error('control character survived');
  if (!v.startsWith('A B C') || v.length !== 301 || !v.endsWith('…')) throw new Error(`wrong clipping: len ${v.length} start ${JSON.stringify(v.slice(0, 8))}`);
});

check('values: scanning thousands of randomly corrupted files never crashes the scanner', () => {
  let seed = 12345;
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const samples = [
    JPEG_DIRTY,
    pngInsertAfterIhdr(bytesOf(pngChunk('tEXt', bytesOf('Author\0Fake')), pngChunk('iTXt', bytesOf('XML:com.adobe.xmp\0', [0, 0], '\0\0', XMP_SAMPLE)), pngChunk('eXIf', buildExifTiff()), pngChunk('tIME', [7, 234, 1, 2, 3, 4, 5]))),
    webp([riffChunk('EXIF', bytesOf('Exif\0\0', buildExifTiff())), riffChunk('XMP ', bytesOf(XMP_SAMPLE)), WEBP_IMAGE]),
    jpegWith(jpegSegment(0xE1, bytesOf('http://ns.adobe.com/xap/1.0/\0', XMP_SAMPLE)), jpegSegment(0xFE, bytesOf('comment')))
  ];
  for (const sample of samples) {
    for (let i = 0; i < 1500; i++) {
      const mutated = Uint8Array.from(sample);
      const flips = 1 + Math.floor(rand() * 6);
      for (let k = 0; k < flips; k++) mutated[Math.floor(rand() * mutated.length)] = Math.floor(rand() * 256);
      const r = scanMetadata(mutated);
      if (r.findings.some(f => f.code === 'scan-error')) throw new Error('internal scan error on a corrupted file: ' + JSON.stringify(r.findings.find(f => f.code === 'scan-error')));
    }
  }
});

// ---- robustness: the scanner reads untrusted files, so it must never throw or hang ----
check('scanMetadata: empty and unrecognized input are "unscannable", never "clean"', () => {
  for (const input of [new Uint8Array(0), bytesOf('hello world, definitely not an image'), Uint8Array.from({ length: 64 }, (_, i) => (i * 37) & 255)]) {
    const r = scanMetadata(input);
    if (r.format !== 'unknown' || !r.unscannable || !codesOf(r).includes('unknown-format')) throw new Error('not flagged unscannable: ' + JSON.stringify(r));
  }
});

check('scanMetadata: truncated files never throw', () => {
  for (const full of [JPEG_DIRTY, pngInsertAfterIhdr(pngChunk('tEXt', bytesOf('Author\0x'))), webp([riffChunk('EXIF', buildExifTiff()), WEBP_IMAGE])]) {
    for (let cut = 0; cut < full.length; cut += 3) scanMetadata(full.subarray(0, cut));
  }
});

check('scanMetadata: an EXIF whose IFDs point at themselves terminates', () => {
  const tiff = Array.from(buildExifTiff({ gps: false, thumbnail: false }));
  // IFD0's "ExifIFD" pointer -> back to IFD0 itself (offset 8), a loop.
  const exifPtrValueAt = 8 + 2 + 3 * 12 + 8; // 4th entry (0x8769), value field
  tiff[exifPtrValueAt] = 8; tiff[exifPtrValueAt + 1] = 0; tiff[exifPtrValueAt + 2] = 0; tiff[exifPtrValueAt + 3] = 0;
  const r = scanMetadata(bytesOf(SOI, jpegSegment(0xE1, bytesOf('Exif\0\0', tiff)), JPEG_SCAN));
  if (!codesOf(r).includes('exif')) throw new Error('exif not reported');
});

check('scanMetadata: absurd EXIF entry counts and offsets do not throw or hang', () => {
  const tiff = [0x49, 0x49, 42, 0, 8, 0, 0, 0, 0xFF, 0xFF, 1, 2, 3];
  const r = scanMetadata(bytesOf(SOI, jpegSegment(0xE1, bytesOf('Exif\0\0', tiff)), JPEG_SCAN));
  if (!codesOf(r).includes('exif')) throw new Error('exif not reported');
  const r2 = scanMetadata(bytesOf(SOI, jpegSegment(0xE1, bytesOf('Exif\0\0', [0x49, 0x49, 42, 0, 0xFF, 0xFF, 0xFF, 0x7F])), JPEG_SCAN));
  if (!codesOf(r2).includes('exif')) throw new Error('exif (bad offset) not reported');
});

check('scanMetadata: an internal failure is reported as "unscannable" (fail closed), not swallowed as clean', () => {
  // A Proxy over real JPEG bytes that starts throwing partway through, to
  // force the scanner's catch path -- the one thing hostile files can't
  // easily trigger on their own.
  const flaky = new Proxy(JPEG_DIRTY, {
    get(target, prop) {
      if (prop === 'length') return target.length;
      if (typeof prop === 'string' && /^\d+$/.test(prop) && Number(prop) > 40) throw new Error('simulated read failure');
      return Reflect.get(target, prop, target);
    }
  });
  const r = scanMetadata(flaky);
  if (!r.unscannable || !codesOf(r).includes('scan-error')) throw new Error('internal failure not reported: ' + JSON.stringify(r));
});

check('scanMetadata: the scanner block uses no browser APIs (pure bytes in, plain object out)', () => {
  const codeOnly = scanMetadataCode.replace(/\/\/.*$/gm, '');
  const bad = codeOnly.match(/\b(document|window|navigator|localStorage|sessionStorage|FileReader|Blob|fetch|XMLHttpRequest|createObjectURL)\b/g);
  if (bad) throw new Error('scanner references browser API(s): ' + [...new Set(bad)].join(', '));
});

// --- metadata report + export verification (v1.2.1, step 3) --------------
// Pure logic is extracted from index.html and run as shipped. The DOM
// code (META_UI block) is run against a tiny hand-written fake `document`
// -- enough to prove what gets rendered, that a blocked export never
// reaches the download step, and that untrusted text is never turned
// into markup. It is NOT a browser test: see the manual checklist in
// the v1.2.1 CHANGELOG entry.

const i18nMetaCode = extractBetween('// I18N_METADATA_START', '// I18N_METADATA_END', 'I18N_METADATA');
const metaLogicCode = extractBetween('// META_LOGIC_START', '// META_LOGIC_END', 'META_LOGIC');
const metaUiCode = extractBetween('// META_UI_START', '// META_UI_END', 'META_UI');
const { I18N_METADATA } = new Function(`${i18nMetaCode}\nreturn { I18N_METADATA };`)();
const { officeMetadataFindings, pdfInfoMetadataFindings, summarizeExportScan, describeFinding, describeField, formatPdfDate } =
  new Function(`${scanMetadataCode}\n${metaLogicCode}\nreturn { officeMetadataFindings, pdfInfoMetadataFindings, summarizeExportScan, describeFinding, describeField, formatPdfDate };`)();
const stripLineComments = code => code.replace(/\/\/.*$/gm, '');
const LANGS = ['vi', 'en', 'fr', 'de'];

// ---- i18n completeness: all four languages, every code ----
check('i18n: EN/FR/DE/VI define exactly the same metadata keys, with the same value types', () => {
  const ref = Object.keys(I18N_METADATA.en).sort();
  for (const l of LANGS) {
    const keys = Object.keys(I18N_METADATA[l]).sort();
    if (JSON.stringify(keys) !== JSON.stringify(ref)) throw new Error(`${l} keys differ from en: ${keys.filter(k => !ref.includes(k)).concat(ref.filter(k => !keys.includes(k)).map(k => '-' + k)).join(', ')}`);
    for (const k of ref) if (typeof I18N_METADATA[l][k] !== typeof I18N_METADATA.en[k]) throw new Error(`${l}.${k} has a different type than en.${k}`);
  }
});

check('i18n: every finding code the app can produce has a label in all four languages, and no label is dead', () => {
  const produced = new Set();
  for (const m of scanMetadataCode.matchAll(/add\('([a-z-]+)'/g)) produced.add(m[1]);
  for (const m of (metaLogicCode + metaUiCode).matchAll(/code: '([a-z-]+)'/g)) produced.add(m[1]);
  for (const l of LANGS) {
    const labelled = Object.keys(I18N_METADATA[l].metaCode);
    for (const c of produced) if (!labelled.includes(c)) throw new Error(`${l}: no label for finding code "${c}"`);
    for (const c of labelled) if (!produced.has(c)) throw new Error(`${l}: label "${c}" is never produced by any code path`);
  }
});

check('i18n: translations are real (the headline strings differ from English in vi/fr/de) and no string is empty', () => {
  for (const l of ['vi', 'fr', 'de']) {
    for (const k of ['metaReportTitle', 'metaReportNone', 'metaReportFooter', 'metaGpsWarning', 'metaThumbnail']) {
      if (I18N_METADATA[l][k] === I18N_METADATA.en[k]) throw new Error(`${l}.${k} is identical to English -- untranslated?`);
    }
  }
  for (const l of LANGS) {
    for (const [k, v] of Object.entries(I18N_METADATA[l])) {
      if (typeof v === 'string' && !v.trim()) throw new Error(`${l}.${k} is empty`);
      if (typeof v === 'object') for (const [ck, cv] of Object.entries(v)) if (!String(cv).trim()) throw new Error(`${l}.metaCode.${ck} is empty`);
    }
    for (const fn of ['verifyOk', 'verifyInfoNote', 'verifyBlockedSensitive', 'verifyBlockedUnscannable']) {
      const out = I18N_METADATA[l][fn]('MARKER-123');
      if (typeof out !== 'string' || !out.includes('MARKER-123')) throw new Error(`${l}.${fn} does not include its argument`);
    }
  }
});

check('i18n: the report title is neutral -- it is shown whether or not anything was found, so it must not claim that something was', () => {
  const claims = { en: /found/i, vi: /tìm thấy/i, fr: /trouvé/i, de: /gefunden/i };
  for (const l of LANGS) if (claims[l].test(I18N_METADATA[l].metaReportTitle)) throw new Error(`${l} title claims a finding: "${I18N_METADATA[l].metaReportTitle}"`);
});

// ---- officeMetadataFindings ----
const OFFICE_CORE_DIRTY = '<cp:coreProperties xmlns:cp="x" xmlns:dc="y" xmlns:dcterms="z"><dc:creator>Fake Person</dc:creator><cp:lastModifiedBy>Other Fake</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-01-02T03:04:05Z</dcterms:created><dc:title></dc:title><dc:subject>   </dc:subject><cp:keywords/></cp:coreProperties>';
check('officeMetadataFindings: reports non-blank core/app fields by name, ignores empty or blank ones', () => {
  const f = officeMetadataFindings(OFFICE_CORE_DIRTY, '<Properties><Application>FakeOffice</Application><Company>Fake GmbH</Company><Manager></Manager></Properties>', []);
  const names = f.filter(x => x.code === 'office-field').map(x => x.detail).sort();
  if (JSON.stringify(names) !== JSON.stringify(['Application', 'Company', 'Created', 'Creator', 'LastModifiedBy'])) throw new Error('got ' + JSON.stringify(names));
  if (f.some(x => x.severity !== 'sensitive')) throw new Error('all office findings must be sensitive');
});
check('officeMetadataFindings: comments, custom properties and preview thumbnails are found from the archive entry names', () => {
  const docx = officeMetadataFindings('', '', ['word/document.xml', 'word/comments.xml', 'docProps/custom.xml', 'docProps/thumbnail.jpeg']).map(f => f.code).sort();
  if (JSON.stringify(docx) !== JSON.stringify(['office-comments', 'office-custom', 'office-thumbnail'])) throw new Error('docx: ' + JSON.stringify(docx));
  const pptx = officeMetadataFindings('', '', ['ppt/slides/slide1.xml', 'ppt/comments/comment1.xml']).map(f => f.code);
  if (JSON.stringify(pptx) !== '["office-comments"]') throw new Error('pptx: ' + JSON.stringify(pptx));
});
check('officeMetadataFindings: a bare document with no properties is clean', () => {
  if (officeMetadataFindings('', '', ['word/document.xml', '[Content_Types].xml']).length) throw new Error('expected nothing');
  if (officeMetadataFindings(undefined, undefined, undefined).length) throw new Error('undefined inputs must not throw or report');
});

// ---- pdfInfoMetadataFindings ----
check('pdfInfoMetadataFindings: reports non-blank Info fields by name, plus XMP', () => {
  const f = pdfInfoMetadataFindings({ Title: 'Fake', Author: '  ', Producer: 'FakePDF 1.0', PDFFormatVersion: '1.7', IsAcroFormPresent: false }, true);
  const fields = f.filter(x => x.code === 'pdf-field').map(x => x.detail).sort();
  if (JSON.stringify(fields) !== JSON.stringify(['Producer', 'Title'])) throw new Error('fields: ' + JSON.stringify(fields));
  if (!f.some(x => x.code === 'pdf-xmp')) throw new Error('pdf-xmp missing');
  if (pdfInfoMetadataFindings({}, false).length || pdfInfoMetadataFindings(null, false).length) throw new Error('empty/null info must be clean');
});

// ---- values in the office / PDF findings and in describeFinding ----
check('office values: field values are carried (blank ones skipped, XML entities decoded, whitespace collapsed)', () => {
  const f = officeMetadataFindings('<cp:coreProperties><dc:creator>Fake &amp; Co</dc:creator><cp:lastModifiedBy>  Other\n Fake </cp:lastModifiedBy><dc:title>   </dc:title></cp:coreProperties>', '<Properties><Company>Fake GmbH</Company></Properties>', []);
  const by = Object.fromEntries(f.map(x => [x.detail, x.value]));
  if (by.Creator !== 'Fake & Co' || by.LastModifiedBy !== 'Other Fake' || by.Company !== 'Fake GmbH' || 'Title' in by) throw new Error(JSON.stringify(by));
});

check('pdf values: Info field values are carried and dates are formatted', () => {
  const f = pdfInfoMetadataFindings({ Producer: 'FakePDF 1.0', CreationDate: "D:20260105123000+01'00'", ModDate: 'D:20260105123000Z', Author: 'Fake Person' }, false);
  const by = Object.fromEntries(f.map(x => [x.detail, x.value]));
  if (by.Producer !== 'FakePDF 1.0' || by.Author !== 'Fake Person') throw new Error(JSON.stringify(by));
  if (by.CreationDate !== '2026-01-05 12:30:00 +01:00' || by.ModDate !== '2026-01-05 12:30:00 UTC') throw new Error('dates: ' + JSON.stringify(by));
});

check('formatPdfDate: partial dates are padded; unparseable text is shown as written', () => {
  if (formatPdfDate('D:20260105') !== '2026-01-05 00:00:00') throw new Error(formatPdfDate('D:20260105'));
  if (formatPdfDate("D:20260105123000-05'30'") !== '2026-01-05 12:30:00 -05:30') throw new Error(formatPdfDate("D:20260105123000-05'30'"));
  if (formatPdfDate('yesterday') !== 'yesterday') throw new Error('should return the raw text');
});

check('describeFinding: values are appended only on request; describeField follows the same switch', () => {
  const t = I18N_METADATA.en;
  const f = { code: 'pdf-field', severity: 'sensitive', detail: 'Producer', value: 'FakePDF 1.0' };
  if (describeFinding(t, f) !== 'PDF field: Producer') throw new Error(describeFinding(t, f));
  if (describeFinding(t, f, true) !== 'PDF field: Producer = FakePDF 1.0') throw new Error(describeFinding(t, f, true));
  if (describeField({ name: 'Make', value: 'FakeCam' }, true) !== 'Make: FakeCam' || describeField({ name: 'Make', value: 'FakeCam' }, false) !== 'Make') throw new Error('describeField');
});

// ---- summarizeExportScan: the block / allow decision ----
check('summarizeExportScan: clean = ok; ICC-only = ok with info; sensitive and unscannable both block', () => {
  if (!summarizeExportScan(scanMetadata(JPEG_CLEAN)).ok) throw new Error('clean JPEG should pass');
  const icc = summarizeExportScan(scanMetadata(JPEG_ICC_ONLY));
  if (!icc.ok || icc.info.length !== 1) throw new Error('ICC-only should pass with 1 info finding: ' + JSON.stringify(icc));
  const dirty = summarizeExportScan(scanMetadata(JPEG_DIRTY));
  if (dirty.ok || dirty.reason !== 'sensitive') throw new Error('dirty JPEG must block as sensitive: ' + JSON.stringify(dirty));
  const unknown = summarizeExportScan(scanMetadata(bytesOf('not a known format')));
  if (unknown.ok || unknown.reason !== 'unscannable') throw new Error('unknown format must block as unscannable: ' + JSON.stringify(unknown));
  const flagOnly = summarizeExportScan({ findings: [], hasSensitive: false, hasGps: false, unscannable: true });
  if (flagOnly.ok) throw new Error('scan.unscannable alone must still block');
});

// ---- describeFinding ----
check('describeFinding: localizes label and the EXIF thumbnail/unparsed tokens; unknown codes fall back to the code', () => {
  for (const l of LANGS) {
    const t = I18N_METADATA[l];
    const text = describeFinding(t, { code: 'exif', severity: 'sensitive', detail: 'Make, GPS, thumbnail, unparsed' });
    if (!text.startsWith(t.metaCode.exif)) throw new Error(`${l}: label missing: ${text}`);
    if (!text.includes(t.metaThumbnail) || !text.includes(t.metaUnparsed) || !text.includes('Make, GPS')) throw new Error(`${l}: tokens not localized: ${text}`);
  }
  if (describeFinding(I18N_METADATA.en, { code: 'made-up', severity: 'info' }) !== 'made-up') throw new Error('unknown code should fall back to itself');
});

// ---- the UI block, against a fake DOM ----
function makeUiHarness() {
  const clicks = [];
  const byId = new Map();
  const makeEl = (tag) => ({
    tag, children: [], style: {}, className: '', _text: '',
    get textContent() { return this._text + this.children.map(c => c.textContent).join(''); },
    set textContent(v) { this._text = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(type, fn) { (this.listeners = this.listeners || {})[type] = fn; }
  });
  const doc = {
    getElementById(id) { if (!byId.has(id)) byId.set(id, makeEl('div')); return byId.get(id); },
    createElement(tag) { const el = makeEl(tag); if (tag === 'a') el.click = () => clicks.push({ download: el.download }); return el; },
    body: { appendChild() {}, removeChild() {} }
  };
  const source = `
    let currentLang = 'en';
    ${i18nMetaCode}
    const I18N = I18N_METADATA;
    ${scanMetadataCode}
    ${metaLogicCode}
    ${metaUiCode}
    return { deliverVerifiedFile, showInputMetaReport, readPdfMetadataFindings, clearVerify, resetInputMetaReport, rerenderMetadataUi, setLang: (l) => { currentLang = l; } };
  `;
  const api = new Function('document', source)(doc);
  return { api, doc, clicks, byId, el: id => doc.getElementById(id) };
}
const fakeFile = (bytes, delayMs = 0) => ({ arrayBuffer: () => new Promise(res => setTimeout(() => res(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)), delayMs)) });

await checkAsync('UI: a clean export is downloaded and shows the green "verified" line', async () => {
  const h = makeUiHarness();
  const doc = await createCleanPdf();
  doc.addPage([100, 100]);
  const ok = await h.api.deliverVerifiedFile(await saveCleanPdf(doc), 'application/pdf', 'redacted-document.pdf', 'pdfVerify');
  const el = h.el('pdfVerify');
  if (ok !== true || h.clicks.length !== 1 || h.clicks[0].download !== 'redacted-document.pdf') throw new Error('clean file was not downloaded: ' + JSON.stringify(h.clicks));
  if (el.className !== 'export-verify ok' || !el.textContent.includes('Verified') || !el.textContent.includes('PDF')) throw new Error('verify line wrong: ' + el.className + ' / ' + el.textContent);
});

await checkAsync('UI: an export that still carries metadata is BLOCKED -- nothing is downloaded and the red line names what was found', async () => {
  const h = makeUiHarness();
  const ok = await h.api.deliverVerifiedFile(JPEG_DIRTY, 'image/jpeg', 'redacted-image.jpg', 'imgVerify');
  const el = h.el('imgVerify');
  if (ok !== false || h.clicks.length !== 0) throw new Error('a dirty file reached the download step');
  if (el.className !== 'export-verify blocked' || !el.textContent.includes('DOWNLOAD BLOCKED') || !el.textContent.includes('EXIF')) throw new Error('blocked line wrong: ' + el.className + ' / ' + el.textContent);
});

await checkAsync('UI: a file that cannot be verified is BLOCKED too (fail closed)', async () => {
  const h = makeUiHarness();
  const ok = await h.api.deliverVerifiedFile(bytesOf('mystery bytes'), 'application/pdf', 'x.pdf', 'docxVerify');
  if (ok !== false || h.clicks.length !== 0) throw new Error('an unverifiable file reached the download step');
  if (!h.el('docxVerify').textContent.includes('could not be verified')) throw new Error(h.el('docxVerify').textContent);
});

await checkAsync('UI: an ICC-only JPEG is downloaded, with a note that only technical data remains', async () => {
  const h = makeUiHarness();
  const ok = await h.api.deliverVerifiedFile(JPEG_ICC_ONLY, 'image/jpeg', 'redacted-image.jpg', 'imgVerify');
  if (ok !== true || h.clicks.length !== 1) throw new Error('ICC-only file should download');
  if (!h.el('imgVerify').textContent.includes('Only technical data remains')) throw new Error(h.el('imgVerify').textContent);
});

await checkAsync('UI: switching language re-renders the verdict, and clearVerify hides it', async () => {
  const h = makeUiHarness();
  await h.api.deliverVerifiedFile(JPEG_DIRTY, 'image/jpeg', 'x.jpg', 'imgVerify');
  const expectations = { de: 'DOWNLOAD BLOCKIERT', fr: 'TÉLÉCHARGEMENT BLOQUÉ', vi: 'ĐÃ CHẶN TẢI XUỐNG', en: 'DOWNLOAD BLOCKED' };
  for (const [lang, needle] of Object.entries(expectations)) {
    h.api.setLang(lang);
    h.api.rerenderMetadataUi();
    if (!h.el('imgVerify').textContent.includes(needle)) throw new Error(`${lang}: expected "${needle}" in "${h.el('imgVerify').textContent}"`);
  }
  h.api.clearVerify('imgVerify');
  if (h.el('imgVerify').style.display !== 'none' || h.el('imgVerify').textContent !== '') throw new Error('clearVerify did not hide the line');
});

const findNode = (root, pred) => { const walk = n => [n, ...n.children.flatMap(walk)]; return walk(root).find(pred); };

await checkAsync('UI: a clean file shows the neutral title with the "none found" line, with no contradiction', async () => {
  const h = makeUiHarness();
  await h.api.showInputMetaReport('image', fakeFile(JPEG_CLEAN));
  const text = h.el('inputMetaReport').textContent;
  if (!text.startsWith('Metadata of the original file') || !text.includes('No identifying metadata was found')) throw new Error(text);
  if (/Metadata found/i.test(text)) throw new Error('title contradicts the body: ' + text);
});

await checkAsync('UI: the input report shows the VALUES (EXIF tags and GPS position), a Hide button, and the local-only note', async () => {
  const h = makeUiHarness();
  await h.api.showInputMetaReport('image', fakeFile(JPEG_DIRTY));
  const text = h.el('inputMetaReport').textContent;
  for (const needle of ['Metadata of the original file', 'EXIF', 'Make: FakeCam', 'Model: Model-X', 'GPSPosition: 10.500000, 20.250000', 'embedded thumbnail', 'This file contains GPS location data', 'Values are shown only on your computer', 'Hide values']) {
    if (!text.includes(needle)) throw new Error(`"${needle}" missing from report: ${text}`);
  }
  await h.api.showInputMetaReport('image', fakeFile(JPEG_CLEAN));
  const clean = h.el('inputMetaReport').textContent;
  if (!clean.includes('No identifying metadata was found') || clean.includes('Hide values')) throw new Error('clean file: ' + clean);
});

await checkAsync('UI: the Hide values button masks every value (names stay), toggles back, and the choice survives the next file and a language switch', async () => {
  const h = makeUiHarness();
  await h.api.showInputMetaReport('image', fakeFile(JPEG_DIRTY));
  const click = () => findNode(h.el('inputMetaReport'), n => n.tag === 'button').listeners.click();
  click();
  let text = h.el('inputMetaReport').textContent;
  for (const secret of ['FakeCam', 'Model-X', 'FakeSoft', '10.500000', '2026:01:02']) if (text.includes(secret)) throw new Error(`value "${secret}" still visible after Hide: ${text}`);
  for (const name of ['Make', 'Model', 'GPSPosition']) if (!text.includes(name)) throw new Error(`field name "${name}" should stay visible: ${text}`);
  if (!text.includes('Show values') || text.includes('Values are shown only')) throw new Error('button/note not updated: ' + text);
  await h.api.showInputMetaReport('image', fakeFile(JPEG_DIRTY));            // next file keeps the choice
  if (h.el('inputMetaReport').textContent.includes('FakeCam')) throw new Error('hidden state was reset by a new file');
  h.api.setLang('de'); h.api.rerenderMetadataUi();                            // language switch keeps it too
  text = h.el('inputMetaReport').textContent;
  if (text.includes('FakeCam') || !text.includes('Werte anzeigen')) throw new Error('de: ' + text);
  findNode(h.el('inputMetaReport'), n => n.tag === 'button').listeners.click();
  if (!h.el('inputMetaReport').textContent.includes('Make: FakeCam')) throw new Error('values should be back after the second click');
});

await checkAsync('UI: the export verdict names what was found but never repeats the values', async () => {
  const h = makeUiHarness();
  await h.api.deliverVerifiedFile(JPEG_DIRTY, 'image/jpeg', 'x.jpg', 'imgVerify');
  const text = h.el('imgVerify').textContent;
  if (!text.includes('DOWNLOAD BLOCKED') || !text.includes('Make')) throw new Error('verdict should still name the fields: ' + text);
  for (const secret of ['FakeCam', 'Model-X', '10.500000', 'Fake Person']) if (text.includes(secret)) throw new Error(`verdict leaked a value: ${secret}`);
});

await checkAsync('UI: a hostile VALUE (markup in a text chunk) is rendered as text, never as an element', async () => {
  const h = makeUiHarness();
  const png = pngInsertAfterIhdr(pngChunk('tEXt', bytesOf('Note\0<b onclick=alert(1)>bold</b>')));
  await h.api.showInputMetaReport('image', fakeFile(png));
  if (findNode(h.el('inputMetaReport'), n => n.tag === 'b')) throw new Error('a <b> element was created from a metadata value');
  if (!h.el('inputMetaReport').textContent.includes('<b onclick=alert(1)>bold</b>')) throw new Error('the hostile value should be visible as plain text');
});

await checkAsync('UI: a slow report for an older file cannot overwrite the report for a newer one', async () => {
  const h = makeUiHarness();
  const slowDirty = h.api.showInputMetaReport('image', fakeFile(JPEG_DIRTY, 40));
  const fastClean = h.api.showInputMetaReport('image', fakeFile(JPEG_CLEAN, 0));
  await Promise.all([slowDirty, fastClean]);
  const text = h.el('inputMetaReport').textContent;
  if (text.includes('EXIF') || !text.includes('No identifying metadata was found')) throw new Error('stale report won the race: ' + text);
});

await checkAsync('UI: text that came out of a scanned file is rendered as text, never as markup', async () => {
  const h = makeUiHarness();
  const evil = '<img src=x onerror=alert(1)>';
  const png = pngInsertAfterIhdr(pngChunk('tEXt', bytesOf(evil + '\0v')));
  await h.api.showInputMetaReport('image', fakeFile(png));
  const walk = el => [el, ...el.children.flatMap(walk)];
  const tags = walk(h.el('inputMetaReport')).map(n => n.tag);
  if (tags.includes('img')) throw new Error('an <img> element was created from file metadata');
  if (!h.el('inputMetaReport').textContent.includes(evil)) throw new Error('the hostile keyword should be visible as plain text');
});

// ---- PDF input report (regression: "doc.destroy is not a function") ----
// pdf.js 6.x has no destroy() on the document object -- only on the loading
// task. This fake mirrors that exact shape: if the code calls doc.destroy()
// again, it throws here just like it did in the browser.
function fakePdfjs({ info = {}, xmp = null, failMetadata = false } = {}) {
  const state = { destroyed: false };
  const doc = { async getMetadata() { if (failMetadata) throw new Error('boom'); return { info, metadata: xmp }; } }; // no destroy()
  return { state, lib: { getDocument: () => ({ promise: Promise.resolve(doc), async destroy() { state.destroyed = true; } }) } };
}
const pdfFakeFile = { arrayBuffer: async () => new ArrayBuffer(8) };

await checkAsync('PDF input report: lists the Info fields and XMP, and cleans up through the loading task (document has no destroy)', async () => {
  const h = makeUiHarness();
  const f = fakePdfjs({ info: { Author: 'Fake Person', Producer: 'FakePDF', Title: '' }, xmp: {} });
  const findings = await h.api.readPdfMetadataFindings(pdfFakeFile, f.lib);
  const fields = findings.filter(x => x.code === 'pdf-field').map(x => x.detail).sort();
  if (JSON.stringify(fields) !== JSON.stringify(['Author', 'Producer'])) throw new Error('fields: ' + JSON.stringify(findings));
  if (!findings.some(x => x.code === 'pdf-xmp')) throw new Error('XMP not reported');
  if (!f.state.destroyed) throw new Error('loading task was not destroyed');
});

await checkAsync('PDF input report: a failure while reading still cleans up, and the error reaches the report as "scan error"', async () => {
  const h = makeUiHarness();
  const f = fakePdfjs({ failMetadata: true });
  let threw = false;
  try { await h.api.readPdfMetadataFindings(pdfFakeFile, f.lib); } catch (e) { threw = e.message === 'boom'; }
  if (!threw) throw new Error('the read error should propagate to showInputMetaReport');
  if (!f.state.destroyed) throw new Error('cleanup skipped after an error');
});

await checkAsync('PDF input report: a cleanup failure never replaces the metadata that was already read', async () => {
  const originalWarn = console.warn;
  console.warn = () => {}; // the cleanup failure is deliberate here; keep the test output quiet
  try {
    const h = makeUiHarness();
    const f = fakePdfjs({ info: { Author: 'Fake Person' } });
    const lib = { getDocument: (...a) => { const t = f.lib.getDocument(...a); t.destroy = async () => { throw new Error('destroy failed'); }; return t; } };
    const findings = await h.api.readPdfMetadataFindings(pdfFakeFile, lib);
    if (!findings.some(x => x.code === 'pdf-field' && x.detail === 'Author')) throw new Error('metadata lost to a cleanup error: ' + JSON.stringify(findings));
  } finally { console.warn = originalWarn; }
});

// ---- static guards: the wiring itself ----
check('guard: every export goes through deliverVerifiedFile (5 calls) and only 3 anchors assign a download name', () => {
  const calls = html.split('await deliverVerifiedFile(').length - 1;
  if (calls !== 5) throw new Error(`expected 5 "await deliverVerifiedFile(" calls (image, image->PDF, PDF, Word, PowerPoint), found ${calls}`);
  const anchors = (html.match(/a\.download\s*=/g) || []).length;
  if (anchors !== 3) throw new Error(`expected exactly 3 "a.download =" assignments (custom-terms JSON, text export, deliverVerifiedFile), found ${anchors} -- a new download path must go through deliverVerifiedFile`);
});

check('guard: deliverVerifiedFile returns before creating the download when the summary is not ok', () => {
  const body = metaUiCode.slice(metaUiCode.indexOf('async function deliverVerifiedFile'));
  const guardAt = body.indexOf('if (!summary.ok) return false;');
  const blobAt = body.indexOf('new Blob(');
  if (guardAt === -1 || blobAt === -1 || guardAt > blobAt) throw new Error('the not-ok early return must come before the Blob/anchor download code');
});

check('guard: the UI block never writes untrusted text as markup (no innerHTML / insertAdjacentHTML / outerHTML / document.write)', () => {
  const bad = stripLineComments(metaUiCode).match(/\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/g);
  if (bad) throw new Error('markup-writing API used in the metadata UI block: ' + [...new Set(bad)].join(', '));
});

check('guard: routeFile resets the old verdict, shows the new report, and the 4 clear/scan handlers reset their verdict; HTML has the containers', () => {
  for (const needle of ['clearAllExportVerify();', 'resetInputMetaReport();', 'showInputMetaReport(type, file);', 'rerenderMetadataUi();']) {
    if (!html.includes(needle)) throw new Error(`missing wiring: ${needle}`);
  }
  for (const id of ['inputMetaReport', 'imgVerify', 'pdfVerify', 'docxVerify', 'pptxVerify']) {
    if (!html.includes(`id="${id}"`)) throw new Error(`missing HTML element #${id}`);
  }
  for (const id of ['imgVerify', 'pdfVerify', 'docxVerify', 'pptxVerify']) {
    if (html.split(`clearVerify('${id}');`).length - 1 < 2) throw new Error(`clearVerify('${id}') should be called from both its scan and clear handlers`);
  }
});

// --- OCR matching and thorough scan (v1.2.1) -----------------------------
// Pure helpers behind the image panel. The fixture below is REAL Tesseract
// output (4.1.1 with the vendored Vietnamese model) for a synthetic flyer I
// drew for this purpose: a white-on-orange heading "AN TOÀN", and a card
// where "an" ends one line and "toàn" starts the next. The engine put the
// two stray noise words "r" and "." into the same OCR "line" as that card's
// first line, between "an" and "toàn" -- exactly the kind of mess that makes
// per-line matching miss a phrase. Coordinates are left, top, right, bottom.

const W = (text, x0, y0, x1, y1) => ({ text, bbox: { x0, y0, x1, y1 } });
const REAL_LINE_1 = [W('AN', 150, 439, 211, 468), W('TOÀN', 228, 431, 350, 468), W('(Điều', 492, 442, 547, 464), W('21)', 558, 444, 591, 464), W('&', 601, 445, 616, 461), W('bối', 626, 442, 655, 461), W('cảnh', 665, 443, 716, 461), W('an', 726, 449, 750, 461)];
const REAL_LINE_2 = [W('r', 189, 491, 202, 496), W('.', 326, 491, 339, 496), W('toàn', 490, 475, 538, 493), W('dữ', 548, 476, 575, 493), W('liệu', 583, 475, 619, 497)];
const REAL_LINE_3 = [W('KY', 154, 499, 210, 528), W('THUẠT', 224, 499, 375, 536)];
const REAL_WORDS = [...REAL_LINE_1, ...REAL_LINE_2, ...REAL_LINE_3];

check('foldForMatch: accents and case fold, length is preserved, composed and decomposed input agree', () => {
  if (foldForMatch('TOÀN', false) !== 'toan') throw new Error(foldForMatch('TOÀN', false));
  if (foldForMatch('TOÀN', true) !== 'TOAN') throw new Error('case-sensitive mode must keep case: ' + foldForMatch('TOÀN', true));
  if (foldForMatch('Đường đi', false) !== 'duong di' || foldForMatch('Đường', true) !== 'Duong') throw new Error('đ/Đ not folded');
  const sample = 'Phạm Nguyễn Hải Đăng — Köln, François';
  if (foldForMatch(sample, false).length !== sample.length) throw new Error('length changed');
  if (foldForMatch('toa\u0300n'.normalize('NFC'), false) !== 'toan') throw new Error('decomposed input not handled after NFC');
});

check('foldedCustomSpans: a term with accents matches the same letters without accents, in any case', () => {
  const spans = foldedCustomSpans('x AN TOAN y an toàn z', ['an toàn'], false);
  if (spans.length !== 2 || spans[0].start !== 2 || spans[0].end !== 9) throw new Error(JSON.stringify(spans));
  if (foldedCustomSpans('AN TOAN', ['an toàn'], true).length !== 0) throw new Error('case-sensitive mode matched a different case');
  if (foldedCustomSpans('an toan', ['an toàn'], true).length !== 1) throw new Error('case-sensitive mode should still ignore accents');
});

check('wordsToRedact: OCR that dropped the accents ("AN TOAN") still matches the custom term "an toàn"', () => {
  const words = [W('AN', 0, 0, 30, 20), W('TOAN', 45, 0, 110, 20)];
  const { flagged } = wordsToRedact(words, [], ['an toàn'], false, false);
  if (flagged.size !== 2) throw new Error('flagged ' + [...flagged]);
  const strict = wordsToRedact(words, [], ['an toàn'], true, false);
  if (strict.flagged.size !== 0) throw new Error('case-sensitive "an toàn" must not match "AN TOAN"');
});

check('wordsToRedact: decomposed (NFD) OCR text matches a composed custom term', () => {
  const words = [W('toa\u0300n', 0, 0, 60, 20)];
  if (wordsToRedact(words, [], ['toàn'], false, false).flagged.size !== 1) throw new Error('NFD word not matched');
});

check('findPhraseWordMatches: "an" ending one line and "toàn" starting the next match despite OCR noise between them', () => {
  const hits = findPhraseWordMatches(REAL_WORDS, ['an toàn'], false);
  const got = [...hits].sort((a, b) => a - b).map(i => REAL_WORDS[i].text + '@' + REAL_WORDS[i].bbox.x0);
  const want = ['AN@150', 'TOÀN@228', 'an@726', 'toàn@490'];
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error('got ' + JSON.stringify(got));
});

check('findPhraseWordMatches: accents/case folding, trailing punctuation and 3-word terms', () => {
  const line = [W('trực', 0, 0, 40, 20), W('tuyến', 55, 0, 110, 20), W('AN', 125, 0, 150, 20), W('TOAN,', 165, 0, 220, 20)];
  const hits = findPhraseWordMatches(line, ['tuyến an toàn'], false);
  if (hits.size !== 3 || hits.has(0)) throw new Error('got ' + [...hits]);
});

check('findPhraseWordMatches: the wrong order, a word to the right of a wrapped line, or words far apart do not match', () => {
  if (findPhraseWordMatches([W('toàn', 0, 0, 50, 20), W('an', 65, 0, 90, 20)], ['an toàn'], false).size !== 0) throw new Error('wrong order matched');
  // "toàn" on the next line but starting RIGHT of "an": not a wrapped continuation
  if (findPhraseWordMatches([W('an', 100, 0, 130, 20), W('toàn', 300, 30, 350, 50)], ['an toàn'], false).size !== 0) throw new Error('unwrapped lower-right word matched');
  if (findPhraseWordMatches([W('an', 100, 0, 130, 20), W('toàn', 20, 400, 70, 420)], ['an toàn'], false).size !== 0) throw new Error('distant word matched');
  if (findPhraseWordMatches([W('an', 100, 0, 130, 20), W('toàn', 150, 100, 200, 120)], ['an toàn'], false).size !== 0) throw new Error('word far below matched');
});

check('findPhraseWordMatches: single-word terms are left to the normal matcher, and the search is bounded', () => {
  if (findPhraseWordMatches(REAL_WORDS, ['toàn'], false).size !== 0) throw new Error('single-word term handled here');
  const many = Array.from({ length: 400 }, (_, i) => W('a', i * 12, 0, i * 12 + 10, 20));
  findPhraseWordMatches(many, ['a a a a a a a a a a'], false); // must return (budgeted), not hang
});

check('planOcrPasses: one untouched pass normally; two enlarged channel passes in thorough mode (not enlarged when the image is large)', () => {
  const normal = planOcrPasses(910, 1217, false);
  if (normal.length !== 1 || normal[0].mode !== null || normal[0].scale !== 1 || normal[0].psm !== null) throw new Error(JSON.stringify(normal));
  const thorough = planOcrPasses(910, 1217, true);
  if (thorough.length !== 3 || thorough[0].id !== 'original') throw new Error(JSON.stringify(thorough));
  if (thorough[1].scale !== 2 || thorough[2].scale !== 2 || thorough[1].psm !== '11' || thorough[2].mode !== 'min-inverted') throw new Error(JSON.stringify(thorough));
  if (planOcrPasses(2600, 1800, true)[1].scale !== 1) throw new Error('large image must not be enlarged');
});

check('ocrGrayPixels: darkest-channel gray separates white text from an orange background far better than luminance', () => {
  const px = Uint8ClampedArray.from([255, 255, 255, 255,  230, 120, 30, 255,  20, 40, 90, 255,  235, 235, 240, 255]);
  const min = ocrGrayPixels(px, 'min');
  if (min[0] !== 255 || min[4] !== 30 || min[8] !== 20 || min[12] !== 235 || min[3] !== 255) throw new Error('min: ' + [...min]);
  const inv = ocrGrayPixels(px, 'min-inverted');
  if (inv[0] !== 0 || inv[4] !== 225) throw new Error('min-inverted: ' + [...inv]);
  const max = ocrGrayPixels(px, 'max');
  if (max[4] !== 230) throw new Error('max: ' + [...max]);
  const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const lumContrast = lum([255, 255, 255]) - lum([230, 120, 30]);
  if (!(min[0] - min[4] > 1.8 * lumContrast)) throw new Error(`channel contrast ${min[0] - min[4]} should clearly beat luminance contrast ${lumContrast}`);
});

check('scaleWords: boxes found on an enlarged canvas map back to the original size without touching the input', () => {
  const words = [{ text: 'an', confidence: 90, bbox: { x0: 200, y0: 100, x1: 260, y1: 140 } }];
  const back = scaleWords(words, 2);
  if (JSON.stringify(back[0].bbox) !== JSON.stringify({ x0: 100, y0: 50, x1: 130, y1: 70 }) || back[0].text !== 'an' || back[0].confidence !== 90) throw new Error(JSON.stringify(back));
  if (words[0].bbox.x0 !== 200) throw new Error('input was modified');
  if (scaleWords(words, 1) !== words) throw new Error('scale 1 should return the same words');
});

check('ocrLangMismatch: accented custom terms with an English-only OCR language are flagged', () => {
  if (!ocrLangMismatch(['an toàn'], 'eng') || ocrLangMismatch(['an toan'], 'eng') || ocrLangMismatch(['an toàn'], 'vie')) throw new Error('wrong mismatch result');
});

check('wasmAvailable / isWasmError: Lockdown-Mode style environments are recognised, the real error messages of each engine too', () => {
  if (wasmAvailable({}) || wasmAvailable(null) || wasmAvailable({ WebAssembly: {} }) || wasmAvailable({ WebAssembly: null })) throw new Error('missing/broken WebAssembly reported as available');
  if (!wasmAvailable({ WebAssembly: { instantiate() {} } })) throw new Error('a working WebAssembly reported as unavailable');
  if (!wasmAvailable(globalThis)) throw new Error('Node itself has WebAssembly');
  for (const message of ["ReferenceError: Can't find variable: WebAssembly", 'WebAssembly is not defined', "undefined is not an object (evaluating 'WebAssembly.validate')"]) {
    if (!isWasmError(new Error(message)) || !isWasmError(message)) throw new Error('not recognised: ' + message);
  }
  if (isWasmError(new Error('Failed to fetch')) || isWasmError(null) || isWasmError(undefined)) throw new Error('unrelated error recognised as a WebAssembly error');
});

// ---- the whole redaction step, with a recording canvas context ----
function recordingCtx() {
  const fills = [];
  return { fills, fillStyle: '', strokeStyle: '', lineWidth: 0, fillRect(...a) { fills.push(a); }, strokeRect() {}, save() {}, restore() {} };
}

check('redactWordsOnCanvas: the phrase split across lines and the accent-less heading are both filled, each region once', () => {
  const ctx = recordingCtx();
  const { redactedCount } = redactWordsOnCanvas(ctx, [REAL_LINE_1, REAL_LINE_2, REAL_LINE_3], [], ['an toàn'], false, false);
  // AN, TOÀN (heading, same OCR line), an (end of line), toàn (next line): 4 regions, no more
  if (redactedCount !== 4 || ctx.fills.length !== 4) throw new Error(`expected 4 regions, got ${redactedCount} / ${ctx.fills.length}`);
  const xs = ctx.fills.map(f => f[0] + 2).sort((a, b) => a - b);
  if (JSON.stringify(xs) !== JSON.stringify([150, 228, 490, 726])) throw new Error('filled the wrong words: ' + xs);
});

check('redactWordsOnCanvas: the same text found again by an extra OCR pass is not filled or counted twice, and extra passes add no entropy suspects', () => {
  const ctx = recordingCtx();
  const pass2 = REAL_LINE_1.map(w => ({ ...w, bbox: { ...w.bbox } }));
  pass2.extraPass = true;
  const noisy = [W('Zk9qLm3VxQ7rTb2Np', 10, 600, 200, 620)];
  noisy.extraPass = true;
  const { redactedCount, suspects } = redactWordsOnCanvas(ctx, [REAL_LINE_1, REAL_LINE_2, pass2, noisy], [], ['an toàn'], false, true);
  if (redactedCount !== 4) throw new Error('duplicates were counted: ' + redactedCount);
  if (suspects.length !== 0) throw new Error('an extra pass produced entropy suspects: ' + JSON.stringify(suspects));
});

check('redactWordsOnCanvas: a custom term is not filled where the text does not contain it', () => {
  const ctx = recordingCtx();
  const { redactedCount } = redactWordsOnCanvas(ctx, [[W('hello', 0, 0, 50, 20), W('world', 60, 0, 110, 20)]], [], ['an toàn'], false, false);
  if (redactedCount !== 0 || ctx.fills.length) throw new Error('filled without a match');
});

// ---- extra-pass noise (v1.2.1 follow-up) ----
// Found by replaying real Tesseract output for a faithful synthetic copy of
// the flyer through the shipped code: in the inverted extra pass, at 2 of 8
// degradation levels, the engine read decoration as the token "1111110)" /
// "111111)" (51x14 px). That is a valid phone-number pattern, so the phone
// rule filled a bogus black box. Extra-pass pattern matches must look real.

check('plausibleRuleMatch: repeated-digit noise is rejected for phone/card patterns; real numbers and other rules pass', () => {
  for (const noise of ['1111110)', '111111)', '1111111', '0000 0000']) if (plausibleRuleMatch('phone', noise)) throw new Error('noise accepted as a phone number: ' + noise);
  for (const real of ['0912 345 678', '+49 221 1234567', '(030) 123-4567']) if (!plausibleRuleMatch('phone', real)) throw new Error('real number rejected: ' + real);
  if (plausibleRuleMatch('creditcard', '1111 1111 1111 1111') || !plausibleRuleMatch('creditcard', '4539 1488 0343 6467')) throw new Error('creditcard plausibility wrong');
  for (const rule of ['email', 'ipv4', 'ipv6', 'apikey', 'dburi', 'dbkv', 'dbport', 'custom']) if (!plausibleRuleMatch(rule, '1.1.1.1')) throw new Error(rule + ' must not be filtered');
});

check('wordsToRedact: in a low-trust (extra pass) line digit noise is not redacted; the same line in the first pass still is, and custom terms are never filtered', () => {
  const noise = [W('1111110)', 536, 613, 587, 627)];
  const phone = RULES.filter(r => r.id === 'phone');
  if (wordsToRedact(noise, phone, [], false, false, 'low').flagged.size !== 0) throw new Error('noise redacted in a low-trust line');
  if (wordsToRedact(noise, phone, [], false, false, 'full').flagged.size !== 1) throw new Error('first-pass behaviour changed');
  if (wordsToRedact(noise, phone, [], false, false).flagged.size !== 1) throw new Error('default trust must stay "full"');
  const real = [W('0912', 0, 0, 40, 20), W('345', 50, 0, 80, 20), W('678', 90, 0, 120, 20)];
  if (wordsToRedact(real, phone, [], false, false, 'low').flagged.size !== 3) throw new Error('a real phone number must still be found in an extra pass');
  if (wordsToRedact([W('an', 0, 0, 30, 20), W('toàn', 45, 0, 100, 20)], phone, ['an toàn'], false, false, 'low').flagged.size !== 2) throw new Error('custom terms must be trusted in extra passes');
});

check('wordsToRedact: it says WHY each word was flagged (custom term vs rule id)', () => {
  const { flagged, reasons } = wordsToRedact([W('mail', 0, 0, 40, 20), W('a@b.co', 60, 0, 130, 20), W('AN', 150, 0, 180, 20), W('TOAN', 195, 0, 250, 20)], RULES, ['an toàn'], false, false);
  const why = [...flagged].sort((a, b) => a - b).map(i => reasons.get(i));
  if (JSON.stringify(why) !== JSON.stringify(['email', 'custom', 'custom'])) throw new Error(JSON.stringify(why));
});

check('redactWordsOnCanvas: noise from an extra pass leaves no black box and is not counted; the same noise in the main pass is still redacted (unchanged behaviour)', () => {
  const phone = RULES.filter(r => r.id === 'phone');
  const extra = [W('1111110)', 536, 613, 587, 627)]; extra.extraPass = true; extra.passId = 3;
  const ctx = recordingCtx();
  const r = redactWordsOnCanvas(ctx, [extra], phone, [], false, false);
  if (r.redactedCount !== 0 || ctx.fills.length !== 0) throw new Error('extra-pass noise was filled');
  const main = [W('1111110)', 536, 613, 587, 627)]; main.passId = 1;
  const r2 = redactWordsOnCanvas(recordingCtx(), [main], phone, [], false, false);
  if (r2.redactedCount !== 1) throw new Error('main-pass behaviour changed');
});

check('redactWordsOnCanvas: every filled region is logged with its reason, pass and OCR text; formatRegions prints them', () => {
  const l1 = [W('x', 0, 0, 10, 10), W('an', 726, 449, 750, 461)]; l1.passId = 1;
  const l2 = [W('toàn', 490, 475, 538, 493)]; l2.passId = 2; l2.extraPass = true;
  const mail = [W('a@b.co', 0, 100, 60, 120)]; mail.passId = 1;
  const { regions } = redactWordsOnCanvas(recordingCtx(), [l1, l2, mail], RULES, ['an toàn'], false, false);
  const got = regions.map(r => `${r.why}|${r.pass}|${r.text}`).sort();
  const want = ['custom (phrase)|1|an', 'custom (phrase)|2|toàn', 'email|1|a@b.co'].sort();
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(JSON.stringify(got));
  const text = formatRegions(regions);
  if (!text.startsWith('[blacked-out regions') || !text.includes('email | 1 | a@b.co') || formatRegions([]) !== '') throw new Error(text);
});

check('replay of the real noise token: the shipped code no longer fills it, in any pass, with every rule active', () => {
  const lines = [[W('1111110)', 536, 613, 587, 627)], [W('111111)', 536, 613, 587, 627)]];
  lines.forEach(l => { l.extraPass = true; l.passId = 3; });
  const ctx = recordingCtx();
  const { redactedCount } = redactWordsOnCanvas(ctx, lines, RULES, ['an toàn'], false, true);
  if (redactedCount !== 0) throw new Error('filled ' + redactedCount + ' bogus region(s)');
});

check('guard: the diagnostic box shows the region log with textContent, and the scan tags each pass', () => {
  if (!html.includes('lastImgRegionsText = formatRegions(regions);') && !html.includes('lastImgRegionsText = formatRegions(found.regions);')) throw new Error('the region log is not wired into the image render');
  if (!html.includes('words.passId = p + 1;')) throw new Error('passes are not tagged, so regions cannot name their pass');
  const body = html.slice(html.indexOf('function renderImgOcrText()'), html.indexOf('function buildPassCanvas'));
  if (!body.includes('[lastImgOcrText, lastImgRegionsText]') || /innerHTML/.test(body)) throw new Error('renderImgOcrText must combine both texts via textContent');
});

// ---- i18n + wiring for the image panel ----
const i18nOcrCode = extractBetween('// I18N_OCR_START', '// I18N_OCR_END', 'I18N_OCR');
const { I18N_OCR } = new Function(`${i18nOcrCode}\nreturn { I18N_OCR };`)();

check('i18n: the thorough-scan / diagnostics strings exist in all four languages with the same shape', () => {
  const ref = Object.keys(I18N_OCR.en).sort();
  for (const l of LANGS) {
    if (JSON.stringify(Object.keys(I18N_OCR[l]).sort()) !== JSON.stringify(ref)) throw new Error(`${l} keys differ`);
    for (const k of ref) {
      if (typeof I18N_OCR[l][k] !== typeof I18N_OCR.en[k]) throw new Error(`${l}.${k} type differs`);
      if (l !== 'en' && typeof I18N_OCR[l][k] === 'string' && I18N_OCR[l][k] === I18N_OCR.en[k]) throw new Error(`${l}.${k} identical to English`);
    }
    const p = I18N_OCR[l].imgPassProgress(2, 3, 45);
    if (!p.includes('2') || !p.includes('3') || !p.includes('45')) throw new Error(`${l}.imgPassProgress does not show its numbers: ${p}`);
  }
});

check('guard: the image scan runs the planned passes, thorough mode is on by default, and the OCR text box exists', () => {
  if (!/id="imgThoroughCheckbox" checked>/.test(html)) throw new Error('the thorough-scan checkbox must exist and be ticked by default');
  for (const needle of ['planOcrPasses(originalImageBitmap.naturalWidth', 'scaleWords(words, pass.scale)', 'words.extraPass = true', 'renderImgOcrText();', 'findPhraseWordMatches(flat, terms, caseSensitive)', 'foldedCustomSpans(joined, terms, caseSensitive)', 'ocrLangMismatch(customTerms, ocrLangSelect.value)']) {
    if (!html.includes(needle)) throw new Error('missing wiring: ' + needle);
  }
  for (const id of ['imgOcrTextDetails', 'imgOcrText']) if (!html.includes(`id="${id}"`)) throw new Error('missing #' + id);
  const scanBody = html.slice(html.indexOf("imgScanBtn.addEventListener('click'"));
  if (scanBody.indexOf('if (p === 0) throw passError;') === -1) throw new Error('a failing extra pass must not lose the first pass');
});

check('guard: the image and PDF OCR paths explain a missing WebAssembly instead of failing obscurely or silently skipping OCR', () => {
  const imgScan = html.slice(html.indexOf("imgScanBtn.addEventListener('click'"));
  if (imgScan.indexOf('if (!wasmAvailable(window)) { imgProgressEl.textContent = t.wasmUnavailable; return; }') === -1) throw new Error('the image scan does not check for WebAssembly first');
  if (!html.includes('isWasmError(err) ? t.wasmUnavailable')) throw new Error('the image error handler does not recognise a WebAssembly error');
  if (!html.includes("imgProgressEl.textContent = wasmAvailable(window) ? '' : I18N[currentLang].wasmUnavailable;")) throw new Error('an image loaded without WebAssembly gives no early message');
  if (!html.includes('if (pdfOcrCheckbox.checked && !wasmAvailable(window)) { pdfProgressEl.textContent = t.wasmUnavailable; return; }')) throw new Error('the PDF OCR option may be silently skipped without WebAssembly');
});

check('guard: the OCR text box is filled with textContent (what the engine read is untrusted text)', () => {
  const body = html.slice(html.indexOf('function renderImgOcrText()'), html.indexOf('function buildPassCanvas'));
  if (/innerHTML|insertAdjacentHTML|outerHTML/.test(body)) throw new Error('renderImgOcrText writes markup');
  if (!body.includes('textContent')) throw new Error('renderImgOcrText should use textContent');
});

// --- hand-drawn regions and the region model (v1.3) ------------------------
// The model is pure and tested directly; the drawing/list glue is run from
// index.html against a small fake DOM (pointer events, keyboard, list).

check('normalizeRect / clampRect / rectIsUsable: any drag direction gives the same box, strokes are kept inside the image, tiny strokes are ignored', () => {
  const a = normalizeRect({ x: 50, y: 40 }, { x: 10, y: 90 });
  if (JSON.stringify(a) !== JSON.stringify({ x0: 10, y0: 40, x1: 50, y1: 90 })) throw new Error(JSON.stringify(a));
  if (JSON.stringify(normalizeRect({ x: 10, y: 90 }, { x: 50, y: 40 })) !== JSON.stringify(a)) throw new Error('direction matters');
  const c = clampRect({ x0: -20, y0: -5, x1: 300, y1: 80 }, 200, 100);
  if (JSON.stringify(c) !== JSON.stringify({ x0: 0, y0: 0, x1: 200, y1: 80 })) throw new Error(JSON.stringify(c));
  if (rectIsUsable({ x0: 0, y0: 0, x1: 3, y1: 50 }) || rectIsUsable({ x0: 0, y0: 0, x1: 50, y1: 3 }) || rectIsUsable({ x0: 5, y0: 5, x1: 5, y1: 5 })) throw new Error('tiny stroke accepted');
  if (!rectIsUsable({ x0: 0, y0: 0, x1: 4, y1: 4 })) throw new Error('a 4px stroke should be accepted');
});

check('clientToImagePoint: screen coordinates are scaled to image pixels (the canvas is shown scaled by CSS), offsets are honoured, a hidden canvas is safe', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };       // shown at 400x200
  const p = clientToImagePoint(300, 150, rect, 1600, 800);              // image is 1600x800
  if (p.x !== 800 || p.y !== 400) throw new Error(JSON.stringify(p));
  const q = clientToImagePoint(100, 50, rect, 1600, 800);
  if (q.x !== 0 || q.y !== 0) throw new Error('origin: ' + JSON.stringify(q));
  const none = clientToImagePoint(5, 5, { left: 0, top: 0, width: 0, height: 0 }, 100, 100);
  if (none.x !== 0 || none.y !== 0 || clientToImagePoint(5, 5, null, 100, 100).x !== 0) throw new Error('degenerate rect');
});

check('regionKey: stable and rounded, so "switched off" survives a re-render', () => {
  if (regionKey({ x0: 10.2, y0: 20.4, x1: 30.6, y1: 40.5 }) !== '10,20,31,41') throw new Error(regionKey({ x0: 10.2, y0: 20.4, x1: 30.6, y1: 40.5 }));
});

check('region store: add / remove / toggle / clear, with undo and redo, and a new change drops the redo history', () => {
  const s = createRegionStore();
  const box = { x0: 1, y0: 2, x1: 30, y1: 40 };
  const a = s.addManual(box), b = s.addManual({ x0: 5, y0: 5, x1: 50, y1: 50 });
  if (s.manualRegions().length !== 2 || a === b) throw new Error('add');
  s.toggleManual(a);
  if (s.manualRegions().find(r => r.id === a).enabled !== false) throw new Error('toggle');
  s.removeManual(b);
  if (s.manualRegions().length !== 1) throw new Error('remove');
  s.undo(); if (s.manualRegions().length !== 2) throw new Error('undo remove');
  s.undo(); if (s.manualRegions().find(r => r.id === a).enabled !== true) throw new Error('undo toggle');
  s.redo(); if (s.manualRegions().find(r => r.id === a).enabled !== false) throw new Error('redo toggle');
  s.addManual({ x0: 9, y0: 9, x1: 90, y1: 90 });
  if (s.canRedo()) throw new Error('a new change must drop the redo history');
  const ids = s.manualRegions().map(r => r.id);
  if (new Set(ids).size !== ids.length) throw new Error('ids collided after undo/redo: ' + ids);
  const before = s.manualRegions().length;
  if (!s.clearManual() || s.manualRegions().length !== 0 || s.clearManual()) throw new Error('clear');
  s.undo(); if (s.manualRegions().length !== before) throw new Error('undo clear');
  if (s.removeManual(999) || s.toggleManual(999)) throw new Error('unknown ids must be rejected');
});

check('region store: undo/redo on an empty history is a no-op, manualRegions() returns copies, history is bounded', () => {
  const s = createRegionStore();
  if (s.undo() || s.redo() || s.canUndo() || s.canRedo()) throw new Error('empty history');
  s.addManual({ x0: 1, y0: 1, x1: 20, y1: 20 });
  const copy = s.manualRegions(); copy[0].box.x0 = 999; copy.push({});
  if (s.manualRegions()[0].box.x0 !== 1 || s.manualRegions().length !== 1) throw new Error('the store leaked its internals');
  for (let i = 0; i < 500; i++) s.addManual({ x0: i, y0: 0, x1: i + 10, y1: 10 });
  let undone = 0; while (s.undo()) undone++;
  if (undone > 200) throw new Error('history is not bounded: ' + undone);
});

check('region store: automatic regions can be switched off by key; a new scan (resetAuto) forgets that and the history, drawn regions stay; reset clears everything', () => {
  const s = createRegionStore();
  s.addManual({ x0: 0, y0: 0, x1: 10, y1: 10 });
  s.toggleAuto('1,2,3,4');
  if (s.isAutoEnabled('1,2,3,4')) throw new Error('toggleAuto');
  s.toggleAuto('1,2,3,4');
  if (!s.isAutoEnabled('1,2,3,4')) throw new Error('toggle back');
  s.toggleAuto('1,2,3,4');
  s.resetAuto();
  if (!s.isAutoEnabled('1,2,3,4') || s.canUndo() || s.manualRegions().length !== 1) throw new Error('resetAuto');
  s.reset();
  if (s.manualRegions().length !== 0 || s.canUndo()) throw new Error('reset');
});

check('combineRegions / boxesToPaint: automatic first, then drawn; switched-off regions are not painted', () => {
  const s = createRegionStore();
  const auto = [{ box: { x0: 0, y0: 0, x1: 10, y1: 10 }, text: 'a', why: 'custom', pass: 1 }, { box: { x0: 20, y0: 20, x1: 30, y1: 30 }, text: 'b', why: 'phone', pass: 1 }];
  s.toggleAuto(regionKey(auto[1].box));
  const id = s.addManual({ x0: 50, y0: 50, x1: 80, y1: 90 });
  const list = combineRegions(auto, s);
  if (list.map(r => r.source).join() !== 'auto,auto,manual' || list[2].id !== id) throw new Error(JSON.stringify(list.map(r => r.source)));
  const boxes = boxesToPaint(list);
  if (boxes.length !== 2 || boxes[0].x0 !== 0 || boxes[1].x0 !== 50) throw new Error('painted: ' + JSON.stringify(boxes));
  s.toggleManual(id);
  if (boxesToPaint(combineRegions(auto, s)).length !== 1) throw new Error('a disabled drawn region was painted');
});

check('paintRedactionBoxes: solid opaque black rectangles at exactly the given boxes', () => {
  const ctx = recordingCtx();
  paintRedactionBoxes(ctx, [{ x0: 10, y0: 20, x1: 60, y1: 50 }, { x0: 0, y0: 0, x1: 5, y1: 5 }]);
  if (ctx.fillStyle !== '#000000') throw new Error('not opaque black: ' + ctx.fillStyle);
  if (JSON.stringify(ctx.fills) !== JSON.stringify([[10, 20, 50, 30], [0, 0, 5, 5]])) throw new Error(JSON.stringify(ctx.fills));
});

check('drawing tool: press-drag-release gives a normalized box, with a live preview; cancel and stray events are safe', () => {
  const t = createDrawingTool();
  if (t.active() || t.preview() !== null || t.up({ x: 1, y: 1 }) !== null) throw new Error('idle state');
  t.down({ x: 80, y: 70 });
  t.move({ x: 20, y: 10 });
  if (!t.active() || JSON.stringify(t.preview()) !== JSON.stringify({ x0: 20, y0: 10, x1: 80, y1: 70 })) throw new Error(JSON.stringify(t.preview()));
  const r = t.up({ x: 10, y: 5 });
  if (JSON.stringify(r) !== JSON.stringify({ x0: 10, y0: 5, x1: 80, y1: 70 }) || t.active()) throw new Error(JSON.stringify(r));
  t.down({ x: 1, y: 1 }); t.cancel();
  if (t.active() || t.preview() !== null) throw new Error('cancel');
  t.move({ x: 5, y: 5 }); // a move with no press does nothing
  if (t.active()) throw new Error('move without press');
});

check('findWordRedactions: pure -- boxes are padded by 2px, suspects carry their box, unconfirmed suspects are not regions; the canvas wrapper paints the same boxes', () => {
  const found = findWordRedactions([REAL_LINE_1, REAL_LINE_2], [], ['an toàn'], false, false);
  const an = found.regions.find(r => r.text === 'an');
  if (!an || JSON.stringify(an.box) !== JSON.stringify({ x0: 724, y0: 447, x1: 752, y1: 463 })) throw new Error('padded box: ' + JSON.stringify(an));
  if (found.redactedCount !== found.regions.length) throw new Error('count');
  const ctx = recordingCtx();
  const viaCanvas = redactWordsOnCanvas(ctx, [REAL_LINE_1, REAL_LINE_2], [], ['an toàn'], false, false);
  const expected = found.regions.map(r => [r.box.x0, r.box.y0, r.box.x1 - r.box.x0, r.box.y1 - r.box.y0]);
  if (JSON.stringify(ctx.fills) !== JSON.stringify(expected) || viaCanvas.redactedCount !== found.redactedCount) throw new Error('the wrapper paints something else');
  const secret = [W('Zk9qLm3VxQ7rTb2Np', 10, 600, 200, 620)];
  const unconfirmed = findWordRedactions([secret], [], [], false, true, new Set());
  if (unconfirmed.suspects.length !== 1 || unconfirmed.suspects[0].confirmed || unconfirmed.regions.length !== 0 || !unconfirmed.suspects[0].box) throw new Error(JSON.stringify(unconfirmed));
  const confirmed = findWordRedactions([secret], [], [], false, true, new Set([unconfirmed.suspects[0].id]));
  if (confirmed.regions.length !== 1 || confirmed.regions[0].why !== 'entropy (confirmed)') throw new Error(JSON.stringify(confirmed.regions));
});

check('the whole flow on the model: detector regions + a drawn region, switch one detector region off, undo it -- the painted boxes follow', () => {
  const s = createRegionStore();
  const auto = findWordRedactions([REAL_LINE_1, REAL_LINE_2], [], ['an toàn'], false, false).regions;
  const base = boxesToPaint(combineRegions(auto, s)).length;
  if (base !== auto.length || base < 2) throw new Error('baseline');
  s.addManual({ x0: 300, y0: 600, x1: 360, y1: 640 });
  if (boxesToPaint(combineRegions(auto, s)).length !== base + 1) throw new Error('drawn region not painted');
  s.toggleAuto(regionKey(auto[0].box));
  if (boxesToPaint(combineRegions(auto, s)).length !== base) throw new Error('switching a detector region off');
  s.undo();
  if (boxesToPaint(combineRegions(auto, s)).length !== base + 1) throw new Error('undo');
});

check('paintSuspectOutlines: an unconfirmed suspect is only OUTLINED in yellow (nothing is filled); a confirmed one is left to the regions; the PDF wrapper outlines too', () => {
  const strokes = [], fills = [];
  const ctx = { strokeStyle: '', lineWidth: 0, fillStyle: '', save() {}, restore() {}, strokeRect(...a) { strokes.push([this.strokeStyle, this.lineWidth, ...a]); }, fillRect(...a) { fills.push(a); } };
  paintSuspectOutlines(ctx, [{ confirmed: false, box: { x0: 10, y0: 20, x1: 60, y1: 50 } }, { confirmed: true, box: { x0: 0, y0: 0, x1: 5, y1: 5 } }]);
  if (JSON.stringify(strokes) !== JSON.stringify([['#facf6f', 2, 10, 20, 50, 30]]) || fills.length) throw new Error(JSON.stringify({ strokes, fills }));
  const strokes2 = [];
  const ctx2 = { ...recordingCtx(), strokeRect(...a) { strokes2.push(a); } };
  const secret = [W('Zk9qLm3VxQ7rTb2Np', 10, 600, 200, 620)];
  redactWordsOnCanvas(ctx2, [secret], [], [], false, true);
  if (strokes2.length !== 1 || ctx2.fills.length !== 0) throw new Error('wrapper: ' + JSON.stringify({ strokes2, fills: ctx2.fills }));
});

check('regionToolbarState: export needs a scan or a region; undo/redo/clear follow the store', () => {
  const s = createRegionStore();
  const idle = regionToolbarState(s, false, 0);
  if (idle.canExport || !idle.undoDisabled || !idle.redoDisabled || !idle.clearDisabled) throw new Error(JSON.stringify(idle));
  if (!regionToolbarState(s, true, 0).canExport) throw new Error('a finished scan allows export');
  s.addManual({ x0: 0, y0: 0, x1: 10, y1: 10 });
  const drawn = regionToolbarState(s, false, 1);
  if (!drawn.canExport || drawn.undoDisabled || !drawn.redoDisabled || drawn.clearDisabled) throw new Error('after drawing: ' + JSON.stringify(drawn));
  s.undo();
  const undone = regionToolbarState(s, false, 0);
  if (undone.canExport || undone.redoDisabled || !undone.undoDisabled) throw new Error('after undo: ' + JSON.stringify(undone));
});

check('guard: every element id the script looks up at load time exists in the HTML (one missing id would stop the whole page)', () => {
  const ids = new Set([...html.matchAll(/getElementById\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]));
  const createdInScript = new Set([...html.matchAll(/\.id = '([A-Za-z0-9_-]+)'/g)].map(m => m[1])); // e.g. checkboxes built at runtime
  const missing = [...ids].filter(id => !html.includes(`id="${id}"`) && !createdInScript.has(id));
  if (missing.length) throw new Error('getElementById for ids that are not in the HTML: ' + missing.join(', '));
  if (ids.size < 40) throw new Error('suspiciously few ids found: ' + ids.size);
});

// ---- the UI glue, run from index.html against a fake DOM ----
const regionsUiCode = extractBetween('// REGIONS_UI_START', '// REGIONS_UI_END', 'REGIONS_UI');
const i18nRegionsCode = extractBetween('// I18N_REGIONS_START', '// I18N_REGIONS_END', 'I18N_REGIONS');
const { I18N_REGIONS } = new Function(`${i18nRegionsCode}\nreturn { I18N_REGIONS };`)();

function makeRegionsUiHarness() {
  const byId = new Map();
  const docListeners = {};
  const overlayCalls = [];
  const makeEl = (tag, id) => ({
    tag, id, tagName: String(tag).toUpperCase(), style: {}, children: [], listeners: {}, attrs: {}, className: '', _text: '', disabled: false, type: '', checked: false,
    width: 200, height: 100, displayW: null, displayH: null,
    classList: { set: new Set(), toggle(c, on) { if (on) this.set.add(c); else this.set.delete(c); }, contains(c) { return this.set.has(c); } },
    get textContent() { return this._text + this.children.map(c => c.textContent).join(''); },
    set textContent(v) { this._text = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    setAttribute(k, v) { this.attrs[k] = v; },
    setPointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: this.displayW ?? this.width, height: this.displayH ?? this.height }; },
    getContext() { return { clearRect() {}, strokeRect(...a) { overlayCalls.push(['strokeRect', ...a]); }, fillRect(...a) { overlayCalls.push(['fillRect', ...a]); }, setLineDash() {}, set lineWidth(v) {}, set strokeStyle(v) {}, set fillStyle(v) {} }; }
  });
  const doc = {
    getElementById(id) { if (!byId.has(id)) byId.set(id, makeEl('div', id)); return byId.get(id); },
    createElement(tag) { return makeEl(tag); },
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); }
  };
  doc.getElementById('imagePanel').style.display = 'block';
  const source = `
    let currentLang = 'en';
    const I18N = { en: I18N_REGIONS.en, de: I18N_REGIONS.de };
    const imgCanvas = { width: 200, height: 100 };
    let originalImageBitmap = {};
    const calls = { render: 0 };
    let autoRegions = [];
    function renderImageRedactions() { calls.render++; lastImgEffective = combineRegions(autoRegions, imgRegionStore); renderRegionList(); drawOverlay(); }
    ${regionModelCode}
    ${regionsUiCode}
    return {
      store: imgRegionStore, calls, drawOverlay, renderRegionList, setImgDrawMode, resetImageRegionsUi, rerenderRegionsUi,
      setAuto: (a) => { autoRegions = a; }, effective: () => lastImgEffective, drawMode: () => imgDrawMode, setLang: (l) => { currentLang = l; },
      setBitmap: (b) => { originalImageBitmap = b; }, renderNow: () => renderImageRedactions()
    };
  `;
  const api = new Function('document', 'I18N_REGIONS', source)(doc, I18N_REGIONS);
  const fire = (id, type, e = {}) => (doc.getElementById(id).listeners[type] || []).forEach(fn => fn({ preventDefault() {}, pointerId: 1, button: 0, ...e }));
  const fireDoc = (type, e = {}) => (docListeners[type] || []).forEach(fn => fn({ preventDefault() {}, target: doc.getElementById('body'), ...e }));
  return { api, doc, fire, fireDoc, overlayCalls, el: id => doc.getElementById(id) };
}
const dragOverlay = (h, from, to) => { h.fire('imgOverlay', 'pointerdown', { clientX: from[0], clientY: from[1] }); h.fire('imgOverlay', 'pointermove', { clientX: to[0], clientY: to[1] }); h.fire('imgOverlay', 'pointerup', { clientX: to[0], clientY: to[1] }); };
const walkNodes = n => [n, ...n.children.flatMap(walkNodes)];

check('regions UI: drawing is ignored until the tool is switched on; then a drag becomes a region in IMAGE pixels, however the canvas is scaled on screen', () => {
  const h = makeRegionsUiHarness();
  h.el('imgOverlay').displayW = 100; h.el('imgOverlay').displayH = 50;      // 200x100 image shown at half size
  dragOverlay(h, [10, 10], [60, 40]);
  if (h.api.store.manualRegions().length !== 0 || h.api.calls.render !== 0) throw new Error('drew while the tool was off');
  h.api.setImgDrawMode(true);
  if (h.el('imgDrawToggle').attrs['aria-pressed'] !== 'true' || !h.el('imgOverlay').classList.contains('drawing') || !h.el('imgDrawToggle').classList.contains('active')) throw new Error('toggle state');
  dragOverlay(h, [10, 10], [60, 40]);
  const r = h.api.store.manualRegions();
  if (r.length !== 1 || JSON.stringify(r[0].box) !== JSON.stringify({ x0: 20, y0: 20, x1: 120, y1: 80 })) throw new Error(JSON.stringify(r));
  if (h.api.calls.render !== 1) throw new Error('the image was not re-rendered');
});

check('regions UI: a click or twitch is ignored, a stroke past the edge is clamped, right-click and cancel do nothing', () => {
  const h = makeRegionsUiHarness();
  h.api.setImgDrawMode(true);
  dragOverlay(h, [30, 30], [32, 33]);
  if (h.api.store.manualRegions().length !== 0) throw new Error('a tiny stroke became a region');
  dragOverlay(h, [150, 60], [900, 900]);
  const r = h.api.store.manualRegions();
  if (r.length !== 1 || r[0].box.x1 !== 200 || r[0].box.y1 !== 100) throw new Error('not clamped: ' + JSON.stringify(r));
  h.fire('imgOverlay', 'pointerdown', { clientX: 5, clientY: 5, button: 2 });
  h.fire('imgOverlay', 'pointerup', { clientX: 90, clientY: 90 });
  if (h.api.store.manualRegions().length !== 1) throw new Error('a right-click drew');
  h.fire('imgOverlay', 'pointerdown', { clientX: 5, clientY: 5 }); h.fire('imgOverlay', 'pointercancel');
  h.fire('imgOverlay', 'pointerup', { clientX: 90, clientY: 90 });
  if (h.api.store.manualRegions().length !== 1) throw new Error('a cancelled stroke committed');
  h.fire('imgOverlay', 'pointerdown', { clientX: 5, clientY: 5 }); h.fireDoc('keydown', { key: 'Escape' });
  h.fire('imgOverlay', 'pointerup', { clientX: 90, clientY: 90 });
  if (h.api.store.manualRegions().length !== 1) throw new Error('Escape did not cancel the stroke');
});

check('regions UI: the live preview goes on the overlay only', () => {
  const h = makeRegionsUiHarness();
  h.api.setImgDrawMode(true);
  h.fire('imgOverlay', 'pointerdown', { clientX: 10, clientY: 10 });
  h.fire('imgOverlay', 'pointermove', { clientX: 60, clientY: 40 });
  if (!h.overlayCalls.some(c => c[0] === 'strokeRect' && c[1] === 10 && c[3] === 50)) throw new Error('no rubber band drawn: ' + JSON.stringify(h.overlayCalls));
});

check('regions UI: Ctrl/Cmd+Z undoes, Shift+Ctrl+Z and Ctrl+Y redo; typing in a text field and a hidden panel are left alone', () => {
  const h = makeRegionsUiHarness();
  h.api.setImgDrawMode(true);
  dragOverlay(h, [10, 10], [60, 40]);
  const rendersAfterDraw = h.api.calls.render;
  h.fireDoc('keydown', { key: 'z', ctrlKey: true });
  if (h.api.store.manualRegions().length !== 0 || h.api.calls.render !== rendersAfterDraw + 1) throw new Error('undo');
  h.fireDoc('keydown', { key: 'Z', ctrlKey: true, shiftKey: true });
  if (h.api.store.manualRegions().length !== 1) throw new Error('redo with shift');
  h.fireDoc('keydown', { key: 'z', metaKey: true });
  h.fireDoc('keydown', { key: 'y', ctrlKey: true });
  if (h.api.store.manualRegions().length !== 1) throw new Error('cmd+z then ctrl+y');
  h.fireDoc('keydown', { key: 'z', ctrlKey: true, target: { tagName: 'TEXTAREA' } });
  h.fireDoc('keydown', { key: 'z', ctrlKey: true, target: { tagName: 'INPUT', type: 'text' } });
  if (h.api.store.manualRegions().length !== 1) throw new Error('undo fired while typing');
  h.el('imagePanel').style.display = 'none';
  h.fireDoc('keydown', { key: 'z', ctrlKey: true });
  if (h.api.store.manualRegions().length !== 1) throw new Error('undo fired while the image panel was hidden');
  h.el('imagePanel').style.display = 'block';
  h.fireDoc('keydown', { key: 'z' });                 // no modifier
  if (h.api.store.manualRegions().length !== 1) throw new Error('a bare "z" undid something');
  h.fire('imgUndoBtn', 'click');
  if (h.api.store.manualRegions().length !== 0) throw new Error('undo button');
  h.fire('imgRedoBtn', 'click');
  h.fire('imgClearManualBtn', 'click');
  if (h.api.store.manualRegions().length !== 0) throw new Error('clear button');
});

check('regions UI: the region list shows automatic and drawn regions as text only, switches them on/off, removes drawn ones and numbers them', () => {
  const h = makeRegionsUiHarness();
  const evil = '<img src=x onerror=alert(1)>';
  h.api.setAuto([{ box: { x0: 10, y0: 10, x1: 40, y1: 30 }, text: evil, why: 'custom', pass: 1 }]);
  h.api.store.addManual({ x0: 50, y0: 50, x1: 90, y1: 80 });
  h.api.store.addManual({ x0: 100, y0: 10, x1: 150, y1: 40 });
  h.api.renderNow();
  const list = h.el('imgRegionList');
  if (walkNodes(list).some(n => n.tag === 'img')) throw new Error('hostile OCR text became an element');
  const text = list.textContent;
  for (const needle of ['Areas that will be covered: 3 (2 drawn by you)', 'Automatic: custom — ' + evil, 'Drawn area #1', 'Drawn area #2']) if (!text.includes(needle)) throw new Error(`"${needle}" missing: ${text}`);
  const boxes = walkNodes(list).filter(n => n.tag === 'input');
  boxes[0].listeners.change.forEach(fn => fn());                                   // switch the automatic one off
  if (h.api.store.isAutoEnabled('10,10,40,30')) throw new Error('auto toggle');
  const removeButtons = walkNodes(h.el('imgRegionList')).filter(n => n.tag === 'button');
  if (removeButtons.length !== 2) throw new Error('one remove button per drawn region, none for automatic ones: ' + removeButtons.length);
  removeButtons[0].listeners.click.forEach(fn => fn());
  if (h.api.store.manualRegions().length !== 1) throw new Error('remove');
  walkNodes(h.el('imgRegionList')).filter(n => n.tag === 'input')[1].listeners.change.forEach(fn => fn());
  if (h.api.store.manualRegions()[0].enabled !== false) throw new Error('drawn toggle');
});

check('regions UI: hovering a list item outlines that region on the overlay; the hint follows the mode and the language; clear-all hides the tools', () => {
  const h = makeRegionsUiHarness();
  h.api.setAuto([{ box: { x0: 10, y0: 10, x1: 40, y1: 30 }, text: 'x', why: 'phone', pass: 1 }]);
  h.api.renderNow();
  const li = h.el('imgRegionList').children.find(c => c.tag === 'ul').children[0];
  h.overlayCalls.length = 0;
  li.listeners.mouseenter.forEach(fn => fn());
  if (!h.overlayCalls.some(c => c[0] === 'strokeRect' && c[1] === 10 && c[2] === 10 && c[3] === 30)) throw new Error('no highlight: ' + JSON.stringify(h.overlayCalls));
  li.listeners.mouseleave.forEach(fn => fn());
  h.overlayCalls.length = 0; h.api.drawOverlay();
  if (h.overlayCalls.length) throw new Error('highlight not cleared');
  h.api.setImgDrawMode(false);
  if (!h.el('imgDrawHint').textContent.includes('Missed something')) throw new Error('hint (off): ' + h.el('imgDrawHint').textContent);
  h.api.setImgDrawMode(true);
  if (!h.el('imgDrawHint').textContent.includes('Drag on the image')) throw new Error('hint (on)');
  h.api.setLang('de'); h.api.rerenderRegionsUi();
  if (!h.el('imgDrawHint').textContent.includes('Ziehe auf dem Bild')) throw new Error('hint did not follow the language: ' + h.el('imgDrawHint').textContent);
  h.api.resetImageRegionsUi(true);
  if (h.el('imgDrawBar').style.display !== 'flex' || h.api.drawMode() || h.api.store.manualRegions().length) throw new Error('reset for a new image');
  h.api.setBitmap(null); h.api.resetImageRegionsUi(false);
  if (h.el('imgDrawBar').style.display !== 'none' || h.el('imgRegionList').style.display !== 'none') throw new Error('clear-all should hide the tools');
});

check('i18n: the drawing-tool strings exist in all four languages with the same shape and real translations', () => {
  const ref = Object.keys(I18N_REGIONS.en).sort();
  for (const l of LANGS) {
    if (JSON.stringify(Object.keys(I18N_REGIONS[l]).sort()) !== JSON.stringify(ref)) throw new Error(`${l} keys differ`);
    for (const k of ref) {
      if (typeof I18N_REGIONS[l][k] !== typeof I18N_REGIONS.en[k]) throw new Error(`${l}.${k} type differs`);
      if (l !== 'en' && typeof I18N_REGIONS[l][k] === 'string' && I18N_REGIONS[l][k] === I18N_REGIONS.en[k]) throw new Error(`${l}.${k} identical to English`);
    }
    const title = I18N_REGIONS[l].regionsTitle(7, 3), name = I18N_REGIONS[l].regionManual(5);
    if (!title.includes('7') || !title.includes('3') || !name.includes('5')) throw new Error(`${l}: counts missing: ${title} / ${name}`);
  }
});

check('guard: the overlay never touches the export canvas, the export is rebuilt from the original plus enabled regions, and pointer handling is touch-safe', () => {
  const overlayBody = html.slice(html.indexOf('function drawOverlay()'), html.indexOf('function imgPointFromEvent'));
  if (/\bimgCtx\b|imgCanvas\.getContext/.test(overlayBody)) throw new Error('drawOverlay draws on the export canvas');
  if (!overlayBody.includes('imgOverlayCtx')) throw new Error('drawOverlay should use the overlay context');
  const render = html.slice(html.indexOf('function renderImageRedactions()'), html.indexOf("imgScanBtn.addEventListener('click'"));
  if (!render.includes('imgCtx.drawImage(originalImageBitmap, 0, 0);') || !render.includes('paintAllRegions(imgCtx, lastImgEffective, imgFaceStyle);')) throw new Error('the export is not rebuilt from the original + enabled regions');
  for (const needle of ["'pointerdown'", "'pointermove'", "'pointerup'", "'pointercancel'", 'setPointerCapture']) if (!html.includes(needle)) throw new Error('missing ' + needle);
  if (!/#imgCanvasWrap #imgOverlay\.drawing \{[^}]*touch-action: none/.test(html)) throw new Error('touch-action: none is needed while drawing, or the page scrolls instead');
  if (!/<div id="imgStage"><canvas id="imgCanvas"><\/canvas><canvas id="imgOverlay"><\/canvas><\/div>/.test(html)) throw new Error('the overlay must be a separate canvas inside the stage');
  if (!html.includes('imgRegionStore.resetAuto();')) throw new Error('a new scan must reset the automatic-region state');
  const list = html.slice(html.indexOf('function renderRegionList()'), html.indexOf('// A new image (or "clear all")'));
  if (/innerHTML|insertAdjacentHTML|outerHTML/.test(list)) throw new Error('renderRegionList writes markup');
});

check('guard: drawing works without OCR -- exporting is allowed as soon as a region exists, and a new image resets the tools', () => {
  if (!html.includes('regionToolbarState(imgRegionStore, imgScanned, covered)')) throw new Error('the image panel does not use the toolbar state');
  if (!html.includes('imgDownloadBtn.disabled = !toolbar.canExport;')) throw new Error('export availability is not driven by the toolbar state');
  if (!html.includes('resetImageRegionsUi(true);')) throw new Error('loading an image does not reset the regions');
  if (!html.includes('resetImageRegionsUi(false);')) throw new Error('clear-all does not reset the regions');
  if (!html.includes('rerenderRegionsUi();')) throw new Error('a language switch does not refresh the region list');
});

// --- "Delete all terms" with a warning (v1.3) ------------------------------
// Deleting the list is irreversible (it only exists in this browser's local
// storage), so the rule "nothing is deleted without an explicit confirm" is
// tested exhaustively on the pure flow, then the UI is run against a fake DOM.

const clearFlowCode = extractBetween('// CLEAR_TERMS_FLOW_START', '// CLEAR_TERMS_FLOW_END', 'CLEAR_TERMS_FLOW');
const clearUiCode = extractBetween('// CLEAR_TERMS_UI_START', '// CLEAR_TERMS_UI_END', 'CLEAR_TERMS_UI');
const i18nClearCode = extractBetween('// I18N_CLEAR_TERMS_START', '// I18N_CLEAR_TERMS_END', 'I18N_CLEAR_TERMS');
const { I18N_CLEAR_TERMS } = new Function(`${i18nClearCode}\nreturn { I18N_CLEAR_TERMS };`)();
const { clearTermsFlow } = new Function(`${clearFlowCode}\nreturn { clearTermsFlow };`)();

check('clearTermsFlow: the happy paths -- warn first, export optional, delete only on confirm, cancel always closes', () => {
  let r = clearTermsFlow('idle', 'request', 3);
  if (r.state !== 'warn' || r.effect !== null) throw new Error('request: ' + JSON.stringify(r));
  r = clearTermsFlow('warn', 'export', 3);
  if (r.state !== 'exported' || r.effect !== 'export') throw new Error('export: ' + JSON.stringify(r));
  r = clearTermsFlow('exported', 'confirm', 3);
  if (r.state !== 'idle' || r.effect !== 'delete') throw new Error('confirm after export: ' + JSON.stringify(r));
  r = clearTermsFlow('warn', 'confirm', 3);   // "delete without exporting"
  if (r.state !== 'idle' || r.effect !== 'delete') throw new Error('confirm without export: ' + JSON.stringify(r));
  for (const s of ['idle', 'warn', 'exported']) {
    const c = clearTermsFlow(s, 'cancel', 3);
    if (c.state !== 'idle' || c.effect !== null) throw new Error('cancel from ' + s);
  }
  const again = clearTermsFlow('exported', 'export', 3);
  if (again.state !== 'exported' || again.effect !== 'export') throw new Error('exporting twice should be allowed');
});

check('clearTermsFlow: nothing to delete means no warning; a list emptied under an open warning closes it; unknown actions change nothing', () => {
  if (clearTermsFlow('idle', 'request', 0).state !== 'idle') throw new Error('a warning for an empty list');
  if (clearTermsFlow('warn', 'sync', 0).state !== 'idle' || clearTermsFlow('exported', 'sync', 0).state !== 'idle') throw new Error('sync with an empty list');
  if (clearTermsFlow('warn', 'sync', 2).state !== 'warn') throw new Error('sync with terms left must keep the warning');
  if (clearTermsFlow('warn', 'confirm', 0).effect !== null) throw new Error('confirm with nothing to delete');
  const odd = clearTermsFlow('warn', 'whatever', 3);
  if (odd.state !== 'warn' || odd.effect !== null) throw new Error('unknown action');
});

check('clearTermsFlow, exhaustively: a "delete" effect happens only for a confirm made from an open warning, and a warning only ever opens from "request"', () => {
  const actions = ['request', 'export', 'confirm', 'cancel', 'sync', 'bogus'];
  let visited = 0;
  const walk = (state, depth, count, opened) => {
    if (depth === 0) return;
    for (const action of actions) {
      for (const termCount of [0, count]) {
        const r = clearTermsFlow(state, action, termCount);
        visited++;
        const mayDelete = action === 'confirm' && (state === 'warn' || state === 'exported') && termCount > 0;
        if ((r.effect === 'delete') !== mayDelete) throw new Error(`delete effect wrong: ${state} + ${action} (count ${termCount}) -> ${JSON.stringify(r)}`);
        if (r.effect === 'export' && !(action === 'export' && (state === 'warn' || state === 'exported'))) throw new Error('export effect out of nowhere');
        if (r.state === 'warn' && state !== 'warn' && !(state === 'idle' && action === 'request' && termCount > 0)) throw new Error(`a warning opened from ${state} via ${action}`);
        if (state === 'idle' && r.effect !== null) throw new Error('an effect from the idle state');
        walk(r.state, depth - 1, count, opened);
      }
    }
  };
  walk('idle', 4, 3, false);
  if (visited < 1000) throw new Error('the walk was too small: ' + visited);
});

check('i18n: the delete-all strings exist in all four languages with the same shape, real translations and working plurals', () => {
  const ref = Object.keys(I18N_CLEAR_TERMS.en).sort();
  for (const l of LANGS) {
    if (JSON.stringify(Object.keys(I18N_CLEAR_TERMS[l]).sort()) !== JSON.stringify(ref)) throw new Error(`${l} keys differ`);
    for (const k of ref) {
      if (typeof I18N_CLEAR_TERMS[l][k] !== typeof I18N_CLEAR_TERMS.en[k]) throw new Error(`${l}.${k} type differs`);
      if (l !== 'en' && typeof I18N_CLEAR_TERMS[l][k] === 'string' && I18N_CLEAR_TERMS[l][k] === I18N_CLEAR_TERMS.en[k]) throw new Error(`${l}.${k} identical to English`);
    }
    for (const fn of ['clearWarn', 'clearExported', 'clearDone']) {
      for (const n of [1, 12]) if (!I18N_CLEAR_TERMS[l][fn](n).includes(String(n))) throw new Error(`${l}.${fn}(${n}) does not show the count`);
    }
    const warn = I18N_CLEAR_TERMS[l].clearWarn(5);
    if (!/json/i.test(warn)) throw new Error(`${l}: the warning must mention the .json export`);
  }
  if (!/term\?/.test(I18N_CLEAR_TERMS.en.clearWarn(1)) || !/terms\?/.test(I18N_CLEAR_TERMS.en.clearWarn(2))) throw new Error('English plural');
});

function makeClearTermsHarness(initialTerms = ['Tamesh', 'Nkem', 'Oct']) {
  const byId = new Map();
  const focusLog = [];
  const downloads = [];
  const removeItemCalls = [];
  const makeEl = (tag, id) => ({
    tag, id, style: {}, listeners: {}, children: [], disabled: false, _text: '',
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    focus() { focusLog.push(this.id); }
  });
  const doc = {
    getElementById(id) { if (!byId.has(id)) byId.set(id, makeEl('div', id)); return byId.get(id); },
    createElement(tag) { const el = makeEl(tag); if (tag === 'a') el.click = () => downloads.push({ name: el.download, payload: el.href && el.href.blob ? el.href.blob.parts.join('') : '' }); return el; },
    body: { appendChild() {}, removeChild() {} }
  };
  const fakeLocalStorage = { removeItem(k) { removeItemCalls.push(k); if (fakeLocalStorage.failing) throw new Error('storage blocked'); } };
  class FakeBlob { constructor(parts) { this.parts = parts; } }
  const FakeURL = { createObjectURL(blob) { return { blob }; }, revokeObjectURL() {} };
  const source = `
    let currentLang = 'en';
    const I18N = { en: I18N_CLEAR_TERMS.en, de: I18N_CLEAR_TERMS.de, vi: I18N_CLEAR_TERMS.vi };
    const CUSTOM_TERMS_KEY = 'piiRedactorCustomTerms';
    let customTerms = ${JSON.stringify(initialTerms)};
    const customCaseSensitiveEl = { checked: true };
    const customInputEl = document.getElementById('customInput');
    function renderCustomChips() { renderClearTermsUi(); }
    ${clearFlowCode}
    ${clearUiCode}
    renderClearTermsUi();
    return {
      terms: () => customTerms, setTerms: (a) => { customTerms = a; renderCustomChips(); }, state: () => clearTermsState, cleared: () => clearedCount,
      setLang: (l) => { currentLang = l; renderClearTermsUi(); }
    };
  `;
  const api = new Function('document', 'localStorage', 'Blob', 'URL', 'I18N_CLEAR_TERMS', source)(doc, fakeLocalStorage, FakeBlob, FakeURL, I18N_CLEAR_TERMS);
  const el = id => doc.getElementById(id);
  const click = id => (el(id).listeners.click || []).forEach(fn => fn({}));
  const key = (id, k) => (el(id).listeners.keydown || []).forEach(fn => fn({ key: k }));
  return { api, el, click, key, focusLog, downloads, removeItemCalls, fakeLocalStorage };
}

check('delete-all UI: the button is off for an empty list; clicking it only opens a warning -- nothing is deleted, nothing is exported', () => {
  const h = makeClearTermsHarness([]);
  if (!h.el('customClearBtn').disabled || h.el('customClearConfirm').style.display !== 'none') throw new Error('empty list');
  h.api.setTerms(['Tamesh', 'Nkem', 'Oct']);
  if (h.el('customClearBtn').disabled) throw new Error('should be enabled with terms');
  h.click('customClearBtn');
  const msg = h.el('customClearMessage').textContent;
  for (const needle of ['Delete all 3 custom terms?', "browser's local storage", 'cannot be recovered', 'Export the list as a .json file first']) if (!msg.includes(needle)) throw new Error(`"${needle}" missing: ${msg}`);
  if (h.el('customClearConfirm').style.display !== 'block' || h.el('customClearExportBtn').style.display !== 'inline-block') throw new Error('warning not shown');
  if (h.el('customClearDeleteBtn').textContent !== 'Delete without exporting') throw new Error('delete label: ' + h.el('customClearDeleteBtn').textContent);
  if (h.api.terms().length !== 3 || h.removeItemCalls.length || h.downloads.length) throw new Error('something happened on the first click');
  if (h.focusLog[h.focusLog.length - 1] !== 'customClearExportBtn') throw new Error('focus should start on the safe button, not the destructive one: ' + h.focusLog);
});

check('delete-all UI: Cancel and Escape close the warning and keep every term and the stored list', () => {
  const h = makeClearTermsHarness();
  h.click('customClearBtn'); h.click('customClearCancelBtn');
  if (h.el('customClearConfirm').style.display !== 'none' || h.api.terms().length !== 3 || h.removeItemCalls.length) throw new Error('cancel');
  if (h.focusLog[h.focusLog.length - 1] !== 'customClearBtn') throw new Error('focus should return to the button');
  h.click('customClearBtn'); h.key('customClearConfirm', 'a'); h.key('customClearConfirm', 'Escape');
  if (h.el('customClearConfirm').style.display !== 'none' || h.api.terms().length !== 3 || h.removeItemCalls.length) throw new Error('Escape (and other keys must not)');
});

check('delete-all UI: "export first" downloads the same backup as the Export button, keeps the terms, and then asks again; "Delete now" removes them from memory and local storage', () => {
  const h = makeClearTermsHarness();
  h.click('customClearBtn'); h.click('customClearExportBtn');
  if (h.downloads.length !== 1 || h.downloads[0].name !== 'pii-redactor-custom-terms.json') throw new Error('export: ' + JSON.stringify(h.downloads));
  const payload = JSON.parse(h.downloads[0].payload);
  if (JSON.stringify(payload.terms) !== JSON.stringify(['Tamesh', 'Nkem', 'Oct']) || payload.caseSensitive !== true) throw new Error('backup content: ' + h.downloads[0].payload);
  if (h.api.terms().length !== 3 || h.removeItemCalls.length) throw new Error('exporting must not delete');
  if (h.api.state() !== 'exported' || !h.el('customClearMessage').textContent.includes('Backup exported. Delete all 3 custom terms now?')) throw new Error('second question: ' + h.el('customClearMessage').textContent);
  if (h.el('customClearExportBtn').style.display !== 'none' || h.el('customClearDeleteBtn').textContent !== 'Delete now') throw new Error('buttons after export');
  if (h.focusLog[h.focusLog.length - 1] !== 'customClearCancelBtn') throw new Error('focus after export should be the safe button');
  h.click('customClearDeleteBtn');
  if (h.api.terms().length !== 0 || JSON.stringify(h.removeItemCalls) !== JSON.stringify(['piiRedactorCustomTerms'])) throw new Error('not deleted: ' + JSON.stringify(h.removeItemCalls));
  if (h.el('customClearConfirm').style.display !== 'none' || !h.el('customClearBtn').disabled || h.el('customClearStatus').textContent !== 'Deleted 3 custom terms.') throw new Error('after delete: ' + h.el('customClearStatus').textContent);
  if (h.focusLog[h.focusLog.length - 1] !== 'customInput') throw new Error('focus should move to the input when the list is empty');
});

check('delete-all UI: "Delete without exporting" deletes, and does NOT export; a blocked localStorage still empties the list in memory', () => {
  const h = makeClearTermsHarness();
  h.fakeLocalStorage.failing = true;
  h.click('customClearBtn'); h.click('customClearDeleteBtn');
  if (h.api.terms().length !== 0 || h.downloads.length !== 0) throw new Error('delete anyway: ' + h.api.terms().length + ' / ' + h.downloads.length);
  if (h.el('customClearStatus').textContent !== 'Deleted 3 custom terms.') throw new Error(h.el('customClearStatus').textContent);
});

check('delete-all UI: the warning and the status follow the language, a list emptied under the warning closes it, and a new term clears the "Deleted" note', () => {
  const h = makeClearTermsHarness();
  h.click('customClearBtn');
  h.api.setLang('de');
  if (!h.el('customClearMessage').textContent.includes('Alle eigenen Begriffe (3) löschen?') || h.el('customClearDeleteBtn').textContent !== 'Ohne Export löschen') throw new Error('de: ' + h.el('customClearMessage').textContent);
  h.api.setLang('vi');
  if (!h.el('customClearMessage').textContent.includes('bộ nhớ cục bộ')) throw new Error('vi: ' + h.el('customClearMessage').textContent);
  h.api.setTerms([]);
  if (h.el('customClearConfirm').style.display !== 'none' || h.api.state() !== 'idle') throw new Error('the warning stayed open for an empty list');
  const h2 = makeClearTermsHarness(['x']);
  h2.click('customClearBtn');
  if (!h2.el('customClearMessage').textContent.includes('Delete all 1 custom term?')) throw new Error('singular: ' + h2.el('customClearMessage').textContent);
  h2.click('customClearDeleteBtn');
  if (h2.el('customClearStatus').textContent !== 'Deleted 1 custom term.') throw new Error(h2.el('customClearStatus').textContent);
});

check('guard: only the confirmed flow can empty the list, the old Export button shares the backup code, and other list changes clear the "Deleted" note', () => {
  if (html.split('forgetAllCustomTerms(').length - 1 !== 2) throw new Error('forgetAllCustomTerms must have exactly one definition and one call');
  const dispatch = html.slice(html.indexOf('function dispatchClearTerms'), html.indexOf("clearTermsBtn.addEventListener('click'"));
  if (!/if \(effect === 'delete'\) \{[^}]*forgetAllCustomTerms\(\)/.test(dispatch)) throw new Error('the call is not behind the delete effect');
  if (html.split('customTerms = [];').length - 1 !== 1) throw new Error('customTerms is emptied somewhere other than forgetAllCustomTerms');
  if (!html.includes("document.getElementById('customExportBtn').addEventListener('click', exportCustomTerms);")) throw new Error('the Export button does not use exportCustomTerms');
  for (const fn of ['function addCustomTerm()', 'function removeCustomTerm(term)']) {
    const start = html.indexOf(fn);
    const end = html.indexOf('\nfunction ', start + 10);
    if (!html.slice(start, end).includes('clearedCount = null;')) throw new Error(fn + ' does not clear the "Deleted" note');
  }
  if (!/clearedCount = null;\s+customTerms = merged;/.test(html)) throw new Error('importing does not clear the "Deleted" note');
  if (!html.includes('  renderClearTermsUi();\n}')) throw new Error('the chip list does not refresh the clear-all UI');
  const listBlock = html.slice(html.indexOf('id="customClearBtn"'), html.indexOf('id="customClearStatus"'));
  if (!/id="customClearConfirm" role="alert"/.test(listBlock)) throw new Error('the warning should be announced (role="alert")');
});

// --- face detection (v1.3, step 3) -----------------------------------------
const faceModelCode = extractBetween('// FACE_MODEL_START', '// FACE_MODEL_END', 'FACE_MODEL');
const faceUiCode = extractBetween('// FACE_UI_START', '// FACE_UI_END', 'FACE_UI');
const faceApi = new Function(`${regionModelCode}\n${faceModelCode}\nreturn { FACE_STYLES, isFaceStyle, rgbaToGray, planFaceScan, faceDetectionsToRegions, faceCoverParams, mosaicRgba, blurRgba, paintFaceCover, paintAllRegions, createRegionStore, combineRegions, regionKey };`)();

// A tiny canvas stand-in that really stores pixels, so the painters can be checked on real bytes.
function fakeCanvasCtx(width, height, fill = [200, 100, 50]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) { data[i * 4] = (fill[0] + (i * 37) % 55) % 256; data[i * 4 + 1] = (fill[1] + (i * 91) % 97) % 256; data[i * 4 + 2] = fill[2]; data[i * 4 + 3] = 255; }
  return {
    width, height, data, fillStyle: '',
    fillRect(x, y, w, h) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const p = (yy * width + xx) * 4; data[p] = 0; data[p + 1] = 0; data[p + 2] = 0; data[p + 3] = 255; } },
    getImageData(x, y, w, h) { const out = new Uint8ClampedArray(w * h * 4); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const s = ((y + yy) * width + x + xx) * 4, d = (yy * w + xx) * 4; for (let k = 0; k < 4; k++) out[d + k] = data[s + k]; } return { data: out, width: w, height: h }; },
    putImageData(img, x, y) { for (let yy = 0; yy < img.height; yy++) for (let xx = 0; xx < img.width; xx++) { const d = ((y + yy) * width + x + xx) * 4, s = (yy * img.width + xx) * 4; for (let k = 0; k < 4; k++) data[d + k] = img.data[s + k]; } }
  };
}
const pixelAt = (ctx, x, y) => Array.from(ctx.data.slice((y * ctx.width + x) * 4, (y * ctx.width + x) * 4 + 4));

check('faces: rgbaToGray gives one luminance byte per pixel', () => {
  const gray = faceApi.rgbaToGray(new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 100, 100, 100, 255]), 3, 1);
  if (gray.length !== 3 || gray[0] < 254 || gray[1] !== 0 || gray[2] !== 100) throw new Error('unexpected gray values ' + Array.from(gray));
});
check('faces: planFaceScan shrinks big images, never enlarges small ones, and keeps the size range sane', () => {
  const big = faceApi.planFaceScan(4000, 2000);
  if (big.scale !== 0.25 || big.width !== 1000 || big.height !== 500) throw new Error('big image not shrunk to 1000 px: ' + JSON.stringify(big));
  const small = faceApi.planFaceScan(300, 200);
  if (small.scale !== 1 || small.width !== 300) throw new Error('small image must not be enlarged');
  for (const p of [big, small, faceApi.planFaceScan(10, 10)]) if (!(p.params.minsize >= 20) || p.params.maxsize < 1) throw new Error('bad size range ' + JSON.stringify(p.params));
});
check('faces: detections become regions in ORIGINAL pixels; weak and degenerate ones are dropped; boxes stay inside the image', () => {
  const regions = faceApi.faceDetectionsToRegions([[100, 100, 50, 6], [50, 50, 50, 4.9], [5, 5, 200, 9], [0, 0, 1, 9]], 0.5, 2000, 1000);
  if (regions.length !== 2) throw new Error('expected 2 regions (score 4.9 dropped, 1-px face dropped), got ' + regions.length);
  const first = regions[0];
  if (first.kind !== 'face' || first.why !== 'face') throw new Error('region must be tagged as a face');
  if (!(first.box.x0 < 200 && first.box.x1 > 200 && first.box.y0 < 200 && first.box.y1 > 200)) throw new Error('box must surround the detection centre scaled back to the original (200,200)');
  if (first.box.x0 !== 138 || first.box.x1 !== 262 || first.box.y0 !== 138 || first.box.y1 !== 262) throw new Error('size must be scaled back too: ' + JSON.stringify(first.box));
  for (const r of regions) if (r.box.x0 < 0 || r.box.y0 < 0 || r.box.x1 > 2000 || r.box.y1 > 1000) throw new Error('box outside the image');
});
check('faces: mosaic leaves exactly one colour per block (so the detail is really gone)', () => {
  const ctx = fakeCanvasCtx(40, 40);
  const image = ctx.getImageData(0, 0, 40, 40);
  faceApi.mosaicRgba(image.data, 40, 40, 10);
  const colours = new Set();
  for (let i = 0; i < 40 * 40; i++) colours.add(Array.from(image.data.slice(i * 4, i * 4 + 4)).join(','));
  if (colours.size > 16) throw new Error('more than 16 colours for 4x4 blocks: ' + colours.size);
  const before = ctx.getImageData(0, 0, 40, 40).data;
  let sumR = 0;
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) sumR += before[(y * 40 + x) * 4];
  if (image.data[0] !== Math.round(sumR / 100)) throw new Error('the first block must hold the exact average colour, got ' + image.data[0] + ' expected ' + Math.round(sumR / 100));
  for (let i = 0; i < 40 * 40; i++) if (image.data[i * 4 + 3] !== 255) throw new Error('mosaic must be opaque');
});
check('faces: blur keeps a flat area flat, smooths a hard edge, stays opaque', () => {
  const flat = new Uint8ClampedArray(20 * 20 * 4).fill(120);
  for (let i = 3; i < flat.length; i += 4) flat[i] = 255;
  faceApi.blurRgba(flat, 20, 20, 4);
  if (flat.some((v, i) => v !== (i % 4 === 3 ? 255 : 120))) throw new Error('a uniform image changed');
  const edge = new Uint8ClampedArray(20 * 20 * 4);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) { const p = (y * 20 + x) * 4; const v = x < 10 ? 0 : 255; edge[p] = v; edge[p + 1] = v; edge[p + 2] = v; edge[p + 3] = 255; }
  faceApi.blurRgba(edge, 20, 20, 3);
  const mid = edge[(10 * 20 + 10) * 4];
  if (!(mid > 0 && mid < 255)) throw new Error('the edge was not smoothed: ' + mid);
  if (edge[3] !== 255) throw new Error('blur must be opaque');
});
check('faces: cover strength grows with the face size', () => {
  const small = faceApi.faceCoverParams({ x0: 0, y0: 0, x1: 40, y1: 40 });
  const large = faceApi.faceCoverParams({ x0: 0, y0: 0, x1: 400, y1: 400 });
  if (!(large.block > small.block) || !(large.radius > small.radius)) throw new Error('large faces need larger blocks and radius');
  if (large.block < 400 / 5 - 1) throw new Error('at most about 5x5 blocks per face');
});
check('faces: paintAllRegions covers faces in the chosen style and everything else in solid black; disabled regions are untouched', () => {
  const regions = (store) => faceApi.combineRegions([
    { box: { x0: 0, y0: 0, x1: 20, y1: 20 }, kind: 'face', why: 'face', text: '' },
    { box: { x0: 30, y0: 30, x1: 40, y1: 40 }, why: 'email', text: 'x' }
  ], store);
  const store = faceApi.createRegionStore();
  store.addManual({ x0: 50, y0: 0, x1: 60, y1: 10 });
  const original = fakeCanvasCtx(64, 64);
  for (const style of ['solid', 'mosaic', 'blur']) {
    const ctx = fakeCanvasCtx(64, 64);
    faceApi.paintAllRegions(ctx, regions(store), style);
    const textBox = pixelAt(ctx, 35, 35), manual = pixelAt(ctx, 55, 5), face = pixelAt(ctx, 5, 5);
    if (textBox.slice(0, 3).join() !== '0,0,0' || manual.slice(0, 3).join() !== '0,0,0') throw new Error(style + ': non-face regions must be solid black');
    const faceIsBlack = face.slice(0, 3).join() === '0,0,0';
    if (style === 'solid' && !faceIsBlack) throw new Error('solid style must be black');
    if (style !== 'solid' && faceIsBlack) throw new Error(style + ' style must not be black');
    if (pixelAt(ctx, 60, 60).join() !== pixelAt(original, 60, 60).join()) throw new Error('pixels outside every region changed');
  }
  const list = regions(store);
  store.toggleAuto(list[0].key);
  const ctx = fakeCanvasCtx(64, 64);
  faceApi.paintAllRegions(ctx, regions(store), 'solid');
  if (pixelAt(ctx, 5, 5).join() !== pixelAt(original, 5, 5).join()) throw new Error('a switched-off face was still covered');
});
check('faces: combineRegions keeps the face kind and tags text regions as text', () => {
  const list = faceApi.combineRegions([{ box: { x0: 1, y0: 1, x1: 9, y1: 9 }, kind: 'face', why: 'face' }, { box: { x0: 2, y0: 2, x1: 8, y1: 8 }, why: 'ip' }], faceApi.createRegionStore());
  if (list[0].kind !== 'face' || list[1].kind !== 'text') throw new Error(JSON.stringify(list.map(r => r.kind)));
});

await checkAsync('faces: the UI loads the detector once, from the local vendor folder, and turns detections into regions', async () => {
  const listeners = {};
  const els = {};
  const el = (id) => els[id] || (els[id] = { id, value: 'solid', textContent: '', style: {}, disabled: false, addEventListener(t, fn) { listeners[id + ':' + t] = fn; } });
  const calls = { fetch: [], unpack: 0, render: 0, cascade: 0 };
  const doc = {
    getElementById: el,
    createElement: () => { const c = fakeCanvasCtx(1, 1); return { width: 0, height: 0, getContext: () => ({ ...c, fillStyle: '', fillRect() {}, drawImage() {}, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }) }; }
  };
  const pico = {
    unpack_cascade: () => { calls.unpack++; return () => 1; },
    run_cascade: () => { calls.cascade++; return [[60, 80, 40, 9]]; },
    cluster_detections: (d) => d
  };
  const fetchStub = async (url) => { calls.fetch.push(url); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
  const source = `
    let currentLang = 'en';
    const I18N = { en: I18N_FACES_EN };
    let originalImageBitmap = { naturalWidth: 200, naturalHeight: 150 };
    function renderImageRedactions() { calls.render++; }
    ${faceModelCode}
    ${faceUiCode}
    return { regions: () => imgFaceRegions, status: () => imgFaceStatus, style: () => imgFaceStyle, resetFaces, setBitmap: (b) => { originalImageBitmap = b; } };
  `;
  const i18nFacesCode = extractBetween('// I18N_FACES_START', '// I18N_FACES_END', 'I18N_FACES');
  const { I18N_FACES } = new Function(`${i18nFacesCode}\nreturn { I18N_FACES };`)();
  const api = new Function('document', 'pico', 'fetch', 'calls', 'I18N_FACES_EN', 'clampRect', 'rectIsUsable', 'paintRedactionBoxes', source)(doc, pico, fetchStub, calls, I18N_FACES.en, faceApi.clampRectForTest || ((r, w, h) => ({ x0: Math.max(0, r.x0), y0: Math.max(0, r.y0), x1: Math.min(w, r.x1), y1: Math.min(h, r.y1) })), () => true, () => {});
  await listeners['imgFaceBtn:click']();
  if (api.regions().length !== 1 || api.regions()[0].kind !== 'face') throw new Error('detection did not produce a face region');
  if (calls.fetch.length !== 1 || calls.fetch[0] !== 'vendor/pico/facefinder') throw new Error('detector must come from vendor/pico/facefinder: ' + calls.fetch);
  await listeners['imgFaceBtn:click']();
  if (calls.fetch.length !== 1 || calls.unpack !== 1) throw new Error('the detector data must be loaded only once');
  if (calls.render !== 2) throw new Error('every detection must re-render');
  if (!/Found 1 face/.test(els.imgFaceStatus.textContent) || !/blur|Solid/i.test(els.imgFaceStatus.textContent)) throw new Error('status text: ' + els.imgFaceStatus.textContent);
  els.imgFaceStyle.value = 'blur';
  listeners['imgFaceStyle:change']();
  if (api.style() !== 'blur' || !/Warning/.test(els.imgFaceStatus.textContent)) throw new Error('choosing blur must show the honesty warning');
  els.imgFaceStyle.value = 'nonsense';
  listeners['imgFaceStyle:change']();
  if (api.style() !== 'solid') throw new Error('an unknown style must fall back to solid');
  api.resetFaces();
  if (api.regions().length !== 0 || api.status() !== null) throw new Error('resetFaces must forget detections');
});
await checkAsync('faces: when the detector cannot be loaded the person is told and drawing still works', async () => {
  const listeners = {}, els = {};
  const el = (id) => els[id] || (els[id] = { id, value: 'solid', textContent: '', style: {}, disabled: false, addEventListener(t, fn) { listeners[id + ':' + t] = fn; } });
  const i18nFacesCode = extractBetween('// I18N_FACES_START', '// I18N_FACES_END', 'I18N_FACES');
  const { I18N_FACES } = new Function(`${i18nFacesCode}\nreturn { I18N_FACES };`)();
  const source = `
    let currentLang = 'de';
    const I18N = { de: I18N_FACES_DE };
    let originalImageBitmap = { naturalWidth: 10, naturalHeight: 10 };
    let renders = 0;
    function renderImageRedactions() { renders++; }
    ${faceModelCode}
    ${faceUiCode}
    return { status: () => imgFaceStatus, renders: () => renders, btn: () => imgFaceBtn };
  `;
  const origError = console.error; console.error = () => {};
  try {
    const api = new Function('document', 'pico', 'fetch', 'I18N_FACES_DE', 'clampRect', 'rectIsUsable', 'paintRedactionBoxes', source)({ getElementById: el }, {}, async () => ({ ok: false, status: 404 }), I18N_FACES.de, () => ({}), () => true, () => {});
    await listeners['imgFaceBtn:click']();
    if (api.status().kind !== 'error' || !/file:\/\//.test(els.imgFaceStatus.textContent)) throw new Error('the error must be explained: ' + els.imgFaceStatus.textContent);
    if (els.imgFaceBtn.disabled) throw new Error('the button must work again after a failure');
    if (api.renders() !== 1) throw new Error('must still re-render');
  } finally { console.error = origError; }
});
check('faces: translations exist in all four languages with the same keys, and the cover-style labels are honest', () => {
  const i18nFacesCode = extractBetween('// I18N_FACES_START', '// I18N_FACES_END', 'I18N_FACES');
  const { I18N_FACES } = new Function(`${i18nFacesCode}\nreturn { I18N_FACES };`)();
  const keys = Object.keys(I18N_FACES.en).sort().join();
  for (const l of ['vi', 'en', 'fr', 'de']) if (Object.keys(I18N_FACES[l]).sort().join() !== keys) throw new Error('keys differ in ' + l);
  if (!/irreversible/i.test(I18N_FACES.en.faceStyleSolid)) throw new Error('solid must be labelled irreversible');
  if (!/not guaranteed/i.test(I18N_FACES.en.faceStyleMosaic)) throw new Error('mosaic must say it is not guaranteed');
  if (!/cosmetic/i.test(I18N_FACES.en.faceStyleBlur) || !/reversible/i.test(I18N_FACES.en.faceStyleBlur)) throw new Error('blur must be labelled cosmetic / partly reversible');
  for (const l of ['vi', 'en', 'fr', 'de']) for (const k of ['faceNote_solid', 'faceNote_mosaic', 'faceNote_blur']) if (!I18N_FACES[l][k]) throw new Error('missing ' + k + ' in ' + l);
});
await checkAsync('guard: faces share the one region list, load only from vendor/, and the vendored detector is exactly the audited files', async () => {
  const render = html.slice(html.indexOf('function renderImageRedactions()'), html.indexOf("imgScanBtn.addEventListener('click'"));
  if (!render.includes('combineRegions(found.regions.concat(imgFaceRegions), imgRegionStore)')) throw new Error('faces must join the same region list as OCR and drawn regions');
  if (!render.includes('paintAllRegions(imgCtx, lastImgEffective, imgFaceStyle);')) throw new Error('the export must be painted by paintAllRegions');
  if (/innerHTML|insertAdjacentHTML|outerHTML/.test(faceUiCode)) throw new Error('the face UI writes markup');
  const urls = faceUiCode.match(/fetch\(([^)]*)\)/g) || [];
  if (urls.length !== 1 || !urls[0].includes("'vendor/pico/facefinder'")) throw new Error('the only fetch must be the local vendor file: ' + urls);
  if (!html.includes('<script src="vendor/pico/pico.js"></script>')) throw new Error('pico.js must be loaded from vendor/');
  const { createHash } = await import('node:crypto');
  const sha = (f) => createHash('sha256').update(readFileSync(path.join(__dirname, '..', 'vendor', 'pico', f))).digest('hex');
  if (sha('pico.js') !== '785b981cc79e5fa3f7557dc3fa7773629d7529994d7627de41b77d8687649309') throw new Error('vendor/pico/pico.js is not the audited file');
  if (sha('facefinder') !== 'd8014993e7298c7b1865d1f8b855d6dbf4ec5c808bf879e2091ab6837abf90cd') throw new Error('vendor/pico/facefinder is not the audited file');
  const notice = readFileSync(path.join(__dirname, '..', 'vendor', 'NOTICE.md'), 'utf8');
  if (!/pico/i.test(notice) || !notice.includes('d8014993e7298c7b1865d1f8b855d6dbf4ec5c808bf879e2091ab6837abf90cd')) throw new Error('vendor/NOTICE.md must record the detector and its hash');
  for (const id of ['imgFaceBar', 'imgFaceBtn', 'imgFaceStyle', 'imgFaceStatus']) if (!html.includes(`id="${id}"`)) throw new Error('missing #' + id);
});

// --- release consistency (v1.2.1, step 4) --------------------------------
// Small guards so the things a reader sees -- version labels, quoted UI
// strings in the guides, test counts -- cannot silently drift from the code.

const readRepoFile = rel => readFileSync(path.join(__dirname, '..', rel), 'utf8');
const readmeText = readRepoFile('README.md');
const changelogText = readRepoFile('CHANGELOG.md');

// --- logo, tagline, CSP (v1.3.1) ---------------------------------------------
const logoSvgFile = readRepoFile('docs/images/logo.svg').trim();
const drawingOf = (svg) => (svg.match(/<(?:path|rect)\b[^>]*>/g) || []).join('');
const logoDrawing = drawingOf(logoSvgFile);

check('logo: the same drawing is in the SVG file, the page header and the data: URI favicon, and it cannot load anything', () => {
  if (!/^<svg [^>]*viewBox="[^"]+"/.test(logoSvgFile)) throw new Error('logo.svg must start with an <svg> that has a viewBox');
  if (!logoDrawing.includes('M619 320 L965 192')) throw new Error('the logo drawing could not be found');
  for (const svg of [logoSvgFile]) if (/<script|<foreignObject|<image|<use|xlink:href|\bhref=|url\(|@import|\son\w+=/i.test(svg)) throw new Error('the logo SVG must be pure shapes (no script, image, link, url() or event attribute)');
  const header = (html.match(/<svg class="logo"[\s\S]*?<\/svg>/) || [])[0];
  if (!header) throw new Error('the page header must contain the inline logo');
  if (drawingOf(header) !== logoDrawing) throw new Error('the header logo differs from docs/images/logo.svg');
  if (!/aria-hidden="true"/.test(header)) throw new Error('the decorative header logo should be hidden from screen readers (the title already names the tool)');
  const fav = (html.match(/<link rel="icon" type="image\/svg\+xml" href="(data:image\/svg\+xml,[^"]+)">/) || [])[1];
  if (!fav) throw new Error('the favicon must be a data: URI');
  const decoded = decodeURIComponent(fav.slice('data:image/svg+xml,'.length)).replace(/'/g, '"');
  if (drawingOf(decoded) !== logoDrawing) throw new Error('the favicon differs from docs/images/logo.svg');
  if (/https?:/.test(decoded.replace('http://www.w3.org/2000/svg', ''))) throw new Error('the favicon contains a URL other than the SVG namespace');
  if (!readRepoFile('README.md').includes('docs/images/logo.svg')) throw new Error('the README should show the logo');
});

check('tagline: the header shows it, and all four languages carry the agreed wording and a description', () => {
  if (!/<div class="tagline" data-i18n="tagline">/.test(html)) throw new Error('the header needs a tagline element');
  const main = new Function(`${extractBetween('const I18N = {', 'const ruleListEl', 'I18N main literal')}\nreturn I18N;`)();
  const expected = { en: 'Share documents. Not identities.', vi: 'Chia sẻ tài liệu, bảo vệ danh tính.', de: 'Dokumente teilen. Identitäten schützen.', fr: "Partagez le document, pas l'identité." };
  for (const l of LANGS) {
    if (main[l].tagline !== expected[l]) throw new Error(`tagline in ${l}: "${main[l].tagline}"`);
    if (!main[l].subtitle || main[l].subtitle.length < 60) throw new Error(`description missing in ${l}`);
    if (/AI|KI|IA/.test(main[l].subtitle.replace(/PowerPoint/g, ''))) throw new Error(`the description in ${l} should not limit the tool to AI use`);
  }
  if (!readRepoFile('README.md').includes(expected.en)) throw new Error('the README should carry the tagline');
});

check('csp: the policy blocks every outbound route, and the page references no external resource', () => {
  const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/) || [])[1];
  if (!csp) throw new Error('the Content-Security-Policy meta tag is missing');
  const directive = (name) => (csp.split(';').map(s => s.trim()).find(s => s.startsWith(name + ' ')) || '').slice(name.length + 1);
  if (directive('default-src') !== "'self'") throw new Error('default-src must be only \'self\'');
  if (directive('connect-src') !== "'self'") throw new Error('connect-src must be only \'self\' (no outbound requests)');
  if (directive('form-action') !== "'none'") throw new Error('forms must not be able to submit anywhere');
  if (/\*|https?:/.test(csp)) throw new Error('the policy must not allow any wildcard or external origin');
  if (!directive('img-src').split(' ').includes('data:')) throw new Error('img-src needs data: (the favicon)');
  const external = [];
  for (const m of html.matchAll(/<(script|img|iframe|source|video|audio|embed|object)\b[^>]*\bsrc="([^"]*)"/g)) external.push(m[2]);
  for (const m of html.matchAll(/<link\b[^>]*\bhref="([^"]*)"/g)) if (!m[1].startsWith('data:')) external.push(m[1]);
  for (const m of html.matchAll(/url\(\s*['"]?([^)'"]+)/g)) external.push(m[1]);
  for (const m of html.matchAll(/@import\s+['"]?([^'";\s]+)/g)) external.push(m[1]);
  const bad = external.filter(u => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(u) && !u.startsWith('data:') && !u.startsWith('blob:'));
  if (bad.length) throw new Error('external resources referenced: ' + bad.join(', '));
});

check('release: the version label in the UI, README title, README "current" entry and CHANGELOG all agree', () => {
  const ui = (html.match(/<span class="version-tag">v(\d+\.\d+\.\d+)<\/span>/) || [])[1];
  const readmeTitle = (readmeText.match(/^# PII Redactor <sup>v(\d+\.\d+\.\d+)<\/sup>/m) || [])[1];
  const readmeCurrent = (readmeText.match(/- \*\*v(\d+\.\d+\.\d+)\*\* \(current\)/) || [])[1];
  const changelogTop = (changelogText.match(/^## \[(\d+\.\d+\.\d+)\]/m) || [])[1];
  const versions = { ui, readmeTitle, readmeCurrent, changelogTop };
  if (!ui || new Set(Object.values(versions)).size !== 1) throw new Error('version labels disagree: ' + JSON.stringify(versions));
  if (!changelogText.includes(`[${ui}]: https://github.com/pakmeipanther/pii-redactor/releases/tag/v${ui}`)) throw new Error(`CHANGELOG has no link reference for ${ui}`);
});

const { I18N_FACES: I18N_FACES_GUIDE } = new Function(`${extractBetween('// I18N_FACES_START', '// I18N_FACES_END', 'I18N_FACES')}\nreturn { I18N_FACES };`)();
check('release: the four user guides have the same structure and quote the exact UI labels of their own language', () => {
  const counts = {};
  for (const l of LANGS) {
    const text = readRepoFile(`docs/guide.${l}.md`);
    counts[l] = (text.match(/^## /gm) || []).length;
    for (const key of ['metaReportTitle', 'metaHideValues']) {
      if (!text.includes(I18N_METADATA[l][key])) throw new Error(`docs/guide.${l}.md does not quote the UI string ${key}: "${I18N_METADATA[l][key]}"`);
    }
    if (!/ICC/.test(text)) throw new Error(`docs/guide.${l}.md does not mention the ICC note`);
    if (!/WebAssembly/.test(text) || !/Lockdown/.test(text)) throw new Error(`docs/guide.${l}.md does not mention WebAssembly / Lockdown Mode`);
    if (!text.includes(I18N_REGIONS[l].drawToggle)) throw new Error(`docs/guide.${l}.md does not quote the drawing tool label: "${I18N_REGIONS[l].drawToggle}"`);
    if (!text.includes(I18N_FACES_GUIDE[l].faceDetectBtn)) throw new Error(`docs/guide.${l}.md does not quote the face detection label: "${I18N_FACES_GUIDE[l].faceDetectBtn}"`);
    if (!text.includes(I18N_CLEAR_TERMS[l].clearAllBtn)) throw new Error(`docs/guide.${l}.md does not quote the delete-all label: "${I18N_CLEAR_TERMS[l].clearAllBtn}"`);
    for (const [what, label] of [['thorough scan label', I18N_OCR[l].imgThoroughLabel], ['OCR text box title', I18N_OCR[l].imgOcrTextTitle]]) {
      const quoted = label.split(' (')[0];
      if (!text.includes(quoted)) throw new Error(`docs/guide.${l}.md does not quote the ${what}: "${quoted}"`);
    }
  }
  if (new Set(Object.values(counts)).size !== 1) throw new Error('guides have different numbers of sections: ' + JSON.stringify(counts));
});

check('release: every guide covers all ten features and quotes the buttons of each one exactly as its own interface spells them', () => {
  const faces = I18N_FACES_GUIDE;
  const main = new Function(`${extractBetween('const I18N = {', 'const ruleListEl', 'I18N main literal')}\nreturn I18N;`)();
  const wanted = (l) => [
    ['text scan', main[l].scanBtn], ['text download', main[l].downloadBtn], ['add term', main[l].addBtn], ['case-sensitive', main[l].caseSensitiveLabel],
    ['export list', main[l].exportBtn], ['import list', main[l].importBtn], ['delete-all: export first', main[l].clearExportFirst],
    ['delete-all: delete anyway', main[l].clearDeleteAnyway], ['delete-all: delete now', main[l].clearDeleteNow],
    ['image scan', main[l].imgScanBtn], ['image download', main[l].imgDownloadBtn], ['image to PDF', main[l].imgDownloadPdfBtn],
    ['undo', main[l].undoBtn], ['redo', main[l].redoBtn], ['remove drawn areas', main[l].clearManualBtn],
    ['face style label', faces[l].faceStyleLabel.replace(/:$/, '')], ['solid black', faces[l].faceStyleSolid], ['mosaic', faces[l].faceStyleMosaic], ['blur', faces[l].faceStyleBlur],
    ['PDF scan', main[l].pdfScanBtn], ['PDF download', main[l].pdfDownloadBtn], ['Word/PowerPoint convert', main[l].docxScanBtn],
    ['suspect list title', main[l].imgSuspectListTitle], ['metadata show/hide', main[l].metaHideValues], ['detected prefix', main[l].detectedTypePrefix.replace(/\s*:$/, '')]
  ];
  for (const l of LANGS) {
    const text = readRepoFile(`docs/guide.${l}.md`);
    for (const [what, label] of wanted(l)) if (!text.includes(label)) throw new Error(`docs/guide.${l}.md does not quote "${what}": "${label}"`);
    if ((text.match(/^## /gm) || []).length < 14) throw new Error(`docs/guide.${l}.md should have a section per feature`);
    if (!text.includes('images/demo.gif')) throw new Error(`docs/guide.${l}.md should show the demo GIF`);
  }
});

check('release: the test counts quoted in README and CHANGELOG match the suite', () => {
  const total = passed + failed + 1; // + this check itself
  const readmeClaim = Number((readmeText.match(/As of v\d+(?:\.\d+)*(?: \([a-z]+\))?:\s+(\d+)\s+tests,\s+all\s+passing/) || [])[1]);
  const changelogClaim = Number((changelogText.match(/grown from \d+ to (\d+) tests/) || [])[1]);
  if (readmeClaim !== total) throw new Error(`README says ${readmeClaim} tests, the suite has ${total}`);
  if (changelogClaim !== total) throw new Error(`CHANGELOG says ${changelogClaim} tests, the suite has ${total}`);
});

// --- report ------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed (${passed + failed} total)\n`);
if (failed > 0) {
  for (const f of failures) {
    console.log(`✗ ${f.name}\n  ${f.error}`);
  }
  process.exitCode = 1;
} else {
  console.log('All detection-pipeline tests passed.');
}
