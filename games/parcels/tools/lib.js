/* Parcel Panic round pipeline helpers (Node, box-side). Ollama client (deterministic: temperature 0, fixed seed),
   prompts, validation, grading. Every model call is written to runs/<dir>/ with prompt, raw output and timing. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'), REPO = path.resolve(ROOT, '../..');
const BINS = [
  { id: 'reply', label: 'Reply', emoji: '↩️', swipe: 'right', key: '1', rule: 'he must write back himself' },
  { id: 'archive', label: 'Archive', emoji: '🗄️', swipe: 'left', key: '2', rule: 'FYI / done / automatic, no action' },
  { id: 'later', label: 'Later', emoji: '⏰', swipe: 'up', key: '3', rule: 'worth reading or doing, not now' },
  { id: 'info', label: 'Needs info', emoji: '❓', swipe: null, key: '4', rule: 'cannot act until a detail is supplied or clarified' },
  { id: 'spam', label: 'Spam / ignore', emoji: '🚫', swipe: 'down', key: '5', rule: 'marketing, noise or suspicious' }];
const BIN_IDS = BINS.map(b => b.id);
const SENDER_TYPES = ['recruiter', 'job-board', 'github', 'service', 'marketing', 'collaborator', 'invoice', 'newsletter'];
const MODELS = ['llama3.2:3b', 'qwen2.5:1.5b'];
const OPTIONS = { temperature: 0, seed: 42, num_ctx: 4096, num_predict: 1800 };
const HOSTS = [process.env.OLLAMA_URL, 'http://127.0.0.1:11555', 'http://127.0.0.1:11434'].filter(Boolean);
const short = m => m.replace(/[^a-z0-9]+/gi, '').toLowerCase().slice(0, 10);
const pad = n => String(n).padStart(3, '0');
const readJ = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJ = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 1) + '\n'); };
let host = null;
async function findHost() { if (host) return host; for (const h of HOSTS) { try { const r = await fetch(h + '/api/tags'); if (r.ok) { host = h; return h; } } catch (e) { } } throw new Error('Ollama not reachable on ' + HOSTS.join(', ') + ' (start: OLLAMA_HOST=127.0.0.1:11555 OLLAMA_MODELS=/workspace/media-pipeline/ollama/models /workspace/media-pipeline/ollama/bin/ollama serve)'); }
async function generate(model, prompt, runDir, step, extra) {
  const h = await findHost(), t0 = Date.now(), body = { model, prompt, format: 'json', stream: false, options: Object.assign({}, OPTIONS, extra || {}) };
  const r = await fetch(h + '/api/generate', { method: 'POST', body: JSON.stringify(body) }), j = await r.json(), ms = Date.now() - t0;
  let parsed = null, err = null; try { parsed = JSON.parse(j.response); } catch (e) { err = 'json: ' + e.message; }
  writeJ(path.join(runDir, short(model) + '-' + step + '.json'), { model, step, host: h, options: body.options, startedAt: new Date(t0).toISOString(), ms, promptSha256: crypto.createHash('sha256').update(prompt).digest('hex'), prompt, raw: j.response, parseError: err, evalCount: j.eval_count, promptEvalCount: j.prompt_eval_count });
  return { parsed, ms, err, raw: j.response };
}
// ---------- prompts ----------
const binText = () => BINS.map(b => '- ' + b.id + ': ' + b.rule).join('\n');
function labelPrompt(parcels, rubric) {
  return 'You triage a busy software engineer\'s inbox (he is job hunting and runs small open-source game projects). Sort each item into exactly one bin:\n' + binText() +
    (rubric && rubric.length ? '\nYour own sorting rubric from last round:\n' + rubric.map(r => '* ' + r).join('\n') : '') +
    '\nAlso write a summary badge of at most 6 words that would help him sort it at a glance.\nItems (id | sender | subject | snippet):\n' +
    parcels.map(p => p.id + ' | ' + p.sender + ' | ' + p.subject + ' | ' + p.snippet).join('\n') +
    '\nThe bin value must be exactly one word from: reply, archive, later, info, spam. Example of the format for one item: {"id":"x01","bin":"later","summary":"Weekly digest, read later"}\nReturn JSON only: {"items":[ one object per item above, ' + parcels.length + ' objects, same ids ]}';
}
function genPrompt(model, fb, n) {
  return 'You are one of two AI models competing to triage a software engineer\'s inbox like he does. Last round he sorted the items himself in a game.\n' +
    'Bins:\n' + binText() + '\nYour weighted agreement with him: ' + fb.agreementPct + '% over ' + fb.n + ' items.' +
    (fb.misses.length ? '\nItems where you were wrong (subject -> your bin -> HIS bin):\n' + fb.misses.map(m => '- "' + m.subject + '" -> ' + m.yours + ' -> ' + m.his).join('\n') : '') +
    (fb.byType ? '\nHis sorts by sender type: ' + fb.byType : '') +
    (fb.ab ? '\nYour summary badges won ' + fb.ab + ' of the A/B style questions he answered.' : '') +
    '\nTasks:\n1. Write a revised sorting rubric: 3 to 5 short rules that would match HIS sorting better.\n2. Write ' + n + ' NEW fictional inbox items of the kinds he gets: recruiter replies, job-board digests, code-host (CI/PR/issue) notifications, service notices, marketing, collaborator questions, invoices, newsletters. Make some of them hard to sort.\n' +
    'Rules for items: sender is a role plus a made-up company, like "Recruiter · Pinewood Talent" or "Code host notifications"; NO personal names, NO email addresses, NO URLs, NO phone numbers, no placeholders like [name]. subject max 60 characters, snippet is one full sentence of 40 to 110 characters (the first line of the mail body). senderType one of: ' + SENDER_TYPES.join(', ') + '. Give your bin for each.\n' +
    'Example item (do not copy it): {"senderType":"recruiter","sender":"Recruiter · Pinewood Talent","subject":"Re: Backend role, quick follow-up","snippet":"Thanks for applying. Are you open to a 20 minute call on Thursday or Friday?","badge":"question","bin":"reply"}\n' +
    'Return JSON only, exactly ' + n + ' parcels: {"rubric":["rule 1","rule 2","rule 3"],"parcels":[ ... ]}';
}
// ---------- validation ----------
const BAD = [/@/, /https?:|www\.|\.com\b|\.se\b/i, /\+?\d[\d \-]{7,}\d/, /\[[^\]]*(name|company|date|amount|link|insert|sender|recipient|xx)[^\]]*\]|\{[^}]*\}|<[^>]*>/i, /lorem|ipsum|placeholder|todo|xxx|example|your name|company name|insert/i, /\bmarkus\b|\bisaksson\b/i, /\b(aws|amazon|github|gitlab|google|gmail|microsoft|outlook|linkedin|apple|meta|facebook|openai|slack)\b/i];
function textProblems(s) { const out = []; BAD.forEach((re, i) => { if (re.test(s)) out.push('pattern#' + i + ' ' + re); }); return out; }
function validParcel(p) {
  const e = []; if (!p || typeof p !== 'object') return ['not an object'];
  ['sender', 'subject', 'snippet'].forEach(k => { if (typeof p[k] !== 'string' || p[k].trim().length < 4) e.push(k + ' missing'); });
  if (e.length) return e;
  if (SENDER_TYPES.indexOf(p.senderType) < 0) e.push('senderType ' + p.senderType);
  if (/backend role, quick follow-up/i.test(p.subject)) e.push('copied the prompt example');
  if (p.snippet.trim().length < 20) e.push('snippet too short'); if (p.snippet.trim().toLowerCase() === p.subject.trim().toLowerCase()) e.push('snippet repeats subject');
  if (p.subject.length > 80) e.push('subject too long'); if (p.snippet.length > 160) e.push('snippet too long');
  if (/^[A-ZÅÄÖ][a-zåäöé]+ [A-ZÅÄÖ][a-zåäöé]+$/.test(p.sender.trim())) e.push('sender looks like a personal name');
  if (p.bin && BIN_IDS.indexOf(p.bin) < 0) e.push('bin ' + p.bin);
  textProblems([p.sender, p.subject, p.snippet, p.badge || ''].join(' | ')).forEach(x => e.push(x));
  return e;
}
function cleanSummary(s) { if (typeof s !== 'string') return null; s = s.trim().replace(/^["']|["']$/g, ''); if (!s || s.split(/\s+/).length > 9 || s.length > 60 || textProblems(s).length) return null; return s; }
// tolerant extraction: small models emit duplicate "items" keys or id-keyed objects; scan the raw text for {id,bin,summary} objects
function extractObjects(raw) { const out = [], re = /\{[^{}]*\}/g; let m; while ((m = re.exec(raw || ''))) { try { out.push(JSON.parse(m[0])); } catch (e) { } } return out; }
function extractRubric(r) { if (r.parsed && r.parsed.rubric) return r.parsed.rubric; const m = /"rubric"\s*:\s*\[([^\]]*)\]/.exec(r.raw || ''); if (!m) return []; try { return JSON.parse('[' + m[1] + ']'); } catch (e) { return (m[1].match(/"([^"]+)"/g) || []).map(x => x.slice(1, -1)); } }
function extractItems(r) {
  const out = [], raw = r.raw || ''; const re = /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"bin"\s*:\s*"([^"]+)"(?:\s*,\s*"summary"\s*:\s*"([^"]*)")?[^{}]*\}/g; let m;
  while ((m = re.exec(raw))) out.push({ id: m[1], bin: m[2].trim(), summary: m[3] });
  if (!out.length && r.parsed && typeof r.parsed === 'object') Object.keys(r.parsed).forEach(k => { const v = r.parsed[k]; if (v && typeof v === 'object' && v.bin) out.push({ id: k, bin: v.bin, summary: v.summary }); });
  return out;
}
// ---------- labelling (blind: each model sees only the parcel texts and its own rubric) ----------
async function labelAll(model, parcels, rubric, runDir, tag) {
  const labels = {}, summaries = {}, stats = { calls: 0, ms: 0, invalid: 0, retries: 0 };
  for (let i = 0; i < parcels.length; i += 5) {
    const batch = parcels.slice(i, i + 5); let got = {};
    for (let attempt = 0; attempt < 2; attempt++) {
      const missing = batch.filter(p => !got[p.id]); if (!missing.length) break; if (attempt) stats.retries++;
      const r = await generate(model, labelPrompt(missing, rubric), runDir, tag + '-label-' + pad(i / 5 + 1) + (attempt ? '-retry' : '')); stats.calls++; stats.ms += r.ms;
      const items = extractItems(r);
      items.forEach(it => { if (it && missing.some(p => p.id === it.id) && BIN_IDS.indexOf(String(it.bin).toLowerCase()) >= 0) got[it.id] = { bin: String(it.bin).toLowerCase(), summary: cleanSummary(it.summary) }; else stats.invalid++; });
    }
    batch.forEach(p => { if (got[p.id]) { labels[p.id] = got[p.id].bin; if (got[p.id].summary) summaries[p.id] = got[p.id].summary; } });
  }
  return { labels, summaries, stats };
}
// ---------- A/B questions: parcels where both models wrote a summary and the summaries differ ----------
function abQuestions(round, n) {
  const ms = Object.keys(round.models); if (ms.length < 2) return [];
  const h = s => parseInt(crypto.createHash('md5').update(s).digest('hex').slice(0, 8), 16);
  const cands = round.parcels.filter(p => ms.every(m => round.models[m].summaries[p.id]) && round.models[ms[0]].summaries[p.id].toLowerCase() !== round.models[ms[1]].summaries[p.id].toLowerCase())
    .sort((a, b) => h(round.roundId + a.id) - h(round.roundId + b.id)).slice(0, n);
  return cands.map((p, i) => { const flip = h(p.id) % 2, A = ms[flip], B = ms[1 - flip];
    return { id: round.roundId + '-ab' + (i + 1), parcelId: p.id, criterion: 'Which summary badge makes this parcel quicker to sort?', a: { id: p.id + ':' + short(A), model: A, text: round.models[A].summaries[p.id] }, b: { id: p.id + ':' + short(B), model: B, text: round.models[B].summaries[p.id] } }; });
}
// ---------- grading ----------
function median(a) { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length ? (b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2) : null; }
/* weight of one human decision as ground truth: changed mind x0.4; slower than his median -> med/t (floor 0.3);
   x wave focus factor (wave focus = 100*(1-(misses+0.5*changed)/shown), floor 0.3); x (0.5 + 0.5*round focus/100) from qualities */
