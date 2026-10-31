/* Parcel Panic engine (UMD, pure; page + Node sim). Parcels fall down a belt; the player sorts the lowest (oldest) one into a bin.
   A tap/swipe ARMS a bin; it commits after graceMs, or at once when the same bin is chosen again. Choosing a different bin
   during grace = changed mind (logged). A parcel reaching the bottom unsorted = miss (combo resets). Speed rises per wave
   and within a wave. Times are in ms of game clock (paused during questions). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ParcelEngine = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var GAME_ID = 'parcels', GAME_VERSION = '0.1.0', ITERATION = 1;
  var DEFAULTS = { baseFallMs: 8000, baseGapMs: 4200, graceMs: 350, inWaveRamp: 0.15, waves: [{ durationMs: 35000, speed: 1 }, { durationMs: 35000, speed: 1.3 }, { durationMs: 40000, speed: 1.6 }, { durationMs: 40000, speed: 1.95 }], emptyBeltMs: 600, points: 100, comboStep: 10, speedBonus: 50 };
  function merge(t) { var p = JSON.parse(JSON.stringify(DEFAULTS)); if (t) Object.keys(t).forEach(function (k) { if (k in p) p[k] = t[k]; }); return p; }
  /* round-wide parcel source: round order first; once all were shown, repeats (shuffled by rng) flagged repeat:true,
     which gives a consistency check (same parcel sorted twice) */
  function source(parcels, rng) { var i = 0, pool = []; return { next: function () { if (i < parcels.length) return parcels[i++]; if (!pool.length) { pool = parcels.slice(); for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(rng() * (k + 1)), x = pool[k]; pool[k] = pool[j]; pool[j] = x; } } return Object.assign({}, pool.pop(), { repeat: true }); }, shown: function () { return i; } }; }
  // waves are time-based: spawning stops after durationMs, the wave ends when the belt is clear
  function createWave(src, w, P, hooks) {
    hooks = hooks || {}; var t = 0, next = 0, active = [], pend = null, dec = [], misses = 0, combo = 0, best = 0, score = 0, spawned = 0;
    var q = { get length() { return t < w.durationMs ? 1 : 0; }, shift: function () { return src.next(); } };
    function speed() { return w.speed * (1 + P.inWaveRamp * Math.min(1, t / w.durationMs)); }
    function target() { return active[0] || null; }
    function emit(type, d) { if (hooks.onEvent) hooks.onEvent(type, d); }
    function commit() {
      var a = active.shift(), sp = +a.speedAtSpawn.toFixed(3), now = +speed().toFixed(3);
      var d = { parcelId: a.p.id, bin: pend.bin, sortMs: Math.round(t - a.spawnT), firstMs: Math.round(pend.firstT - a.spawnT), changedMind: pend.changes.length > 1, binsTried: pend.changes.slice(), speed: now, speedAtSpawn: sp, y: +a.y.toFixed(3), combo: combo + 1, missed: false };
      if (a.p.anchorBin) d.anchorBin = a.p.anchorBin; if (a.p.repeat) d.repeat = true;
      combo++; best = Math.max(best, combo); var pts = P.points + P.comboStep * (combo - 1) + Math.round(P.speedBonus * (1 - a.y)); score += pts; d.points = pts;
      dec.push(d); pend = null; emit('sort', d);
    }
    return {
      step: function (dt) {
        t += dt; if (!active.length && q.length) next = Math.min(next, t + P.emptyBeltMs); if (q.length && t >= next) { var sp = speed(); active.push({ p: q.shift(), spawnT: t, y: 0, speedAtSpawn: sp }); spawned++; next = t + P.baseGapMs / sp; emit('spawn', { parcelId: active[active.length - 1].p.id, speed: +sp.toFixed(3) }); }
        active.forEach(function (a) { a.y += dt * a.speedAtSpawn / P.baseFallMs; });
        if (pend && t - pend.lastT >= P.graceMs) commit();
        while (active.length && active[0].y >= 1) { var m = active.shift(); misses++; combo = 0; var d = { parcelId: m.p.id, anchorBin: m.p.anchorBin || undefined, repeat: m.p.repeat || undefined, bin: null, sortMs: null, firstMs: pend ? Math.round(pend.firstT - m.spawnT) : null, changedMind: !!(pend && pend.changes.length > 1), binsTried: pend ? pend.changes.slice() : [], speed: +speed().toFixed(3), speedAtSpawn: +m.speedAtSpawn.toFixed(3), y: 1, missed: true, points: 0 }; dec.push(d); pend = null; emit('miss', d); }
      },
      choose: function (bin) {
        if (!target()) return false; if (pend && pend.bin === bin) { pend.lastT = -1e9; commit(); return true; }
        if (!pend) pend = { bin: bin, firstT: t, lastT: t, changes: [bin] }; else { pend.bin = bin; pend.lastT = t; pend.changes.push(bin); emit('change_mind', { parcelId: target().p.id, to: bin }); }
        return true;
      },
      done: function () { return !q.length && !active.length; },
      state: function () { return { t: t, active: active, pending: pend, combo: combo, bestCombo: best, score: score, misses: misses, decisions: dec, speed: speed(), spawned: spawned, durationMs: w.durationMs }; },
      target: target
    };
  }
  return { GAME_ID: GAME_ID, GAME_VERSION: GAME_VERSION, ITERATION: ITERATION, DEFAULTS: DEFAULTS, merge: merge, source: source, createWave: createWave };
});
