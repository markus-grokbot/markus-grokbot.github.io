const fs = require('fs');
const log = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const bible = JSON.parse(fs.readFileSync('games/bible/data/bible-kjv.json', 'utf8'));
const entries = JSON.parse(fs.readFileSync('games/bible/data/algorithmic-verses.json', 'utf8'));
const lookup = Object.fromEntries(bible.books.flatMap(b => Object.entries(b.chapters).flatMap(([c, vs]) => Object.entries(vs).map(([v, text]) => [`${b.id} ${c}:${v}`, text]))));
const meta = Object.fromEntries(entries.map(e => [e.id, e]));
for (const c of log.conjunctions || log.levels?.flatMap(l => l.ext?.tetris?.conjunctions || []) || []) {
  console.log(`${c.refs.join(' + ')} [${c.ids.join(', ')}]`);
  c.ids.forEach(id => { const e = meta[id]; if (e) console.log(`  ${e.ref}: ${Array.from({length:e.verse_end-e.verse_start+1}, (_,i) => lookup[`${e.osis} ${e.chapter}:${e.verse_start+i}`]).join(' ')}`); console.log(`  uses: ${(e && e.game_uses || []).join('; ')}`); });
}
