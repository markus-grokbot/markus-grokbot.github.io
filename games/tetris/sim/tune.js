#!/usr/bin/env node
/* Reads logs/human/*.json and logs/sim/*.json, proposes next-iteration params -> games/tetris/tuning.json
   PRECEDENCE RULE: for each level, if ANY human log has data for that level, ONLY human data is used
   for that level (sim ignored). Otherwise sim data from the proxy skill (default 'casual') is used.
   Usage: node games/tetris/sim/tune.js [--proxy casual] [--dry] */
var fs = require('fs'), path = require('path'), L = require('../levels.js');
var args = {}; process.argv.slice(2).forEach(function (a, i, arr) { if (a.indexOf('--') === 0) args[a.slice(2)] = arr[i + 1] && arr[i + 1].indexOf('--') ? arr[i + 1] : true; });
var root = path.join(__dirname, '..', '..', '..'), proxy = args.proxy || 'casual';
// Targets (iteration 1-2 calibration): level duration window & completion rate
var T = { minMs: 60e3, maxMs: 300e3, targetCompletion: 0.7 };
function load(dir) { var d = path.join(root, 'logs', dir); if (!fs.existsSync(d)) return []; return fs.readdirSync(d).filter(function (f) { return /\.json$/.test(f); }).map(function (f) { try { return JSON.parse(fs.readFileSync(path.join(d, f))); } catch (e) { console.warn('skip bad log', f); return null; } }).filter(function (l) { return l && l.schema === 'gameplay-log' && l.game && l.game.id === L.GAME_ID; }); }
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
console.log(JSON.stringify(out.levels.map(function (l) { return [l.level, l.source, l.n, l.completionRate, l.notes && l.notes.join('; ')]; })));
if (!args.dry) { fs.writeFileSync(tPath, JSON.stringify(out, null, 1)); console.log('wrote', path.relative(root, tPath)); }
