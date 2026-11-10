/* Lo · Cambio page (variant of lo-preferences; shares engine/prefs/timer). Cards feed the Cambio support-copilot project.
   Lo Preferences page: setup -> (30 s Lynx Dash run -> one preference card) x N -> results/export. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, Q = new URLSearchParams(location.search), LS = 'lo-cambio.settings.v1', LSR = 'lo-cambio.results.v1', LSL = 'lo-cambio.ledger.v1', LSA = 'lo-cambio.adaptive.v1', mode = null;
  var PREVIEW45 = Q.get('preview45') === '1', FAST = Math.max(1, +(Q.get('fast') || 1)), QSEG = Q.get('segment'), SEG = +(QSEG || 30) * 1000, DATA, cfg, sess, g, timer, phase = 'setup', planned = 0, cur = null, input = { jump: false, duck: false }, last = 0, acc = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var adState = null, sessionShown = [];
  function loadAd() { try { return Adaptive.load(JSON.parse(localStorage.getItem(LSA) || 'null')); } catch (e) { return (typeof Adaptive !== 'undefined' ? Adaptive.empty() : { player: { level: 1, floor: 1, progress: {} }, questions: {}, calibration: {} }); } }
  function saveAd() { try { if (typeof Adaptive !== 'undefined') localStorage.setItem(LSA, JSON.stringify(Adaptive.exportState(adState))); } catch (e) {} }
  function adHud() {
    if (typeof Adaptive === 'undefined' || !adState) return;
    var h = Adaptive.hud(adState);
    if ($('plv')) $('plv').textContent = h.level;
    if ($('pfl')) $('pfl').textContent = h.floor;
    if ($('ppr')) $('ppr').textContent = h.progressText;
    if ($('adsetup')) $('adsetup').innerHTML = '🎯 Skill level <b>' + h.level + '</b> · floor <b>' + h.floor + '</b><br><span class="small">' + esc(h.progressText) + ' till nästa nivå. 3 rätt totalt per faktfråga tar bort den. Fel ger hint → 50/50 → omformulering. Personliga frågor poängsätts inte.</span>';
  }
  function nextHand() {
    var guard = 0, seenSkip = {}, last = null;
    while (guard++ < 250 && sess) {
      var h = sess.next();
      if (!h) return last;
      last = h;
      var c = h.card, A = typeof Adaptive !== 'undefined';
      var ret = A && Adaptive.isRetired(adState, c);
      var calOnce = A && Adaptive.isCalibration(c) && sessionShown.indexOf(c.id) >= 0;
      var scoredOnce = A && Adaptive.isScored(c) && sessionShown.indexOf(c.id) >= 0;
      if (ret || calOnce || scoredOnce) {
        if (seenSkip[c.id]) { if (!ret && !calOnce) return h; continue; }
        seenSkip[c.id] = 1; continue;
      }
      sessionShown.push(c.id);
      return h;
    }
    return last;
  }
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
  function fillExec(ex) { var d = Prefs.defaultExecutors(DATA); Object.keys(ex).forEach(function (a) { if (!ex[a] || !ex[a].length) ex[a] = d.slice(); }); return ex; }
  var COST = function () { var c = {}; (DATA.executors || []).forEach(function (x) { c[x.id] = x.cost || 0; }); return c; };
  function sliders() { var nW = Prefs.dataLevels(DATA).length, nC = (DATA.costLevels || []).length || 5;
    return '<div class="sl"><label>Casual <input type="range" id="dl" min="1" max="' + nW + '" step="1" value="' + cfg.dataLevel + '"> Actual data</label><div id="dlx" class="small"></div>' +
      '<label>Cheaper <input type="range" id="cl" min="1" max="' + nC + '" step="1" value="' + cfg.costLevel + '"> More expensive</label><div id="clx" class="small"></div></div>'; }
  function sliderText() { var W = Prefs.dataLevels(DATA), S = DATA.dataStrict || {}, L = cfg.dataLevel, from = S.fromLevel || W.length - 1, names = DATA.dataLevels || [];
    $('dlx').textContent = L + '/' + W.length + ' ' + (names[L - 1] || '') + ' — counts ×' + W[L - 1] + ' in the ladder' + (L >= from ? '; only if performance ≥ ' + Math.round((S.minPerformance || 0.8) * 100) + '%' : '');
    var C = DATA.costLevels || [], c = C[cfg.costLevel - 1] || {}; $('clx').textContent = cfg.costLevel + '/' + C.length + ' ' + (c.text || '') + ' (executor cost ≤ ' + c.maxCost + ')';
    var cost = COST(); document.querySelectorAll('.ex').forEach(function (x) { var ob = cost[x.dataset.x] > c.maxCost, lb = x.parentNode; lb.classList.toggle('ob', ob); lb.title = ob ? 'over budget at this cost level (still ticked, but not in allowedExecutors)' : ''; }); }
  function decision(id) { if (!l3Ready()) return needL3(function () { decision(id); }); mode = { mode: 'decision', area: id }; cfg = cfg || {}; start(); }
  function setup() {
    mode = null;
    phase = 'setup'; var s = load(); if (s.areas && !s.talkV2) { if (s.areas.indexOf('talking') < 0) s.areas.push('talking'); s.talkV2 = 1; } if (s.areas && !s.intervjuV1) { ['intervju', 'kalibrering'].forEach(function (id) { if (s.areas.indexOf(id) < 0) s.areas.push(id); }); s.intervjuV1 = 1; } cfg = { areas: s.areas || DATA.areas.filter(function (a) { return a.defaultOn !== false; }).map(function (a) { return a.id; }), minutes: s.minutes || 10, exec: fillExec(Prefs.normExec(DATA, s.exec)), dataLevel: s.dataLevel || 3, costLevel: s.costLevel || 3, talkV2: 1, intervjuV1: 1 };
    var EX = DATA.executors || [], AIDS = DATA.areas.map(function (a) { return a.id; });
    var cnt = DATA.cardCounts || {}; if (!DATA.cardCounts) DATA.cards.forEach(function (c) { cnt[c.area] = (cnt[c.area] || 0) + 1; }); var lvOf = {}; DATA.areas.forEach(function (a) { lvOf[a.id] = a.level || 1; });
    show('<h2>🐾 Lo · Cambio</h2><p class="small">Synthetic data only · answers export as Cambio support-copilot records (golden-label votes, scope decisions, talking-point ranking, calibration).</p><div id="adsetup" class="perf"></div><p>Run with Lo. Every <span class="k">30 s (casual 1–2) or 15 s (levels 3–5)</span> of running, one card asks about a project area. Choosing the same preference <span class="k">' + (DATA.confirmAt || 3) + '×</span> marks it a <b>strong current preference</b>.</p>' + sliders() +
      '<h3>Project areas</h3>' + (EX.length ? '<div class="exm"><span class="small">Executors for all areas:</span> ' + EX.map(function (x) { return '<label><input type="checkbox" class="mx" data-x="' + esc(x.id) + '"> ' + esc(x.name) + '</label>'; }).join(' ') + '</div>' : '') +
      '<div id="areas">' + DATA.areas.map(function (a) { return '<div class="arow"><label class="area"><input type="checkbox" class="ac" value="' + esc(a.id) + '"' + (cfg.areas.indexOf(a.id) >= 0 ? ' checked' : '') + '> ' + esc(a.name) + ' <span class="small">(L' + lvOf[a.id] + '+ · ' + (cnt[a.id] || 0) + ' cards)</span></label><div class="exr">' +
        EX.map(function (x) { return '<label data-ob="over budget"><input type="checkbox" class="ex" data-a="' + esc(a.id) + '" data-x="' + esc(x.id) + '"' + (cfg.exec[a.id].indexOf(x.id) >= 0 ? ' checked' : '') + '> ' + esc(x.name) + '</label>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<button id="all">All</button><button id="none">None</button><h3>Game length</h3><div id="len">' + [5, 10, 15].map(function (m) { return '<label><input type="radio" name="len" value="' + m + '"' + (cfg.minutes === m ? ' checked' : '') + '> ' + m + ' min</label> '; }).join('') +
      '<label><input type="radio" name="len" value="custom"' + ([5, 10, 15].indexOf(cfg.minutes) < 0 ? ' checked' : '') + '> custom <input id="cust" type="number" min="1" max="120" style="width:60px" value="' + cfg.minutes + '"> min</label></div>' +
      '<div id="later" class="perf nc hide"></div><p id="plan" class="small"></p><button id="go">▶ Run</button>' + (localStorage.getItem(LSR) ? ' <button id="prev">Last results</button>' : '') + ladderHtml()); bindLadder();
    function masters() { document.querySelectorAll('.mx').forEach(function (m) { var st = Prefs.masterState(cfg.exec, AIDS, m.dataset.x); m.checked = st === 'all'; m.indeterminate = st === 'mixed'; }); }
    function read() { document.querySelectorAll('.ex').forEach(function (x) { Prefs.setAll(cfg.exec, [x.dataset.a], x.dataset.x, x.checked); }); masters();
      cfg.areas = [].slice.call(document.querySelectorAll('#areas .ac:checked')).map(function (x) { return x.value; }); cfg.dataLevel = +$('dl').value; cfg.costLevel = +$('cl').value; SEG = QSEG ? +QSEG * 1000 : (cfg.dataLevel <= 2 ? 30000 : 15000); sliderText(); var r = document.querySelector('input[name=len]:checked').value; cfg.minutes = r === 'custom' ? Math.max(1, Math.min(120, +$('cust').value || 10)) : +r; save();
      planned = Prefs.cardsForMinutes(cfg.minutes, SEG / 1000); var pool = Cambio.levelCards(DATA, cfg.dataLevel).filter(function (c) { return cfg.areas.indexOf(c.area) >= 0; }).length, locked = cfg.dataLevel > (DATA.playableMaxLevel || 3) && !PREVIEW45;
      $('later').classList.toggle('hide', cfg.dataLevel <= (DATA.playableMaxLevel || 3)); $('later').innerHTML = '🚧 <b>Level ' + cfg.dataLevel + ' – data creation: coming later.</b> ' + (DATA.comingLater || []).filter(function (x) { return x.level === cfg.dataLevel; }).map(function (x) { return esc(x.name) + ' <span class="small">(' + esc(x.schema) + ')</span>'; }).join(' · ') + '<br><span class="small">Schemas are defined (export field <code>cambio.level45</code>); the 80% performance rule will apply. ' + (PREVIEW45 ? 'Preview mode: plays level 1–3 cards at strict weighting.' : 'Choose level 1–4 to play now (level 5 still coming later).') + '</span>';
      $('plan').textContent = planned + ' cards (~' + cfg.minutes + ' min) from ' + pool + ' cards in ' + cfg.areas.length + ' areas' + (planned > pool ? ' — some cards repeat as confirmations' : ''); $('go').disabled = !pool || locked; }
    $('box').onchange = function (e) { if (e.target.classList.contains('mx')) { var on = e.target.checked; document.querySelectorAll('.ex[data-x="' + e.target.dataset.x + '"]').forEach(function (x) { x.checked = on; }); } read(); }; $('dl').oninput = $('cl').oninput = read; $('cust').oninput = function () { document.querySelector('input[value=custom]').checked = true; read(); };
    $('all').onclick = function () { document.querySelectorAll('#areas .ac').forEach(function (x) { x.checked = true; }); read(); };
    $('none').onclick = function () { document.querySelectorAll('#areas .ac').forEach(function (x) { x.checked = false; }); read(); };
    if ($('prev')) $('prev').onclick = function () { results(JSON.parse(localStorage.getItem(LSR))); };
    $('go').onclick = start; read(); onL3 = read; adState = loadAd(); adHud();
  }
  function start() { if (!l3Ready()) return needL3(start);
    SEG = QSEG ? +QSEG * 1000 : ((cfg && cfg.dataLevel || 3) <= 2 ? 30000 : 15000);
    var dm = mode && mode.mode === 'decision'; adState = loadAd(); sessionShown = []; var baseCards = Cambio.levelCards(DATA, cfg && cfg.dataLevel); if (typeof Adaptive !== 'undefined') baseCards = Adaptive.sessionPool(baseCards, adState); var LD = Object.assign({}, DATA, { cards: baseCards }); sess = Prefs.create(LD, dm ? { mode: 'decision', area: mode.area, executors: cfg.exec } : { areas: cfg.areas, executors: cfg.exec }); if (dm) planned = Math.max(planned, sess.pool.length * 2) || sess.pool.length * 2; g = RunnerEngine.create({ seed: Date.now() & 0xffff, params: { segmentMs: SEG } }); timer = SegTimer.create(SEG, card); stats = { distance: 0, idealDistance: 0, faced: 0, crashes: 0, activeMs: 0 }; idealT = 0;
    $('qt').textContent = planned; $('game').classList.remove('hide'); hide(); adHud(); run();
  }
  function run() { phase = 'run'; timer.start(); }
  var stats = null, idealT = 0, gt = null, CD = +(Q.get('countdown') || 3000), GRACE = 300;
  function card() { var sg = g.endSegment(); stats.distance += sg.distance; stats.activeMs += sg.activeMs; stats.faced += sg.obstaclesFaced + sg.projectilesFaced; stats.crashes += sg.crashes; phase = 'count'; gt = Prefs.gate(CD, GRACE); show('<div id="cd" class="cd">' + gt.count() + '</div><p class="small" style="text-align:center">Next card…</p>'); }
  function gateTick(d) { if (!gt) return; gt.tick(d); if (phase === 'count') { if (gt.shown()) showCard(); else $('cd').textContent = gt.count(); } }
  function showCard() {
    phase = 'card'; cur = nextHand(); if (!cur) return results(); var c = cur.card, view = (typeof Adaptive !== 'undefined') ? Adaptive.present(c, Adaptive.qState(adState, c.id, c)) : { prompt: c.prompt, options: c.options || [], hint: null, hidden: [] }; cur.view = view; var a = DATA.areas.find(function (x) { return x.id === c.area; }), h = '<p class="small">' + (sess.result().mode === 'decision' ? '🎯 Decision round · ' : '') + esc(a ? a.name : c.area) + ' · card ' + cur.seq + '/' + planned + (typeof Adaptive !== 'undefined' && Adaptive.isScored(c) ? ' · Q-nivå ' + Adaptive.baseDiff(c) : '') + '</p>' + (c.context ? '<div class="tk"><b>' + esc(c.context.title) + '</b><br>' + esc(c.context.body) + '</div>' : '') + '<h3>' + esc(view.prompt || c.prompt) + '</h3>' + (view.hint ? '<div class="hint">💡 ' + esc(view.hint) + '</div>' : '') + '<div class="opts">';
    function st(key) { var s = sess.status(key); return s.count ? ' <span class="tag ' + (s.strong ? 'strong' : s.count === 2 ? 'p2' : '') + '">' + s.label + '</span>' : ''; }
    if (c.type === 'updown') { var kk = c.key || c.area, dd = !!c.key; h += '<button data-v="up">1 ⬆ ' + (dd ? 'Yes / now' : 'Up-prioritise') + st(kk + ':up') + '</button><button data-v="down">2 ⬇ ' + (dd ? 'No / wait' : 'Down-prioritise') + st(kk + ':down') + '</button>'; }
    else if (c.type === 'rate') h += '</div><div class="scale">' + (DATA.scale || [-2, -1, 0, 1, 2]).map(function (v, i) { return '<button data-v="' + v + '">' + (i + 1) + '<br>' + (v > 0 ? '+'.repeat(v) : v < 0 ? '−'.repeat(-v) : '0') + '</button>'; }).join('') + '</div><p class="small">' +
      ['+', '0', '-'].map(function (s) { var t = sess.status(c.aspect + ':' + s); return t.count ? s + ': ' + t.label : ''; }).filter(Boolean).join(' · ') + '</p><div>';
    else h += (c.options || []).map(function (o, i) { if (view.hidden && view.hidden.indexOf(i) >= 0) return ''; return '<button data-v="' + i + '">' + (i + 1) + ' ' + esc(o.label) + st(o.pref) + '</button>'; }).join('');
    var isEdit = c.cambio && c.cambio.kind === 'ticket_edit', isAv = c.cambio && c.cambio.kind === 'abbreviation_verification', isBl = c.cambio && c.cambio.kind === 'bulk_label', isPs = c.cambio && c.cambio.kind === 'pii_span_annotation';
    var ownLab = isEdit ? '✍ Rewrite in Swedish (this is the edit field — overrides the choice)' : isAv ? '✍ Optional: proposed expansion if wrong/missing' : isBl ? '✍ Or write your own labels (JSON or free text — overrides)' : isPs ? '✍ Or type exact PII substring(s), one per line' : '✍ Or write your own (optional — overrides the choice; a picked choice is kept as context)';
    var ownPh = isEdit ? 'Skriv om titeln eller brödtexten på naturlig svenska…' : isAv ? 'Proposed expansion (Swedish)…' : isPs ? 'Exact substring from the ticket…' : 'Type your own answer…';
    var extra = '';
    if (isAv) { extra = '<div class="own src"><label for="src" class="small">🔗 Source URL (optional — paste a real public source; suggested: ' + (c.suggestedSource ? esc(c.suggestedSource) : 'none pre-filled — supply your own') + ')</label><input id="src" type="url" inputmode="url" autocomplete="off" maxlength="500" placeholder="https://…" value=""></div>'; }
    show(h + '</div><div class="own"><label for="own" class="small">' + ownLab + '</label><textarea id="own" rows="' + (isEdit ? 5 : 2) + '" maxlength="' + (isEdit ? 2000 : 1000) + '" autocomplete="off" placeholder="' + esc(ownPh) + '"></textarea>' + extra + '<button id="ownb">✍ Send my own answer</button></div><button data-v="skip" class="small">skip</button><p id="fb" class="small"></p>');
    document.querySelectorAll('#box [data-v]').forEach(function (b) { b.onclick = function () { pick(b.dataset.v); }; });
    $('ownb').onclick = function () { if (ownText() || sourceText()) pick('manual'); else $('own').focus(); };
    $('own').onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey && !isEdit) { e.preventDefault(); $('ownb').click(); } };
  }
  function ownText() { var t = $('own'); return t ? t.value.trim().slice(0, 2000) : ''; }
  function sourceText() { var t = $('src'); return t ? t.value.trim().slice(0, 500) : ''; }
  function pick(v) {
    if (phase !== 'card' || !gt || !gt.clickable()) return; var c = cur.card, mr = ownText(), src = sourceText(); if (v === 'manual' && !mr && !src) return;
    // Typed reply overrides: text-only -> logged as choice 'manual' (no preference count); choice + text -> choice kept as context.
    var ch = v === 'skip' || v === 'manual' ? 'skip' : c.type === 'updown' ? v : +v, e = sess.answer(cur, ch); if (v === 'manual') e.choice = 'manual'; if (mr && v !== 'skip') { e.manualReply = mr; e.overridden = true; } if (src && v !== 'skip') e.sourceUrl = src; phase = 'fb'; $('qn').textContent = e.seq;
    var ev = { scored: false, calibration: false };
    if (typeof Adaptive !== 'undefined' && adState) {
      var choiceForEv = v === 'skip' ? 'skip' : v === 'manual' ? 'manual' : (c.type === 'updown' ? v : +v);
      ev = Adaptive.evaluate(c, choiceForEv, { manualReply: mr });
      var extra = { manualReply: mr || null, at: e.t };
      if (c.type === 'choice' && v !== 'skip' && v !== 'manual' && c.options && c.options[+v]) { extra.label = c.options[+v].label; extra.value = c.options[+v].value; }
      var rec = Adaptive.record(adState, c, ev, extra);
      if (rec && rec.calibration) { e.calibration = true; if (rec.changed) { e.calibChanged = true; e.calibPrevious = rec.previous ? { value: rec.previous.value, label: rec.previous.label, manualReply: rec.previous.manualReply } : null; } }
      saveAd(); adHud();
    }
    $('fb').innerHTML = (e.overridden ? '✍ <b>Your own answer recorded</b> (overrides the choice)' + (e.pref ? ' · ' : '') : '') + (e.pref ? (e.becameStrong ? '🔥 <b>Strong current preference!</b>' : e.status.indexOf('/') > 0 ? 'Noted (' + e.status + ')' : 'Still strong (' + e.status + ')') : e.overridden ? '' : (ev.scored ? '' : 'Skipped'));
    if (ev.scored) $('fb').innerHTML += ev.correct ? '<div class="tk ok">✓ Rätt</div>' : '<div class="tk bad">✗ Inte det svar vi har som facit.</div>';
    if (ev.scored && c.explain) $('fb').innerHTML += '<div class="tk">' + esc(c.explain) + '</div>';
    if (ev.calibration && (c.tip || c.interviewTip)) $('fb').innerHTML += '<div class="tk">💬 <b>Så här kan det låta:</b> ' + esc(c.tip || c.interviewTip) + '</div>';
    if ($('own')) { $('own').disabled = true; $('ownb').disabled = true; }
    var rv = c.reveal; if (rv) { $('fb').innerHTML += '<div class="tk">📘 <b>' + esc(c.cambio && c.cambio.abbr || '') + '</b> = ' + rv.expansions.map(function (x) { return esc(x.sv) + ' <span class="small">(' + esc(x.en) + ')</span>'; }).join(' · ') + (rv.example ? '<br><i>' + esc(rv.example.text) + '</i>' : '') + '</div>'; }
    var linger = rv || (ev && (ev.scored || (ev.calibration && (c.tip || c.interviewTip))));
    setTimeout(function () { if (e.seq >= planned) return results(); hide(); g.afterQuestion(); idealT *= g.P.speedKeepAfterQuestion; run(); }, (linger ? 3500 : 700) / Math.min(FAST, 4));
  }
  function results(r, keepLedger) { if (!l3Ready()) return needL3(function () { results(r, keepLedger); });
    phase = 'done'; $('box').onchange = null; if (!r) { r = sess.result(); var pf = Prefs.performance(DATA, stats, r.log); r.dataWeight = Prefs.weighSession(DATA, cfg.dataLevel, pf); r.dataWeight.metrics = pf; r.settings = { dataLevel: cfg.dataLevel, costLevel: cfg.costLevel };
      r.costLevel = cfg.costLevel; r.costPlan = Prefs.costPlan(DATA, cfg.costLevel, r.executors); r.game = 'lo-cambio'; r.cambio = Cambio.build(DATA, r.log, r.dataWeight); if (typeof Adaptive !== 'undefined' && adState) r.cambio.adaptive = Adaptive.exportState(adState); r.allowedExecutors = {}; Object.keys(r.costPlan.areas).forEach(function (a) { if (r.executors && r.executors[a]) r.allowedExecutors[a] = r.costPlan.areas[a].allowedExecutors; }); } var L = ledger(); if (!keepLedger && r.log) { L = Prefs.mergeLedger(L, [Prefs.sessionEntry(DATA, r)]); saveLedger(L); }
    if (!r.reviewSchedule) r.reviewSchedule = Prefs.reviewSchedule((r.settings || {}).dataLevel || (r.dataWeight || {}).setting || (cfg && cfg.dataLevel));
    var tops = r.mode === 'decision' ? DATA.areas.filter(function (a) { return a.id === r.area; }).map(function (a) { return { area: a.id, name: a.name, rank: 1 }; }) : Prefs.topProjects(DATA, L, 3), prevC = {}; (r.comments || []).forEach(function (c) { prevC[c.area] = c.text; });
    r.comments = r.comments || [];
    r.ledger = { version: 1, sessions: L.sessions }; r.suggested = Prefs.suggested(DATA, L); r.standings = Prefs.standings(DATA, L).map(function (s) { return { id: s.id, score: s.score, upSessions: s.upSessions, crossed: s.crossed }; });
    try { localStorage.setItem(LSR, JSON.stringify(r)); } catch (e) { } var md = Prefs.create(DATA, {}).markdown(r) + (r.cambio ? Cambio.markdown(r.cambio) : '');
    var an = function (id) { var a = DATA.areas.find(function (x) { return x.id === id; }); return a ? a.name : id; };
    show('<h2>' + (r.mode === 'decision' ? '🎯 Decision round: ' + esc(an(r.area)) : 'Results') + '</h2><p>' + r.answered + ' cards</p>' + (r.cambio ? '<div class="sug">🏥 Cambio export: <b>' + r.cambio.golden_label_votes.length + '</b> label votes (' + r.cambio.summary.agree + ' agree with dataset), <b>' + r.cambio.scope_decisions.length + '</b> scope decisions, <b>' + r.cambio.abbreviation_picks.length + '</b> abbreviation picks, <b>' + r.cambio.talking_point_ranking.length + '</b> talking points ranked, <b>' + ((r.cambio.level45 && r.cambio.level45.records) || []).length + '</b> level45 records, <b>' + ((r.cambio.calibration && r.cambio.calibration.length) || 0) + '</b> calibration' + (r.cambio.summary.disagreements.length ? '<br><span class="small">Review: ' + r.cambio.summary.disagreements.slice(0, 5).map(esc).join(' · ') + '</span>' : '') + '</div>' : '') + (function () { var cal = (r.cambio && r.cambio.calibration) || []; if (!cal.length) return ''; return '<h3>🎤 Kalibrering <span class="small">(egna svarscues)</span></h3><ul>' + cal.map(function (c) { return '<li><b>' + esc(c.theme || c.card) + ':</b> ' + esc(c.selected_label || 'egen text') + (c.manualReply ? '<br><i>' + esc(c.manualReply) + '</i>' : '') + (c.changed ? ' <span class="tag">ändrad sedan sist</span>' : '') + '</li>'; }).join('') + '</ul>'; }()) + (r.dataWeight ? '<div class="perf' + (r.dataWeight.counted ? '' : ' nc') + '">Performance <b>' + Math.round((r.dataWeight.performance || 0) * 100) + '%</b> <span class="small">(gameplay ' + Math.round(r.dataWeight.metrics.gameplay * 100) + '%, focus ' + Math.round(r.dataWeight.metrics.focus * 100) + '%)</span><br>' +
      (r.dataWeight.counted ? '✅ Counted in ladder ×' + r.dataWeight.weight + ' (setting ' + r.dataWeight.setting + ')' : '⛔ Not counted (weight 0): ' + esc(r.dataWeight.reason)) + '</div>' : '') +
      r.suggested.map(function (id) { return '<div class="sug">⭐ Suggested project: <b>' + esc(an(id)) + '</b> <button class="dr" data-a="' + esc(id) + '">🎯 Start decision round</button></div>'; }).join('') + '<h3>🔥 Strong current preferences</h3><ul>' + (r.strong.map(function (p) { return '<li>' + esc(p.text) + ' (' + p.count + '×)</li>'; }).join('') || '<li>none yet</li>') + '</ul>' +
      '<h3>Building</h3><ul>' + r.prefs.filter(function (p) { return !p.strong; }).map(function (p) { return '<li>' + esc(p.text) + ' <span class="tag">' + p.label + '</span></li>'; }).join('') + '</ul>' +
      '<h3>💬 Comments <span class="small">(optional)</span></h3><div id="cmts">' + tops.map(function (t) { return '<label class="small" style="display:block;margin-top:6px">#' + t.rank + ' ' + esc(t.name) + (t.score != null ? ' (' + (t.score > 0 ? '+' : '') + t.score + ')' : '') + '</label><textarea class="cmt" data-a="' + esc(t.area) + '" data-n="' + esc(t.name) + '" data-r="' + t.rank + '" rows="2" style="width:100%;background:#252936;color:#eee;border:1px solid #444a58;border-radius:8px">' + esc(prevC[t.area] || '') + '</textarea>'; }).join('') + '</div><p id="rvw" class="small">' + esc(Prefs.reviewText(r.reviewSchedule)) + '</p>' +
      '<button id="xj">⬇ JSON</button><button id="xm">⬇ Markdown</button><button id="again">↻ Setup</button>' + ladderHtml()); bindLadder();
    function syncComments() { r.comments = Prefs.cleanComments([].slice.call(document.querySelectorAll('.cmt')).map(function (t) { return { area: t.dataset.a, name: t.dataset.n, text: t.value, rank: +t.dataset.r }; }));
      var LL = ledger(), en = LL.sessions.find(function (x) { return x.at === r.at; }); if (en) { en.comments = r.comments; en.reviewSchedule = r.reviewSchedule; saveLedger(LL); } r.ledger = { version: 1, sessions: LL.sessions };
      md = Prefs.create(DATA, {}).markdown(r) + (r.cambio ? Cambio.markdown(r.cambio) : ''); try { localStorage.setItem(LSR, JSON.stringify(r)); } catch (e) { } window.__LO_RESULT = r; window.__LO_MD = md; }
    document.querySelectorAll('.cmt').forEach(function (t) { t.oninput = syncComments; }); syncComments();
    function dl(txt, name, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    var stamp = r.at.replace(/[:.]/g, '-'); $('xj').onclick = function () { syncComments(); dl(JSON.stringify(r, null, 1), 'lo-cambio-' + stamp + '.json', 'application/json'); };
    $('xm').onclick = function () { syncComments(); dl(md || JSON.stringify(r), 'lo-cambio-' + stamp + '.md', 'text/markdown'); }; $('again').onclick = function () { $('game').classList.add('hide'); setup(); };
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
  addEventListener('keydown', function (e) { if (/^(TEXTAREA|INPUT)$/.test((e.target || {}).tagName || '')) return; if (phase === 'card') { var n = +e.key; var b = document.querySelectorAll('#box [data-v]')[n - 1]; if (b) b.click(); return; }
    if ([' ', 'ArrowUp'].indexOf(e.key) >= 0) { e.preventDefault(); jd(true); } else if (e.key === 'ArrowDown') { e.preventDefault(); dd(true); } else if (e.key === 'p' || e.key === 'Escape') pause(); });
  addEventListener('keyup', function (e) { if ([' ', 'ArrowUp'].indexOf(e.key) >= 0) jd(false); if (e.key === 'ArrowDown') dd(false); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  // data: data/core.js (levels 1-2 + metadata) loads first; level-3 ticket cards (data/cards-l3.js) load in the background
  var onL3 = null, l3p = null;
  function l3Ready() { return !!DATA.l3Loaded; }
  function loadL3() { return l3p || (l3p = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'data/cards-l3.js?v=' + (DATA.v || ''); s.onload = function () { if (window.LO_L3 && !DATA.l3Loaded) { var all = DATA.cards.slice(); window.LO_L3.forEach(function (e) { all.splice(e[0], 0, e[1]); }); DATA.cards = all; DATA.l3Loaded = true; } res(); }; s.onerror = function () { l3p = null; rej(); }; document.head.appendChild(s); })); }
  function needL3(fn) { if (phase === 'setup' && $('go')) { $('go').disabled = true; $('go').textContent = 'Loading cards…'; } loadL3().then(fn, function () { show('Could not load level-3 cards. Check your connection and reload.'); }); }
  DATA = window.LO_DATA; if (!DATA) show('No data found. Run <code>node tools/pack.js</code>.'); else { requestAnimationFrame(function (t) { last = t; loop(t); }); setup(); setTimeout(function () { loadL3().then(function () { if (phase === 'setup' && onL3) onL3(); }, function () {}); }, 0); }
  window.__LO = { pick: pick, phase: function () { return phase; }, gateTick: gateTick, cfg: function () { return cfg; }, planned: function () { return planned; }, decision: decision, ledger: ledger, stats: function () { return stats; }, adaptive: function () { return adState; } };
})();
