/* Lo · Cambio: turns a session log into Cambio-project records (UMD, no DOM; node-testable).
   Cambio.build(data, log, dataWeight) -> export block "lo-cambio.export.v1". Synthetic data only. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Cambio = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var SCHEMA = 'lo-cambio.export.v1';
  // Levels 4-5 (data creation): level 4 playable (ticket_edit / bulk_label / abbreviation_verification / pii_span); level 5 (new_ticket) still coming later.
  var LEVEL45_SCHEMAS = {
    'ticket_edit.v1': { ticket_id: 'string (clean.json id)', field: 'title|body', original: 'string', edited: 'string', reason: 'unnatural|wrong-register|abbr-fix|other', synthetic_attestation: 'true (no real patient data)' },
    'new_ticket.v1': { id: 'lo:<uuid>', title: 'string (sv)', body: 'string (sv)', category: 'clean.json category enum', priority: 'low|medium|high|critical', contains_pii: 'bool', needs_human: 'bool', expected_route: 'route enum', source: 'lo-cambio', synthetic_attestation: 'true' },
    'bulk_label.v1': { ticket_id: 'string', labels: { category: 'enum', expected_route: 'enum', priority: 'enum', contains_pii: 'bool', needs_human: 'bool' }, ms: 'int', confidence: '1-5' },
    'abbreviation_verification.v1': { abbr: 'string', expansion_sv: 'string', verdict: 'correct|wrong|ambiguous|missing-reading', ambiguous: 'bool', proposed_expansion: 'string?', source_url: 'string?' },
    'pii_span_annotation.v1': { ticket_id: 'string', spans: [{ start: 'int', end: 'int', text: 'exact substring', kind: 'name|personnummer|phone|address|patient_detail' }] }
  };
  function cardMap(data) { var m = {}; data.cards.forEach(function (c) { m[c.id] = c; }); return m; }
  function build(data, log, dw) {
    var cm = cardMap(data), w = dw ? dw.weight : 1, counted = dw ? dw.counted !== false : true;
    var out = { schema: SCHEMA, synthetic_only: true, sources: data.sources, weight: w, counted: counted, golden_label_votes: [], naturalness: [], scope_decisions: [], abbreviation_picks: [], edge_case_votes: [], talking_point_ranking: [], level45: { status: 'level-4-playable', level5: 'coming-later', schemas: LEVEL45_SCHEMAS, records: [] } };
    var tp = {}, ec = {};
    out.manual_replies = [];
    (log || []).forEach(function (l) { var c = cm[l.card]; if (!c || !c.cambio || l.choice === 'skip' || l.choice == null) return; var k = c.cambio, mr = l.manualReply ? String(l.manualReply) : null;
      // Typed override (optional fields, v1-compatible): every typed reply lands in manual_replies[]; a reply WITH a picked choice also
      // tags the normal record with manualReply/overridden (the choice stays as context). Text-only replies (choice 'manual') appear only here.
      if (mr) out.manual_replies.push({ card: c.id, area: c.area, kind: k.kind, ref: k.ticket_id || k.decision_id || k.abbr || k.edge_case || null, field: k.field, prompt: c.prompt, manualReply: mr, overridden: true,
        selected_choice: l.choice === 'manual' ? null : l.choice, selected_label: l.choice === 'manual' ? null : c.type === 'choice' ? c.options[l.choice].label : String(l.choice), selected_value: l.choice === 'manual' ? null : c.type === 'choice' ? c.options[l.choice].value : l.choice,
        dataset_label: k.dataset_label, dataset_expansions: k.dataset_expansions, ms: l.ms, at: l.t });
      if (l.choice === 'manual') return;
      var o = c.type === 'choice' ? c.options[l.choice] : null, base = { card: c.id, ms: l.ms, at: l.t }; if (mr) { base.manualReply = mr; base.overridden = true; }
      if (k.kind === 'label_vote') out.golden_label_votes.push(Object.assign({ ticket_id: k.ticket_id, field: k.field, vote: o.value, dataset_label: k.dataset_label, agrees: o.value === k.dataset_label, weight: w }, base));
      else if (k.kind === 'naturalness') out.naturalness.push(Object.assign({ ticket_id: k.ticket_id, rating: l.choice }, base));
      else if (k.kind === 'scope_decision') out.scope_decisions.push(Object.assign({ decision_id: k.decision_id, choice: o.value, label: o.label }, base));
      else if (k.kind === 'abbreviation_pick') out.abbreviation_picks.push(Object.assign({ abbr: k.abbr, picked: o.value === '__ambiguous__' ? null : o.value === '__unknown__' ? null : o.value, picked_ambiguous: o.value === '__ambiguous__', dont_know: o.value === '__unknown__', dataset_expansions: k.dataset_expansions, dataset_ambiguous: k.ambiguous,
        in_dataset: k.dataset_expansions.indexOf(o.value) >= 0 || (o.value === '__ambiguous__' && k.ambiguous) }, base));
      else if (k.kind === 'edge_case_rating') { out.edge_case_votes.push(Object.assign({ edge_case: k.edge_case, kind: 'rating', value: l.choice }, base)); ec[k.edge_case] = (ec[k.edge_case] || 0) + l.choice; }
      else if (k.kind === 'edge_case_pair') { var lo = c.options[1 - l.choice].value; out.edge_case_votes.push(Object.assign({ edge_case: o.value, kind: 'pair_win', over: lo }, base)); ec[o.value] = (ec[o.value] || 0) + 1; ec[lo] = (ec[lo] || 0) - 1; }
      else if (k.kind === 'talking_point_pair') { [0, 1].forEach(function (i) { var v = c.options[i].value, t = tp[v] = tp[v] || { id: v, label: c.options[i].label, wins: 0, shown: 0 }; t.shown++; if (i === l.choice) t.wins++; }); }
      else if (k.kind === 'ticket_edit') {
        var reason = o ? o.value : 'other'; if (reason === '__keep__' && !mr) { /* flagged OK — no edit record */ }
        else out.level45.records.push(Object.assign({ schema: 'ticket_edit.v1', ticket_id: k.ticket_id, field: k.field, original: k.original, edited: mr || '', reason: reason === '__keep__' ? 'other' : reason, synthetic_attestation: true }, base));
      } else if (k.kind === 'bulk_label') {
        var pack = o && typeof o.value === 'object' && o.value ? o.value : null, labels = pack && pack.labels, conf = pack && pack.confidence != null ? pack.confidence : 3;
        if ((!labels || pack && pack.labels === null) && mr) { try { var parsed = JSON.parse(mr); if (parsed && parsed.category) { labels = parsed; if (parsed.confidence) conf = parsed.confidence; } } catch (e) { labels = { note: mr }; } }
        if (!labels) labels = k.dataset_labels || {};
        out.level45.records.push(Object.assign({ schema: 'bulk_label.v1', ticket_id: k.ticket_id, labels: labels, confidence: conf }, base));
      } else if (k.kind === 'abbreviation_verification') {
        var verdict = o ? o.value : 'ambiguous', src = (l.sourceUrl && String(l.sourceUrl).trim()) || null, prop = null;
        if (mr) { var m = String(mr).trim(); if (/^https?:\/\//i.test(m) && !src) { src = m; } else { prop = m; } }
        var rec = Object.assign({ schema: 'abbreviation_verification.v1', abbr: k.abbr, expansion_sv: k.expansion_sv, verdict: verdict, ambiguous: verdict === 'ambiguous' || !!k.ambiguous }, base);
        if (prop) rec.proposed_expansion = prop; if (src) rec.source_url = src;
        out.level45.records.push(rec);
      } else if (k.kind === 'pii_span_annotation') {
        var spans = o && Array.isArray(o.value) ? o.value : (o && o.value === null && mr ? null : (Array.isArray(o && o.value) ? o.value : []));
        if (spans == null && mr) { spans = String(mr).split(/\n+/).map(function (line) { line = line.trim(); if (!line) return null; var blob = (c.context ? (c.context.title + '\n' + c.context.body) : ''); var start = blob.indexOf(line); return start < 0 ? { start: -1, end: -1, text: line, kind: 'patient_detail' } : { start: start, end: start + line.length, text: line, kind: 'patient_detail' }; }).filter(Boolean); }
        if (!Array.isArray(spans)) spans = [];
        out.level45.records.push(Object.assign({ schema: 'pii_span_annotation.v1', ticket_id: k.ticket_id, spans: spans }, base));
      }
    });
    out.talking_point_ranking = Object.keys(tp).map(function (k) { var t = tp[k]; t.score = Math.round(t.wins / t.shown * 100) / 100; return t; }).sort(function (a, b) { return b.score - a.score || b.wins - a.wins; }).map(function (t, i) { t.rank = i + 1; return t; });
    out.edge_case_ranking = Object.keys(ec).map(function (k) { return { edge_case: k, score: ec[k] }; }).sort(function (a, b) { return b.score - a.score; });
    var gv = out.golden_label_votes; out.summary = { votes: gv.length, agree: gv.filter(function (v) { return v.agrees; }).length, disagreements: gv.filter(function (v) { return !v.agrees; }).map(function (v) { return v.ticket_id + ' ' + v.field + ': dataset ' + v.dataset_label + ' vs vote ' + v.vote; }) };
    return out;
  }
  function markdown(x) { var L = ['', '## Cambio export (' + x.schema + ', synthetic only, weight ' + x.weight + (x.counted ? '' : ', NOT counted') + ')', '- Golden-label votes: ' + x.summary.votes + ' (agree with dataset ' + x.summary.agree + ')'];
    x.summary.disagreements.forEach(function (d) { L.push('  - review: ' + d); });
    if (x.scope_decisions.length) { L.push('- Scope decisions:'); x.scope_decisions.forEach(function (d) { L.push('  - ' + d.decision_id + ' → ' + d.label); }); }
    if (x.talking_point_ranking.length) { L.push('- Talking points:'); x.talking_point_ranking.forEach(function (t) { L.push('  ' + t.rank + '. ' + t.label + ' (' + t.wins + '/' + t.shown + ')'); }); }
    if (x.edge_case_ranking.length) L.push('- Edge cases: ' + x.edge_case_ranking.map(function (e) { return e.edge_case + ' ' + (e.score > 0 ? '+' : '') + e.score; }).join(', '));
    if (x.manual_replies && x.manual_replies.length) { L.push('- Typed replies (override the choice):'); x.manual_replies.forEach(function (m) { L.push('  - ' + m.card + (m.ref ? ' [' + m.ref + ']' : '') + ': "' + m.manualReply + '"' + (m.selected_label != null ? ' (picked: ' + m.selected_label + ')' : '')); }); }
    if (x.abbreviation_picks.length) L.push('- Abbreviations: ' + x.abbreviation_picks.map(function (a) { return a.abbr + '=' + (a.picked_ambiguous ? 'ambiguous' : a.dont_know ? '?' : a.picked) + (a.in_dataset ? '' : ' ✗'); }).join(', '));
    if (x.level45 && x.level45.records && x.level45.records.length) { L.push('- Level 4–5 records (' + x.level45.status + '):'); x.level45.records.forEach(function (r) { L.push('  - ' + r.schema + (r.ticket_id ? ' ' + r.ticket_id : r.abbr ? ' ' + r.abbr : '') + (r.verdict ? ' → ' + r.verdict : '') + (r.source_url ? ' src=' + r.source_url : '') + (r.edited ? ' edited' : '')); }); }
    return L.join('\n') + '\n'; }
  function levelCards(data, level) { var max = Math.min(level || 3, data.playableMaxLevel || 3); return data.cards.filter(function (c) { return (c.level || 1) <= max; }); }
  return { SCHEMA: SCHEMA, LEVEL45_SCHEMAS: LEVEL45_SCHEMAS, build: build, markdown: markdown, levelCards: levelCards };
});
