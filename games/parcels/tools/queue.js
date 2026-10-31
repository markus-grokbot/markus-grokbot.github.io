#!/usr/bin/env node
/* Batch queue assessment: games/parcels/outputs/queue.json (+ outputs/sim/queue.json with --sim). PLAN ONLY: nothing executes and it is
   not wired to the real night routines. High lane first (by combined priority), then the low lane: night queue, free tools only,
   processed only when the higher queue is empty. node games/parcels/tools/queue.js [--sim] [--round round-006] */
const L = require('./lib.js'), ST = require('../stages.js'), path = require('path'), fs = require('fs');
function build(opts) { opts = opts || {}; const SIM = !!opts.sim, T = L.readJ(path.join(L.ROOT, 'tuning.json')), B = ST.cfg(T).batch, lanes = B.lanes;
  const ledger = L.readJ(path.join(L.ROOT, 'data', SIM && fs.existsSync(path.join(L.ROOT, 'data/parcel-ledger.sim.json')) ? 'parcel-ledger.sim.json' : 'parcel-ledger.json'));
  const rid = opts.round || L.readJ(path.join(L.ROOT, 'rounds/index.json')).current, round = L.readJ(path.join(L.ROOT, 'rounds', rid + '.json')), cs = (round.session && round.session.clusters) || [];
  const rows = cs.filter(c => (ledger.clusters || {})[c.id]).map(c => { const st = ST.batchStatus(c, ledger, T), lc = ledger.clusters[c.id].members;
    const pend = c.members.filter(pid => { const m = ST.memberStreak((lc[pid] || {}).evals, B.clusterSettleAfter); return !m.settled && m.value === true; }).map(pid => ({ parcelId: pid, streak: ST.memberStreak(lc[pid].evals, B.clusterSettleAfter).streak }));
    const prov = ST.batchStatus(c, ledger, T, { belongs: { [c.id]: Object.fromEntries(pend.map(p => [p.parcelId, true])) } });
    const outDir = path.join(L.ROOT, 'outputs', SIM ? 'sim' : '', c.id), arts = ['phrasing', 'codepass'].filter(k => fs.existsSync(path.join(outDir, k + '.json'))).map(k => path.relative(L.REPO, path.join(outDir, k + '.json')));
    return { batch: c.id, label: c.label, work: c.work, members: c.members.length, status: st.unlocked ? 'unlocked' : 'pending', lane: st.unlocked ? st.lane : prov.unlocked ? prov.lane : null,
      confirmed: st.confirmed, pendingConfirmations: pend, combinedPriority: st.unlocked ? st.combinedPriority : prov.combinedPriority, settledHighShare: st.unlocked ? st.settledHighShare : prov.settledHighShare,
      why: st.unlocked ? [] : (prov.unlocked ? ['unlocks after one more consistent "belongs" answer for ' + pend.length + ' member(s)'] : st.why), highLaneWhy: (st.unlocked ? st : prov).highLaneWhy, outputs: arts }; }).filter(r => r.lane || r.status === 'pending');
  const ord = r => (r.lane === 'high' ? 0 : r.lane === 'low' ? 1 : 2) + (r.status === 'unlocked' ? 0 : 0.5);
  rows.sort((a, b) => ord(a) - ord(b) || b.combinedPriority - a.combinedPriority);
  const hiSum = rows.filter(r => r.lane === 'high').reduce((a, r) => a + r.combinedPriority, 0), loSum = rows.filter(r => r.lane === 'low').reduce((a, r) => a + r.combinedPriority, 0);
  rows.forEach((r, i) => { r.position = i + 1; const ln = r.lane && lanes[r.lane]; if (!ln) { r.queue = null; r.allowedTiers = []; r.budgetShare = 0; return; }
    r.queue = ln.queue; r.precedence = ln.precedence; r.allowedTiers = ln.allowedTiers; r.freeOnly = !!ln.freeOnly;
    r.budgetShare = r.lane === 'high' ? +(ln.budgetPool * r.combinedPriority / (hiSum || 1)).toFixed(3) : 0;
    if (r.lane === 'low') { r.freeComputeShare = +(r.combinedPriority / (loSum || 1)).toFixed(3); r.runWhen = 'night queue, only when it has no higher-priority work left'; } });
  const q = { schema: 'parcels-queue', version: '1.0.0', sim: SIM, status: 'assessment/plan only: nothing executes; not wired to the real night routines', builtAt: new Date().toISOString(), round: rid,
    rule: B.unlock, lanes, budgetNote: 'budgetShare = share of the paid/automated budget pool (high lane only, split by combined priority). Low lane spends no paid budget; freeComputeShare splits free night capacity by combined priority.', entries: rows };
  const out = path.join(L.ROOT, 'outputs', SIM ? 'sim' : '', 'queue.json'); fs.mkdirSync(path.dirname(out), { recursive: true }); L.writeJ(out, q); return { file: path.relative(L.REPO, out), q }; }
module.exports = { build };
if (require.main === module) { const a = process.argv, i = a.indexOf('--round'); const r = build({ sim: a.includes('--sim'), round: i > 0 ? a[i + 1] : null }); console.log(r.file); r.q.entries.forEach(e => console.log(e.position, e.status, e.lane, e.batch, e.label, e.combinedPriority, e.allowedTiers.join('/'), e.budgetShare, e.why.join('; '))); }
