// Runs in a Web Worker. Tries one user-defined regular expression against a few
// "nasty" strings (long runs of the same character followed by a character that
// forces backtracking). The page that started this worker kills it with
// worker.terminate() if no answer arrives in time, so a pattern that would
// freeze the page only ever freezes this disposable worker.
// No network access, no DOM access, no data from the person's documents.
self.onmessage = function (e) {
  var d = e.data || {};
  try {
    var re = new RegExp(d.src, d.flags || 'gi');
    var samples = d.samples || [];
    for (var i = 0; i < samples.length; i++) { re.lastIndex = 0; re.test(samples[i]); }
    self.postMessage({ ok: true });
  } catch (err) {
    self.postMessage({ ok: false, reason: 'invalid' });
  }
};
