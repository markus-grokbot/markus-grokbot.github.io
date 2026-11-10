const assert = require('assert');
const fs = require('fs');
const path = require('path');
const A = require('../adaptive.js');
const C = require('../cambio.js');
const P = require('../../lo-preferences/prefs.js');

function loadMerged() {
  const root = path.join(__dirname, '../data');
  const D = JSON.parse(fs.readFileSync(path.join(root, 'areas.json'), 'utf8'));
  ['intervju-cards.json', 'glossary-cards.json'].forEach(name => {
    const extraP = path.join(root, name);
    if (!fs.existsSync(extraP)) return;
    const extra = JSON.parse(fs.readFileSync(extraP, 'utf8'));
    (extra.areas || []).forEach(a => { if (!D.areas.some(x => x.id === a.id)) D.areas.push(a); });
    D.cards = D.cards.concat(extra.cards || []);
  });
  return D;
}

const D = loadMerged();
const scored = D.cards.filter(c => A.isScored(c) && c.area === 'intervju');
const calib = D.cards.filter(c => A.isCalibration(c));
const by = {};
scored.forEach(c => { by[c.difficulty] = (by[c.difficulty] || 0) + 1; });
[1, 2, 3, 4, 5].forEach(l => assert((by[l] || 0) >= 15, 'need 15+ scored at difficulty ' + l + ' got ' + by[l]));
assert(calib.length >= 10, 'calibration cards');
assert(scored.every(c => c.level === 1 && c.hint && c.reword && c.explain && c.options.length >= 3));
assert(calib.every(c => c.scored === false && c.cambio && c.cambio.kind === 'calibration' && !c.correct));
assert(!JSON.stringify(scored.concat(calib)).match(/Martin Rehn|@cambio\.se/i), 'no employee names');
console.log('bank OK', scored.length, 'scored', by, 'calib', calib.length);
const gl = D.cards.filter(c => c.area === 'ordlista');
assert.equal(gl.length, 505, 'glossary size');
assert(D.areas.some(a => a.id === 'ordlista' && a.name === 'Ordlista · tech' && a.defaultOn !== false));
assert(gl.every(c => A.isScored(c) && c.adaptive && c.level === 1 && c.hint && c.options.length >= 4));
const gdb = {};
gl.forEach(c => { gdb[c.difficulty] = (gdb[c.difficulty] || 0) + 1; });
[1, 2, 3, 4, 5].forEach(l => assert((gdb[l] || 0) >= 15, 'glossary difficulty ' + l + ' got ' + gdb[l]));
assert(!JSON.stringify(gl).match(/Martin Rehn|@cambio\.se/i), 'glossary names');
console.log('glossary OK', gdb);


// --- retire after 3 cumulative correct ---
const q = scored.find(c => c.id === 'iq-fail-closed');
assert(q);
let st = A.empty();
function ans(card, ok) {
  const ci = A.correctIndex(card);
  const ev = A.evaluate(card, ok ? ci : (ci === 0 ? 1 : 0), {});
  return A.record(st, card, ev, {});
}
ans(q, true); ans(q, false); ans(q, true); ans(q, true);
assert.equal(st.questions[q.id].correct, 3);
assert.equal(st.questions[q.id].fails, 1);
assert.equal(st.questions[q.id].retired, true);
assert.equal(A.isRetired(st, q), true);
// 3 cumulative, not in a row — already mixed with a fail
assert(st.questions[q.id].correct === A.RETIRE_AT);

