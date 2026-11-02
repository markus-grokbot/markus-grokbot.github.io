/* Lynx Dash page: 30 s of ACTIVE running -> one tone question (Pairwise Pit, single mode) -> 3-2-1 -> repeat, N questions.
   ?sim=1&skill=good&chooser=random&fast=8&q=6 runs a labelled SIM round in the page (bot input + sim chooser). */
(function () {
  'use strict';
  var E = RunnerEngine, $ = function (id) { return document.getElementById(id); }, Q = new URLSearchParams(location.search);
  var APPS = Q.get('mode') === 'apps', AM = null, APPDATA = null;
  var SIM = Q.get('sim') === '1', FAST = Math.max(1, Math.min(32, +(Q.get('fast') || (SIM ? 8 : 1)))), LS = SIM ? 'runner.simlogs.v1' : 'runner.logs.v1', SEEN = 'runner.seenPairs.v1';
  var cv = $('cv'), cx = cv.getContext('2d'), P, set, qset, round, S, g, bot, rng, phase = 'menu', segT = 0, qi = 0, streak = 0, bestStreak = 0, bonusTotal = 0, input = { jump: false, duck: false }, acc = 0, last = 0, flash = [], dlData = null;
  $('pwcss').textContent = PairwisePit.CSS + (APPS ? AppsMode.CSS : '');
  function device() { return { ua: navigator.userAgent, screen: screen.width + 'x' + screen.height, dpr: devicePixelRatio, touch: 'ontouchstart' in window, lang: navigator.language, viewport: innerWidth + 'x' + innerHeight }; }
  function show(h) { $('ovbox').innerHTML = h; $('ov').classList.remove('hide'); } function hide() { $('ov').classList.add('hide'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // ---------- pixel art (original): Lynx "Lo" with ear tufts, crows, stones/cacti, coins ----------
  var LYNX = ['....d.....d.....', '...dd....dd.....', '...oooooooo.....', '..ooweooweoo....', '..oooooooooo...d', '...owwwwwwo...do', '....oooooooooooo', '...ooooooooooooo', '...oooooooooooo.', '...oo.oo...oo.oo'];
  var LYNX2 = LYNX.slice(0, 9).concat(['....oo.....oo.oo.'.slice(0, 16)]);
  var DUCK = ['................', '.d.....d........', '.ddooooooo......', '.ooweooweooooood', '.oooooooooooooo.', '..owwwwooooooooo', '...oo.oo...oo.oo'];
  var CROW = [['..kk..........', '.kkkk.....kkk.', 'kkykkkkkkkkk..', '..kkkkkkkkk...', '....kk........'], ['..kk..kkk.....', '.kkkk..kkk....', 'kkykkkkkkkkk..', '..kkkkkkkk....', '..............']];
  var PAL = { o: '#d9a35b', d: '#4a3220', w: '#f3e7cf', e: '#1b1b1b', k: '#2b2f3a', y: '#ffcc33' };
  function spr(map, x, y, s, alpha) { cx.globalAlpha = alpha == null ? 1 : alpha; for (var r = 0; r < map.length; r++) for (var c = 0; c < map[r].length; c++) { var ch = map[r][c]; if (ch !== '.' && PAL[ch]) { cx.fillStyle = PAL[ch]; cx.fillRect(Math.round(x + c * s), Math.round(y + r * s), s, s); } } cx.globalAlpha = 1; }
  function draw() {
    var Wd = cv.width, H = cv.height; cx.fillStyle = '#1b1e27'; cx.fillRect(0, 0, Wd, H);
    if (!g) return; var s = g.state(), sc = Wd / 400, oy = H - 200 * sc; cx.save(); cx.translate(0, oy); cx.scale(sc, sc);
    cx.fillStyle = '#262a36'; for (var i = 0; i < 5; i++) { var hx = ((i * 170 - s.dist * 0.15) % 850 + 850) % 850 - 120; cx.beginPath(); cx.moveTo(hx, 170); cx.lineTo(hx + 70, 110 + (i % 3) * 12); cx.lineTo(hx + 140, 170); cx.fill(); }
    cx.fillStyle = '#5b6170'; cx.fillRect(0, E.GROUND, E.W, 2); cx.fillStyle = '#3a3f4c'; for (var j = 0; j < 30; j++) { var gx = ((j * 41 - s.dist) % 620 + 620) % 620 - 10; cx.fillRect(gx, E.GROUND + 6 + (j % 3) * 5, 4 + (j % 4) * 2, 2); }
    s.items.forEach(function (it) { cx.fillStyle = '#ffcc33'; cx.fillRect(it.x + 2, it.y, 6, 10); cx.fillRect(it.x, it.y + 2, 10, 6); cx.fillStyle = '#b8860b'; cx.fillRect(it.x + 4, it.y + 3, 2, 4); });
    s.obstacles.forEach(function (o) {
      if (o.kind === 'bird') spr(CROW[Math.floor(s.t / 160) % 2], o.x - 1, o.y - 1, 2);
      else { cx.fillStyle = '#4f8a4b'; var parts = o.lvl === 'double' ? [[0, 12, 6], [18, 12, 0]] : [[0, o.w, 0]]; parts.forEach(function (p) { cx.fillRect(o.x + p[0] + 3, o.y + p[2], p[1] - 6, o.h - p[2]); cx.fillRect(o.x + p[0], o.y + p[2] + 8, 3, 8); cx.fillRect(o.x + p[0] + p[1] - 3, o.y + p[2] + 5, 3, 8); }); cx.fillStyle = '#6fb36a'; cx.fillRect(o.x + 4, o.y + 2, 2, o.h - 4); }
    });
    var me = g.player(), blink = s.t < s.invulnUntil && Math.floor(s.t / 100) % 2 ? 0.35 : 1;
    if (me.duck) spr(DUCK, me.x - 8, me.y - 0, 2, blink); else spr(me.air || Math.floor(s.dist / 18) % 2 ? LYNX : LYNX2, me.x - 5, me.y + 4, 2, blink);
    flash = flash.filter(function (f) { return s.t - f.t < 700; }); flash.forEach(function (f) { cx.globalAlpha = 1 - (s.t - f.t) / 700; cx.fillStyle = f.c; cx.font = 'bold 14px system-ui'; cx.fillText(f.txt, me.x + 20, me.y - 8 - (s.t - f.t) / 30); cx.globalAlpha = 1; });
    cx.restore();
    $('lv').textContent = s.lives; $('ds').textContent = Math.floor(s.runDist / 10) + 'm'; $('cn').textContent = s.coins; $('sc').textContent = Math.round(s.score); $('qfill').style.width = Math.min(100, segT / P.segmentMs * 100) + '%';
  }
  function resize() { var r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (r.width) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); } draw(); }
  function onEv(t, d) { S.event(t, d); if (!g) return; var tt = g.state().t; if (t === 'coin') flash.push({ t: tt, txt: '+10', c: '#fc0' }); if (t === 'near_miss') flash.push({ t: tt, txt: 'close! +5', c: '#7cf' }); if (t === 'crash') { flash.push({ t: tt, txt: '-1 ❤️', c: '#f66' }); if (navigator.vibrate && !SIM) navigator.vibrate(60); } if (t === 'knockout') flash.push({ t: tt, txt: 'reset! lives refilled', c: '#f96' }); }
  // ---------- flow ----------
  function start() {
    var seen = []; try { seen = JSON.parse(localStorage.getItem(SEEN) || '[]'); } catch (e) { }
    rng = E.rng((Date.now() % 1e9) | 0); var seed = (Date.now() % 1e9) | 0;
    S = RunnerSession.create({ runType: SIM ? 'sim' : 'human', seed: seed, device: device(), player: SIM ? { kind: 'bot', skill: Q.get('skill') || 'good', chooser: Q.get('chooser') || 'random', inPage: true, fast: FAST } : { kind: 'human', handle: 'markus' }, tuningSource: SRC });
    if (APPS) { AM = AppsMode.create(APPDATA, rng); S.event('apps_mode', { apps: APPDATA.apps.length, generated: APPDATA.generated }); }
    else { qset = Object.assign({}, set, { pairs: RunnerSession.pickPairs(set, P.questions, rng, seen) }); round = PairwisePit.createRound(qset, { rng: rng }); }
    g = E.create({ params: P, seed: seed, onEvent: onEv }); if (SIM) bot = RunnerBot.create(Q.get('skill') || 'good', rng);
    qi = 0; streak = 0; bestStreak = 0; bonusTotal = 0; $('qt').textContent = P.questions; hide(); $('game').classList.remove('hide'); resize(); beginRun();
  }
  function beginRun() { segT = 0; $('qn').textContent = qi + 1; S.startRun(P, qi); countdown(); }
  function countdown(then) {
    phase = 'countdown'; $('pw').classList.add('hide'); $('game').classList.remove('hide'); resize(); var n = 3, el = $('cd'); el.classList.remove('hide'); el.textContent = n;
    var iv = setInterval(function () { n--; if (n > 0) el.textContent = n; else { clearInterval(iv); el.classList.add('hide'); input.jump = input.duck = false; phase = 'run'; last = performance.now(); acc = 0; } }, P.countdownMs / 3 / (SIM ? FAST : 1));
  }
  function endRun() {
    var st = g.endSegment(); streak = st.clean ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak); var b = st.clean ? P.cleanBonus * streak : 0; g.addBonus(b); bonusTotal += b;
    if (st.clean) S.event('clean_segment', { streak: streak, bonus: b });
    S.endRun(st, { streak: streak, cleanBonus: b, scoreTotal: Math.round(g.state().score), lives: g.state().lives, speedEnd: +g.state().speed.toFixed(3) });
    ask(st, b);
  }
  function ask(st, b) {
    phase = 'question'; input.jump = input.duck = false; $('game').classList.add('hide'); var el = $('pw'); el.classList.remove('hide');
    if (APPS) return askApp(st, b);
    var pair = round.current().pair; S.startQuestion(qset, pair, qi);
    var head = '<div style="text-align:center;padding:6px 0;font-size:13px;color:#aaa">' + (SIM ? '<span class="sim">SIM</span> ' : '') + 'Segment ' + (qi + 1) + ' done · ' + (st.clean ? '<span class="k">clean run! streak ' + streak + ' +' + b + '</span>' : st.crashes + ' crash' + (st.crashes === 1 ? '' : 'es')) + ' · ' + Math.round(st.distance / 10) + 'm</div>';
    var holder = document.createElement('div'); el.innerHTML = head; el.appendChild(holder);
    PairwisePit.mount(holder, qset, { round: round, single: true, onDecision: function (d) {
      if (SIM) d.source = 'sim:' + (Q.get('chooser') || 'random');
      S.event('pairwise_decision', { pairId: d.pairId, choice: d.choice, seq: d.seq }); S.endQuestion(qset, d);
      try { var seen = JSON.parse(localStorage.getItem(SEEN) || '[]'); if (seen.indexOf(d.pairId) < 0) seen.push(d.pairId); localStorage.setItem(SEEN, JSON.stringify(seen)); } catch (e) { }
      qi++; g.afterQuestion(); if (qi >= P.questions) summary(); else beginRun();
    } });
    if (SIM) { var c = PairwiseSim.choose(pair, Q.get('chooser') || 'random', rng); setTimeout(function () {
      if (c.choice === 'A' || c.choice === 'B') { var sel = holder.querySelector('.pw-str[data-s="' + c.strength + '"]'); if (sel) sel.click(); holder.querySelector('.pw-item[data-k="' + c.choice + '"]').click(); }
      else holder.querySelector(c.choice === 'tie' ? '.pw-tie' : '.pw-nth').click(); }, Math.round(PairwiseSim.thinkMs(pair, rng) / FAST)); }
  }
  function askApp(st, b) {
    var el = $('pw'), card = AM.next(), holder = document.createElement('div');
    el.innerHTML = '<div style="text-align:center;padding:6px 0;font-size:13px;color:#aaa">' + (SIM ? '<span class="sim">SIM</span> ' : '') + 'Segment ' + (qi + 1) + ' done · ' + (st.clean ? '<span class="k">clean run! +' + b + '</span>' : st.crashes + ' crash' + (st.crashes === 1 ? '' : 'es')) + '</div>'; el.appendChild(holder);
    AppsMode.render(holder, card, function (c) { var e = AM.answer(card, c); S.event('apps_choice', e); qi++; g.afterQuestion(); if (qi >= P.questions) summary(); else beginRun(); });
    if (SIM) setTimeout(function () { var bs = holder.querySelectorAll('button[data-c]'); bs[Math.floor(rng() * bs.length)].click(); }, Math.round(1500 / FAST));
  }
  function summaryApps() {
    var s = g.state(), sum = { distance: Math.round(s.dist), bestRunDistance: Math.round(s.bestRunDist), score: Math.round(s.score), coins: s.coins, knockouts: s.knockouts, bestStreak: bestStreak, cleanBonusTotal: bonusTotal, cardsAnswered: qi };
    var d = S.finish(sum); d.mode = 'apps'; d.apps = AM.result(); try { d.qualities = Qualities.compute(d, FOC); } catch (e) { } dlData = d; window.__runnerLog = d;
    try { var all = JSON.parse(localStorage.getItem('runner.appslogs.v1') || '{}'); all[d.run.id] = d; localStorage.setItem('runner.appslogs.v1', JSON.stringify(all)); } catch (e) { }
    show('<h2>' + (SIM ? '<span class="sim">SIM</span> ' : '') + 'Round done</h2><table><tr><td>Distance</td><td class="k">' + Math.round(sum.distance / 10) + ' m</td></tr><tr><td>Score</td><td>' + sum.score + '</td></tr><tr><td>Coins</td><td>' + sum.coins + '</td></tr><tr><td>Cards answered</td><td>' + qi + '</td></tr></table>' + AM.summaryHTML() +
      '<p style="font-size:11px;color:#999">' + esc(d.apps.scoring) + '. Saved in this browser only.</p><button id="dl">⬇ Download log</button><button id="again">↻ Play again</button>');
    $('dl').onclick = function () { var bl = new Blob([JSON.stringify(dlData, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = (SIM ? 'sim' : 'human') + '-apps-' + dlData.run.id + '.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('again').onclick = function () { location.reload(); };
  }
  function summary() {
    if (APPS) { phase = 'summary'; $('game').classList.add('hide'); $('pw').classList.add('hide'); return summaryApps(); }
    phase = 'summary'; $('game').classList.add('hide'); $('pw').classList.add('hide'); var s = g.state(), dec = round.decisions().filter(function (d) { return !d.undone; }), tone = RunnerSession.toneMini(qset, dec);
    var sum = { distance: Math.round(s.dist), bestRunDistance: Math.round(s.bestRunDist), score: Math.round(s.score), coins: s.coins, knockouts: s.knockouts, bestStreak: bestStreak, cleanBonusTotal: bonusTotal, questionsAnswered: dec.length, tone: tone };
    var d = S.finish(sum); d.qualities = Qualities.compute(d, FOC); dlData = d; var F = d.qualities.runnerFocus; try { var all = JSON.parse(localStorage.getItem(LS) || '{}'); all[d.run.id] = d; localStorage.setItem(LS, JSON.stringify(all)); } catch (e) { }
    window.__runnerLog = d;
    var teaser = tone.length ? 'You lean <span class="k">' + tone.map(function (t) { return t.word; }).join(', ') + '</span> (' + dec.length + ' picks, early signal only).' : 'No clear lean yet; play more rounds.';
    show('<h2>' + (SIM ? '<span class="sim">SIM</span> ' : '') + 'Round done</h2><table><tr><td>Distance</td><td class="k">' + Math.round(sum.distance / 10) + ' m</td></tr><tr><td>Best run (no reset)</td><td>' + Math.round(sum.bestRunDistance / 10) + ' m</td></tr><tr><td>Score</td><td>' + sum.score + '</td></tr><tr><td>Coins</td><td>' + sum.coins + '</td></tr><tr><td>Best clean streak</td><td>' + bestStreak + '</td></tr><tr><td>Questions answered</td><td>' + dec.length + '</td></tr><tr><td><b>Focus score</b></td><td class="k">' + (F && F.round.focus != null ? F.round.focus + ' / 100' : 'n/a') + '</td></tr><tr><td>Focus per run</td><td>' + (F ? F.segments.map(function (x) { return x.focus; }).join(' · ') : '') + '</td></tr><tr><td>Trend</td><td>' + (F ? F.trend.label : '') + '</td></tr></table>' +
      '<p style="font-size:11px;color:#999">Focus = penalties per chance: cactus ×' + FOC.weights.obstacle + ', crow ×' + FOC.weights.projectile + ', missed coin ×' + FOC.weights.coin + '. Rough until more rounds.</p>' + Qualities.html(d.qualities) +
      '<p><b>Your tone so far:</b> ' + teaser + '</p><p style="font-size:12px;color:#aaa">' + (SIM ? 'SIMULATED run (bot + sim chooser); not preference data. ' : '') + 'Saved in this browser. Download and drop into <code>logs/human/</code>, then run <code>node games/pairwise/tools/aggregate.js</code> for the full tone profile.</p>' +
      '<button id="dl">⬇ Download log</button><button id="again">↻ Play again</button>');
    $('dl').onclick = function () { var b = new Blob([JSON.stringify(dlData, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (SIM ? 'sim' : 'human') + '-runner-' + dlData.run.id + '.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('again').onclick = function () { location.reload(); };
  }
  function pause() { if (phase !== 'run') return; phase = 'paused'; S.event('pause', {}); show('<h2>Paused</h2><p>The 30 s timer is stopped.</p><button id="res">▶ Resume</button>'); $('res').onclick = function () { hide(); S.event('resume', {}); countdown(); }; }
  // ---------- loop: fixed 60 Hz step; timer counts only while phase === 'run' ----------
  var STEP = 1000 / 60;
  function loop(t) {
    var d = Math.min(100, t - last); last = t;
    if (phase === 'run' && g) { acc += d * FAST; while (acc >= STEP && phase === 'run') { acc -= STEP; g.step(STEP, SIM ? bot.decide(g) : input); segT += STEP; if (segT >= P.segmentMs) endRun(); } draw(); }
    requestAnimationFrame(loop);
  }
  // ---------- input ----------
  function jd(v) { input.jump = v; $('bjump').classList.toggle('on', v); } function dd(v) { input.duck = v; $('bduck').classList.toggle('on', v); }
  $('bjump').addEventListener('pointerdown', function (e) { e.preventDefault(); jd(true); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { $('bjump').addEventListener(ev, function () { jd(false); }); $('bduck').addEventListener(ev, function () { dd(false); }); });
  $('bduck').addEventListener('pointerdown', function (e) { e.preventDefault(); dd(true); });
  var ts = null; cv.addEventListener('pointerdown', function (e) { e.preventDefault(); ts = { y: e.clientY, duck: false }; jd(true); });
  cv.addEventListener('pointermove', function (e) { if (ts && e.clientY - ts.y > 28) { ts.duck = true; jd(false); dd(true); } });
  ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { ts = null; jd(false); dd(false); }); });
  addEventListener('keydown', function (e) { if (e.repeat) return; if ([' ', 'ArrowUp', 'w'].indexOf(e.key) >= 0 && phase === 'run') { e.preventDefault(); jd(true); } else if (['ArrowDown', 's'].indexOf(e.key) >= 0 && phase === 'run') { e.preventDefault(); dd(true); } else if (e.key === 'p' || e.key === 'Escape') pause(); });
  addEventListener('keyup', function (e) { if ([' ', 'ArrowUp', 'w'].indexOf(e.key) >= 0) jd(false); if (['ArrowDown', 's'].indexOf(e.key) >= 0) dd(false); });
  $('bp').onclick = pause; document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); }); addEventListener('resize', resize);
  // ---------- boot ----------
  var setId = (Q.get('set') || 'tone-001').replace(/[^\w-]/g, '');
  function j(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  Promise.all([APPS ? j('data/applications.json') : j('../pairwise/sets/' + setId + '.json'), j('tuning.json')]).then(function (r) {
    set = r[0]; var tn = r[1]; if (APPS) { APPDATA = set; set = { pairs: [] }; if (!APPDATA) { show('<h2>applications.json not found</h2>'); return; } }
    if (!set) { show('<h2>Set not found</h2><p>' + esc(setId) + '</p>'); return; }
    P = E.merge(tn); FOC = Object.assign({ weights: Qualities.DEFAULT_WEIGHTS }, (tn && tn.focus) || {}); SRC = tn ? 'tuning.json@' + tn.generatedAt : 'defaults'; if (APPS) P.questions = Math.max(1, Math.min(60, +(Q.get('q') || 12))); else if (Q.get('q')) P.questions = Math.max(1, Math.min(set.pairs.length, +Q.get('q')));
    requestAnimationFrame(function (t) { last = t; loop(t); });
    if (APPS) { show('<h2>🐾 Lynx Dash · Applications</h2><p>Run with Lo. Every <span class="k">' + P.segmentMs / 1000 + ' s</span> the game pauses for one card about an <span class="k">unsent job application</span> (' + APPDATA.apps.length + ' in the pile): up/down-prioritise it, rate one aspect (−− … ++), or pick a phrasing. Tap or use number keys. ' + P.questions + ' cards per round (~' + Math.round(P.questions * (P.segmentMs + 8000) / 60000) + ' min).</p><p style="font-size:12px;color:#aaa">Choices stay in this browser; download the log at the end.' + (SIM ? ' <span class="sim">SIM MODE</span>' : '') + '</p><button id="go">▶ Run</button>'); $('go').onclick = start; if (SIM) setTimeout(start, 50); return; }
    show('<h2>🐾 Lynx Dash</h2><p>Run with Lo the lynx. Every <span class="k">' + P.segmentMs / 1000 + ' s</span> of running, the game pauses for one quick <span class="k">tone question</span>: which version sounds more like how <i>you</i> would write? ' + P.questions + ' questions per round (~' + Math.round(P.questions * (P.segmentMs + 15000) / 60000) + ' min).</p>' +
      '<p style="font-size:12px;color:#aaa">' + P.lives + ' lives; losing them all just resets your distance. Clean 30 s = streak bonus. Texts are fictional; only your taste in voice is recorded.' + (SIM ? ' <span class="sim">SIM MODE</span>' : '') + '</p><button id="go">▶ Run</button>');
    $('go').onclick = start; if (SIM) setTimeout(start, 50);
  });
  var SRC = 'defaults', FOC = { weights: Qualities.DEFAULT_WEIGHTS };
})();
