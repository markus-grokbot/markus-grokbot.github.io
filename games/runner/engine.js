/* Lynx Dash engine (UMD, no DOM). Pure fixed-step runner logic shared by the page, the in-page sim and sim/run-sim.js.
   Units: px (logical 600x200 world, ground at y=170) and ms. Forgiving by design: shrunk hitboxes, coyote time,
   jump buffering, variable jump height, 3 lives; losing all lives resets run distance but never ends the round. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.RunnerEngine = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var GAME_ID = 'runner', GAME_VERSION = '0.1.0', ITERATION = 1, W = 600, GROUND = 170;
  var DEFAULTS = { questions: 6, segmentMs: 30000, countdownMs: 3000, lives: 3, baseSpeed: 0.30, maxSpeed: 0.62, accelPerSec: 0.0045,
    speedKeepAfterQuestion: 0.8, gravity: 0.0026, jumpVel: 0.70, jumpCut: 0.45, fastFall: 0.006, coyoteMs: 100, bufferMs: 130,
    minGapMs: 650, gapRandMs: 900, birdFromSpeed: 0.36, birdChance: 0.28, coinChance: 0.5, hitboxShrink: 4, invulnMs: 1500,
    nearMissPx: 14, cleanBonus: 100, coinPoints: 10, nearMissPoints: 5 };
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function merge(t) { return Object.assign({}, DEFAULTS, (t && t.params) || {}); }
  function create(o) {
    o = o || {}; var P = Object.assign({}, DEFAULTS, o.params || {}), rng = o.rng || mulberry(o.seed || 1), on = o.onEvent || function () { };
    var s = { t: 0, speedT: 0, speed: P.baseSpeed, dist: 0, runDist: 0, bestRunDist: 0, score: 0, coins: 0, lives: P.lives, knockouts: 0,
      y: GROUND, vy: 0, onGround: true, ducking: false, lastGround: 0, bufferUntil: -1, invulnUntil: -1, obstacles: [], items: [], nextSpawn: 0, frame: 0 };
    var seg = null;
    function newSeg() { seg = { activeMs: 0, jumps: 0, ducks: 0, crashes: 0, nearMisses: 0, coins: 0, distance: 0, maxSpeed: 0, speedSum: 0, steps: 0, knockouts: 0, airMs: 0 }; }
    newSeg();
    var px = 60, pw = 22;
    function ph() { return s.ducking && s.onGround ? 14 : 24; }
    function spawn() {
      var bird = s.speed >= P.birdFromSpeed && rng() < P.birdChance, ob;
      if (bird) { var lvl = rng() < 0.5 ? 'low' : rng() < 0.6 ? 'mid' : 'high', bottom = { low: GROUND - 2, mid: GROUND - 17, high: GROUND - 42 }[lvl]; ob = { kind: 'bird', lvl: lvl, x: W + 10, w: 26, h: 14, y: bottom - 14 }; }
      else { var k = rng(), w = k < 0.45 ? 12 : k < 0.8 ? 18 : 30, h = k < 0.45 ? 22 : k < 0.8 ? 32 : 24; ob = { kind: 'cactus', lvl: w === 30 ? 'double' : h > 30 ? 'tall' : 'small', x: W + 10, w: w, h: h, y: GROUND - h }; }
      s.obstacles.push(ob);
      if (rng() < P.coinChance) s.items.push({ x: ob.x + ob.w / 2 - 5, y: ob.y - 34 - rng() * 14, w: 10, h: 10 });
      var gap = P.minGapMs + rng() * P.gapRandMs; s.nextSpawn = s.t + gap * Math.max(0.75, 1 - (s.speed - P.baseSpeed));
    }
    function hit(a, b, k) { return a.x + k < b.x + b.w - k && a.x + a.w - k > b.x + k && a.y + k < b.y + b.h - k && a.y + a.h - k > b.y + k; }
    // input: {jump: bool (held), duck: bool (held)}; edge detection is done here
    var prevJump = false;
    function step(dt, input) {
      input = input || {}; s.t += dt; s.speedT += dt; s.frame++;
      s.speed = Math.min(P.maxSpeed, P.baseSpeed + P.accelPerSec * s.speedT / 1000);
      var pressed = input.jump && !prevJump; prevJump = !!input.jump;
      if (pressed) s.bufferUntil = s.t + P.bufferMs;
      var wasDuck = s.ducking; s.ducking = !!input.duck; if (s.ducking && !wasDuck) { seg.ducks++; on('duck', { air: !s.onGround }); }
      if (s.onGround) s.lastGround = s.t;
      if (s.bufferUntil >= s.t && (s.onGround || s.t - s.lastGround <= P.coyoteMs) && s.vy >= 0) {
        s.vy = -P.jumpVel; s.onGround = false; s.bufferUntil = -1; s.lastGround = -1e9; seg.jumps++; on('jump', { coyote: s.y >= GROUND ? false : true });
      }
      if (!s.onGround) {
        if (!input.jump && s.vy < -P.jumpVel * P.jumpCut) s.vy = -P.jumpVel * P.jumpCut; // variable jump height
        s.vy += (s.ducking ? P.fastFall : P.gravity) * dt; s.y += s.vy * dt; seg.airMs += dt;
        if (s.y >= GROUND) { s.y = GROUND; s.vy = 0; s.onGround = true; }
      }
      var dx = s.speed * dt; s.dist += dx; s.runDist += dx; seg.distance += dx; s.bestRunDist = Math.max(s.bestRunDist, s.runDist);
      seg.activeMs += dt; seg.maxSpeed = Math.max(seg.maxSpeed, s.speed); seg.speedSum += s.speed; seg.steps++;
      if (s.t >= s.nextSpawn) spawn();
      var me = { x: px, y: s.y - ph(), w: pw, h: ph() };
      s.obstacles.forEach(function (ob) {
        ob.x -= dx * (ob.kind === 'bird' ? 1.08 : 1);
        if (!ob.passed && ob.x + ob.w < px) { ob.passed = true; if (!ob.hitMe && !ob.ghost && ob.minClear != null && ob.minClear < P.nearMissPx) { seg.nearMisses++; s.score += P.nearMissPoints; on('near_miss', { kind: ob.kind, lvl: ob.lvl, clearPx: +ob.minClear.toFixed(1) }); } }
        if (ob.x < px + pw && ob.x + ob.w > px && !ob.hitMe) { // overlapping horizontally: track vertical clearance (gap between boxes)
          if (s.t < s.invulnUntil) ob.ghost = true;
          var cl = ob.y >= me.y + me.h ? ob.y - (me.y + me.h) : me.y >= ob.y + ob.h ? me.y - (ob.y + ob.h) : 0; ob.minClear = ob.minClear == null ? cl : Math.min(ob.minClear, cl);
        }
        if (!ob.hitMe && s.t >= s.invulnUntil && hit(me, ob, P.hitboxShrink)) { ob.hitMe = true; crash(ob); }
      });
      s.obstacles = s.obstacles.filter(function (ob) { return ob.x + ob.w > -20; });
      s.items.forEach(function (it) { it.x -= dx; if (!it.got && hit(me, it, -2)) { it.got = true; s.coins++; seg.coins++; s.score += P.coinPoints; on('coin', {}); } });
      s.items = s.items.filter(function (it) { return !it.got && it.x > -20; });
      s.score += dx / 10;
    }
    function crash(ob) {
      s.lives--; seg.crashes++; s.invulnUntil = s.t + P.invulnMs;
      on('crash', { kind: ob.kind, lvl: ob.lvl, speed: +s.speed.toFixed(3), livesLeft: s.lives, runDist: Math.round(s.runDist) });
      if (s.lives <= 0) { s.knockouts++; seg.knockouts++; on('knockout', { runDist: Math.round(s.runDist) }); s.runDist = 0; s.lives = P.lives; s.speedT = 0; }
    }
    return {
      P: P, state: function () { return s; }, step: step, player: function () { return { x: px, y: s.y - ph(), w: pw, h: ph(), duck: s.ducking && s.onGround, air: !s.onGround }; },
      // close the current active segment; returns its stats and starts a fresh one
      endSegment: function () { var g = seg, out = { activeMs: Math.round(g.activeMs), jumps: g.jumps, ducks: g.ducks, crashes: g.crashes, knockouts: g.knockouts, nearMisses: g.nearMisses, coins: g.coins,
          distance: Math.round(g.distance), maxSpeed: +g.maxSpeed.toFixed(3), avgSpeed: g.steps ? +(g.speedSum / g.steps).toFixed(3) : 0, airMs: Math.round(g.airMs), clean: g.crashes === 0 }; newSeg(); return out; },
      afterQuestion: function () { s.speedT *= P.speedKeepAfterQuestion; s.obstacles = []; s.items = []; s.nextSpawn = s.t + 900; prevJump = false; },
      addBonus: function (n) { s.score += n; }
    };
  }
  return { GAME_ID: GAME_ID, GAME_VERSION: GAME_VERSION, ITERATION: ITERATION, W: W, GROUND: GROUND, DEFAULTS: DEFAULTS, merge: merge, create: create, rng: mulberry };
});
