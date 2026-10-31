#!/usr/bin/env node
/* Re-run only step (d) labelling + A/B questions for an existing round file (e.g. after a parser fix), same prompts/options.
   node games/parcels/tools/relabel.js --round round-003 */
const L = require('./lib.js'), path = require('path'); const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => { const rid = arg('--round'), f = path.join(L.ROOT, 'rounds', rid + '.json'), R = L.readJ(f), runDir = path.join(L.ROOT, 'runs', rid), tag = 'r' + L.pad(R.roundNo);
  for (const m of Object.keys(R.models)) { const t0 = Date.now(), r = await (R.task === 'priority' ? L.labelAllPriority : L.labelAll)(m, R.parcels, R.models[m].rubric, runDir, tag);
    Object.assign(R.models[m], { labels: r.labels || {}, positions: r.positions, summaries: r.summaries, stats: Object.assign(r.stats, { wallMs: Date.now() - t0, relabelled: new Date().toISOString() }) });
    console.log(m, 'labelled', Object.keys(r.positions || r.labels).length + '/' + R.parcels.length, Object.keys(r.summaries).length, 'summaries'); }
  R.abQuestions = L.abQuestions(R, 3); L.writeJ(f, R); console.log('A/B', R.abQuestions.length);
})();
