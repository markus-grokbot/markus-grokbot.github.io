#!/usr/bin/env node
/* Parcel Panic round pipeline: grade the models on round N with Markus's log, then have them build round N+1.
   node games/parcels/tools/next-round.js                      # current round from rounds/index.json, newest matching human log in logs/human/
   node games/parcels/tools/next-round.js --round round-001 --log logs/human/human-parcels-round-001-XXXX.json
   node games/parcels/tools/next-round.js --sim --log logs/sim/parcels-round-001-casual-seed1.json   # dry run -> round-002-sim, model-scores.sim.json
   Options: --models a,b  --per-model 10  --carry 20  --force (re-grade a round already in the leaderboard)
   Steps: (a) grade (b) leaderboard (c) prompt models with feedback -> new parcels + rubric (d) validate, blind-label, build N+1. All calls logged in runs/. */
const L = require('./lib.js'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const argv = process.argv, arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; }, flag = k => argv.indexOf(k) > 0;
const h = s => parseInt(crypto.createHash('md5').update(s).digest('hex').slice(0, 8), 16);
(async () => {
  const SIM = flag('--sim'), T0 = Date.now(), ix = L.readJ(path.join(L.ROOT, 'rounds/index.json'));
  const rid = arg('--round', SIM ? 'round-001' : ix.current), round = L.readJ(path.join(L.ROOT, 'rounds', rid + '.json'));
  if (!SIM && round.sim) throw new Error(rid + ' is a sim round; human rounds only (use --sim)');
  // ---- find the log ----
  let logPath = arg('--log');
  if (!logPath) { const dirs = SIM ? [path.join(L.REPO, 'logs/sim')] : [path.join(L.REPO, 'logs/human'), path.join(L.ROOT, 'logs/human')]; const c = [].concat(...dirs.filter(d => fs.existsSync(d)).map(dir => fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f)))).filter(f => { try { const j = L.readJ(f); return j.game && j.game.id === 'parcels' && j.summary && j.summary.parcels && j.summary.parcels.roundId === rid; } catch (e) { return false; } }).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs); logPath = c[0]; }
  if (!logPath) throw new Error('no ' + (SIM ? 'sim' : 'human') + ' parcels log for ' + rid + ' in logs/' + (SIM ? 'sim' : 'human') + '/');
  logPath = path.resolve(L.REPO, logPath); const log = L.readJ(logPath), relLog = path.relative(L.REPO, logPath);
  if (log.summary.parcels.roundId !== rid) throw new Error('log is for ' + log.summary.parcels.roundId + ', not ' + rid);
  if (SIM !== (log.run.type === 'sim')) throw new Error('log run.type is ' + log.run.type + (SIM ? '; --sim needs a sim log' : '; human pipeline refuses sim logs'));
  const nextNo = round.roundNo + 1, nextId = 'round-' + L.pad(nextNo) + (SIM ? '-sim' : ''), runDir = path.join(L.ROOT, 'runs', nextId), models = (arg('--models') || Object.keys(round.models).join(',')).split(',');
  fs.mkdirSync(runDir, { recursive: true }); const manifest = { pipeline: 'parcels next-round', version: '1.0.0', sim: SIM, fromRound: rid, toRound: nextId, log: relLog, startedAt: new Date(T0).toISOString(), options: L.OPTIONS, models, steps: {} };
  // ---- (a) grade ----
  // --round-weight w (default 1): scales every decision weight AND this round's weight in the cumulative leaderboard (e.g. 0.5 when Markus says the pace made his sorts feel unreliable)
  const RW = +arg('--round-weight', 1), NOTE = arg('--note', null), truth = L.humanTruth(log); truth.decisions.forEach(d => { d.weight = +(d.weight * RW).toFixed(3); });
  const grades = L.grade(round, truth); manifest.roundWeight = RW; if (NOTE) manifest.note = NOTE;
  manifest.steps.grade = { decisions: truth.decisions.length, medianSortMs: truth.medianSortMs, roundFocus: truth.roundFocus, ab: truth.ab.length, weighting: 'changed mind x0.4; slower than median -> median/t (floor 0.3); x wave focus (floor 0.3); x (0.5+0.5*round focus/100)', grades };
  console.log('(a) graded', rid, 'with', relLog); models.forEach(m => { const g = grades[m]; console.log('   ', m, 'weighted agreement', g.weightedAgreement, 'raw', g.rawAgreement, 'A/B', g.abWins + '/' + g.abShown, 'authored clarity', g.authoredClarity, 'score', g.score); });
  // ---- (b) leaderboard ----
  const sp = path.join(L.ROOT, 'data', SIM ? 'model-scores.sim.json' : 'model-scores.json'), board = fs.existsSync(sp) ? L.readJ(sp) : { schema: 'parcels-model-scores', version: '1.0.0', kind: SIM ? 'sim' : 'human', note: SIM ? 'SIM dry-run only. Never mixed with the human leaderboard.' : 'Graded only by Markus\'s human logs. score = 0.7 weighted bin agreement + 0.2 A/B summary win rate + 0.1 clarity of parcels the model wrote (renormalised over the parts present).', models: {}, rounds: [] };
  if (board.rounds.some(r => r.round === rid) && !flag('--force') && !SIM) throw new Error(rid + ' already graded in ' + path.relative(L.REPO, sp) + ' (use --force to replace)');
  board.rounds = board.rounds.filter(r => r.round !== rid).concat([{ round: rid, log: relLog, roundWeight: RW, note: NOTE || undefined, gradedAt: new Date().toISOString(), decisions: truth.decisions.length, ab: truth.ab.length, next: nextId }]);
  models.forEach(m => { const b = board.models[m] = board.models[m] || { history: [] }, g = grades[m]; b.history = b.history.filter(x => x.round !== rid).concat([Object.assign({ round: rid, roundWeight: RW, note: NOTE || undefined }, g, { misses: g.misses.slice(0, 10) })]); b.latest = { round: rid, score: g.score, weightedAgreement: g.weightedAgreement, priorityAgreement: g.priority && g.priority.agreement };
    const hs = b.history.map(x => x.score).filter(x => x != null); const hw = b.history.filter(x => x.score != null); b.cumulative = hw.length ? +(hw.reduce((a, x) => a + x.score * (x.roundWeight == null ? 1 : x.roundWeight), 0) / hw.reduce((a, x) => a + (x.roundWeight == null ? 1 : x.roundWeight), 0)).toFixed(3) : null; b.trend = hs.length > 1 ? +(hs[hs.length - 1] - hs[hs.length - 2]).toFixed(3) : null; });
  board.updatedAt = new Date().toISOString(); board.ranking = models.slice().sort((a, b) => (grades[b].score || 0) - (grades[a].score || 0)); L.writeJ(sp, board); console.log('(b) leaderboard', path.relative(L.REPO, sp), 'ranking', board.ranking.join(' > '));
  if (flag('--grade-only')) { L.writeJ(path.join(runDir, 'manifest-grade-only.json'), manifest); console.log('--grade-only: no generation'); return; }
  // ---- (c) feedback -> new parcels + rubric ----  (from round-003 on the model task is PRIORITY: urgency/importance 0-100)
  const TASK = arg('--task', 'priority');
  const P = {}; round.parcels.forEach(p => { P[p.id] = p; }); const byType = {}; truth.decisions.forEach(d => { const t = P[d.parcelId] && P[d.parcelId].senderType; if (!t) return; byType[t] = byType[t] || {}; byType[t][d.bin] = (byType[t][d.bin] || 0) + 1; });
  const pt = {}; truth.decisions.forEach(d => { const t = P[d.parcelId] && P[d.parcelId].senderType, hp = L.humanPos(d); if (!t || !hp) return; (pt[t] = pt[t] || []).push(hp); });
  const prioTypeTxt = Object.keys(pt).sort().map(t => t + ' ' + Math.round(pt[t].reduce((a, x) => a + x.urgency, 0) / pt[t].length) + '/' + Math.round(pt[t].reduce((a, x) => a + x.importance, 0) / pt[t].length)).join('; ');
  const byTypeTxt = Object.keys(byType).sort().map(t => t + ': ' + Object.keys(byType[t]).sort((a, b) => byType[t][b] - byType[t][a]).map(b => b + ' ' + byType[t][b]).join(', ')).join('; ');
  const per = +arg('--per-model', 10), gen = {}; manifest.steps.generate = {};
  for (const m of models) {
    const g = grades[m], fb = TASK === 'priority' ? { agreementPct: Math.round(100 * (g.priority.agreement || 0)), n: g.priority.graded, misses: g.priorityMisses.slice(0, 10), byType: prioTypeTxt, ab: g.abShown ? g.abWins + '/' + g.abShown : null } : { agreementPct: Math.round(100 * (g.weightedAgreement || 0)), n: g.graded, misses: g.misses.slice(0, 10), byType: byTypeTxt, ab: g.abShown ? g.abWins + '/' + g.abShown : null };
    let ok = [], rubric = null, rejects = [], attempts = 0;
    for (let a = 0; a < 2 && ok.length < Math.min(5, per); a++) {
      attempts++; let pr = (TASK === 'priority' ? L.genPromptPriority : L.genPrompt)(m, fb, per); if (a) pr += '\nYour previous answer had problems: ' + rejects.slice(-6).map(x => x.problems.join(', ')).join(' | ') + '. Fix them.';
      const r = await L.generate(m, pr, runDir, 'gen' + (a ? '-retry' : ''), { num_predict: 3000 }), j = { rubric: L.extractRubric(r), parcels: r.parsed && Array.isArray(r.parsed.parcels) ? r.parsed.parcels : L.extractObjects(r.raw).filter(o => o && o.subject) };
      const rb = (Array.isArray(j.rubric) ? j.rubric : typeof j.rubric === 'string' ? j.rubric.split(/\n|(?<=\.)\s+/) : []).map(x => String(x).trim().replace(/^(rule\s*)?\d+[:.)]\s*/i, '')).filter(x => x && x.length <= 160 && !L.textProblems(x).length).slice(0, 5); if (rb.length >= 2 || !rubric) rubric = rb;
      (Array.isArray(j.parcels) ? j.parcels : []).forEach(p => { if (p && typeof p === 'object') { p.senderType = String(p.senderType || '').toLowerCase(); if (p.bin) p.bin = String(p.bin).toLowerCase(); if (TASK === 'priority' && !p.bin) p.bin = 'later'; } const e = L.validParcel(p); const dup = ok.concat(round.parcels).some(q => p && q.subject && p.subject && q.subject.toLowerCase() === String(p.subject).toLowerCase());
        if (e.length || dup) rejects.push({ parcel: p, problems: dup ? ['duplicate subject'] : e }); else if (ok.length < per) ok.push(p); });
    }
    gen[m] = { rubric: rubric || [], parcels: ok.map((p, i) => ({ id: 'r' + L.pad(nextNo) + '-' + L.short(m) + '-' + String(i + 1).padStart(2, '0'), senderType: p.senderType, sender: p.sender.trim(), subject: p.subject.trim(), snippet: p.snippet.trim(), badge: p.badge && !L.textProblems(String(p.badge)).length && String(p.badge).length <= 24 ? String(p.badge).trim() : null, author: m, authorBin: TASK === 'priority' ? undefined : p.bin || null, authorPos: TASK === 'priority' && isFinite(+p.urgency) && isFinite(+p.importance) ? { urgency: Math.max(0, Math.min(100, Math.round(+p.urgency))), importance: Math.max(0, Math.min(100, Math.round(+p.importance))) } : undefined, anchor: false })) };
    manifest.steps.generate[m] = { attempts, valid: ok.length, rejected: rejects.length, rejects: rejects.slice(0, 20), rubric: gen[m].rubric };
    console.log('(c)', m, 'wrote', ok.length, 'valid parcels (' + rejects.length + ' rejected), rubric', gen[m].rubric.length, 'rules');
  }
  // ---- (d) build N+1: model parcels + carried-over parcels (most disputed first), blind labels by every model ----
  const carryN = +arg('--carry', 20), dispute = {}; models.forEach(m => grades[m].misses.forEach(x => { dispute[x.parcelId] = (dispute[x.parcelId] || 0) + x.weight; }));
  const carry = round.parcels.filter(p => !p.repeat).slice().sort((a, b) => (dispute[b.id] || 0) - (dispute[a.id] || 0) || h(nextId + a.id) - h(nextId + b.id)).slice(0, carryN).map(p => Object.assign({}, p, { carriedFrom: rid }));
  let parcels = carry.concat(...models.map(m => gen[m].parcels)); parcels.sort((a, b) => h(nextId + a.id) - h(nextId + b.id));
  const next = { schema: 'parcels-round', version: '1.0.0', roundId: nextId, roundNo: nextNo, synthetic: true, sim: SIM, createdAt: new Date().toISOString(), basedOn: { round: rid, log: relLog },
    note: (TASK === 'priority' ? 'PRIORITY task: models[*].positions = blind {urgency, importance} 0-100 per parcel. ' : '') + (SIM ? 'SIM DRY-RUN round, built from a SIM log; never graded into the human leaderboard. ' : '') + 'SYNTHETIC fictional parcels: ' + carry.length + ' carried from ' + rid + ' (most disputed first) + parcels written by the models. models[*].labels are blind predictions, never shown in the game.',
    task: TASK, bins: round.bins, tuning: round.tuning, parcels, models: {}, reference: {}, abQuestions: [], pipeline: { runDir: path.relative(L.ROOT, runDir), options: L.OPTIONS } };
  carry.forEach(p => { if (round.reference && round.reference[p.id]) next.reference[p.id] = round.reference[p.id]; });
  manifest.steps.label = {};
  for (const m of models) { const t0 = Date.now(), r = await (TASK === 'priority' ? L.labelAllPriority : L.labelAll)(m, parcels, gen[m].rubric, runDir, 'r' + L.pad(nextNo)); next.models[m] = { labels: r.labels || {}, positions: r.positions, summaries: r.summaries, rubric: gen[m].rubric, authored: gen[m].parcels.length, stats: Object.assign(r.stats, { wallMs: Date.now() - t0 }) };
    manifest.steps.label[m] = next.models[m].stats; console.log('(d)', m, 'labelled', Object.keys(r.positions || r.labels).length + '/' + parcels.length, 'blind,', Object.keys(r.summaries).length, 'summaries'); }
  next.abQuestions = L.abQuestions(next, 3);
  L.writeJ(path.join(L.ROOT, 'rounds', nextId + '.json'), next);
  if (SIM) { ix.sim = Array.from(new Set((ix.sim || []).concat([nextId]))); } else { ix.rounds = Array.from(new Set(ix.rounds.concat([nextId]))); ix.current = nextId; }
  L.writeJ(path.join(L.ROOT, 'rounds/index.json'), ix);
  manifest.endedAt = new Date().toISOString(); manifest.wallMs = Date.now() - T0; manifest.output = { round: 'rounds/' + nextId + '.json', parcels: parcels.length, carried: carry.length, ab: next.abQuestions.length };
  L.writeJ(path.join(runDir, 'manifest.json'), manifest);
  console.log('built rounds/' + nextId + '.json:', parcels.length, 'parcels,', next.abQuestions.length, 'A/B questions;', SIM ? 'index.json sim list updated (current unchanged)' : 'index.json current = ' + nextId, '·', Math.round(manifest.wallMs / 1000) + ' s');
})().catch(e => { console.error('next-round:', e.message); process.exit(1); });