// --- fail ladder ---
const q2 = scored.find(c => c.id === 'iq-pipeline-order');
st = A.empty();
function wrong(card) { return A.record(st, card, A.evaluate(card, A.correctIndex(card) === 0 ? 1 : 0, {}), {}); }
wrong(q2);
let view = A.present(q2, A.qState(st, q2.id, q2));
assert(view.hint, 'fail 1 shows hint');
assert.deepEqual(view.hidden, []);
wrong(q2);
view = A.present(q2, A.qState(st, q2.id, q2));
assert(view.hint, 'fail 2 keeps hint');
assert.equal(view.hidden.length, 1, 'fail 2 hides one wrong option');
assert.notEqual(view.hidden[0], A.correctIndex(q2), 'must not hide the correct option');
wrong(q2);
view = A.present(q2, A.qState(st, q2.id, q2));
assert.equal(view.reworded, true);
assert.equal(view.prompt, q2.reword);
assert.equal(view.hidden.length, 1);
// no-reword fallback
const bare = { id: 'bare', scored: true, difficulty: 1, prompt: 'P?', hint: 'H', options: [
  { label: 'A', value: 'a' }, { label: 'B', value: 'b' }, { label: 'C', value: 'c' }
], correct: 'a' };
st = A.empty();
st.questions.bare = { timesSeen: 3, correct: 0, fails: 3, rating: 4, retired: false };
view = A.present(bare, A.qState(st, 'bare', bare));
assert.equal(view.reworded, false);
assert.equal(view.hint, 'H');
assert.equal(view.hidden.length, 1);

// --- rating moves down on correct, up on wrong ---
st = A.empty();
const q3 = scored.find(c => c.id === 'iq-synthetic-only');
assert.equal(A.qState(st, q3.id, q3).rating, 1);
A.record(st, q3, A.evaluate(q3, A.correctIndex(q3) === 0 ? 1 : 0, {}), {});
assert.equal(st.questions[q3.id].rating, 2);
A.record(st, q3, A.evaluate(q3, A.correctIndex(q3), {}), {});
assert.equal(st.questions[q3.id].rating, 1);

// --- skip does not change correct/fails/rating ---
const before = Object.assign({}, st.questions[q3.id]);
A.record(st, q3, A.evaluate(q3, 'skip', {}), {});
assert.equal(st.questions[q3.id].correct, before.correct);
assert.equal(st.questions[q3.id].fails, before.fails);
assert.equal(st.questions[q3.id].rating, before.rating);
assert.equal(st.questions[q3.id].timesSeen, before.timesSeen + 1);

// --- typed alias match ---
assert.equal(A.evaluate(q, 'manual', { manualReply: 'fail closed — steget stängs' }).correct, true);
assert.equal(A.evaluate(q, 'manual', { manualReply: 'helt fel svar xyz' }).correct, false);

// --- abbreviation_pick is scored ---
const ab = D.cards.find(c => c.cambio && c.cambio.kind === 'abbreviation_pick' && c.id === 'ab-ssk');
assert(ab);
const abOk = ab.options.findIndex(o => o.value === 'sjuksköterska');
assert.equal(A.evaluate(ab, abOk, {}).correct, true);
assert.equal(A.evaluate(ab, ab.options.findIndex(o => o.value === '__unknown__'), {}).correct, false);

// --- label votes are NOT scored (no leaked hints) ---
const lv = D.cards.find(c => c.cambio && c.cambio.kind === 'label_vote');
assert(lv);
assert.equal(A.isScored(lv), false);

// --- player promotion and floor ---
st = A.empty();
const l1 = scored.filter(c => c.difficulty === 1).slice(0, 8);
assert(l1.length >= 5);
// 8 unique correct, 0 wrong -> promote
l1.forEach(card => { A.record(st, card, { scored: true, correct: true }, {}); });
assert.equal(st.player.level, 2, 'promoted to 2');
assert.equal(st.player.floor, 1, 'passed level 1, floor=1');
// never drop
A.record(st, l1[0], { scored: true, correct: false }, {});
assert.equal(st.player.level, 2);
assert.equal(st.player.floor, 1);
// not enough unique / accuracy: start fresh
st = A.empty();
for (let i = 0; i < 8; i++) A.record(st, l1[0], { scored: true, correct: true }, {});
assert.equal(st.player.level, 1, 'only 1 unique, no promote');
st = A.empty();
l1.slice(0, 5).forEach(card => A.record(st, card, { scored: true, correct: true }, {}));
for (let i = 0; i < 4; i++) A.record(st, l1[0], { scored: true, correct: false }, {});
A.record(st, l1[5], { scored: true, correct: true }, {});
A.record(st, l1[6], { scored: true, correct: true }, {});
A.record(st, l1[7], { scored: true, correct: true }, {});
// 8 correct, 4 wrong = 66% < 75%, 8 unique? wait uniqueCorrect has 5+1+1+1 = 8, correct=8, wrong=4
assert.equal(st.player.level, 1, 'accuracy too low');

