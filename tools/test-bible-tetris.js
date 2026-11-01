#!/usr/bin/env node
// Headless play-test of Bible Tetris: forces a 4-line clear (Tetris) through the real engine + verse layer.
const E = require('../games/bible-tetris/engine.js'), BRmod = require('../games/bible-tetris/verses.js');
const D = '../games/bible/data/', verses = require(D + 'algorithmic-verses.json'), bible = require(D + 'bible-kjv.json'), categories = require(D + 'categories.json');
const assert = require('assert'); let ok = 0; const t = (c, m) => { assert(c, m); ok++; console.log('✓', m); };
const scheme = process.argv[2] || 'trinity3';
const steward = verses.find(v => v.effect && v.effect.kind === 'multiplier' && v.effect.trigger === 'line_clear');
const other = verses.find(v => !v.effect && v.categories[scheme] !== steward.categories[scheme]);
const third = verses.find(v => !v.effect && ![steward, other].some(x => x.categories[scheme] === v.categories[scheme]));
let picks = [steward.id], tick = 0;
const BR = BRmod.create({ verses, bible, categories, scheme });
BR.pick = () => picks.shift() || steward.id;
// Board: rows 16-19 full except column 9; earlier verse-carrying cells in rows 18 and 19.
const board = [], bv = [];
for (let y = 0; y < 20; y++) { board.push(Array(10).fill(y >= 16 ? 2 : 0)); bv.push(Array(10).fill(null)); if (y >= 16) board[y][9] = 0; }
bv[19][0] = bv[19][1] = bv[19][2] = bv[19][3] = other.id; bv[18][4] = bv[18][5] = third ? third.id : other.id;
const scoreTable = [0, 100, 300, 500, 800];
const g = E.createGame({ seed: 1, level: 1, params: { linesToClear: 40 }, initialBoard: board, initialBoardVerses: bv, forcePieces: [1, 2],
  versePicker: () => BR.pick(), onSpawn: i => BR.onSpawn(i, ++tick),
  onLock: i => { i.baseScore = scoreTable[i.linesCleared]; const d = BR.onLock(i, ++tick); if (d) g.addScore(d); last = { i, d }; } });
let last = null;
t(g.getState().current.type === 1 && g.getState().current.verse === steward.id, 'I piece spawned with verse ' + steward.ref);
// vertical I into column 9
const pos = E.dropPositions(board, 1).find(p => p.cells.every(c => c[0] === 9)); g.place(pos.rot, pos.x); const placed = last && last.i.linesCleared === 4;
t(placed, 'single drop cleared 4 rows (Tetris)');
const R = BR.state(), log = BR.exportLog();
t(log.verse_events.some(e => e.event === 'spawned') && log.verse_events.some(e => e.event === 'placed'), 'spawned + placed events logged');
const tet = log.verse_events.filter(e => e.event === 'cleared-in-tetris').map(e => e.ref);
t(tet.includes(steward.ref) && tet.includes(other.ref), 'cleared-in-tetris verses: ' + tet.join(', '));
t(log.conjunctions.length === 1 && log.conjunctions[0].flag_for_analysis, 'conjunction recorded: ' + log.conjunctions[0].refs.join(' + '));
t(log.effects_applied.some(e => e.id === steward.id && e.score_delta > 0), 'steward multiplier applied (+' + last.d + ' pts, x' + steward.effect.game_value + ')');
t(g.getState().score >= 800 + last.d, 'score includes effect: ' + g.getState().score);
t(log.achievements.length >= 2 && log.achievements.length <= 5 && log.achievements.every(a => a.text && a.text.length > 10), 'achievements (' + log.achievements.length + ') with KJV text: ' + log.achievements.map(a => a.title).join(' | '));
t(log.verse_events.every(e => /^#/.test(e.color)), 'every verse event has a scheme color');
const end = BR.onLevelEnd('fail', { holes: 2 }, ++tick);
const seed = BR.seed({ score: g.getState().score, outcome: 'fail' });
t(seed.schema === 'bible-seed' && seed.colors.sequence.length >= 1 && Object.keys(seed.colors.counts).length >= 1 && seed.features.length >= 2, 'seed exported: colors ' + JSON.stringify(seed.colors.counts) + ', ' + seed.features.length + ' features');
t(Array.isArray(log.noteworthy_algorithmic), 'noteworthy_algorithmic list: ' + BR.exportLog().noteworthy_algorithmic.length);
if (process.argv.includes('--write-sample')) { const full = { schema: 'gameplay-log', game: { id: 'bible-tetris' }, run: { id: 'sample-sim-001', type: 'sim' }, scheme, ...BR.exportLog(), seed };
  require('fs').writeFileSync(__dirname + '/../games/bible-tycoon/sample-seed.json', JSON.stringify(full, null, 1)); console.log('wrote games/bible-tycoon/sample-seed.json'); }
console.log(ok + ' checks passed');
