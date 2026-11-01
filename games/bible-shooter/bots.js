/*
 * Bot policies for Bible Shooter (used by sim.js and the generator's validation).
 * Each policy: decide(game, rng) -> action or null (wait). Bots act at most every TAP_EVERY ticks.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.ShooterBots = factory(root.ShooterEngine);
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';
  var TAP_EVERY = 3;

  function rngFrom(seed) {
    var n = (seed >>> 0) || 1;
    return function () { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  }

  /** Usefulness of putting a shooter of `color` on the belt now: visible pixels it could hit. */
  function value(exposure, a) { return Math.min(a.count, exposure[a.color] || 0); }

  var policies = {
    /** Random legal tap ~half the time. */
    random: function (g, rng) {
      var a = g.actions();
      return a.length && rng() < 0.5 ? a[Math.floor(rng() * a.length)] : null;
    },

    /** Tap the shooter whose color has the most visible pixels; prefer parked ones on ties. Wait if nothing useful. */
    greedy: function (g, rng) {
      var a = g.actions(); if (!a.length) return null;
      var ex = g.exposure(), best = null, bv = 0;
      a.forEach(function (x) {
        var v = value(ex, x) + (x.type === 'park' ? 0.5 : 0) + rng() * 0.01;
        if (v > bv) { bv = v; best = x; }
      });
      if (bv >= 1) return best;
      // Nothing visible matches: only tap a lane shooter if belt is empty (otherwise wait for belt to clear things).
      if (!g.state().belt.length) {
        var lanes = a.filter(function (x) { return x.type === 'lane'; });
        if (lanes.length) return lanes[Math.floor(rng() * lanes.length)];
      }
      return null;
    },

    /** Try each action: roll forward one lap WITHOUT further taps, so the score reflects only that action.
     *  Score = pixels cleared - 6 per shooter left parked - big penalty on loss. */
    lookahead: function (g, rng) {
      var a = g.actions(); if (!a.length) return null;
      var HORIZON = 2 * (g.level.w + g.level.h), best = null, bv = -Infinity;
      var base = g.fork(); for (var t0 = 0; t0 < HORIZON && base.status === 'playing'; t0++) base.tick();
      var baseCleared = g.state().pixelsLeft - base.state().pixelsLeft, baseParked = base.state().parked.filter(Boolean).length;
      a.forEach(function (x) {
        var f = g.fork(); f.tap(x);
        for (var t = 0; t < HORIZON && f.status === 'playing'; t++) f.tick();
        var st = f.state(), gain = (g.state().pixelsLeft - st.pixelsLeft) - baseCleared;
        var v = gain - (st.parked.filter(Boolean).length - baseParked) * 6 - (f.status === 'lost' ? 1000 : 0) + rng() * 0.01;
        if (v > bv) { bv = v; best = x; }
      });
      // No action clears anything within the horizon: fall back to greedy (avoids cycling a useless parked shooter).
      return bv < 1 ? policies.greedy(g, rng) : best;
    }
  };

  /** Play one full game with a policy. Returns summary stats. */
  function play(level, policy, seed, maxTicks) {
    var g = Engine.createGame(level, { quiet: true }), rng = rngFrom(seed || 1), decide = policies[policy];
    maxTicks = maxTicks || 20000;
    while (g.status === 'playing' && g.state().tick < maxTicks) {
      if (g.state().tick % TAP_EVERY === 0) { var a = decide(g, rng); if (a) g.tap(a); }
      g.tick();
    }
    var s = g.state();
    return { policy: policy, win: g.status === 'won', reason: s.loseReason || (g.status === 'playing' ? 'timeout' : null),
      ticks: s.tick, taps: s.taps, maxParking: s.maxParkingUsed, pixelsLeft: s.pixelsLeft };
  }

  /** Win rates per policy over `runs` seeds. */
  function evaluate(level, runs, which) {
    var out = {};
    (which || ['greedy', 'random', 'lookahead']).forEach(function (p) {
      var n = p === 'lookahead' ? Math.max(1, Math.ceil(runs / 5)) : runs, w = 0, taps = 0, park = 0, reasons = {};
      for (var i = 0; i < n; i++) {
        var r = play(level, p, 1000 + i);
        if (r.win) w++; else reasons[r.reason] = (reasons[r.reason] || 0) + 1;
        taps += r.taps; park += r.maxParking;
      }
      out[p] = { runs: n, winRate: +(w / n).toFixed(3), avgTaps: +(taps / n).toFixed(1), avgMaxParking: +(park / n).toFixed(2), losses: reasons };
    });
    return out;
  }

  return { policies: policies, play: play, evaluate: evaluate, rngFrom: rngFrom, TAP_EVERY: TAP_EVERY };
});
