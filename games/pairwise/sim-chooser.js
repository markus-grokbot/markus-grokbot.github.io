/* SIM chooser for Pairwise Pit. Output is SIMULATED preference data: decisions carry source 'sim:<strategy>'
   and logs carry run.type 'sim'. Never merge with human preferences (aggregate.js keeps them in separate files).
   Strategies: random (uniform A/B, 10% tie), persona-terse (planted tone taste), length (picks the longer text with p = lenX/(lenA+lenB)). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.PairwiseSim = f(); })(typeof self !== 'undefined' ? self : this, function () {
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  var STRATEGIES = {
    random: function (pair, rng) { var u = rng(); return u < 0.1 ? 'tie' : u < 0.55 ? 'A' : 'B'; },
    // persona-terse: a FAKE persona with known taste (likes brevity + directness, dislikes emoji + humor), used to check
    // that aggregate.js recovers a planted tone profile. Falls back to random on sets without item.tone.
    'persona-terse': function (pair, rng) { if (!pair.a.tone) return STRATEGIES.random(pair, rng);
      var u = function (t) { return 1.2 * t.brevity + 1.0 * t.directness - 0.8 * t.emoji - 0.6 * t.humor; }, d = u(pair.a.tone) - u(pair.b.tone), p = 1 / (1 + Math.exp(-2 * d));
      var x = rng(); return Math.abs(d) < 0.2 && x < 0.3 ? 'neither' : x < p ? 'A' : 'B'; },
    length: function (pair, rng) { var a = words(pair.a.text), b = words(pair.b.text); return rng() < a / (a + b) ? 'A' : 'B'; }
  };
  // simulated reading time: words at wpm plus 1.5-4 s decision
  function thinkMs(pair, rng, wpm) { return Math.round((words(pair.criterion) + words(pair.a.text) + words(pair.b.text)) / (wpm || 225) * 60000 + 1500 + rng() * 2500); }
  function choose(pair, strategy, rng) { var c = (STRATEGIES[strategy] || STRATEGIES.random)(pair, rng); return { choice: c, strength: c === 'A' || c === 'B' ? 1 + Math.floor(rng() * 3) : null, tags: [] }; }
  return { STRATEGIES: Object.keys(STRATEGIES), choose: choose, thinkMs: thinkMs };
});
