/* Heuristic simulated player (El-Tetris style weights). skill: novice|casual|good|expert */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('./engine.js')); else root.TetrisBot = f(root.TetrisEngine); })(typeof self !== 'undefined' ? self : this, function (E) {
  var SKILLS = {
    novice: { noise: 0.35, thinkMs: 900, errorRate: 0.18 },
    casual: { noise: 0.15, thinkMs: 600, errorRate: 0.07 },
    good: { noise: 0.05, thinkMs: 350, errorRate: 0.02 },
    expert: { noise: 0, thinkMs: 200, errorRate: 0 }
  };
  var Wt = { lines: 0.76, agg: -0.51, holes: -0.36, bump: -0.18 };
  function choose(state, skill, rng) {
    var s = SKILLS[skill] || SKILLS.good, opts = E.dropPositions(state.board, state.current.type);
    if (!opts.length) return null;
    if (rng() < s.errorRate) return opts[Math.floor(rng() * opts.length)];
    var best = null, bv = -Infinity;
    opts.forEach(function (o) {
      var r = E.placeOnBoard(state.board, o.cells, state.current.type), st = E.boardStats(r.board);
      var v = Wt.lines * r.linesCleared + Wt.agg * st.aggHeight + Wt.holes * st.holes * 2 + Wt.bump * st.bumpiness + (rng() - 0.5) * s.noise * 10;
      if (v > bv) { bv = v; best = o; }
    });
    return best;
  }
  return { SKILLS: SKILLS, choose: choose };
});
