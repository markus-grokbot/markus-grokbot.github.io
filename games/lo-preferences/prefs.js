/* Lo Preferences: pure card/preference logic (UMD, no DOM; node-testable).
   Prefs.create(data, {areas:[ids], rng, segmentSec, cardSec}) -> session. A preference key chosen confirmAt (3) times = strong. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Prefs = f(); })(typeof self !== 'undefined' ? self : this, function () {
  function cardsForMinutes(min, segmentSec, cardSec) { return Math.max(1, Math.round(min * 60 / ((segmentSec || 30) + (cardSec || 0)))); }
  function prefKey(card, choice) {
    if (choice === 'skip' || choice == null) return null;
    if (card.type === 'updown') return card.area + ':' + (choice === 'up' ? 'up' : 'down');
    if (card.type === 'rate') return card.aspect + ':' + (choice > 0 ? '+' : choice < 0 ? '-' : '0');
    if (card.type === 'choice') return card.options[choice].pref;
  }
  function prefLabel(data, key) {
    var i = key.lastIndexOf(':'), base = key.slice(0, i), v = key.slice(i + 1), a = data.areas.find(function (x) { return x.id === base; });
    if (v === 'up' || v === 'down') return (v === 'up' ? '⬆ prioritise ' : '⬇ deprioritise ') + (a ? a.name : base);
    if (v === '+' || v === '-' || v === '0') { var c = data.cards.find(function (x) { return x.aspect === base; }); return (c ? c.prompt.replace(/^Again: how/, 'How') : base) + ' → ' + { '+': 'high', '-': 'low', '0': 'neutral' }[v]; }
    for (var j = 0; j < data.cards.length; j++) { var o = (data.cards[j].options || []).find(function (x) { return x.pref === key; }); if (o) return data.cards[j].prompt + ' → ' + o.label; }
    return key;
  }
  function shuffle(a, rng) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // executors: per-area selection map {areaId: [executorId,...]}
  function defaultExecutors(data) { return (data.executors || []).filter(function (x) { return x.defaultOn !== false; }).map(function (x) { return x.id; }); }
  function normExec(data, saved) { var all = (data.executors || []).map(function (x) { return x.id; }), out = {};
    data.areas.forEach(function (a) { var s = saved && saved[a.id]; out[a.id] = s ? s.filter(function (id) { return all.indexOf(id) >= 0; }) : defaultExecutors(data); });
    // executors added to the data later default per their defaultOn for areas that had a saved list
    if (saved && saved.__known) (data.executors || []).forEach(function (x) { if (saved.__known.indexOf(x.id) < 0 && x.defaultOn !== false) data.areas.forEach(function (a) { if (out[a.id].indexOf(x.id) < 0) out[a.id].push(x.id); }); });
    out.__known = all; return out; }
  function masterState(sel, areaIds, exId) { var n = areaIds.filter(function (a) { return (sel[a] || []).indexOf(exId) >= 0; }).length; return n === 0 ? 'none' : n === areaIds.length ? 'all' : 'mixed'; }
  function setAll(sel, areaIds, exId, on) { areaIds.forEach(function (a) { var l = sel[a] = sel[a] || [], i = l.indexOf(exId); if (on && i < 0) l.push(exId); if (!on && i >= 0) l.splice(i, 1); }); return sel; }
  // card gate: countdown (cards hidden, game paused), then options appear but taps ignored for graceMs
  function gate(countdownMs, graceMs) { var t = 0; return { tick: function (dt) { t += dt; }, count: function () { return t < countdownMs ? Math.ceil((countdownMs - t) / 1000) : 0; }, shown: function () { return t >= countdownMs; }, clickable: function () { return t >= countdownMs + graceMs; } }; }
  function create(data, o) {
    o = o || {}; var rng = o.rng || Math.random, K = data.confirmAt || 3, on = {}; (o.areas || data.areas.map(function (a) { return a.id; })).forEach(function (id) { on[id] = 1; });
    var pool = data.cards.filter(function (c) { return on[c.area]; }), counts = {}, log = [], shown = {}, queue = [];
    function fill() { // round-robin by area over a shuffled deck so consecutive cards vary
      var by = {}; shuffle(pool.slice(), rng).forEach(function (c) { (by[c.area] = by[c.area] || []).push(c); });
      var ks = shuffle(Object.keys(by), rng), out = []; while (ks.some(function (k) { return by[k].length; })) ks.forEach(function (k) { if (by[k].length) out.push(by[k].shift()); });
      // later passes: cards that could confirm a pending (1/3, 2/3) preference come first
      if (log.length) out.sort(function (a, b) { return pend(b) - pend(a); }); queue = out;
    }
    function pend(c) { var keys = c.type === 'updown' ? [c.area + ':up', c.area + ':down'] : c.type === 'rate' ? [c.aspect + ':+', c.aspect + ':-'] : c.options.map(function (x) { return x.pref; });
      return keys.some(function (k) { return counts[k] > 0 && counts[k] < K; }) ? 1 : 0; }
    function next() { if (!pool.length) return null; if (!queue.length) fill(); var c = queue.shift(); shown[c.id] = (shown[c.id] || 0) + 1; return { card: c, seq: log.length + 1, shownAt: Date.now() }; }
    function status(key) { var n = counts[key] || 0; return { key: key, count: n, label: n >= K ? 'strong' : n + '/' + K, strong: n >= K }; }
    function answer(h, choice) {
      var key = prefKey(h.card, choice), e = { seq: h.seq, t: new Date().toISOString(), ms: Date.now() - h.shownAt, card: h.card.id, area: h.card.area, type: h.card.type, choice: choice, pref: key };
      if (key) { counts[key] = (counts[key] || 0) + 1; e.status = status(key).label; e.becameStrong = counts[key] === K; }
      log.push(e); return e;
    }
    function result() {
      var prefs = Object.keys(counts).map(function (k) { var s = status(k); s.text = prefLabel(data, k); return s; }).sort(function (a, b) { return b.count - a.count; });
      var areas = data.areas.filter(function (a) { return on[a.id]; }).map(function (a) { return { id: a.id, name: a.name, net: (counts[a.id + ':up'] || 0) - (counts[a.id + ':down'] || 0) }; }).sort(function (a, b) { return b.net - a.net; });
      return { game: 'lo-preferences', version: '1.0.0', at: new Date().toISOString(), confirmAt: K, areasIncluded: Object.keys(on), answered: log.length, strong: prefs.filter(function (p) { return p.strong; }), prefs: prefs, areaRanking: areas, log: log, executors: o.executors ? data.areas.filter(function (a) { return on[a.id]; }).reduce(function (m, a) { m[a.id] = (o.executors[a.id] || []).slice(); return m; }, {}) : undefined };
    }
    function markdown(r) {
      r = r || result(); var L = ['# Lo preferences — ' + r.at, '', 'Cards answered: ' + r.answered + ' · strong = chosen ' + K + '×', '', '## Strong current preferences'];
      if (!r.strong.length) L.push('- (none yet)'); r.strong.forEach(function (p) { L.push('- **' + p.text + '** (' + p.count + '×)'); });
      L.push('', '## Building (not yet confirmed)'); r.prefs.filter(function (p) { return !p.strong; }).forEach(function (p) { L.push('- ' + p.text + ' — ' + p.label); });
      L.push('', '## Area priority (up − down)'); r.areaRanking.forEach(function (a, i) { L.push((i + 1) + '. ' + a.name + ' (' + (a.net > 0 ? '+' : '') + a.net + ')'); });
      if (r.executors) { var en = {}; (data.executors || []).forEach(function (x) { en[x.id] = x.name; }); L.push('', '## Executors per area');
        data.areas.forEach(function (a) { if (r.executors[a.id]) L.push('- ' + a.name + ': ' + (r.executors[a.id].map(function (id) { return en[id] || id; }).join(', ') || '(none)')); }); }
      return L.join('\n') + '\n';
    }
    return { pool: pool, next: next, answer: answer, status: status, result: result, markdown: markdown, counts: counts };
  }
  return { create: create, defaultExecutors: defaultExecutors, normExec: normExec, masterState: masterState, setAll: setAll, gate: gate, cardsForMinutes: cardsForMinutes, prefKey: prefKey, prefLabel: prefLabel };
});
