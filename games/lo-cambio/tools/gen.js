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
  ['tickets', 'How many tickets in the live run?', [['2 happy paths + 2 failures', '4'], ['One batch of ~10 with the eval report', '10'], ['Full 56 offline, show the report', '56']]],
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


// ---- L1: round-2 scope suggestions (from demo-eval/synthesis.md, health-standards/RESEARCH.md, cambio-tech-stack.md) ----
// tb-* reuse the round-1 decision_id + pref keys so tiebreak votes merge into the same tally.
const SCOPE2 = [
  ['tb-backup', 'backup', 'Tiebreak (R1 recording vs R2 both): backup if live demo breaks?', [['3-min recording only', 'recording'], ['Both: recording + offline/mock mode in the same UI', 'both']]],
  ['tb-live-fail', 'live-fail', 'Tiebreak (R1 RAG vs R2 patient data): ONE failure case to show live?', [['Ungrounded RAG answer → fail closed', 'rag-fail-closed'], ['Patient data → forced human handoff', 'patient-handoff']]],
  ['fhir-depth', 'fhir-depth', 'FHIR adapter: which mapping to build?', [['Incident → AdverseEvent only', 'adverse-event'], ['Ticket → Task + Communication only', 'task'], ['Both, each with mapping_status / needs_review', 'both']]],
  ['fhir-validate', 'fhir-validate', 'FHIR output validation for the demo?', [['JSON Schema + allowlists, fail closed', 'schema'], ['Also run the HL7 validator JAR', 'hl7-jar'], ['Schema now; HL7 validator as a talking point', 'schema-talk']]],
  ['rag-low', 'rag-low', 'RAG: retrieval finds no good doc among the ~8. Show?', [['Abstain → handoff (no draft)', 'abstain'], ['Draft flagged needs_review, no citation', 'flag'], ['Ask the colleague a clarifying question', 'clarify']]],
  ['incident-fields', 'incident-fields', 'Incident/avvikelse draft fields?', [['what / when / where / harm / action', 'full'], ['what + suggested action only', 'minimal']]],
  ['span-gate', 'span-gate', 'Show the exact-substring PII span gate ("22-4821" rejected) live?', [['Yes, as the local-model moment', 'live'], ['In the eval report only', 'report'], ['Mention only', 'mention']]],
  ['pii-second', 'pii-second', 'Local model as PII second opinion (may only ADD masks)?', [['In the live run', 'live'], ['Recorded run + replayed fixtures', 'recorded'], ['Leave out; regex only', 'out']]],
  ['eval-side', 'eval-side', 'Eval sidebar content?', [['Handoff rate + valid-output rate', 'two'], ['+ citation faithfulness', 'faith'], ['+ flakiness over 3 runs', 'flaky']]],
  ['glossary', 'glossary', 'Abbreviation glossary lookup (before any model) in the demo?', [['Show it on one ticket', 'show'], ['Mention only', 'mention'], ['Skip', 'skip']]],
  ['openehr', 'openehr', 'openEHR in the demo?', [['Talking point: ticket ≠ clinical record', 'talk'], ['One example composition file', 'example'], ['Leave out', 'none']]]
];
SCOPE2.forEach(([id, k, q, o]) => { ch('sc2-' + id, 'scope', 1, q, o.map(x => [x[0], 'cam:scope:' + k + ':' + x[1], x[1]]), { cambio: { kind: 'scope_decision', decision_id: k, round: 2 } }); });

// ---- L1: round-2 talking points, "which to lead with" (application/cv.md, form_answers.md). Nursing only in passing; no degree claims. ----
const TP2 = { 'ops-pack': 'ops-pack-demo: rules-first routing, schema-checked model step, human triage', 'this-demo': 'The Cambio support copilot built for this interview (mask → rules → gate → approve)',
  'agentic': 'My own agentic workflow: tasks by email, night queue on free/local models, every output verified', 'fcc': '16 freeCodeCamp certifications, 3,600+ documented hours',
  'honest-exp': 'Stated plainly: ~2 years self-directed + <1 year freelance, no full-time role yet', 'json-fixer': 'llm-json-fixer: MCP server on Smithery that repairs LLM JSON',
  'model-eval': 'Compared free, local and paid models on the same tasks', 'bilingual': 'Swedish native + English: Swedish tickets, English demo',
  'measure': 'Measuring impact: handoff rate, valid-output rate, flakiness', 'nursing': 'In passing: some nursing exposure → why patient-safety gates matter' };
