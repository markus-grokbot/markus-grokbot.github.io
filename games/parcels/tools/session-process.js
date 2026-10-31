#!/usr/bin/env node
/* Process one SESSION log (?mode=session) on the box: ledger (priority + handling evals per level mode, cluster
   memberships), cluster-consistency counts, model grading per stage (cluster proposals by his belongs answers,
   phrasings / code plans by his A/B picks), output artifacts games/parcels/outputs/<batch>/{phrasing,codepass}.json
   (plans for later agentic use: nothing is sent or executed) and per-stage leaderboard columns.
   node games/parcels/tools/session-process.js --log <session.json> [--sim]   (--sim: *.sim.json ledger/board, outputs/sim/) */
const L = require('./lib.js'), ST = require('../stages.js'), path = require('path'), fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; }, SIM = process.argv.includes('--sim');
const lp = path.resolve(L.REPO, arg('--log')), log = L.readJ(lp), rel = path.relative(L.REPO, lp), sp = log.summary.parcels;
if (sp.mode !== 'session') throw new Error('not a session log (mode ' + sp.mode + ')'); if (!SIM && (log.run.type !== 'human' || sp.sim)) throw new Error('sim log: use --sim');
const rid = sp.roundId, round = L.readJ(path.join(L.ROOT, 'rounds', rid + '.json')), T = L.readJ(path.join(L.ROOT, 'tuning.json'));
const LGP = path.join(L.ROOT, 'data/parcel-ledger.json'), LGO = SIM ? path.join(L.ROOT, 'data/parcel-ledger.sim.json') : LGP, ledger = L.readJ(SIM && fs.existsSync(LGO) ? LGO : LGP);
const before = { priority: L.LG.counts(ledger, 'priority'), handling: L.LG.counts(ledger, 'handling'), clusters: ST.clusterCounts(ledger, T) };
const added = L.ledgerAddLog(ledger, log, round, rel); L.ledgerRefresh(ledger); ledger.clusterCounts = ST.clusterCounts(ledger, T); if (SIM) ledger.kind = 'sim'; L.writeJ(LGO, ledger);
const after = { priority: ledger.counts.priority, handling: ledger.counts.handling, clusters: ledger.clusterCounts };
// ---- grading per stage ----
const cl = {}; (round.session ? round.session.clusters : []).forEach(c => { cl[c.id] = c; });
const g = {}; L.MODELS.forEach(m => { g[m] = { cluster: { answered: 0, confirmed: 0 }, phrasing: { shown: 0, wins: 0 }, codepass: { shown: 0, wins: 0 } }; });
const levels = log.levels || [];
levels.filter(l => l.ext && l.ext.cluster).forEach(l => l.ext.cluster.decisions.forEach(d => (d.proposedBy || (cl[d.clusterId] || {}).proposedBy || []).forEach(m => { if (!g[m]) return; g[m].cluster.answered++; if (d.belongs) g[m].cluster.confirmed++; })));
const picks = []; levels.filter(l => l.ext && l.ext.pairwise && /^(phrasing|codepass)$/.test(l.ext.pairwise.setKind)).forEach(l => l.ext.pairwise.decisions.forEach(d => { picks.push(d); [d.modelA, d.modelB].forEach(m => { if (g[m]) g[m][d.kind].shown += d.modelA === d.modelB ? 0.5 : 1; }); if (d.winnerModel && g[d.winnerModel]) g[d.winnerModel][d.kind].wins++; }));
const rate = (a, b) => b ? +(a / b).toFixed(3) : null;
Object.keys(g).forEach(m => { const x = g[m]; x.cluster.precision = rate(x.cluster.confirmed, x.cluster.answered); x.phrasing.winRate = rate(x.phrasing.wins, x.phrasing.shown); x.codepass.winRate = rate(x.codepass.wins, x.codepass.shown); });
// ---- output artifacts ----
const outRoot = path.join(L.ROOT, 'outputs', SIM ? 'sim' : ''), written = [];
const byBatch = {}; picks.forEach(d => { (byBatch[d.batch] = byBatch[d.batch] || []).push(d); });
Object.keys(byBatch).forEach(b => { const c = cl[b] || { id: b }, O = (round.session.outputs || {})[b] || {}, dir = path.join(outRoot, b); fs.mkdirSync(dir, { recursive: true });
  const find = (arr, id) => (arr || []).find(x => x.id === id);
  ['phrasing', 'codepass'].forEach(k => { const ds = byBatch[b].filter(d => d.kind === k); if (!ds.length) return; const wins = {}; ds.forEach(d => { if (d.winner) wins[d.winner] = (wins[d.winner] || 0) + 1; }); const best = Object.keys(wins).sort((x, y) => wins[y] - wins[x])[0];
    const art = { schema: 'parcels-output', kind: k, version: '1.0.0', sim: SIM || !!sp.seededUnlock, seededUnlock: !!sp.seededUnlock, status: 'plan-only: nothing sent or executed; for later agentic use if it becomes relevant', batch: { id: b, label: c.label, rationale: c.rationale, work: c.work, members: c.members, proposedBy: c.proposedBy }, round: rid, fromLog: rel, picks: ds.map(d => ({ pairId: d.pairId, a: d.itemA, b: d.itemB, choice: d.choice, winner: d.winner, winnerModel: d.winnerModel, ms: d.decisionTimeMs })), preferred: best ? find(O[k], best) : null, candidates: O[k] || [] };
    if (k === 'phrasing' && art.preferred) art.toneSignal = ds.filter(d => d.winner).map(d => { const w = d.winner === d.itemA ? d.dimsA : d.dimsB, lz = d.winner === d.itemA ? d.dimsB : d.dimsA, o = {}; Object.keys(Object.assign({}, w, lz)).forEach(k2 => { o[k2] = ((w || {})[k2] || 0) - ((lz || {})[k2] || 0); }); return o; });
    const f = path.join(dir, k + '.json'); L.writeJ(f, art); written.push(path.relative(L.REPO, f)); }); });
