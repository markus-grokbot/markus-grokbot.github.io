/* Parcel Panic session log (gameplay-log 1.2.x): levels alternate waves (segment 'parcels', ext.parcels) and A/B summary-style
   questions (segment 'pairwise', ext.pairwise). Shared by index.html and sim/run-sim.js. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('../tetris/logger.js'), require('./engine.js')); else root.ParcelSession = f(root.GameLog, root.ParcelEngine); })(typeof self !== 'undefined' ? self : this, function (GameLog, E) {
  function create(o, round, extra) {
    var log = GameLog.createLog(Object.assign({ gameId: E.GAME_ID, gameVersion: E.GAME_VERSION, iteration: E.ITERATION, session: { kind: 'parcels+pairwise' } }, o)), lvl = 0, waves = [];
    var meta = { roundId: round.roundId, roundNo: round.roundNo, roundVersion: round.version, synthetic: !!round.synthetic, sim: !!round.sim }; if (extra) Object.assign(meta, extra);
    return {
      log: log,
      startWave: function (P, wi, w) { log.startLevel(++lvl, Object.assign({ wave: wi + 1, waveSpeed: w.speed, durationMs: w.durationMs, baseFallMs: P.baseFallMs, baseGapMs: P.baseGapMs, graceMs: P.graceMs, bins: round.bins.map(function (b) { return b.id; }) }), { kind: 'parcels', wave: wi + 1, roundId: round.roundId }); },
      event: function (t, d) { log.event(t, d); },
      endWave: function (wi, st) {
        var dec = st.decisions, sorted = dec.filter(function (d) { return !d.missed; }), ch = dec.filter(function (d) { return d.changedMind; }).length;
        var x = Object.assign({ wave: wi + 1, parcelsShown: dec.length, sorted: sorted.length, misses: st.misses, changedMind: ch, bestCombo: st.bestCombo, scoreWave: st.score, speedEnd: +st.speed.toFixed(3), decisions: dec }, st.limitMs ? { limitMsEnd: st.limitMs, partial: sorted.filter(function (d) { return d.conf != null && d.pTop < 0.6 && d.conf >= 0.3; }).length, timedOut: sorted.filter(function (d) { return d.timedOut; }).length, meanConf: sorted.length && sorted[0].conf != null ? +(sorted.reduce(function (a, d) { return a + d.conf; }, 0) / sorted.length).toFixed(3) : undefined } : {}, meta);
        waves.push(x); return log.endLevel('complete', { score: st.score, actions: sorted.length, misplays: st.misses, progress: 1 }, x, 'parcels');
      },
      startQuestion: function (q, qi) { log.startLevel(++lvl, { setId: round.roundId + '-ab', pairs: 1, kind: 'summary-style' }, { kind: 'pairwise', pairId: q.id, questionNo: qi + 1, roundId: round.roundId }); },
      endQuestion: function (q, d) { return log.endLevel('complete', { actions: 1, misplays: 0, progress: 1 }, { setId: round.roundId + '-ab', setVersion: round.version, demo: false, setKind: 'summary-style', pairsShown: 1, decisionsMade: 1, undos: 0, timing: 'decisionTimeMs from question shown', roundId: round.roundId, decisions: [d] }, 'pairwise'); },
      finish: function (sum) { log.finish(); var d = log.toJSON(); d.summary.parcels = Object.assign(meta, sum); return d; },
      waves: waves
    };
  }
  // A/B decision in SET terms (a = q.a regardless of on-screen side)
  function abDecision(q, shownChoice, swapped, ms, source) {
    var c = shownChoice === 'neither' ? 'neither' : swapped ? (shownChoice === 'A' ? 'B' : 'A') : shownChoice;
    return { pairId: q.id, itemA: q.a.id, itemB: q.b.id, choice: c, winner: c === 'A' ? q.a.id : c === 'B' ? q.b.id : null, strength: 2, decisionTimeMs: Math.round(ms), swapped: !!swapped, undone: false, source: source, parcelId: q.parcelId, modelA: q.a.model, modelB: q.b.model, winnerModel: c === 'A' ? q.a.model : c === 'B' ? q.b.model : null };
  }
  // round summary (v1 and v2 decisions)
  function summarize(waves, total, best, qi) { var all = []; waves.forEach(function (w) { all = all.concat(w.decisions); }); var s = all.filter(function (d) { return !d.missed; }), bins = {}; s.forEach(function (d) { if (d.bin) bins[d.bin] = (bins[d.bin] || 0) + 1; });
    var o = { score: total, bestCombo: best, parcels: all.length, sorted: s.length, misses: all.length - s.length, changedMind: all.filter(function (d) { return d.changedMind; }).length, abAnswered: qi, bins: bins };
    if (s.length && s[0].conf != null) { o.timedOut = s.filter(function (d) { return d.timedOut; }).length; o.partial = s.filter(function (d) { return d.pTop < 0.6 && d.conf >= 0.3; }).length; o.middle = s.filter(function (d) { return d.conf < 0.25; }).length; o.meanConf = +(s.reduce(function (a, d) { return a + d.conf; }, 0) / s.length).toFixed(3); o.meanConfX = +(s.reduce(function (a, d) { return a + d.confX; }, 0) / s.length).toFixed(3); o.meanConfY = +(s.reduce(function (a, d) { return a + d.confY; }, 0) / s.length).toFixed(3); }
    if (s.length && s[0].priority != null) { delete o.bins; o.quadrants = {}; s.forEach(function (d) { o.quadrants[d.quadrant] = (o.quadrants[d.quadrant] || 0) + 1; }); o.meanPriority = +(s.reduce(function (a, d) { return a + d.priority; }, 0) / s.length).toFixed(1);
      var seen = {}; o.queue = s.filter(function (d) { if (seen[d.parcelId] || d.repeat) return false; seen[d.parcelId] = 1; return true; }).sort(function (a, b) { return b.priority - a.priority; }).map(function (d) { return { parcelId: d.parcelId, priority: d.priority, urgency: d.urgency, importance: d.importance, quadrant: d.quadrant }; }); }
    if (s.length && s[0].manual != null) { delete o.bins; o.quadrants = {}; o.tiers = {}; var seen2 = {}, first = s.filter(function (d) { if (seen2[d.parcelId] || d.repeat) return false; seen2[d.parcelId] = 1; return true; });
      s.forEach(function (d) { o.quadrants[d.quadrant] = (o.quadrants[d.quadrant] || 0) + 1; }); first.forEach(function (d) { o.tiers[d.tier] = (o.tiers[d.tier] || 0) + 1; });
      var tot = first.reduce(function (a, d) { return a + d.spend; }, 0) || 1; o.meanAutomation = +(first.reduce(function (a, d) { return a + d.automation; }, 0) / Math.max(1, first.length)).toFixed(1);
      o.plan = first.map(function (d) { return { parcelId: d.parcelId, automation: d.automation, manual: d.manual, spend: d.spend, budgetShare: +(100 * d.spend / tot).toFixed(1), tier: d.tier, quadrant: d.quadrant }; }).sort(function (a, b) { return b.budgetShare - a.budgetShare; });
      o.budgetPool = { automatedShare: +o.plan.filter(function (x) { return x.manual < 50; }).reduce(function (a, x) { return a + x.budgetShare; }, 0).toFixed(1), manualReserveShare: +o.plan.filter(function (x) { return x.manual >= 50; }).reduce(function (a, x) { return a + x.budgetShare; }, 0).toFixed(1) }; }
    return o; }
  return { create: create, abDecision: abDecision, summarize: summarize };
});