[['ops-pack', 'this-demo'], ['agentic', 'ops-pack'], ['fcc', 'honest-exp'], ['fcc', 'ops-pack'], ['agentic', 'json-fixer'], ['model-eval', 'this-demo'], ['bilingual', 'agentic'], ['honest-exp', 'this-demo'], ['measure', 'model-eval'], ['nursing', 'bilingual']]
  .forEach(([a, b]) => ch('tp2-' + a + '-vs-' + b, 'talking', 1, 'Which point to lead with?', [[TP2[a], 'cam:tp:' + a, a], [TP2[b], 'cam:tp:' + b, b]], { cambio: { kind: 'talking_point_pair', round: 2 } }));


// ---- L1: round-5 Friday 6 Nov — rules + golden labels (G-003 gap, G-008/G-009 open) ----
// Locked already (do not re-ask as open): backup=both, live-fail=patient-handoff. Talking lead: human-gate.
// New decision_ids only. Synthetic tickets: grok-build-gaps-2026-11-05:G-* / local-qwen2.5-7b-2026-11-05:L-*.
const SCOPE5 = [
  ['g003-fix', 'g003-fix', 'Fri rules: how to fix G-003 (Linnea Berg + Luhn-invalid samordningsnummer 19850372-6614 + behörighet → today awaiting_approval)?', [['Detect samordningsnummer shapes + force human_handoff', 'detect-samord-handoff'], ['Any name + access-request with PII-shaped number → handoff (even if Luhn fails)', 'name-access-shape'], ['Local-model PII second opinion must ADD the mask, then hand off', 'local-second'], ['All three: shape detect + name/access heuristic + local second opinion', 'all-three']]],
  ['luhn-invalid-policy', 'luhn-invalid-policy', 'Fri rules: Luhn-invalid personnummer / samordningsnummer policy?', [['Fail closed: mask + human_handoff whenever the shape matches', 'fail-closed'], ['Mask if shape matches; hand off only when needs_human rules also fire', 'mask-then-rules'], ['Ignore if Luhn fails (regex/Luhn only)', 'ignore-invalid']]],
  ['name-access-no-valid-pnr', 'name-access-no-valid-pnr', 'Fri rules: fake name + access/behörighet request WITHOUT a Luhn-valid personnummer — enough to force a person?', [['Yes → immediate human_handoff', 'handoff'], ['Route to awaiting_approval (draft OK, no auto-send)', 'awaiting'], ['Only hand off if a PII-shaped number is also present', 'need-shape']]],
  ['rules-pii-second', 'rules-pii-second', 'Fri rules: local model as PII second opinion (may only ADD masks)?', [['In the live rules path', 'live'], ['Recorded fixtures + replay only', 'recorded'], ['Out — regex/Luhn only for Friday', 'out']]],
  ['g003-interview-example', 'g003-interview-example', 'Use G-003 as the interview example of why Luhn-only masking needs a second opinion?', [['Yes — primary live/interview example', 'primary'], ['Secondary mention only', 'secondary'], ['No — use a cleaner Luhn-invalid fixture instead', 'other-fixture']]],
  ['golden-label-source', 'golden-label-source', 'Fri golden labels: source of truth when labeling the 14 new gap tickets?', [['Markus L3 play is source of truth', 'markus-l3'], ['Adopt Codex when it agrees with the dataset; play only the leftovers', 'codex-when-agrees'], ['Keep dataset label unless Markus votes otherwise', 'dataset-unless-vote']]],
  ['pii-shape-luhn-fail', 'pii-shape-luhn-fail', 'Fri rules: PII shape present but Luhn fails — how strict is handoff?', [['Always human_handoff (never awaiting_approval)', 'always-handoff'], ['awaiting_approval OK if no other needs_human signal', 'awaiting-ok'], ['human_handoff only for access/behörighet + patient identity', 'access-only']]],
  ['personnummer-shapes', 'personnummer-shapes', 'Fri rules: which personnummer shapes must the detector cover?', [['12-digit, 10-digit, space-separated, samordningsnummer (incl. Luhn-invalid)', 'all-shapes'], ['Luhn-valid only (12/10 + hyphen/space)', 'luhn-valid-only'], ['All shapes in lint; live rules start with samordningsnummer + space-separated', 'samord-space-first']]]
];
SCOPE5.forEach(([id, k, q, o]) => { ch('sc5-' + id, 'scope', 1, q, o.map(x => [x[0], 'cam:scope:' + k + ':' + x[1], x[1]]), { cambio: { kind: 'scope_decision', decision_id: k, round: 5 } }); });
ud('sc5-ud1', 'scope', 1, 'Up-prioritise Friday rules work (G-003 + personnummer shapes)?');
ud('sc5-ud2', 'scope', 1, 'Up-prioritise Friday golden labels on the 14 new gap tickets?');

