#!/usr/bin/env node
/* Reads logs/human/*.json and logs/sim/*.json, proposes next-iteration params -> games/tetris/tuning.json
   PRECEDENCE RULE: for each level, if ANY human log has data for that level, ONLY human data is used
   for that level (sim ignored). Otherwise sim data from the proxy skill (default 'casual') is used.
   Usage: node games/tetris/sim/tune.js [--proxy casual] [--dry] [--drop-target-only]
   DROP TARGET (dropTarget.params.wordsPerDrop, HUMAN logs only, sim never used):
     1) combo logs (game.id 'combo'): ideal wordsPerDrop = totalWords * (tetrisMs / pieces) / pairwiseMs,
        i.e. the value that would have made the Tetris segment last as long as the Pairwise segment. Averaged.
     2) else tetris logs: wordsPerDrop = (ms per locked piece) / 60000 * assumedWpm.
     --drop-target-only keeps the existing per-level params and only rewrites dropTarget. */
var fs = require('fs'), path = require('path'), L = require('../levels.js');
var args = {}; process.argv.slice(2).forEach(function (a, i, arr) { if (a.indexOf('--') === 0) args[a.slice(2)] = arr[i + 1] && arr[i + 1].indexOf('--') ? arr[i + 1] : true; });
var root = path.join(__dirname, '..', '..', '..'), proxy = args.proxy || 'casual';
// Targets (iteration 1-2 calibration): level duration window & completion rate
var T = { minMs: 60e3, maxMs: 300e3, targetCompletion: 0.7 };
// reads <repo>/logs/<dir>/ AND games/tetris/logs/<dir>/ (where the first human log was committed)
function load(dir, gameId) { var out = []; [path.join(root, 'logs', dir), path.join(__dirname, '..', 'logs', dir)].forEach(function (d) { if (!fs.existsSync(d)) return; fs.readdirSync(d).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) { try { out.push(JSON.parse(fs.readFileSync(path.join(d, f)))); } catch (e) { console.warn('skip bad log', f); } }); }); return out.filter(function (l) { return l && l.schema === 'gameplay-log' && l.game && l.game.id === (gameId || L.GAME_ID); }); }
var human = load('human'), sim = load('sim').filter(function (l) { return (l.run.player || {}).skill === proxy; });
var tPath = path.join(__dirname, '..', 'tuning.json'), old = fs.existsSync(tPath) ? JSON.parse(fs.readFileSync(tPath)) : null, base = L.merge(old);
var out = { game: L.GAME_ID, forIteration: L.ITERATION + 1, generatedAt: new Date().toISOString(), rule: 'human-overrides-sim-per-level', targets: T, levels: [] };
base.forEach(function (P) {
  function recs(logs) { var r = []; logs.forEach(function (l) { l.levels.forEach(function (x) { if (x.level === P.level) r.push(x); }); }); return r; }
  var h = recs(human), src = h.length ? 'human' : 'sim:' + proxy, rs = h.length ? h : recs(sim), np = Object.assign({}, P), notes = [];
  delete np.level;
  if (!rs.length) { out.levels.push({ level: P.level, source: 'none', n: 0, params: np, notes: ['no data; keep'] }); return; }
  var comp = rs.filter(function (x) { return x.outcome === 'complete'; }), rate = comp.length / rs.length;
  var dur = comp.length ? comp.reduce(function (a, x) { return a + x.durationMs; }, 0) / comp.length : null;
  if (rate < T.targetCompletion - 0.15) { np.gravityMs = Math.round(P.gravityMs * 1.15); notes.push('completion ' + rate.toFixed(2) + ' low -> slower gravity'); if (rate < 0.3) { np.linesToClear = Math.max(4, P.linesToClear - 2); notes.push('very low -> fewer lines'); } }
  else if (rate > T.targetCompletion + 0.2) { np.gravityMs = Math.round(P.gravityMs * 0.9); notes.push('completion ' + rate.toFixed(2) + ' high -> faster gravity'); }
  if (dur != null && dur < T.minMs) { np.linesToClear = P.linesToClear + 2; notes.push('avg ' + Math.round(dur / 1000) + 's short -> more lines'); }
  if (dur != null && dur > T.maxMs) { np.linesToClear = Math.max(4, P.linesToClear - 2); notes.push('avg ' + Math.round(dur / 1000) + 's long -> fewer lines'); }
  out.levels.push({ level: P.level, source: src, n: rs.length, completionRate: +rate.toFixed(2), avgDurationMs: dur && Math.round(dur), params: np, changes: require('../logger.js').diffParams(Object.assign({}, P), Object.assign({ level: P.level }, np)), notes: notes });
});
// ---- drop target calibration
(function () {
  var D = require('../droptarget.js'), prev = (old && old.dropTarget) || { params: D.DEFAULTS }, dp = Object.assign({}, D.DEFAULTS, prev.params), est = [], src = 'none';
  load('human', 'combo').forEach(function (l) { var t = l.levels.filter(function (x) { return x.segment === 'tetris'; })[0], pw = l.levels.filter(function (x) { return x.segment === 'pairwise'; })[0];
    if (t && pw && t.outcome === 'complete' && pw.durationMs > 0 && t.ext.tetris.pieces) est.push(t.ext.tetris.totalWords * (t.durationMs / t.ext.tetris.pieces) / pw.durationMs); });
  if (est.length) src = 'human:combo'; else {
    human.forEach(function (l) { l.levels.forEach(function (x) { var n = (x.ext && x.ext.tetris && x.ext.tetris.pieces) || (x.metrics && x.metrics.actions); if (x.durationMs && n) est.push(x.durationMs / n / 60000 * dp.assumedWpm); }); });
    if (est.length) src = 'human:tetris@' + dp.assumedWpm + 'wpm';
  }
  if (est.length) dp.wordsPerDrop = Math.max(5, Math.min(60, Math.round(est.reduce(function (a, b) { return a + b; }, 0) / est.length)));
  out.dropTarget = { source: src, n: est.length, estimates: est.map(function (e) { return +e.toFixed(2); }), params: dp, note: 'dropsTarget = clamp(round(totalWords / wordsPerDrop), minDrops, maxDrops). See games/tetris/droptarget.js' };
  console.log('dropTarget', src, 'n=' + est.length, 'wordsPerDrop', prev.params.wordsPerDrop, '->', dp.wordsPerDrop);
  if (args['drop-target-only'] && old) { old.dropTarget = out.dropTarget; out = old; }
})();
console.log(JSON.stringify(out.levels.map(function (l) { return [l.level, l.source, l.n, l.completionRate, l.notes && l.notes.join('; ')]; })));
if (!args.dry) { fs.writeFileSync(tPath, JSON.stringify(out, null, 1)); console.log('wrote', path.relative(root, tPath)); }
