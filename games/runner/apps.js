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
      if (card.type === 'phrasing') { e.slot = card.phr.slot; if (choice !== 'skip') { s.phrasings[card.phr.slot] = choice; e.text = card.phr.options[choice]; } }
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
  return { create: create, render: render, CSS: CSS, SCALE: SCALE };
});
