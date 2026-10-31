#!/usr/bin/env node
/* Session prep (offline, box side): adds round.session to a round file for ?mode=session.
   - working set: parcels the ledger still needs (unsettled priority/handling) + parcels he ranked high
   - CLUSTERS: each Ollama model proposes adjacency clusters (same topic / sender type / needed work) with a rationale
   - OUTPUT candidates for the top clusters: reply phrasings (2 per model: style-guide vs. terser contrast, using the
     pairwise tone profile) and, for code-work clusters, implementation-step plans. Nothing is sent or executed.
   node games/parcels/tools/session-prep.js --round round-005 [--sim] [--seed-unlock]   (--seed-unlock: SIM only) */
const L = require('./lib.js'), ST = require('../stages.js'), path = require('path'), fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; }, flag = k => process.argv.includes(k);
const T = L.readJ(path.join(L.ROOT, 'tuning.json')), SIM = flag('--sim');
const TONE = (() => { try { const md = fs.readFileSync(path.join(L.REPO, 'games/pairwise/data/tone-profile.human.md'), 'utf8'); const i = md.indexOf('## Style guide'); return md.slice(i, md.indexOf('\n## ', i + 5) > 0 ? md.indexOf('\n## ', i + 5) : undefined).trim(); } catch (e) { return ''; } })();
function jacc(a, b) { const A = new Set(a), n = b.filter(x => A.has(x)).length; return n / (new Set(a.concat(b)).size || 1); }
function line(p) { return p.id + ' | ' + p.senderType + ' | ' + p.sender + ' | ' + p.subject + ' | ' + p.snippet; }
async function main() {
  const rid = arg('--round'), rp = path.join(L.ROOT, 'rounds', rid + '.json'), round = L.readJ(rp), ledger = L.readJ(path.join(L.ROOT, 'data', SIM ? 'parcel-ledger.sim.json' : 'parcel-ledger.json'));
  const runDir = path.join(L.ROOT, 'runs', rid, 'session'); fs.mkdirSync(runDir, { recursive: true });
  const P = {}; round.parcels.concat(round.handling ? round.handling.parcels : []).forEach(p => { P[p.id] = L.stripP(p); });
  Object.keys(ledger.parcels).forEach(id => { const e = ledger.parcels[id]; if (!P[id] && e.parcel && e.parcel.subject) { const lp = ST.latestPrio(ledger, id); if (lp.quadrant === 'first' || lp.quadrant === 'schedule') P[id] = e.parcel; } });
  // carry the previous round's clusters (same ids) so cluster-membership streaks can reach clusterSettleAfter across sessions; members he settled as 'split out' are dropped
  const prevId = 'round-' + L.pad(round.roundNo - 1) + (SIM ? '-sim' : ''), prevP = path.join(L.ROOT, 'rounds', prevId + '.json'), carried = [];
  if (fs.existsSync(prevP)) { const pr = L.readJ(prevP); ((pr.session && pr.session.clusters) || []).forEach(c => { const lc = ledger.clusters && ledger.clusters[c.id]; if (!lc) return;
    const mem = c.members.filter(id => { const ev = lc.members[id] ? lc.members[id].evals : []; const st = ST.memberStreak(ev, ST.cfg(T).batch.clusterSettleAfter); return !(st.settled && st.value === false); });
    mem.forEach(id => { if (!P[id] && ledger.parcels[id] && ledger.parcels[id].parcel && ledger.parcels[id].parcel.subject) P[id] = ledger.parcels[id].parcel; }); if (pr.session.parcels) pr.session.parcels.forEach(p => { if (!P[p.id] && mem.indexOf(p.id) >= 0) P[p.id] = p; }); const kept = mem.filter(id => P[id]); if (kept.length < 2) return; mem.length = 0; kept.forEach(id => mem.push(id)); carried.push({ id: c.id, label: c.label, rationale: c.rationale, work: c.work, members: mem, proposedBy: c.proposedBy.slice(), carriedFrom: prevId }); }); }
  const ws = Object.keys(P).map(id => P[id]).filter(p => p.subject);
  const prioOf = id => ST.latestPrio(ledger, id).priority;
  const clusters = carried.slice();
  for (const m of L.MODELS) {
    const prompt = 'You group a busy software engineer\'s inbox items (job hunting, small open-source game projects) into CLUSTERS of items that relate to each other and could be processed together in one pass (same topic, same counterpart type, or the same kind of work needed). Propose 3 to 6 clusters of 2 to 6 items each; an item may be left out. For each cluster give: label (max 5 words), rationale (max 20 words), work (one word: reply, code, review, admin or read), members (item ids).\nItems (id | sender type | sender | subject | snippet):\n' + ws.map(line).join('\n') + '\nReturn JSON only: {"clusters":[{"label":"...","rationale":"...","work":"reply","members":["id1","id2"]}]}';
    const r = await L.generate(m, prompt, runDir, 'clusters'); const cs = (r.parsed && Array.isArray(r.parsed.clusters) ? r.parsed.clusters : []).map(c => ({ label: String(c.label || '').slice(0, 40), rationale: String(c.rationale || '').slice(0, 160), work: /^(reply|code|review|admin|read)$/.test(c.work) ? c.work : 'review', members: [...new Set((c.members || []).map(String))].filter(id => P[id]) })).filter(c => c.members.length >= 2 && c.label);
    console.log(m, 'proposed', cs.length, 'clusters', r.ms + 'ms');
    cs.forEach(c => { const same = clusters.find(x => jacc(x.members, c.members) >= 0.6); if (same) { if (same.proposedBy.indexOf(m) < 0) same.proposedBy.push(m); same.alt = (same.alt || []).concat([{ model: m, label: c.label, rationale: c.rationale, members: c.members }]); } else clusters.push(Object.assign(c, { proposedBy: [m] })); });
  }
  let nNew = 0; clusters.forEach(c => { if (!c.carriedFrom) c.id = rid + '-c' + L.pad(++nNew); c.combinedPriorityNow = Math.round(c.members.reduce((a, id) => a + (prioOf(id) || 0), 0)); c.batchPreview = ST.batchStatus(c, ledger, T); });
  clusters.sort((a, b) => (!!b.carriedFrom - !!a.carriedFrom) || b.combinedPriorityNow - a.combinedPriorityNow); console.log('carried', carried.length, 'clusters from', prevId);
  const top = clusters.slice(0, T.session.clustersPerCycle || 3), outputs = {};
  for (const c of top) { const items = c.members.map(id => P[id]); outputs[c.id] = { phrasing: [], codepass: [] };
    for (const m of L.MODELS) {
      const pr = 'Write a short fictional reply email that answers ALL of these related inbox items in one message (they form the batch "' + c.label + '"). Write it as the engineer. Write two variants: "guided" follows this style guide, "terse" is deliberately shorter and more direct.\n' + (TONE || '') + '\nItems:\n' + items.map(line).join('\n') + '\nMax 70 words each. No real names, emails or addresses; use the fictional senders above. Return JSON only: {"guided":"...","terse":"..."}';
      const r = await L.generate(m, pr, runDir, 'phrasing-' + c.id); ['guided', 'terse'].forEach(v => { const t = r.parsed && typeof r.parsed[v] === 'string' ? r.parsed[v].trim().slice(0, 600) : ''; if (t.length > 20 && !/@\w|https?:/.test(t)) outputs[c.id].phrasing.push({ id: c.id + ':' + L.short(m) + ':' + v, model: m, variant: v, text: t, dims: v === 'terse' ? { brevity: 1, directness: 1 } : { brevity: 0, directness: 0 } }); });
      if (c.work === 'code' || items.some(p => p.senderType === 'github' || /\b(PR|bug|issue|build|CI|crash|release)\b/i.test(p.subject + ' ' + p.snippet))) {
        const cp = 'These related inbox items need code work in one of his small open-source game projects (batch "' + c.label + '"). Propose an implementation PLAN for one coding pass: 3 to 6 concrete ordered steps (max 15 words each), plus the main risk. Nothing will be executed now.\nItems:\n' + items.map(line).join('\n') + '\nReturn JSON only: {"steps":["..."],"risk":"..."}';
        const q = await L.generate(m, cp, runDir, 'codepass-' + c.id); const steps = q.parsed && Array.isArray(q.parsed.steps) ? q.parsed.steps.map(s => String(s).slice(0, 120)).filter(Boolean).slice(0, 6) : [];
        if (steps.length >= 2) outputs[c.id].codepass.push({ id: c.id + ':' + L.short(m) + ':plan', model: m, steps, risk: String((q.parsed && q.parsed.risk) || '').slice(0, 140) }); }
    }
    console.log(c.id, c.label, 'phrasings', outputs[c.id].phrasing.length, 'codepass', outputs[c.id].codepass.length);
  }
  round.session = { version: ST.VERSION, note: 'Session mode (?mode=session). Clusters and output candidates are written offline by local models from SYNTHETIC parcels; he confirms/splits/merges clusters and picks A/B in the browser. Outputs are plans for later agentic use: nothing is sent or executed.' + (SIM ? ' SIM.' : ''), tuning: T.session, workingSet: ws.map(p => p.id), parcels: ws, clusters, outputs };
  if (flag('--seed-unlock')) { if (!SIM) throw new Error('--seed-unlock is SIM only'); round.session.seededUnlock = true; round.session.note += ' SEEDED: batch thresholds lowered so the dry-run shows the unlock path.'; round.session.tuning = Object.assign({}, T.session, { batch: Object.assign({}, T.session.batch, { minSettledHighShare: 0, combinedPriorityThreshold: 60 }) }); }
  L.writeJ(rp, round); console.log('wrote', path.relative(L.REPO, rp), clusters.length, 'clusters,', top.length, 'with output candidates');
}
main().catch(e => { console.error(e); process.exit(1); });
