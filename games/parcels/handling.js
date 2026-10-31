/* Parcel Panic "handling" field geometry (UMD; page, sim, grading). Assessment only: nothing is executed.
   x in [-1,1]: left = BEST AUTOMATED .. right = BEST MANUALLY REVIEWED;  y in [-1,1]: top = HIGH relative spend .. bottom = LOW.
   manual = 100*(1+x)/2 (automation = 100 - manual), spend = 100*(1+y)/2 (raw, relative to the other parcels of the round);
   budget share = spend / sum(spend of the round's first placements) as % of the pool (computed at round end, budgetShares()).
   Suggested tier: automated side (manual < 40) by spend: local Ollama < 25 <= OpenCode free < 50 <= Codex < 75 <= Grok Build;
   manual side (manual > 60): "manual review" and spend = reserve for possible future agentic work; 40-60: hybrid (tier prep + review).
   Quadrants (labels): auto-premium (top-left), auto-cheap (bottom-left), review-reserve (top-right), review-light (bottom-right). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ParcelHandling = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '1.0.0';
  var QUADS = { autoPremium: { label: 'Automate, premium', emoji: '🚀', x: -0.6, y: 0.6 }, autoCheap: { label: 'Automate, cheap', emoji: '🤖', x: -0.6, y: -0.6 }, reviewReserve: { label: 'Review + reserve', emoji: '🧑‍💻', x: 0.6, y: 0.6 }, reviewLight: { label: 'Review, light', emoji: '👁️', x: 0.6, y: -0.6 } };
  var TIERS = [{ id: 'ollama', label: 'local Ollama', max: 25 }, { id: 'opencode', label: 'OpenCode free', max: 50 }, { id: 'codex', label: 'Codex', max: 75 }, { id: 'grokbuild', label: 'Grok Build', max: 101 }];
  // old bins -> approximate (manual, spend) for the sim bot only
  var BIN_MS = { reply: { m: 75, s: 70 }, info: { m: 60, s: 40 }, later: { m: 30, s: 45 }, archive: { m: 15, s: 10 }, spam: { m: 5, s: 3 } };
  function r1(v) { return Math.round(v * 10) / 10; } function r3(v) { return Math.round(v * 1000) / 1000; } function clamp(v) { return Math.max(-1, Math.min(1, v)); }
  function toXY(m, s) { return { x: 2 * m / 100 - 1, y: 2 * s / 100 - 1 }; }
  var ZONES = {}; Object.keys(BIN_MS).forEach(function (b) { ZONES[b] = toXY(BIN_MS[b].m, BIN_MS[b].s); });
  function quadrant(x, y) { return x <= 0 ? (y >= 0 ? 'autoPremium' : 'autoCheap') : (y >= 0 ? 'reviewReserve' : 'reviewLight'); }
  function tier(manual, spend) { var t = TIERS.filter(function (z) { return spend < z.max; })[0]; if (manual > 60) return { id: 'manual', label: 'manual review (reserve for later agentic work)' }; if (manual >= 40) return { id: 'hybrid-' + t.id, label: t.label + ' prep + manual review' }; return { id: t.id, label: t.label }; }
  function describe(x, y) { x = clamp(x); y = clamp(y); var m = 100 * (1 + x) / 2, s = 100 * (1 + y) / 2, q = quadrant(x, y), t = tier(m, s);
    return { x: r3(x), y: r3(y), manual: r1(m), automation: r1(100 - m), spend: r1(s), tier: t.id, quadrant: q, bin: q, pTop: r3(0.5 + 0.5 * Math.min(Math.abs(x), Math.abs(y))), confX: r3(Math.abs(x)), confY: r3(Math.abs(y)), conf: r3(Math.max(Math.abs(x), Math.abs(y))) }; }
  function fromMS(m, s) { var p = toXY(m, s); return describe(p.x, p.y); }
  function budgetShares(items) { var tot = items.reduce(function (a, d) { return a + d.spend; }, 0) || 1; return items.map(function (d) { return Object.assign({}, d, { budgetShare: r1(100 * d.spend / tot) }); }); }
  function agree(a, b) { return 1 - Math.abs(a - b) / 100; }
  function tierLabel(id) { if (id === 'manual') return 'manual review'; var h = /^hybrid-/.test(id), t = TIERS.filter(function (z) { return z.id === id.replace(/^hybrid-/, ''); })[0]; return (t ? t.label : id) + (h ? ' + review' : ''); }
  return { VERSION: VERSION, QUADS: QUADS, TIERS: TIERS, BIN_MS: BIN_MS, ZONES: ZONES, clamp: clamp, toXY: toXY, quadrant: quadrant, tier: tier, tierLabel: tierLabel, describe: describe, fromMS: fromMS, budgetShares: budgetShares, agree: agree, AXES: { x: { neg: 'best automated', pos: 'best manually reviewed' }, y: { neg: 'low spend', pos: 'high spend' } } };
});
