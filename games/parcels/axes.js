/* Parcel Panic v2 field geometry (UMD; page, sim and grading share it).
   Plane: x in [-1,1] = ACT NOW (left) .. NOT NOW (right); y in [-1,1] = NOISE (bottom) .. WORTH IT (top).
   Zone centres: Reply top-left, Needs info left-middle, Later top-right, Archive right-middle, Spam bottom-centre.
   soft(x,y) = softmax(-d^2/tau) over zone centres; confidence per axis = |x|, |y| (0 = undecided middle).
   Each bin also has axis targets so a model's hard bin can be graded per axis (spam has no x target). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ParcelAxes = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.0.0', TAU = 0.22;
  var ZONES = { reply: { x: -0.65, y: 0.62 }, info: { x: -0.65, y: -0.05 }, later: { x: 0.65, y: 0.62 }, archive: { x: 0.65, y: -0.05 }, spam: { x: 0, y: -0.78 } };
  var TARGET = { reply: { x: -1, y: 1 }, info: { x: -0.8, y: 0.3 }, later: { x: 0.8, y: 0.6 }, archive: { x: 1, y: -0.2 }, spam: { x: null, y: -1 } };
  var AXES = { x: { neg: 'act now', pos: 'not now' }, y: { neg: 'noise', pos: 'worth it' } };
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function clamp(v) { return Math.max(-1, Math.min(1, v)); }
  function dist(x, y) { var o = {}; Object.keys(ZONES).forEach(function (b) { var z = ZONES[b]; o[b] = r3(Math.sqrt((x - z.x) * (x - z.x) + (y - z.y) * (y - z.y))); }); return o; }
  function soft(x, y) { var d = dist(x, y), e = {}, s = 0; Object.keys(d).forEach(function (b) { e[b] = Math.exp(-d[b] * d[b] / TAU); s += e[b]; }); Object.keys(e).forEach(function (b) { e[b] = r3(e[b] / s); }); return e; }
  function argmax(p) { var best = null; Object.keys(p).forEach(function (b) { if (best == null || p[b] > p[best]) best = b; }); return best; }
  function describe(x, y) { x = clamp(x); y = clamp(y); var p = soft(x, y); return { x: r3(x), y: r3(y), dist: dist(x, y), soft: p, bin: argmax(p), confX: r3(Math.abs(x)), confY: r3(Math.abs(y)), conf: r3(Math.max(Math.abs(x), Math.abs(y))), pTop: p[argmax(p)] }; }
  // per-axis agreement of a hard bin with a human position: 1 - |dx|/2 (null when the bin has no target on that axis)
  function axisAgreement(bin, x, y) { var t = TARGET[bin]; if (!t) return { x: null, y: null }; return { x: t.x == null ? null : r3(1 - Math.abs(clamp(x) - t.x) / 2), y: t.y == null ? null : r3(1 - Math.abs(clamp(y) - t.y) / 2) }; }
  // v1 hard sort -> position at the zone centre (so v1 logs grade the same way)
  function fromBin(bin) { var z = ZONES[bin]; return z ? describe(z.x, z.y) : null; }
  return { VERSION: VERSION, TAU: TAU, ZONES: ZONES, TARGET: TARGET, AXES: AXES, dist: dist, soft: soft, argmax: argmax, describe: describe, axisAgreement: axisAgreement, fromBin: fromBin, clamp: clamp };
});
