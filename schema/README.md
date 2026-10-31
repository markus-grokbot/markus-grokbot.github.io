# gameplay-log v1
Game-agnostic run log. One file = one run (one player session across levels). See `gameplay-log.v1.schema.json`.
- `game` {id, version, iteration, namespace}; `run` {type human|sim, device, player, seed, tuningSource}.
- `levels[]`: `params` (every tunable knob active for the level), `outcome`, `durationMs`, generic `metrics`
  (score, actions, misplays, progress), `events[]` ({t ms, type}), and `ext.<namespace>` for game-specific stats
  (tetris: lines, pieces, maxHeight, holesEnd, avgHoles, bumpinessEnd, gravityMs, lockDelayMs).
- `transitions[]`: auto-generated diff of `params` between consecutive levels, plus `mechanicsAdded/Removed`
  name lists, so future games can log new mechanics (not just speed) in the same structure.
Bump `schemaVersion` minor for additive fields, major for breaking changes.
