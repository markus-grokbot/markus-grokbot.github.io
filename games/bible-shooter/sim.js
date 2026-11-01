#!/usr/bin/env node
/*
 * Bible Shooter simulator CLI.
 *   node sim.js --levels [--runs 50]                 win rates for starter levels (starter-levels.json)
 *   node sim.js --gen '{"father":.5,"son":.3,"spirit":.2}' [--seed 3] [--difficulty 3] [--size 18]
 *   node sim.js --seed-log ../bible-tycoon/sample-seed.json [--difficulty 3]   generate from a Tetris log
 *   node sim.js --build-levels                       (re)build starter-levels.json with a difficulty curve
 */
var fs = require('fs'), path = require('path');
var Engine = require('./engine.js'), Bots = require('./bots.js'), Gen = require('./generator.js');
var categories = JSON.parse(fs.readFileSync(path.join(__dirname, '../bible/data/categories.json'), 'utf8'));

function arg(name, dflt) { var i = process.argv.indexOf('--' + name); return i < 0 ? dflt : (process.argv[i + 1] || true); }
var runs = +arg('runs', 40);

function describe(level, stats) {
  var px = Engine.countPixels(level.pixels), n = Object.keys(px).reduce(function (a, k) { return a + px[k]; }, 0);
  var shooters = level.lanes.reduce(function (a, q) { return a + q.length; }, 0);
  console.log(level.name + ' [' + level.id + '] ' + level.w + 'x' + level.h + ', ' + n + ' pixels, ' + shooters + ' shooters, motif ' + level.meta.motif +
    ', ratios ' + JSON.stringify(level.meta.actualRatios) + ', invariant ' + (Engine.checkLevel(level).ok ? 'ok' : 'BROKEN'));
  Object.keys(stats).forEach(function (p) {
    var s = stats[p];
    console.log('  ' + p.padEnd(9) + ' win ' + (s.winRate * 100).toFixed(0).padStart(3) + '%  (' + s.runs + ' runs)  taps ' + s.avgTaps + '  max parking ' + s.avgMaxParking +
      (Object.keys(s.losses).length ? '  losses ' + JSON.stringify(s.losses) : ''));
  });
}

/** Search seeds for 5 levels whose random-policy win rate falls with level while staying solvable. */
function buildLevels() {
  var palette = Gen.paletteFrom(categories, 'trinity3');
  var plan = [
    { name: 'First Light', difficulty: 1, size: 14, motif: 'rings', ratios: { father: 0.5, son: 0.3, spirit: 0.2 }, random: [0.9, 1] },
    { name: 'Diamond Steps', difficulty: 2, size: 16, motif: 'diamonds', ratios: { father: 0.4, son: 0.35, spirit: 0.25 }, random: [0.7, 1] },
    { name: 'Woven Tiles', difficulty: 3, size: 18, motif: 'tiles', ratios: { father: 0.34, son: 0.33, spirit: 0.33 }, random: [0.4, 0.85] },
    { name: 'Mandala', difficulty: 4, size: 20, motif: 'mandala', ratios: { father: 0.5, son: 0.3, spirit: 0.2 }, random: [0.15, 0.6] },
    { name: 'Nested Squares', difficulty: 5, size: 22, motif: 'squares', ratios: { father: 0.45, son: 0.35, spirit: 0.2 }, random: [0, 0.55] }
  ];
  var out = plan.map(function (p, i) {
    for (var widen = 0; widen <= 0.45; widen += 0.15) for (var seed = 1; seed < 120; seed++) {
      var level = Gen.generate({ ratios: p.ratios, palette: palette, size: p.size, seed: seed, difficulty: p.difficulty, motif: p.motif, name: p.name, scheme: 'trinity3' });
      var st = Bots.evaluate(level, 20);
      if (st.random.winRate >= p.random[0] - widen && st.random.winRate <= p.random[1] + widen && st.lookahead.winRate >= 0.75 - widen) {
        level.id = 'starter-' + (i + 1); level.meta.sim = st; console.error('level', i + 1, 'seed', seed, 'band widened by', widen.toFixed(2)); return level;
      }
    }
    throw new Error('no seed found for ' + p.name);
  });
  fs.writeFileSync(path.join(__dirname, 'starter-levels.json'), JSON.stringify(out));
  console.log('wrote starter-levels.json');
}

if (arg('build-levels')) buildLevels();
else if (arg('levels')) {
  JSON.parse(fs.readFileSync(path.join(__dirname, 'starter-levels.json'), 'utf8')).forEach(function (l) { describe(l, Bots.evaluate(l, runs)); });
} else {
  var src = arg('seed-log') ? Gen.ratiosFromSeed(JSON.parse(fs.readFileSync(arg('seed-log'), 'utf8'))) : { scheme: arg('scheme', 'trinity3'), ratios: JSON.parse(arg('gen', '{"father":0.5,"son":0.3,"spirit":0.2}')) };
  var r = Gen.generateValidated({ ratios: src.ratios, palette: Gen.paletteFrom(categories, src.scheme), scheme: src.scheme,
    seed: +arg('seed', 1), difficulty: +arg('difficulty', 3), size: +arg('size', 18) }, 20);
  describe(r.level, r.stats); console.log('tries', r.tries, r.rejected ? 'REJECTED (returned last attempt)' : 'accepted');
}
