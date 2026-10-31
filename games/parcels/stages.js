/* Parcel Panic session chain (UMD; page + Node pipeline + sim). Stage registry + cluster ledger + batch threshold.
   A SESSION = warm-up wave, then cycles of the configurable chain (default priority -> handling -> cluster) on the working
   set, then OUTPUT stages (phrasing / codepass A/B) for any batch that passes the threshold. Register new stage types with
   register(id, def); def.kind is 'wave' (drag field, def.mode = engine mode), 'overlay' (cards) or 'output' (A/B, per batch).
   CLUSTER CONSISTENCY: per (cluster, parcel) "belongs" answers by the human; settled after clusterSettleAfter (3) identical
   answers in a row. BATCH (unlocks outputs) when, over the members he confirmed (this session's latest answer, else a settled
   ledger answer): >= minMembers, share settled high-priority (ledger priority state 'settled', latest quadrant in
   highQuadrants) >= minSettledHighShare, and summed latest priority >= combinedPriorityThreshold. All values in tuning.json. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(require('./ledger.js')); else root.ParcelStages = f(root.ParcelLedger); })(typeof self !== 'undefined' ? self : this, function (LG) {
  var VERSION = '1.0.0', REG = {};
  function register(id, def) { REG[id] = Object.assign({ id: id }, def); return REG[id]; }
  register('warmup', { kind: 'wave', mode: 'priority', label: 'Warm-up', note: 'slow priority wave; reads your state (qualities), counts toward the ledger' });
  register('priority', { kind: 'wave', mode: 'priority', label: 'Priority', note: 'urgency x importance' });
  register('handling', { kind: 'wave', mode: 'handling', label: 'Handling', note: 'automated vs manual, relative spend' });
  register('cluster', { kind: 'overlay', label: 'Adjacency', note: 'confirm / split / merge model-proposed clusters' });
  register('phrasing', { kind: 'output', label: 'Reply phrasing', note: 'A/B between model reply phrasings for an unlocked batch' });
  register('codepass', { kind: 'output', label: 'Code pass', note: 'A/B between model implementation-step plans for a code batch' });
  var DEF = { chain: ['priority', 'handling', 'cluster'], cycles: 2, batch: { minMembers: 2, minSettledHighShare: 0.5, highQuadrants: ['first', 'schedule'], combinedPriorityThreshold: 140, clusterSettleAfter: 3 } };
  function cfg(t) { var s = (t && t.session) || {}, o = JSON.parse(JSON.stringify(DEF)); Object.keys(s).forEach(function (k) { if (k === 'batch') Object.assign(o.batch, s.batch); else o[k] = s[k]; }); o.chain = o.chain.filter(function (id) { return REG[id]; }); return o; }
  function plan(t) { var c = cfg(t), steps = [{ stage: 'warmup', cycle: 0 }]; for (var i = 1; i <= c.cycles; i++) c.chain.forEach(function (id) { steps.push({ stage: id, cycle: i }); }); steps.push({ stage: 'outputs', cycle: c.cycles + 1 }); return steps; }
  function latestPrio(ledger, pid, extra) { var e = (ledger && ledger.parcels[pid] && ledger.parcels[pid].evals) || []; e = e.concat(extra || []); var ev = LG.counting(e, 'priority'), st = LG.status(e, 'priority'), l = ev[ev.length - 1]; return { state: st.state, streak: st.streak, priority: l ? l.priority : null, quadrant: l ? l.quadrant : null }; }
  function memberStreak(evals, n) { var s = 0, v = null; (evals || []).forEach(function (e) { if (e.by !== 'human') return; if (e.belongs === v) s++; else { s = 1; v = e.belongs; } }); return { streak: s, value: v, settled: s >= (n || 3) }; }
  function memberEvals(ledger, cid, pid) { var c = ledger && ledger.clusters && ledger.clusters[cid]; return (c && c.members && c.members[pid] && c.members[pid].evals) || []; }
  // sess: { belongs: {cid: {pid: bool}}, prio: {pid: [evals]} } from the running session (optional)
  function batchStatus(cluster, ledger, T, sess) { var b = cfg(T).batch, conf = [], rows = []; sess = sess || {};
    cluster.members.forEach(function (pid) { var now = sess.belongs && sess.belongs[cluster.id] && sess.belongs[cluster.id][pid], ms = memberStreak(memberEvals(ledger, cluster.id, pid).concat(now == null ? [] : [{ by: 'human', belongs: now }]), b.clusterSettleAfter), inB = now != null ? now : ms.settled ? ms.value : null, p = latestPrio(ledger, pid, sess.prio && sess.prio[pid]);
      var hi = p.state === 'settled' && b.highQuadrants.indexOf(p.quadrant) >= 0; rows.push({ parcelId: pid, belongs: inB, memberStreak: ms.streak, memberSettled: ms.settled, prioState: p.state, quadrant: p.quadrant, priority: p.priority, settledHigh: hi }); if (inB) conf.push(rows[rows.length - 1]); });
    var sum = conf.reduce(function (a, r) { return a + (r.priority || 0); }, 0), sh = conf.filter(function (r) { return r.settledHigh; }).length, share = conf.length ? sh / conf.length : 0;
    var why = []; if (conf.length < b.minMembers) why.push('needs ' + b.minMembers + ' confirmed members (has ' + conf.length + ')'); if (share < b.minSettledHighShare) why.push('settled high-priority share ' + Math.round(share * 100) + '% < ' + Math.round(b.minSettledHighShare * 100) + '%'); if (sum < b.combinedPriorityThreshold) why.push('combined priority ' + Math.round(sum) + ' < ' + b.combinedPriorityThreshold);
    return { clusterId: cluster.id, confirmed: conf.length, settledHigh: sh, settledHighShare: +share.toFixed(2), combinedPriority: Math.round(sum), threshold: b.combinedPriorityThreshold, unlocked: !why.length, why: why, members: rows }; }
  // cluster ledger (Node pipeline writes it; page previews)
  function addClusterEvals(ledger, decisions, round, at) { ledger.clusters = ledger.clusters || {}; var n = 0; (decisions || []).forEach(function (d) { if (d.belongs == null) return; var c = ledger.clusters[d.clusterId] = ledger.clusters[d.clusterId] || { members: {} }, m = c.members[d.parcelId] = c.members[d.parcelId] || { evals: [] }; m.evals.push({ round: round, by: d.by || 'human', belongs: d.belongs, at: at, ms: d.ms }); n++; }); return n; }
  function clusterCounts(ledger, T) { var n = cfg(T).batch.clusterSettleAfter, c = { members: 0, settledIn: 0, settledOut: 0, open: 0, streak: { 1: 0, 2: 0, 3: 0 } }; Object.keys((ledger && ledger.clusters) || {}).forEach(function (cid) { var M = ledger.clusters[cid].members; Object.keys(M).forEach(function (pid) { var s = memberStreak(M[pid].evals, n); c.members++; if (s.settled) c[s.value ? 'settledIn' : 'settledOut']++; else c.open++; if (s.streak) c.streak[Math.min(3, s.streak)]++; }); }); return c; }
  return { VERSION: VERSION, REG: REG, register: register, cfg: cfg, plan: plan, latestPrio: latestPrio, memberStreak: memberStreak, batchStatus: batchStatus, addClusterEvals: addClusterEvals, clusterCounts: clusterCounts };
});
