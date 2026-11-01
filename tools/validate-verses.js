const fs = require('fs');
const bible = JSON.parse(fs.readFileSync('games/bible/data/bible-kjv.json', 'utf8'));
const entries = JSON.parse(fs.readFileSync('games/bible/data/algorithmic-verses.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('games/bible/data/categories.json', 'utf8'));
const byId = Object.fromEntries(bible.books.map(b => [b.id, b]));
const errors = [];
for (const e of entries) {
  const book = byId[e.osis], chapter = book && book.chapters[String(e.chapter)];
  if (!book || !chapter) errors.push(`${e.id}: missing ${e.ref}`);
  for (let v = e.verse_start; v <= e.verse_end; v++) if (!chapter || !chapter[String(v)]) errors.push(`${e.id}: missing ${e.ref} verse ${v}`);
  if (e.ref !== `${e.osis} ${e.chapter}:${e.verse_start}${e.verse_end === e.verse_start ? '' : '-' + e.verse_end}`) errors.push(`${e.id}: bad ref`);
  for (const scheme of Object.keys(categories.schemes)) {
    if (!e.categories || !categories.schemes[scheme].categories[e.categories[scheme]]) errors.push(`${e.id}: bad ${scheme} category`);
  }
  if (e.effect && (!['multiplier','penalty','bonus'].includes(e.effect.kind) || typeof e.effect.value !== 'number' || typeof e.effect.condition !== 'string')) errors.push(`${e.id}: bad effect`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`valid: ${entries.length} entries; ${bible.books.length} books`);