// Talking pairs for Friday — do not re-open the locked human-gate lead (18:09 export 2/3).
const TP5 = {
  'g003-luhn-story': 'G-003 as interview example: Luhn-only masking needs a local-model second opinion',
  'fail-closed-pii': 'Fail closed on PII-shaped text even when Luhn fails',
  'golden-gap-set': 'Golden-labelling the 14 new gap tickets (G-* / L-*) before Saturday RAG',
  'local-second-add': 'Local model may only ADD masks (never remove) as PII second opinion'
};
[['g003-luhn-story', 'fail-closed-pii'], ['g003-luhn-story', 'golden-gap-set'], ['fail-closed-pii', 'local-second-add'], ['golden-gap-set', 'local-second-add']]
  .forEach(([a, b]) => ch('tp5-' + a + '-vs-' + b, 'talking', 1, 'Friday focus — which matters more (human-gate lead stays locked)?', [[TP5[a], 'cam:tp:' + a, a], [TP5[b], 'cam:tp:' + b, b]], { cambio: { kind: 'talking_point_pair', round: 5 } }));

// ---- L2: local-model edge cases (pairwise + rate -> edge_case_votes) ----
const EC = [['missing-key', 'Missing required key ({"label":"ovrigt","confidence":0.8}, 3b ×11)'], ['misspelled-key', 'Misspelled key "rationingen", integer confidence'], ['timeout', '7b timeout → abstain → handoff'],
  ['wrong-label', 'Schema-valid but wrong label (why approval exists)'], ['invented-span', '3b invents PII span not in text ("22-4821")'], ['luhn', 'Luhn-invalid personnummer missed by regex, found by model'],
  ['bare-name', 'Bare name with no title ("Tova Näckros")'], ['staff-fp', 'Staff first names flagged as PII (false positive)'], ['med-incident', 'llama labels medication tickets as incident (5/5)'], ['invented-route', 'Invented route name "report_request"']];
for (let i = 0; i < EC.length; i++) { rate('ec-r-' + EC[i][0], 'edge', 2, 'How strong as a live demo moment: ' + EC[i][1] + '?', 'cam:edge:' + EC[i][0], { cambio: { kind: 'edge_case_rating', edge_case: EC[i][0] } });
  const j = (i + 3) % EC.length; ch('ec-p-' + EC[i][0] + '-vs-' + EC[j][0], 'edge', 2, 'Feature which edge case?', [[EC[i][1], 'cam:ecp:' + EC[i][0], EC[i][0]], [EC[j][1], 'cam:ecp:' + EC[j][0], EC[j][0]]], { cambio: { kind: 'edge_case_pair' } }); }
ud('ec-ud1', 'edge', 2, 'Up-prioritise turning local-model errors into fixtures?');


