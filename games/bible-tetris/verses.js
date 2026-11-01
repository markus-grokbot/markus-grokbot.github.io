/* Bible verse layer for Bible Tetris: colors by scheme, steward effects, achievements, seed export.
   Pure logic (no DOM); UMD: window.BibleRound / module.exports. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.BibleRound = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MAX_ACH = 5;
  function verseText(bible, v) { var b = bible.books.filter(function (b) { return b.id === v.osis; })[0], c = b && b.chapters[String(v.chapter)], out = []; for (var i = v.verse_start; i <= v.verse_end; i++) out.push(c && c[String(i)]); return out.join(' '); }
  function create(o) {
    var verses = o.verses, bible = o.bible, cats = o.categories, scheme = cats.schemes[o.scheme] ? o.scheme : cats.default_scheme, S = cats.schemes[scheme];
    var rng = o.rng || Math.random, byId = {}; verses.forEach(function (v) { byId[v.id] = v; });
    var stewardW = o.stewardWeight == null ? 0.2 : o.stewardWeight, stewards = verses.filter(function (v) { return v.effect; }), plain = verses.filter(function (v) { return !v.effect; });
    var R;
    function reset() { R = { events: [], colors: [], effects: [], achievements: [], achKeys: {}, conjunctions: [], noteworthy: {}, active: [], placedSince: [], tetrises: 0, lines: 0 }; }
    reset();
    function cat(id) { var v = byId[id], k = v && v.categories && v.categories[scheme]; if (!S.categories[k]) k = S.fallback; return k; }
    function color(id) { return S.categories[cat(id)].color; }
    function ev(id, pieceNo, t, event, extra) { var v = byId[id], e = Object.assign({ ref: v.ref, id: id, piece_index: pieceNo, t: t, event: event, category: cat(id), color: color(id) }, extra || {}); R.events.push(e);
      if (v.noteworthy_algorithmic && v.noteworthy_algorithmic.flag) { var n = R.noteworthy[id] || (R.noteworthy[id] = { id: id, ref: v.ref, pattern_type: v.pattern_type, note: v.noteworthy_algorithmic.note, game_uses: v.game_uses, events: {} }); n.events[event] = (n.events[event] || 0) + 1; } return e; }
    function ach(key, title, id, t) { if (R.achKeys[key] || R.achievements.length >= MAX_ACH || !id) return; var v = byId[id]; R.achKeys[key] = 1; R.achievements.push({ key: key, title: title, id: id, ref: v.ref, text: verseText(bible, v), t: t }); }
    function applyEffects(trigger, base, t, ctx) { var delta = 0, used = []; R.active.forEach(function (id) { var v = byId[id], e = v.effect; if (!e || e.trigger !== trigger) return; used.push(id);
        var d = e.kind === 'multiplier' ? base * (e.game_value - 1) : e.game_value; if (!d) return; delta += d;
        R.effects.push({ id: id, ref: v.ref, kind: e.kind, trigger: trigger, game_value: e.game_value, score_delta: Math.round(d), condition: e.condition, t: t, ctx: ctx || null });
        if (e.kind === 'multiplier') ach('faithful', 'Faithful steward: multiplier earned', id, t); if (e.kind === 'penalty') ach('buried', 'Unprofitable servant: penalty', id, t); if (e.kind === 'bonus') ach('bonus', 'Well done: steward bonus', id, t); });
      R.active = R.active.filter(function (id) { return used.indexOf(id) < 0; }); // each steward verse pays out once
      return Math.round(delta); }
    return {
      scheme: scheme, color: color, category: cat, byId: byId, text: function (id) { return verseText(bible, byId[id]); },
      reset: reset,
      pick: function () { var pool = stewards.length && rng() < stewardW ? stewards : plain; return pool[Math.floor(rng() * pool.length)].id; },
      onSpawn: function (i, t) { if (!i.verse) return; ev(i.verse, i.pieceNo, t, 'spawned'); },
      // returns score delta from effects
      onLock: function (i, t) {
        var delta = 0;
        if (i.verse) { ev(i.verse, i.pieceNo, t, 'placed'); R.colors.push({ i: R.colors.length, category: cat(i.verse), color: color(i.verse), id: i.verse, ref: byId[i.verse].ref, event: 'placed' }); R.placedSince.push(i.verse); if (byId[i.verse].effect) R.active.push(i.verse); }
        if (!i.linesCleared) return 0;
        R.lines += i.linesCleared;
        var ids = Array.from(new Set(i.clearedVerseIds || [])), tet = i.linesCleared === 4;
        if (tet) { if (!ids.length) ids = Array.from(new Set(R.placedSince)); R.placedSince = []; R.tetrises++; }
        ids.forEach(function (id) { ev(id, i.pieceNo, t, tet ? 'cleared-in-tetris' : 'cleared', { lines: i.linesCleared }); });
        if (tet) { R.colors.forEach(function (c) { if (ids.indexOf(c.id) >= 0 && c.event === 'placed') c.event = 'cleared-in-tetris'; }); ach('tetris', 'Tetris: four rows at once', ids[0], t); }
        if (i.linesCleared >= 2 && ids.length >= 2) { R.conjunctions.push({ refs: ids.map(function (id) { return byId[id].ref; }), ids: ids, categories: ids.map(cat), lines: i.linesCleared, time: t, flag_for_analysis: true });
          ach('conjunction', 'Conjunction: verses cleared together', ids[1], t);
          if (new Set(ids.map(cat)).size >= Math.min(3, S.group_size || 3)) ach('colors', 'Full spectrum: ' + new Set(ids.map(cat)).size + ' colors in one clear', ids[2] || ids[0], t); }
        var base = i.baseScore || 0; delta += applyEffects('line_clear', base, t, { lines: i.linesCleared }); if (tet) delta += applyEffects('tetris', base, t, { lines: 4 });
        return delta;
      },
      onLevelEnd: function (outcome, stats, t) { var d = 0; if (outcome === 'complete') d += applyEffects('level_complete', 0, t); else d += applyEffects('topout', 0, t); if (stats.holes > 0) d += applyEffects('holes_at_end', 0, t, { holes: stats.holes }); return d; },
      state: function () { return R; },
      exportLog: function () { return { verse_events: R.events, conjunctions: R.conjunctions, effects_applied: R.effects, achievements: R.achievements, noteworthy_algorithmic: Object.keys(R.noteworthy).map(function (k) { return R.noteworthy[k]; }) }; },
      seed: function (stats) { var counts = {}; R.colors.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
        var seen = {}, features = []; R.events.forEach(function (e) { if (seen[e.id]) return; seen[e.id] = 1; var v = byId[e.id]; features.push({ id: v.id, ref: v.ref, pattern_type: v.pattern_type, feature: (v.game_uses || [])[0] || null, magnitude: R.events.filter(function (x) { return x.id === v.id && x.event !== 'spawned'; }).length || 1 }); });
        return { schema: 'bible-seed', version: 1, scheme: scheme, colors: { counts: counts, sequence: R.colors }, effects: R.effects.map(function (e) { return { id: e.id, ref: e.ref, kind: e.kind, trigger: e.trigger, game_value: e.game_value, applied: true }; }), achievements: R.achievements.map(function (a) { return { key: a.key, title: a.title, id: a.id, ref: a.ref, text: a.text }; }), features: features, stats: Object.assign({ lines: R.lines, tetrises: R.tetrises }, stats || {}) }; }
    };
  }
  return { create: create, verseText: verseText, MAX_ACH: MAX_ACH };
});
