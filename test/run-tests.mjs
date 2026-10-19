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

const combined = `${rulesCode}\n${findCustomMatchesCode}\n${findMatchesCode}\nreturn { RULES, findCustomMatches, findMatches };`;
const { RULES, findMatches } = new Function(combined)();

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