// ---- L2: round-5 Friday edge cases (G-003 samordningsnummer, space-PNR, awaiting_approval miss) ----
const EC5 = [
  ['samordningsnummer', 'G-003: Luhn-invalid samordningsnummer (19850372-6614) missed by regex'],
  ['g003-handoff', 'G-003: name + access/behörighet → awaiting_approval instead of a person'],
  ['space-pnr', 'Space-separated personnummer (19621105 7743) — lint catches; rules must too'],
  ['luhn-invalid-shapes', 'Luhn-invalid 12-/10-digit / samordningsnummer still force mask + handoff']
];
for (let i = 0; i < EC5.length; i++) {
  rate('ec5-r-' + EC5[i][0], 'edge', 2, 'Friday rules priority: ' + EC5[i][1] + '?', 'cam:edge:' + EC5[i][0], { cambio: { kind: 'edge_case_rating', edge_case: EC5[i][0], round: 5 } });
  const j = (i + 1) % EC5.length;
  ch('ec5-p-' + EC5[i][0] + '-vs-' + EC5[j][0], 'edge', 2, 'Friday: feature which failure first?', [[EC5[i][1], 'cam:ecp:' + EC5[i][0], EC5[i][0]], [EC5[j][1], 'cam:ecp:' + EC5[j][0], EC5[j][0]]], { cambio: { kind: 'edge_case_pair', round: 5 } });
}
ud('ec5-ud1', 'edge', 2, 'Up-prioritise Friday fixtures for G-003 / Luhn-invalid / space-PNR?');

// ---- L2: abbreviation meaning picks (-> abbreviation_picks) ----
const by = {}; abbr.forEach(a => (by[a.abbr] = by[a.abbr] || []).push(a));
const DISTRACT = { 'böl': ['behörig överläkare'], 'ssk': ['specialistsköterska'], 'usk': ['undersökning'], 'ul': ['ultraljud'], 'us': [], 'MAS': ['medicinskt ansvarig specialist'] };
const PICK = ['ssk', 'usk', 'böl', 'AT', 'ul', 'UL', 'ht', 'HT', 'dsk', 'MAS', 'MAR', 'inf', 'us', 'ca', 'VT', 'BT', 'po', 'KAVA', 'SV', 'PO', 'ADL', 'AF', 'RR', 'OR', 'SoS', 'VUP'];
const SENT = clean.tickets.flatMap(t => (t.title + '. ' + t.body).split(/(?<=[.!?])\s+/));
// Synthetic one-liners for abbreviations with no hit in the ticket set (shown in the post-answer reveal).
const EXAMPLE = { us: 'Pat. väntar på us av läkare innan hemgång; us bokat imorgon kl 10.', KAVA: 'Patienten flyttas från akuten till KAVA för observation efter operation.',
  ADL: 'Bedömning av ADL: klarar påklädning själv, behöver hjälp vid dusch.', inf: 'Misstänkt inf i operationssåret, odling tagen.', ca: 'Pat. med känd ca mammae, väntar ca 20 min på provsvar.',
  UL: 'Remiss till UL buk skickad, tid om ca två veckor.', ul: 'ul ringer om ordinationen efter ronden.', ssk: 'Ansvarig ssk på avd 4C har kontrollerat listan.', usk: 'usk hjälper patienten med morgonrutinen.' };
const example = k => { if (EXAMPLE[k]) return { text: EXAMPLE[k], source: 'synthetic example (gen.js)' }; const re = new RegExp('(^|[^\\wåäöÅÄÖ])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\wåäöÅÄÖ])'); const h = SENT.find(x => re.test(x) && x.length < 160);
  if (h) return { text: h, source: 'synthetic-data/merged/clean.json' }; const n = by[k].map(a => a.notes).find(x => x && x.length > 30); return n ? { text: n.split(/(?<=\.)\s/)[0], source: 'swedish-medical-abbreviations.json (notes)' } : null; };
