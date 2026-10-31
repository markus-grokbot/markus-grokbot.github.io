/* Parcel Panic v2 page ("field"): one parcel at a time drifts in; drag it anywhere on the 2D field (axes.js) before its
   countdown ends. Relative drag: put a finger anywhere on the field and the parcel moves with it 1:1 (no need to hit the card),
   touch-action:none + pointer capture so the page never scrolls; navigator.vibrate pulse when entering a strong zone (Android).
   ?round=<id>, ?sim=1&skill=good&fast=8&seed=1 (bot, run.type sim). ?v=1 -> classic.html (v1). */
(function () {
  var E = ParcelEngine2, A = ParcelAxes, Q = new URLSearchParams(location.search), SIM = Q.get('sim') === '1', FAST = SIM ? Math.max(1, +(Q.get('fast') || 8)) : 1;
  var $ = function (id) { return document.getElementById(id); }, esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var LS = SIM ? 'parcels.simlogs.v1' : 'parcels.logs.v1', COL = { recruiter: '#5bd', 'job-board': '#7c6', github: '#aaa', service: '#c9c', marketing: '#e75', collaborator: '#fd5', invoice: '#6cf', newsletter: '#9a7' };
  var EMO = { reply: '↩️', info: '❓', later: '⏰', archive: '🗄️', spam: '🚫' }, round, P, pl, S, wave, wi = 0, qi = 0, phase = 'intro', last = 0, acc = 0, bot, rng, total = 0, best = 0, dlData, qList = [], shownId = null, drag = null, lastZone = null;
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function show(h) { $('ov').innerHTML = '<div class="box">' + h + '</div>'; $('ov').classList.remove('hide'); } function hide() { $('ov').classList.add('hide'); }
  function pop(t, c) { var p = $('pop'); p.textContent = t; p.style.color = c || '#fd8'; p.style.opacity = 1; clearTimeout(pop.t); pop.t = setTimeout(function () { p.style.opacity = 0; }, 550); }
  function label(b) { var x = round.bins.filter(function (z) { return z.id === b; })[0]; return x ? x.label : b; }
  function buildZones() { $('zones').innerHTML = Object.keys(A.ZONES).map(function (b) { var z = A.ZONES[b]; return '<div class="zl" data-b="' + b + '" style="left:' + ((z.x + 1) * 50) + '%;top:' + ((1 - z.y) * 50) + '%"><span class="e">' + EMO[b] + '</span>' + esc(label(b)) + '</div>'; }).join(''); }
  function onEv(type, d) {
    if (type === 'sort') { S.event('sort', { parcelId: d.parcelId, x: d.x, y: d.y, bin: d.bin, conf: d.conf, sortMs: d.sortMs, timedOut: d.timedOut }); pop((d.conf < 0.25 ? 'undecided +' : '+') + d.points + (d.combo > 2 ? '  ×' + d.combo : ''), d.conf < 0.25 ? '#aaa' : d.combo > 4 ? '#7f7' : '#fd8'); drag = null; }
    else if (type === 'miss') { S.event('miss', { parcelId: d.parcelId }); pop('missed', '#e55'); $('field').classList.add('flash'); setTimeout(function () { $('field').classList.remove('flash'); }, 200); }
    else if (type === 'spawn') S.event('spawn', d);
    else if (type === 'zone') { S.event('zone', d); if (!SIM && navigator.vibrate) try { navigator.vibrate(12); } catch (e) { } }
  }
  function draw() {
    var c = wave && wave.current(), el = $('card'), F = $('field'), W = F.clientWidth, H = F.clientHeight;
    if (!c) { el.style.display = 'none'; $('pt').style.display = 'none'; shownId = null; [].forEach.call(document.querySelectorAll('.zl'), function (z) { z.classList.remove('on'); }); $('read').textContent = ''; }
    else { if (shownId !== c.p.id) { shownId = c.p.id; el.style.borderLeftColor = COL[c.p.senderType] || '#888'; el.querySelector('.s').innerHTML = esc(c.p.sender) + (c.p.badge ? '<span class="bd">' + esc(c.p.badge) + '</span>' : ''); el.querySelector('.h').textContent = c.p.subject; el.querySelector('.n').textContent = c.p.snippet; }
      var px = (c.x + 1) / 2 * W, py = (1 - c.y) / 2 * H, pt = $('pt'); el.style.display = 'block'; el.style.left = Math.max(86, Math.min(W - 86, px)) + 'px'; el.style.top = Math.max(48, Math.min(H - 48, py)) + 'px'; pt.style.display = 'block'; pt.style.left = px + 'px'; pt.style.top = py + 'px'; el.classList.toggle('held', c.held);
      var left = Math.max(0, c.limitMs - (wave.state().t - c.t0)), f = left / c.limitMs; el.querySelector('.bar').style.transform = 'scaleX(' + f + ')'; el.querySelector('.bar').style.background = f > 0.5 ? '#7cf' : f > 0.25 ? '#fc6' : '#f66'; el.querySelector('.t').textContent = (left / 1000).toFixed(1) + 's';
      var D = c.touched ? A.describe(c.x, c.y) : null; [].forEach.call(document.querySelectorAll('.zl'), function (z) { z.classList.toggle('on', !!(D && D.bin === z.getAttribute('data-b') && D.pTop >= 0.5)); });
      $('read').textContent = D ? (D.confX >= 0.3 ? (c.x < 0 ? 'act now ' : 'not now ') + Math.round(D.confX * 100) + '%' : 'now? undecided') + ' · ' + (D.confY >= 0.3 ? (c.y > 0 ? 'worth it ' : 'noise ') + Math.round(D.confY * 100) + '%' : 'worth? undecided') + ' → ' + label(D.bin) + ' ' + Math.round(D.pTop * 100) + '%' : 'Drag anywhere on the field · let go to drop'; }
    var st = wave ? wave.state() : null; if (st) { $('sc').textContent = total + st.score; $('cb').textContent = st.combo; }
  }
  // relative drag on the whole field
  var F = $('field');
  F.addEventListener('pointerdown', function (e) { if (phase !== 'run' || SIM || !wave || !wave.current()) return; e.preventDefault(); var c = wave.current(); if (!wave.grab()) return; try { F.setPointerCapture(e.pointerId); } catch (x) { } drag = { id: e.pointerId, px: e.clientX, py: e.clientY, x0: c.x, y0: Math.min(1, c.y) }; wave.move(drag.x0, drag.y0); });
  F.addEventListener('pointermove', function (e) { if (!drag || e.pointerId !== drag.id || phase !== 'run') return; e.preventDefault(); var W = F.clientWidth, H = F.clientHeight; wave.move(drag.x0 + 2 * (e.clientX - drag.px) / W, drag.y0 - 2 * (e.clientY - drag.py) / H); });
  function up(e) { if (!drag || e.pointerId !== drag.id) return; drag = null; if (phase === 'run' && wave) wave.release(); }
  F.addEventListener('pointerup', up); F.addEventListener('pointercancel', up);
  document.addEventListener('touchmove', function (e) { if (phase === 'run') e.preventDefault(); }, { passive: false });
  function start() {
    var seed = SIM ? +(Q.get('seed') || 1) : (Date.now() % 1e9); rng = mulberry(seed); if (SIM) bot = ParcelBot.createField(Q.get('skill') || 'good', rng);
    S = ParcelSession.create({ runType: SIM ? 'sim' : 'human', seed: seed, gameVersion: E.GAME_VERSION, iteration: E.ITERATION, device: { ua: navigator.userAgent, w: innerWidth, h: innerHeight, touch: 'ontouchstart' in window }, player: SIM ? { bot: 'ParcelBot.field', skill: bot.skill } : {}, tuningSource: 'round:' + round.roundId }, round, { mode: E.MODE, axesVersion: A.VERSION });
    src = ParcelEngine.source(pl, rng); hide(); beginWave();
  }
  var src;
  function beginWave() { var w = P.waves[wi]; wave = E.createWave(src, w, P, { onEvent: onEv }); S.startWave(P, wi, w); $('wv').textContent = wi + 1; phase = 'countdown';
    var n = 3, el = $('cd'); el.classList.remove('hide'); el.textContent = 'Wave ' + (wi + 1); var iv = setInterval(function () { n--; if (n > 0) el.textContent = n; else { clearInterval(iv); el.classList.add('hide'); phase = 'run'; last = performance.now(); acc = 0; } }, 800 / FAST); }
  function endWave() { phase = 'between'; drag = null; var st = wave.state(); total += st.score; best = Math.max(best, st.bestCombo); S.endWave(wi, st); draw();
    wi++; if (wi >= P.waves.length) return summary(); if (qi < qList.length) ask(st); else beginWave(); }
  function ask(st) {
    phase = 'question'; var q = qList[qi], p = round.parcels.filter(function (x) { return x.id === q.parcelId; })[0], sw = rng() < 0.5, L = sw ? q.b : q.a, R = sw ? q.a : q.b, t0 = performance.now();
    S.startQuestion(q, qi); var s = st.decisions.filter(function (d) { return !d.missed; });
    show((SIM ? '<span class="sim">SIM</span> ' : '') + '<div style="color:#aaa;font-size:13px">Wave ' + wi + ' done · ' + s.length + ' placed, ' + st.misses + ' missed</div><h3>' + esc(q.criterion) + '</h3>' +
      '<div class="pc" style="border-left-color:' + (COL[p.senderType] || '#888') + '"><div class="s">' + esc(p.sender) + '</div><div class="h">' + esc(p.subject) + '</div><div class="n">' + esc(p.snippet) + '</div></div>' +
      '<button class="ab" data-c="A">A · <b>' + esc(L.text) + '</b></button><button class="ab" data-c="B">B · <b>' + esc(R.text) + '</b></button><button data-c="neither" style="background:#444">Neither helps</button>' +
      '<p style="font-size:11px;color:#888">Two summary styles written by two local models (which is which stays hidden).</p>');
    [].forEach.call($('ov').querySelectorAll('[data-c]'), function (b) { b.onclick = function () { var d = ParcelSession.abDecision(q, b.getAttribute('data-c'), sw, (performance.now() - t0) * FAST, SIM ? 'sim:shorter-bias' : 'human');
      S.event('ab_decision', { pairId: q.id, choice: d.choice }); S.endQuestion(q, d); qi++; hide(); beginWave(); }; });
    if (SIM) setTimeout(function () { var c = bot.abChoose({ a: L, b: R }); $('ov').querySelector('[data-c="' + c + '"]').click(); }, 1500 / FAST);
  }
  function summary() {
    phase = 'summary'; var sum = ParcelSession.summarize(S.waves, total, best, qi), d = S.finish(sum); d.qualities = Qualities.compute(d); dlData = d; window.__parcelsLog = d;
    try { var o = JSON.parse(localStorage.getItem(LS) || '{}'); o[d.run.id] = d; localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { }
    var name = (SIM ? 'sim' : 'human') + '-parcels-' + round.roundId + '-' + d.run.id + '.json';
    show('<h2>' + (SIM ? '<span class="sim">SIM</span> ' : '') + '📦 Round done</h2><table><tr><td>Score</td><td class="k">' + total + '</td></tr><tr><td>Placed</td><td>' + sum.sorted + ' / ' + sum.parcels + '</td></tr><tr><td>Missed</td><td>' + sum.misses + '</td></tr><tr><td>Partial (one clear axis)</td><td>' + (sum.partial || 0) + '</td></tr><tr><td>Undecided (middle)</td><td>' + (sum.middle || 0) + '</td></tr><tr><td>Mean confidence</td><td>x ' + (sum.meanConfX || 0) + ' · y ' + (sum.meanConfY || 0) + '</td></tr><tr><td>Round</td><td>' + esc(round.roundId) + (round.sim ? ' (sim)' : '') + '</td></tr></table>' + Qualities.html(d.qualities) +
      '<p style="font-size:12px;color:#aaa">Where you dropped each parcel (and how far from the middle) grades the local models that pre-sorted them blind. ' + (SIM ? 'SIMULATED run, never used for the human leaderboard. ' : '') + 'Download the log and upload it to <code>logs/human/</code> on GitHub; the box then runs <code>next-round.js</code>.</p>' +
      '<button id="dl">⬇ Download log</button><button id="again">↻ Play again</button>');
    $('dl').onclick = function () { var b = new Blob([JSON.stringify(dlData, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('again').onclick = function () { location.reload(); };
  }
  function pause() { if (phase !== 'run') return; phase = 'paused'; if (drag && wave) { drag = null; wave.release(); } S.event('pause', {}); show('<h2>Paused</h2><button id="res">▶ Resume</button>'); $('res').onclick = function () { hide(); S.event('resume', {}); phase = 'run'; last = performance.now(); }; }
  window.__parcelsState = function () { return wave ? wave.state() : null; };
  var STEP = 1000 / 60;
  function loop(t) { var d = Math.min(100, t - last); last = t;
    if (phase === 'run' && wave) { acc += d * FAST; while (acc >= STEP && phase === 'run') { acc -= STEP; if (SIM) bot.act(wave); wave.step(STEP); if (wave.done()) { endWave(); break; } } if (phase === 'run') draw(); }
    requestAnimationFrame(loop); }
  addEventListener('keydown', function (e) { if (e.key === 'p' || e.key === 'Escape') pause(); });
  $('bp').onclick = pause; document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  function j(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  j('rounds/index.json').then(function (ix) { var id = (Q.get('round') || (ix && ix.current) || 'round-001').replace(/[^\w-]/g, ''); return j('rounds/' + id + '.json'); }).then(function (r) {
    if (!r) { show('<h2>Round not found</h2>'); return; } round = r; P = E.merge(r.tuning); pl = r.parcels.map(function (p) { return p.anchor && r.reference && r.reference[p.id] ? Object.assign({}, p, { anchorBin: r.reference[p.id] }) : p; });
    qList = (r.abQuestions || []).slice(0, P.waves.length - 1); $('wt').textContent = P.waves.length; buildZones(); requestAnimationFrame(function (t) { last = t; loop(t); });
    var mins = Math.round((P.waves.reduce(function (a, w) { return a + w.durationMs + 3000; }, 0) + qList.length * 20000) / 60000 + 0.5);
    show('<h2>📦 Parcel Panic</h2><p>One parcel at a time drifts onto the field. <b>Drag it</b> (finger anywhere on the field) and let go before its timer runs out.</p>' +
      '<p style="text-align:left;font-size:13px">◀ <b>left = act now</b> · <b>right = not now</b> ▶<br>▲ <b>up = worth it</b> · <b>down = noise</b> ▼<br>Corners: ↩️ Reply, ⏰ Later; middle-left ❓ Needs info, middle-right 🗄️ Archive; bottom 🚫 Spam.<br>Not sure? Only commit on the axis you are sure of; the other can stay near the middle and still counts.</p>' +
      '<p>' + P.waves.length + ' calm waves, ~6 s per parcel at first, a little less later, with a quick A/B question between waves (~' + mins + ' min).</p><p style="font-size:12px;color:#aaa">Round <b>' + esc(r.roundId) + '</b>' + (r.sim ? ' (sim)' : '') + ' · ' + r.parcels.length + ' fictional parcels · ' + Object.keys(r.models || {}).length + ' local models pre-sorted them blind.' + (SIM ? ' <span class="sim">SIM MODE</span>' : '') + ' <a href="classic.html">Classic v1</a></p><button id="go">▶ Start</button>');
    $('go').onclick = start; if (SIM) setTimeout(start, 50);
  });
})();
