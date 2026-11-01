/*
 * Bible Shooter level generator.
 * Input: color ratios, e.g. { father: .5, son: .3, spirit: .2 } (keys = category keys of a categories.json scheme).
 * Output: a symmetric pixel-art level whose pixel color shares match the ratios, plus 5 lanes of shooters
 * whose counts per color equal the pixel counts per color.
 *
 * Approach: a motif defines integer "regions" (rings, mandala petals, tiles...). Regions are assigned to colors
 * largest-first to whichever color is furthest below its target share, so the art stays patterned while the
 * proportions land within a few percent.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./bots.js'));
  else root.ShooterGen = factory(root.ShooterEngine, root.ShooterBots);
})(typeof self !== 'undefined' ? self : this, function (Engine, Bots) {
  'use strict';

  var MOTIFS = ['rings', 'diamonds', 'mandala', 'tiles', 'waves', 'starburst', 'squares'];

  function rngFrom(seed) {
    var n = (seed >>> 0) || 1;
    return function () { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  }

  /** Region id for a cell, per motif. All motifs are mirror-symmetric on both axes (uses |dx|, |dy|). */
  function regionOf(motif, ax, ay, d, size, variant) {
    var ang = Math.atan2(Math.min(ax, ay), Math.max(ax, ay)); // 0..pi/4, 8-fold folded angle
    switch (motif) {
      case 'rings': return Math.floor(d / (1.2 + variant));
      case 'diamonds': return Math.floor((ax + ay) / (1.5 + variant));
      case 'mandala': return Math.floor(d / (2.5 + variant)) * 3 + Math.floor(ang / (Math.PI / 12));
      case 'tiles': return Math.floor(Math.max(ax, ay) / 3) * 2 + ((Math.floor(ax / 2) + Math.floor(ay / 2)) % 2);
      case 'waves': return Math.floor((ay + 1.6 * Math.sin(ax * (0.5 + variant / 3))) / 2 + 20);
      case 'starburst': return Math.floor(ang / (Math.PI / 16)) + 4 * Math.floor(d / (size / 4));
      default: return Math.floor(Math.max(ax, ay) / (1.4 + variant / 2)); // squares
    }
  }

  /** Build the pixel grid for a motif with exact-ish color ratios. */
  function paint(size, ratios, motif, rng) {
    var keys = Object.keys(ratios).filter(function (k) { return ratios[k] > 0; });
    var total = keys.reduce(function (a, k) { return a + ratios[k]; }, 0);
    var c = (size - 1) / 2, variant = Math.floor(rng() * 3) * 0.5, regions = {}, cells = 0;
    var round = rng() < 0.6; // rounded silhouette (empty corners) or full square
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var ax = Math.abs(x - c), ay = Math.abs(y - c), d = Math.sqrt(ax * ax + ay * ay);
      if (round && d > c + 0.8) continue;
      var r = regionOf(motif, ax, ay, d, size, variant);
      (regions[r] = regions[r] || []).push([x, y]); cells++;
    }
    // Assign regions to colors in spatial order (region ids run outward), alternating colors so neighbours differ:
    // pick the color with the largest relative deficit, skipping the previous region's color when another still has room.
    var target = {}, got = {}, assign = {}, prev = null;
    keys.forEach(function (k) { target[k] = cells * ratios[k] / total; got[k] = 0; });
    var ids = Object.keys(regions).sort(function (a, b) { return a - b; });
    ids.forEach(function (id) {
      var size = regions[id].length, best = null, bd = -Infinity;
      keys.forEach(function (k) {
        var def = (target[k] - got[k] - size / 2) / target[k];
        if (k === prev && keys.length > 1) def -= 0.35;
        if (def > bd) { bd = def; best = k; }
      });
      assign[id] = best; got[best] += size; prev = best;
    });
    // Rebalance: move single regions to another color while it reduces total ratio error (keeps the pattern mostly intact).
    function err() { return keys.reduce(function (a, k) { return a + Math.abs(got[k] - target[k]); }, 0); }
    for (var pass = 0; pass < 40 && err() / cells > 0.03; pass++) {
      var bestMove = null, bestErr = err();
      ids.forEach(function (id) {
        var from = assign[id], n = regions[id].length;
        keys.forEach(function (to) {
          if (to === from) return;
          got[from] -= n; got[to] += n; var e = err(); got[from] += n; got[to] -= n;
          if (e < bestErr - 0.5) { bestErr = e; bestMove = [id, from, to]; }
        });
      });
      if (!bestMove) break;
      assign[bestMove[0]] = bestMove[2]; got[bestMove[1]] -= regions[bestMove[0]].length; got[bestMove[2]] += regions[bestMove[0]].length;
    }
    var pixels = [];
    for (var yy = 0; yy < size; yy++) pixels.push(new Array(size).fill(null));
    ids.forEach(function (id) { regions[id].forEach(function (p) { pixels[p[1]][p[0]] = assign[id]; }); });
    return pixels;
  }

  /** Average distance from the field edge of each color: outer colors (small) must be shot first. */
  function colorDepth(pixels) {
    var n = pixels.length, sum = {}, cnt = {};
    pixels.forEach(function (row, y) { row.forEach(function (k, x) {
      if (!k) return; var e = Math.min(x, y, n - 1 - x, n - 1 - y); sum[k] = (sum[k] || 0) + e; cnt[k] = (cnt[k] || 0) + 1; }); });
    var out = {}; Object.keys(sum).forEach(function (k) { out[k] = sum[k] / cnt[k]; }); return out;
  }

  /**
   * Split pixel counts into shooters and deal them into 5 lanes.
   * difficulty 1..5: more, smaller shooters and a lane order that drifts further from "outer colors first".
   */
  function makeLanes(pixels, difficulty, rng) {
    var counts = Engine.countPixels(pixels), depth = colorDepth(pixels), shooters = [];
    Object.keys(counts).forEach(function (k) {
      var per = Math.round(36 / difficulty) + 4; // average shooter size: d1 ~40, d5 ~11
      var n = Math.max(1, Math.round(counts[k] / per)), left = counts[k];
      for (var i = 0; i < n; i++) {
        var share = i === n - 1 ? left : Math.round(left / (n - i) * (0.6 + rng() * 0.8));
        share = Math.max(1, Math.min(100, Math.min(share, left - (n - i - 1))));
        shooters.push({ color: k, count: share, depth: depth[k] + rng() * 3 }); left -= share;
      }
      while (left > 0) { var add = Math.min(100, left); shooters.push({ color: k, count: add, depth: depth[k] + rng() * 3 }); left -= add; }
    });
    // Ideal order: outer colors first. Perturb by difficulty.
    // Higher difficulty: some shooters are dealt "inside-out" (buried colors near lane tops) -> they lap uselessly and park.
    var flipRate = (difficulty - 1) * 0.12;
    shooters.forEach(function (s) { s.key = (rng() < flipRate ? -s.depth : s.depth) + (rng() - 0.5) * difficulty * 3; });
    shooters.sort(function (a, b) { return a.key - b.key; });
    var lanes = [[], [], [], [], []];
    shooters.forEach(function (s, i) { lanes[(i + Math.floor(rng() * (difficulty > 2 ? 2 : 1))) % 5].push({ color: s.color, count: s.count }); });
    return lanes;
  }

  /** Generate one level (no validation). */
  function generate(o) {
    o = o || {};
    var seed = o.seed || 1, rng = rngFrom(seed * 7919), size = Math.max(12, Math.min(24, o.size || 16));
    var difficulty = Math.max(1, Math.min(5, o.difficulty || 1));
    var motif = o.motif || MOTIFS[Math.floor(rng() * MOTIFS.length)];
    var pixels = paint(size, o.ratios || { father: 0.5, son: 0.3, spirit: 0.2 }, motif, rng);
    var level = {
      id: 'gen-' + motif + '-' + seed + '-d' + difficulty, name: o.name || (motif[0].toUpperCase() + motif.slice(1)),
      w: size, h: size, pixels: pixels, lanes: makeLanes(pixels, difficulty, rng), palette: o.palette || {},
      meta: { ratios: o.ratios, motif: motif, seed: seed, difficulty: difficulty, scheme: o.scheme || null }
    };
    var px = Engine.countPixels(pixels), tot = Object.keys(px).reduce(function (a, k) { return a + px[k]; }, 0);
    level.meta.actualRatios = {}; Object.keys(px).forEach(function (k) { level.meta.actualRatios[k] = +(px[k] / tot).toFixed(3); });
    return level;
  }

  /**
   * Generate + validate with bots. Rejects unsolvable (no policy wins) and trivial (random wins >95% at difficulty>=3).
   * Returns { level, stats, tries }.
   */
  function generateValidated(o, runs, maxTries) {
    runs = runs || 10; maxTries = maxTries || 12;
    var last = null;
    for (var t = 0; t < maxTries; t++) {
      var level = generate(Object.assign({}, o, { seed: (o.seed || 1) + t * 101 }));
      var stats = Bots.evaluate(level, runs), best = Math.max(stats.greedy.winRate, stats.lookahead.winRate);
      last = { level: level, stats: stats, tries: t + 1 };
      if (best === 0) continue;
      if (level.meta.difficulty >= 3 && stats.random.winRate > 0.95) continue;
      level.meta.sim = stats; return last;
    }
    last.rejected = true; return last;
  }

  /** Palette {key: color} from a categories.json object and scheme name. */
  function paletteFrom(categories, scheme) {
    var s = categories.schemes[scheme || categories.default_scheme], out = {};
    Object.keys(s.categories).forEach(function (k) { out[k] = s.categories[k].color; });
    return out;
  }

  /** Ratios from a Bible Tetris log/seed (seed.colors.counts), keeping the top `maxColors` categories. */
  function ratiosFromSeed(log, maxColors) {
    var seed = log.seed || log, counts = (seed.colors && seed.colors.counts) || {}, keys = Object.keys(counts);
    keys.sort(function (a, b) { return counts[b] - counts[a]; }); keys = keys.slice(0, maxColors || 5);
    var tot = keys.reduce(function (a, k) { return a + counts[k]; }, 0), r = {};
    keys.forEach(function (k) { r[k] = counts[k] / tot; });
    return { scheme: seed.scheme || 'trinity3', ratios: r };
  }

  return { MOTIFS: MOTIFS, generate: generate, generateValidated: generateValidated, paletteFrom: paletteFrom, ratiosFromSeed: ratiosFromSeed };
});