const seen = new Set(); let rngS = 7; const rnd = () => (rngS = (rngS * 16807) % 2147483647) / 2147483647;
PICK.forEach(k => { if (seen.has(k) || !by[k]) return; seen.add(k); const ex = [...new Set(by[k].map(a => a.expansion_sv))], amb = by[k].some(a => a.ambiguous) || ex.length > 1;
  let opts = ex.slice(); const cat = by[k][0].category; (DISTRACT[k] || []).forEach(d => opts.push(d));
  const pool = abbr.filter(a => a.category === cat && !ex.includes(a.expansion_sv) && a.abbr !== a.expansion_sv); while (opts.length < 3 && pool.length) { const d = pool.splice(Math.floor(rnd() * pool.length), 1)[0].expansion_sv; if (!opts.includes(d)) opts.push(d); }
  opts = opts.slice(0, 4).sort(() => rnd() - 0.5); const o = opts.map(x => [x, 'cam:abbr:' + slug(k) + ':' + slug(x), x]); o.push(['Ambiguous – depends on context', 'cam:abbr:' + slug(k) + ':ambiguous', '__ambiguous__']); o.push(["Don't know", 'cam:abbr:' + slug(k) + ':dk', '__unknown__']);
  ch('ab-' + slug(k) + (k !== k.toLowerCase() ? '-uc' : ''), 'abbr', 2, 'In a Swedish ticket, what does "' + k + '" mean?', o, { cambio: { kind: 'abbreviation_pick', abbr: k, dataset_expansions: ex, ambiguous: amb, category: cat },
    reveal: { expansions: by[k].map(a => ({ sv: a.expansion_sv, en: a.english })), example: example(k) } }); });
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


// ---- L4: data creation against EXISTING synthetic tickets & abbreviations (no new_ticket from scratch) ----
// ticket_edit.v1 — rewrite clunky synthetic tickets (typed override = edit field)
const EDIT_TICKETS = [
  ['opencode-glm-5.3-flash-free:T-006', 'title', 'unnatural'],
  ['opencode-glm-5.3-flash-free:T-006', 'body', 'unnatural'],
  ['opencode-glm-5.3-flash-free:T-009', 'title', 'unnatural'],
  ['opencode-glm-5.3-flash-free:T-011', 'title', 'wrong-register'],
  ['opencode-nemotron-3.5-lightning-free:T-002', 'body', 'wrong-register'],
  ['opencode-nemotron-3.5-lightning-free:T-008', 'body', 'abbr-fix'],
  ['opencode-glm-5.3-flash-free:T-001', 'title', 'unnatural'],
  ['opencode-nemotron-3.5-lightning-free:T-003', 'body', 'wrong-register']
];
const REASON_OPTS = [['Unnatural Swedish', 'unnatural'], ['Wrong register / tone', 'wrong-register'], ['Abbreviation mess', 'abbr-fix'], ['Other', 'other'], ['Looks fine — keep as-is', '__keep__']];
EDIT_TICKETS.forEach(([tid, field, hint]) => {
  const t = T.find(x => x.id === tid); if (!t) return;
  const original = t[field], s = slug(tid + '-' + field);
  ch('te-' + s, 'tickets', 4, 'Rewrite the ' + field + ' in more natural Swedish (type it below). Why does it need a rewrite?',
    REASON_OPTS.map(x => [x[0], 'cam:te:' + tid + ':' + field + ':' + x[1], x[1]]),
    { context: { title: t.title, body: t.body }, editField: true, cambio: { kind: 'ticket_edit', ticket_id: tid, field, original, hint_reason: hint } });
});

