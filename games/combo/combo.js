/* Combo UI: Tetris drop-target round, then Pairwise Pit round, then summary. ?set=test-001 picks games/pairwise/sets/<id>.json */
(function () {
  'use strict';
  var E = TetrisEngine, $ = function (id) { return document.getElementById(id); }, LS_KEY = 'combo.logs.v1';
  var COLORS = ['#000', '#0dd', '#ee0', '#a0e', '#0c0', '#e22', '#26f', '#f90'];
  var cv = $('board'), cx = cv.getContext('2d'), nx = $('next').getContext('2d'), cell = 20;
  var set, tuning, dt, P, S, game, paused = true, last = 0, segT = 0, phase = 'intro', tetrisLevel, pwLevel;
  $('pwcss').textContent = PairwisePit.CSS;
  function device() { return { ua: navigator.userAgent, screen: screen.width + 'x' + screen.height, dpr: devicePixelRatio, touch: 'ontouchstart' in window, lang: navigator.language, viewport: innerWidth + 'x' + innerHeight }; }
  function show(h) { $('ovbox').innerHTML = h; $('ov').classList.remove('hide'); }
  function hide() { $('ov').classList.add('hide'); }
  function fmt(ms) { var t = Math.round(ms / 1000); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
  function resize() { if (phase !== 'tetris') return; var r = cv.getBoundingClientRect(); cell = Math.max(8, Math.floor(Math.min(r.height / 20, r.width / 10))); cv.width = cell * 10; cv.height = cell * 20; draw(); }
  function sq(c, x, y, s, col) { c.fillStyle = col; c.fillRect(x * s + 1, y * s + 1, s - 2, s - 2); }
  function draw() {
    if (!game) return; var s = game.getState(); cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
    s.board.forEach(function (r, y) { r.forEach(function (v, x) { if (v) sq(cx, x, y, cell, COLORS[v]); }); });
    if (s.current) { game.ghost().forEach(function (c) { if (c[1] >= 0) sq(cx, c[0], c[1], cell, '#333'); }); s.current.cells.forEach(function (c) { if (c[1] >= 0) sq(cx, c[0], c[1], cell, COLORS[s.current.type]); }); }
    nx.fillStyle = '#000'; nx.fillRect(0, 0, 70, 70); E.PIECES[s.next][0].forEach(function (c) { sq(nx, c[0] + 0.5, c[1] + 1, 15, COLORS[s.next]); });
    $('dr').textContent = s.pieces; $('ln').textContent = s.lines; $('sc').textContent = s.score; $('tm').textContent = fmt(segT);
  }
  function startTetris() {
    S = ComboSession.create({ runType: 'human', device: device(), player: { kind: 'human', handle: 'markus' }, tuningSource: tuning ? 'tuning.json@' + (tuning.generatedAt || '?') : 'defaults' });
    S.startTetris(P, dt, set); game = E.createGame({ seed: Date.now(), level: 1, params: P, onLock: S.lockEvent });
    phase = 'tetris'; $('tet').classList.remove('hide'); $('goal').textContent = P.dropsTarget; $('why').textContent = dt.totalWords + ' words to read next → ' + P.dropsTarget + ' drops';
    segT = 0; paused = false; hide(); resize(); last = performance.now();
  }
  function check() {
    var s = game.getState(); if (!s.levelComplete && !s.over) return;
    paused = true; tetrisLevel = S.endTetris(game, P, dt); phase = 'between';
    show('<h2>' + (s.levelComplete ? 'Drops done!' : 'Board topped out') + '</h2><p>' + s.pieces + '/' + P.dropsTarget + ' drops · ' + s.lines + ' lines · ' + s.score + ' pts · ' + fmt(tetrisLevel.durationMs) + '</p><p>Now read and judge <span class="k">' + set.pairs.length + ' pairs</span> (' + dt.totalWords + ' words).</p><button id="go2">▶ Pairwise Pit</button>');
    $('go2').onclick = startPairwise;
  }
  function startPairwise() {
    hide(); phase = 'pairwise'; $('tet').classList.add('hide'); $('pw').classList.remove('hide'); S.startPairwise(set);
    PairwisePit.mount($('pw'), set, { onEvent: S.event, onDone: function (round) { pwLevel = S.endPairwise(round); summary(round); } });
  }
  function save() { var d = S.finish(); d = S.log.toJSON(); try { var all = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); all[d.run.id] = d; localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) { } return d; }
  function download(d) { var b = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'human-combo-' + d.run.id + '.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function summary(round) {
    phase = 'summary'; $('pw').classList.add('hide'); var d = save(), x = round.ext(), live = x.decisions.filter(function (q) { return !q.undone; });
    var rows = live.map(function (q) { return '<tr><td>' + q.pairId + '</td><td>' + q.choice + (q.strength ? ' ×' + q.strength : '') + '</td><td>' + (q.decisionTimeMs / 1000).toFixed(1) + 's</td></tr>'; }).join('');
    var tl = tetrisLevel, readMs = pwLevel.durationMs;
    show('<h2>Session done</h2><p>Tetris ' + fmt(tl.durationMs) + ' (' + tl.ext.tetris.pieces + ' drops) · Pairwise ' + fmt(readMs) + ' · total ' + fmt(tl.durationMs + readMs) + '</p>' +
      '<table>' + rows + '</table><p style="font-size:12px;color:#aaa">' + (set.demo ? 'Demo set — test data only. ' : '') + 'Formula: ' + dt.formula + '. Log saved in this browser; download it and drop it into <code>logs/human/</code> so tune.js can recalibrate wordsPerDrop.</p>' +
      '<button id="dl">⬇ Download log</button><button id="again">↻ Play again</button>');
    $('dl').onclick = function () { download(d); }; $('again').onclick = function () { location.reload(); };
  }
  function loop(t) { var d = Math.min(100, t - last); last = t; if (!paused && game && phase === 'tetris') { segT += d; game.tick(d); check(); draw(); } requestAnimationFrame(loop); }
  function act(fn) { if (paused || !game || phase !== 'tetris') return; fn(); check(); draw(); }
  function hold(btn, fn) { var iv, to; function go(e) { e.preventDefault(); act(fn); to = setTimeout(function () { iv = setInterval(function () { act(fn); }, 60); }, 180); } function stop() { clearTimeout(to); clearInterval(iv); } btn.addEventListener('pointerdown', go); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, stop); }); }
  hold($('bl'), function () { game.moveLeft(); }); hold($('br'), function () { game.moveRight(); }); hold($('bd'), function () { game.softDrop(); });
  $('bh').addEventListener('pointerdown', function (e) { e.preventDefault(); act(function () { game.hardDrop(); }); });
  $('brot').addEventListener('pointerdown', function (e) { e.preventDefault(); act(function () { game.rotate(); }); });
  var ts = null; cv.addEventListener('touchstart', function (e) { var t = e.touches[0]; ts = { x: t.clientX, y: t.clientY, t: Date.now(), moved: 0 }; e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', function (e) { if (!ts) return; var t = e.touches[0], dx = t.clientX - ts.x; while (Math.abs(dx) >= cell) { var d = dx > 0 ? 1 : -1; act(function () { d > 0 ? game.moveRight() : game.moveLeft(); }); ts.x += d * cell; dx -= d * cell; ts.moved = 1; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', function (e) { if (!ts) return; var t = e.changedTouches[0], dy = t.clientY - ts.y; if (dy > 60 && Date.now() - ts.t < 400) act(function () { game.hardDrop(); }); else if (!ts.moved && Math.abs(dy) < 15) act(function () { game.rotate(); }); ts = null; e.preventDefault(); }, { passive: false });
  cv.addEventListener('mousedown', function () { act(function () { game.rotate(); }); });
  addEventListener('keydown', function (e) { var m = { ArrowLeft: 'moveLeft', ArrowRight: 'moveRight', ArrowDown: 'softDrop', ArrowUp: 'rotate', x: 'rotate', ' ': 'hardDrop' }[e.key]; if (m && phase === 'tetris') { e.preventDefault(); act(function () { game[m](); }); } });
  addEventListener('resize', resize);
  var setId = (new URLSearchParams(location.search).get('set') || 'test-001').replace(/[^\w-]/g, '');
  function j(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  Promise.all([j('../pairwise/sets/' + setId + '.json'), j('../tetris/tuning.json')]).then(function (r) {
    set = r[0]; tuning = r[1]; if (!set) { show('<h2>Set not found</h2><p>' + setId + '</p>'); return; }
    dt = DropTarget.compute(set, DropTarget.fromTuning(tuning));
    P = Object.assign({}, TetrisLevels.merge(tuning)[0], { level: 1, goal: 'drops', dropsTarget: dt.dropsTarget, wordsPerDrop: dt.wordsPerDrop });
    requestAnimationFrame(loop);
    show('<h2>Combo: Tetris → Pairwise Pit</h2><p>This round has <span class="k">' + dt.totalWords + ' words</span> to read in ' + set.pairs.length + ' pairs, so your Tetris goal is <span class="k">' + dt.dropsTarget + ' drops</span> (about ' + Math.round(dt.estReadSec / 60 * 10) / 10 + ' min of reading at ' + DropTarget.fromTuning(tuning).assumedWpm + ' wpm).</p>' +
      '<p style="font-size:12px;color:#aaa">dropsTarget = clamp(round(words / wordsPerDrop), min, max) = ' + dt.formula + '. Lines still score but do not end the round.' + (set.demo ? ' Set <code>' + set.setId + '</code> is DEMO data.' : '') + '</p><p style="font-size:12px;color:#aaa">Tap board = rotate · swipe ←→ move · swipe ↓ drop · or buttons</p><button id="go">▶ Start</button>');
    $('go').onclick = startTetris;
  });
})();
