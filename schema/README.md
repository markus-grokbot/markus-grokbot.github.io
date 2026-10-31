# gameplay-log v1
Game-agnostic run log. One file = one run (one player session across levels). See `gameplay-log.v1.schema.json`.
- `game` {id, version, iteration, namespace}; `run` {type human|sim, device, player, seed, tuningSource}.
- `levels[]`: `params` (every tunable knob active for the level), `outcome`, `durationMs`, generic `metrics`
  (score, actions, misplays, progress), `events[]` ({t ms, type}), and `ext.<namespace>` for game-specific stats
  (tetris: lines, pieces, maxHeight, holesEnd, avgHoles, bumpinessEnd, gravityMs, lockDelayMs).
- `transitions[]`: auto-generated diff of `params` between consecutive levels, plus `mechanicsAdded/Removed`
  name lists, so future games can log new mechanics (not just speed) in the same structure.
Bump `schemaVersion` minor for additive fields, major for breaking changes.

## 1.1.0 (additive, 2026-10-31)
- Optional top-level `session` {id, kind, segments[{index, levelIndex, kind: tetris|pairwise, outcome, durationMs, ...}]}.
  Each segment is also a normal `levels[]` entry (with `segment` set), so 1.0.0 readers still work.
- `endLevel(outcome, metrics, ext, ns)` may write ext under a namespace other than `game.namespace`
  (combo logs use `ext.tetris` and `ext.pairwise`).
- Tetris: one `lock` event per locked piece with `how` (hard_drop | soft_drop | gravity | place). Fixes 1.0.0 logs
  where `hard_drop` events < pieces because gravity/soft-drop locks were never logged.
- `ext.pairwise`: {setId, setVersion, demo, pairsShown, decisionsMade, undos, decisions[{seq, pairId, criterion, itemA,
  itemB, choice A|B|tie|not_enough_info, winner, strength 1-3|null, decisionTimeMs, reasonTags[], swapped, undone, source}]}.
