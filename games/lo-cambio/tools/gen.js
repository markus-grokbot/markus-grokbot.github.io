// Builds data/areas.json for Lo · Cambio from the Cambio prep repos (synthetic data only).
// Run: node tools/gen.js <path to cambio-associate-ai-engineer checkout> && node tools/pack.js
const fs = require('fs'), path = require('path');
const SRC = process.argv[2] || '/tmp/cambio-associate-ai-engineer', P = f => path.join(SRC, 'prep', f);
const base = JSON.parse(fs.readFileSync(__dirname + '/../../lo-preferences/data/areas.json', 'utf8'));
const clean = JSON.parse(fs.readFileSync(P('synthetic-data/merged/clean.json'), 'utf8'));
const abbr = JSON.parse(fs.readFileSync(P('swedish-medical-abbreviations.json'), 'utf8'));
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const cards = [], ch = (id, area, level, prompt, opts, extra) => cards.push(Object.assign({ id, area, level, type: 'choice', prompt, options: opts.map(o => ({ label: o[0], pref: o[1], value: o[2] })) }, extra || {}));
const ud = (id, area, level, prompt) => cards.push({ id, area, level, type: 'updown', prompt });
const rate = (id, area, level, prompt, aspect, extra) => cards.push(Object.assign({ id, area, level, type: 'rate', prompt, aspect }, extra || {}));

// ---- L1: demo scope & features (decision cards -> scope_decisions) ----
const SCOPE = [
  ['incident', 'Incident/avvikelse draft: how does it fit the demo?', [['Second intent on the same gate (plugin)', 'plugin'], ['Separate small project', 'separate'], ['Cut it; mention only', 'cut']]],
  ['ui', 'Demo UI style?', [['Swedish one-page web UI (paste → masked → draft → approve)', 'one-page'], ['Teams-style adaptive card mock', 'teams-card'], ['CLI + eval report only', 'cli']]],
  ['live-fail', 'Which failure case to show LIVE?', [['Patient data → forced human handoff', 'patient-handoff'], ['Invalid model JSON → repair / needs_review', 'json-repair'], ['Ungrounded RAG answer → fail closed', 'rag-fail-closed'], ['Luhn-invalid personnummer caught by local model', 'luhn-pii']]],
  ['msft', 'Microsoft / Teams angle?', [['Just talk about Copilot Studio / Graph', 'talk'], ['Mock a Teams adaptive card', 'mock-card'], ['Sketch a Power Automate flow slide', 'pa-flow'], ['Leave it out', 'none']]],
  ['fhir', 'FHIR mapping (incident → AdverseEvent, ticket → Task)?', [['Out of the demo; talking point only', 'out'], ['Docs + example JSON only', 'docs'], ['Adapter with mapping_status / needs_review', 'adapter']]],
  ['local', 'Local model (qwen2.5:7b) in the demo?', [['Run it live', 'live'], ['Recorded run + replayed fixtures', 'recorded'], ['Mock adapter only', 'mock']]],
  ['lang', 'Demo language?', [['Swedish first, then English', 'sv-en'], ['English with Swedish tickets', 'en'], ['All Swedish', 'sv']]],
  ['metric', 'Headline metric on the eval sidebar?', [['Handoff / abstain rate', 'handoff-rate'], ['Valid-output (schema pass) rate', 'schema-pass'], ['Citation faithfulness', 'faithfulness'], ['Time saved per ticket (estimate)', 'time-saved']]],
  ['rag', 'RAG source for the demo?', [['~8 fake internal docs, local vector index', 'local-docs'], ['SharePoint/Graph-shaped mock', 'graph-mock'], ['No RAG: templates only', 'none']]],
  ['tickets', 'How many tickets in the live run?', [['2 happy paths + 2 failures', '4'], ['One batch of ~10 with the eval report', '10'], ['Full 42 offline, show the report', '42']]],
  ['paid', 'The one paid session (Nov 7): spend it on?', [['Citation faithfulness gate', 'faithfulness'], ['Schema repair / llm-json-fixer', 'schema-repair'], ['Save it; stay free', 'none']]],
  ['backup', 'Backup if live demo breaks?', [['3-min recording', 'recording'], ['Offline/mock mode in the same UI', 'mock-mode'], ['Both', 'both']]]
];
SCOPE.forEach(([k, q, o]) => { ch('sc-' + k, 'scope', 1, q, o.map(x => [x[0], 'cam:scope:' + k + ':' + x[1], x[1]]), { cambio: { kind: 'scope_decision', decision_id: k } }); });
ud('sc-ud1', 'scope', 1, 'Up-prioritise demo scope work this week?'); ud('sc-ud2', 'scope', 1, 'Again: prioritise freezing demo scope?');

