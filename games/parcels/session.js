/* Parcel Panic session log (gameplay-log 1.2.x): levels alternate waves (segment 'parcels', ext.parcels) and A/B summary-style
   questions (segment 'pairwise', ext.pairwise). Shared by index.html and sim/run-sim.js. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('../tetris/logger.js'), require('./engine.js')); else root.ParcelSession = f(root.GameLog, root.ParcelEngine); })(typeof self !== 'undefined' ? self : this, function (GameLog, E) {
  function create(o, round) {
    var log = GameLog.createLog(Object.assign({ gameId: E.GAME_ID, gameVersion: E.GAME_VERSION, iteration: E.ITERATION, session: { kind: 'parcels+pairwise' } }, o)), lvl = 0, waves = [];
    var meta = { roundId: round.roundId, roundNo: round.roundNo, roundVersion: round.version, synthetic: !!round.synthetic, sim: !!round.sim };
    return {
      log: log,
      startWave: function (P, wi, w) { log.startLevel(++lvl, Object.assign({ wave: wi + 1, waveSpeed: w.speed, durationMs: w.durationMs, baseFallMs: P.baseFallMs, baseGapMs: P.baseGapMs, graceMs: P.graceMs, bins: round.bins.map(function (b) { return b.id; }) }), { kind: 'parcels', wave: wi + 1, roundId: round.roundId }); },
      event: function (t, d) { log.event(t, d); },
      endWave: function (wi, st) {
        var dec = st.decisions, sorted = dec.filter(function (d) { return !d.missed; }), ch = dec.filter(function (d) { return d.changedMind; }).length;
        var x = Object.assign({ wave: wi + 1, parcelsShown: dec.length, sorted: sorted.length, misses: st.misses, changedMind: ch, bestCombo: st.bestCombo, scoreWave: st.score, speedEnd: +st.speed.toFixed(3), decisions: dec }, meta);
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
  return { create: create, abDecision: abDecision };
});
