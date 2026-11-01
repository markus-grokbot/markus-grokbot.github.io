#!/usr/bin/env node
// Simulated Bible Tetris round (heuristic bot) -> full log with seed. Used to generate the tycoon sample seed.
// node tools/sim-bible-tetris.js [scheme] [pieces] [out.json]
const E = require('../games/bible-tetris/engine.js'), Bot = require('../games/bible-tetris/bot.js'), BRmod = require('../games/bible-tetris/verses.js');
const D = '../games/bible/data/', verses = require(D + 'algorithmic-verses.json'), bible = require(D + 'bible-kjv.json'), categories = require(D + 'categories.json');
const scheme = process.argv[2] || 'trinity3', N = +(process.argv[3] || 150), out = process.argv[4];
const rng = E.mulberry32(7), BR = BRmod.create({ verses, bible, categories, scheme, rng, stewardWeight: 0.3 });
let t = 0, last; const sc = [0, 100, 300, 500, 800];
const g = E.createGame({ seed: 7, level: 1, params: { linesToClear: 999 }, versePicker: BR.pick, onSpawn: i => BR.onSpawn(i, t),
  onLock: i => { i.baseScore = sc[i.linesCleared]; const d = BR.onLock(i, t); if (d) g.addScore(d); } });
for (let k = 0; k < N && !g.getState().over; k++) { t += 1000; const o = Bot.choose(g.getState(), 'good', rng); if (!o) break; g.place(o.rot, o.x); }
const st = g.stats(), s = g.getState(), outcome = s.over ? 'fail' : 'complete'; const eff = BR.onLevelEnd(outcome, st, t); if (eff) g.addScore(eff);
const log = { schema: 'gameplay-log', game: { id: 'bible-tetris', version: 'sim' }, run: { id: 'sim-' + scheme + '-' + N, type: 'sim', startedAt: new Date(0).toISOString() }, scheme: BR.scheme, ...BR.exportLog(),
  seed: BR.seed({ score: g.getState().score, pieces: s.pieces, holes_end: st.holes, outcome, run_id: 'sim-' + scheme + '-' + N }) };
const j = JSON.stringify(log, null, 1); if (out) require('fs').writeFileSync(out, j); else console.log(j);
console.error('lines', s.lines, 'pieces', s.pieces, 'colors', JSON.stringify(log.seed.colors.counts), 'effects', log.effects_applied.length, 'ach', log.achievements.map(a => a.title).join(' | '), 'conj', log.conjunctions.length);
