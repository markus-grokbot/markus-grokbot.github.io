# Batch queue (`outputs/queue.json`) · assessment / plan only

Nothing here executes, and it is not wired to the real night routines. Built by `tools/queue.js` (also run by `tools/session-process.js`).

- **Unlock:** a cluster with ≥ 2 confirmed members (3 consistent "belongs" answers in the ledger, or confirmed in the current session) unlocks.
- **High lane** (☀, day queue, precedence 1): settled high-priority share ≥ 50 % **and** combined priority ≥ 140. Existing tiers
  allowed (local Ollama, OpenCode free, Codex, Grok Build); `budgetShare` splits 90 % of the automated budget pool by combined priority.
- **Low lane** (🌙, night queue, lowest precedence): every other unlocked batch. Free tools only (local Ollama / OpenCode free; no
  Codex, Grok Build or paid tiers), no paid budget (`budgetShare` 0, `freeComputeShare` splits free night capacity), processed only
  when the night queue has no higher-priority work left. Code plans are limited to free-tier steps.
- **Order:** high lane by combined priority, then low lane by combined priority, then pending batches (with what's missing).
