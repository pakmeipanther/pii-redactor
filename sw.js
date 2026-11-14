/*
 * Service worker for PII Redactor: lets the page work offline after it has
 * been opened (or "installed") once over https.
 *
 * What it does, and what it deliberately does not do:
 *  - It stores only this app's own files (the page, the vendor/ libraries, the
 *    icons) in the browser's Cache Storage. Nothing the person pastes, drops or
 *    produces ever passes through it: that data never becomes a network
 *    request, so there is nothing for this file to see or keep.
 *  - It never touches another origin (the early return in the fetch handler),
 *    and never caches anything except a plain 200 answer to a GET.
 *  - It never contacts a server of its own: the only request it makes beyond
 *    the browser's normal ones is for files of this same site.
 *  - It does not take over silently when a new version is published: the new
 *    worker waits until the person asks for the update (or closes every tab),
 *    so the page and its libraries always come from the same build.
 *
 * BUILD_ID is replaced with the commit hash by the Pages workflow. A different
 * BUILD_ID makes this file differ, which is what tells the browser that a new
 * version exists, and gives every version its own cache.
 */
'use strict';

const BUILD_ID = '__BUILD_ID__';
const CACHE_PREFIX = 'pii-redactor-';
const CACHE = CACHE_PREFIX + BUILD_ID;

// The small shell that is stored as soon as the worker installs. The big
// libraries (OCR engine, language data, pdf.js...) are stored the first time
// they are used, or all at once when the person presses "Save for offline use".
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'precache.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(answer(req));
});

async function answer(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.status === 200 && res.type === 'basic') cache.put(req, res.clone()).catch(() => { /* storage full: still serve it */ });
  return res;
}

self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'PRECACHE_ALL') event.waitUntil(precacheAll(event.source));
  if (d.type === 'STATUS') event.waitUntil(reportStatus(event.source));
});

function tell(client, msg) {
  try { if (client) client.postMessage(msg); } catch (e) { /* the page is gone: nobody to tell */ }
}

// Tells the page whether every file of precache.json is already stored for
// this version, so it can show "saved" instead of offering the button again.
async function reportStatus(client) {
  try {
    const cache = await caches.open(CACHE);
    const listed = await cache.match('precache.json');
    const list = await listed.json();
    let complete = true;
    for (const f of list.files) {
      if (!(await cache.match(f.path))) { complete = false; break; }
    }
    tell(client, { type: 'STATUS', complete, total: list.totalBytes });
  } catch (err) {
    tell(client, { type: 'STATUS', complete: false, total: 0 });
  }
}

// Stores every file listed in precache.json (written at build time by
// scripts/make-precache.mjs), four at a time, and reports progress in bytes.
async function precacheAll(client) {
  try {
    const cache = await caches.open(CACHE);
    const list = await (await fetch('precache.json', { cache: 'no-store' })).json();
    const files = list.files;
    const total = list.totalBytes;
    let done = 0;
    let next = 0;
    async function worker() {
      while (next < files.length) {
        const f = files[next++];
        if (!(await cache.match(f.path))) {
          const res = await fetch(f.path, { cache: 'no-store' });
          if (res.status !== 200) throw new Error(f.path + ': HTTP ' + res.status);
          await cache.put(f.path, res);
        }
        done += f.size;
        tell(client, { type: 'PRECACHE_PROGRESS', done, total });
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    tell(client, { type: 'PRECACHE_DONE', total });
  } catch (err) {
    tell(client, { type: 'PRECACHE_FAIL', message: String(err && err.message || err) });
  }
}
