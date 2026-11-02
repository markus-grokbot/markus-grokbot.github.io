/* Lynx Dash ?mode=apps – job-application prioritisation cards (up/down, aspect rating, phrasing pick).
   Pure logic is node-testable: AppsMode.create(data, rng) -> { next(), answer(choice), result(), summaryHTML() }. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.AppsMode = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var SCALE = [{ k: '--', v: -2 }, { k: '-', v: -1 }, { k: '0', v: 0 }, { k: '+', v: 1 }, { k: '++', v: 2 }], TYPES = ['updown', 'aspect', 'phrasing'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function create(data, rng) {
    rng = rng || Math.random; var apps = data.apps, st = {}, n = 0, log = [];
    apps.forEach(function (a) { st[a.id] = { votes: 0, aspects: {}, phrasings: {}, shown: 0 }; });
    function score(a) { var s = st[a.id], v = s.votes * 2; a.aspects.forEach(function (x) { if (s.aspects[x.key] != null) v += s.aspects[x.key] * x.w; }); return +v.toFixed(2); }
    function pickApp() { // least-shown first, deadline-soonest breaks ties, small random jitter
      var m = Infinity; apps.forEach(function (a) { m = Math.min(m, st[a.id].shown); });
      var c = apps.filter(function (a) { return st[a.id].shown === m; }); return c[Math.floor(rng() * Math.min(c.length, 3))]; }
    function next() {
      var type = TYPES[n % 3], a = pickApp(), card = { seq: n + 1, type: type, appId: a.id, app: a };
      if (type === 'aspect') { var un = a.aspects.filter(function (x) { return st[a.id].aspects[x.key] == null; }); var pool = un.length ? un : a.aspects; card.aspect = pool[Math.floor(rng() * pool.length)]; }
      if (type === 'phrasing') { if (!a.phrasings.length) { card.type = 'updown'; } else { var up = a.phrasings.filter(function (p) { return st[a.id].phrasings[p.slot] == null; }); var pp = up.length ? up : a.phrasings; card.phr = pp[Math.floor(rng() * pp.length)]; } }
      card.shownAt = Date.now(); return card;
    }
    function answer(card, choice) { // choice: updown 'up'|'down'|'skip'; aspect -2..2|'skip'; phrasing index|'skip'
      var s = st[card.appId], e = { seq: card.seq, t: new Date().toISOString(), decisionMs: Date.now() - card.shownAt, type: card.type, appId: card.appId, company: card.app.company, choice: choice };
      s.shown++; n++;
      if (card.type === 'updown' && choice !== 'skip') s.votes += choice === 'up' ? 1 : -1;
      if (card.type === 'aspect') { e.aspect = card.aspect.key; e.weight = card.aspect.w; if (choice !== 'skip') s.aspects[card.aspect.key] = choice; }
      if (card.type === 'phrasing') { e.slot = card.phr.slot; if (choice !== 'skip') { s.phrasings[card.phr.slot] = choice; e.text = card.phr.options[choice]; if (card.phr.blockIds) e.blockId = card.phr.blockIds[choice]; } }
      e.scoreAfter = score(card.app); log.push(e); return e;
    }
    function result() {
      return { ranking: apps.map(function (a) { var s = st[a.id]; return { id: a.id, company: a.company, role: a.role, deadline: a.deadline, score: score(a), votes: s.votes, cardsShown: s.shown,
        aspects: a.aspects.filter(function (x) { return s.aspects[x.key] != null; }).map(function (x) { return { key: x.key, label: x.label, weight: x.w, rating: s.aspects[x.key] }; }),
        phrasings: a.phrasings.filter(function (p) { return s.phrasings[p.slot] != null; }).map(function (p) { return { slot: p.slot, choice: s.phrasings[p.slot], text: p.options[s.phrasings[p.slot]] }; }) }; })
        .sort(function (x, y) { return y.score - x.score || (x.deadline < y.deadline ? -1 : 1); }), choices: log, scoring: 'score = 2×(up−down votes) + Σ aspect rating(−2..+2) × weight' };
    }
    function summaryHTML() {
      var r = result(); return '<h3>Priority ranking</h3><ol style="text-align:left;padding-left:22px;font-size:13px">' + r.ranking.map(function (x) {
        return '<li><b>' + esc(x.company) + '</b> – ' + esc(x.role) + ' <span class="k">' + (x.score > 0 ? '+' : '') + x.score + '</span> <span style="color:#999">dl ' + esc(x.deadline) + '</span>' +
          (x.aspects.length ? '<br><span style="font-size:12px;color:#bbb">' + x.aspects.map(function (a) { return esc(a.label) + ' ' + SCALE[a.rating + 2].k; }).join(' · ') + '</span>' : '') +
          x.phrasings.map(function (p) { return '<br><span style="font-size:12px;color:#9cf">' + esc(p.slot) + ': “' + esc(p.text) + '”</span>'; }).join('') + '</li>'; }).join('') + '</ol>';
    }
    return { next: next, answer: answer, result: result, summaryHTML: summaryHTML, state: st };
  }
  var CSS = '.ac{background:#1d2029;border:1px solid #444a58;border-radius:14px;padding:14px;margin:8px 4px}.ac h3{margin:4px 0 2px;font-size:17px}.ac .meta{font-size:12px;color:#999;margin-bottom:8px}.ac .hint{font-size:13px;color:#ccd;margin:8px 0;line-height:1.35}' +
    '.ac .row{display:grid;gap:8px;margin-top:10px}.ac .r3{grid-template-columns:1fr 1fr 1fr}.ac .r5{grid-template-columns:repeat(5,1fr)}.ac button{font-size:16px;padding:16px 4px}.ac .opt{text-align:left;font-size:14px;padding:12px;line-height:1.35}.ac .kn{color:#fc0;font-weight:700;margin-right:6px}.ac .skip{font-size:13px;padding:8px;margin-top:8px;width:100%}';
  // render a card into el; onPick(choice) once. Keys: 1..5 / 1..n, 0 or S = skip.
  function render(el, card, onPick) {
    var a = card.app, done = false, h = '<div class="ac"><div class="meta">Card ' + card.seq + ' · ' + { updown: 'Prioritise', aspect: 'Rate an aspect', phrasing: 'Pick a phrasing' }[card.type] + '</div><h3>' + esc(a.company) + '</h3><div class="meta">' + esc(a.role) + ' · ' + esc(a.location) + ' · deadline ' + esc(a.deadline) + ' (' + a.days_left + ' d)' + (a.link ? ' · <a href="' + esc(a.link) + '" target="_blank" rel="noopener">ad</a>' : '') + '</div>', keys = {};
    if (card.type === 'updown') { h += '<div class="hint">' + esc((a.fit[0] || '')) + (a.gaps[0] ? '<br><span style="color:#f99">⚠ ' + esc(a.gaps[0]) + '</span>' : '') + '</div><div class="row r3"><button data-c="down">1 ⬇ Down</button><button data-c="skip">2 Skip</button><button data-c="up">3 ⬆ Up</button></div>'; keys = { 1: 'down', 2: 'skip', 3: 'up' }; }
    if (card.type === 'aspect') { h += '<div class="hint"><b>' + esc(card.aspect.label) + '</b> – is this for or against sending?<br><span style="color:#aab">' + esc(card.aspect.hint) + '</span></div><div class="row r5">' + SCALE.map(function (s, i) { keys[i + 1] = s.v; return '<button data-c="' + s.v + '">' + s.k + '</button>'; }).join('') + '</div><button class="skip" data-c="skip">Skip (0)</button>'; keys[0] = 'skip'; }
    if (card.type === 'phrasing') { h += '<div class="hint"><b>' + esc(card.phr.label) + '</b> – which version?</div><div class="row">' + card.phr.options.map(function (o, i) { keys[i + 1] = i; return '<button class="opt" data-c="' + i + '"><span class="kn">' + (i + 1) + '</span>' + esc(o) + '</button>'; }).join('') + '</div><button class="skip" data-c="skip">Skip (0)</button>'; keys[0] = 'skip'; }
    el.innerHTML = h + '</div>';
    function pick(c) { if (done) return; done = true; removeEventListener('keydown', kd); onPick(c); }
    function kd(e) { var k = e.key === 's' ? 0 : +e.key; if (keys[k] !== undefined && !isNaN(k)) { e.preventDefault(); pick(keys[k]); } }
    addEventListener('keydown', kd);
    [].forEach.call(el.querySelectorAll('button[data-c]'), function (b) { b.onclick = function () { var c = b.getAttribute('data-c'); pick(c === 'skip' || c === 'up' || c === 'down' ? c : +c); }; });
  }
  // ---------- round 2: shared-feature propagation, decision cards, "send today" ----------
  var FACT = [0, 25, 50, 75, 100], DEF_PCT = 50;
  var ASP_FEAT = { seniority: ['junior', 'years5', 'years3', 'senior'], language: ['lang_sv', 'lang_en'], location: ['remote', 'hybrid', 'onsite', 'uppsala'], deadline: ['near_deadline'], effort: ['phone_app_only', 'ch_email', 'ch_form', 'ch_form_unverified', 'ch_account', 'ch_ponty', 'ch_teamtailor'], ai: ['ai_role'] };
  function featOf(key, ft) { var c = (ASP_FEAT[key] || []).filter(function (f) { return ft.indexOf(f) >= 0; }); return key === 'seniority' && c.length > 1 ? [c[0]] : c.slice(0, key === 'location' ? 1 : 9); }
  function create2(data, rng, opt) {
    rng = rng || Math.random; opt = opt || {}; var R2 = data.round2, RN = R2.round || 2, FL = R2.featureLabels, all = data.apps, byId = {}, n = 0, log = [], total = opt.cards || 12;
    all.forEach(function (a) { byId[a.id] = a; });
    var pool = R2.pool.map(function (i) { return byId[i]; }), contrib = {}, shown = {}, rated = {}, decided = {}, pick = null, pc = 0;
    all.forEach(function (a) { contrib[a.id] = (R2.seed[a.id] || []).map(function (x) { return Object.assign({ round: 1 }, x); }); if (R2.urgency[a.id]) contrib[a.id].push({ v: R2.urgency[a.id], what: 'deadline urgency (' + a.days_left + ' d)', src: 'deadline', pct: 100, own: true, round: 0 }); shown[a.id] = 0; rated[a.id] = {}; });
    Object.keys(R2.decided).forEach(function (s) { decided[s] = Object.assign({ auto: true, round: 1 }, R2.decided[s]); });
    function score(id) { return +contrib[id].reduce(function (t, x) { return t + x.v; }, 0).toFixed(2); }
    function ranked() { return pool.slice().sort(function (x, y) { return score(y.id) - score(x.id) || x.days_left - y.days_left; }); }
    function propagate(src, feats, value, pct, what) { // own app always 100%, others share feature × pct
      contrib[src.id].push({ v: +value.toFixed(2), what: what, src: src.company, pct: 100, own: true, round: RN });
      var hit = [];
      feats.forEach(function (f) { all.forEach(function (a) { if (a.id !== src.id && a.features.indexOf(f) >= 0 && pct > 0) { var v = +(value * pct / 100).toFixed(2); contrib[a.id].push({ v: v, what: FL[f], feature: f, src: src.company, pct: pct, own: false, round: RN }); hit.push(a.id); } }); });
      return hit;
    }
    function least(list) { var m = Infinity; list.forEach(function (a) { m = Math.min(m, shown[a.id]); }); var c = list.filter(function (a) { return shown[a.id] === m; }); return c[Math.floor(rng() * Math.min(c.length, 2))]; }
    function openSlots(a) { return a.phrasings.filter(function (p) { return !decided[p.slot]; }); }
    function next() {
      var card = { seq: n + 1, round: RN, shownAt: Date.now(), decided: decided };
      if (n >= total - 1) { card.type = 'final'; card.top = ranked().slice(0, 3); return card; }
      var type = ['pair', 'aspect', 'phrasing'][n % 3];
      if (type === 'phrasing') { var tp = ranked().filter(function (a) { return openSlots(a).length; })[0]; if (!tp) type = 'pair'; else { card.type = 'phrasing'; card.app = tp; card.appId = tp.id; card.phr = openSlots(tp)[0]; return card; } }
      if (type === 'pair') { var r = ranked(), PP = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4]], pr = PP[pc++ % PP.length], A = r[pr[0] % r.length], Bb = r[pr[1] % r.length]; card.type = 'pair'; card.a = A; card.b = Bb; card.app = A; card.appId = A.id; return card; }
      var a = least(pool), cand = a.aspects.filter(function (x) { return rated[a.id][x.key] == null && featOf(x.key, a.features).length; }), c2 = cand.length ? cand : a.aspects.filter(function (x) { return rated[a.id][x.key] == null; });
      card.type = 'aspect'; card.app = a; card.appId = a.id; card.aspect = (c2.length ? c2 : a.aspects)[Math.floor(rng() * (c2.length || a.aspects.length))]; card.feats = featOf(card.aspect.key, a.features);
      card.shares = all.filter(function (b) { return b.id !== a.id && card.feats.some(function (f) { return b.features.indexOf(f) >= 0; }); }).length; return card;
    }
    // choice: pair 'a'|'b'|'skip'; aspect {r:-2..2, pct:0..100|undefined} or 'skip'; phrasing idx|'skip'; final appId|'none'
    function answer(card, choice) {
      var e = { seq: card.seq, round: RN, t: new Date().toISOString(), decisionMs: Date.now() - card.shownAt, type: card.type, choice: choice };
      n++; if (card.app) { e.appId = card.app.id; e.company = card.app.company; shown[card.app.id]++; }
      if (card.type === 'pair') { e.a = card.a.id; e.b = card.b.id; shown[card.b.id]++; if (choice === 'a' || choice === 'b') { var w = choice === 'a' ? card.a : card.b, l = choice === 'a' ? card.b : card.a; e.winner = w.company; contrib[w.id].push({ v: 1, what: 'preferred over ' + l.company, src: 'pair', pct: 100, own: true, round: RN }); contrib[l.id].push({ v: -1, what: 'lost to ' + w.company, src: 'pair', pct: 100, own: true, round: RN }); } }
      if (card.type === 'aspect') { e.aspect = card.aspect.key; e.weight = card.aspect.w; e.features = card.feats; if (choice !== 'skip') { var pct = choice.pct == null ? DEF_PCT : choice.pct; e.choice = choice.r; e.pct = pct; e.pctDefaulted = choice.pct == null; rated[card.app.id][card.aspect.key] = choice.r;
        e.propagatedTo = propagate(card.app, card.feats, choice.r * card.aspect.w, pct, card.aspect.key + ' ' + SCALE[choice.r + 2].k); } }
      if (card.type === 'phrasing') { e.slot = card.phr.slot; if (choice !== 'skip') { decided[card.phr.slot] = { choice: choice, pct: 100, src: card.app.company, round: RN, auto: false }; e.text = card.phr.options[choice]; if (card.phr.blockIds) e.blockId = card.phr.blockIds[choice]; } }
      if (card.type === 'final') { pick = choice; e.top = card.top.map(function (a) { return a.id; }); e.company = choice === 'none' ? 'none' : byId[choice].company; }
      if (card.app) e.scoreAfter = score(card.app.id); log.push(e); return e;
    }
    function phrasingSet(a) { return a.phrasings.map(function (p) { var d = decided[p.slot]; return d ? { slot: p.slot, choice: d.choice, text: p.options[Math.min(d.choice, p.options.length - 1)], from: d.src, round: d.round, auto: !!d.auto } : { slot: p.slot, choice: 0, text: p.options[0], from: 'pack default (undecided)', round: null, auto: true }; }); }
    function line(x) { return (x.v > 0 ? '+' : '') + x.v.toFixed(1) + ' ' + x.what + (x.own ? (x.src === 'pair' || x.src === 'deadline' ? '' : ' (own rating, R' + x.round + ')') : ' (from ' + x.src.replace(/^Statens .*\((\w+)\)$/, '$1').replace(/ (AB|Group AB|Sverige AB)$/, '') + ', ' + x.pct + '%)'); }
    function result() {
      var rk = ranked().map(function (a) { return { id: a.id, company: a.company, role: a.role, deadline: a.deadline, days_left: a.days_left, features: a.features, score: score(a.id), cardsShown: shown[a.id], contributions: contrib[a.id].filter(function (x) { return x.v !== 0; }).map(function (x) { return Object.assign({ line: line(x) }, x); }) }; });
      var st = pick && pick !== 'none' ? byId[pick] : null;
      return { round: RN, ranking: rk, choices: log, scoring: R2.scoring + '; R2 aspect follow-up factor 0–100% (default ' + DEF_PCT + '%)', excludedApplied: R2.removedApplied, appliedCompanies: R2.appliedCompanies,
        decidedSlots: decided, sendToday: st ? { id: st.id, company: st.company, role: st.role, deadline: st.deadline, link: st.link, phrasing: phrasingSet(st) } : (pick === 'none' ? 'none' : null) };
    }
    function summaryHTML() {
      var r = result(), h = '';
      if (r.sendToday && r.sendToday !== 'none') h += '<h3>📨 Send today: ' + esc(r.sendToday.company) + '</h3><div style="text-align:left;font-size:13px">' + esc(r.sendToday.role) + ' · dl ' + esc(r.sendToday.deadline) + '<ul style="padding-left:18px">' + r.sendToday.phrasing.map(function (p) { return '<li><b>' + esc(p.slot) + '</b>' + (p.auto ? ' <span style="color:#9c9">(auto: ' + esc(p.from) + ')</span>' : '') + ': “' + esc(p.text) + '”</li>'; }).join('') + '</ul></div>';
      else h += '<h3>Send today: ' + (r.sendToday === 'none' ? 'none chosen' : '—') + '</h3>';
      return h + '<h3>Ranking (propagated)</h3><ol style="text-align:left;padding-left:22px;font-size:13px">' + r.ranking.map(function (x) {
        return '<li><b>' + esc(x.company) + '</b> – ' + esc(x.role) + ' <span class="k">' + (x.score > 0 ? '+' : '') + x.score + '</span><br><span style="font-size:12px;color:#bbb">' + x.contributions.map(function (c) { return esc(c.line); }).join('<br>') + '</span></li>'; }).join('') + '</ol>';
    }
    return { next: next, answer: answer, result: result, summaryHTML: summaryHTML, score: score, contrib: contrib, decided: decided, round: RN };
  }
  function render2(el, card, onPick) {
    var done = false, keys = {}, h = '<div class="ac"><div class="meta">Round 2 · card ' + card.seq + ' · ' + { pair: 'Which first?', aspect: 'Rate an aspect', phrasing: 'Pick a phrasing', final: 'Decide' }[card.type] + '</div>';
    function hd(a) { return '<h3>' + esc(a.company) + '</h3><div class="meta">' + esc(a.role) + ' · ' + esc(a.location) + ' · dl ' + esc(a.deadline) + ' (' + a.days_left + ' d)</div>'; }
    var ds = Object.keys(card.decided).map(function (s) { var d = card.decided[s]; return esc(s) + ' = option ' + (d.choice + 1) + ' (' + esc(d.src) + ')'; });
    if (card.type === 'pair') { h += '<div class="hint">Send which one first?</div><div class="row"><button class="opt" data-c="a"><span class="kn">1</span><b>' + esc(card.a.company) + '</b><br>' + esc(card.a.role) + ' · ' + card.a.days_left + ' d</button><button class="opt" data-c="b"><span class="kn">2</span><b>' + esc(card.b.company) + '</b><br>' + esc(card.b.role) + ' · ' + card.b.days_left + ' d</button></div><button class="skip" data-c="skip">Skip (0)</button>'; keys = { 1: 'a', 2: 'b', 0: 'skip' }; }
    if (card.type === 'aspect') { h += hd(card.app) + '<div class="hint"><b>' + esc(card.aspect.label) + '</b> – for or against sending?<br><span style="color:#aab">' + esc(card.aspect.hint) + '</span></div><div class="row r5">' + SCALE.map(function (s, i) { keys[i + 1] = s.v; return '<button data-c="' + s.v + '">' + s.k + '</button>'; }).join('') + '</div><button class="skip" data-c="skip">Skip (0)</button>'; keys[0] = 'skip'; }
    if (card.type === 'phrasing') { h += hd(card.app) + '<div class="hint"><b>' + esc(card.phr.label) + '</b> – which version? <span style="color:#aab">(applies to every letter with this slot)</span></div><div class="row">' + card.phr.options.map(function (o, i) { keys[i + 1] = i; return '<button class="opt" data-c="' + i + '"><span class="kn">' + (i + 1) + '</span>' + esc(o) + '</button>'; }).join('') + '</div><button class="skip" data-c="skip">Skip (0)</button>'; keys[0] = 'skip'; }
    if (card.type === 'final') { h += '<h3>Send which one today?</h3><div class="row">' + card.top.map(function (a, i) { keys[i + 1] = a.id; return '<button class="opt" data-c="' + esc(a.id) + '"><span class="kn">' + (i + 1) + '</span><b>' + esc(a.company) + '</b> – ' + esc(a.role) + ' · dl ' + a.days_left + ' d</button>'; }).join('') + '<button class="opt" data-c="none"><span class="kn">4</span>None today</button></div>'; keys[4] = 'none'; }
    if (ds.length && card.type !== 'pair') h += '<div class="meta" style="margin-top:8px;color:#9c9">Auto-applied phrasing: ' + ds.join(' · ') + '</div>';
    el.innerHTML = h + '</div>';
    function fin(c) { if (done) return; done = true; removeEventListener('keydown', kd); onPick(c); }
    function follow(r) { // optional scaling step
      if (!card.shares) return fin({ r: r, pct: 100 });
      keys = {}; el.querySelector('.ac').innerHTML = hd(card.app) + '<div class="hint">You rated <b>' + esc(card.aspect.label) + ' ' + SCALE[r + 2].k + '</b> (100% here).<br>How much should this also count for other positions with the same condition (' + card.feats.map(function (f) { return esc(f); }).join(', ') + '; ' + card.shares + ' apps)?</div><div class="row r5">' + FACT.map(function (p, i) { keys[i + 1] = p; return '<button data-p="' + p + '">' + p + '%</button>'; }).join('') + '</div><button class="skip" data-p="skip">Skip → 50% (0)</button>'; keys[0] = 'skip';
      [].forEach.call(el.querySelectorAll('button[data-p]'), function (b) { b.onclick = function () { var p = b.getAttribute('data-p'); fin({ r: r, pct: p === 'skip' ? undefined : +p }); }; });
      stage = 2;
    }
    var stage = 1;
    function choose(c) { if (card.type === 'aspect' && stage === 1 && c !== 'skip') return follow(+c); if (stage === 2) return fin({ r: lastR, pct: c === 'skip' ? undefined : c }); fin(c); }
    var lastR = null;
    function kd(e) { var k = e.key === 's' ? 0 : +e.key; if (keys[k] !== undefined && !isNaN(k)) { e.preventDefault(); if (stage === 1 && card.type === 'aspect' && keys[k] !== 'skip') lastR = keys[k]; choose(keys[k]); } }
    addEventListener('keydown', kd);
    [].forEach.call(el.querySelectorAll('button[data-c]'), function (b) { b.onclick = function () { var c = b.getAttribute('data-c'); if (card.type === 'aspect' && c !== 'skip') { lastR = +c; return follow(+c); } if (card.type === 'phrasing' && c !== 'skip') return fin(+c); fin(c); }; });
  }
  function createAny(data, rng, opt) { return data.round2 ? create2(data, rng, opt) : create(data, rng); }
  function renderAny(el, card, onPick) { return card.round >= 2 ? render2(el, card, onPick) : render(el, card, onPick); }
  return { create: createAny, create1: create, create2: create2, render: renderAny, CSS: CSS, SCALE: SCALE };
});
