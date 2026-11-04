/* Lo Preferences page: setup -> (30 s Lynx Dash run -> one preference card) x N -> results/export. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, Q = new URLSearchParams(location.search), LS = 'lo-prefs.settings.v1', LSR = 'lo-prefs.results.v1', LSL = 'lo-prefs.ledger.v1', mode = null;
  var FAST = Math.max(1, +(Q.get('fast') || 1)), QSEG = Q.get('segment'), SEG = +(QSEG || 30) * 1000, DATA, cfg, sess, g, timer, phase = 'setup', planned = 0, cur = null, input = { jump: false, duck: false }, last = 0, acc = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(h) { $('box').innerHTML = h; $('ov').classList.remove('hide'); } function hide() { $('ov').classList.add('hide'); }
  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch (e) { } }
  function ledger() { try { return JSON.parse(localStorage.getItem(LSL)) || Prefs.emptyLedger(); } catch (e) { return Prefs.emptyLedger(); } }
  function saveLedger(l) { delete l.added; try { localStorage.setItem(LSL, JSON.stringify(l)); } catch (e) { } }
  function ladderHtml() { var st = Prefs.standings(DATA, ledger()), n = ledger().sessions.length;
    return '<h3>🪜 Project ladder <span class="small">(' + n + ' session' + (n === 1 ? '' : 's') + ')</span></h3><div id="ladder">' + st.map(function (s) {
      return '<div class="lrow' + (s.crossed ? ' lx' : '') + '"><span class="ln">' + (s.crossed ? '⭐ ' : '') + esc(s.name) + '</span><span class="small"> ' + (s.score > 0 ? '+' : '') + s.score + '/' + s.minScore + ' · ' + s.upSessions + '/' + s.minUpSessions + ' sessions</span>' +
        (s.crossed && s.decisions ? ' <button class="dr small" data-a="' + esc(s.id) + '">Decision round</button>' : '') + '<div class="lb"><div style="width:' + Math.round(s.progress * 100) + '%"></div></div></div>'; }).join('') + '</div>' +
      '<button id="imp">⬆ Import JSON</button><input id="impf" type="file" accept=".json,application/json" multiple class="hide"><span id="impm" class="small"></span>'; }
  function bindLadder() { document.querySelectorAll('.dr').forEach(function (b) { b.onclick = function () { decision(b.dataset.a); }; });
    $('imp').onclick = function () { $('impf').click(); };
    $('impf').onchange = function () { var fs = [].slice.call(this.files), tot = 0, bad = 0, n = fs.length; if (!n) return;
      fs.forEach(function (f) { var rd = new FileReader(); rd.onload = function () { try { var l = Prefs.mergeLedger(ledger(), Prefs.importSessions(DATA, JSON.parse(rd.result))); tot += l.added; saveLedger(l); } catch (e) { bad++; }
        if (--n === 0) { var m = 'Imported ' + tot + ' new session(s)' + (bad ? ', ' + bad + ' file(s) unreadable' : ''); if (phase === 'setup') setup(); else results(window.__LO_RESULT, true); if ($('impm')) $('impm').textContent = m; } }; rd.readAsText(f); }); }; }
  var COST = function () { var c = {}; (DATA.executors || []).forEach(function (x) { c[x.id] = x.cost || 0; }); return c; };
  function sliders() { var nW = Prefs.dataLevels(DATA).length, nC = (DATA.costLevels || []).length || 5;
    return '<div class="sl"><label>Casual <input type="range" id="dl" min="1" max="' + nW + '" step="1" value="' + cfg.dataLevel + '"> Actual data</label><div id="dlx" class="small"></div>' +
      '<label>Cheaper <input type="range" id="cl" min="1" max="' + nC + '" step="1" value="' + cfg.costLevel + '"> More expensive</label><div id="clx" class="small"></div></div>'; }
  function sliderText() { var W = Prefs.dataLevels(DATA), S = DATA.dataStrict || {}, L = cfg.dataLevel, from = S.fromLevel || W.length - 1, names = DATA.dataLevels || [];
    $('dlx').textContent = L + '/' + W.length + ' ' + (names[L - 1] || '') + ' — counts ×' + W[L - 1] + ' in the ladder' + (L >= from ? '; only if performance ≥ ' + Math.round((S.minPerformance || 0.8) * 100) + '%' : '');
    var C = DATA.costLevels || [], c = C[cfg.costLevel - 1] || {}; $('clx').textContent = cfg.costLevel + '/' + C.length + ' ' + (c.text || '') + ' (executor cost ≤ ' + c.maxCost + ')';
    var cost = COST(); document.querySelectorAll('.ex').forEach(function (x) { var ob = cost[x.dataset.x] > c.maxCost, lb = x.parentNode; lb.classList.toggle('ob', ob); lb.title = ob ? 'over budget at this cost level (still ticked, but not in allowedExecutors)' : ''; }); }
  function decision(id) { mode = { mode: 'decision', area: id }; cfg = cfg || {}; start(); }
  function setup() {
    mode = null;
    phase = 'setup'; var s = load(); cfg = { areas: s.areas || DATA.areas.filter(function (a) { return a.defaultOn !== false; }).map(function (a) { return a.id; }), minutes: s.minutes || 10, exec: Prefs.normExec(DATA, s.exec), dataLevel: s.dataLevel || 3, costLevel: s.costLevel || 3 };
    var EX = DATA.executors || [], AIDS = DATA.areas.map(function (a) { return a.id; });
    var cnt = {}; DATA.cards.forEach(function (c) { cnt[c.area] = (cnt[c.area] || 0) + 1; });
    show('<h2>🐾 Lo · Preferences</h2><p>Run with Lo. Every <span class="k">30 s (casual 1–2) or 15 s (levels 3–5)</span> of running, one card asks about a project area. Choosing the same preference <span class="k">' + (DATA.confirmAt || 3) + '×</span> marks it a <b>strong current preference</b>.</p>' + sliders() +
      '<h3>Project areas</h3>' + (EX.length ? '<div class="exm"><span class="small">Executors for all areas:</span> ' + EX.map(function (x) { return '<label><input type="checkbox" class="mx" data-x="' + esc(x.id) + '"> ' + esc(x.name) + '</label>'; }).join(' ') + '</div>' : '') +
      '<div id="areas">' + DATA.areas.map(function (a) { return '<div class="arow"><label class="area"><input type="checkbox" class="ac" value="' + esc(a.id) + '"' + (cfg.areas.indexOf(a.id) >= 0 ? ' checked' : '') + '> ' + esc(a.name) + ' <span class="small">(' + (cnt[a.id] || 0) + ' cards)</span></label><div class="exr">' +
        EX.map(function (x) { return '<label data-ob="over budget"><input type="checkbox" class="ex" data-a="' + esc(a.id) + '" data-x="' + esc(x.id) + '"' + (cfg.exec[a.id].indexOf(x.id) >= 0 ? ' checked' : '') + '> ' + esc(x.name) + '</label>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<button id="all">All</button><button id="none">None</button><h3>Game length</h3><div id="len">' + [5, 10, 15].map(function (m) { return '<label><input type="radio" name="len" value="' + m + '"' + (cfg.minutes === m ? ' checked' : '') + '> ' + m + ' min</label> '; }).join('') +
      '<label><input type="radio" name="len" value="custom"' + ([5, 10, 15].indexOf(cfg.minutes) < 0 ? ' checked' : '') + '> custom <input id="cust" type="number" min="1" max="120" style="width:60px" value="' + cfg.minutes + '"> min</label></div>' +
      '<p id="plan" class="small"></p><button id="go">▶ Run</button>' + (localStorage.getItem(LSR) ? ' <button id="prev">Last results</button>' : '') + ladderHtml()); bindLadder();
    function masters() { document.querySelectorAll('.mx').forEach(function (m) { var st = Prefs.masterState(cfg.exec, AIDS, m.dataset.x); m.checked = st === 'all'; m.indeterminate = st === 'mixed'; }); }
    function read() { document.querySelectorAll('.ex').forEach(function (x) { Prefs.setAll(cfg.exec, [x.dataset.a], x.dataset.x, x.checked); }); masters();
      cfg.areas = [].slice.call(document.querySelectorAll('#areas .ac:checked')).map(function (x) { return x.value; }); cfg.dataLevel = +$('dl').value; cfg.costLevel = +$('cl').value; SEG = QSEG ? +QSEG * 1000 : (cfg.dataLevel <= 2 ? 30000 : 15000); sliderText(); var r = document.querySelector('input[name=len]:checked').value; cfg.minutes = r === 'custom' ? Math.max(1, Math.min(120, +$('cust').value || 10)) : +r; save();
      planned = Prefs.cardsForMinutes(cfg.minutes, SEG / 1000); var pool = DATA.cards.filter(function (c) { return cfg.areas.indexOf(c.area) >= 0; }).length;
      $('plan').textContent = planned + ' cards (~' + cfg.minutes + ' min) from ' + pool + ' cards in ' + cfg.areas.length + ' areas' + (planned > pool ? ' — some cards repeat as confirmations' : ''); $('go').disabled = !pool; }
    $('box').onchange = function (e) { if (e.target.classList.contains('mx')) { var on = e.target.checked; document.querySelectorAll('.ex[data-x="' + e.target.dataset.x + '"]').forEach(function (x) { x.checked = on; }); } read(); }; $('dl').oninput = $('cl').oninput = read; $('cust').oninput = function () { document.querySelector('input[value=custom]').checked = true; read(); };
    $('all').onclick = function () { document.querySelectorAll('#areas .ac').forEach(function (x) { x.checked = true; }); read(); };
    $('none').onclick = function () { document.querySelectorAll('#areas .ac').forEach(function (x) { x.checked = false; }); read(); };
    if ($('prev')) $('prev').onclick = function () { results(JSON.parse(localStorage.getItem(LSR))); };
    $('go').onclick = start; read();
  }
  function start() {
    var dm = mode && mode.mode === 'decision'; sess = Prefs.create(DATA, dm ? { mode: 'decision', area: mode.area, executors: cfg.exec } : { areas: cfg.areas, executors: cfg.exec }); if (dm) planned = Math.max(planned, sess.pool.length * 2) || sess.pool.length * 2; g = RunnerEngine.create({ seed: Date.now() & 0xffff, params: { segmentMs: SEG } }); timer = SegTimer.create(SEG, card); stats = { distance: 0, idealDistance: 0, faced: 0, crashes: 0, activeMs: 0 }; idealT = 0;
    $('qt').textContent = planned; $('game').classList.remove('hide'); hide(); run();
  }
  function run() { phase = 'run'; timer.start(); }
  var stats = null, idealT = 0, gt = null, CD = +(Q.get('countdown') || 3000), GRACE = 300;
  function card() { var sg = g.endSegment(); stats.distance += sg.distance; stats.activeMs += sg.activeMs; stats.faced += sg.obstaclesFaced + sg.projectilesFaced; stats.crashes += sg.crashes; phase = 'count'; gt = Prefs.gate(CD, GRACE); show('<div id="cd" class="cd">' + gt.count() + '</div><p class="small" style="text-align:center">Next card…</p>'); }
  function gateTick(d) { if (!gt) return; gt.tick(d); if (phase === 'count') { if (gt.shown()) showCard(); else $('cd').textContent = gt.count(); } }
  function showCard() {
    phase = 'card'; cur = sess.next(); var c = cur.card, a = DATA.areas.find(function (x) { return x.id === c.area; }), h = '<p class="small">' + (sess.result().mode === 'decision' ? '🎯 Decision round · ' : '') + esc(a ? a.name : c.area) + ' · card ' + cur.seq + '/' + planned + '</p><h3>' + esc(c.prompt) + '</h3><div class="opts">';
    function st(key) { var s = sess.status(key); return s.count ? ' <span class="tag ' + (s.strong ? 'strong' : s.count === 2 ? 'p2' : '') + '">' + s.label + '</span>' : ''; }
    if (c.type === 'updown') { var kk = c.key || c.area, dd = !!c.key; h += '<button data-v="up">1 ⬆ ' + (dd ? 'Yes / now' : 'Up-prioritise') + st(kk + ':up') + '</button><button data-v="down">2 ⬇ ' + (dd ? 'No / wait' : 'Down-prioritise') + st(kk + ':down') + '</button>'; }
    else if (c.type === 'rate') h += '</div><div class="scale">' + (DATA.scale || [-2, -1, 0, 1, 2]).map(function (v, i) { return '<button data-v="' + v + '">' + (i + 1) + '<br>' + (v > 0 ? '+'.repeat(v) : v < 0 ? '−'.repeat(-v) : '0') + '</button>'; }).join('') + '</div><p class="small">' +
      ['+', '0', '-'].map(function (s) { var t = sess.status(c.aspect + ':' + s); return t.count ? s + ': ' + t.label : ''; }).filter(Boolean).join(' · ') + '</p><div>';
    else h += c.options.map(function (o, i) { return '<button data-v="' + i + '">' + (i + 1) + ' ' + esc(o.label) + st(o.pref) + '</button>'; }).join('');
    show(h + '</div><button data-v="skip" class="small">skip</button><p id="fb" class="small"></p>');
    document.querySelectorAll('#box [data-v]').forEach(function (b) { b.onclick = function () { pick(b.dataset.v); }; });
  }
  function pick(v) {
    if (phase !== 'card' || !gt || !gt.clickable()) return; var c = cur.card, ch = v === 'skip' ? 'skip' : c.type === 'updown' ? v : +v, e = sess.answer(cur, ch); phase = 'fb'; $('qn').textContent = e.seq;
    $('fb').innerHTML = e.pref ? (e.becameStrong ? '🔥 <b>Strong current preference!</b>' : e.status.indexOf('/') > 0 ? 'Noted (' + e.status + ')' : 'Still strong (' + e.status + ')') : 'Skipped';
    setTimeout(function () { if (e.seq >= planned) return results(); hide(); g.afterQuestion(); idealT *= g.P.speedKeepAfterQuestion; run(); }, 700 / Math.min(FAST, 4));
  }
  function results(r, keepLedger) {
    phase = 'done'; if (!r) { r = sess.result(); var pf = Prefs.performance(DATA, stats, r.log); r.dataWeight = Prefs.weighSession(DATA, cfg.dataLevel, pf); r.dataWeight.metrics = pf; r.settings = { dataLevel: cfg.dataLevel, costLevel: cfg.costLevel };
      r.costLevel = cfg.costLevel; r.costPlan = Prefs.costPlan(DATA, cfg.costLevel, r.executors); r.allowedExecutors = {}; Object.keys(r.costPlan.areas).forEach(function (a) { if (r.executors && r.executors[a]) r.allowedExecutors[a] = r.costPlan.areas[a].allowedExecutors; }); } var L = ledger(); if (!keepLedger && r.log) { L = Prefs.mergeLedger(L, [Prefs.sessionEntry(DATA, r)]); saveLedger(L); }
    r.ledger = { version: 1, sessions: L.sessions }; r.suggested = Prefs.suggested(DATA, L); r.standings = Prefs.standings(DATA, L).map(function (s) { return { id: s.id, score: s.score, upSessions: s.upSessions, crossed: s.crossed }; });
    try { localStorage.setItem(LSR, JSON.stringify(r)); } catch (e) { } var md = sess ? sess.markdown(r) : '';
    var an = function (id) { var a = DATA.areas.find(function (x) { return x.id === id; }); return a ? a.name : id; };
    show('<h2>' + (r.mode === 'decision' ? '🎯 Decision round: ' + esc(an(r.area)) : 'Results') + '</h2><p>' + r.answered + ' cards</p>' + (r.dataWeight ? '<div class="perf' + (r.dataWeight.counted ? '' : ' nc') + '">Performance <b>' + Math.round((r.dataWeight.performance || 0) * 100) + '%</b> <span class="small">(gameplay ' + Math.round(r.dataWeight.metrics.gameplay * 100) + '%, focus ' + Math.round(r.dataWeight.metrics.focus * 100) + '%)</span><br>' +
      (r.dataWeight.counted ? '✅ Counted in ladder ×' + r.dataWeight.weight + ' (setting ' + r.dataWeight.setting + ')' : '⛔ Not counted (weight 0): ' + esc(r.dataWeight.reason)) + '</div>' : '') +
      r.suggested.map(function (id) { return '<div class="sug">⭐ Suggested project: <b>' + esc(an(id)) + '</b> <button class="dr" data-a="' + esc(id) + '">🎯 Start decision round</button></div>'; }).join('') + '<h3>🔥 Strong current preferences</h3><ul>' + (r.strong.map(function (p) { return '<li>' + esc(p.text) + ' (' + p.count + '×)</li>'; }).join('') || '<li>none yet</li>') + '</ul>' +
      '<h3>Building</h3><ul>' + r.prefs.filter(function (p) { return !p.strong; }).map(function (p) { return '<li>' + esc(p.text) + ' <span class="tag">' + p.label + '</span></li>'; }).join('') + '</ul>' +
      '<button id="xj">⬇ JSON</button><button id="xm">⬇ Markdown</button><button id="again">↻ Setup</button>' + ladderHtml()); bindLadder();
    function dl(txt, name, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    var stamp = r.at.replace(/[:.]/g, '-'); $('xj').onclick = function () { dl(JSON.stringify(r, null, 1), 'lo-prefs-' + stamp + '.json', 'application/json'); };
    $('xm').onclick = function () { dl(md || JSON.stringify(r), 'lo-prefs-' + stamp + '.md', 'text/markdown'); }; $('again').onclick = function () { $('game').classList.add('hide'); setup(); };
    window.__LO_RESULT = r; window.__LO_MD = md;
  }
  function pause() { if (phase !== 'run') return; timer.pause(); phase = 'paused'; show('<h2>Paused</h2><button id="res">▶ Resume</button>'); $('res').onclick = function () { hide(); run(); }; }
  var cx = $('cv').getContext('2d');
  function draw() { var s = g.state(), p = g.player(); cx.clearRect(0, 0, 600, 220); cx.fillStyle = '#334'; cx.fillRect(0, RunnerEngine.GROUND, 600, 3);
    cx.font = '24px serif'; cx.globalAlpha = s.t < s.invulnUntil && (s.frame >> 3) % 2 ? .4 : 1; cx.fillText('🐈', p.x - 2, p.y + p.h); cx.globalAlpha = 1;
    s.obstacles.forEach(function (o) { cx.fillStyle = o.kind === 'bird' ? '#c55' : '#5a5'; cx.fillRect(o.x, o.y, o.w, o.h); }); cx.fillStyle = '#fc0'; s.items.forEach(function (i) { cx.fillRect(i.x, i.y, i.w, i.h); });
    $('lv').textContent = s.lives; $('sc').textContent = Math.round(s.score); $('tl').textContent = Math.ceil(timer.left() / 1000); $('fill').style.width = (100 - timer.left() / SEG * 100) + '%'; }
  var STEP = 1000 / 60;
  function loop(t) { var d = Math.min(100, t - last); last = t; if (phase === 'count' || phase === 'card') gateTick(d); if (phase === 'run') { acc += d * FAST; while (acc >= STEP && phase === 'run') { acc -= STEP; g.step(STEP, input); idealT += STEP; stats.idealDistance += Math.min(g.P.maxSpeed, g.P.baseSpeed + g.P.accelPerSec * idealT / 1000) * STEP; timer.tick(STEP); } draw(); } requestAnimationFrame(loop); }
  function jd(v) { input.jump = v; } function dd(v) { input.duck = v; }
  $('bjump').onpointerdown = function () { jd(true); }; $('bjump').onpointerup = $('bjump').onpointerleave = function () { jd(false); };
  $('bduck').onpointerdown = function () { dd(true); }; $('bduck').onpointerup = $('bduck').onpointerleave = function () { dd(false); };
  $('cv').onpointerdown = function () { jd(true); }; $('cv').onpointerup = function () { jd(false); }; $('bp').onclick = pause;
  addEventListener('keydown', function (e) { if (phase === 'card') { var n = +e.key; var b = document.querySelectorAll('#box [data-v]')[n - 1]; if (b) b.click(); return; }
    if ([' ', 'ArrowUp'].indexOf(e.key) >= 0) { e.preventDefault(); jd(true); } else if (e.key === 'ArrowDown') { e.preventDefault(); dd(true); } else if (e.key === 'p' || e.key === 'Escape') pause(); });
  addEventListener('keyup', function (e) { if ([' ', 'ArrowUp'].indexOf(e.key) >= 0) jd(false); if (e.key === 'ArrowDown') dd(false); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  // data: prefer live data/areas.json (served over http), else the packed data/areas.js (file:// / offline)
  (location.protocol.indexOf('http') === 0 ? fetch('data/areas.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null))
    .then(function (d) { DATA = d || window.LO_DATA; if (!DATA) return show('No data found. Run <code>node tools/pack.js</code>.'); requestAnimationFrame(function (t) { last = t; loop(t); }); setup(); });
  window.__LO = { pick: pick, phase: function () { return phase; }, gateTick: gateTick, cfg: function () { return cfg; }, planned: function () { return planned; }, decision: decision, ledger: ledger, stats: function () { return stats; } };
})();
