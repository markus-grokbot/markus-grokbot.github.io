/* Tetris engine: pure logic, no DOM. UMD: window.TetrisEngine / module.exports */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TetrisEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 10, H = 20;
  // piece id 1..7 : I O T S Z J L ; shapes as cell lists per rotation (computed by rotating base)
  var BASE = {
    1: [[0,1],[1,1],[2,1],[3,1]], 2: [[1,0],[2,0],[1,1],[2,1]], 3: [[1,0],[0,1],[1,1],[2,1]],
    4: [[1,0],[2,0],[0,1],[1,1]], 5: [[0,0],[1,0],[1,1],[2,1]], 6: [[0,0],[0,1],[1,1],[2,1]], 7: [[2,0],[0,1],[1,1],[2,1]]
  };
  var NAMES = ['', 'I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  var PIECES = {};
  Object.keys(BASE).forEach(function (id) {
    var size = id == 1 ? 4 : (id == 2 ? 4 : 3), rots = [], cur = BASE[id];
    for (var r = 0; r < 4; r++) {
      rots.push(cur);
      if (id == 2) { cur = cur; } else cur = cur.map(function (c) { return [size - 1 - c[1], c[0]]; });
    }
    PIECES[id] = rots;
  });
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function emptyBoard() { var b = []; for (var y = 0; y < H; y++) { b.push(new Array(W).fill(0)); } return b; }
  function cloneBoard(b) { return b.map(function (r) { return r.slice(); }); }
  function cellsOf(type, rot, x, y) { return PIECES[type][rot & 3].map(function (c) { return [c[0] + x, c[1] + y]; }); }
  function fits(b, cells) { for (var i = 0; i < cells.length; i++) { var cx = cells[i][0], cy = cells[i][1]; if (cx < 0 || cx >= W || cy >= H) return false; if (cy >= 0 && b[cy][cx]) return false; } return true; }
  function placeOnBoard(b, cells, id, meta, verseId) {
    var nb = cloneBoard(b); cells.forEach(function (c) { if (c[1] >= 0) nb[c[1]][c[0]] = id; });
    var nm = meta ? meta.map(function (r) { return r.slice(); }) : null;
    if (nm) cells.forEach(function (c) { if (c[1] >= 0) nm[c[1]][c[0]] = verseId || null; });
    var clearRows = []; nb.forEach(function (r, y) { if (!r.some(function (v) { return !v; })) clearRows.push(y); });
    var kept = nb.filter(function (r) { return r.some(function (v) { return !v; }); }), cleared = H - kept.length;
    var keptMeta = nm && nm.filter(function (r, y) { return clearRows.indexOf(y) < 0; });
    while (kept.length < H) kept.unshift(new Array(W).fill(0));
    if (keptMeta) while (keptMeta.length < H) keptMeta.unshift(new Array(W).fill(null));
    return { board: kept, boardVerses: keptMeta, linesCleared: cleared, clearRows: clearRows, clearedVerseIds: clearRows.reduce(function (a, y) { return a.concat((nm && nm[y] || []).filter(Boolean)); }, []) };
  }
  function boardStats(b) {
    var heights = [], holes = 0;
    for (var x = 0; x < W; x++) {
      var h = 0, seen = false;
      for (var y = 0; y < H; y++) { if (b[y][x]) { if (!seen) { h = H - y; seen = true; } } else if (seen) holes++; }
      heights.push(h);
    }
    var bump = 0; for (var i = 0; i < W - 1; i++) bump += Math.abs(heights[i] - heights[i + 1]);
    return { heights: heights, maxHeight: Math.max.apply(null, heights), aggHeight: heights.reduce(function (a, c) { return a + c; }, 0), holes: holes, bumpiness: bump };
  }
  function dropPositions(b, type) {
    var out = [], seen = {};
    for (var rot = 0; rot < 4; rot++) for (var x = -3; x < W; x++) {
      var y = -2; if (!fits(b, cellsOf(type, rot, x, y))) continue;
      while (fits(b, cellsOf(type, rot, x, y + 1))) y++;
      var cells = cellsOf(type, rot, x, y), key = cells.map(String).sort().join('|');
      if (seen[key]) continue; seen[key] = 1; out.push({ rot: rot, x: x, y: y, cells: cells });
    }
    return out;
  }
  // goal 'lines' (default): level ends at linesToClear. goal 'drops': level ends when `dropsTarget` pieces
  // have locked; lines still score but do not end the level.
  function goalReached(p, lines, pieces) { return p.goal === 'drops' ? pieces >= p.dropsTarget : lines >= p.linesToClear; }
  function createGame(opts) {
    opts = opts || {};
    var p = Object.assign({ goal: 'lines', dropsTarget: 0, gravityMs: 800, linesToClear: 10, lockDelayMs: 500, scoreTable: [0, 100, 300, 500, 800] }, opts.params || {});
    var level = opts.level || 1, rng = mulberry32(opts.seed == null ? Date.now() : opts.seed);
    var board = opts.initialBoard ? cloneBoard(opts.initialBoard) : emptyBoard(), boardVerses = opts.initialBoardVerses ? cloneBoard(opts.initialBoardVerses) : emptyBoard().map(function (r) { return r.map(function () { return null; }); }), bag = [], cur = null, next, score = 0, lines = 0, pieces = 0, over = false, misplays = 0;
    var softUsed = false, gAcc = 0, lockAcc = 0, onLock = opts.onLock || null, maxHeightSeen = 0, holesSum = 0;
    function draw() { if (!bag.length) { bag = [1, 2, 3, 4, 5, 6, 7]; for (var i = 6; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = bag[i]; bag[i] = bag[j]; bag[j] = t; } } return bag.pop(); }
    function spawn() { var t = opts.forcePieces && opts.forcePieces.length ? opts.forcePieces.shift() : (next || draw()); next = draw(); cur = { type: t, rot: 0, x: 3, y: t === 1 ? -1 : 0, verse: t === 1 && opts.versePicker ? opts.versePicker() : null }; softUsed = false; if (opts.onSpawn) opts.onSpawn({ pieceType: NAMES[t], verse: cur.verse, pieceNo: pieces + 1 }); if (!fits(board, cells())) over = true; gAcc = 0; lockAcc = 0; }
    function cells() { return cellsOf(cur.type, cur.rot, cur.x, cur.y); }
    function tryMove(dx, dy, dr) { if (over || !cur) return false; var c = cellsOf(cur.type, cur.rot + (dr || 0), cur.x + dx, cur.y + dy); if (fits(board, c)) { cur.x += dx; cur.y += dy; cur.rot = (cur.rot + (dr || 0)) & 3; return true; } return false; }
    function grounded() { return !fits(board, cellsOf(cur.type, cur.rot, cur.x, cur.y + 1)); }
    function lock(how) {
      how = how || (softUsed ? 'soft_drop' : 'gravity');
      var landed = { x: cur.x, y: cur.y, rot: cur.rot }, before = boardStats(board).holes, r = placeOnBoard(board, cells(), cur.type, boardVerses, cur.verse);
      board = r.board; boardVerses = r.boardVerses; pieces++; lines += r.linesCleared; score += (p.scoreTable[r.linesCleared] || 0) * level;
      var st = boardStats(board); if (st.holes > before) misplays++;
      maxHeightSeen = Math.max(maxHeightSeen, st.maxHeight); holesSum += st.holes;
      var info = { how: how, pieceNo: pieces, pieceType: NAMES[cur.type], verse: cur.verse, x: landed.x, y: landed.y, rot: landed.rot, linesCleared: r.linesCleared, clearRows: r.clearRows, clearedVerseIds: r.clearedVerseIds, holes: st.holes, maxHeight: st.maxHeight };
      cur = null; if (onLock) onLock(info);
      if (!goalReached(p, lines, pieces)) spawn();
    }
    var g = {
      params: p, level: level,
      addScore: function (n) { score = Math.max(0, score + Math.round(n)); return score; },
      moveLeft: function () { var ok = tryMove(-1, 0); if (ok) lockAcc = 0; return ok; },
      moveRight: function () { var ok = tryMove(1, 0); if (ok) lockAcc = 0; return ok; },
      rotate: function (dir) {
        if (over || !cur) return false; dir = dir || 1;
        var kicks = [0, -1, 1, -2, 2];
        for (var i = 0; i < kicks.length; i++) if (tryMove(kicks[i], 0, dir)) { lockAcc = 0; return true; }
        return tryMove(0, -1, dir);
      },
      softDrop: function () { if (tryMove(0, 1)) { softUsed = true; score += 1; gAcc = 0; return true; } return false; },
      hardDrop: function () { if (over || !cur) return 0; var n = 0; while (tryMove(0, 1)) n++; score += 2 * n; lock(g._how || 'hard_drop'); g._how = null; return n; },
      place: function (rot, x) { if (over || !cur) return false; cur.rot = rot; cur.x = x; cur.y = -2; if (!fits(board, cells())) { cur.y = 0; } g._how = 'place'; return g.hardDrop(); },
      tick: function (dt) {
        if (over || !cur) return;
        if (grounded()) { lockAcc += dt; if (lockAcc >= p.lockDelayMs) lock(); return; }
        gAcc += dt; while (gAcc >= p.gravityMs && cur && !grounded()) { gAcc -= p.gravityMs; cur.y++; }
      },
      ghost: function () { if (!cur) return []; var y = cur.y; while (fits(board, cellsOf(cur.type, cur.rot, cur.x, y + 1))) y++; return cellsOf(cur.type, cur.rot, cur.x, y); },
      getState: function () { return { board: board, boardVerses: boardVerses, current: cur ? { type: cur.type, rot: cur.rot, x: cur.x, y: cur.y, verse: cur.verse, cells: cells() } : null, next: next, score: score, lines: lines, pieces: pieces, over: over, levelComplete: goalReached(p, lines, pieces) }; },
      stats: function () { var s = boardStats(board); return { maxHeight: s.maxHeight, holes: s.holes, bumpiness: s.bumpiness, misplays: misplays, maxHeightSeen: maxHeightSeen, avgHoles: pieces ? +(holesSum / pieces).toFixed(2) : 0 }; }
    };
    spawn();
    return g;
  }
  return { W: W, H: H, PIECES: PIECES, NAMES: NAMES, createGame: createGame, cloneBoard: cloneBoard, dropPositions: dropPositions, placeOnBoard: placeOnBoard, boardStats: boardStats, mulberry32: mulberry32 };
});
