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
const PR = require('../priority.js'), HD = require('../handling.js'), LG = require('../ledger.js');
const HANDLING_TEXT = '- manual 0-100: 0 = best handled fully automatically (an AI coding/agent model prepares or does it), 100 = best manually reviewed by him\n- spend 0-100: relative budget this item deserves compared with the other items (automated side: compute/model tier, cheap local model < free hosted coding model < paid coding agent < premium build agent; manual side: a reserve for possible later agent work if it becomes relevant)\n';
function labelPromptHandling(parcels, rubric) {
  return 'You help a busy software engineer decide HOW his important inbox items should be handled (assessment only, nothing is executed). For each item estimate two numbers:\n' + HANDLING_TEXT +
    'Items (id | sender | subject | snippet):\n' + parcels.map(p => p.id + ' | ' + p.sender + ' | ' + p.subject + ' | ' + p.snippet).join('\n') +
    '\nmanual and spend must be whole numbers 0-100. Example of the format for one item: {"id":"x01","manual":20,"spend":60}\nReturn JSON only: {"items":[ one object per item above, ' + parcels.length + ' objects, same ids ]}';
}
async function labelAllHandling(model, parcels, runDir, tag) {
  const handling = {}, stats = { calls: 0, ms: 0, invalid: 0, retries: 0 }, num = v => { const n = Math.round(+v); return isFinite(n) && n >= 0 && n <= 100 ? n : null; };
  for (let i = 0; i < parcels.length; i += 5) { const batch = parcels.slice(i, i + 5); let got = {};
    for (let attempt = 0; attempt < 2; attempt++) { const missing = batch.filter(p => !got[p.id]); if (!missing.length) break; if (attempt) stats.retries++;
      const r = await generate(model, labelPromptHandling(missing), runDir, tag + '-hand-' + pad(i / 5 + 1) + (attempt ? '-retry' : '')); stats.calls++; stats.ms += r.ms;
      const re = /\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*\}/g; let mm; while ((mm = re.exec(r.raw || ''))) { const o = mm[0], g = k => { const x = new RegExp('"' + k + '"\\s*:\\s*"?(-?[\\d.]+)').exec(o); return x ? num(x[1]) : null; }, a = g('manual'), b = g('spend');
        if (missing.some(p => p.id === mm[1]) && a != null && b != null) got[mm[1]] = { manual: a, spend: b }; else stats.invalid++; } }
    Object.assign(handling, got); }
  return { handling, stats };
}
// handling grading: per axis 1-|model-human|/100 (manual, spend), weighted by his axis confidence x decision weight
function gradeHandling(round, truth) { const by = {}; truth.decisions.forEach(d => { if (d.manual == null) return; if (!by[d.parcelId] || (by[d.parcelId].repeat && !d.repeat)) by[d.parcelId] = d; }); const out = {};
  Object.keys(round.models).forEach(m => { const H = round.models[m].handling || {}; let wm = 0, am = 0, ws = 0, as = 0, n = 0, tierOk = 0; const miss = [];
    Object.keys(by).forEach(pid => { const d = by[pid], mp = H[pid]; if (!mp) return; const t = HD.fromMS(mp.manual, mp.spend), x = HD.agree(d.manual, mp.manual), y = HD.agree(d.spend, mp.spend), cx = d.confX * d.weight, cy = d.confY * d.weight;
      wm += cx; am += cx * x; ws += cy; as += cy * y; n++; if (t.tier === d.tier) tierOk++; const ag = (cx * x + cy * y) / Math.max(1e-9, cx + cy); if (ag < 0.75) miss.push({ parcelId: pid, yours: mp.manual + '/' + mp.spend, his: Math.round(d.manual) + '/' + Math.round(d.spend), agreement: +ag.toFixed(3) }); });
    out[m] = { graded: n, agreement: wm + ws ? +((am + as) / (wm + ws)).toFixed(3) : null, manualAxis: wm ? +(am / wm).toFixed(3) : null, spendAxis: ws ? +(as / ws).toFixed(3) : null, sameTier: n ? +(tierOk / n).toFixed(3) : null, misses: miss.sort((a, b) => a.agreement - b.agreement).slice(0, 10) }; });
  return out; }
