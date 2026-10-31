/* Lynx Dash session log (gameplay-log 1.1.x): levels alternate runner segments (ext.runner) and single tone
   questions (ext.pairwise). Shared by index.html (human + in-page sim) and sim/run-sim.js. Also: ToneMini teaser. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('../tetris/logger.js'), require('./engine.js')); else root.RunnerSession = f(root.GameLog, root.RunnerEngine); })(typeof self !== 'undefined' ? self : this, function (GameLog, E) {
  function create(o) {
    var log = GameLog.createLog(Object.assign({ gameId: E.GAME_ID, gameVersion: E.GAME_VERSION, iteration: E.ITERATION, session: { kind: 'runner+pairwise' } }, o));
    var lvl = 0, segs = [], totals = null;
    return {
      log: log,
      startRun: function (P, qIndex) { log.startLevel(++lvl, Object.assign({}, P), { kind: 'runner', segmentNo: qIndex + 1 }); },
      event: function (t, d) { log.event(t, d); },
      endRun: function (stats, extra) { var x = Object.assign({ segmentNo: segs.length + 1 }, stats, extra || {}); segs.push(x);
        return log.endLevel('complete', { score: extra && extra.scoreTotal, actions: stats.jumps + stats.ducks, misplays: stats.crashes, progress: 1 }, x, 'runner'); },
      startQuestion: function (set, pair, qIndex) { log.startLevel(++lvl, { setId: set.setId, setVersion: set.setVersion, pairs: 1, demo: !!set.demo, kind: set.kind || null }, { kind: 'pairwise', setId: set.setId, setVersion: set.setVersion, pairId: pair.id, questionNo: qIndex + 1 }); },
      endQuestion: function (set, d) { return log.endLevel('complete', { actions: 1, misplays: 0, progress: 1 },
        { setId: set.setId, setVersion: set.setVersion, demo: !!set.demo, setKind: set.kind || null, pairsShown: 1, decisionsMade: 1, undos: 0, timing: 'decisionTimeMs measured from the question appearing', decisions: [d] }, 'pairwise'); },
      finish: function (sum) { var d = log.finish(); d.summary.runner = sum; return log.toJSON(); },
      segments: segs
    };
  }
  // session-only tone teaser: mean signed tone difference of chosen-minus-rejected per dimension
  var POLES = { formality: ['casual', 'formal'], warmth: ['cool', 'warm'], brevity: ['expansive', 'terse'], humor: ['serious', 'playful'], confidence: ['humble', 'confident'], technicality: ['explanatory', 'technical'], directness: ['polite', 'direct'], emoji: ['no-emoji', 'emoji'], personal: ['impersonal', 'first-person'] };
  function toneMini(set, decisions) {
    var by = {}; set.pairs.forEach(function (p) { by[p.id] = p; }); var acc = {}, n = {};
    decisions.forEach(function (d) { var p = by[d.pairId]; if (!p || !p.a.tone || (d.choice !== 'A' && d.choice !== 'B')) return; var w = d.choice === 'A' ? p.a : p.b, l = d.choice === 'A' ? p.b : p.a;
      Object.keys(w.tone).forEach(function (k) { var df = w.tone[k] - l.tone[k]; if (Math.abs(df) < 0.2) return; acc[k] = (acc[k] || 0) + df; n[k] = (n[k] || 0) + Math.abs(df); }); });
    return Object.keys(acc).map(function (k) { return { dim: k, lean: +(acc[k] / n[k]).toFixed(2), word: (POLES[k] || [k, k])[acc[k] > 0 ? 1 : 0] }; })
      .filter(function (x) { return Math.abs(x.lean) >= 0.34; }).sort(function (a, b) { return Math.abs(b.lean) - Math.abs(a.lean); }).slice(0, 3);
  }
  // pick N pairs, unseen first (seen = array of pairIds), then shuffle
  function pickPairs(set, n, rng, seen) { seen = seen || []; var sh = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var un = sh(set.pairs.filter(function (p) { return seen.indexOf(p.id) < 0; })), old = sh(set.pairs.filter(function (p) { return seen.indexOf(p.id) >= 0; })); return un.concat(old).slice(0, n); }
  return { create: create, toneMini: toneMini, pickPairs: pickPairs };
});
