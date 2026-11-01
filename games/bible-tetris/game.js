(function () {
  'use strict';
  var E = TetrisEngine, L = TetrisLevels, $ = function (id) { return document.getElementById(id); };
  var COLORS = ['#000', '#0dd', '#ee0', '#a0e', '#0c0', '#e22', '#26f', '#f90'];
  var cv = $('board'), cx = cv.getContext('2d'), nv = $('next'), nx = nv.getContext('2d');
  var levels = L.defaults, tuningSource = 'defaults', game = null, log = null, lvl = 1, paused = true, last = 0, levelT = 0, cell = 20, bible = null, verses = [], verseById = {}, versePool = [], verseEvents = [], conjunctions = [], spawnedI = [], placedSince = [];
  var LS_KEY = 'tetris.logs.v1';
  function device() { return { ua: navigator.userAgent, screen: screen.width + 'x' + screen.height, dpr: devicePixelRatio, touch: 'ontouchstart' in window, lang: navigator.language, viewport: innerWidth + 'x' + innerHeight }; }
  function resize() { var r = cv.getBoundingClientRect(); var h = Math.floor(r.height); cell = Math.max(8, Math.floor(Math.min(h / 20, r.width / 10))); cv.width = cell * 10; cv.height = cell * 20; draw(); }
  function newLog() { log = GameLog.createLog({ gameId: L.GAME_ID, gameVersion: L.GAME_VERSION, iteration: L.ITERATION, runType: 'human', device: device(), player: { kind: 'human', handle: 'markus' }, tuningSource: tuningSource }); }
  function startLevel(n) {
    lvl = n; var P = levels[n - 1]; verseEvents = []; conjunctions = []; spawnedI = []; placedSince = []; game = E.createGame({ seed: Date.now(), level: n, params: P, versePicker: function () { return versePool[Math.floor(Math.random() * versePool.length)].id; }, onSpawn: function (i) { if (i.verse) { spawnedI.push(i.verse); var v = verseById[i.verse]; verseEvents.push({ ref: v.ref, id: v.id, piece_index: i.pieceNo, t: Date.now(), event: 'spawned' }); } }, onLock: function (i) { log.event('lock', i); if (i.verse) { var v = verseById[i.verse]; verseEvents.push({ ref: v.ref, id: v.id, piece_index: i.pieceNo, t: Date.now(), event: 'placed' }); placedSince.push(v.id); } if (i.linesCleared) { log.event('lines', { n: i.linesCleared }); var ids = Array.from(new Set(i.clearedVerseIds || [])); if (i.linesCleared === 4 && !ids.length) ids = Array.from(new Set(placedSince)); if (i.linesCleared === 4) placedSince = []; ids.forEach(function (id) { var v = verseById[id]; if (v) verseEvents.push({ ref: v.ref, id: id, piece_index: i.pieceNo, t: Date.now(), event: i.linesCleared === 4 ? 'cleared-in-tetris' : 'cleared' }); }); if (i.linesCleared >= 2 && ids.length >= 2) conjunctions.push({ refs: ids.map(function (id) { return verseById[id].ref; }), ids: ids, lines: i.linesCleared, time: Date.now(), flag_for_analysis: true }); } } });
    log.startLevel(n, P); levelT = 0; $('lv').textContent = n; $('goal').textContent = P.linesToClear; paused = false; hide(); last = performance.now();
  }
  function act(name, fn) { if (paused || !game) return; var before = game.getState().pieces; fn(); if (name === 'hard') log.event('hard_drop'); check(); draw(); }
  function check() {
    var s = game.getState(), st = game.stats(), P = levels[lvl - 1];
    if (!s.levelComplete && !s.over) return;
    paused = true; var done = s.levelComplete;
    log.endLevel(done ? 'complete' : 'fail', { score: s.score, actions: s.pieces, misplays: st.misplays, progress: Math.min(1, s.lines / P.linesToClear) }, { lines: s.lines, pieces: s.pieces, maxHeight: st.maxHeightSeen, holesEnd: st.holes, avgHoles: st.avgHoles, bumpinessEnd: st.bumpiness, gravityMs: P.gravityMs, lockDelayMs: P.lockDelayMs });
    var data = save();
    var t = Math.round(log.data.levels[log.data.levels.length - 1].durationMs / 1000);
    show((done ? '<h2>Level ' + lvl + ' complete!</h2>' : '<h2>Game over on level ' + lvl + '</h2>') +
      '<p>' + s.lines + ' lines · ' + s.pieces + ' pieces · ' + s.score + ' pts · ' + Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2) + '</p>' + verseOverlay() +
      '<p style="font-size:12px;color:#aaa">Log saved in this browser. Download it and drop the file into <code>logs/human/</code> in the repo so the next iteration is tuned to you.</p>' +
      (data.qualities ? Qualities.html(data.qualities, 7) : '') + '<button id="dl">⬇ Download log</button>' + (done && lvl < 10 ? '<button id="nx">Next level ▶</button>' : '') + '<button id="rs">Restart run</button>' + (done && lvl === 10 ? '<p>🏆 All 10 levels done!</p>' : ''));
    $('dl').onclick = function () { download(data); };
    if ($('nx')) $('nx').onclick = function () { startLevel(lvl + 1); };
    $('rs').onclick = function () { newLog(); startLevel(1); };
  }
  function save() {
    var d = log.toJSON(); d.run.endedAt = new Date().toISOString();
    d.verse_events = verseEvents; d.conjunctions = conjunctions;
    var done = d.levels.filter(function (l) { return l.outcome === 'complete'; });
    d.summary = { levelsCompleted: done.length, highestLevel: done.length ? done[done.length - 1].level : 0, totalDurationMs: d.levels.reduce(function (a, l) { return a + (l.durationMs || 0); }, 0) };
    try { d.qualities = Qualities.compute(d); } catch (e) { }
    try { var all = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); all[d.run.id] = d; localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) { }
    return d;
  }
  function verseText(v) { var b = bible.books.filter(function (b) { return b.id === v.osis; })[0]; var c = b && b.chapters[String(v.chapter)]; return Array.from({ length: v.verse_end - v.verse_start + 1 }, function (_, i) { return c[String(v.verse_start + i)]; }).join(' '); }
  function verseOverlay() { var ids = Array.from(new Set(verseEvents.map(function (e) { return e.id; }))); if (!ids.length) return ''; return '<div style="text-align:left;max-height:150px;overflow:auto;font-size:11px"><b>Tetris verses</b>' + ids.map(function (id) { var v = verseById[id]; return '<p><b>' + v.ref + '</b> ' + verseText(v) + '</p>'; }).join('') + '</div>'; }
  function download(d) { var b = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'human-tetris-it' + d.game.iteration + '-' + d.run.id + '.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function show(h) { $('ovbox').innerHTML = h; $('ov').classList.remove('hide'); }
  function hide() { $('ov').classList.add('hide'); }
  function sq(c, x, y, s, col) { c.fillStyle = col; c.fillRect(x * s + 1, y * s + 1, s - 2, s - 2); }
  function draw() {
    if (!game) return; var s = game.getState(); cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
    cx.strokeStyle = '#151515'; for (var i = 1; i < 10; i++) { cx.beginPath(); cx.moveTo(i * cell, 0); cx.lineTo(i * cell, cv.height); cx.stroke(); }
    s.board.forEach(function (r, y) { r.forEach(function (v, x) { if (v) { sq(cx, x, y, cell, COLORS[v]); if (s.boardVerses[y][x]) { cx.fillStyle = '#fff'; cx.font = Math.max(6, cell * .35) + 'px sans-serif'; cx.fillText((verseById[s.boardVerses[y][x]] || {}).ref || '', x * cell + 1, y * cell + cell - 2); } } }); });
    if (s.current) { game.ghost().forEach(function (c) { if (c[1] >= 0) sq(cx, c[0], c[1], cell, '#333'); }); s.current.cells.forEach(function (c) { if (c[1] >= 0) { sq(cx, c[0], c[1], cell, COLORS[s.current.type]); if (s.current.verse) { cx.fillStyle = '#fff'; cx.font = Math.max(6, cell * .35) + 'px sans-serif'; cx.fillText(verseById[s.current.verse].ref, c[0] * cell + 1, c[1] * cell + cell - 2); } } }); }
    nx.fillStyle = '#000'; nx.fillRect(0, 0, 70, 70); E.PIECES[s.next][0].forEach(function (c) { sq(nx, c[0] + 0.5, c[1] + 1, 15, COLORS[s.next]); });
    $('ln').textContent = s.lines; $('sc').textContent = s.score; var t = Math.floor(levelT / 1000); $('tm').textContent = Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2);
  }
  function loop(t) { var dt = Math.min(100, t - last); last = t; if (!paused && game) { levelT += dt; game.tick(dt); check(); draw(); } requestAnimationFrame(loop); }
  // controls
  function hold(btn, fn) { var iv, to; function go(e) { e.preventDefault(); fn(); to = setTimeout(function () { iv = setInterval(fn, 60); }, 180); } function stop() { clearTimeout(to); clearInterval(iv); } btn.addEventListener('pointerdown', go); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, stop); }); }
  hold($('bl'), function () { act('left', function () { game.moveLeft(); }); }); hold($('br'), function () { act('right', function () { game.moveRight(); }); }); hold($('bd'), function () { act('soft', function () { game.softDrop(); }); });
  $('bh').addEventListener('pointerdown', function (e) { e.preventDefault(); act('hard', function () { game.hardDrop(); }); });
  $('brot').addEventListener('pointerdown', function (e) { e.preventDefault(); act('rot', function () { game.rotate(); }); });
  $('pause').onclick = function () { if (!game || game.getState().over || game.getState().levelComplete) return; paused = !paused; if (paused) show('<h2>Paused</h2><button id="rz">Resume</button>'), $('rz').onclick = function () { paused = false; hide(); }; };
  var ts = null; cv.addEventListener('touchstart', function (e) { var t = e.touches[0]; ts = { x: t.clientX, y: t.clientY, t: Date.now(), moved: 0 }; e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', function (e) { if (!ts) return; var t = e.touches[0], dx = t.clientX - ts.x; var step = cell; while (Math.abs(dx) >= step) { var d = dx > 0 ? 1 : -1; act('swipe', function () { d > 0 ? game.moveRight() : game.moveLeft(); }); ts.x += d * step; dx -= d * step; ts.moved = 1; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', function (e) { if (!ts) return; var t = e.changedTouches[0], dy = t.clientY - ts.y, dt = Date.now() - ts.t; if (dy > 60 && dt < 400) act('hard', function () { game.hardDrop(); }); else if (!ts.moved && Math.abs(dy) < 15) act('rot', function () { game.rotate(); }); ts = null; e.preventDefault(); }, { passive: false });
  cv.addEventListener('mousedown', function () { act('rot', function () { game.rotate(); }); });
  addEventListener('keydown', function (e) { var k = e.key; var m = { ArrowLeft: function () { game.moveLeft(); }, ArrowRight: function () { game.moveRight(); }, ArrowDown: function () { game.softDrop(); }, ArrowUp: function () { game.rotate(); }, x: function () { game.rotate(); }, z: function () { game.rotate(-1); }, ' ': function () { game.hardDrop(); } }; if (m[k]) { e.preventDefault(); act(k === ' ' ? 'hard' : 'key', m[k]); } else if (k === 'p' || k === 'Escape') $('pause').click(); });
  addEventListener('resize', resize);
  Promise.all([fetch('../bible/data/bible-kjv.json').then(function (r) { return r.json(); }), fetch('../bible/data/algorithmic-verses.json').then(function (r) { return r.json(); }), fetch('tuning.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })]).then(function (data) { bible = data[0]; verses = data[1]; verseById = Object.fromEntries(verses.map(function (v) { return [v.id, v]; })); versePool = verses; var t = data[2];
    if (t) { levels = L.merge(t); tuningSource = 'tuning.json@' + (t.generatedAt || '?'); }
    newLog(); game = E.createGame({ seed: 1, level: 1, params: levels[0] }); resize(); requestAnimationFrame(loop);
    var stored = 0; try { stored = Object.keys(JSON.parse(localStorage.getItem(LS_KEY) || '{}')).length; } catch (e) { }
    show('<h2>Tetris · iteration 1</h2><p>10 levels. Clear the line goal to finish each level. Level 1 is a short calibration round (~1–5 min).</p><p style="font-size:12px;color:#aaa">Phone: tap board = rotate, swipe ←→ = move, swipe ↓ = drop, or use buttons. Desktop: arrows, ↑/X rotate, Space drop, P pause.</p><button id="go">▶ Start</button>' + (stored ? '<button id="dla">⬇ ' + stored + ' saved log(s)</button>' : ''));
    $('go').onclick = function () { startLevel(1); };
    if ($('dla')) $('dla').onclick = function () { var all = JSON.parse(localStorage.getItem(LS_KEY)); Object.keys(all).forEach(function (k, i) { setTimeout(function () { download(all[k]); }, i * 300); }); };
  });
})();
