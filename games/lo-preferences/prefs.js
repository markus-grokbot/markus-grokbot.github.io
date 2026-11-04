/* Lo Preferences: pure card/preference logic (UMD, no DOM; node-testable).
   Prefs.create(data, {areas:[ids], rng, segmentSec, cardSec}) -> session. A preference key chosen confirmAt (3) times = strong. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Prefs = f(); })(typeof self !== 'undefined' ? self : this, function () {
  function cardsForMinutes(min, segmentSec, cardSec) { return Math.max(1, Math.round(min * 60 / ((segmentSec || 30) + (cardSec || 0)))); }
  function prefKey(card, choice) {
    if (choice === 'skip' || choice == null) return null;
    if (card.type === 'updown') return (card.key || card.area) + ':' + (choice === 'up' ? 'up' : 'down');
    if (card.type === 'rate') return card.aspect + ':' + (choice > 0 ? '+' : choice < 0 ? '-' : '0');
    if (card.type === 'choice') return card.options[choice].pref;
  }
  function prefLabel(data, key) {
    var i = key.lastIndexOf(':'), base = key.slice(0, i), v = key.slice(i + 1), a = data.areas.find(function (x) { return x.id === base; });
    if ((v === 'up' || v === 'down') && /^dec:/.test(base)) return (v === 'up' ? 'Start now: ' : 'Wait with: ') + base.split(':')[1];
    if (v === 'up' || v === 'down') return (v === 'up' ? '⬆ prioritise ' : '⬇ deprioritise ') + (a ? a.name : base);
    if (v === '+' || v === '-' || v === '0') { var c = data.cards.find(function (x) { return x.aspect === base; }); return (c ? c.prompt.replace(/^Again: how/, 'How') : base) + ' → ' + { '+': 'high', '-': 'low', '0': 'neutral' }[v]; }
    var all = allCards(data); for (var j = 0; j < all.length; j++) { var o = (all[j].options || []).find(function (x) { return x.pref === key; }); if (o) return all[j].prompt + ' → ' + o.label; }
    return key;
  }
  function shuffle(a, rng) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // executors: per-area selection map {areaId: [executorId,...]}
  function defaultExecutors(data) { return (data.executors || []).filter(function (x) { return x.defaultOn !== false; }).map(function (x) { return x.id; }); }
  function normExec(data, saved) { var all = (data.executors || []).map(function (x) { return x.id; }), out = {};
    data.areas.forEach(function (a) { var s = saved && saved[a.id]; out[a.id] = s ? s.filter(function (id) { return all.indexOf(id) >= 0; }) : defaultExecutors(data); });
    // executors added to the data later default per their defaultOn for areas that had a saved list
    if (saved && saved.__known) (data.executors || []).forEach(function (x) { if (saved.__known.indexOf(x.id) < 0 && x.defaultOn !== false) data.areas.forEach(function (a) { if (out[a.id].indexOf(x.id) < 0) out[a.id].push(x.id); }); });
    if (saved && (saved.__dv || 1) < (data.execDefaultsVersion || 1)) (data.executors || []).forEach(function (x) { if (x.defaultSince > (saved.__dv || 1) && x.defaultOn !== false) data.areas.forEach(function (a) { if (out[a.id].indexOf(x.id) < 0) out[a.id].push(x.id); }); });
    out.__known = all; out.__dv = data.execDefaultsVersion || 1; return out; }
  function masterState(sel, areaIds, exId) { var n = areaIds.filter(function (a) { return (sel[a] || []).indexOf(exId) >= 0; }).length; return n === 0 ? 'none' : n === areaIds.length ? 'all' : 'mixed'; }
  function setAll(sel, areaIds, exId, on) { areaIds.forEach(function (a) { var l = sel[a] = sel[a] || [], i = l.indexOf(exId); if (on && i < 0) l.push(exId); if (!on && i >= 0) l.splice(i, 1); }); return sel; }
  // card gate: countdown (cards hidden, game paused), then options appear but taps ignored for graceMs
  function gate(countdownMs, graceMs) { var t = 0; return { tick: function (dt) { t += dt; }, count: function () { return t < countdownMs ? Math.ceil((countdownMs - t) / 1000) : 0; }, shown: function () { return t >= countdownMs; }, clickable: function () { return t >= countdownMs + graceMs; } }; }
  function create(data, o) {
    o = o || {}; var rng = o.rng || Math.random, K = data.confirmAt || 3, on = {}; (o.areas || data.areas.map(function (a) { return a.id; })).forEach(function (id) { on[id] = 1; });
    var mode = o.mode === 'decision' ? 'decision' : 'normal', dArea = mode === 'decision' ? data.areas.find(function (a) { return a.id === o.area; }) : null; if (dArea) { on = {}; on[dArea.id] = 1; }
    var pool = dArea ? (dArea.decisions || []).slice() : data.cards.filter(function (c) { return on[c.area]; }), counts = {}, log = [], shown = {}, queue = [];
    function fill() { // round-robin by area over a shuffled deck so consecutive cards vary
      var by = {}; shuffle(pool.slice(), rng).forEach(function (c) { (by[c.area] = by[c.area] || []).push(c); });
      var ks = shuffle(Object.keys(by), rng), out = []; while (ks.some(function (k) { return by[k].length; })) ks.forEach(function (k) { if (by[k].length) out.push(by[k].shift()); });
      // later passes: cards that could confirm a pending (1/3, 2/3) preference come first
      if (log.length) out.sort(function (a, b) { return pend(b) - pend(a); }); queue = out;
    }
    function pend(c) { var keys = c.type === 'updown' ? [(c.key || c.area) + ':up', (c.key || c.area) + ':down'] : c.type === 'rate' ? [c.aspect + ':+', c.aspect + ':-'] : c.options.map(function (x) { return x.pref; });
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
      return { game: 'lo-preferences', version: '1.1.0', mode: mode, area: dArea ? dArea.id : undefined, at: new Date().toISOString(), confirmAt: K, areasIncluded: Object.keys(on), answered: log.length, strong: prefs.filter(function (p) { return p.strong; }), prefs: prefs, areaRanking: areas, log: log, executors: o.executors ? data.areas.filter(function (a) { return on[a.id]; }).reduce(function (m, a) { m[a.id] = (o.executors[a.id] || []).slice(); return m; }, {}) : undefined };
    }
    function markdown(r) {
      r = r || result(); var L = ['# Lo preferences — ' + r.at + (r.mode === 'decision' ? ' — DECISION ROUND: ' + r.area : ''), '', 'Cards answered: ' + r.answered + ' · strong = chosen ' + K + '×', '', '## Strong current preferences'];
      if (!r.strong.length) L.push('- (none yet)'); r.strong.forEach(function (p) { L.push('- **' + p.text + '** (' + p.count + '×)'); });
      L.push('', '## Building (not yet confirmed)'); r.prefs.filter(function (p) { return !p.strong; }).forEach(function (p) { L.push('- ' + p.text + ' — ' + p.label); });
      L.push('', '## Area priority (up − down)'); r.areaRanking.forEach(function (a, i) { L.push((i + 1) + '. ' + a.name + ' (' + (a.net > 0 ? '+' : '') + a.net + ')'); });
      if (r.executors) { var en = {}; (data.executors || []).forEach(function (x) { en[x.id] = x.name; }); L.push('', '## Executors per area');
        data.areas.forEach(function (a) { if (r.executors[a.id]) L.push('- ' + a.name + ': ' + (r.executors[a.id].map(function (id) { return en[id] || id; }).join(', ') || '(none)')); }); }
      if (r.dataWeight) { var dw = r.dataWeight; L.push('', '## Data weight', '- Setting ' + dw.setting + '/' + dataLevels(data).length + ' · performance ' + Math.round((dw.performance || 0) * 100) + '% · ' + (dw.counted ? 'counted ×' + dw.weight : 'NOT counted (' + dw.reason + ')')); }
      if (r.costPlan) { var en2 = {}; (data.executors || []).forEach(function (x) { en2[x.id] = x.name; }); L.push('', '## Cost level ' + r.costPlan.costLevel + ' (max executor cost ' + r.costPlan.maxCost + ')', '- ' + r.costPlan.meaning);
        Object.keys(r.allowedExecutors || {}).forEach(function (a) { L.push('- ' + a + ': allowed ' + (r.allowedExecutors[a].map(function (id) { return en2[id] || id; }).join(', ') || '(none)')); }); }
      if (r.suggested && r.suggested.length) L.push('', '## Suggested project(s)', '- ' + r.suggested.join(', '));
      return L.join('\n') + '\n';
    }
    return { pool: pool, next: next, answer: answer, status: status, result: result, markdown: markdown, counts: counts };
  }
  function allCards(data) { var out = data.cards.slice(); data.areas.forEach(function (a) { (a.decisions || []).forEach(function (c) { out.push(c); }); }); return out; }
  // ---- cross-session ledger: {version:1, sessions:[{at, mode, area, delta:{areaId:score}, up:{areaId:n}}]} ----
  function sessionEntry(data, r) { var w = (data.threshold || {}).rateWeight; w = w == null ? 0.25 : w; var cm = {}; allCards(data).forEach(function (c) { cm[c.id] = c; });
    var e = { at: r.at, mode: r.mode || 'normal', area: r.area, answered: r.answered, delta: {}, up: {} };
    if (r.dataWeight) { e.setting = r.dataWeight.setting; e.weight = r.dataWeight.weight; e.performance = r.dataWeight.performance; e.counted = r.dataWeight.counted; if (r.dataWeight.reason) e.reason = r.dataWeight.reason; }
    if (e.mode !== 'decision') (r.log || []).forEach(function (l) { var c = cm[l.card]; if (!c || !l.pref) return; var a = l.area, d = 0;
      if (c.type === 'updown' && !c.key) { d = l.choice === 'up' ? 1 : -1; if (d > 0) e.up[a] = (e.up[a] || 0) + 1; }
      else if (c.type === 'rate' && c.priority) d = l.choice > 0 ? w : l.choice < 0 ? -w : 0;
      if (d) e.delta[a] = Math.round(((e.delta[a] || 0) + d) * 1000) / 1000; });
    return e; }
  function emptyLedger() { return { version: 1, sessions: [] }; }
  function mergeLedger(ledger, sessions) { ledger = ledger && ledger.sessions ? ledger : emptyLedger(); var seen = {}, added = 0; ledger.sessions.forEach(function (s) { seen[s.at] = 1; });
    (sessions || []).forEach(function (s) { if (s && s.at && !seen[s.at]) { seen[s.at] = 1; ledger.sessions.push(s); added++; } }); ledger.sessions.sort(function (a, b) { return a.at < b.at ? -1 : 1; }); ledger.added = added; return ledger; }
  // accept an exported result (with .ledger or as single session) or a bare ledger
  function importSessions(data, obj) { if (!obj) return []; if (obj.sessions) return obj.sessions; var out = obj.ledger && obj.ledger.sessions ? obj.ledger.sessions.slice() : [];
    if (obj.game === 'lo-preferences' && obj.log && !out.some(function (s) { return s.at === obj.at; })) out.push(sessionEntry(data, obj)); return out; }
  function thresholdFor(data, a) { var t = data.threshold || {}, o = a.threshold || {}; return { minScore: o.minScore != null ? o.minScore : t.minScore != null ? t.minScore : 5, minUpSessions: o.minUpSessions != null ? o.minUpSessions : t.minUpSessions != null ? t.minUpSessions : 2 }; }
  function standings(data, ledger) { var ss = (ledger && ledger.sessions) || [];
    return data.areas.map(function (a) { var sc = 0, us = 0, t = thresholdFor(data, a); ss.forEach(function (s) { var w = sessionWeight(s); sc += ((s.delta || {})[a.id] || 0) * w; if (w > 0 && (s.up || {})[a.id] > 0) us++; });
      sc = Math.round(sc * 100) / 100; var prog = Math.max(0, Math.min(1, Math.min(t.minScore > 0 ? sc / t.minScore : 1, t.minUpSessions > 0 ? us / t.minUpSessions : 1)));
      return { id: a.id, name: a.name, score: sc, upSessions: us, minScore: t.minScore, minUpSessions: t.minUpSessions, progress: prog, crossed: sc >= t.minScore && us >= t.minUpSessions, decisions: (a.decisions || []).length }; })
      .sort(function (x, y) { return (y.crossed - x.crossed) || (y.progress - x.progress) || (y.score - x.score); }); }
  // ---- data-weight setting + performance ----
  // stats: {activeMs, distance, idealDistance, faced, crashes}; log: card answers ({choice, ms})
  function performance(data, stats, log) { var fast = ((data.dataStrict || {}).fastMs) || 700; stats = stats || {}; log = log || [];
    var noCrash = stats.faced > 0 ? Math.max(0, 1 - stats.crashes / stats.faced) : 1, dist = stats.idealDistance > 0 ? Math.min(1, stats.distance / stats.idealDistance) : 1, gameplay = 0.6 * noCrash + 0.4 * dist;
    var n = log.length, ans = log.filter(function (l) { return l.choice !== 'skip'; }), quick = ans.filter(function (l) { return l.ms < fast; }).length;
    var answered = n ? ans.length / n : 1, sane = ans.length ? 1 - quick / ans.length : 1, focus = answered * sane;
    var r = function (x) { return Math.round(x * 1000) / 1000; };
    return { score: r(0.6 * gameplay + 0.4 * focus), gameplay: r(gameplay), focus: r(focus), noCrash: r(noCrash), distance: r(dist), answered: r(answered), sane: r(sane), fastAnswers: quick, skipped: n - ans.length, crashes: stats.crashes || 0, faced: stats.faced || 0 }; }
  function dataLevels(data) { return data.dataWeight || [0.25, 0.5, 1, 1.5, 2]; }
  // -> {setting, weight, nominalWeight, counted, performance, reason}
  function weighSession(data, level, perf) { var W = dataLevels(data), L = Math.max(1, Math.min(W.length, level || 3)), w = W[L - 1], S = data.dataStrict || {}, from = S.fromLevel || W.length - 1, min = S.minPerformance != null ? S.minPerformance : 0.8;
    var out = { setting: L, nominalWeight: w, weight: w, counted: true, performance: perf ? perf.score : null, strict: L >= from };
    if (out.strict && (!perf || perf.score < min)) { out.weight = 0; out.counted = false; out.reason = 'performance ' + Math.round((perf ? perf.score : 0) * 100) + '% < ' + Math.round(min * 100) + '% required at setting ' + L; }
    return out; }
  function sessionWeight(s) { return s && typeof s.weight === 'number' ? s.weight : 1; }
  // ---- cost level ----
  function costPlan(data, level, exec) { var C = data.costLevels || [], L = Math.max(1, Math.min(C.length || 5, level || 3)), max = C[L - 1] ? C[L - 1].maxCost : 3, out = {};
    var cost = {}; (data.executors || []).forEach(function (x) { cost[x.id] = x.cost || 0; });
    data.areas.forEach(function (a) { var sel = (exec && exec[a.id]) || []; out[a.id] = { allowedExecutors: sel.filter(function (id) { return (cost[id] || 0) <= max; }), overBudget: sel.filter(function (id) { return (cost[id] || 0) > max; }) }; });
    return { costLevel: L, maxCost: max, meaning: C[L - 1] ? C[L - 1].text : '', areas: out }; }
  function suggested(data, ledger) { return standings(data, ledger).filter(function (s) { return s.crossed; }).map(function (s) { return s.id; }); }
  return { allCards: allCards, sessionEntry: sessionEntry, emptyLedger: emptyLedger, mergeLedger: mergeLedger, importSessions: importSessions, thresholdFor: thresholdFor, standings: standings, suggested: suggested,
    performance: performance, weighSession: weighSession, sessionWeight: sessionWeight, costPlan: costPlan, dataLevels: dataLevels, create: create, defaultExecutors: defaultExecutors, normExec: normExec, masterState: masterState, setAll: setAll, gate: gate, cardsForMinutes: cardsForMinutes, prefKey: prefKey, prefLabel: prefLabel };
});
