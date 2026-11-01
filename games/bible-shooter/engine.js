/*
 * Bible Shooter engine — pure, deterministic rules (no DOM).
 * Browser: window.ShooterEngine, Node: require('./engine.js').
 *
 * Board: W x H grid of pixels (color key or null), surrounded by a conveyor belt.
 * Belt positions (index 0 = entry, bottom-right):
 *   right side, bottom->top (looks left along its row)
 *   top side,   right->left (looks down its column)
 *   left side,  top->bottom (looks right along its row)
 *   bottom side, left->right (looks up its column)  ... back to entry = one lap.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShooterEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BELT_MAX = 5;     // shooters allowed on the belt at once
  var PARK_SLOTS = 5;   // parking slots
  var LANES = 5;

  /** Belt positions with the inward ray direction for each. */
  function buildPerimeter(W, H) {
    var p = [], x, y;
    for (y = H - 1; y >= 0; y--) p.push({ side: 'right', x: W, y: y, dx: -1, dy: 0 });
    for (x = W - 1; x >= 0; x--) p.push({ side: 'top', x: x, y: -1, dx: 0, dy: 1 });
    for (y = 0; y < H; y++) p.push({ side: 'left', x: -1, y: y, dx: 1, dy: 0 });
    for (x = 0; x < W; x++) p.push({ side: 'bottom', x: x, y: H, dx: 0, dy: -1 });
    return p;
  }

  /** Count pixels per color in a pixel grid. */
  function countPixels(pixels) {
    var c = {};
    pixels.forEach(function (row) { row.forEach(function (k) { if (k) c[k] = (c[k] || 0) + 1; }); });
    return c;
  }

  /** Check the level invariant: shooter counts per color == pixel counts per color. */
  function checkLevel(level) {
    var px = countPixels(level.pixels), sh = {};
    level.lanes.forEach(function (q) { q.forEach(function (s) { sh[s.color] = (sh[s.color] || 0) + s.count; }); });
    var bad = Object.keys(Object.assign({}, px, sh)).filter(function (k) { return (px[k] || 0) !== (sh[k] || 0); });
    return { ok: bad.length === 0, pixels: px, shooters: sh, mismatched: bad };
  }

  /**
   * Create a game. `snapshot` (optional) restores a previous state() for lookahead.
   */
  function createGame(level, opts, snapshot) {
    opts = opts || {};
    var W = level.w, H = level.h, perimeter = buildPerimeter(W, H), L = perimeter.length;
    var s = snapshot ? clone(snapshot) : {
      w: W, h: H,
      pixels: level.pixels.map(function (r) { return r.slice(); }),
      lanes: level.lanes.map(function (q) { return q.map(function (x) { return { color: x.color, count: x.count }; }); }),
      belt: [],                                   // {color, count, pos}
      parked: new Array(PARK_SLOTS).fill(null),   // {color, count} or null
      tick: 0, status: 'playing', loseReason: null,
      maxParkingUsed: 0, shots: {}, pixelsLeft: 0, taps: 0
    };
    if (!snapshot) s.pixelsLeft = level.pixels.reduce(function (n, r) { return n + r.filter(Boolean).length; }, 0);
    var events = [];

    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function emit(type, data) { if (!opts.quiet) events.push(Object.assign({ type: type, tick: s.tick }, data || {})); }

    /** First non-empty pixel seen from belt position index i, or null. */
    function rayHit(i) {
      var p = perimeter[i], x = p.x + p.dx, y = p.y + p.dy;
      while (x >= 0 && x < W && y >= 0 && y < H) {
        var k = s.pixels[y][x];
        if (k) return { x: x, y: y, color: k };
        x += p.dx; y += p.dy;
      }
      return null;
    }

    /** Pixels of each color currently visible from the belt (distinct pixels). */
    function exposure() {
      var seen = {}, out = {};
      for (var i = 0; i < L; i++) {
        var h = rayHit(i);
        if (h && !seen[h.x + ',' + h.y]) { seen[h.x + ',' + h.y] = 1; out[h.color] = (out[h.color] || 0) + 1; }
      }
      return out;
    }

    function entryFree() {
      return s.belt.length < BELT_MAX && !s.belt.some(function (b) { return b.pos === 0; });
    }

    /** Legal taps right now. */
    function actions() {
      var a = [];
      if (s.status !== 'playing' || !entryFree()) return a;
      s.lanes.forEach(function (q, i) { if (q.length) a.push({ type: 'lane', lane: i, color: q[0].color, count: q[0].count }); });
      s.parked.forEach(function (v, i) { if (v) a.push({ type: 'park', slot: i, color: v.color, count: v.count }); });
      return a;
    }

    /** Put a lane-top or parked shooter onto the belt entry. */
    function tap(a) {
      if (s.status !== 'playing' || !entryFree() || !a) return false;
      var sh = null;
      if (a.type === 'lane' && s.lanes[a.lane] && s.lanes[a.lane].length) sh = s.lanes[a.lane].shift();
      else if (a.type === 'park' && s.parked[a.slot]) { sh = s.parked[a.slot]; s.parked[a.slot] = null; }
      if (!sh) return false;
      s.belt.push({ color: sh.color, count: sh.count, pos: 0 });
      s.taps++;
      emit('tap', { source: a.type, lane: a.lane, slot: a.slot, color: sh.color, count: sh.count,
        parking: s.parked.map(function (p) { return p && p.color + ':' + p.count; }) });
      return true;
    }

    /** Advance one tick: each belt shooter shoots (if it can), then moves one position. */
    function tick() {
      if (s.status !== 'playing') return;
      s.tick++;
      var keep = [];
      for (var i = 0; i < s.belt.length; i++) {
        var sh = s.belt[i], h = rayHit(sh.pos);
        if (h && h.color === sh.color) {
          s.pixels[h.y][h.x] = null; s.pixelsLeft--; sh.count--;
          s.shots[sh.color] = (s.shots[sh.color] || 0) + 1;
          emit('shot', { color: sh.color, x: h.x, y: h.y });
          if (sh.count <= 0) { emit('depleted', { color: sh.color }); continue; }
        }
        sh.pos++;
        if (sh.pos >= L) {                         // lap complete -> must park
          var slot = s.parked.indexOf(null);
          if (slot < 0) { lose('parking_full'); return; }
          s.parked[slot] = { color: sh.color, count: sh.count };
          var used = s.parked.filter(Boolean).length;
          s.maxParkingUsed = Math.max(s.maxParkingUsed, used);
          emit('park', { slot: slot, color: sh.color, count: sh.count, used: used });
          continue;
        }
        keep.push(sh);
      }
      s.belt = keep;
      if (s.pixelsLeft <= 0) { s.status = 'won'; emit('win'); return; }
      if (!s.belt.length && isStuck()) lose('stuck');
    }

    /** Stuck: nothing on belt or lanes, and no parked shooter's color is visible from the belt. */
    function isStuck() {
      if (s.lanes.some(function (q) { return q.length; })) return false;
      var ex = exposure();
      return !s.parked.some(function (p) { return p && ex[p.color]; });
    }

    function lose(reason) { s.status = 'lost'; s.loseReason = reason; emit('lose', { reason: reason }); }

    return {
      level: level, perimeter: perimeter,
      state: function () { return s; },             // live state (do not mutate)
      snapshot: function () { return clone(s); },
      fork: function () { return createGame(level, { quiet: true }, s); },
      actions: actions, tap: tap, tick: tick, exposure: exposure, rayHit: rayHit,
      get status() { return s.status; },
      get events() { return events; }
    };
  }

  return { createGame: createGame, buildPerimeter: buildPerimeter, countPixels: countPixels, checkLevel: checkLevel,
    BELT_MAX: BELT_MAX, PARK_SLOTS: PARK_SLOTS, LANES: LANES };
});
