/* SIM chooser for Pairwise Pit. Output is SIMULATED preference data: decisions carry source 'sim:<strategy>'
   and logs carry run.type 'sim'. Never merge with human preferences (aggregate.js keeps them in separate files).
   Strategies: random (uniform A/B, 10% tie), length (picks the longer text with p = lenX/(lenA+lenB)). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.PairwiseSim = f(); })(typeof self !== 'undefined' ? self : this, function () {
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  var STRATEGIES = {
    random: function (pair, rng) { var u = rng(); return u < 0.1 ? 'tie' : u < 0.55 ? 'A' : 'B'; },
    length: function (pair, rng) { var a = words(pair.a.text), b = words(pair.b.text); return rng() < a / (a + b) ? 'A' : 'B'; }
  };
  // simulated reading time: words at wpm plus 1.5-4 s decision
  function thinkMs(pair, rng, wpm) { return Math.round((words(pair.criterion) + words(pair.a.text) + words(pair.b.text)) / (wpm || 225) * 60000 + 1500 + rng() * 2500); }
  function choose(pair, strategy, rng) { var c = (STRATEGIES[strategy] || STRATEGIES.random)(pair, rng); return { choice: c, strength: c === 'A' || c === 'B' ? 1 + Math.floor(rng() * 3) : null, tags: [] }; }
  return { STRATEGIES: Object.keys(STRATEGIES), choose: choose, thinkMs: thinkMs };
});