// ---- L1: interview talking points (pairwise -> talking_point_ranking) ----
const TP = [['mask-first', 'Masking/personnummer before any model call'], ['rules-first', 'Rules-first routing; one narrow model step'], ['human-gate', 'Human approval gate + audit trace'], ['evals', 'Measuring impact: evals, handoff rate, flakiness'],
  ['local-pdl', 'Local models as PDL argument (raw text never leaves host)'], ['msft', 'Copilot Studio / Graph / Entra fit'], ['standards', 'FHIR/openEHR boundary: ticket ≠ clinical record'], ['ai-dev', 'AI as a core dev tool (Grok Bot, OpenCode, Codex)'],
  ['support-bg', 'Support/customer-facing background'], ['swedish', 'Swedish abbreviations: glossary first, model second']];
let pi = 0; for (let i = 0; i < TP.length; i++) for (let j = i + 1; j < TP.length; j++) if ((i + j) % 3 === 0) { pi++;
  ch('tp-' + TP[i][0] + '-vs-' + TP[j][0], 'talking', 1, 'Which talking point matters more for 11 Nov?', [[TP[i][1], 'cam:tp:' + TP[i][0], TP[i][0]], [TP[j][1], 'cam:tp:' + TP[j][0], TP[j][0]]], { cambio: { kind: 'talking_point_pair' } }); }
ud('tp-ud1', 'talking', 1, 'Up-prioritise interview talking-point prep?');

// ---- L2: local-model edge cases (pairwise + rate -> edge_case_votes) ----
const EC = [['missing-key', 'Missing required key ({"label":"ovrigt","confidence":0.8}, 3b ×11)'], ['misspelled-key', 'Misspelled key "rationingen", integer confidence'], ['timeout', '7b timeout → abstain → handoff'],
  ['wrong-label', 'Schema-valid but wrong label (why approval exists)'], ['invented-span', '3b invents PII span not in text ("22-4821")'], ['luhn', 'Luhn-invalid personnummer missed by regex, found by model'],
  ['bare-name', 'Bare name with no title ("Tova Näckros")'], ['staff-fp', 'Staff first names flagged as PII (false positive)'], ['med-incident', 'llama labels medication tickets as incident (5/5)'], ['invented-route', 'Invented route name "report_request"']];
for (let i = 0; i < EC.length; i++) { rate('ec-r-' + EC[i][0], 'edge', 2, 'How strong as a live demo moment: ' + EC[i][1] + '?', 'cam:edge:' + EC[i][0], { cambio: { kind: 'edge_case_rating', edge_case: EC[i][0] } });
  const j = (i + 3) % EC.length; ch('ec-p-' + EC[i][0] + '-vs-' + EC[j][0], 'edge', 2, 'Feature which edge case?', [[EC[i][1], 'cam:ecp:' + EC[i][0], EC[i][0]], [EC[j][1], 'cam:ecp:' + EC[j][0], EC[j][0]]], { cambio: { kind: 'edge_case_pair' } }); }
ud('ec-ud1', 'edge', 2, 'Up-prioritise turning local-model errors into fixtures?');

