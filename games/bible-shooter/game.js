/* Bible Shooter UI: canvas field + belt, parking slots, 5 lanes. Uses ShooterEngine, ShooterGen, GameLog. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TICK_MS = 110, LS_KEY = 'bible-shooter.logs.v1', GAME_ID = 'bible-shooter', VERSION = '0.1.0';
  var params = new URLSearchParams(location.search);

  var levels = [], levelIndex = 0, level = null, game = null, log = null;
  var categories = null, running = false, lastT = 0, acc = 0, levelMs = 0, shotsFlash = [];

  // ---------- logging ----------
  function newLog() {
    log = GameLog.createLog({ gameId: GAME_ID, gameVersion: VERSION, iteration: 1, runType: 'human',
      device: { ua: navigator.userAgent, viewport: innerWidth + 'x' + innerHeight, touch: 'ontouchstart' in window },
      player: { kind: 'human', handle: 'markus' }, tuningSource: 'starter-levels.json' });
  }
  function saveLog() {
    var d = log.toJSON(); d.run.endedAt = new Date().toISOString();
    try { var all = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); all[d.run.id] = d; localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) { }
    return d;
  }
  function download(d) {
    var b = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = 'human-bible-shooter-' + d.run.id + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- level flow ----------
  function startLevel(i, customLevel) {
    levelIndex = i; level = customLevel || levels[i];
    game = ShooterEngine.createGame(level, {});
    levelMs = 0; acc = 0; running = true; lastT = performance.now(); shotsFlash = [];
    log.startLevel(i + 1, { id: level.id, name: level.name, motif: level.meta.motif, difficulty: level.meta.difficulty, size: level.w, ratios: level.meta.actualRatios });
    $('lv').textContent = customLevel ? 'seed' : (i + 1);
    hide(); renderSide(); draw();
  }
  function endLevel() {
    running = false;
    var s = game.state(), won = game.status === 'won';
    // copy engine events (taps, parks, depletions; shots summarised) into the level log
    var counts = {};
    game.events.forEach(function (e) {
      counts[e.type] = (counts[e.type] || 0) + 1;
      if (e.type !== 'shot') log.event(e.type, e);
    });
    log.endLevel(won ? 'complete' : 'fail', { durationMs: levelMs, actions: s.taps, progress: 1 - s.pixelsLeft / totalPixels(level) },
      { outcome: won ? 'win' : 'lose', loseReason: s.loseReason, ticks: s.tick, taps: s.taps, maxParkingUsed: s.maxParkingUsed,
        shotsByColor: s.shots, eventCounts: counts, pixelsLeft: s.pixelsLeft, parkingEnd: s.parked });
    var d = saveLog(), t = Math.round(levelMs / 1000);
    show('<h2>' + (won ? 'Cleared! ✨' : 'Lost — ' + (s.loseReason === 'parking_full' ? 'parking full' : 'stuck')) + '</h2>' +
      '<p>' + level.name + ' · ' + s.taps + ' taps · ' + Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2) + ' · max parking ' + s.maxParkingUsed + '/5</p>' +
      (won && levelIndex < levels.length - 1 && level === levels[levelIndex] ? '<button id="nx">Next level ▶</button>' : '') +
      '<button id="rt">↻ Retry</button><button id="dl">⬇ Download log</button><button id="ls">Levels</button>');
    if ($('nx')) $('nx').onclick = function () { startLevel(levelIndex + 1); };
    $('rt').onclick = function () { startLevel(levelIndex, level === levels[levelIndex] ? null : level); };
    $('dl').onclick = function () { download(d); };
    $('ls').onclick = menu;
  }
  function totalPixels(l) { return l.pixels.reduce(function (n, r) { return n + r.filter(Boolean).length; }, 0); }

  // ---------- input ----------
  function tapAction(a) {
    if (!running || !game.tap(a)) return;
    renderSide(); draw();
  }

  // ---------- rendering ----------
  function color(k) { return (level.palette && level.palette[k]) || '#888'; }
  function shooterDiv(sh, cls) {
    var d = document.createElement('div'); d.className = 'sh ' + cls; d.style.background = color(sh.color); d.textContent = sh.count; return d;
  }
  function renderSide() {
    var s = game.state(), canEnter = game.actions().length > 0, park = $('park'), lanes = $('lanes');
    park.innerHTML = '';
    s.parked.forEach(function (p, i) {
      var slot = document.createElement('div'); slot.className = 'slot';
      if (p) {
        var d = shooterDiv(p, 'top' + (canEnter ? '' : ' disabled')); d.style.height = '42px';
        d.addEventListener('pointerdown', function (e) { e.preventDefault(); tapAction({ type: 'park', slot: i }); });
        slot.appendChild(d);
      }
      park.appendChild(slot);
    });
    lanes.innerHTML = '';
    s.lanes.forEach(function (q, i) {
      var lane = document.createElement('div'); lane.className = 'lane';
      q.slice(0, 4).forEach(function (sh, j) {
        var d = shooterDiv(sh, j === 0 ? 'top' + (canEnter ? '' : ' disabled') : 'next');
        if (j === 0) d.addEventListener('pointerdown', function (e) { e.preventDefault(); tapAction({ type: 'lane', lane: i }); });
        lane.appendChild(d);
      });
      if (q.length > 4) { var m = document.createElement('div'); m.className = 'muted'; m.textContent = '+' + (q.length - 4); lane.appendChild(m); }
      lanes.appendChild(lane);
    });
    $('px').textContent = s.pixelsLeft;
  }
  function draw() {
    var cv = $('board'), size = Math.floor(cv.getBoundingClientRect().width * devicePixelRatio);
    if (cv.width !== size) { cv.width = size; cv.height = size; }
    var c = cv.getContext('2d'), s = game.state(), n = level.w + 2, cell = size / n;
    c.fillStyle = '#050505'; c.fillRect(0, 0, size, size);
    // belt track
    c.fillStyle = '#1d1d1d'; c.fillRect(0, 0, size, cell); c.fillRect(0, size - cell, size, cell); c.fillRect(0, 0, cell, size); c.fillRect(size - cell, 0, cell, size);
    c.fillStyle = '#333'; c.font = Math.floor(cell * 0.8) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('▲', size - cell / 2, size - cell * 1.5);
    // pixels (dark outline keeps white visible)
    for (var y = 0; y < level.h; y++) for (var x = 0; x < level.w; x++) {
      var k = s.pixels[y][x]; if (!k) continue;
      c.fillStyle = '#000'; c.fillRect((x + 1) * cell, (y + 1) * cell, cell, cell);
      c.fillStyle = color(k); c.fillRect((x + 1) * cell + 1, (y + 1) * cell + 1, cell - 2, cell - 2);
    }
    // shot flashes
    var now = performance.now();
    shotsFlash = shotsFlash.filter(function (f) { return now - f.t < 160; });
    shotsFlash.forEach(function (f) { c.strokeStyle = color(f.color); c.lineWidth = Math.max(1, cell / 6); c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke(); });
    // shooters on belt
    s.belt.forEach(function (b) {
      var p = game.perimeter[b.pos], px = (p.x + 1) * cell, py = (p.y + 1) * cell;
      c.fillStyle = color(b.color); c.strokeStyle = '#000'; c.lineWidth = 2;
      c.beginPath(); c.roundRect ? c.roundRect(px, py, cell, cell, cell / 4) : c.rect(px, py, cell, cell); c.fill(); c.stroke();
      c.fillStyle = '#111'; c.font = 'bold ' + Math.floor(cell * 0.55) + 'px sans-serif'; c.fillText(b.count, px + cell / 2, py + cell / 2 + 1);
    });
  }

  // ---------- main loop ----------
  function loop(t) {
    var dt = Math.min(200, t - lastT); lastT = t;
    if (running) {
      levelMs += dt; acc += dt;
      var before = game.events.length;
      while (acc >= TICK_MS && running) {
        acc -= TICK_MS; game.tick();
        if (game.status !== 'playing') { draw(); renderSide(); endLevel(); break; }
      }
      // flashes for new shots
      var cell = $('board').width / (level.w + 2);
      game.events.slice(before).forEach(function (e) {
        if (e.type !== 'shot') return;
        shotsFlash.push({ t: performance.now(), color: e.color, x1: (e.x + 1.5) * cell, y1: (e.y + 1.5) * cell, x2: (e.x + 1.5) * cell, y2: (e.y + 1.5) * cell });
      });
      if (game.events.length !== before) renderSide();
      var sec = Math.floor(levelMs / 1000); $('tm').textContent = Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2);
      if (running) draw();
    }
    requestAnimationFrame(loop);
  }

  // ---------- overlay / menu ----------
  function show(h) { $('ovbox').innerHTML = h; $('ov').classList.remove('hide'); }
  function hide() { $('ov').classList.add('hide'); }
  function menu() {
    running = false;
    var stored = 0; try { stored = Object.keys(JSON.parse(localStorage.getItem(LS_KEY) || '{}')).length; } catch (e) { }
    show('<h2>Bible Shooter</h2><p class="muted">Tap a lane\'s top shooter to put it on the belt. It travels up the right, along the top, down the left and back. ' +
      'It shoots the first pixel in its line of sight if the color matches. After a lap, leftovers park (5 slots). Fill all 5 and you lose. Clear every pixel to win.</p>' +
      levels.map(function (l, i) { return '<button data-i="' + i + '">' + (i + 1) + '. ' + l.name + '</button>'; }).join('') +
      (params.get('seed') ? '<hr><p class="muted">Experimental: build a level from a Bible Tetris log</p><input type="file" id="seedfile" accept=".json"><button id="seedsample">Use sample seed</button>' : '') +
      (stored ? '<p><button id="dla">⬇ ' + stored + ' saved log(s)</button></p>' : '') +
      '<p class="muted"><a href="?seed=1">seed mode</a> · <a href="../">all games</a></p>');
    Array.prototype.forEach.call(document.querySelectorAll('#ovbox [data-i]'), function (b) { b.onclick = function () { startLevel(+b.dataset.i); }; });
    if ($('dla')) $('dla').onclick = function () { download({ schema: 'gameplay-log-bundle', logs: JSON.parse(localStorage.getItem(LS_KEY) || '{}') }); };
    if ($('seedsample')) $('seedsample').onclick = function () { fetch('../bible-tycoon/sample-seed.json').then(function (r) { return r.json(); }).then(levelFromSeed); };
    if ($('seedfile')) $('seedfile').onchange = function (e) { var f = e.target.files[0]; if (f) f.text().then(function (t) { levelFromSeed(JSON.parse(t)); }); };
  }

  /** Tetris log -> ratios (seed.colors.counts) -> generated, bot-validated level. Uses seed-mappings.json pixel_shooter section. */
  function levelFromSeed(logJson) {
    fetch('../bible/data/seed-mappings.json').then(function (r) { return r.json(); }).then(function (map) {
      var cfg = map.pixel_shooter || {}, src = ShooterGen.ratiosFromSeed(logJson, cfg.max_colors || 5);
      var n = (logJson.seed && logJson.seed.colors && logJson.seed.colors.sequence || []).length;
      var difficulty = Math.max(1, Math.min(5, Math.round((cfg.difficulty_base || 2) + n / (cfg.difficulty_per_items || 15))));
      var r = ShooterGen.generateValidated({ ratios: src.ratios, palette: ShooterGen.paletteFrom(categories, src.scheme), scheme: src.scheme,
        seed: (logJson.run && logJson.run.id || 'x').length * 31 + n, difficulty: difficulty, size: cfg.size || 18, name: 'From Tetris seed' }, 6);
      r.level.meta.seedSource = logJson.run && logJson.run.id; r.level.meta.seedRatios = src.ratios;
      startLevel(0, r.level);
      log.event('seed_level', { source: r.level.meta.seedSource, ratios: src.ratios, difficulty: difficulty, tries: r.tries, rejected: !!r.rejected });
    });
  }

  $('menu').onclick = menu;
  addEventListener('resize', function () { if (game) draw(); });
  Promise.all([fetch('starter-levels.json').then(function (r) { return r.json(); }), fetch('../bible/data/categories.json').then(function (r) { return r.json(); })])
    .then(function (d) {
      levels = d[0]; categories = d[1];
      var pal = ShooterGen.paletteFrom(categories, params.get('scheme') || 'trinity3');
      levels.forEach(function (l) { Object.keys(pal).forEach(function (k) { if (l.palette[k] === undefined || params.get('scheme')) l.palette[k] = pal[k]; }); });
      newLog(); level = levels[0]; game = ShooterEngine.createGame(level, {}); renderSide(); draw(); menu();
      requestAnimationFrame(loop);
      window.__shooter = { get game() { return game; }, startLevel: startLevel, levelFromSeed: levelFromSeed, get log() { return log; } };
    });
})();
