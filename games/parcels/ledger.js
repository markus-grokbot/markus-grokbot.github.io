/* Parcel consistency ledger (UMD; page preview + Node pipeline). One entry per parcel, evaluations per mode (priority | handling)
   by human or model. CONSISTENCY RULE (human evaluations only, per mode, in time order incl. repeats within a round):
   two consecutive evaluations are consistent when (1) same quadrant, (2) distance on the field <= MAX_DIST (0.5 in [-1,1]
   coordinates = 25 points on the 0-100 scales) and (3) neither is undecided (stronger-axis confidence < MIN_CONF 0.25).
   streak = length of the consistent run ending at the latest evaluation (an undecided eval resets it to 0, a fresh one starts at 1).
   SETTLED (action-eligible) when streak >= 3; leaves the rotation for that mode. After MAX_TRIES (5) human evaluations
   without settling -> 'manual-review' (also leaves the rotation, flagged). Otherwise 'open' -> re-queued first next round.
   Model evaluations are stored for comparison but never count toward settling. Derived evals (v2 field drops converted to
   priority) count; v1 hard sorts are stored with counts:false. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ParcelLedger = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var RULE = { version: '1.0.0', maxDist: 0.5, minConf: 0.25, settleAfter: 3, maxTries: 5 };
  function consistent(a, b) { if (!a || !b) return false; if (a.conf < RULE.minConf || b.conf < RULE.minConf) return false; if (a.quadrant !== b.quadrant) return false; var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy) <= RULE.maxDist; }
  function counting(evals, mode) { return (evals || []).filter(function (e) { return e.mode === mode && e.by === 'human' && e.counts !== false; }); }
  function streak(ev) { var s = 0; for (var i = 0; i < ev.length; i++) { if (ev[i].conf < RULE.minConf) s = 0; else if (s > 0 && consistent(ev[i - 1], ev[i])) s++; else s = 1; } return s; }
  function status(evals, mode) { var ev = counting(evals, mode), s = streak(ev), st = s >= RULE.settleAfter ? 'settled' : ev.length >= RULE.maxTries ? 'manual-review' : ev.length ? 'open' : 'new';
    var last = ev[ev.length - 1]; return { mode: mode, tries: ev.length, streak: s, state: st, last: last ? { round: last.round, quadrant: last.quadrant, x: last.x, y: last.y } : null }; }
  function counts(ledger, mode) { var c = { new: 0, open: 0, settled: 0, 'manual-review': 0, streak: { 0: 0, 1: 0, 2: 0, 3: 0 } }; Object.keys(ledger.parcels || {}).forEach(function (id) { var s = status(ledger.parcels[id].evals, mode); c[s.state]++; if (s.tries) c.streak[Math.min(3, s.streak)]++; }); return c; }
  return { RULE: RULE, consistent: consistent, counting: counting, streak: streak, status: status, counts: counts };
});
