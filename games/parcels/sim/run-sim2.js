#!/usr/bin/env node
/* Headless Parcel Panic v2 (field) sim, virtual clock. SIM data only, never triage truth.
   node games/parcels/sim/run-sim2.js [--round round-002] [--skill casual|good] [--seed 1] [--out logs/sim/...] */
const path = require('path'), fs = require('fs'), E1 = require('../engine.js'), E2 = require('../engine2.js'), PRIO = process.env.PARCELS_MODE === 'priority', E = PRIO ? E2.make(require('../priority.js'), '0.3.0', 3, 'priority') : E2, Bot = require('../bot.js'), Sess = require('../session.js'), Q = require('../../shared/qualities.js'), A = E.AXES;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), REPO = path.resolve(ROOT, '../..'), idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'rounds/index.json'), 'utf8')), rid = arg('--round', idx.current), skill = arg('--skill', 'casual'), seed = +arg('--seed', 1);
const round = JSON.parse(fs.readFileSync(path.join(ROOT, 'rounds', rid + '.json'), 'utf8')), P = E.merge(round.tuning);
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry(seed), bot = Bot.createField(skill, rng, A); let clock = Date.UTC(2026, 9, 31, 12, 0, 0);
const S = Sess.create({ runType: 'sim', seed, clock: () => clock, gameVersion: E.GAME_VERSION, iteration: E.ITERATION, device: { sim: true }, player: { bot: 'ParcelBot.field', skill }, tuningSource: 'round:' + rid }, round, { mode: E.MODE, axesVersion: A.VERSION });
const pl = round.parcels.map(p => p.anchor && round.reference && round.reference[p.id] ? Object.assign({}, p, { anchorBin: round.reference[p.id] }) : p), src = E1.source(pl, rng);
const qs = (round.abQuestions || []).slice(0, P.waves.length - 1), STEP = 1000 / 60; let total = 0, best = 0, qi = 0;
P.waves.forEach((w, wi) => {
  clock += 2100; S.startWave(P, wi, w); const wave = E.createWave(src, w, P, { onEvent: (t, d) => S.event(t, d) });
  while (!wave.done() || wave.state().t === 0) { bot.act(wave); wave.step(STEP); clock += STEP; }
  const st = wave.state(); total += st.score; best = Math.max(best, st.bestCombo); S.endWave(wi, st);
  if (wi < P.waves.length - 1 && qi < qs.length) { const q = qs[qi], sw = rng() < 0.5; S.startQuestion(q, qi); const ms = 3000 + rng() * 6000; clock += ms;
    S.endQuestion(q, Sess.abDecision(q, bot.abChoose(sw ? { a: q.b, b: q.a } : q), sw, ms, 'sim:shorter-bias')); qi++; }
});
const log = S.finish(Sess.summarize(S.waves, total, best, qi));
log.qualities = Q.compute(log);
const out = arg('--out', path.join(REPO, 'logs/sim', (PRIO ? 'parcels3-' : 'parcels2-') + rid + '-' + skill + '-seed' + seed + '.json')); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(log, null, 1) + '\n');
const sp = log.summary.parcels; console.log(out, JSON.stringify({ parcels: sp.parcels, misses: sp.misses, partial: sp.partial, timedOut: sp.timedOut, meanConf: sp.meanConf, quadrants: sp.quadrants, meanPriority: sp.meanPriority, minutes: +(log.summary.totalDurationMs / 60000).toFixed(1), q: Object.fromEntries(Object.entries(log.qualities.items).map(([k, v]) => [k, v.score])) }));
