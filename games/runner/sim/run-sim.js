#!/usr/bin/env node
/* Lynx Dash headless sim: bot plays N questions x segmentMs of active running; a SIM chooser answers each tone question.
   Writes logs/sim/runner-<skill>-<chooser>-seed<k>.json (run.type 'sim'; decisions source 'sim:<chooser>'). Virtual clock.
   Usage: node games/runner/sim/run-sim.js [--skill novice,casual,good] [--chooser random,persona-terse] [--runs 1] [--seed 1] [--questions 6] */
var fs = require('fs'), path = require('path'), E = require('../engine.js'), B = require('../bot.js'), RS = require('../session.js'), PW = require('../../pairwise/pairwise.js'), CH = require('../../pairwise/sim-chooser.js');
var args = {}; process.argv.slice(2).forEach(function (a, i, arr) { if (a.indexOf('--') === 0) args[a.slice(2)] = arr[i + 1] && arr[i + 1].indexOf('--') ? arr[i + 1] : true; });
var root = path.join(__dirname, '..', '..', '..'), tuning = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tuning.json')));
var set = JSON.parse(fs.readFileSync(path.resolve(args.set || path.join(__dirname, '..', '..', 'pairwise', 'sets', 'tone-001.json'))));
var skills = (args.skill || 'casual,good').split(','), choosers = (args.chooser || 'random,persona-terse').split(','), runs = +(args.runs || 1), seed0 = +(args.seed || 1);
var out = path.join(root, 'logs', 'sim'); fs.mkdirSync(out, { recursive: true });
function runOne(skill, chooser, seed) {
  var clockT = Date.UTC(2026, 9, 31, 12) + seed * 1e6, clock = function () { return clockT; }, rng = E.rng(seed * 97 + 13), P = E.merge(tuning);
  if (args.questions) P.questions = +args.questions;
  var S = RS.create({ runType: 'sim', clock: clock, seed: seed, device: { sim: true }, player: { kind: 'bot', skill: skill, chooser: chooser }, tuningSource: 'tuning.json@' + tuning.generatedAt });
  var picked = RS.pickPairs(set, P.questions, rng, []), qset = Object.assign({}, set, { pairs: picked }), round = PW.createRound(qset, { clock: clock, rng: rng });
  var g = E.create({ params: P, rng: rng, onEvent: S.event }), bot = B.create(skill, rng), streak = 0, best = 0, dt = 1000 / 60, bonus = 0;
  for (var q = 0; q < P.questions; q++) {
    S.startRun(P, q); var t = 0;
    while (t < P.segmentMs) { g.step(dt, bot.decide(g)); t += dt; clockT += dt; }
    var st = g.endSegment(); streak = st.clean ? streak + 1 : 0; best = Math.max(best, streak); var b = st.clean ? P.cleanBonus * streak : 0; g.addBonus(b); bonus += b;
    if (st.clean) S.event('clean_segment', { streak: streak, bonus: b });
    S.endRun(st, { streak: streak, cleanBonus: b, scoreTotal: Math.round(g.state().score), lives: g.state().lives, speedEnd: +g.state().speed.toFixed(3) });
    var pair = round.current().pair; S.startQuestion(qset, pair, q); round.markShown(); clockT += CH.thinkMs(pair, rng);
    var c = CH.choose(pair, chooser, rng), d = round.decide(c.choice, c.strength, c.tags, 'sim:' + chooser); S.event('pairwise_decision', { pairId: d.pairId, choice: d.choice, seq: d.seq }); S.endQuestion(qset, d);
    g.afterQuestion(); clockT += P.countdownMs;
  }
  var s = g.state(), sum = { distance: Math.round(s.dist), bestRunDistance: Math.round(s.bestRunDist), score: Math.round(s.score), coins: s.coins, knockouts: s.knockouts, bestStreak: best, cleanBonusTotal: bonus, questionsAnswered: round.decisions().length, tone: RS.toneMini(qset, round.decisions()) };
  var log = S.finish(sum), f = path.join(out, 'runner-' + skill + '-' + chooser + '-seed' + seed + '.json'); fs.writeFileSync(f, JSON.stringify(log, null, 1));
  console.log(path.relative(root, f), JSON.stringify(sum)); return log;
}
skills.forEach(function (k) { choosers.forEach(function (c) { for (var r = 0; r < runs; r++) runOne(k, c, seed0 + r); }); });