// ---- L2: abbreviation meaning picks (-> abbreviation_picks) ----
const by = {}; abbr.forEach(a => (by[a.abbr] = by[a.abbr] || []).push(a));
const DISTRACT = { 'böl': ['behörig överläkare'], 'ssk': ['specialistsköterska'], 'usk': ['undersökning'], 'ul': ['ultraljud'], 'us': [], 'MAS': ['medicinskt ansvarig specialist'] };
const PICK = ['ssk', 'usk', 'böl', 'AT', 'ul', 'UL', 'ht', 'HT', 'dsk', 'MAS', 'MAR', 'inf', 'us', 'ca', 'VT', 'BT', 'po', 'KAVA', 'SV', 'PO', 'ADL', 'AF', 'RR', 'OR', 'SoS', 'VUP'];
const seen = new Set(); let rngS = 7; const rnd = () => (rngS = (rngS * 16807) % 2147483647) / 2147483647;
PICK.forEach(k => { if (seen.has(k) || !by[k]) return; seen.add(k); const ex = [...new Set(by[k].map(a => a.expansion_sv))], amb = by[k].some(a => a.ambiguous) || ex.length > 1;
  let opts = ex.slice(); const cat = by[k][0].category; (DISTRACT[k] || []).forEach(d => opts.push(d));
  const pool = abbr.filter(a => a.category === cat && !ex.includes(a.expansion_sv) && a.abbr !== a.expansion_sv); while (opts.length < 3 && pool.length) { const d = pool.splice(Math.floor(rnd() * pool.length), 1)[0].expansion_sv; if (!opts.includes(d)) opts.push(d); }
  opts = opts.slice(0, 4).sort(() => rnd() - 0.5); const o = opts.map(x => [x, 'cam:abbr:' + slug(k) + ':' + slug(x), x]); o.push(['Ambiguous – depends on context', 'cam:abbr:' + slug(k) + ':ambiguous', '__ambiguous__']); o.push(["Don't know", 'cam:abbr:' + slug(k) + ':dk', '__unknown__']);
  ch('ab-' + slug(k) + (k !== k.toLowerCase() ? '-uc' : ''), 'abbr', 2, 'In a Swedish ticket, what does "' + k + '" mean?', o, { cambio: { kind: 'abbreviation_pick', abbr: k, dataset_expansions: ex, ambiguous: amb, category: cat } }); });
ud('ab-ud1', 'abbr', 2, 'Up-prioritise the abbreviation glossary (lookup before model)?');

// ---- L3: synthetic ticket judgments (-> golden_label_votes) ----
const T = clean.tickets, CATS = [...new Set(T.map(t => t.category))].sort(), ROUTES = [...new Set(T.map(t => t.expected_route))].sort();
const CAT_SV = { incident: 'Avvikelse/incident', login_access: 'Inloggning/behörighet', printing: 'Utskrift', ehr_module_bug: 'Journalmodul-bugg', integration: 'Integration', prescription: 'Recept/läkemedel', other: 'Övrigt', report_request: 'Rapportbeställning' };
const ROUTE_SV = { it_support: 'IT-support', human_handoff: 'Human handoff', dev_team: 'Dev team', incident_process: 'Avvikelseprocess', kb_answer: 'KB-svar (auto draft)', integration_team: 'Integrationsteam' };
T.forEach(t => { const ctx = { title: t.title, body: t.body }, tid = t.id, s = slug(tid), meta = f => ({ cambio: { kind: 'label_vote', ticket_id: tid, field: f, dataset_label: t[{ category: 'category', route: 'expected_route', needs_human: 'needs_human', contains_pii: 'contains_pii' }[f]] } });
  ch('tk-' + s + '-cat', 'tickets', 3, 'Category?', CATS.map(c => [CAT_SV[c] || c, 'cam:tk:' + tid + ':category:' + c, c]), Object.assign({ context: ctx }, meta('category')));
  ch('tk-' + s + '-route', 'tickets', 3, 'Route?', ROUTES.map(c => [ROUTE_SV[c] || c, 'cam:tk:' + tid + ':route:' + c, c]), Object.assign({ context: ctx }, meta('route')));
  ch('tk-' + s + '-hum', 'tickets', 3, 'Needs a human before any reply?', [['Yes – hand off', 'cam:tk:' + tid + ':needs_human:true', true], ['No – a draft may go to approval', 'cam:tk:' + tid + ':needs_human:false', false]], Object.assign({ context: ctx }, meta('needs_human')));
  ch('tk-' + s + '-pii', 'tickets', 3, 'Contains PII (name, personnummer, patient detail)?', [['Yes', 'cam:tk:' + tid + ':contains_pii:true', true], ['No', 'cam:tk:' + tid + ':contains_pii:false', false]], Object.assign({ context: ctx }, meta('contains_pii')));
  rate('tk-' + s + '-nat', 'tickets', 3, 'Does the Swedish sound natural?', 'cam:nat:' + tid, { context: ctx, cambio: { kind: 'naturalness', ticket_id: tid } }); });
