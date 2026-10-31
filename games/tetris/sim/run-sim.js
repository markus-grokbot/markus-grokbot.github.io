#!/usr/bin/env node
/* Headless sim: node games/tetris/sim/run-sim.js [--skill good] [--runs 3] [--seed 1] [--levels 10]
   Writes logs to <repo>/logs/sim/. Uses virtual clock: time advances by bot think time + gravity.
   Drop-target combo mode (Tetris drop round -> Pairwise Pit round, SIM chooser):
     node games/tetris/sim/run-sim.js --mode drops [--set games/pairwise/sets/test-001.json] [--chooser random|length] [--skill casual] [--runs 1]
   -> logs/sim/combo-<skill>-<chooser>-seed<N>.json (run.type 'sim'; pairwise decisions source 'sim:<chooser>') */
var path = require('path'), fs = require('fs');
var E = require('../engine.js'), B = require('../bot.js'), L = require('../levels.js'), G = require('../logger.js');
var args = {}; process.argv.slice(2).forEach(function (a, i, arr) { if (a.indexOf('--') === 0) args[a.slice(2)] = arr[i + 1]; });
var skills = (args.skill || 'novice,casual,good,expert').split(','), runs = +(args.runs || 1), seed0 = +(args.seed || 1), maxLv = +(args.levels || 10);
var root = path.join(__dirname, '..', '..', '..'), out = path.join(root, 'logs', 'sim');
var tuningPath = path.join(__dirname, '..', 'tuning.json'), tuning = fs.existsSync(tuningPath) ? JSON.parse(fs.readFileSync(tuningPath)) : null;
var levels = L.merge(tuning); fs.mkdirSync(out, { recursive: true });
if (args.mode === 'drops') { runCombo(); process.exit(0); }
function runCombo() {
  var D = require('../droptarget.js'), PW = require('../../pairwise/pairwise.js'), PS = require('../../pairwise/sim-chooser.js'), CS = require('../../combo/session.js');
  var setPath = path.resolve(args.set || path.join(__dirname, '..', '..', 'pairwise', 'sets', 'test-001.json')), set = JSON.parse(fs.readFileSync(setPath));
  var choosers = (args.chooser || 'random,length').split(','), sks = (args.skill || 'casual').split(',');
  sks.forEach(function (skill) { choosers.forEach(function (chooser) { for (var r = 0; r < runs; r++) {
    var seed = seed0 + r, rng = E.mulberry32(seed * 7919), vt = Date.UTC(2026, 9, 31), t0 = vt, sk = B.SKILLS[skill];
    var dt = D.compute(set, D.fromTuning(tuning)), P = Object.assign({}, levels[0], { level: 1, goal: 'drops', dropsTarget: dt.dropsTarget, wordsPerDrop: dt.wordsPerDrop });
    var S = CS.create({ runType: 'sim', seed: seed, clock: function () { return vt; }, device: { platform: 'node ' + process.version, headless: true }, player: { kind: 'heuristic-bot', skill: skill, pairwiseChooser: 'sim:' + chooser }, tuningSource: tuning ? 'tuning.json' : 'defaults' });
    S.startTetris(P, dt, set);
    var g = E.createGame({ seed: seed * 100 + 1, level: 1, params: P, onLock: S.lockEvent }), steps = 0;
    while (!g.getState().over && !g.getState().levelComplete && steps++ < 5000) {
      var st = g.getState(), mv = B.choose(st, skill, rng); if (!mv) break;
      vt += Math.round(sk.thinkMs * (0.7 + rng() * 0.6) + 150); g.place(mv.rot, mv.x);
    }
    var tl = S.endTetris(g, P, dt);
    S.startPairwise(set);
    var round = PW.createRound(set, { clock: function () { return vt; }, rng: rng });
    while (!round.done()) { var c = round.current(), ch = PS.choose(c.pair, chooser, rng); vt += PS.thinkMs(c.pair, rng); var d = round.decide(ch.choice, ch.strength, ch.tags, 'sim:' + chooser); S.event('pairwise_decision', { pairId: d.pairId, choice: d.choice, seq: d.seq }); }
    var pl = S.endPairwise(round), res = S.finish();
    var f = path.join(out, 'combo-' + skill + '-' + chooser + '-seed' + seed + '.json'); fs.writeFileSync(f, JSON.stringify(S.log.toJSON(), null, 1));
    var locks = tl.events.filter(function (e) { return e.type === 'lock'; }).length;
    console.log('combo', skill, chooser, 'seed', seed, '| words', dt.totalWords, 'target', dt.dropsTarget, '| tetris', tl.outcome, tl.ext.tetris.pieces + ' pieces/' + locks + ' lock events', Math.round(tl.durationMs / 1000) + 's | pairwise', pl.outcome, pl.ext.pairwise.decisionsMade + ' decisions', Math.round(pl.durationMs / 1000) + 's | total', Math.round((vt - t0) / 1000) + 's ->', path.relative(root, f));
  } }); });
}
skills.forEach(function (skill) {
  for (var r = 0; r < runs; r++) {
    var seed = seed0 + r, rng = E.mulberry32(seed * 7919), vt = 0, sk = B.SKILLS[skill];
    var log = G.createLog({ gameId: L.GAME_ID, gameVersion: L.GAME_VERSION, iteration: L.ITERATION, runType: 'sim', seed: seed, clock: function () { return vt; }, device: { platform: 'node ' + process.version, headless: true }, player: { kind: 'heuristic-bot', skill: skill }, tuningSource: tuning ? 'tuning.json' : 'defaults' });
    vt = Date.UTC(2026, 9, 31); var t0 = vt;
    for (var lv = 1; lv <= maxLv; lv++) {
      var P = levels[lv - 1], g = E.createGame({ seed: seed * 100 + lv, level: lv, params: P, onLock: function (i) { log.event('lock', i); } });
      log.startLevel(lv, P); var steps = 0;
      while (!g.getState().over && !g.getState().levelComplete && steps++ < 5000) {
        var st = g.getState(), mv = B.choose(st, skill, rng);
        // time cost: thinking, but gravity limits it; if think > time for piece to fall ~ (rows*gravity) bot makes a panic random drop
        var fallTime = (mv ? mv.y + 2 : 10) * P.gravityMs + P.lockDelayMs, think = sk.thinkMs * (0.7 + rng() * 0.6);
        if (think > fallTime) { log.event('misplay', { reason: 'too_slow' }); mv = E.dropPositions(st.board, st.current.type)[Math.floor(rng() * 4)] || mv; think = fallTime; }
        vt += Math.round(think + 150);
        if (!mv) break; var before = g.stats().holes; g.place(mv.rot, mv.x);
        var s2 = g.getState(); if (g.stats().holes > before) log.event('hole_created', { holes: g.stats().holes });
      }
      var s = g.getState(), sts = g.stats(), done = s.levelComplete;
      log.endLevel(done ? 'complete' : 'fail', { score: s.score, actions: s.pieces, misplays: sts.misplays, progress: Math.min(1, s.lines / P.linesToClear) }, { lines: s.lines, pieces: s.pieces, maxHeight: sts.maxHeightSeen, holesEnd: sts.holes, avgHoles: sts.avgHoles, bumpinessEnd: sts.bumpiness, gravityMs: P.gravityMs, lockDelayMs: P.lockDelayMs });
      if (!done) break;
    }
    var res = log.finish(), f = path.join(out, 'sim-' + skill + '-seed' + seed + '.json');
    fs.writeFileSync(f, JSON.stringify(log.toJSON(), null, 1));
    console.log(skill, 'seed', seed, 'levels completed:', res.summary.levelsCompleted, 'sim-time:', Math.round((vt - t0) / 1000) + 's', '->', path.relative(root, f));
  }
});
