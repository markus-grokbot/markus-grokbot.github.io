/* Lo · Cambio adaptive difficulty (UMD, no DOM; node-testable).
   Per-question: timesSeen, correct (cumulative), fails, rating 1–5, retired.
   3 cumulative correct retires a scored question (not necessarily in a row).
   Fail ladder: 1 hint → 2 hint + hide one wrong option → 3 reword (else hint+50/50).
   Player level/floor never drop. Promote after 8 correct at current base-difficulty
   with accuracy ≥75% and ≥5 unique questions correct at least once.
   Calibration cards are not scored, not retired by correctness, and are session-once.
*/
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Adaptive = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var SCHEMA = 'lo-cambio.adaptive.v1';
  var RETIRE_AT = 3;
  var PROMOTE_CORRECT = 8;
  var PROMOTE_ACCURACY = 0.75;
  var PROMOTE_UNIQUE = 5;
  var PREVIEW_AT = 4;
  var MIN_D = 1, MAX_D = 5;

  function clamp(n, a, b) { n = +n; if (!(n >= a)) n = a; if (n > b) n = b; return n; }
  function norm(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[–—]/g, '-').replace(/[.,:;!?«»""']/g, '')
      .replace(/\s+/g, ' ');
  }
  function empty() {
    return { schema: SCHEMA, player: { level: 1, floor: 1, progress: {} }, questions: {}, calibration: {} };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load(raw) {
    var s = empty();
    if (!raw || typeof raw !== 'object') return s;
    if (raw.player && typeof raw.player === 'object') {
      s.player.level = clamp(raw.player.level || 1, MIN_D, MAX_D);
      s.player.floor = clamp(raw.player.floor || 1, MIN_D, s.player.level);
      if (raw.player.progress && typeof raw.player.progress === 'object') s.player.progress = raw.player.progress;
    }
    if (raw.questions && typeof raw.questions === 'object') s.questions = raw.questions;
    if (raw.calibration && typeof raw.calibration === 'object') s.calibration = raw.calibration;
    return s;
  }
  function exportState(state) { var s = load(state); s.schema = SCHEMA; return clone(s); }

  function baseDiff(card) { return clamp((card && (card.difficulty != null ? card.difficulty : card.level)) || 1, MIN_D, MAX_D); }
  function isCalibration(card) {
    if (!card) return false;
    if (card.scored === false && (card.kind === 'calibration' || (card.cambio && card.cambio.kind === 'calibration'))) return true;
    return !!(card.kind === 'calibration' || (card.cambio && card.cambio.kind === 'calibration'));
  }
  function isScored(card) {
    if (!card || isCalibration(card) || card.scored === false) return false;
    if (card.scored === true) return true;
    if (card.correct != null || card.correctValue != null) return true;
    return !!(card.cambio && card.cambio.kind === 'abbreviation_pick');
  }
  function qState(state, id, card) {
    var q = (state.questions && state.questions[id]) || {};
    return {
      timesSeen: q.timesSeen || 0,
      correct: q.correct || 0,
      fails: q.fails || 0,
      rating: q.rating != null ? clamp(q.rating, MIN_D, MAX_D) : baseDiff(card || { difficulty: 1 }),
      retired: !!q.retired,
      lastResult: q.lastResult || null,
      lastAt: q.lastAt || null
    };
  }
  function isRetired(state, card) {
    if (!card || !isScored(card)) return false;
    var q = state && state.questions && state.questions[card.id];
    return !!(q && (q.retired || q.correct >= RETIRE_AT));
  }

  function correctIndex(card) {
    if (!card || !card.options) return -1;
    var cv = card.correctValue != null ? card.correctValue : card.correct;
    if (typeof cv === 'number' && card.options[cv]) return cv;
    for (var i = 0; i < card.options.length; i++) {
      if (card.options[i].value === cv || card.options[i].label === cv) return i;
    }
    if (card.cambio && card.cambio.kind === 'abbreviation_pick') {
      var exps = card.cambio.dataset_expansions || [];
      for (var j = 0; j < card.options.length; j++) {
        var v = card.options[j].value;
        if (exps.indexOf(v) >= 0 || (v === '__ambiguous__' && card.cambio.ambiguous)) return j;
      }
    }
    return -1;
  }

  function aliases(card) {
    var out = (card.aliases || []).slice();
    var ci = correctIndex(card);
    if (ci >= 0 && card.options[ci]) {
      out.push(card.options[ci].label, card.options[ci].value);
    }
    if (card.correctValue != null) out.push(String(card.correctValue));
    if (typeof card.correct === 'string') out.push(card.correct);
    if (card.cambio && card.cambio.dataset_expansions) out = out.concat(card.cambio.dataset_expansions);
    return out.map(norm).filter(Boolean);
  }

  function textMatches(card, text) {
    var t = norm(text);
    if (!t) return false;
    return aliases(card).some(function (a) {
      if (!a) return false;
      if (t === a) return true;
      if (a.length >= 4 && (t.indexOf(a) >= 0 || a.indexOf(t) >= 0)) return true;
      return false;
    });
  }

  function evaluate(card, choice, extra) {
    extra = extra || {};
    if (choice === 'skip' || choice == null) return { skip: true, scored: false, correct: null, calibration: isCalibration(card) };
    if (isCalibration(card)) return { skip: false, scored: false, correct: null, calibration: true };
    if (!isScored(card)) return { skip: false, scored: false, correct: null, calibration: false };
    var mr = extra.manualReply ? String(extra.manualReply).trim() : '';
    var pickedOk = false;
    if (choice !== 'manual') {
      if (card.cambio && card.cambio.kind === 'abbreviation_pick' && card.options && card.options[choice] != null) {
        var val = card.options[choice].value;
        var exps = card.cambio.dataset_expansions || [];
        pickedOk = exps.indexOf(val) >= 0 || (val === '__ambiguous__' && !!card.cambio.ambiguous);
      } else {
        var ci = correctIndex(card);
        if (typeof choice === 'number') pickedOk = choice === ci;
        else if (card.options) {
          for (var i = 0; i < card.options.length; i++) {
            if (String(choice) === String(i) && i === ci) pickedOk = true;
            if (card.options[i].value === choice && i === ci) pickedOk = true;
          }
        }
      }
    }
    var textOk = mr ? textMatches(card, mr) : false;
    var ok;
    if (mr && choice === 'manual') ok = textOk;
    else if (mr && textOk) ok = true;
    else if (mr && pickedOk) ok = true;
    else ok = pickedOk;
    return { skip: false, scored: true, correct: !!ok, calibration: false };
  }

  function progOf(state, level) {
    var key = String(level);
    var p = state.player.progress[key];
    if (!p) p = state.player.progress[key] = { correct: 0, wrong: 0, uniqueCorrect: [] };
    if (!Array.isArray(p.uniqueCorrect)) p.uniqueCorrect = p.uniqueCorrect ? [].concat(p.uniqueCorrect) : [];
    return p;
  }

  function maybePromote(state) {
    var L = clamp(state.player.level || 1, MIN_D, MAX_D);
    var p = progOf(state, L);
    var total = (p.correct || 0) + (p.wrong || 0);
    var acc = total ? p.correct / total : 0;
    if (p.correct >= PROMOTE_CORRECT && acc >= PROMOTE_ACCURACY && p.uniqueCorrect.length >= PROMOTE_UNIQUE && L < MAX_D) {
      state.player.floor = Math.max(state.player.floor || 1, L);
      state.player.level = L + 1;
      return true;
    }
    if (p.correct >= PROMOTE_CORRECT && acc >= PROMOTE_ACCURACY && p.uniqueCorrect.length >= PROMOTE_UNIQUE && L === MAX_D) {
      state.player.floor = MAX_D;
      state.player.level = MAX_D;
    }
    return false;
  }

  function record(state, card, ev, extra) {
    extra = extra || {};
    ev = ev || {};
    if (!card || !card.id) return { changed: false };
    var now = extra.at || new Date().toISOString();
    if (isCalibration(card)) {
      if (ev.skip) return { changed: false, calibration: true };
      var theme = (card.cambio && card.cambio.theme) || null;
      var prev = state.calibration[card.id] || null;
      if (!prev && card.cambio && card.cambio.consistencyOf) prev = state.calibration[card.cambio.consistencyOf] || null;
      if (!prev && theme) {
        var ids = Object.keys(state.calibration);
        for (var i = 0; i < ids.length; i++) {
          var e = state.calibration[ids[i]];
          if (e && e.theme === theme) { prev = e; break; }
        }
      }
      var label = extra.label != null ? extra.label : null;
      var value = extra.value != null ? extra.value : null;
      var mr = extra.manualReply ? String(extra.manualReply) : null;
      var changed = !!(prev && ((value != null && prev.value != null && value !== prev.value) || (mr && prev.manualReply && mr !== prev.manualReply)));
      state.calibration[card.id] = { value: value, label: label, manualReply: mr, at: now, theme: theme, previous: prev ? { value: prev.value, label: prev.label, manualReply: prev.manualReply } : null };
      return { changed: changed, previous: prev, calibration: true };
    }
    if (!isScored(card)) return { changed: false };
    var q = qState(state, card.id, card);
    q.timesSeen += 1;
    q.lastAt = now;
    if (ev.skip) {
      q.lastResult = 'skip';
      state.questions[card.id] = q;
      return { changed: false };
    }
    if (ev.correct) {
      q.correct += 1;
      q.rating = clamp(q.rating - 1, MIN_D, MAX_D);
      q.lastResult = 'correct';
      if (q.correct >= RETIRE_AT) q.retired = true;
      var p = progOf(state, baseDiff(card));
      p.correct += 1;
      if (p.uniqueCorrect.indexOf(card.id) < 0) p.uniqueCorrect.push(card.id);
    } else {
      q.fails += 1;
      q.rating = clamp(q.rating + 1, MIN_D, MAX_D);
      q.lastResult = 'wrong';
      progOf(state, baseDiff(card)).wrong += 1;
    }
    state.questions[card.id] = q;
    var promoted = maybePromote(state);
    return { changed: false, promoted: promoted, retired: !!q.retired };
  }

  function present(card, qs) {
    var view = {
      prompt: card.prompt,
      options: (card.options || []).slice(),
      hint: null,
      hidden: [],
      reworded: false
    };
    if (!isScored(card)) return view;
    qs = qs || { fails: 0 };
    var fails = qs.fails || 0;
    var hint = card.hint || null;
    if (!hint && card.cambio && card.cambio.kind === 'abbreviation_pick' && card.cambio.category) {
      hint = 'Kategori: ' + card.cambio.category;
    }
    if (fails >= 1) view.hint = hint;
    if (fails >= 2) {
      var ci = correctIndex(card);
      if (ci >= 0 && view.options.length > 2) {
        for (var i = 0; i < view.options.length; i++) {
          if (i !== ci) { view.hidden.push(i); break; }
        }
      }
    }
    if (fails >= 3) {
      var rw = card.reword || card.promptAlt;
      if (rw) { view.prompt = rw; view.reworded = true; }
      if (!view.hint) view.hint = hint;
    }
    return view;
  }

  function sessionPool(cards, state) {
    cards = cards || [];
    state = load(state);
    var level = clamp(state.player.level || 1, MIN_D, MAX_D);
    var floor = clamp(Math.min(state.player.floor || 1, level), MIN_D, level);
    var judgment = [], calib = [], scored = [];
    cards.forEach(function (c) {
      if (isCalibration(c)) calib.push(c);
      else if (isScored(c)) { if (!isRetired(state, c)) scored.push(c); }
      else judgment.push(c);
    });
    var wanted = [];
    function add(list) {
      (list || []).forEach(function (c) { if (wanted.indexOf(c) < 0) wanted.push(c); });
    }
    add(scored.filter(function (c) {
      var q = state.questions[c.id];
      return q && q.fails > 0 && !q.retired;
    }));
    add(scored.filter(function (c) {
      var q = state.questions[c.id];
      return baseDiff(c) === level && (!q || !q.timesSeen);
    }));
    add(scored.filter(function (c) {
      var d = baseDiff(c), q = state.questions[c.id];
      return d >= floor && d <= level && (!q || !q.timesSeen);
    }));
    var p = progOf(state, level);
    if ((p.correct || 0) >= PREVIEW_AT && level < MAX_D) {
      add(scored.filter(function (c) {
        var q = state.questions[c.id];
        return baseDiff(c) === level + 1 && (!q || !q.timesSeen);
      }));
    }
    var rest = scored.filter(function (c) { return wanted.indexOf(c) < 0; }).sort(function (a, b) {
      var qa = qState(state, a.id, a), qb = qState(state, b.id, b);
      return (qa.correct - qb.correct) || (Math.abs(qa.rating - level) - Math.abs(qb.rating - level));
    });
    add(rest.slice(0, 8));
    return judgment.concat(calib, wanted);
  }

  function hud(state) {
    state = load(state);
    var L = state.player.level, p = progOf(state, L);
    var total = (p.correct || 0) + (p.wrong || 0);
    var acc = total ? Math.round(p.correct / total * 100) : 0;
    return {
      level: L,
      floor: state.player.floor,
      correct: p.correct || 0,
      wrong: p.wrong || 0,
      unique: (p.uniqueCorrect || []).length,
      accuracy: acc,
      needCorrect: PROMOTE_CORRECT,
      needUnique: PROMOTE_UNIQUE,
      needAccuracy: Math.round(PROMOTE_ACCURACY * 100),
      progressText: (p.correct || 0) + '/' + PROMOTE_CORRECT + ' rätt · ' + (p.uniqueCorrect || []).length + '/' + PROMOTE_UNIQUE + ' unika · ' + acc + '% (≥' + Math.round(PROMOTE_ACCURACY * 100) + '%)'
    };
  }

  function calibrationSummary(state, records) {
    var out = [], seen = {}, list = records || [];
    for (var i = list.length - 1; i >= 0; i--) {
      var r = list[i]; if (!r || seen[r.card]) continue; seen[r.card] = 1; out.unshift(r);
    }
    if (!out.length && state && state.calibration) {
      Object.keys(state.calibration).forEach(function (id) {
        var c = state.calibration[id];
        out.push({ card: id, theme: null, selected_label: c.label, selected_value: c.value, manualReply: c.manualReply, at: c.at, previous: c.previous, changed: !!c.previous });
      });
    }
    return out;
  }

  return {
    SCHEMA: SCHEMA, RETIRE_AT: RETIRE_AT, PROMOTE_CORRECT: PROMOTE_CORRECT,
    PROMOTE_ACCURACY: PROMOTE_ACCURACY, PROMOTE_UNIQUE: PROMOTE_UNIQUE, PREVIEW_AT: PREVIEW_AT,
    empty: empty, load: load, exportState: exportState, clone: clone,
    isScored: isScored, isCalibration: isCalibration, isRetired: isRetired,
    qState: qState, baseDiff: baseDiff, correctIndex: correctIndex,
    evaluate: evaluate, record: record, present: present,
    sessionPool: sessionPool, hud: hud, calibrationSummary: calibrationSummary,
    textMatches: textMatches, maybePromote: maybePromote
  };
});
