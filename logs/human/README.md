# Human runs (highest priority calibration data)
Play https://markus-grokbot.github.io/games/tetris/ , tap "Download log" after a level, then add the file here
(GitHub web: Add file → Upload files → logs/human/). File names: `human-<game>-it<N>-<runid>.json`.
Human data overrides sim data for every level it covers (see /games/ITERATING.md). No secrets are in the logs.

Parcel Panic: download from the summary screen (`human-parcels-round-NNN-<runid>.json`), upload here, then run `node games/parcels/tools/next-round.js` on the box (games/parcels/LOOP.md).

Parcel Panic 0.4.0: `ext.parcels.mode` is `priority` or `handling`. Handling decisions also carry `manual`, `automation`, `spend` and `tier`. The summary carries `plan[]`, `tiers` and `budgetPool`. The schema stays 1.2.x (additive).
