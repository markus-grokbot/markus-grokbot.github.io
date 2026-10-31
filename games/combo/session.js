/* Combo session (Tetris drop-target round -> Pairwise Pit round) on top of gameplay-log 1.1.0.
   Shared by games/combo/combo.js (browser) and games/tetris/sim/run-sim.js --mode drops (Node). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('../tetris/logger.js')); else root.ComboSession = f(root.GameLog); })(typeof self !== 'undefined' ? self : this, function (GameLog) {
  var GAME_ID = 'combo', GAME_VERSION = '0.1.0', ITERATION = 1;
  function create(o) {
    var log = GameLog.createLog(Object.assign({ gameId: GAME_ID, gameVersion: GAME_VERSION, iteration: ITERATION, session: { kind: 'tetris+pairwise' } }, o));
    return {
      log: log,
      // P = tetris level params incl. goal:'drops', dropsTarget, wordsPerDrop; dt = DropTarget.compute() result
      startTetris: function (P, dt, set) { log.startLevel(1, P, { kind: 'tetris', mode: 'drops', dropsTarget: dt.dropsTarget, totalWords: dt.totalWords, setId: set.setId, setVersion: set.setVersion }); },
      lockEvent: function (info) { log.event('lock', info); if (info.linesCleared) log.event('lines', { n: info.linesCleared }); },
      endTetris: function (game, P, dt) {
        var s = game.getState(), st = game.stats(), done = s.levelComplete;
        return log.endLevel(done ? 'complete' : 'fail', { score: s.score, actions: s.pieces, misplays: st.misplays, progress: Math.min(1, s.pieces / P.dropsTarget) },
          { goal: 'drops', dropsTarget: P.dropsTarget, totalWords: dt.totalWords, wordsPerDrop: dt.wordsPerDrop, formula: dt.formula, lines: s.lines, pieces: s.pieces, maxHeight: st.maxHeightSeen, holesEnd: st.holes, avgHoles: st.avgHoles, bumpinessEnd: st.bumpiness, gravityMs: P.gravityMs, lockDelayMs: P.lockDelayMs }, 'tetris');
      },
      startPairwise: function (set) { log.startLevel(2, { setId: set.setId, setVersion: set.setVersion, pairs: set.pairs.length, demo: !!set.demo }, { kind: 'pairwise', setId: set.setId, setVersion: set.setVersion }); },
      event: function (t, d) { log.event(t, d); },
      endPairwise: function (round) {
        var x = round.ext(); return log.endLevel(round.done() ? 'complete' : 'abandoned', { actions: x.decisions.length, misplays: x.undos, progress: x.decisionsMade / x.pairsShown }, x, 'pairwise');
      },
      finish: function () { return log.finish(); }
    };
  }
  return { GAME_ID: GAME_ID, GAME_VERSION: GAME_VERSION, create: create };
});
