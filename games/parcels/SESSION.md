# Parcel Panic · chained session (`?mode=session`, game 0.5.0)

One sitting chains the evaluation stages so related work is processed together. Sim: `?mode=session&sim=1&fast=16`.

```mermaid
flowchart TD
  W[Warm-up 45 s<br/>priority field, slow, reuses qualities] --> P1
  subgraph C1[Cycle 1..n  - tuning.json session.cycles]
    P1[Priority<br/>unsettled parcels] --> H1[Handling<br/>Handle first / Schedule ones] --> K1[Cluster<br/>Belongs? / merge?]
  end
  K1 -->|more cycles, not all settled| P1
  K1 --> T{Batch threshold?<br/>≥2 confirmed members<br/>≥50% settled high-priority<br/>combined priority ≥140}
  T -->|unlocked| O1[Output A/B: reply phrasing<br/>tone profile]
  T -->|unlocked + code work| O2[Output A/B: code-pass plan]
  T -->|locked| L[🔒 reasons shown]
  O1 --> S[Summary: stages, ledger before/after, batches, outputs]
  O2 --> S
  L --> S
  S --> X[session log → tools/session-process.js]
  X --> LG[ledger: priority, handling, cluster memberships]
  X --> GR[model grades per stage → leaderboard stageColumns]
  X --> OUT[outputs/&lt;batch&gt;/phrasing.json · codepass.json<br/>plans only: nothing sent or executed]
```

## Stage registry (`stages.js`)
`ParcelStages.register(id, def)`: wave stages (`warmup`, `priority`, `handling`), an overlay stage (`cluster`) and output stages
(`phrasing`, `codepass`). `plan(tuning)` expands `session.chain` × `session.cycles` into steps; add a stage by registering it and
naming it in `tuning.json → session.chain`.

## Pipeline on the box
1. `tools/next-round.js` builds round N (parcels, priority + handling labels).
2. `tools/session-prep.js --round round-N` asks each Ollama model for clusters (label, rationale, work type, members); clusters with
   Jaccard ≥ 0.6 merge. For the top 3 it writes guided/terse reply phrasings (tone style guide) and code-pass plans for code work.
   Written to `round.session`.
3. He plays `?mode=session`; the log goes to `logs/human/`.
4. `tools/session-process.js --log <file>` → ledger (+ cluster evals, 3 same answers in a row = membership settled), model grades
   (cluster precision = share of its proposed memberships he confirmed; phrasing/codepass = A/B win rate), `outputs/<batch>/`,
   per-stage columns in `data/model-scores.json → stageColumns`. Then next-round for the following round.
   `--sim` writes only `*.sim.json` and `outputs/sim/`.

## Thresholds (`tuning.json → session.batch`)
A cluster becomes a batch when ≥ `minMembers` (2) members are confirmed, ≥ `minSettledHighShare` (50 %) of them are settled in
Handle first/Schedule in the priority ledger, and their combined priority ≥ `combinedPriorityThreshold` (140). A SIM round can carry
`session.seededUnlock` with lowered thresholds (share 0, combined 60) to demonstrate the unlock path; it is labelled SIM everywhere.
