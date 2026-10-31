#!/usr/bin/env node
/* Build round-001 from hand-written seed parcels + blind bin predictions/summaries from each Ollama model.
   node games/parcels/tools/seed-round.js [--models llama3.2:3b,qwen2.5:1.5b] */
const L = require('./lib.js'), path = require('path');
(async () => {
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; }, models = (arg('--models') || L.MODELS.join(',')).split(',');
  const seed = L.readJ(path.join(__dirname, 'seed-parcels.json')), runDir = path.join(L.ROOT, 'runs', 'round-001-seed');
  const bad = seed.parcels.map(p => [p.id, L.validParcel(p)]).filter(x => x[1].length); if (bad.length) { console.error('seed invalid', JSON.stringify(bad)); process.exit(1); }
  const parcels = seed.parcels.map(p => ({ id: p.id, senderType: p.senderType, sender: p.sender, subject: p.subject, snippet: p.snippet, badge: p.badge || null, author: 'seed', anchor: !!p.anchor }));
  const round = { schema: 'parcels-round', version: '1.0.0', roundId: 'round-001', roundNo: 1, synthetic: true, sim: false, createdAt: new Date().toISOString(),
    note: 'SYNTHETIC fictional parcels. models[*].labels are blind predictions, never shown in the game; reference = seed author bins, sanity check only.', bins: L.BINS, parcels, models: {}, reference: {}, abQuestions: [], pipeline: { runDir: 'runs/round-001-seed', options: L.OPTIONS } };
  seed.parcels.forEach(p => { round.reference[p.id] = p.ref; });
  for (const m of models) { const t0 = Date.now(); const r = await L.labelAll(m, parcels, null, runDir, 'r001'); round.models[m] = { labels: r.labels, summaries: r.summaries, rubric: [], authored: 0, stats: Object.assign(r.stats, { wallMs: Date.now() - t0 }) };
    const n = Object.keys(r.labels).length, ag = Object.keys(r.labels).filter(k => r.labels[k] === round.reference[k]).length; console.log(m, 'labelled', n + '/' + parcels.length, 'agree w/ reference', ag + '/' + n, 'summaries', Object.keys(r.summaries).length, (Date.now() - t0) + ' ms'); }
  round.abQuestions = L.abQuestions(round, 3);
  L.writeJ(path.join(L.ROOT, 'rounds', 'round-001.json'), round); L.writeJ(path.join(L.ROOT, 'rounds', 'index.json'), { current: 'round-001', rounds: ['round-001'], sim: [] });
  console.log('wrote rounds/round-001.json, ab questions', round.abQuestions.length);
})().catch(e => { console.error(e.message); process.exit(1); });