// bulk_label.v1 — label existing tickets (combined package as choice value)
const BULK = [
  'codex:T-004', 'codex:T-007', 'grok-build:T-001', 'grok-build:T-004',
  'opencode-deepseek-v4.1-flash-free:T-006', 'opencode-glm-5.3-flash-free:T-002',
  'opencode-nemotron-3.5-lightning-free:T-004', 'opencode-nemotron-3.5-lightning-free:T-007'
];
const PRI = ['low', 'medium', 'high', 'critical'];
BULK.forEach(tid => {
  const t = T.find(x => x.id === tid); if (!t) return;
  const s = slug(tid), lab = { category: t.category, expected_route: t.expected_route, priority: t.priority, contains_pii: t.contains_pii, needs_human: t.needs_human };
  const alt1 = Object.assign({}, lab, { needs_human: !lab.needs_human, expected_route: lab.needs_human ? 'kb_answer' : 'human_handoff' });
  const alt2 = Object.assign({}, lab, { contains_pii: !lab.contains_pii, priority: PRI[(PRI.indexOf(lab.priority) + 1) % PRI.length] });
  const fmt = L => (CAT_SV[L.category] || L.category) + ' · ' + (ROUTE_SV[L.expected_route] || L.expected_route) + ' · ' + L.priority + ' · PII ' + (L.contains_pii ? 'yes' : 'no') + ' · human ' + (L.needs_human ? 'yes' : 'no');
  const opts = [
    [fmt(lab) + ' (confidence 4)', 'cam:bl:' + tid + ':a', { labels: lab, confidence: 4 }],
    [fmt(alt1) + ' (confidence 3)', 'cam:bl:' + tid + ':b', { labels: alt1, confidence: 3 }],
    [fmt(alt2) + ' (confidence 2)', 'cam:bl:' + tid + ':c', { labels: alt2, confidence: 2 }],
    ['Custom — write labels in the box (category/route/priority/PII/human)', 'cam:bl:' + tid + ':manual', { labels: null, confidence: 3 }]
  ];
  ch('bl-' + s, 'tickets', 4, 'Bulk-label this synthetic ticket (all fields). Typed override still wins.',
    opts.map(o => [o[0], o[1], o[2]]),
    { context: { title: t.title, body: t.body }, cambio: { kind: 'bulk_label', ticket_id: tid, dataset_labels: lab } });
});

// abbreviation_verification.v1 — verify expansions; optional source_url from player (suggested sources are real URLs from the glossary when present)
const VERIFY = ['us', 'KAVA', 'ADL', 'inf', 'ca', 'UL', 'ul', 'MAS', 'MAR', 'ssk'];
const CHECKED_SOURCES = {
  MAS: 'https://termbank.socialstyrelsen.se/?query=medicinskt+ansvarig+sjuksk%C3%B6terska&src_lang=swe',
  MAR: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/regler-och-riktlinjer/vem-far-gora-vad/styrning-och-arbetsfordelning/medicinskt-ansvarig-sjukskoterska-mas-och-medicinskt-ansvarig-for-rehabilitering-mar/',
  ca: 'https://www.1177.se/riktlinjer-och-material/sprakliga-riktlinjer/stavning-skrivregler-stil/forkortningar/',
  ADL: 'https://sv.wikipedia.org/wiki/Aktiviteter_i_dagliga_livet',
  KAVA: 'https://www.1177.se/hitta-vard/kontaktkort/Kirurgisk-akutvardsavdelning-KAVA-Sundsvall/',
  UL: 'https://www.regionvarmland.se/vardgivarwebben/administration/sprakrad-for-dig-som-skriver-journal',
  ul: 'https://www.regionvarmland.se/vardgivarwebben/administration/sprakrad-for-dig-som-skriver-journal'
};
VERIFY.forEach(k => {
  if (!by[k]) return;
  const ex = [...new Set(by[k].map(a => a.expansion_sv))];
  const amb = by[k].some(a => a.ambiguous) || ex.length > 1;
  const expansion_sv = ex[0];
  const suggested = CHECKED_SOURCES[k] || null; // only sources we actually checked / know are real public pages
  const opts = [
    ['Correct as shown', 'cam:av:' + slug(k) + ':correct', 'correct'],
    ['Wrong', 'cam:av:' + slug(k) + ':wrong', 'wrong'],
    ['Ambiguous – depends on context', 'cam:av:' + slug(k) + ':ambiguous', 'ambiguous'],
    ['Missing reading (glossary incomplete)', 'cam:av:' + slug(k) + ':missing', 'missing-reading']
  ];
  ch('av-' + slug(k) + (k !== k.toLowerCase() ? '-uc' : ''), 'abbr', 4,
    'Verify "' + k + '" → "' + expansion_sv + '"' + (ex.length > 1 ? ' (also: ' + ex.slice(1).join(', ') + ')' : '') + '. Add a source URL below if you have one.',
    opts, { sourceField: true, suggestedSource: suggested || undefined,
      cambio: { kind: 'abbreviation_verification', abbr: k, expansion_sv, expansions: ex, ambiguous: amb, suggested_source: suggested || null },
      reveal: { expansions: by[k].map(a => ({ sv: a.expansion_sv, en: a.english })), example: example(k) } });
});

