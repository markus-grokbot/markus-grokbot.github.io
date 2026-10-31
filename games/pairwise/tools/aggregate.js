#!/usr/bin/env node
/* Pairwise Pit aggregator: gameplay logs -> per-item win rates + Bradley-Terry scores (+ Elo for reference).
   HUMAN ONLY by default: reads run.type==='human' logs from logs/human/ and games/<game>/logs/human/,
   writes games/pairwise/data/scores.human.json. With --sim it reads ONLY run.type==='sim' logs from logs/sim/
   and writes scores.sim.json. Human and sim are never mixed in one output.
   Usage: node games/pairwise/tools/aggregate.js [--sim] [--set test-001] [--include-demo] [--out file]
   Demo sets (set.demo true) are skipped in human mode unless --include-demo; sim mode always includes them.
   Ties count as half a win to each side; 'neither', 'not_enough_info' and undone decisions are excluded from scores
   ('neither' is counted separately in the tone profile).
   TONE PROFILE: comparisons whose items carry a `tone` vector (sets with kind 'tone-discovery', e.g. tone-001) also produce
   data/tone-profile.<mode>.json + .md (see toneProfile() below).
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
var comps = [], sources = [], neithers = [];
logs.forEach(function (x) { (x.log.levels || []).forEach(function (lv) {
  var pw = lv.ext && lv.ext.pairwise; if (!pw || !pw.decisions) return;
  if (args.set && pw.setId !== args.set) return;
  if (mode === 'human' && pw.demo && !args['include-demo']) return;
  sources.push({ file: x.file, runId: x.log.run.id, setId: pw.setId, setVersion: pw.setVersion, demo: !!pw.demo });
  pw.decisions.forEach(function (d) { if (d.undone || d.choice === 'not_enough_info') return; if (mode === 'human' && d.source && d.source !== 'human') return;
    if (d.choice === 'neither') { neithers.push({ pairId: d.pairId, a: d.itemA, b: d.itemB, setId: pw.setId }); return; }
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

// ---------------- TONE PROFILE ----------------
// Item tone vectors come from sets/*.json (item.tone {dim: -1..1}). For each A/B/tie comparison, delta = toneA - toneB and
// y = 1 (A) / 0 (B) / 0.5 (tie), weight = strength weight.
// (1) weighted mean per dimension: pref_d = sum w*|delta_d|*sign(delta_d)*(2y-1) / sum w*|delta_d|  in [-1, 1]
//     (+1 = prefers the high end of the dimension), se_d from the weighted spread, n_d = comparisons where |delta_d| >= 0.2.
// (2) joint L2-regularised logistic regression P(A) = sigmoid(beta . delta) (lambda 1), which separates confounded dims.
// confidence: none (n<2) | low (n<4 or |pref|<1.5 se) | medium (n<8) | high.
function toneProfile() {
  var sd = path.join(__dirname, '..', 'sets'), tone = {}, dims = {}, setsUsed = {};
  fs.readdirSync(sd).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) { try { var st = JSON.parse(fs.readFileSync(path.join(sd, f)));
    (st.pairs || []).forEach(function (p) { [p.a, p.b].forEach(function (x) { if (x.tone) { tone[x.id] = x.tone; Object.keys(x.tone).forEach(function (k) { dims[k] = 1; }); setsUsed[st.setId] = st.setVersion; } }); }); } catch (e) { } });
  var D = Object.keys(dims), rows = comps.filter(function (c) { return tone[c.a] && tone[c.b]; }).map(function (c) { return { d: D.map(function (k) { return (tone[c.a][k] || 0) - (tone[c.b][k] || 0); }), y: c.s, w: c.w }; });
  var beta = D.map(function () { return 0; });
  for (var it2 = 0; it2 < 2000 && rows.length; it2++) { var g = beta.map(function (b) { return 1 * b; });
    rows.forEach(function (r) { var z = r.d.reduce(function (a, v, i) { return a + v * beta[i]; }, 0), pr = 1 / (1 + Math.exp(-z)); r.d.forEach(function (v, i) { g[i] -= r.w * (r.y - pr) * v; }); });
    beta = beta.map(function (b, i) { return b - 0.05 * g[i]; }); }
  var prof = D.map(function (k, i) {
    var sw = 0, sm = 0, n = 0, zs = [];
    rows.forEach(function (r) { var a = Math.abs(r.d[i]); if (a < 0.2) return; n++; var z = Math.sign(r.d[i]) * (2 * r.y - 1), w = r.w * a; sw += w; sm += w * z; zs.push([w, z]); });
    var m = sw ? sm / sw : 0, se = sw ? Math.sqrt(zs.reduce(function (a, q) { return a + q[0] * q[0] * (q[1] - m) * (q[1] - m); }, 0) + 1) / sw : null;
    var conf = n < 2 ? 'none' : (n < 4 || Math.abs(m) < 1.5 * se) ? 'low' : n < 8 ? 'medium' : 'high';
    return { dim: k, preference: +m.toFixed(3), se: se == null ? null : +se.toFixed(3), n: n, logisticBeta: +beta[i].toFixed(3), confidence: conf };
  });
  return { schema: 'tone-profile', schemaVersion: '1.0.0', dataKind: mode, generatedAt: new Date().toISOString(),
    warning: mode === 'sim' ? 'SIMULATED (sim choosers / planted personas). Not Markus\u2019s tone.' : undefined,
    note: 'Tone-discovery data from fictional texts. +1 = prefers the high end of the dimension (e.g. brevity +1 = terse).',
    sets: setsUsed, comparisons: rows.length, neither: neithers.filter(function (x) { return tone[x.a]; }).length,
    method: 'per-dim weighted mean of signed wins (|delta|>=0.2, strength weights 1/1.5/2) + joint L2 logistic regression (lambda 1)',
    dimensions: prof, rejectedBoth: neithers.filter(function (x) { return tone[x.a]; }) };
}
function styleGuide(tp) {
  var pole = { formality: ['casual', 'formal'], warmth: ['cool, matter-of-fact', 'warm, friendly'], brevity: ['expansive, explanatory', 'terse, short'], humor: ['serious, dry', 'playful, light humour'], confidence: ['humble, hedged', 'assertive, confident'], technicality: ['plain-language, explanatory', 'technical, precise'], directness: ['polite, indirect', 'direct (Swedish-direct)'], emoji: ['no emoji', 'emoji welcome'], personal: ['impersonal', 'first person (I/we)'] };
  var L = ['# Tone profile (' + tp.dataKind + ')', '', tp.warning ? '> **' + tp.warning + '**\n' : '', 'Generated ' + tp.generatedAt + ' from ' + tp.comparisons + ' comparisons (' + tp.neither + ' "neither"). Sets: ' + JSON.stringify(tp.sets) + '.', '',
    '## Style guide for a writing model', ''];
  var sorted = tp.dimensions.slice().sort(function (a, b) { return Math.abs(b.preference) - Math.abs(a.preference); });
  sorted.forEach(function (d) { var p = pole[d.dim] || ['low ' + d.dim, 'high ' + d.dim]; if (d.confidence === 'none') return;
    var strength = Math.abs(d.preference) > 0.6 ? 'Strongly prefer' : Math.abs(d.preference) > 0.25 ? 'Prefer' : 'No clear lean on';
    L.push('- ' + strength + ' **' + (Math.abs(d.preference) > 0.25 ? (d.preference > 0 ? p[1] : p[0]) : d.dim) + '** (' + d.dim + ' ' + d.preference + ' ± ' + d.se + ', n=' + d.n + ', ' + d.confidence + ' confidence)'); });
  if (!tp.comparisons) L.push('- No data yet. Play `/games/runner/` or `/games/pairwise/?set=tone-001`, download the log into `logs/human/`, rerun the aggregator.');
  L.push('', 'Treat low-confidence lines as hints only. Content is fictional; only the voice is signal.', '', '| dim | pref | se | n | beta | conf |', '|---|---|---|---|---|---|');
  tp.dimensions.forEach(function (d) { L.push('| ' + [d.dim, d.preference, d.se, d.n, d.logisticBeta, d.confidence].join(' | ') + ' |'); });
  return L.join('\n') + '\n';
}
var tp = toneProfile(), tf = path.join(__dirname, '..', 'data', 'tone-profile.' + mode + '.json');
if (!args.out) { fs.writeFileSync(tf, JSON.stringify(tp, null, 1)); fs.writeFileSync(tf.replace(/\.json$/, '.md'), styleGuide(tp)); console.log('tone profile', tp.comparisons, 'comparisons ->', path.relative(root, tf), '(+ .md)'); }
