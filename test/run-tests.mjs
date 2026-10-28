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
  'function wordsToRedact(lineWords, activeRules, terms, caseSensitive, entropyEnabled) {',
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

const combined = `${rulesCode}\n${findCustomMatchesCode}\n${findMatchesCode}\n${entropyCode}\n${textItemBBoxAndPadCode}\n${wordsToRedactCode}\n${docxPureFunctionsCode}\n${pptxPureFunctionsCode}\nreturn { RULES, findCustomMatches, findMatches, shannonEntropy, classifyAlphabet, findEntropyMatches, textItemBBox, redactionPadX, wordsToRedact, decodeXmlText, extractDocxParagraphs, redactParagraphs, extractPptxParagraphs };`;
const { RULES, findMatches, shannonEntropy, classifyAlphabet, findEntropyMatches, textItemBBox, redactionPadX, wordsToRedact, decodeXmlText, extractDocxParagraphs, redactParagraphs, extractPptxParagraphs } = new Function(combined)();

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