// pii_span_annotation.v1 — pick exact substring spans on synthetic tickets (MC + typed override)
const PII_CARDS = [
  ['codex:T-003', [['Tova Näckros', 'name'], ['810417-2846', 'personnummer']]],
  ['grok-build:T-005', [['Astrid Holmgren', 'name'], ['19740312-4821', 'personnummer'], ['Solbacken', 'address']]],
  ['opencode-nemotron-3.5-lightning-free:T-008', [['240101-1234', 'personnummer'], ['patient X', 'name']]],
  ['grok-build:T-006', [['Bengt Lövström', 'name'], ['19881105-7394', 'personnummer']]]
];
PII_CARDS.forEach(([tid, cands]) => {
  const t = T.find(x => x.id === tid); if (!t) return;
  const text = t.title + '\n' + t.body;
  const mk = (snippet, kind) => {
    const start = text.indexOf(snippet); return start < 0 ? null : { start, end: start + snippet.length, text: snippet, kind };
  };
  const spans = cands.map(([s, k]) => mk(s, k)).filter(Boolean);
  if (!spans.length) return;
  const none = [];
  const opts = [
    ['All listed spans', 'cam:ps:' + slug(tid) + ':all', spans],
    ['Personnummer only', 'cam:ps:' + slug(tid) + ':pnr', spans.filter(x => x.kind === 'personnummer')],
    ['Names only', 'cam:ps:' + slug(tid) + ':name', spans.filter(x => x.kind === 'name')],
    ['No PII spans', 'cam:ps:' + slug(tid) + ':none', none],
    ['Custom — type exact substring(s) in the box', 'cam:ps:' + slug(tid) + ':manual', null]
  ];
  ch('ps-' + slug(tid), 'tickets', 4, 'Which exact PII spans should the masker catch? (synthetic only). Candidates: ' + cands.map(c => '"' + c[0] + '"').join(', '),
    opts.map(o => [o[0], o[1], o[2]]),
    { context: { title: t.title, body: t.body }, cambio: { kind: 'pii_span_annotation', ticket_id: tid, candidates: spans } });
});

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
    decisions: [{ id: 'tickets-d-n', type: 'choice', area: 'tickets', prompt: 'Golden set size before the demo?', options: [{ label: '20 tickets', pref: 'dec:tickets:n:20' }, { label: 'All 56 (incl. 14 gap)', pref: 'dec:tickets:n:56' }, { label: '56 + copilot gap set', pref: 'dec:tickets:n:70' }] }] }
];
const out = Object.assign({}, base, { game: 'lo-cambio', version: 1, areas, cards,
  dataLevels: ['Casual – scope & talking points', 'Light – + edge cases & abbreviations', 'Normal – + ticket judgments (golden-label votes; 56 synthetic tickets incl. G-*/L-* gap set)', 'Data creation – rewrite, bulk-label, verify abbreviations', 'Data creation – new tickets from scratch (coming later)'],
  playableMaxLevel: 4,
  comingLater: [
    { level: 5, id: 'new-ticket', name: 'Author new synthetic Swedish tickets from scratch', schema: 'new_ticket.v1' },
    { level: 5, id: 'volume-more', name: 'Higher-volume labeling & span passes', schema: 'bulk_label.v1 + pii_span_annotation.v1' }],
  sources: { tickets: 'cambio-associate-ai-engineer/prep/synthetic-data/merged/clean.json', abbreviations: 'cambio-associate-ai-engineer/prep/swedish-medical-abbreviations.json', edge_cases: 'cambio-associate-ai-engineer/prep/local-models/REPORT.md', scope: 'cambio-associate-ai-engineer/prep/demo-eval/synthesis.md + health-standards/RESEARCH.md + cambio-tech-stack.md' },
  syntheticOnly: true });
fs.writeFileSync(__dirname + '/../data/areas.json', JSON.stringify(out, null, 1));
const n = {}; cards.forEach(c => { const k = 'L' + c.level + ' ' + c.area; n[k] = (n[k] || 0) + 1; }); console.log(cards.length, n);
