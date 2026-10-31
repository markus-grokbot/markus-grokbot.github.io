/* Drop-target mode: level goal = number of piece drops, derived from the reading volume of the next Pairwise Pit round.
   FORMULA (documented in games/ITERATING.md):
     totalWords  = sum over pairs of words(criterion) + words(A.text) + words(B.text)   (an item shown twice counts twice)
     dropsTarget = clamp(round(totalWords / wordsPerDrop), minDrops, maxDrops)
   Default wordsPerDrop = 18: Markus's first human log averaged 155.8 s / 32 pieces = 4.87 s per piece, and at
   ~225 wpm reading speed 4.87 s ~ 18.3 words, so the Tetris segment lasts about as long as reading the round.
   Params live in games/tetris/tuning.json under "dropTarget"; sim/tune.js updates wordsPerDrop from human logs. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.DropTarget = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var DEFAULTS = { wordsPerDrop: 18, minDrops: 8, maxDrops: 60, assumedWpm: 225 };
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  function setWords(set) {
    return (set.pairs || []).reduce(function (a, p) { return a + words(p.criterion) + words(p.a && p.a.text) + words(p.b && p.b.text); }, 0);
  }
  function compute(set, cfg) {
    var c = Object.assign({}, DEFAULTS, cfg || {}), total = setWords(set);
    var raw = Math.round(total / c.wordsPerDrop), target = Math.max(c.minDrops, Math.min(c.maxDrops, raw));
    return { totalWords: total, wordsPerDrop: c.wordsPerDrop, minDrops: c.minDrops, maxDrops: c.maxDrops, rawDrops: raw, dropsTarget: target,
      clamped: raw !== target, estReadSec: Math.round(total / c.assumedWpm * 60),
      formula: 'clamp(round(' + total + ' / ' + c.wordsPerDrop + '), ' + c.minDrops + ', ' + c.maxDrops + ') = ' + target };
  }
  function fromTuning(tuning) { return Object.assign({}, DEFAULTS, (tuning && tuning.dropTarget && tuning.dropTarget.params) || {}); }
  return { DEFAULTS: DEFAULTS, words: words, setWords: setWords, compute: compute, fromTuning: fromTuning };
});
