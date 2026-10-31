/* Parcel Panic v2 page ("field"): one parcel at a time drifts in; drag it anywhere on the 2D field (axes.js) before its
   countdown ends. Relative drag: put a finger anywhere on the field and the parcel moves with it 1:1 (no need to hit the card),
   touch-action:none + pointer capture so the page never scrolls; navigator.vibrate pulse when entering a strong zone (Android).
   ?round=<id>, ?sim=1&skill=good&fast=8&seed=1 (bot, run.type sim). ?v=1 -> classic.html (v1). */
(function () {
  var Q0 = new URLSearchParams(location.search), BINMODE = Q0.get('v') === '2', HAND = !BINMODE && Q0.get('mode') === 'handling', E = BINMODE ? ParcelEngine2 : HAND ? ParcelEngine2.make(ParcelHandling, '0.4.0', 4, 'handling') : ParcelEngine2.make(ParcelPriority, '0.4.0', 4, 'priority'), A = E.AXES, LEDGER = null, Q = new URLSearchParams(location.search), SIM = Q.get('sim') === '1', FAST = SIM ? Math.max(1, +(Q.get('fast') || 8)) : 1;
  var $ = function (id) { return document.getElementById(id); }, esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var LS = SIM ? 'parcels.simlogs.v1' : 'parcels.logs.v1', COL = { recruiter: '#5bd', 'job-board': '#7c6', github: '#aaa', service: '#c9c', marketing: '#e75', collaborator: '#fd5', invoice: '#6cf', newsletter: '#9a7' };
  var EMO = { reply: '↩️', info: '❓', later: '⏰', archive: '🗄️', spam: '🚫' }, round, P, pl, S, wave, wi = 0, qi = 0, phase = 'intro', last = 0, acc = 0, bot, rng, total = 0, best = 0, dlData, qList = [], shownId = null, drag = null, lastZone = null;
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function show(h) { $('ov').innerHTML = '<div class="box">' + h + '</div>'; $('ov').classList.remove('hide'); } function hide() { $('ov').classList.add('hide'); }
  function pop(t, c) { var p = $('pop'); p.textContent = t; p.style.color = c || '#fd8'; p.style.opacity = 1; clearTimeout(pop.t); pop.t = setTimeout(function () { p.style.opacity = 0; }, 550); }
  function label(b) { var x = round.bins.filter(function (z) { return z.id === b; })[0]; return x ? x.label : b; }
  function buildZones() { if (HAND) { $('axL').textContent = '◀ best automated'; $('axR').textContent = 'best reviewed ▶'; $('axT').textContent = '▲ high spend (relative)'; $('axB').textContent = 'low spend ▼'; $('foot').innerHTML = 'Handling (assessment only). <a href="./">Priority</a> · <a href="?v=2">Bins v2</a> · <a href="classic.html">Classic v1</a>';
      $('zones').innerHTML = Object.keys(A.QUADS).map(function (k) { var z = A.QUADS[k]; return '<div class="zl" data-b="' + k + '" style="left:' + ((z.x + 1) * 50) + '%;top:' + ((1 - z.y) * 50) + '%"><span class="e">' + z.emoji + '</span>' + esc(z.label) + '</div>'; }).join('') +
        A.TIERS.map(function (t, i) { var mid = (i * 25 + 12.5); return '<span class="ax tier" style="left:4px;top:' + (100 - mid) + '%">' + esc(t.label) + '</span>'; }).join('') + '<span class="ax tier" style="right:4px;top:22%;text-align:right">reserve for<br>later agent work</span>';
      $('field').classList.add('prio'); return; }
    if (!BINMODE) { $('field').classList.add('prio'); $('zones').innerHTML = Object.keys(A.QUADS).map(function (k) { var z = A.QUADS[k]; return '<div class="zl" data-b="' + k + '" style="left:' + ((z.x + 1) * 50) + '%;top:' + ((1 - z.y) * 50) + '%"><span class="e">' + z.emoji + '</span>' + esc(z.label) + '</div>'; }).join(''); return; }
    $('axL').textContent = '◀ act now'; $('axR').textContent = 'not now ▶'; $('axT').textContent = '▲ worth it'; $('axB').textContent = 'noise ▼'; $('foot').innerHTML = 'Bins v2. <a href="./">Priority (default)</a> · <a href="classic.html">Classic v1</a>'; $('zones').innerHTML = Object.keys(A.ZONES).map(function (b) { var z = A.ZONES[b]; return '<div class="zl" data-b="' + b + '" style="left:' + ((z.x + 1) * 50) + '%;top:' + ((1 - z.y) * 50) + '%"><span class="e">' + EMO[b] + '</span>' + esc(label(b)) + '</div>'; }).join(''); }
  function onEv(type, d) {
    if (type === 'sort') { S.event('sort', { parcelId: d.parcelId, x: d.x, y: d.y, bin: d.bin, priority: d.priority, conf: d.conf, sortMs: d.sortMs, timedOut: d.timedOut }); pop((d.conf < 0.25 ? 'undecided +' : '+') + d.points + (d.combo > 2 ? '  ×' + d.combo : ''), d.conf < 0.25 ? '#aaa' : d.combo > 4 ? '#7f7' : '#fd8'); drag = null; }
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
      if (HAND) { $('read').textContent = D ? (D.confX >= 0.3 ? (c.x < 0 ? 'automated ' : 'manual ') + Math.round(D.confX * 100) + '%' : 'auto/manual? unsure') + ' · spend ' + Math.round(D.spend) + (D.confY < 0.3 ? ' (unsure)' : '') + ' → ' + A.tierLabel(D.tier) : 'Drag anywhere on the field · let go to drop'; }
      else if (!BINMODE) { $('read').textContent = D ? (D.confX >= 0.3 ? (c.x < 0 ? 'now ' : 'can wait ') + Math.round(D.confX * 100) + '%' : 'urgency? unsure') + ' · ' + (D.confY >= 0.3 ? (c.y > 0 ? 'matters ' : 'low value ') + Math.round(D.confY * 100) + '%' : 'importance? unsure') + ' → priority ' + Math.round(D.priority) + ' · ' + A.QUADS[D.quadrant].label : 'Drag anywhere on the field · let go to drop'; }
      else $('read').textContent = D ? (D.confX >= 0.3 ? (c.x < 0 ? 'act now ' : 'not now ') + Math.round(D.confX * 100) + '%' : 'now? undecided') + ' · ' + (D.confY >= 0.3 ? (c.y > 0 ? 'worth it ' : 'noise ') + Math.round(D.confY * 100) + '%' : 'worth? undecided') + ' → ' + label(D.bin) + ' ' + Math.round(D.pTop * 100) + '%' : 'Drag anywhere on the field · let go to drop'; }
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
    var seed = SIM ? +(Q.get('seed') || 1) : (Date.now() % 1e9); rng = mulberry(seed);
    if (SIM) bot = ParcelBot.createField(Q.get('skill') || 'good', rng, A);
    S = ParcelSession.create({ runType: SIM ? 'sim' : 'human', seed: seed, gameVersion: E.GAME_VERSION, iteration: E.ITERATION, device: { ua: navigator.userAgent, w: innerWidth, h: innerHeight, touch: 'ontouchstart' in window }, player: SIM ? { bot: 'ParcelBot.field', skill: bot.skill } : {}, tuningSource: 'round:' + round.roundId }, round, { mode: E.MODE, axesVersion: A.VERSION });
    src = ParcelEngine.source(HAND ? hl : pl, rng); hide(); beginWave();
  }
  var src, hl = [];
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
  function planHtml(sum) { if (!sum.plan) return ''; var P0 = {}; hl.forEach(function (p) { P0[p.id] = p; });
    return '<h3 style="margin:8px 0 2px">Your handling plan</h3><div style="font-size:12px;color:#aaa">Budget pool: automated ' + sum.budgetPool.automatedShare + '% · manual-review reserve ' + sum.budgetPool.manualReserveShare + '% (assessment only, nothing runs)</div><div class="q">' + sum.plan.map(function (q) { var p = P0[q.parcelId] || {}; return '<div><b>' + q.budgetShare + '%</b><span>' + A.QUADS[q.quadrant].emoji + ' ' + esc(p.subject || q.parcelId) + ' <span style="color:#889">· ' + esc(A.tierLabel(q.tier)) + ' · auto ' + Math.round(q.automation) + '</span></span></div>'; }).join('') + '</div>'; }
  function ledgerHtml(d) { if (!LEDGER || !window.ParcelLedger) return ''; var LG = ParcelLedger, mode = HAND ? 'handling' : 'priority', all = []; S.waves.forEach(function (w) { all = all.concat(w.decisions); });
    var ev = {}; all.forEach(function (x) { if (x.missed) return; (ev[x.parcelId] = ev[x.parcelId] || []).push({ mode: mode, by: 'human', x: x.x, y: x.y, quadrant: x.quadrant, conf: x.conf }); });
    var c0 = LG.counts(LEDGER, mode), rows = [], after = { settled: 0, open: 0, 'manual-review': 0 }, P0 = {}; (HAND ? hl : round.parcels).forEach(function (p) { P0[p.id] = p; });
    Object.keys(ev).forEach(function (id) { var prev = (LEDGER.parcels[id] && LEDGER.parcels[id].evals) || [], b = LG.status(prev, mode), a = LG.status(prev.concat(ev[id]), mode); after[a.state] = (after[a.state] || 0) + 1; rows.push({ id: id, b: b, a: a }); });
    rows.sort(function (x, y) { return y.a.streak - x.a.streak; });
    return '<h3 style="margin:8px 0 2px">Consistency ledger (' + mode + ')</h3><div style="font-size:12px;color:#aaa">Before this run: ' + c0.settled + ' settled · ' + c0.open + ' unsettled · ' + c0['manual-review'] + ' manual review. This run (preview, applied when the log is graded): ' + (after.settled || 0) + ' settled · ' + (after.open || 0) + ' unsettled · ' + (after['manual-review'] || 0) + ' manual review. Rule: 3 consistent drops in a row (same quadrant, within ' + LG.RULE.maxDist * 50 + ' pts, not undecided); ' + LG.RULE.maxTries + ' tries without that → manual review.</div><div class="q">' +
      rows.map(function (r) { var p = P0[r.id] || {}; return '<div><b>' + r.a.streak + '/3</b><span>' + (r.a.state === 'settled' ? '✅ ' : r.a.state === 'manual-review' ? '🧑‍⚖️ ' : '🔁 ') + esc(p.subject || r.id) + ' <span style="color:#889">· was ' + r.b.streak + '/3, tries ' + r.a.tries + '</span></span></div>'; }).join('') + '</div>'; }
  function queueHtml(sum) { if (!sum.queue) return ''; var P0 = {}; round.parcels.forEach(function (p) { P0[p.id] = p; });
    return '<h3 style="margin:8px 0 2px">Your queue</h3><div class="q">' + sum.queue.map(function (q) { var p = P0[q.parcelId] || {}; return '<div><b>' + Math.round(q.priority) + '</b><span>' + A.QUADS[q.quadrant].emoji + ' ' + esc(p.subject || q.parcelId) + ' <span style="color:#889">· ' + esc(p.sender || '') + '</span></span></div>'; }).join('') + '</div>'; }
  function summary() {
    phase = 'summary'; var sum = ParcelSession.summarize(S.waves, total, best, qi), d = S.finish(sum); d.qualities = Qualities.compute(d); dlData = d; window.__parcelsLog = d;
    try { var o = JSON.parse(localStorage.getItem(LS) || '{}'); o[d.run.id] = d; localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { }
    var name = (SIM ? 'sim' : 'human') + '-parcels-' + round.roundId + '-' + d.run.id + '.json';
    show('<h2>' + (SIM ? '<span class="sim">SIM</span> ' : '') + '📦 Round done</h2><table><tr><td>Score</td><td class="k">' + total + '</td></tr><tr><td>Placed</td><td>' + sum.sorted + ' / ' + sum.parcels + '</td></tr><tr><td>Missed</td><td>' + sum.misses + '</td></tr><tr><td>Partial (one clear axis)</td><td>' + (sum.partial || 0) + '</td></tr><tr><td>Undecided (middle)</td><td>' + (sum.middle || 0) + '</td></tr><tr><td>Mean confidence</td><td>x ' + (sum.meanConfX || 0) + ' · y ' + (sum.meanConfY || 0) + '</td></tr><tr><td>Round</td><td>' + esc(round.roundId) + (round.sim ? ' (sim)' : '') + '</td></tr></table>' + (sum.queue ? '' : '') + Qualities.html(d.qualities) + queueHtml(sum) + planHtml(sum) + ledgerHtml(d) +
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
    if (!r) { show('<h2>Round not found</h2>'); return; } round = r; j('data/parcel-ledger.json').then(function (x) { LEDGER = x; });
    hl = (r.handling && r.handling.parcels && r.handling.parcels.length ? r.handling.parcels : r.parcels).map(function (p) { return Object.assign({}, p); }); P = E.merge(r.tuning); pl = r.parcels.map(function (p) { return p.anchor && r.reference && r.reference[p.id] ? Object.assign({}, p, { anchorBin: r.reference[p.id] }) : p; });
    qList = (r.abQuestions || []).slice(0, P.waves.length - 1); $('wt').textContent = P.waves.length; buildZones(); requestAnimationFrame(function (t) { last = t; loop(t); });
    var mins = Math.round((P.waves.reduce(function (a, w) { return a + w.durationMs + 3000; }, 0) + qList.length * 20000) / 60000 + 0.5);
    show('<h2>📦 Parcel Panic</h2><p>One parcel at a time drifts onto the field. <b>Drag it</b> (finger anywhere on the field) and let go before its timer runs out.</p>' +
      (HAND ? '<p style="text-align:left;font-size:13px"><b>Handling</b> (assessment only, nothing runs): the important parcels you ranked 🔥 Handle first / 📅 Schedule, highest priority first' + (r.handling ? ' (' + r.handling.parcels.length + ')' : ' (no handling list in this round: all parcels)') + '.<br>◀ <b>left = best automated</b> · <b>right = best manually reviewed</b> ▶<br>▲ <b>up = more budget</b> · <b>down = less</b> ▼, relative to the other parcels.<br>Automated tiers by spend: local Ollama < OpenCode free < Codex < Grok Build. On the review side the spend is a reserve for later agentic work if it becomes relevant.<br>At the end: your handling plan as shares of a budget pool.</p>' : BINMODE ? '<p style="text-align:left;font-size:13px">◀ <b>left = act now</b> · <b>right = not now</b> ▶<br>▲ <b>up = worth it</b> · <b>down = noise</b> ▼<br>Corners: ↩️ Reply, ⏰ Later; middle-left ❓ Needs info, middle-right 🗄️ Archive; bottom 🚫 Spam.</p>'
        : '<p style="text-align:left;font-size:13px">This is about <b>priority</b>, not what to do with it.<br>◀ <b>left = now</b> (urgent) · <b>right = can wait</b> ▶<br>▲ <b>up = matters</b> · <b>down = low value</b> ▼<br>🔥 Handle first · 📅 Schedule · 👀 Quick skim · 💤 Deprioritise.<br>Unsure on one scale? Leave it near the middle line; only the scale you are sure of counts strongly. At the end you get your priority queue.</p>') +
      (HAND ? '' : '<p style="font-size:12px"><a href="?mode=handling">→ Handling stage</a> for the important ones</p>') + '<p>' + P.waves.length + ' calm waves, ~6 s per parcel at first, a little less later, with a quick A/B question between waves (~' + mins + ' min).</p><p style="font-size:12px;color:#aaa">Round <b>' + esc(r.roundId) + '</b>' + (r.sim ? ' (sim)' : '') + ' · ' + r.parcels.length + ' fictional parcels · ' + Object.keys(r.models || {}).length + ' local models pre-sorted them blind.' + (SIM ? ' <span class="sim">SIM MODE</span>' : '') + ' <a href="classic.html">Classic v1</a></p><button id="go">▶ Start</button>');
    $('go').onclick = start; if (SIM) setTimeout(start, 50);
  });
})();
