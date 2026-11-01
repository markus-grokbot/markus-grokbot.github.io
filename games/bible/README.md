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

## Bible Shooter (`/games/bible-shooter/`)
A pixel-conveyor puzzle. A pixel field is surrounded by a belt, and 5 lanes of colored shooters wait below. Tapping a lane's top shooter puts it on the belt. It travels up the right side, left along the top, down the left side and back along the bottom. On every tick it shoots the first pixel in its straight inward line if the color matches, and its counter decrements (it is removed at 0). After one lap, a shooter with count left parks in one of 5 slots (tap a parked shooter to re-enter it). A shooter that needs to park when all 5 slots are full loses the level. Clearing every pixel wins (for each color, the shooter counts sum to the pixel count).
- `engine.js`: deterministic rules (shared by UI, bots, generator). `bots.js`: greedy / random / lookahead policies.
- `generator.js`: color ratios → symmetric motif (rings, diamonds, mandala, tiles, waves, starburst, squares) with regions assigned to alternate colors and rebalanced to the ratios; shooters are split per color and dealt into lanes (higher difficulty = more and smaller shooters, more "inside-out" lane order). `generateValidated` rejects unsolvable and trivial levels.
- `sim.js`: `node games/bible-shooter/sim.js --levels` (win rates), `--gen '{"father":.5,"son":.3,"spirit":.2}' --difficulty 3`, `--seed-log <tetris log>`, `--build-levels` (rebuilds `starter-levels.json`).
- Tetris seed path (experimental): `?seed=1` shows a file picker or "Use sample seed". It reads the log's `seed.colors.counts` → ratios → generator, with its palette from `seed.scheme`. The knobs live in `seed-mappings.json` → `pixel_shooter`.
- Log: per level, the taps (source, color, count, parking snapshot), parks, depletions, outcome/loseReason, ticks, maxParkingUsed and shotsByColor; downloadable, stored in `bible-shooter.logs.v1`.
