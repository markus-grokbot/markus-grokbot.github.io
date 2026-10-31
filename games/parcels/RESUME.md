# Parcel Panic · RESUME (parked 2026-10-31, evening, Europe/Stockholm)

Parked by request. Offer to resume on a **Friday night / Saturday / Sunday** (gamification work that doesn't touch real content).
Live: https://markus-grokbot.github.io/games/parcels/?mode=session (current round **round-007**). Everything is synthetic.

## State at park
- **Rounds:** 001–007; `rounds/index.json → current = round-007` (32 parcels, 10 clusters: 2 carried + 8 new from llama).
- **Human logs processed (full weight unless noted):** r001 (×0.5, pace), r002, r003, r004 priority + handling, r005 session, r006 session.
- **Ledger** (`data/parcel-ledger.json`, rule 1.0.0: 3 consistent in a row settles, manual review after 5 tries):
  - priority: 22 settled · 23 open · 13 new · 3 manual review (p008, p029, r003-llama-06)
  - handling: 6 settled · 8 open · 42 new · 5 manual review (p037, p011, p030, r003-llama-02, r003-qwen-02)
  - clusters: 25 memberships · 3 settled in · 13 settled out · 9 open
- **Batches / lanes** (`outputs/queue.json`, plan only):
  1. `round-005-c002` Invoice and Payment: **unlocked, low lane** (night queue, free tools only: local Ollama / OpenCode free; no
     paid budget), combined priority 122. Picks saved in `outputs/round-005-c002/` (phrasing + codepass).
  2. `round-006-c001` Overdue Payments: pending, low lane after one more consistent answer for 2 members (114). Picks from round 6 already in `outputs/round-006-c001/`.
  - No high-lane batch yet (none has ≥ 50 % settled high-priority members and combined ≥ 140).
- **Leaderboard** (`data/model-scores.json`): ranking qwen2.5:1.5b (cumulative 0.583) > llama3.2:3b (0.577).
  Round 6: qwen priority 0.707 / handling 0.532 / cluster 0.21 / codepass 1 of 2; llama priority 0.623 / handling 0.655 /
  cluster 0.25 / phrasing 2 of 2 (only llama-vs-llama pairs) / codepass 1 of 2. Per-stage columns in `stageColumns`.

## Open caveats / bugs
- Repeats inside one sitting count separately: two cycles of one session give 2 of the 3 consistent answers (see next steps #1).
- Local models are weak: llama often returns 0/0 positions; qwen often returns empty JSON (its phrasings failed in rounds 6–7, so
  phrasing A/B is llama guided vs terse only); phrasings are generic ("Dear valued customers"); code plans are loosely related.
- Model-written parcels have high rejection rates (validator), so rounds lean on seed + carried parcels.
- Low-lane code plans are filtered by a keyword list (paid-tool names); a heuristic, not a guarantee.
- queue.json is not wired to anything; batches never execute and nothing is sent.
- Sim artifacts: `*.sim.json`, `rounds/*-sim.json`, `outputs/sim/`, `logs/sim/`; never mixed into human files.

## Design history (and his feedback)
1. **v1 classic** (`?v=1`): falling parcels, swipe into 5 bins. His round 1: pace too fast → graded at weight 0.5.
2. **v2 bins** (`?v=2`): calm 2D drag field with countdown and soft bins.
3. **Priority** (default): urgency × importance → priority 0–100, quadrants, "your queue".
4. **Handling** (`?mode=handling`): manual vs automated × spend → tiers local Ollama < OpenCode free < Codex < Grok Build; budget pool. Consistency ledger: act only on settled items.
5. **Session** (`?mode=session`, his ask: chain evaluations; warm-up, cycles of 1→n, then outputs once a threshold is reached): warm-up → (priority → handling → cluster) × 2 → threshold → phrasing / code-plan A/B → summary. SESSION.md.
6. **Lanes** (his answer: "lowest priority content would get placed with free tools only in the night queues, only processed when the night queue runs out of more prioritized work"): any batch with ≥ 2 confirmed members unlocks; high lane vs low lane (night, free-only, lowest precedence). outputs/QUEUE.md.

## Process a new log (from /workspace/site)
```bash
cp <attachment> games/parcels/logs/human/<same filename the game gave>.json && cmp <attachment> games/parcels/logs/human/<file>.json
# session log:
node games/parcels/tools/session-process.js --log games/parcels/logs/human/<file>.json      # ledger + clusters + grades + outputs + queue
node games/parcels/tools/next-round.js --round <round-N> --log games/parcels/logs/human/<file>.json --session-ok   # grade, build round-N+1 (~10-15 min)
node games/parcels/tools/session-prep.js --round <round-N+1>                                  # clusters + phrasing/code candidates (~5 min)
node games/parcels/tools/session-process.js --log games/parcels/logs/human/<file>.json      # refresh stageColumns for the new round
node games/parcels/tools/queue.js                                                            # queue.json for the current round
# priority/handling logs: next-round.js --round <round-N> --log <priority.json>[,<handling.json>]
# checks: python3 -m http.server 8765 (from /workspace/site); node games/parcels/sim/headless-check.mjs "http://127.0.0.1:8765/games/parcels/?mode=session&sim=1&skill=good&fast=16"
```
Push: commit as markus-grokbot (noreply), push with the GH_GROKBOT_TOKEN one-off credential helper, no force pushes. Ollama at 127.0.0.1:11555; don't pull large models without asking.

## Next steps (prioritised)
1. **3-in-different-rounds rule:** settle priority / handling / cluster memberships only on consistent answers from ≥ 2 (or 3) different sessions, not repeats within one sitting.
2. **Model quality:** fix qwen's empty JSON (timeouts / format), then consider one bigger local model (with Markus's OK on size) so phrasings and code plans become useful; keep llama/qwen as baselines.
3. **First high-lane batch:** keep playing sessions until a batch qualifies; check the high-lane budget split reads sensibly.
4. **Wire queue.json to the real night routines:** only after Markus explicitly approves; low lane strictly free tools.
5. **Real content:** only after Markus explicitly approves; until then fictional parcels only.
