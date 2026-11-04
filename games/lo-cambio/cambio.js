/* Lo · Cambio: turns a session log into Cambio-project records (UMD, no DOM; node-testable).
   Cambio.build(data, log, dataWeight) -> export block "lo-cambio.export.v1". Synthetic data only. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Cambio = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var SCHEMA = 'lo-cambio.export.v1';
  // Levels 4-5 (data creation): schemas defined now, UI comes later.
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
    var out = { schema: SCHEMA, synthetic_only: true, sources: data.sources, weight: w, counted: counted, golden_label_votes: [], naturalness: [], scope_decisions: [], abbreviation_picks: [], edge_case_votes: [], talking_point_ranking: [], level45: { status: 'coming-later', schemas: LEVEL45_SCHEMAS, records: [] } };
    var tp = {}, ec = {};
    (log || []).forEach(function (l) { var c = cm[l.card]; if (!c || !c.cambio || l.choice === 'skip' || l.choice == null) return; var k = c.cambio, o = c.type === 'choice' ? c.options[l.choice] : null, base = { card: c.id, ms: l.ms, at: l.t };
      if (k.kind === 'label_vote') out.golden_label_votes.push(Object.assign({ ticket_id: k.ticket_id, field: k.field, vote: o.value, dataset_label: k.dataset_label, agrees: o.value === k.dataset_label, weight: w }, base));
      else if (k.kind === 'naturalness') out.naturalness.push(Object.assign({ ticket_id: k.ticket_id, rating: l.choice }, base));
      else if (k.kind === 'scope_decision') out.scope_decisions.push(Object.assign({ decision_id: k.decision_id, choice: o.value, label: o.label }, base));
      else if (k.kind === 'abbreviation_pick') out.abbreviation_picks.push(Object.assign({ abbr: k.abbr, picked: o.value === '__ambiguous__' ? null : o.value === '__unknown__' ? null : o.value, picked_ambiguous: o.value === '__ambiguous__', dont_know: o.value === '__unknown__', dataset_expansions: k.dataset_expansions, dataset_ambiguous: k.ambiguous,
        in_dataset: k.dataset_expansions.indexOf(o.value) >= 0 || (o.value === '__ambiguous__' && k.ambiguous) }, base));
      else if (k.kind === 'edge_case_rating') { out.edge_case_votes.push(Object.assign({ edge_case: k.edge_case, kind: 'rating', value: l.choice }, base)); ec[k.edge_case] = (ec[k.edge_case] || 0) + l.choice; }
      else if (k.kind === 'edge_case_pair') { var lo = c.options[1 - l.choice].value; out.edge_case_votes.push(Object.assign({ edge_case: o.value, kind: 'pair_win', over: lo }, base)); ec[o.value] = (ec[o.value] || 0) + 1; ec[lo] = (ec[lo] || 0) - 1; }
      else if (k.kind === 'talking_point_pair') { [0, 1].forEach(function (i) { var v = c.options[i].value, t = tp[v] = tp[v] || { id: v, label: c.options[i].label, wins: 0, shown: 0 }; t.shown++; if (i === l.choice) t.wins++; }); }
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
    if (x.abbreviation_picks.length) L.push('- Abbreviations: ' + x.abbreviation_picks.map(function (a) { return a.abbr + '=' + (a.picked_ambiguous ? 'ambiguous' : a.dont_know ? '?' : a.picked) + (a.in_dataset ? '' : ' ✗'); }).join(', '));
    return L.join('\n') + '\n'; }
  function levelCards(data, level) { var max = Math.min(level || 3, data.playableMaxLevel || 3); return data.cards.filter(function (c) { return (c.level || 1) <= max; }); }
  return { SCHEMA: SCHEMA, LEVEL45_SCHEMAS: LEVEL45_SCHEMAS, build: build, markdown: markdown, levelCards: levelCards };
});