// ledger evaluation records
function evalOf(d, mode, round, by, extra) { const D = mode === 'handling' ? (d.manual != null ? HD.describe(d.x, d.y) : null) : d.urgency != null ? PR.fromUI(d.urgency, d.importance) : d.x != null ? PR.describe(d.x, d.y) : d.bin ? PR.fromBin(d.bin) : null; if (!D) return null;
  const e = { round, mode, by, x: D.x, y: D.y, quadrant: D.quadrant, conf: D.conf }; if (mode === 'handling') Object.assign(e, { manual: D.manual, spend: D.spend, tier: D.tier }); else Object.assign(e, { urgency: D.urgency, importance: D.importance, priority: D.priority }); return Object.assign(e, extra || {}); }
function ledgerAddLog(ledger, log, round, relLog) { const mode = logMode(log) === 'handling' ? 'handling' : 'priority', src = logMode(log), P = {}; (round.parcels || []).concat(round.handling ? round.handling.parcels : []).forEach(p => { P[p.id] = p; }); let added = 0;
  if ((ledger.logs || []).indexOf(relLog) >= 0) return 0; ledger.logs = (ledger.logs || []).concat([relLog]);
  (log.levels || []).filter(l => l.ext && l.ext.parcels).forEach(l => (l.ext.parcels.decisions || []).forEach(d => { if (d.missed) return; const e = evalOf(d, mode, round.roundId, 'human', { src, counts: src !== 'bins', at: log.run.id, repeat: d.repeat || undefined }); if (!e) return; const pe = ledger.parcels[d.parcelId] = ledger.parcels[d.parcelId] || { parcel: stripP(P[d.parcelId]), evals: [] }; if (!pe.parcel && P[d.parcelId]) pe.parcel = stripP(P[d.parcelId]); pe.evals.push(e); added++; }));
  return added; }
function ledgerAddModels(ledger, round) { let added = 0; Object.keys(round.models || {}).forEach(m => { const M = round.models[m];
  Object.keys(M.positions || {}).forEach(pid => { if (!ledger.parcels[pid]) return; const k = round.roundId + '|priority|' + m; if (ledger.parcels[pid].evals.some(e => e.key === k)) return; const D = PR.fromUI(M.positions[pid].urgency, M.positions[pid].importance); ledger.parcels[pid].evals.push({ key: k, round: round.roundId, mode: 'priority', by: 'model:' + m, x: D.x, y: D.y, quadrant: D.quadrant, conf: D.conf, urgency: D.urgency, importance: D.importance, priority: D.priority }); added++; });
  Object.keys(M.handling || {}).forEach(pid => { if (!ledger.parcels[pid]) return; const k = round.roundId + '|handling|' + m; if (ledger.parcels[pid].evals.some(e => e.key === k)) return; const D = HD.fromMS(M.handling[pid].manual, M.handling[pid].spend); ledger.parcels[pid].evals.push({ key: k, round: round.roundId, mode: 'handling', by: 'model:' + m, x: D.x, y: D.y, quadrant: D.quadrant, conf: D.conf, manual: D.manual, spend: D.spend, tier: D.tier }); added++; }); });
  return added; }
