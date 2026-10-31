/* Parcel Panic page: waves of falling inbox-like parcels -> sort into bins; between waves one A/B summary-style question.
   ?round=<id> (default rounds/index.json current), ?sim=1&skill=good&fast=8 (bot, run.type sim). Model labels in the round file are never shown. */
(function () {
  var E = ParcelEngine, Q = new URLSearchParams(location.search), SIM = Q.get('sim') === '1', FAST = SIM ? Math.max(1, +(Q.get('fast') || 8)) : 1;
  var $ = function (id) { return document.getElementById(id); }, esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var LS = SIM ? 'parcels.simlogs.v1' : 'parcels.logs.v1', COL = { recruiter: '#5bd', 'job-board': '#7c6', github: '#aaa', service: '#c9c', marketing: '#e75', collaborator: '#fd5', invoice: '#6cf', newsletter: '#9a7' };
  var round, P, plan, pl, S, wave, wi = 0, qi = 0, phase = 'intro', last = 0, acc = 0, bot, rng, total = 0, best = 0, cards = {}, dlData, qList = [];
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function show(h) { $('ov').innerHTML = '<div class="box">' + h + '</div>'; $('ov').classList.remove('hide'); } function hide() { $('ov').classList.add('hide'); }
  function pop(t, c) { var p = $('pop'); p.textContent = t; p.style.color = c || '#fd8'; p.style.opacity = 1; clearTimeout(pop.t); pop.t = setTimeout(function () { p.style.opacity = 0; }, 450); }
  function buildBins() { $('bins').innerHTML = round.bins.map(function (b) { return '<button data-b="' + b.id + '"><span class="e">' + b.emoji + '</span>' + esc(b.label) + '<small>' + (b.swipe ? { right: '→', left: '←', up: '↑', down: '↓' }[b.swipe] + ' · ' : '') + b.key + '</small></button>'; }).join('');
    [].forEach.call($('bins').querySelectorAll('button'), function (el) { el.addEventListener('pointerdown', function (e) { e.preventDefault(); choose(el.getAttribute('data-b')); }); }); }
  function choose(b) { if (phase !== 'run' || !wave) return; wave.choose(b); }
  function onEv(type, d) {
    if (type === 'sort') { S.event('sort', { parcelId: d.parcelId, bin: d.bin, sortMs: d.sortMs, changedMind: d.changedMind, speed: d.speed }); pop('+' + d.points + (d.combo > 2 ? '  combo ×' + d.combo : ''), d.combo > 4 ? '#7f7' : '#fd8'); }
    else if (type === 'miss') { S.event('miss', { parcelId: d.parcelId, speed: d.speed }); pop('missed!', '#e55'); $('belt').classList.add('flash'); setTimeout(function () { $('belt').classList.remove('flash'); }, 200); }
    else if (type === 'spawn') S.event('spawn', d); else if (type === 'change_mind') S.event('change_mind', d);
  }
  function draw() {
    if (!wave) return; var st = wave.state(), H = $('belt').clientHeight, seen = {};
    st.active.forEach(function (a, i) { var el = cards[a.p.id]; seen[a.p.id] = 1;
      if (!el) { el = cards[a.p.id] = document.createElement('div'); el.className = 'card'; el.style.borderLeftColor = COL[a.p.senderType] || '#888';
        el.innerHTML = '<div class="s">' + esc(a.p.sender) + (a.p.badge ? '<span class="bd">' + esc(a.p.badge) + '</span>' : '') + '</div><div class="h">' + esc(a.p.subject) + '</div><div class="n">' + esc(a.p.snippet) + '</div><div class="arm"></div>'; $('belt').appendChild(el); }
      el.style.top = Math.round(a.y * (H - 70) - 10) + 'px'; el.classList.toggle('tg', i === 0); el.querySelector('.arm').textContent = i === 0 && st.pending ? '→ ' + st.pending.bin + (st.pending.changes.length > 1 ? ' (changed)' : '') : ''; });
    Object.keys(cards).forEach(function (k) { if (!seen[k]) { cards[k].remove(); delete cards[k]; } });
    [].forEach.call($('bins').querySelectorAll('button'), function (b) { b.classList.toggle('on', !!(st.pending && st.pending.bin === b.getAttribute('data-b'))); });
    $('sc').textContent = total + st.score; $('cb').textContent = st.combo; $('sp').textContent = st.speed.toFixed(2);
  }
  function start() {
    var seed = SIM ? +(Q.get('seed') || 1) : (Date.now() % 1e9); rng = mulberry(seed); if (SIM) bot = ParcelBot.create(Q.get('skill') || 'good', rng);
    S = ParcelSession.create({ runType: SIM ? 'sim' : 'human', seed: seed, device: { ua: navigator.userAgent, w: innerWidth, h: innerHeight, touch: 'ontouchstart' in window }, player: SIM ? { bot: 'ParcelBot', skill: bot.skill } : {}, tuningSource: 'round:' + round.roundId }, round);
    plan = E.source(pl, rng); hide(); beginWave();
  }
  function beginWave() { var w = P.waves[wi]; wave = E.createWave(plan, w, P, { onEvent: onEv }); S.startWave(P, wi, w); $('wv').textContent = wi + 1; phase = 'countdown';
    var n = 3, el = $('cd'); el.classList.remove('hide'); el.textContent = 'Wave ' + (wi + 1); var iv = setInterval(function () { n--; if (n > 0) el.textContent = n; else { clearInterval(iv); el.classList.add('hide'); phase = 'run'; last = performance.now(); acc = 0; } }, 700 / FAST); }
  function endWave() { phase = 'between'; var st = wave.state(); total += st.score; best = Math.max(best, st.bestCombo); S.endWave(wi, st); Object.keys(cards).forEach(function (k) { cards[k].remove(); delete cards[k]; });
    wi++; if (wi >= P.waves.length) return summary(); if (qi < qList.length) ask(st); else beginWave(); }
  function ask(st) {
    phase = 'question'; var q = qList[qi], p = round.parcels.filter(function (x) { return x.id === q.parcelId; })[0], sw = rng() < 0.5, L = sw ? q.b : q.a, R = sw ? q.a : q.b, t0 = performance.now();
    S.startQuestion(q, qi);
    show((SIM ? '<span class="sim">SIM</span> ' : '') + '<div style="color:#aaa;font-size:13px">Wave ' + wi + ' done · ' + st.decisions.filter(function (d) { return !d.missed; }).length + ' sorted, ' + st.misses + ' missed, best combo ' + st.bestCombo + '</div><h3>' + esc(q.criterion) + '</h3>' +
      '<div class="card" style="position:static;width:100%;margin:6px 0;border-left-color:' + (COL[p.senderType] || '#888') + '"><div class="s">' + esc(p.sender) + '</div><div class="h">' + esc(p.subject) + '</div><div class="n">' + esc(p.snippet) + '</div></div>' +
      '<button class="ab" data-c="A">A · <b>' + esc(L.text) + '</b></button><button class="ab" data-c="B">B · <b>' + esc(R.text) + '</b></button><button data-c="neither" style="background:#444">Neither helps</button>' +
      '<p style="font-size:11px;color:#888">Two summary styles written by two local models (which is which stays hidden).</p>');
    [].forEach.call($('ov').querySelectorAll('[data-c]'), function (b) { b.onclick = function () { var d = ParcelSession.abDecision(q, b.getAttribute('data-c'), sw, (performance.now() - t0) * FAST, SIM ? 'sim:shorter-bias' : 'human');
      S.event('ab_decision', { pairId: q.id, choice: d.choice }); S.endQuestion(q, d); qi++; hide(); beginWave(); }; });
    if (SIM) setTimeout(function () { var c = bot.abChoose({ a: L, b: R }); $('ov').querySelector('[data-c="' + c + '"]').click(); }, 1500 / FAST);
  }
  function summary() {
    phase = 'summary'; var all = []; S.waves.forEach(function (w) { all = all.concat(w.decisions); }); var sorted = all.filter(function (d) { return !d.missed; });
    var sum = { score: total, bestCombo: best, parcels: all.length, sorted: sorted.length, misses: all.length - sorted.length, changedMind: all.filter(function (d) { return d.changedMind; }).length, abAnswered: qi, bins: {} };
    sorted.forEach(function (d) { sum.bins[d.bin] = (sum.bins[d.bin] || 0) + 1; });
    var d = S.finish(sum); d.qualities = Qualities.compute(d); dlData = d; window.__parcelsLog = d; try { var o = JSON.parse(localStorage.getItem(LS) || '{}'); o[d.run.id] = d; localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { }
    var name = (SIM ? 'sim' : 'human') + '-parcels-' + round.roundId + '-' + d.run.id + '.json';
    show('<h2>' + (SIM ? '<span class="sim">SIM</span> ' : '') + '📦 Round done</h2><table><tr><td>Score</td><td class="k">' + total + '</td></tr><tr><td>Sorted</td><td>' + sum.sorted + ' / ' + sum.parcels + '</td></tr><tr><td>Missed</td><td>' + sum.misses + '</td></tr><tr><td>Changed mind</td><td>' + sum.changedMind + '</td></tr><tr><td>Best combo</td><td>' + best + '</td></tr><tr><td>Round</td><td>' + esc(round.roundId) + (round.sim ? ' (sim)' : '') + '</td></tr></table>' + Qualities.html(d.qualities) +
      '<p style="font-size:12px;color:#aaa">Your sorts now grade the local models that pre-sorted these parcels blind. ' + (SIM ? 'SIMULATED run, never used for the human leaderboard. ' : '') + 'Download the log and upload it to <code>logs/human/</code> on GitHub; then the box runs <code>next-round.js</code> to score the models and have them write the next round.</p>' +
      '<button id="dl">⬇ Download log</button><button id="again">↻ Play again</button>');
    $('dl').onclick = function () { var b = new Blob([JSON.stringify(dlData, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('again').onclick = function () { location.reload(); };
  }
  function pause() { if (phase !== 'run') return; phase = 'paused'; S.event('pause', {}); show('<h2>Paused</h2><button id="res">▶ Resume</button>'); $('res').onclick = function () { hide(); S.event('resume', {}); phase = 'run'; last = performance.now(); }; }
  var STEP = 1000 / 60;
  function loop(t) { var d = Math.min(100, t - last); last = t;
    if (phase === 'run' && wave) { acc += d * FAST; while (acc >= STEP && phase === 'run') { acc -= STEP; if (SIM) { var b = bot.decide(wave); if (b) wave.choose(b); } wave.step(STEP); if (wave.done()) { endWave(); break; } } draw(); }
    requestAnimationFrame(loop); }
  // swipe on the belt acts on the glowing (lowest) parcel
  var sw0 = null; $('belt').addEventListener('pointerdown', function (e) { sw0 = { x: e.clientX, y: e.clientY }; });
  $('belt').addEventListener('pointerup', function (e) { if (!sw0) return; var dx = e.clientX - sw0.x, dy = e.clientY - sw0.y; sw0 = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), b = round.bins.filter(function (x) { return x.swipe === dir; })[0]; if (b) choose(b.id); });
  addEventListener('keydown', function (e) { var b = round && round.bins.filter(function (x) { return x.key === e.key; })[0]; if (b) choose(b.id); else if (e.key === 'p' || e.key === 'Escape') pause(); });
  $('bp').onclick = pause; document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  function j(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  j('rounds/index.json').then(function (ix) { var id = (Q.get('round') || (ix && ix.current) || 'round-001').replace(/[^\w-]/g, ''); return j('rounds/' + id + '.json'); }).then(function (r) {
    if (!r) { show('<h2>Round not found</h2>'); return; } round = r; P = E.merge(r.tuning); pl = r.parcels.map(function (p) { return p.anchor && r.reference && r.reference[p.id] ? Object.assign({}, p, { anchorBin: r.reference[p.id] }) : p; });
    qList = (r.abQuestions || []).slice(0, P.waves.length - 1); $('wt').textContent = P.waves.length; buildBins(); requestAnimationFrame(function (t) { last = t; loop(t); });
    var mins = Math.round((P.waves.reduce(function (a, w) { return a + w.durationMs + 3000; }, 0) + qList.length * 15000) / 60000 + 0.5);
    show('<h2>📦 Parcel Panic</h2><p>Parcels pour down the belt. Sort the <span class="k">glowing</span> one before it drops off: <b>Reply</b>, <b>Archive</b>, <b>Later</b>, <b>Needs info</b> or <b>Spam</b>. Sort the way <i>you</i> would triage your own inbox; there is no wrong bin, but missed parcels break your combo.</p>' +
      '<p>' + P.waves.length + ' waves, faster each time, with a quick A/B question in between (~' + mins + ' min).</p><p style="font-size:12px;color:#aaa">Round <b>' + esc(r.roundId) + '</b>' + (r.sim ? ' (sim)' : '') + ' · ' + r.parcels.length + ' fictional parcels · ' + Object.keys(r.models || {}).length + ' local models pre-sorted them blind; your sorts grade them.' + (SIM ? ' <span class="sim">SIM MODE</span>' : '') + '</p><button id="go">▶ Start</button>');
    $('go').onclick = start; if (SIM) setTimeout(start, 50);
  });
})();
