#!/usr/bin/env node
/* Pairwise Pit aggregator: gameplay logs -> per-item win rates + Bradley-Terry scores (+ Elo for reference).
   HUMAN ONLY by default: reads run.type==='human' logs from logs/human/ and games/<game>/logs/human/,
   writes games/pairwise/data/scores.human.json. With --sim it reads ONLY run.type==='sim' logs from logs/sim/
   and writes scores.sim.json. Human and sim are never mixed in one output.
   Usage: node games/pairwise/tools/aggregate.js [--sim] [--set test-001] [--include-demo] [--out file]
   Demo sets (set.demo true) are skipped in human mode unless --include-demo; sim mode always includes them.
   Ties count as half a win to each side; 'not_enough_info' and undone decisions are excluded.
   Strength (1-3) is used as a weight (1, 1.5, 2) for BT/Elo; raw win rate is unweighted. */
var fs = require('fs'), path = require('path');
var args = {}; process.argv.slice(2).forEach(function (a, i, arr) { if (a.indexOf('--') === 0) args[a.slice(2)] = arr[i + 1] && arr[i + 1].indexOf('--') ? arr[i + 1] : true; });
var root = path.join(__dirname, '..', '..', '..'), mode = args.sim ? 'sim' : 'human';
function dirs() {
  var d = [path.join(root, 'logs', mode)], g = path.join(root, 'games');
  fs.readdirSync(g).forEach(function (n) { var p = path.join(g, n, 'logs', mode); if (fs.existsSync(p)) d.push(p); });
  return d.filter(function (x) { return fs.existsSync(x); });
}
var logs = [];
dirs().forEach(function (d) { fs.readdirSync(d).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) { try { var l = JSON.parse(fs.readFileSync(path.join(d, f))); if (l.schema === 'gameplay-log' && l.run && l.run.type === mode) logs.push({ file: path.relative(root, path.join(d, f)), log: l }); } catch (e) { } }); });
var comps = [], sources = [];
logs.forEach(function (x) { (x.log.levels || []).forEach(function (lv) {
  var pw = lv.ext && lv.ext.pairwise; if (!pw || !pw.decisions) return;
  if (args.set && pw.setId !== args.set) return;
  if (mode === 'human' && pw.demo && !args['include-demo']) return;
  sources.push({ file: x.file, runId: x.log.run.id, setId: pw.setId, setVersion: pw.setVersion, demo: !!pw.demo });
  pw.decisions.forEach(function (d) { if (d.undone || d.choice === 'not_enough_info') return; if (mode === 'human' && d.source && d.source !== 'human') return;
    comps.push({ a: d.itemA, b: d.itemB, s: d.choice === 'A' ? 1 : d.choice === 'B' ? 0 : 0.5, w: d.strength ? [1, 1, 1.5, 2][d.strength] : 1, criterion: d.criterion, setId: pw.setId }); });
}); });
var items = {}; function it(id) { return items[id] || (items[id] = { id: id, comparisons: 0, wins: 0, ties: 0, losses: 0 }); }
comps.forEach(function (c) { var A = it(c.a), B = it(c.b); A.comparisons++; B.comparisons++; if (c.s === 1) { A.wins++; B.losses++; } else if (c.s === 0) { B.wins++; A.losses++; } else { A.ties++; B.ties++; } });
var ids = Object.keys(items);
// Bradley-Terry via MM iterations with a weak prior (one virtual tie vs a mean-strength item) so it stays finite.
var p = {}; ids.forEach(function (i) { p[i] = 1; });
for (var iter = 0; iter < 200; iter++) { var np = {}; ids.forEach(function (i) {
  var W = 0.5, den = 1 / (p[i] + 1);
  comps.forEach(function (c) { if (c.a !== i && c.b !== i) return; var o = c.a === i ? c.b : c.a, si = c.a === i ? c.s : 1 - c.s; W += c.w * si; den += c.w / (p[i] + p[o]); });
  np[i] = W / den; }); var gm = Math.exp(ids.reduce(function (a, i) { return a + Math.log(np[i]); }, 0) / (ids.length || 1)); ids.forEach(function (i) { p[i] = np[i] / gm; }); }
var elo = {}; ids.forEach(function (i) { elo[i] = 1500; });
comps.forEach(function (c) { var e = 1 / (1 + Math.pow(10, (elo[c.b] - elo[c.a]) / 400)), k = 32 * c.w; elo[c.a] += k * (c.s - e); elo[c.b] -= k * (c.s - e); });
var out = { schema: 'pairwise-scores', schemaVersion: '1.0.0', dataKind: mode, generatedAt: new Date().toISOString(),
  warning: mode === 'sim' ? 'SIMULATED preferences (sim choosers). Do not use as human preference data.' : (args['include-demo'] ? 'Includes demo sets.' : undefined),
  method: { winRate: '(wins + 0.5*ties) / comparisons', bradleyTerry: 'MM, strength weights 1/1.5/2, prior 1 virtual tie, geometric-mean normalised (1 = average)', elo: 'K=32*weight, start 1500, log order' },
  setFilter: args.set || null, sources: sources, comparisons: comps.length,
  items: ids.map(function (i) { var x = items[i]; return Object.assign(x, { winRate: +((x.wins + 0.5 * x.ties) / x.comparisons).toFixed(3), bt: +p[i].toFixed(4), elo: Math.round(elo[i]) }); }).sort(function (a, b) { return b.bt - a.bt; }) };
var f = args.out ? path.resolve(args.out) : path.join(__dirname, '..', 'data', 'scores.' + mode + '.json');
fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(out, null, 1));
console.log(mode, 'logs', logs.length, 'sources', sources.length, 'comparisons', comps.length, 'items', ids.length, '->', path.relative(root, f));
out.items.forEach(function (x) { console.log(' ', x.id, 'n=' + x.comparisons, 'win=' + x.winRate, 'bt=' + x.bt, 'elo=' + x.elo); });
