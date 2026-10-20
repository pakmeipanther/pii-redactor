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
  '\nlet lastCleanedText',
  'findMatches'
);
const textItemBBoxAndPadCode = extractBetween(
  'function textItemBBox(viewport, item, fracStart = 0, fracEnd = 1) {',
  '\n\n// Renders one page',
  'textItemBBox + redactionPadX'
);
const wordsToRedactCode = extractBetween(
  'function wordsToRedact(lineWords, activeRules, terms, caseSensitive) {',
  '\n\n// Creates a Tesseract worker',
  'wordsToRedact'
);
const docxPureFunctionsCode = extractBetween(
  'function decodeXmlText(raw) {',
  '\n\n// Pulls visible text from every relevant part inside the .docx zip',
  'decodeXmlText + extractDocxParagraphs + redactParagraphs'
);

const combined = `${rulesCode}\n${findCustomMatchesCode}\n${findMatchesCode}\n${textItemBBoxAndPadCode}\n${wordsToRedactCode}\n${docxPureFunctionsCode}\nreturn { RULES, findCustomMatches, findMatches, textItemBBox, redactionPadX, wordsToRedact, decodeXmlText, extractDocxParagraphs, redactParagraphs };`;
const { RULES, findMatches, textItemBBox, redactionPadX, wordsToRedact, decodeXmlText, extractDocxParagraphs, redactParagraphs } = new Function(combined)();

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

check('wordsToRedact: a custom term the OCR engine split into two word boxes is still caught', () => {
  // Reproduces the reported bug: typing the custom term "quangcao" (all
  // lowercase) correctly redacts an image where OCR reads the text as
  // one word ("QuangCao"), but a real-world OCR pass can instead
  // segment a mixed-case run like this into two separate word boxes —
  // "Quang" and "Cao" — with almost no gap between them (it's the same
  // glued-together word, not two words). Checking each word on its own
  // (the old behavior) never finds "quangcao" in either fragment.
  const line = [fakeWord('Quang', 100, 150), fakeWord('Cao', 151, 190)]; // 1px gap: clearly the same word
  const flagged = wordsToRedact(line, [], ['quangcao'], false);
  if (flagged.size !== 2) {
    throw new Error(`expected both OCR word fragments to be flagged, got indices [${[...flagged].join(',')}] (size ${flagged.size})`);
  }
});

check('wordsToRedact: an ordinary single-word match still works (no regression)', () => {
  const line = [fakeWord('Invoice', 20, 120), fakeWord('QuangCao', 130, 260), fakeWord('total', 270, 340)];
  const flagged = wordsToRedact(line, [], ['quangcao'], false);
  if (flagged.size !== 1 || !flagged.has(1)) {
    throw new Error(`expected only index 1 ("QuangCao") flagged, got [${[...flagged].join(',')}]`);
  }
});

check('wordsToRedact: two genuinely separate words are not wrongly glued together', () => {
  // A normal inter-word gap (wide relative to line height) must NOT be
  // treated as one split word — otherwise unrelated neighboring words
  // could combine into an accidental false-positive match.
  const line = [fakeWord('Quang', 100, 150), fakeWord('Bao', 220, 270)]; // 70px gap vs 30px height
  const flagged = wordsToRedact(line, [], ['quangcao'], false);
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
  const flagged = wordsToRedact(line, [], ['quang bao'], false);
  if (flagged.size !== 2 || !flagged.has(1) || !flagged.has(2)) {
    throw new Error(`expected the two words making up "quang bao" flagged, got [${[...flagged].join(',')}]`);
  }
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
