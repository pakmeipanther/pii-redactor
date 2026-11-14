#!/usr/bin/env node
/**
 * Writes precache.json: the list of files the "Save for offline use" button
 * stores in the browser (see sw.js). Run by the Pages workflow on the staged
 * site folder:
 *
 *     node scripts/make-precache.mjs _site
 *
 * What is left out, and why:
 *  - tesseract-core*.wasm (the raw WebAssembly): the OCR worker loads the
 *    *.wasm.js files, which carry the WebAssembly inside them.
 *  - the non-LSTM cores: the app always starts OCR in LSTM-only mode, so
 *    those variants are never requested.
 *  - licence and notice text: not needed to run.
 * Anything left out is still fetched (and kept) on demand if a future change
 * starts to need it, because sw.js stores whatever the page asks for.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');

const INCLUDE_TOP = ['index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const SKIP = [
  /\/tesseract-core[^/]*\.wasm$/,
  /\/tesseract-core(-simd|-relaxedsimd)?\.wasm\.js$/,
  /(^|\/)(LICENSE|NOTICE)[^/]*$/i,
  /\.DS_Store$/
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const rel = p => path.relative(root, p).split(path.sep).join('/');
const files = [];
for (const p of INCLUDE_TOP) files.push(p);
for (const full of walk(path.join(root, 'vendor'))) {
  const r = rel(full);
  if (SKIP.some(re => re.test('/' + r))) continue;
  files.push(r);
}

const entries = files.map(p => ({ path: p, size: statSync(path.join(root, p)).size }));
const totalBytes = entries.reduce((n, f) => n + f.size, 0);
writeFileSync(path.join(root, 'precache.json'), JSON.stringify({ totalBytes, files: entries }, null, 1) + '\n');
console.log(`precache.json: ${entries.length} files, ${(totalBytes / 1048576).toFixed(1)} MB`);
