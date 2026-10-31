/* Parcel Panic v3 "priority" field geometry (UMD; page, sim, grading). Same 2D drag plane as v2, but the axes mean priority,
   not a final bin:  x in [-1,1]: left = NOW (urgent) .. right = CAN WAIT;  y in [-1,1]: top = MATTERS .. bottom = LOW VALUE.
   urgency = 100*(1-x)/2, importance = 100*(1+y)/2, priority = 0.6*importance + 0.4*urgency (0-100).
   Quadrants (labels only, not verdicts): Handle first (now+matters), Schedule (can wait+matters),
   Quick skim (now+low value), Deprioritise (can wait+low value). Axis confidence = |x|, |y| (0 = undecided middle).
   BIN_POS maps the old v1/v2 bins to approximate positions so bin-era rounds stay comparable (see LOOP.md). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ParcelPriority = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.0.0', W_IMP = 0.6, W_URG = 0.4;
  var QUADS = { first: { label: 'Handle first', emoji: '🔥', x: -0.6, y: 0.6 }, schedule: { label: 'Schedule', emoji: '📅', x: 0.6, y: 0.6 }, skim: { label: 'Quick skim', emoji: '👀', x: -0.6, y: -0.6 }, deprio: { label: 'Deprioritise', emoji: '💤', x: 0.6, y: -0.6 } };
  // old bins -> approximate (urgency, importance) 0-100
  var BIN_UI = { reply: { u: 85, i: 80 }, info: { u: 75, i: 55 }, later: { u: 20, i: 75 }, archive: { u: 20, i: 30 }, spam: { u: 10, i: 5 } };
  function r1(v) { return Math.round(v * 10) / 10; } function r3(v) { return Math.round(v * 1000) / 1000; }
  function clamp(v) { return Math.max(-1, Math.min(1, v)); }
  function toXY(u, i) { return { x: 1 - 2 * u / 100, y: 2 * i / 100 - 1 }; }
  var ZONES = {}; Object.keys(BIN_UI).forEach(function (b) { ZONES[b] = toXY(BIN_UI[b].u, BIN_UI[b].i); }); // for the sim bot (aims at its bin guess)
  function quadrant(x, y) { return y >= 0 ? (x <= 0 ? 'first' : 'schedule') : (x <= 0 ? 'skim' : 'deprio'); }
  function describe(x, y) { x = clamp(x); y = clamp(y); var u = 100 * (1 - x) / 2, i = 100 * (1 + y) / 2, q = quadrant(x, y);
    return { x: r3(x), y: r3(y), urgency: r1(u), importance: r1(i), priority: r1(W_IMP * i + W_URG * u), quadrant: q, bin: q, pTop: r3(0.5 + 0.5 * Math.min(Math.abs(x), Math.abs(y))), confX: r3(Math.abs(x)), confY: r3(Math.abs(y)), conf: r3(Math.max(Math.abs(x), Math.abs(y))) }; }
  function fromUI(u, i) { var p = toXY(u, i); return describe(p.x, p.y); }
  function fromBin(bin) { var b = BIN_UI[bin]; return b ? fromUI(b.u, b.i) : null; }
  // agreement on one axis (0-100 scale): 1 - |a-b|/100
  function agree(a, b) { return 1 - Math.abs(a - b) / 100; }
  return { VERSION: VERSION, W_IMP: W_IMP, W_URG: W_URG, QUADS: QUADS, BIN_UI: BIN_UI, ZONES: ZONES, AXES: { x: { neg: 'now', pos: 'can wait' }, y: { neg: 'low value', pos: 'matters' } }, clamp: clamp, toXY: toXY, quadrant: quadrant, describe: describe, fromUI: fromUI, fromBin: fromBin, agree: agree };
});