// --- sessionPool prefers unseen at current level, excludes retired, keeps judgment ---
st = A.empty();
st.questions[q.id] = { timesSeen: 3, correct: 3, fails: 0, rating: 1, retired: true };
const pool = A.sessionPool(D.cards, st);
assert(!pool.some(c => c.id === q.id), 'retired excluded');
assert(pool.some(c => c.area === 'scope'), 'judgment cards kept');
assert(pool.some(c => A.isCalibration(c)), 'calibration kept');
assert(pool.filter(c => c.area === 'intervju' && c.difficulty === 1 && !A.isRetired(st, c)).length > 0, 'unseen L1 included');

// --- calibration not scored, not retired, no promotion ---
st = A.empty();
const cal = calib[0];
for (let i = 0; i < 5; i++) {
  const ev = A.evaluate(cal, 0, { manualReply: 'egen text ' + i });
  assert.equal(ev.scored, false);
  assert.equal(ev.calibration, true);
  A.record(st, cal, ev, { label: cal.options[0].label, value: cal.options[0].value, manualReply: 'egen text ' + i });
}
assert(!A.isRetired(st, cal));
assert.equal(st.player.level, 1);
assert(st.calibration[cal.id]);
assert(st.calibration[cal.id].previous, 'later answers remember previous stance');

// --- export calibration via Cambio.build ---
const hand = { card: cal, seq: 1, shownAt: Date.now() - 100 };
const fakeSess = P.create(Object.assign({}, D, { cards: [cal] }), { areas: ['kalibrering'] });
const h = fakeSess.next();
const e = fakeSess.answer(h, 1);
e.manualReply = 'jag skulle sätta mig med supporten först';
e.overridden = true;
e.calibChanged = true;
e.calibPrevious = { value: 'old', label: 'old stance' };
const x = C.build(D, fakeSess.result().log, { weight: 1, counted: true });
assert(Array.isArray(x.calibration));
assert(x.calibration.length >= 1);
const rec = x.calibration[0];
assert.equal(rec.kind, 'calibration');
assert.equal(rec.theme, cal.cambio.theme);
assert.equal(rec.manualReply, 'jag skulle sätta mig med supporten först');
assert.equal(rec.changed, true);
assert.equal(rec.previous.value, 'old');
assert(C.markdown(x).includes('Calibration'));
// text-only calibration
const s2 = P.create(Object.assign({}, D, { cards: [cal] }), { areas: ['kalibrering'] });
const h2 = s2.next();
const e2 = s2.answer(h2, 'skip'); e2.choice = 'manual'; e2.manualReply = 'bara text'; e2.overridden = true;
const x2 = C.build(D, s2.result().log, { weight: 1, counted: true });
assert(x2.calibration.some(c => c.selected_choice === null && c.manualReply === 'bara text'));

// existing export still works on merged data
const LD = Object.assign({}, D, { cards: C.levelCards(D, 3) });
const s3 = P.create(LD, {});
for (let i = 0; i < 40; i++) {
  const hh = s3.next();
  s3.answer(hh, hh.card.type === 'choice' ? 0 : hh.card.type === 'rate' ? 1 : 'up');
}
const x3 = C.build(D, s3.result().log, P.weighSession(D, 3, { score: 1 }));
assert.equal(x3.schema, 'lo-cambio.export.v1');
assert(x3.golden_label_votes.length + x3.scope_decisions.length + x3.abbreviation_picks.length + x3.calibration.length >= 1);

const hud = A.hud(A.empty());
assert.equal(hud.level, 1);
assert.equal(hud.floor, 1);
console.log('adaptive tests OK');
