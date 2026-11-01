# Bible games: data + pipeline

KJV (public domain) verse data driving Bible Tetris → seed → Bible Tycoon (→ pixel shooter, later).

## Data (`games/bible/data/`)
| file | what |
|---|---|
| `bible-kjv.json` | full KJV, `books[{id (OSIS), name, chapters{c:{v:text}}}]`, 66 books / 31,102 verses |
| `algorithmic-verses.json` | verses with `ref`, `pattern_type`, `game_uses`, `categories{scheme:key}`, `noteworthy_algorithmic{flag,note}`, optional steward `effect{kind,value,condition,trigger,game_value}` |
| `categories.json` | color **schemes** (`trinity3`, `liturgical`, `sevens`) + `numeric_groupings` (3/7/9 → schemes) |
| `seed-mappings.json` | how a Tetris seed becomes tycoon (and, stubbed, pixel-shooter) content; all numbers live here |
| `ideas-typology-numerology.md` | parked typology/numerology ideas |

## Tweaking without code
- **Colors/categories:** edit a scheme in `categories.json` (color, label, `keywords`, `book_bias`, `pattern_types`, `fallback`, `min_score`), or add a new scheme. Then retag + validate:
  `node tools/tag-verses.js && node tools/validate-verses.js`
- **Pick a scheme in a game:** `games/bible-tetris/?scheme=liturgical` (default `trinity3`).
- **Steward effects:** `effect.kind` multiplier|bonus|penalty, `value` = the scripture number (e.g. 100-fold). `tag-verses.js` derives `trigger` (line_clear, tetris, level_complete, topout, holes_at_end) and the scaled `game_value` (a multiplier m becomes 1+0.25·log2 m; a bonus becomes +50·v pts; a penalty becomes −100·v pts). Each steward verse pays out once per level after its I piece is placed.
- **Tycoon economics / feature mapping:** `seed-mappings.json` → `tycoon` (`features_by_pattern_type`, `effects`, costs, hardness by category).

## Pipeline
1. **Play Bible Tetris** (`/games/bible-tetris/`). Each I piece carries a verse colored by scheme. Tetrises (4 lines) collect their verses. A clear of 2+ lines with 2+ verses is logged as a *conjunction* (`flag_for_analysis`). At the end, at most 5 **achievements** are shown with their KJV text.
2. **Download the log.** It contains `verse_events`, `conjunctions`, `effects_applied`, `achievements`, `noteworthy_algorithmic`, and **`seed`** (`bible-seed` v1: `colors.counts/sequence`, `effects`, `achievements`, `features`, `stats`).
3. **Load it in Bible Tycoon** (`/games/bible-tycoon/`, file picker or the bundled sample). The colored sequence becomes obstacles. Workers clear them and the cleared tiles become buildable factories. Pattern types become features (multiplication → production, census/genealogy → workers, measurement/grid → building size, sequence/loop → efficiency, seven/forty → sabbath cycle). Steward effects change the multiplier and coins.
4. **Analysis:** `node tools/conjunctions.js <log.json>` lists the conjunctions with their text and game_uses.

## Tools
- `tools/test-bible-tetris.js [scheme]`: headless play-test that forces a real 4-line clear through engine + verse layer (asserts events, conjunction, effect, achievements, seed).
- `tools/sim-bible-tetris.js [scheme] [pieces] [out]`: bot-played round → full log with seed (generates `games/bible-tycoon/sample-seed.json`).