// ---- leaderboard per-stage columns ----
const BP = path.join(L.ROOT, 'data', SIM ? 'model-scores.sim.json' : 'model-scores.json'), board = L.readJ(BP); board.stageColumns = board.stageColumns || {};
Object.keys(g).forEach(m => { const h = board.models[m] && board.models[m].history.slice(-1)[0], sc = board.stageColumns[m] = board.stageColumns[m] || {};
  if (h) { sc.priority = h.priority ? h.priority.agreement : h.weightedAgreement; if (h.handling) sc.handling = h.handling.agreement; sc.fromRound = h.round; }
  const keep = (k, v, n) => { if (v != null) { const o = sc[k + 'Hist'] = (sc[k + 'Hist'] || []).filter(x => x.log !== rel).concat([{ log: rel, value: v, n }]); sc[k] = +(o.reduce((a, x) => a + x.value * x.n, 0) / o.reduce((a, x) => a + x.n, 0)).toFixed(3); } };
  keep('cluster', g[m].cluster.precision, g[m].cluster.answered); keep('phrasing', g[m].phrasing.winRate, g[m].phrasing.shown); keep('codepass', g[m].codepass.winRate, g[m].codepass.shown); });
board.stageColumnsNote = 'Per-stage model columns: priority/handling = latest round agreement; cluster = share of its proposed memberships he confirmed; phrasing/codepass = A/B win rate (weighted over session logs).';
board.sessions = (board.sessions || []).filter(s => s.log !== rel).concat([{ log: rel, round: rid, processedAt: new Date().toISOString(), grades: g, outputs: written }]); L.writeJ(BP, board);
console.log(JSON.stringify({ log: rel, ledgerEvalsAdded: added, before, after, grades: g, outputs: written }, null, 1));
