#!/usr/bin/env node
/* Rolling player profile from HUMAN logs only -> games/data/player-profile.human.json. Usage: node games/shared/tools/profile.js */
var fs = require('fs'), path = require('path'), Q = require('../qualities.js'), root = path.join(__dirname, '..', '..', '..');
var dirs = [path.join(root, 'logs', 'human')]; fs.readdirSync(path.join(root, 'games')).forEach(function (g) { var p = path.join(root, 'games', g, 'logs', 'human'); if (fs.existsSync(p)) dirs.push(p); });
var tuning = {}; try { tuning = JSON.parse(fs.readFileSync(path.join(root, 'games', 'runner', 'tuning.json'))).focus || {}; } catch (e) { }
var logs = []; dirs.forEach(function (d) { fs.readdirSync(d).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) { try { var l = JSON.parse(fs.readFileSync(path.join(d, f))); if (l.schema === 'gameplay-log' && l.run && l.run.type === 'human') logs.push({ file: path.relative(root, path.join(d, f)), log: l }); } catch (e) { } }); });
logs.sort(function (a, b) { return Date.parse(a.log.run.startedAt) - Date.parse(b.log.run.startedAt); });
var per = logs.map(function (x) { var b = Q.compute(x.log, { weights: tuning.weights, coinChance: tuning.legacyCoinChance, trendMinSegments: tuning.trendMinSegments }); return { file: x.file, game: x.log.game.id, startedAt: x.log.run.startedAt, q: b }; });
var HL = 5, items = {}; Object.keys(Q.QUALITIES).forEach(function (k) {
  var rows = per.map(function (p, i) { return p.q.items[k] ? { i: i, s: p.q.items[k].score, c: p.q.items[k].confidence, game: p.game } : null; }).filter(Boolean); if (!rows.length) return;
  var last = per.length - 1, ws = 0, sum = 0, cs = 0, byGame = {}; rows.forEach(function (r) { var w = Math.pow(0.5, (last - r.i) / HL) * Math.max(0.05, r.c); ws += w; sum += w * r.s; cs += r.c; (byGame[r.game] = byGame[r.game] || []).push(r.s); });
  var conf = Math.min(0.95, 1 - rows.reduce(function (a, r) { return a * (1 - r.c); }, 1));
  Object.keys(byGame).forEach(function (g) { var a = byGame[g]; byGame[g] = Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length); });
  items[k] = { score: Math.round(sum / ws), confidence: +conf.toFixed(2), label: conf >= 0.5 && rows.length >= 5 ? 'estimate' : 'rough', nLogs: rows.length, byGame: byGame, description: Q.QUALITIES[k] };
});
var out = { schema: 'player-profile', version: '1.0.0', player: 'markus', source: 'human logs only', generatedAt: new Date().toISOString(), modelVersion: Q.MODEL_VERSION,
  note: 'Rolling gameplay estimates (EWMA, half-life ' + HL + ' logs). Rough until each quality has >= 5 logs and confidence >= 0.5. For choosing games only; not an assessment of the person.',
  items: items, logs: per.map(function (p) { var o = { file: p.file, game: p.game, startedAt: p.startedAt, scores: {} }; Object.keys(p.q.items).forEach(function (k) { o.scores[k] = p.q.items[k].score; }); if (p.q.runnerFocus) o.runnerFocus = { round: p.q.runnerFocus.round.focus, segments: p.q.runnerFocus.segments.map(function (s) { return s.focus; }), trend: p.q.runnerFocus.trend, estimatedExposure: p.q.runnerFocus.estimatedExposure }; return o; }) };
fs.mkdirSync(path.join(root, 'games', 'data'), { recursive: true }); fs.writeFileSync(path.join(root, 'games', 'data', 'player-profile.human.json'), JSON.stringify(out, null, 1) + '\n');
console.log('profile from', per.length, 'human logs'); Object.keys(items).forEach(function (k) { console.log(' ', k, items[k].score, items[k].label, 'conf', items[k].confidence, 'n', items[k].nLogs); });