function humanTruth(log) {
  const waves = (log.levels || []).filter(l => l.ext && l.ext.parcels).map(l => l.ext.parcels), dec = [];
  waves.forEach(w => { const f = Math.max(0.3, 1 - (w.misses + 0.5 * w.changedMind) / Math.max(1, w.parcelsShown)); w.decisions.forEach(d => { if (!d.missed) dec.push(Object.assign({ waveFocus: +f.toFixed(3) }, d)); }); });
  const med = median(dec.map(d => d.sortMs)) || 1, qf = log.qualities && log.qualities.items && log.qualities.items.focus ? log.qualities.items.focus.score : null, rf = qf == null ? 1 : 0.5 + 0.5 * qf / 100;
  dec.forEach(d => { const sp = d.sortMs <= med ? 1 : Math.max(0.3, med / d.sortMs); d.weight = +((d.changedMind ? 0.4 : 1) * sp * d.waveFocus * rf).toFixed(3); });
  const ab = []; (log.levels || []).forEach(l => { if (l.ext && l.ext.pairwise && l.ext.pairwise.roundId) (l.ext.pairwise.decisions || []).forEach(d => { if (!d.undone) ab.push(d); }); });
  return { decisions: dec, medianSortMs: med, roundFocus: qf, ab };
}
function grade(round, truth) {
  const by = {}; truth.decisions.forEach(d => { if (!by[d.parcelId] || (by[d.parcelId].repeat && !d.repeat)) by[d.parcelId] = d; }); const P = {}; round.parcels.forEach(p => { P[p.id] = p; }); const out = {}; // first non-repeat sort is the truth const P = {}; round.parcels.forEach(p => { P[p.id] = p; }); const out = {};
  Object.keys(round.models).forEach(m => {
    const L = round.models[m].labels; let w = 0, wa = 0, n = 0, a = 0; const misses = [], conf = {};
    Object.keys(by).forEach(pid => { if (!L[pid]) return; const d = by[pid], ok = L[pid] === d.bin; n++; if (ok) a++; w += d.weight; if (ok) wa += d.weight; else misses.push({ parcelId: pid, subject: P[pid] ? P[pid].subject : pid, yours: L[pid], his: d.bin, weight: d.weight }); const k = L[pid] + '>' + d.bin; conf[k] = (conf[k] || 0) + 1; });
    const shown = truth.ab.filter(d => d.modelA === m || d.modelB === m), wins = shown.filter(d => d.winnerModel === m).length;
    const authored = truth.decisions.filter(d => P[d.parcelId] && P[d.parcelId].author === m), clarity = authored.length ? +(authored.reduce((s, d) => s + d.weight, 0) / authored.length).toFixed(3) : null;
    const wAg = w ? wa / w : null, abRate = shown.length ? wins / shown.length : null;
    const parts = [[0.7, wAg], [0.2, abRate], [0.1, clarity]].filter(x => x[1] != null), score = parts.length ? parts.reduce((s, x) => s + x[0] * x[1], 0) / parts.reduce((s, x) => s + x[0], 0) : null;
    out[m] = { graded: n, rawAgreement: n ? +(a / n).toFixed(3) : null, weightedAgreement: wAg == null ? null : +wAg.toFixed(3), abShown: shown.length, abWins: wins, abWinRate: abRate == null ? null : +abRate.toFixed(3), authoredSorted: authored.length, authoredClarity: clarity, score: score == null ? null : +score.toFixed(3), confusion: conf, misses: misses.sort((x, y) => y.weight - x.weight) };
  });
  return out;
}
module.exports = { extractObjects, extractRubric, ROOT, REPO, BINS, BIN_IDS, SENDER_TYPES, MODELS, OPTIONS, short, pad, readJ, writeJ, findHost, generate, labelPrompt, genPrompt, validParcel, textProblems, labelAll, abQuestions, humanTruth, grade, median };
