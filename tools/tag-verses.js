#!/usr/bin/env node
// Deterministic, tweakable tagger: assigns categories per scheme from keyword lists in
// games/bible/data/categories.json (schemes.*.categories.*.keywords + book_defaults) and
// normalizes steward effects to game triggers. Rerun after editing categories.json:
//   node tools/tag-verses.js && node tools/validate-verses.js
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '../games/bible/data');
const bible = require(D + '/bible-kjv.json'), cats = require(D + '/categories.json');
const file = D + '/algorithmic-verses.json', list = require(file);
const books = Object.fromEntries(bible.books.map(b => [b.id, b]));
const text = v => { const c = books[v.osis].chapters[v.chapter]; let t = ''; for (let i = v.verse_start; i <= v.verse_end; i++) t += ' ' + c[i]; return t; };
const NT = new Set(bible.books.slice(39).map(b => b.id)), GOSPELS = new Set(['Matt', 'Mark', 'Luke', 'John']);
function tag(v, scheme) {
  const s = cats.schemes[scheme], t = text(v).toLowerCase(); let best = null, bs = 0;
  for (const [k, c] of Object.entries(s.categories)) {
    let sc = 0; for (const w of c.keywords || []) { const m = t.match(new RegExp('\\b' + w.toLowerCase(), 'g')); if (m) sc += m.length * (w.includes(' ') ? 2 : 1); }
    for (const [cond, bonus] of Object.entries(c.book_bias || {})) if ((cond === 'NT' && NT.has(v.osis)) || (cond === 'gospels' && GOSPELS.has(v.osis)) || cond === v.osis) sc += bonus;
    if (v.pattern_type && (c.pattern_types || []).includes(v.pattern_type)) sc += 1.5;
    if (sc > bs) { bs = sc; best = k; }
  }
  return bs >= (s.min_score || 1) ? best : s.fallback;
}
function trigger(e) {
  const c = (e.condition || '').toLowerCase();
  if (e.kind === 'penalty') return /unused|buried|hid|napkin|earth/.test(c) ? 'holes_at_end' : 'topout';
  if (e.kind === 'multiplier') return e.value >= 30 ? 'tetris' : 'line_clear';
  return 'level_complete';
}
function gameValue(e) {
  if (e.kind === 'multiplier') return +(1 + 0.25 * Math.log2(Math.max(e.value, 1.5))).toFixed(2); // x2 -> 1.25, x100 -> 2.66
  if (e.kind === 'penalty') return -100 * Math.max(1, Math.min(e.value, 5));
  return 50 * Math.max(1, Math.min(e.value, 10));
}
const counts = {};
for (const v of list) {
  v.categories = {}; for (const s of Object.keys(cats.schemes)) { const k = tag(v, s); v.categories[s] = k; counts[s] = counts[s] || {}; counts[s][k] = (counts[s][k] || 0) + 1; }
  if (v.effect) { v.effect.trigger = trigger(v.effect); v.effect.game_value = gameValue(v.effect); }
  if (!v.game_uses || !v.game_uses.length) v.game_uses = v.effect ? [v.effect.kind + ' ' + v.effect.value + ' when: ' + v.effect.condition] : ['pattern: ' + v.pattern_type];
}
fs.writeFileSync(file, JSON.stringify(list, null, 1));
console.log(JSON.stringify(counts, null, 0), 'effects:', list.filter(v => v.effect).length);
