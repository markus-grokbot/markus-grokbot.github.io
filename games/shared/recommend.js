/* "Which game now?" recommender (UMD). Rule-based: task type x time available x current state (recent focus, fatigue,
   minutes already played). State comes from recent logs via Qualities.compute (localStorage in the browser, logs/human in Node).
   Doc: games/shared/RECOMMENDER.md. Suggestions only; estimates are rough until enough rounds exist. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(root.Qualities || require('./qualities.js')); else root.Recommend = f(root.Qualities); })(typeof self !== 'undefined' ? self : this, function (Q) {
  var GAMES = {
    runner: { name: '🐾 Lynx Dash', path: 'runner/', minutes: 5, yields: 'tone picks + focus check' },
    tetris: { name: '🧱 Tetris', path: 'tetris/', minutes: 4, yields: 'warm-up, no data needed' },
    combo: { name: '🧱➜⚖️ Combo', path: 'combo/', minutes: 6, yields: 'pairwise picks after a Tetris warm-up' },
    parcels: { name: '📦 Parcel Panic', path: 'parcels/', minutes: 4, yields: 'mail-triage sorts that grade the local models' },
    pairwise: { name: '🗣️ Tone Pit', path: 'pairwise/?set=tone-001', minutes: 4, yields: 'tone picks, fastest' }
  };
  var TASKS = {
    'warm-up': 'Warm-up before review / mail triage', 'focus-check': 'Check my focus now', 'tone-data': 'Tone data needed',
    'creative-input': 'Creative input (design content)', 'break': 'Fun break between useful input', 'triage': 'Mail triage warm-up / triage data'
  };
  // state from logs: {focus, focusConf, trend, minutesLastHour, rounds}
  function stateFromLogs(logs, now) {
    now = now || Date.now(); var recent = logs.filter(function (l) { return l && l.run && l.run.type === 'human' && now - Date.parse(l.run.startedAt) < 6 * 3600e3; });
    var lastHour = recent.filter(function (l) { return now - Date.parse(l.run.startedAt) < 3600e3; }), mins = lastHour.reduce(function (a, l) { return a + ((l.summary && l.summary.totalDurationMs) || 0); }, 0) / 60000;
    var f = [], e = [], c = 0; recent.forEach(function (l) { var b = l.qualities || Q.compute(l); if (b.items.focus) { f.push(b.items.focus.score); c = Math.max(c, b.items.focus.confidence); } if (b.items.endurance) e.push(b.items.endurance.score); });
    var avg = function (a) { return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : null; };
    return { focus: avg(f), focusConf: c, endurance: avg(e), minutesLastHour: Math.round(mins), rounds: recent.length };
  }
  function recommend(task, minutes, st) {
    st = st || {}; minutes = minutes || 10; var tired = (st.endurance != null && st.endurance < 40) || st.minutesLastHour >= 30, low = st.focus != null && st.focus < 60, out = [];
    function add(g, score, why) { var G = GAMES[g]; if (G.minutes > minutes + 1) { score -= 30; why += ' (longer than your time)'; } out.push({ game: g, name: G.name, path: G.path, minutes: G.minutes, score: score, why: why }); }
    if (task === 'focus-check') { add('runner', 90, 'Lynx Dash is the focus check: obstacle 3 > crow 2 > coin 1 penalties per opportunity.'); add('tetris', 50, 'Tetris also estimates focus (misdrops, hesitation), less directly.'); if (tired) out[0].why += ' You played ' + st.minutesLastHour + ' min this hour, so the score will partly reflect tiredness.'; }
    else if (task === 'warm-up') { add('tetris', 85, 'Deterministic, low stakes; a few minutes of Tetris gets hands and eyes going.'); add('parcels', 72, 'Before mail triage specifically, Parcel Panic is the closer warm-up.'); add('runner', 70, 'Short Lynx Dash round warms reactions and gives a focus reading before you start.'); if (low) out[2].score += 10; }
    else if (task === 'triage') { add('parcels', tired ? 70 : 90, 'Parcel Panic is mail triage as a game: every sort grades the Ollama models, and the speed-up waves warm you up for the real inbox.'); add('tetris', 45, 'Shorter warm-up with no data.'); if (low) out[0].why += ' Recent focus is lower; slow or changed sorts count less when grading the models.'; }
    else if (task === 'tone-data') { add('runner', tired ? 60 : 85, 'Each 30 s run earns one tone question; fun-to-data ratio is best here.'); add('pairwise', tired || minutes < 5 ? 90 : 70, 'Tone Pit asks tone questions back to back: most picks per minute.'); }
    else if (task === 'creative-input') { add('pairwise', 70, 'No creative game exists yet; tone picks are the closest design input. See games/ideas/ for planned creative games.'); add('runner', 55, 'Tone picks between runs.'); }
    else { add('tetris', 80, 'Pure fun, no questions.'); add('runner', 75, 'Fun with a little tone data on the side.'); add('combo', 55, 'Tetris then a short reading round.'); }
    if (tired && task !== 'focus-check') out.forEach(function (o) { if (o.minutes > 4) o.score -= 10; });
    if (low && task === 'tone-data') out.push({ game: 'break', name: '☕ Short break', path: null, minutes: 5, score: 60, why: 'Recent focus readings are lower than usual; picks made when tired may be noisier.' });
    return out.sort(function (a, b) { return b.score - a.score; });
  }
  return { GAMES: GAMES, TASKS: TASKS, stateFromLogs: stateFromLogs, recommend: recommend };
});
