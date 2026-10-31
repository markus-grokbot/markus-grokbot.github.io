#!/usr/bin/env node
/* Headless sim: node games/tetris/sim/run-sim.js [--skill good] [--runs 3] [--seed 1] [--levels 10]
   Writes logs to <repo>/logs/sim/. Uses virtual clock: time advances by bot think time + gravity. */
var path = require('path'), fs = require('fs');
var E = require('../engine.js'), B = require('../bot.js'), L = require('../levels.js'), G = require('../logger.js');
var args = {}; process.argv.slice(2).forEach(function (a, i, arr) { if (a.indexOf('--') === 0) args[a.slice(2)] = arr[i + 1]; });
var skills = (args.skill || 'novice,casual,good,expert').split(','), runs = +(args.runs || 1), seed0 = +(args.seed || 1), maxLv = +(args.levels || 10);
var root = path.join(__dirname, '..', '..', '..'), out = path.join(root, 'logs', 'sim');
var tuningPath = path.join(__dirname, '..', 'tuning.json'), tuning = fs.existsSync(tuningPath) ? JSON.parse(fs.readFileSync(tuningPath)) : null;
var levels = L.merge(tuning); fs.mkdirSync(out, { recursive: true });
skills.forEach(function (skill) {
  for (var r = 0; r < runs; r++) {
    var seed = seed0 + r, rng = E.mulberry32(seed * 7919), vt = 0, sk = B.SKILLS[skill];
    var log = G.createLog({ gameId: L.GAME_ID, gameVersion: L.GAME_VERSION, iteration: L.ITERATION, runType: 'sim', seed: seed, clock: function () { return vt; }, device: { platform: 'node ' + process.version, headless: true }, player: { kind: 'heuristic-bot', skill: skill }, tuningSource: tuning ? 'tuning.json' : 'defaults' });
    vt = Date.UTC(2026, 9, 31); var t0 = vt;
    for (var lv = 1; lv <= maxLv; lv++) {
      var P = levels[lv - 1], g = E.createGame({ seed: seed * 100 + lv, level: lv, params: P });
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
