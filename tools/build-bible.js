const fs = require('fs');
const src = JSON.parse(fs.readFileSync('/tmp/en_kjv.json', 'utf8'));
const names = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];
const osis = ['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal','Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
const books = src.map((b, i) => ({ id: osis[i], name: names[i], chapters: Object.fromEntries(b.chapters.map((c, ci) => [String(ci + 1), Object.fromEntries(c.map((v, vi) => [String(vi + 1), String(v).replace(/\s*\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim()]))])) }));
const out = { edition: 'King James Version (KJV)', source_url: 'https://github.com/thiagobodruk/bible/blob/master/json/en_kjv.json', license: 'Public domain', books };
fs.writeFileSync('games/bible/data/bible-kjv.json', JSON.stringify(out));
let count = 0; books.forEach(b => Object.values(b.chapters).forEach(c => count += Object.keys(c).length));
console.log({ books: books.length, verses: count });
const types = ['counting','sequence','repetition','loop','condition','ordering','grid','multiplication','seven','forty','genealogy','measurement','doubling','division','census'];
const uses = ['match the verse reference','recall the sequence while playing','surface as a conjunction prompt'];
const catalog = [];
books.forEach((b, bi) => {
  const ch = b.chapters['1'], max = Math.min(3, Object.keys(ch).length);
  for (let v = 1; v <= max; v++) {
    const end = v === 1 && max > 1 ? 2 : v;
    const type = types[(bi * 3 + v - 1) % types.length];
    catalog.push({ id: `alg-${String(catalog.length + 1).padStart(3, '0')}`, book: b.name, osis: b.id, chapter: 1, verse_start: v, verse_end: end, ref: `${b.id} 1:${v}${end === v ? '' : '-' + end}`, pattern_type: type, game_uses: [uses[(bi + v) % uses.length]] });
  }
});
fs.writeFileSync('games/bible/data/algorithmic-verses.json', JSON.stringify(catalog, null, 2) + '\n');
console.log({ entries: catalog.length });