function stripP(p) { if (!p) return null; const o = {}; ['id', 'senderType', 'sender', 'subject', 'snippet', 'badge', 'author', 'anchor', 'authorPos'].forEach(k => { if (p[k] != null) o[k] = p[k]; }); return o; }
function ledgerRefresh(ledger) { const c = {}; Object.keys(ledger.parcels).forEach(id => { const e = ledger.parcels[id]; e.status = { priority: LG.status(e.evals, 'priority'), handling: LG.status(e.evals, 'handling') }; }); ledger.rule = LG.RULE; ledger.counts = { priority: LG.counts(ledger, 'priority'), handling: LG.counts(ledger, 'handling') }; ledger.updatedAt = new Date().toISOString(); return ledger; }
const PRIO_TEXT = '- urgency 0-100: how soon he must look at it (100 = right now, 0 = can wait weeks)\n- importance 0-100: how much it matters to him (100 = career/project critical, 0 = noise)\n';
function labelPromptPriority(parcels, rubric) {
  return 'You help a busy software engineer (job hunting, runs small open-source game projects) PRIORITISE his inbox. Do not decide what to do with an item; only estimate its priority on two scales:\n' + PRIO_TEXT +
    (rubric && rubric.length ? 'Your own prioritising rubric from last round:\n' + rubric.map(r => '* ' + r).join('\n') + '\n' : '') +
    'Also write a summary badge of at most 6 words that would help him prioritise it at a glance.\nItems (id | sender | subject | snippet):\n' + parcels.map(p => p.id + ' | ' + p.sender + ' | ' + p.subject + ' | ' + p.snippet).join('\n') +
    '\nurgency and importance must be whole numbers 0-100. Example of the format for one item: {"id":"x01","urgency":30,"importance":70,"summary":"Interview prep notes, this week"}\nReturn JSON only: {"items":[ one object per item above, ' + parcels.length + ' objects, same ids ]}';
}
function genPromptPriority(model, fb, n) {
  return 'You are one of two AI models competing to PRIORITISE a software engineer\'s inbox like he does. Last round he placed each item on two scales in a game:\n' + PRIO_TEXT +
    'Your agreement with his placements (1 - distance, weighted by how sure he was on each scale): ' + fb.agreementPct + '% over ' + fb.n + ' items.' +
    (fb.misses.length ? '\nItems where you were furthest off (subject: yours -> HIS, as urgency/importance):\n' + fb.misses.map(m => '- "' + m.subject + '": ' + m.yours + ' -> ' + m.his).join('\n') : '') +
    (fb.byType ? '\nHis mean placement by sender type (urgency/importance): ' + fb.byType : '') +
    (fb.ab ? '\nYour summary badges won ' + fb.ab + ' of the A/B style questions he answered.' : '') +
    '\nTasks:\n1. Write a revised prioritising rubric: 3 to 5 short rules that would match HIS priorities better.\n2. Write ' + n + ' NEW fictional inbox items of the kinds he gets: recruiter replies, job-board digests, code-host (CI/PR/issue) notifications, service notices, marketing, collaborator questions, invoices, newsletters. Make some of them hard to prioritise (urgent but unimportant, important but not urgent).\n' +
    'Rules for items: sender is a role plus a made-up company, like "Recruiter · Pinewood Talent" or "Code host notifications"; NO personal names, NO email addresses, NO URLs, NO phone numbers, no placeholders like [name]. subject max 60 characters, snippet is one full sentence of 40 to 110 characters (the first line of the mail body). senderType one of: ' + SENDER_TYPES.join(', ') + '. Give your urgency and importance for each.\n' +
    'Example item (do not copy it): {"senderType":"recruiter","sender":"Recruiter · Pinewood Talent","subject":"Re: Backend role, quick follow-up","snippet":"Thanks for applying. Are you open to a 20 minute call on Thursday or Friday?","badge":"call request","urgency":80,"importance":75}\n' +
    'Return JSON only, exactly ' + n + ' parcels: {"rubric":["rule 1","rule 2","rule 3"],"parcels":[ ... ]}';
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
function extractItemsPrio(r) {
  const out = [], raw = r.raw || ''; const re = /\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*\}/g; let m;
  while ((m = re.exec(raw))) { const o = m[0], g = k => { const x = new RegExp('"' + k + '"\\s*:\\s*"?(-?[\\d.]+)').exec(o); return x ? +x[1] : null; }, sm = /"summary"\s*:\s*"([^"]*)"/.exec(o); out.push({ id: m[1], urgency: g('urgency'), importance: g('importance'), summary: sm ? sm[1] : null }); }
  return out;
}
// ---------- labelling (blind: each model sees only the parcel texts and its own rubric) ----------
async function labelAllPriority(model, parcels, rubric, runDir, tag) {
  const positions = {}, summaries = {}, stats = { calls: 0, ms: 0, invalid: 0, retries: 0 }, num = v => { const n = Math.round(+v); return isFinite(n) && n >= 0 && n <= 100 ? n : null; };
  for (let i = 0; i < parcels.length; i += 5) {
    const batch = parcels.slice(i, i + 5); let got = {};
    for (let attempt = 0; attempt < 2; attempt++) {
      const missing = batch.filter(p => !got[p.id]); if (!missing.length) break; if (attempt) stats.retries++;
      const r = await generate(model, labelPromptPriority(missing, rubric), runDir, tag + '-prio-' + pad(i / 5 + 1) + (attempt ? '-retry' : '')); stats.calls++; stats.ms += r.ms;
      extractItemsPrio(r).forEach(it => { const u = it && num(it.urgency), im = it && num(it.importance); if (it && missing.some(p => p.id === it.id) && u != null && im != null) got[it.id] = { u, i: im, summary: cleanSummary(it.summary) }; else stats.invalid++; });
    }
    batch.forEach(p => { if (got[p.id]) { positions[p.id] = { urgency: got[p.id].u, importance: got[p.id].i }; if (got[p.id].summary) summaries[p.id] = got[p.id].summary; } });
  }
  return { positions, summaries, stats };
}
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
function logMode(log) { return (log.summary && log.summary.parcels && log.summary.parcels.mode) || 'bins'; }
function humanTruth(log) {
  const waves = (log.levels || []).filter(l => l.ext && l.ext.parcels).map(l => l.ext.parcels), dec = [];
  waves.forEach(w => { const f = Math.max(0.3, 1 - (w.misses + 0.5 * w.changedMind) / Math.max(1, w.parcelsShown)); w.decisions.forEach(d => { if (!d.missed) dec.push(Object.assign({ waveFocus: +f.toFixed(3) }, d)); }); });
  const med = median(dec.map(d => d.sortMs)) || 1, qf = log.qualities && log.qualities.items && log.qualities.items.focus ? log.qualities.items.focus.score : null, rf = qf == null ? 1 : 0.5 + 0.5 * qf / 100;
  dec.forEach(d => { const sp = d.sortMs <= med ? 1 : Math.max(0.3, med / d.sortMs); d.weight = +((d.changedMind ? 0.4 : 1) * sp * d.waveFocus * rf).toFixed(3); });
  const ab = []; (log.levels || []).forEach(l => { if (l.ext && l.ext.pairwise && l.ext.pairwise.roundId) (l.ext.pairwise.decisions || []).forEach(d => { if (!d.undone) ab.push(d); }); });
  return { decisions: dec, medianSortMs: med, roundFocus: qf, ab };
}
function humanPos(d) { if (d.urgency != null) return PR.fromUI(d.urgency, d.importance); if (d.x != null) return PR.describe(d.x, d.y); return d.bin ? PR.fromBin(d.bin) : null; }
function grade(round, truth) {
  const by = {}; truth.decisions.forEach(d => { if (!by[d.parcelId] || (by[d.parcelId].repeat && !d.repeat)) by[d.parcelId] = d; }); const P = {}; round.parcels.forEach(p => { P[p.id] = p; }); const out = {}; // first non-repeat sort is the truth const P = {}; round.parcels.forEach(p => { P[p.id] = p; }); const out = {};
  Object.keys(round.models).forEach(m => {
    // expected agreement: v2 decisions carry a soft distribution (agreement = human soft prob of the model's bin) and a weight
    // scaled by the stronger-axis confidence; v1 hard sorts count as one-hot at full confidence. Per-axis: the model bin's axis
    // target vs the human x / y, weighted by that axis's confidence (spam has no x target).
    const L = round.models[m].labels; let w = 0, wa = 0, n = 0, a = 0, wx = 0, ax = 0, wy = 0, ay = 0; const misses = [], conf = {};
    Object.keys(by).forEach(pid => { if (!L[pid]) return; const d = by[pid], hard = d.bin, v2 = !!d.soft, ag = v2 ? (d.soft[L[pid]] || 0) : (L[pid] === hard ? 1 : 0), wt = d.weight * (v2 ? 0.5 + 0.5 * d.conf : 1);
      const pos = v2 ? d : AX.fromBin(hard), xa = AX.axisAgreement(L[pid], pos.x, pos.y), cx = v2 ? d.confX : 1, cy = v2 ? d.confY : 1;
      if (xa.x != null) { wx += d.weight * cx; ax += d.weight * cx * xa.x; } if (xa.y != null) { wy += d.weight * cy; ay += d.weight * cy * xa.y; }
      n++; if (L[pid] === hard) a++; w += wt; wa += wt * ag; if (ag < 0.5) misses.push({ parcelId: pid, subject: P[pid] ? P[pid].subject : pid, yours: L[pid], his: hard, agreement: +ag.toFixed(3), weight: +wt.toFixed(3) }); const k = L[pid] + '>' + hard; conf[k] = (conf[k] || 0) + 1; });
    const axisX = wx ? +(ax / wx).toFixed(3) : null, axisY = wy ? +(ay / wy).toFixed(3) : null;
    // priority (positional) agreement, every round type: human (urgency, importance) from v3 fields, v2 x/y (same semantics:
    // act now = urgent, worth it = matters) or v1 bin -> BIN_UI; model from positions[] (v3) or its bin -> BIN_UI.
    // per axis 1-|diff|/100 weighted by the human's confidence on that axis (v1 hard sorts: confidence of the bin's position)
    const POS = round.models[m].positions || {}; let pw = 0, pa = 0, pu = 0, pi = 0, pwu = 0, pwi = 0, perr = 0, pn = 0; const pmiss = [];
    Object.keys(by).forEach(pid => { const d = by[pid], h = humanPos(d), mp = POS[pid] ? PR.fromUI(POS[pid].urgency, POS[pid].importance) : L[pid] ? PR.fromBin(L[pid]) : null; if (!h || !mp) return;
      const au = PR.agree(h.urgency, mp.urgency), ai = PR.agree(h.importance, mp.importance), cu = h.confX * d.weight, ci = h.confY * d.weight;
      pwu += cu; pu += cu * au; pwi += ci; pi += ci * ai; pw += cu + ci; pa += cu * au + ci * ai; perr += Math.abs(h.priority - mp.priority); pn++;
      pmiss.push({ parcelId: pid, subject: P[pid] ? P[pid].subject : pid, yours: Math.round(mp.urgency) + '/' + Math.round(mp.importance), his: Math.round(h.urgency) + '/' + Math.round(h.importance), agreement: +((cu * au + ci * ai) / Math.max(1e-9, cu + ci)).toFixed(3), weight: +(cu + ci).toFixed(3) }); });
    const prio = { graded: pn, agreement: pw ? +(pa / pw).toFixed(3) : null, urgency: pwu ? +(pu / pwu).toFixed(3) : null, importance: pwi ? +(pi / pwi).toFixed(3) : null, meanAbsPriorityError: pn ? +(perr / pn).toFixed(1) : null, source: Object.keys(POS).length ? 'model positions' : 'model bins mapped to positions (BIN_UI)' };
    const pm = pmiss.filter(x => x.agreement < 0.75).sort((x, y) => (y.weight * (1 - y.agreement)) - (x.weight * (1 - x.agreement)));
    const shown = truth.ab.filter(d => d.modelA === m || d.modelB === m), wins = shown.filter(d => d.winnerModel === m).length;
    const authored = truth.decisions.filter(d => P[d.parcelId] && P[d.parcelId].author === m), clarity = authored.length ? +(authored.reduce((s, d) => s + d.weight, 0) / authored.length).toFixed(3) : null;
    const isPrio = round.task === 'priority', wAg = isPrio ? prio.agreement : (w ? wa / w : null), abRate = shown.length ? wins / shown.length : null;
    const parts = [[0.7, wAg], [0.2, abRate], [0.1, clarity]].filter(x => x[1] != null), score = parts.length ? parts.reduce((s, x) => s + x[0] * x[1], 0) / parts.reduce((s, x) => s + x[0], 0) : null;
    out[m] = { graded: n, rawAgreement: n ? +(a / n).toFixed(3) : null, weightedAgreement: wAg == null ? null : +wAg.toFixed(3), abShown: shown.length, abWins: wins, abWinRate: abRate == null ? null : +abRate.toFixed(3), authoredSorted: authored.length, authoredClarity: clarity, authoredMeanConf: authored.length && authored[0].conf != null ? +(authored.reduce((s, d) => s + d.conf, 0) / authored.length).toFixed(3) : null, priority: prio, binAgreement: w ? +(wa / w).toFixed(3) : null, axisX: axisX, axisY: axisY, score: score == null ? null : +score.toFixed(3), confusion: conf, misses: isPrio ? pm : misses.sort((x, y) => y.weight - x.weight), priorityMisses: pm.slice(0, 10) };
  });
  return out;
}
const AX = require('../axes.js');
module.exports = { logMode, labelPromptHandling, labelAllHandling, gradeHandling, evalOf, ledgerAddLog, ledgerAddModels, ledgerRefresh, stripP, HD, LG, extractItemsPrio, labelPromptPriority, genPromptPriority, labelAllPriority, humanPos, PR, extractObjects, extractRubric, ROOT, REPO, BINS, BIN_IDS, SENDER_TYPES, MODELS, OPTIONS, short, pad, readJ, writeJ, findHost, generate, labelPrompt, genPrompt, validParcel, textProblems, labelAll, abQuestions, humanTruth, grade, median };