ud('tk-ud1', 'tickets', 3, 'Up-prioritise golden labels on the synthetic tickets?');

const areas = [
  { id: 'scope', name: 'Demo scope & features', description: 'Feeds README scope freeze (cambio-support-copilot)', level: 1, defaultOn: true,
    decisions: [{ id: 'scope-d-cut', type: 'choice', area: 'scope', prompt: 'If Nov 7 slips, cut first?', options: [{ label: 'Incident intent', pref: 'dec:scope:cut:incident' }, { label: 'RAG citations', pref: 'dec:scope:cut:rag' }, { label: 'UI polish', pref: 'dec:scope:cut:ui' }] },
      { id: 'scope-d-now', type: 'updown', key: 'dec:freeze-scope', area: 'scope', prompt: 'Freeze scope today?' }] },
  { id: 'talking', name: 'Interview talking points', description: 'Ranking for the 11 Nov interview script', level: 1, defaultOn: true,
    decisions: [{ id: 'talking-d-open', type: 'choice', area: 'talking', prompt: 'Open the interview with?', options: [{ label: 'The live demo', pref: 'dec:talking:open:demo' }, { label: 'Support background story', pref: 'dec:talking:open:story' }, { label: 'The eval report', pref: 'dec:talking:open:evals' }] }] },
  { id: 'edge', name: 'Local-model edge cases', description: 'From prep/local-models/REPORT.md; which to feature', level: 2, defaultOn: true,
    decisions: [{ id: 'edge-d-fix', type: 'updown', key: 'dec:more-fixtures', area: 'edge', prompt: 'Record more failure fixtures now?' }] },
  { id: 'abbr', name: 'Swedish abbreviations', description: 'From prep/swedish-medical-abbreviations.json', level: 2, defaultOn: true,
    decisions: [{ id: 'abbr-d-mask', type: 'updown', key: 'dec:abbr-mask-cues', area: 'abbr', prompt: 'Add more role abbreviations as masking name cues?' }] },
  { id: 'tickets', name: 'Synthetic ticket judgments', description: 'Golden-label votes for merged/clean.json (synthetic)', level: 3, defaultOn: true,
    decisions: [{ id: 'tickets-d-n', type: 'choice', area: 'tickets', prompt: 'Golden set size before the demo?', options: [{ label: '20 tickets', pref: 'dec:tickets:n:20' }, { label: 'All 42', pref: 'dec:tickets:n:42' }, { label: '42 + copilot 30', pref: 'dec:tickets:n:72' }] }] }
];
const out = Object.assign({}, base, { game: 'lo-cambio', version: 1, areas, cards,
  dataLevels: ['Casual – scope & talking points', 'Light – + edge cases & abbreviations', 'Normal – + ticket judgments (golden-label votes)', 'Data creation – write/edit Swedish tickets (coming later)', 'Data creation – volume labeling & verification (coming later)'],
  playableMaxLevel: 3,
  comingLater: [
    { level: 4, id: 'ticket-authoring', name: 'Write / edit Swedish ticket text', schema: 'ticket_edit.v1 + new_ticket.v1' },
    { level: 4, id: 'abbr-verify', name: 'Verify abbreviations (expansion, ambiguity, source)', schema: 'abbreviation_verification.v1' },
    { level: 5, id: 'volume-labeling', name: 'Label at volume (all fields, strict focus)', schema: 'bulk_label.v1' },
    { level: 5, id: 'pii-spans', name: 'Mark exact PII spans for masking fixtures', schema: 'pii_span_annotation.v1' }],
  sources: { tickets: 'cambio-associate-ai-engineer/prep/synthetic-data/merged/clean.json', abbreviations: 'cambio-associate-ai-engineer/prep/swedish-medical-abbreviations.json', edge_cases: 'cambio-associate-ai-engineer/prep/local-models/REPORT.md', scope: 'cambio-associate-ai-engineer/prep/demo-eval/synthesis.md + health-standards/RESEARCH.md + cambio-tech-stack.md' },
  syntheticOnly: true });
fs.writeFileSync(__dirname + '/../data/areas.json', JSON.stringify(out, null, 1));
const n = {}; cards.forEach(c => { const k = 'L' + c.level + ' ' + c.area; n[k] = (n[k] || 0) + 1; }); console.log(cards.length, n);
