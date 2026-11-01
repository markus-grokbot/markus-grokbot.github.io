/* Default level params (iteration 1). Overridden by tuning.json when present. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.TetrisLevels = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var levels = [];
  for (var i = 1; i <= 10; i++) levels.push({ level: i, linesToClear: 6 + 2 * i, gravityMs: Math.round(900 * Math.pow(0.8, i - 1)), lockDelayMs: 500 });
  levels[0].linesToClear = 6; // L1 calibration: ~1-5 min for a human
  function merge(tuning) {
    if (!tuning || !tuning.levels) return levels;
    return levels.map(function (l) { var o = tuning.levels.find(function (t) { return t.level === l.level; }); return o ? Object.assign({}, l, o.params || o) : l; });
  }
  return { GAME_ID: 'tetris', GAME_VERSION: '0.1.0', ITERATION: 1, defaults: levels, merge: merge };
});
