/* Parcel Panic v2 engine "field" (UMD, pure; page + Node sim). One parcel at a time drifts slowly from the top edge to the
   centre of a 2D field; the player drags it anywhere (see axes.js: x act now..not now, y noise..worth it) and releases.
   Each parcel has a visible countdown (limitMs, ~6 s in wave 1 tightening to ~4.4 s in wave 3). On release, or on timeout
   while held, the position is committed as a SOFT sort (softmax over zone centres + per-axis confidence). Timeout without
   ever touching it = miss. Partial credit: points scale with the stronger axis, so a clear x with a middling y still pays. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('./axes.js')); else root.ParcelEngine2 = f(root.ParcelAxes); })(typeof self !== 'undefined' ? self : this, function (A) {
  var GAME_ID = 'parcels', GAME_VERSION = '0.2.0', ITERATION = 2, MODE = 'field2d';
  var DEFAULTS = { driftMs: 1400, gapMs: 900, inWaveTighten: 0.08, startY: 1.12, restY: 0, waves: [{ durationMs: 50000, limitMs: 6000, speed: 1 }, { durationMs: 50000, limitMs: 5200, speed: 1.15 }, { durationMs: 50000, limitMs: 4400, speed: 1.36 }], points: 60, confPoints: 60, timeBonus: 40, middlePoints: 10, comboConf: 0.5 };
  function merge(t) { var p = JSON.parse(JSON.stringify(DEFAULTS)); if (t && t.v2) Object.keys(t.v2).forEach(function (k) { if (k in p) p[k] = t.v2[k]; }); return p; }
  function createWave(src, w, P, hooks) {
    hooks = hooks || {}; var t = 0, nextAt = 300, cur = null, dec = [], misses = 0, combo = 0, best = 0, score = 0;
    function emit(type, d) { if (hooks.onEvent) hooks.onEvent(type, d); }
    function limit() { return Math.round(w.limitMs * (1 - P.inWaveTighten * Math.min(1, t / w.durationMs))); }
    function spawn() { var p = src.next(); cur = { p: p, t0: t, limitMs: limit(), x: 0, y: P.startY, held: false, touched: false, firstMs: null, zone: null, zones: [], strongZones: [] }; emit('spawn', { parcelId: p.id, limitMs: cur.limitMs, repeat: !!p.repeat }); }
    function finish(timedOut) {
      var c = cur, ms = t - c.t0, base = { parcelId: c.p.id, limitMs: c.limitMs, speed: w.speed, repeat: c.p.repeat || undefined, anchorBin: c.p.anchorBin || undefined };
      cur = null; nextAt = t + P.gapMs;
      if (!c.touched) { misses++; combo = 0; var m = Object.assign(base, { missed: true, timedOut: true, sortMs: null, firstMs: null, points: 0, combo: 0 }); dec.push(m); emit('miss', m); return; }
      var D = A.describe(c.x, c.y), last = c.strongZones[c.strongZones.length - 1], changed = c.strongZones.length > 1 && !(D.pTop >= 0.6 && D.bin === c.strongZones[0]) || (c.strongZones.length === 1 && D.pTop >= 0.6 && D.bin !== last);
      var pts; if (D.conf < 0.25) { pts = P.middlePoints; combo = 0; } else { pts = Math.round(P.points + P.confPoints * D.conf + P.timeBonus * Math.max(0, 1 - ms / c.limitMs)); if (D.conf >= P.comboConf) { combo++; pts += Math.min(combo, 10) * 5; } }
      best = Math.max(best, combo); score += pts;
      var d = Object.assign(base, { missed: false, timedOut: !!timedOut, x: D.x, y: D.y, dist: D.dist, soft: D.soft, bin: D.bin, pTop: D.pTop, confX: D.confX, confY: D.confY, conf: D.conf, sortMs: Math.round(ms), firstMs: Math.round(c.firstMs), changedMind: !!changed, zoneChanges: Math.max(0, c.zones.length - 1), points: pts, combo: combo });
      dec.push(d); emit('sort', d);
    }
    return {
      step: function (dt) { t += dt;
        if (!cur && t < w.durationMs && t >= nextAt) spawn();
        if (cur) { var age = t - cur.t0; if (!cur.touched) cur.y = P.startY + (P.restY - P.startY) * Math.min(1, age / P.driftMs); if (age >= cur.limitMs) finish(cur.held); } },
      grab: function () { if (!cur) return false; if (!cur.touched) cur.firstMs = t - cur.t0; cur.touched = cur.held = true; return true; },
      move: function (x, y) { if (!cur || !cur.held) return null; cur.x = A.clamp(x); cur.y = A.clamp(y); var D = A.describe(cur.x, cur.y);
        if (D.bin !== cur.zone) { cur.zone = D.bin; cur.zones.push(D.bin); } if (D.pTop >= 0.6 && cur.strongZones[cur.strongZones.length - 1] !== D.bin) { cur.strongZones.push(D.bin); emit('zone', { parcelId: cur.p.id, bin: D.bin }); } return D; },
      release: function () { if (!cur || !cur.held) return; cur.held = false; finish(false); },
      current: function () { return cur; },
      done: function () { return t >= w.durationMs && !cur; },
      state: function () { return { t: t, decisions: dec, misses: misses, combo: combo, bestCombo: best, score: score, speed: w.speed, limitMs: cur ? cur.limitMs : limit(), left: cur ? Math.max(0, cur.limitMs - (t - cur.t0)) : null }; }
    };
  }
  return { GAME_ID: GAME_ID, GAME_VERSION: GAME_VERSION, ITERATION: ITERATION, MODE: MODE, DEFAULTS: DEFAULTS, merge: merge, createWave: createWave };
});
