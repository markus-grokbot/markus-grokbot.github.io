/* Cambio interview quiz. Progress stays in localStorage. */
(function () {
  "use strict";

  const STORE_KEY = "cambioQuiz.v1";
  const SPEED_COUNT = 12;
  const SPEED_SECS = 12;
  const ITEMS = window.QUIZ_ITEMS || [];

  const LEVELS = [
    { n: 1, type: "vocab", sv: "Ordförråd", en: "Vocabulary", blurb_sv: "Begrepp sv/en, som awaiting_approval och faithful.", blurb_en: "Terms in sv/en, like awaiting_approval and faithful." },
    { n: 2, type: "demo", sv: "Demo-fakta", en: "Demo facts", blurb_sv: "Pipeline, fall och eval-siffror — bara verifierade tal.", blurb_en: "Pipeline, cases and eval figures — verified numbers only." },
    { n: 3, type: "best", sv: "Hur jobbar du?", en: "How do you work?", blurb_sv: "Välj bästa svarskorten bland tre, med en rad varför.", blurb_en: "Pick the best answer cue among three, with a one-line why." },
    { n: 4, type: "curve", sv: "Curveballs", en: "Curveballs", blurb_sv: "Välj den lugnaste och ärligaste inramningen.", blurb_en: "Choose the calmest, most honest framing." },
    { n: 5, type: "speed", sv: "Speed round", en: "Speed round", blurb_sv: "Blandat på tid, 12 sekunder per fråga.", blurb_en: "Timed mix, 12 seconds per question." }
  ];

  const copy = {
    sv: {
      subtitle: "Övning inför intervjun 11 nov 2026, 15:00 Europe/Stockholm",
      start: "Starta",
      replay: "Spela igen",
      locked: "Lås upp genom att köra levelen före.",
      weak: "Svagaste kort",
      weakEmpty: "Inga missade kort ännu. Spela en level först.",
      weakBlurb: "Repeterar missade frågor, med lätt spaced repetition.",
      reset: "Nollställ framsteg",
      resetQ: "Nollställa poäng, XP och svagaste kort i den här webbläsaren?",
      back: "Till översikten",
      next: "Nästa",
      done: "Klar",
      lang: "EN",
      langHint: "Visa på engelska",
      qOf: (i, n) => "Fråga " + i + " / " + n,
      correct: "Rätt",
      wrong: "Nästan",
      timeout: "Tiden tog slut",
      why: "Därför",
      result: "Level klar",
      weakDone: "Svagaste kort — runda klar",
      perfect: "Perfekt runda",
      unlocked: (name) => "Du låste upp " + name + ".",
      allDone: "Alla fem levels är öppna. Kör svagaste kort på det som sitter sämst.",
      xp: "XP",
      streak: "Streak",
      best: "Bäst",
      items: (n) => n + " frågor",
      speedItems: SPEED_COUNT + " av 14, på tid",
      due: (n) => n + " kort redo"
    },
    en: {
      subtitle: "Practice for the interview 11 Nov 2026, 15:00 Europe/Stockholm",
      start: "Start",
      replay: "Play again",
      locked: "Unlock by finishing the previous level.",
      weak: "Weakest cards",
      weakEmpty: "No missed cards yet. Play a level first.",
      weakBlurb: "Replays missed items, with light spaced repetition.",
      reset: "Reset progress",
      resetQ: "Reset score, XP and weakest cards in this browser?",
      back: "Back to overview",
      next: "Next",
      done: "Done",
      lang: "SV",
      langHint: "Show in Swedish",
      qOf: (i, n) => "Question " + i + " / " + n,
      correct: "Correct",
      wrong: "Close",
      timeout: "Time is up",
      why: "Why",
      result: "Level complete",
      weakDone: "Weakest cards — round done",
      perfect: "Perfect round",
      unlocked: (name) => "You unlocked " + name + ".",
      allDone: "All five levels are open. Use weakest cards on whatever still sticks least.",
      xp: "XP",
      streak: "Streak",
      best: "Best",
      items: (n) => n + " items",
      speedItems: SPEED_COUNT + " of 14, timed",
      due: (n) => n + " cards due"
    }
  };

  function defaultState() {
    return {
      xp: 0,
      bestStreak: 0,
      lang: "sv",
      unlocked: [1],
      levels: {},
      weak: {}
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      const s = Object.assign(defaultState(), JSON.parse(raw));
      if (!Array.isArray(s.unlocked) || !s.unlocked.length) s.unlocked = [1];
      if (!s.weak) s.weak = {};
      if (!s.levels) s.levels = {};
      return s;
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  let store = load();
  let view = "hub";
  let run = null;
  let timerId = null;
  let timerStarted = 0;

  const $ = (id) => document.getElementById(id);
  const t = () => copy[store.lang] || copy.sv;
  const txt = (obj) => (obj && (obj[store.lang] || obj.sv || obj.en)) || "";

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function itemsForLevel(n) {
    return ITEMS.filter((it) => it.level === n);
  }

  function byId(id) {
    return ITEMS.find((it) => it.id === id);
  }

  function levelMeta(n) {
    return LEVELS.find((l) => l.n === n);
  }

  function isUnlocked(n) {
    return store.unlocked.indexOf(n) !== -1;
  }

  function unlock(n) {
    if (store.unlocked.indexOf(n) === -1) {
      store.unlocked.push(n);
      store.unlocked.sort((a, b) => a - b);
    }
  }

  function weakDue(now) {
    now = now || Date.now();
    return Object.keys(store.weak).filter((id) => {
      const w = store.weak[id];
      if (!w || w.box >= 2) return false;
      return !w.due || w.due <= now;
    });
  }

  function weakAll() {
    return Object.keys(store.weak).filter((id) => store.weak[id] && store.weak[id].box < 2);
  }

  function markAnswer(id, ok) {
    if (ok) {
      const w = store.weak[id];
      if (w) {
        w.hitsAfterMiss = (w.hitsAfterMiss || 0) + 1;
        w.box = Math.min(2, (w.box || 0) + 1);
        if (w.box === 1) w.due = Date.now() + 20 * 60 * 1000;
        if (w.box >= 2) w.due = Date.now() + 18 * 60 * 60 * 1000;
      }
    } else {
      store.weak[id] = {
        misses: (store.weak[id] && store.weak[id].misses || 0) + 1,
        hitsAfterMiss: 0,
        box: 0,
        due: Date.now()
      };
    }
  }

  function addXp(n) {
    store.xp = (store.xp || 0) + Math.max(0, n);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startRun(kind, queue, titleSv, titleEn) {
    stopTimer();
    run = {
      kind: kind,
      queue: queue,
      index: 0,
      score: 0,
      correct: 0,
      answers: [],
      streak: 0,
      revealed: false,
      picked: null,
      timeout: false,
      remain: 0,
      title: { sv: titleSv, en: titleEn }
    };
    view = "play";
    showQuestion();
  }

  function startLevel(n) {
    let queue = itemsForLevel(n).map((it) => it.id);
    if (n === 5) queue = shuffle(queue).slice(0, SPEED_COUNT);
    else queue = shuffle(queue);
    const meta = levelMeta(n);
    startRun("level-" + n, queue, "Level " + n + " · " + meta.sv, "Level " + n + " · " + meta.en);
    run.level = n;
    render();
  }

  function startWeak() {
    let ids = weakDue();
    if (!ids.length) ids = weakAll();
    if (!ids.length) return;
    ids.sort((a, b) => {
      const wa = store.weak[a], wb = store.weak[b];
      return (wa.box - wb.box) || (wb.misses - wa.misses);
    });
    startRun("weak", ids, "Svagaste kort", "Weakest cards");
    render();
  }

  function currentItem() {
    if (!run) return null;
    return byId(run.queue[run.index]);
  }

  function preparedChoices(item) {
    return shuffle(item.choices.map((c, i) => Object.assign({ i: i }, c)));
  }

  function showQuestion() {
    const item = currentItem();
    if (!item) {
      finishRun();
      return;
    }
    run.revealed = false;
    run.picked = null;
    run.timeout = false;
    run.choices = preparedChoices(item);
    stopTimer();
    if (run.kind === "level-5" || item.type === "speed" && run.kind === "level-5") {
      /* speed timer only in speed round */
    }
    if (run.kind === "level-5") {
      timerStarted = Date.now();
      run.remain = SPEED_SECS;
      timerId = setInterval(tick, 200);
    }
    render();
  }

  function tick() {
    if (!run || run.revealed) return;
    const elapsed = (Date.now() - timerStarted) / 1000;
    run.remain = Math.max(0, SPEED_SECS - elapsed);
    const bar = document.getElementById("timerfill");
    const wrap = document.getElementById("timer");
    if (bar) {
      const pct = (run.remain / SPEED_SECS) * 100;
      bar.style.transform = "scaleX(" + (pct / 100) + ")";
    }
    if (wrap) wrap.classList.toggle("urgent", run.remain < 4);
    if (run.remain <= 0) {
      stopTimer();
      reveal(null, true);
    }
  }

  function reveal(choice, timedOut) {
    if (!run || run.revealed) return;
    stopTimer();
    const item = currentItem();
    const correct = run.choices.find((c) => c.ok);
    let ok = false;
    if (!timedOut && choice && choice.ok) ok = true;
    run.revealed = true;
    run.picked = choice;
    run.timeout = !!timedOut;
    run.answers.push({ id: item.id, ok: ok });
    markAnswer(item.id, ok);
    let gained = 0;
    if (ok) {
      run.correct += 1;
      run.streak += 1;
      if (run.streak > (store.bestStreak || 0)) store.bestStreak = run.streak;
      gained = 10 + Math.min(run.streak, 5);
      if (run.kind === "level-5" && run.remain) gained += Math.floor(run.remain / 2);
      run.score += gained;
      addXp(gained);
    } else {
      run.streak = 0;
    }
    run.lastGain = gained;
    save();
    render();
    $("live").textContent = ok ? t().correct : (timedOut ? t().timeout : t().wrong);
  }

  function nextQ() {
    if (!run) return;
    run.index += 1;
    if (run.index >= run.queue.length) finishRun();
    else showQuestion();
  }

  function finishRun() {
    stopTimer();
    if (!run) return;
    const total = run.queue.length;
    const pct = total ? Math.round((run.correct / total) * 100) : 0;
    let bonus = 0;
    if (run.kind.indexOf("level-") === 0) {
      bonus += 25;
      if (run.correct === total && total) bonus += 15;
      const n = run.level;
      const prev = store.levels[n] || { bestScore: 0, bestPct: 0, completed: 0 };
      prev.completed = (prev.completed || 0) + 1;
      prev.bestScore = Math.max(prev.bestScore || 0, run.score);
      prev.bestPct = Math.max(prev.bestPct || 0, pct);
      store.levels[n] = prev;
      if (n < 5) unlock(n + 1);
      else unlock(5);
    }
    if (bonus) {
      addXp(bonus);
      run.score += bonus;
      run.bonus = bonus;
    }
    save();
    view = "result";
    render();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderStats() {
    $("subtitle").textContent = t().subtitle;
    $("stats").innerHTML =
      '<span class="pill teal">' + escapeHtml(String(store.xp)) + " " + t().xp + "</span>" +
      '<span class="pill gold">' + t().streak + " " + escapeHtml(String(store.bestStreak || 0)) + "</span>" +
      '<button type="button" class="langbtn" id="langToggle" title="' + escapeHtml(t().langHint) + '">' + t().lang + "</button>";
    const intoNext = store.xp % 100;
    $("xpfill").style.width = intoNext + "%";
    $("xplabel").textContent = store.xp + " " + t().xp;
    $("streaklabel").textContent = t().streak + " " + (run && view === "play" ? run.streak : (store.bestStreak || 0));
    const btn = $("langToggle");
    if (btn) btn.addEventListener("click", function () {
      store.lang = store.lang === "sv" ? "en" : "sv";
      save();
      render();
    });
  }

  function renderHub() {
    const due = weakDue().length;
    const weakCount = weakAll().length;
    let html = '<div class="grid">';
    LEVELS.forEach(function (lv) {
      const open = isUnlocked(lv.n);
      const rec = store.levels[lv.n];
      const count = itemsForLevel(lv.n).length;
      const name = store.lang === "en" ? lv.en : lv.sv;
      const blurb = store.lang === "en" ? lv.blurb_en : lv.blurb_sv;
      const cls = "level-card" + (open ? (rec && rec.completed ? " done" : "") : " locked");
      let meta = open ? t().items(count) : t().locked;
      if (lv.n === 5 && open) meta = t().speedItems;
      if (rec && rec.completed) meta += "<br>" + t().best + " " + rec.bestPct + "%";
      html += '<button type="button" class="' + cls + '" data-level="' + lv.n + '"' + (open ? "" : " disabled") + ">" +
        '<div class="badge">' + (open ? lv.n : "🔒") + "</div>" +
        '<div><p class="lname">Level ' + lv.n + " · " + escapeHtml(name) + "</p>" +
        '<p class="lblurb">' + escapeHtml(blurb) + "</p></div>" +
        '<div class="lmeta">' + meta + "</div></button>";
    });
    html += "</div>";
    html += '<div class="card" style="margin-top:0.9rem">';
    html += "<p class=\"lname\">" + t().weak + "</p>";
    html += "<p class=\"lblurb\">" + t().weakBlurb + "</p>";
    if (!weakCount) html += "<p class=\"sub\">" + t().weakEmpty + "</p>";
    else html += "<p class=\"sub\">" + t().due(due || weakCount) + "</p>";
    html += '<div class="actions">';
    html += '<button type="button" class="btn primary" id="weakBtn"' + (weakCount ? "" : " disabled") + ">" + t().weak + "</button>";
    html += '<button type="button" class="btn ghost" id="resetBtn">' + t().reset + "</button>";
    html += "</div></div>";
    $("main").innerHTML = html;
    $("main").querySelectorAll("[data-level]").forEach(function (btn) {
      btn.addEventListener("click", function () { startLevel(Number(btn.getAttribute("data-level"))); });
    });
    const w = $("weakBtn");
    if (w) w.addEventListener("click", startWeak);
    const r = $("resetBtn");
    if (r) r.addEventListener("click", function () {
      if (confirm(t().resetQ)) {
        store = defaultState();
        store.lang = (document.documentElement.lang === "en") ? "en" : "sv";
        save();
        render();
      }
    });
  }

  function renderPlay() {
    const item = currentItem();
    if (!item) return;
    const i = run.index + 1;
    const n = run.queue.length;
    const lang = store.lang;
    let html = '<div class="playhead">';
    html += '<button type="button" class="btn ghost" id="backBtn">' + t().back + "</button>";
    html += '<span class="pill">' + escapeHtml(txt(run.title)) + "</span>";
    html += '<span class="pill teal">' + t().qOf(i, n) + "</span>";
    if (run.streak) html += '<span class="pill gold">' + t().streak + " " + run.streak + "</span>";
    html += "</div>";
    if (run.kind === "level-5") {
      const pct = Math.max(0, Math.min(100, (run.remain / SPEED_SECS) * 100));
      html += '<div class="timer' + (run.remain < 4 && !run.revealed ? " urgent" : "") + '" id="timer"><span id="timerfill" style="transform:scaleX(' + (pct / 100) + ')"></span></div>';
    }
    html += '<div class="card">';
    if (item.term) html += '<div class="term">' + escapeHtml(item.term) + "</div>";
    html += '<p class="qtext">' + escapeHtml(item.q[lang] || item.q.sv) + "</p>";
    html += '<div class="choices">';
    run.choices.forEach(function (c, idx) {
      let cls = "choice";
      if (run.revealed) {
        if (c.ok) cls += " ok";
        else if (run.picked && run.picked === c) cls += " bad";
      }
      html += '<button type="button" class="' + cls + '" data-idx="' + idx + '"' + (run.revealed ? " disabled" : "") + ">";
      html += '<span class="num">' + (idx + 1) + "</span><span>" + escapeHtml(c[lang] || c.sv) + "</span></button>";
    });
    html += "</div>";
    if (run.revealed) {
      const ok = !!(run.picked && run.picked.ok);
      const lab = run.timeout ? t().timeout : (ok ? t().correct : t().wrong);
      html += '<div class="why ' + (ok ? "ok" : "bad") + '"><p class="lab">' + escapeHtml(lab) + "</p>";
      html += "<p>" + escapeHtml(item.why[lang] || item.why.sv) + "</p></div>";
      html += '<div class="actions"><button type="button" class="btn primary" id="nextBtn">' +
        (run.index + 1 >= run.queue.length ? t().done : t().next) + "</button></div>";
    }
    html += "</div>";
    $("main").innerHTML = html;
    $("backBtn").addEventListener("click", function () {
      stopTimer();
      view = "hub";
      run = null;
      render();
    });
    $("main").querySelectorAll(".choice").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const c = run.choices[Number(btn.getAttribute("data-idx"))];
        reveal(c, false);
      });
    });
    const next = $("nextBtn");
    if (next) next.addEventListener("click", nextQ);
  }

  function renderResult() {
    const total = run.queue.length;
    const pct = total ? Math.round((run.correct / total) * 100) : 0;
    const perfect = run.correct === total && total;
    let html = '<div class="card">';
    html += '<p class="kicker">' + (run.kind === "weak" ? t().weakDone : t().result) + "</p>";
    html += '<p class="result-score"><span>' + run.correct + "</span> / " + total + " · " + pct + "%</p>";
    if (perfect) html += "<p class=\"term\">" + t().perfect + "</p>";
    html += "<p>" + t().xp + " +" + run.score + (run.bonus ? " (inkl. bonus " + run.bonus + ")" : "") + "</p>";
    if (run.kind.indexOf("level-") === 0 && run.level < 5 && isUnlocked(run.level + 1)) {
      const nxt = levelMeta(run.level + 1);
      html += "<p>" + t().unlocked(store.lang === "en" ? nxt.en : nxt.sv) + "</p>";
    } else if (isUnlocked(5) && store.unlocked.length >= 5) {
      html += "<p>" + t().allDone + "</p>";
    }
    const missed = run.answers.filter((a) => !a.ok).map((a) => byId(a.id)).filter(Boolean);
    if (missed.length) {
      html += "<p class=\"sub\" style=\"margin-top:0.7rem\">" + t().weak + ":</p><ul>";
      missed.forEach(function (it) {
        html += "<li>" + escapeHtml(it.q[store.lang] || it.q.sv) + "</li>";
      });
      html += "</ul>";
    }
    html += '<div class="actions">';
    html += '<button type="button" class="btn primary" id="hubBtn">' + t().back + "</button>";
    if (run.kind.indexOf("level-") === 0) {
      html += '<button type="button" class="btn" id="againBtn">' + t().replay + "</button>";
    }
    if (weakAll().length) html += '<button type="button" class="btn" id="weakAgain">' + t().weak + "</button>";
    html += "</div></div>";
    $("main").innerHTML = html;
    $("hubBtn").addEventListener("click", function () { view = "hub"; run = null; render(); });
    const again = $("againBtn");
    if (again) again.addEventListener("click", function () { startLevel(run.level); });
    const wa = $("weakAgain");
    if (wa) wa.addEventListener("click", startWeak);
  }

  function render() {
    document.documentElement.lang = store.lang === "en" ? "en" : "sv";
    renderStats();
    if (view === "hub") renderHub();
    else if (view === "play") renderPlay();
    else if (view === "result") renderResult();
  }

  document.addEventListener("keydown", function (ev) {
    if (view !== "play" || !run) return;
    if (run.revealed && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      nextQ();
      return;
    }
    if (run.revealed) return;
    const n = Number(ev.key);
    if (n >= 1 && n <= (run.choices || []).length) {
      ev.preventDefault();
      reveal(run.choices[n - 1], false);
    }
  });

  render();
})();
