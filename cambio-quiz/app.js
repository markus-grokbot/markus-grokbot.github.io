/* Cambio interview quiz. Progress stays in localStorage. */
(function () {
  "use strict";

  const STORE_KEY = "cambioQuiz.v1";
  const SPEED_COUNT = 12;
  const SPEED_SECS = 12;
  const ITEMS = window.QUIZ_ITEMS || [];

  const LEVELS = [
    { n: 1, type: "vocab", sv: "Ordförråd", en: "Vocabulary", blurb_sv: "Begrepp sv/en, från demot och skimpacken.", blurb_en: "Terms in sv/en, from the demo and the skim pack." },
    { n: 2, type: "demo", sv: "Demo-fakta", en: "Demo facts", blurb_sv: "Pipeline, fall och eval-siffror — bara verifierade tal.", blurb_en: "Pipeline, cases and eval figures — verified numbers only." },
    { n: 3, type: "best", sv: "Hur jobbar du?", en: "How do you work?", blurb_sv: "Välj bästa svarskorten bland tre, med en rad varför.", blurb_en: "Pick the best answer cue among three, with a one-line why." },
    { n: 4, type: "curve", sv: "Curveballs", en: "Curveballs", blurb_sv: "Välj den lugnaste och ärligaste inramningen.", blurb_en: "Choose the calmest, most honest framing." },
    { n: 5, type: "speed", sv: "Speed round", en: "Speed round", blurb_sv: "Blandat på tid, 12 sekunder per fråga.", blurb_en: "Timed mix, 12 seconds per question." },
    { n: 6, type: "story", sv: "Berättelser", en: "Stories", blurb_sv: "STAR-light: välj rätt nästa taktslag i berättelsen.", blurb_en: "STAR-light: pick the right next beat of the story." },
    { n: 7, type: "boss", sv: "Intervjun", en: "The interview", blurb_sv: "Boss: tio frågor på svenska, tre liv, stress- och trygghetsmätare.", blurb_en: "Boss: ten questions in Swedish, three lives, stress and confidence meters.", boss: true }
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
      allDone: "Alla övningslevels är öppna. Intervjun väntar som boss, och svagaste kort fångar det som sitter sämst.",
      xp: "XP",
      streak: "Streak",
      best: "Bäst",
      items: (n) => n + " frågor",
      speedItems: SPEED_COUNT + " av 14, på tid",
      due: (n) => n + " kort redo",
      lives: "Liv",
      stress: "Stress",
      conf: "Trygghet",
      sayAloud: "Vad skulle du faktiskt säga högt?",
      orderHint: "Tryck för att lägga i ordning. Tryck igen för att ta bort. Du kan också dra.",
      orderCheck: "Kontrollera ordningen",
      orderNeed: "Lägg alla steg innan du kontrollerar.",
      pool: "Steg att placera",
      built: "Din ordning",
      bossResult: "Intervjun — resultat",
      bossEarly: "Avbruten när liven tog slut.",
      bossHeld: "Intervjun höll hela vägen.",
      topics: "Svagaste ämnen att köra igen",
      replayTopic: "Öva"
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
      allDone: "All practice levels are open. The interview waits as the boss, and weakest cards catch whatever still sticks least.",
      xp: "XP",
      streak: "Streak",
      best: "Best",
      items: (n) => n + " items",
      speedItems: SPEED_COUNT + " of 14, timed",
      due: (n) => n + " cards due",
      lives: "Lives",
      stress: "Stress",
      conf: "Confidence",
      sayAloud: "Which answer would you actually say aloud?",
      orderHint: "Tap to place in order. Tap again to remove. You can also drag.",
      orderCheck: "Check the order",
      orderNeed: "Place every step before you check.",
      pool: "Steps to place",
      built: "Your order",
      bossResult: "The interview — results",
      bossEarly: "Stopped when the lives ran out.",
      bossHeld: "You held the interview all the way through.",
      topics: "Weakest topics to replay",
      replayTopic: "Practice"
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
      if ((s.levels[5] && s.levels[5].completed) || (s.unlocked.indexOf(5) !== -1 && s.levels[4] && s.levels[4].completed)) {
        if (s.unlocked.indexOf(6) === -1 && s.levels[5] && s.levels[5].completed) {
          s.unlocked.push(6);
          s.unlocked.sort(function (a, b) { return a - b; });
        }
      }
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
    let queue;
    if (n === 7) {
      queue = itemsForLevel(n).slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); }).map(function (it) { return it.id; });
    } else if (n === 5) {
      queue = shuffle(itemsForLevel(n).map(function (it) { return it.id; })).slice(0, SPEED_COUNT);
    } else {
      queue = shuffle(itemsForLevel(n).map(function (it) { return it.id; }));
    }
    const meta = levelMeta(n);
    const titlePrefix = n === 7 ? "Boss · " : "Level " + n + " · ";
    startRun("level-" + n, queue, titlePrefix + meta.sv, titlePrefix + meta.en);
    run.level = n;
    if (n === 7) {
      run.boss = true;
      run.lives = 3;
      run.stress = 25;
      run.confidence = 40;
    }
    render();
  }

  const TOPIC_LEVEL = {
    vocab: 1, demo: 2, workstyle: 3, tools: 3, approval: 3, pii: 2,
    eval: 2, experience: 3, curve: 4, stories: 6, pipeline: 2, intervju: 7
  };
  const TOPIC_LABEL = {
    vocab: { sv: "Ordförråd", en: "Vocabulary" },
    demo: { sv: "Demo-fakta", en: "Demo facts" },
    workstyle: { sv: "Hur jobbar du?", en: "How you work" },
    tools: { sv: "Verktyg och arbetssätt", en: "Tools and workflow" },
    approval: { sv: "Godkännandegrind", en: "Approval gate" },
    pii: { sv: "Personuppgifter", en: "Personal data" },
    eval: { sv: "Eval och mätning", en: "Eval and measurement" },
    experience: { sv: "Erfarenhet", en: "Experience" },
    curve: { sv: "Curveballs", en: "Curveballs" },
    stories: { sv: "Berättelser", en: "Stories" },
    pipeline: { sv: "Pipelinen", en: "The pipeline" },
    intervju: { sv: "Intervjusvar", en: "Interview answers" }
  };

  function itemTopic(it) {
    if (!it) return "demo";
    if (it.topic) return it.topic;
    if (it.type === "vocab") return "vocab";
    if (it.type === "story") return "stories";
    if (it.type === "curve") return "curve";
    if (it.type === "order") return "pipeline";
    if (it.id && it.id.indexOf("h-") === 0) return "workstyle";
    if (it.id && it.id.indexOf("d-") === 0) return "demo";
    if (it.id && it.id.indexOf("s-") === 0) return "demo";
    if (it.id && it.id.indexOf("c-") === 0) return "curve";
    if (it.id && it.id.indexOf("v-") === 0) return "vocab";
    return "demo";
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
    run.choices = item.choices ? preparedChoices(item) : [];
    run.orderBuilt = [];
    run.orderPool = (item.type === "order" && item.steps) ? shuffle(item.steps.slice()) : [];
    stopTimer();
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

  function orderIsCorrect(item) {
    const built = (run.orderBuilt || []).map(function (st) { return st.id; });
    const want = item.correctOrder || [];
    if (built.length !== want.length) return false;
    for (let i = 0; i < want.length; i++) if (built[i] !== want[i]) return false;
    return true;
  }

  function reveal(choice, timedOut) {
    if (!run || run.revealed) return;
    stopTimer();
    const item = currentItem();
    let ok = false;
    if (item.type === "order") {
      ok = !timedOut && orderIsCorrect(item);
    } else if (!timedOut && choice && choice.ok) {
      ok = true;
    }
    run.revealed = true;
    run.picked = choice;
    run.timeout = !!timedOut;
    run.answers.push({ id: item.id, ok: ok, topic: itemTopic(item) });
    markAnswer(item.id, ok);
    let gained = 0;
    if (ok) {
      run.correct += 1;
      run.streak += 1;
      if (run.streak > (store.bestStreak || 0)) store.bestStreak = run.streak;
      gained = 10 + Math.min(run.streak, 5);
      if (run.kind === "level-5" && run.remain) gained += Math.floor(run.remain / 2);
      if (run.boss) gained += 5;
      run.score += gained;
      addXp(gained);
      if (run.boss) {
        run.confidence = Math.min(100, (run.confidence || 0) + 12);
        run.stress = Math.max(0, (run.stress || 0) - 12);
      }
    } else {
      run.streak = 0;
      if (run.boss) {
        run.lives = Math.max(0, (run.lives || 0) - 1);
        run.confidence = Math.max(0, (run.confidence || 0) - 8);
        run.stress = Math.min(100, (run.stress || 0) + (timedOut ? 15 : 22));
        if (run.lives <= 0) run.endedEarly = true;
      }
    }
    run.lastGain = gained;
    save();
    render();
    $("live").textContent = ok ? t().correct : (timedOut ? t().timeout : t().wrong);
  }

  function nextQ() {
    if (!run) return;
    if (run.endedEarly) {
      finishRun();
      return;
    }
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
      if (n < 6) unlock(n + 1);
      var allPractice = true;
      for (var i = 1; i <= 6; i++) {
        if (!(store.levels[i] && store.levels[i].completed)) allPractice = false;
      }
      if (allPractice) unlock(7);
      if (n === 7) unlock(7);
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
      const cls = "level-card" + (lv.boss ? " boss" : "") + (open ? (rec && rec.completed ? " done" : "") : " locked");
      let meta = open ? t().items(count) : (lv.boss ? (store.lang === "en" ? "Unlock by finishing levels 1–6." : "Lås upp genom att klara levels 1–6.") : t().locked);
      if (lv.n === 5 && open) meta = t().speedItems;
      if (lv.n === 7 && open) meta = (store.lang === "en" ? "10-question interview" : "10-frågorsintervju");
      if (rec && rec.completed) meta += "<br>" + t().best + " " + rec.bestPct + "%";
      html += '<button type="button" class="' + cls + '" data-level="' + lv.n + '"' + (open ? "" : " disabled") + ">" +
        '<div class="badge">' + (open ? (lv.boss ? "★" : lv.n) : "🔒") + "</div>" +
        '<div><p class="lname">' + (lv.boss ? "Boss" : "Level " + lv.n) + " · " + escapeHtml(name) + "</p>" +
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

  function meterRow() {
    if (!run || !run.boss) return "";
    var hearts = "";
    for (var i = 0; i < 3; i++) hearts += (i < (run.lives || 0)) ? "♥ " : "♡ ";
    var conf = Math.max(0, Math.min(100, run.confidence || 0));
    var str = Math.max(0, Math.min(100, run.stress || 0));
    return '<div class="bossbar">' +
      '<div class="pill gold">' + t().lives + " " + hearts.trim() + "</div>" +
      '<div class="meters">' +
      '<div class="meter"><span>' + t().conf + " " + conf + '</span><div class="metertrack conf"><i style="width:' + conf + '%"></i></div></div>' +
      '<div class="meter"><span>' + t().stress + " " + str + '</span><div class="metertrack stress"><i style="width:' + str + '%"></i></div></div>' +
      "</div></div>";
  }

  function renderBeats(item, lang) {
    if (!item.beats || !item.beats.length) return "";
    var html = '<div class="storyhead">' + escapeHtml(txt(item.story || {})) + '</div><div class="beats">';
    item.beats.forEach(function (b) {
      html += '<div class="beat"><span class="beatlab">' + escapeHtml((b.lab && (b.lab[lang] || b.lab.sv)) || "") +
        "</span> " + escapeHtml(b[lang] || b.sv || "") + "</div>";
    });
    html += "</div>";
    return html;
  }

  function renderOrder(item, lang) {
    var html = '<p class="lblurb">' + t().orderHint + "</p>";
    html += '<p class="beatlab">' + t().built + '</p><div class="orderrow" id="orderBuilt">';
    (run.orderBuilt || []).forEach(function (st, idx) {
      var cls = "ochip";
      if (run.revealed) cls += st.id === (item.correctOrder || [])[idx] ? " ok" : " bad";
      html += '<button type="button" class="' + cls + '" data-where="built" data-idx="' + idx + '"' +
        (run.revealed ? " disabled" : "") + " draggable=\"" + (run.revealed ? "false" : "true") + "\">" +
        (idx + 1) + ". " + escapeHtml(st[lang] || st.sv) + "</button>";
    });
    html += "</div>";
    html += '<p class="beatlab">' + t().pool + '</p><div class="orderrow" id="orderPool">';
    (run.orderPool || []).forEach(function (st, idx) {
      html += '<button type="button" class="ochip" data-where="pool" data-idx="' + idx + '"' +
        (run.revealed ? " disabled" : "") + ">" + escapeHtml(st[lang] || st.sv) + "</button>";
    });
    html += "</div>";
    if (!run.revealed) {
      html += '<div class="actions"><button type="button" class="btn primary" id="orderCheck">' + t().orderCheck + "</button></div>";
    }
    return html;
  }

  function bindOrder(item) {
    $("main").querySelectorAll(".ochip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (run.revealed) return;
        var where = btn.getAttribute("data-where");
        var idx = Number(btn.getAttribute("data-idx"));
        if (where === "pool") {
          run.orderBuilt.push(run.orderPool.splice(idx, 1)[0]);
        } else {
          run.orderPool.push(run.orderBuilt.splice(idx, 1)[0]);
        }
        render();
      });
      btn.addEventListener("dragstart", function (ev) {
        if (run.revealed || btn.getAttribute("data-where") !== "built") return;
        ev.dataTransfer.setData("text/plain", btn.getAttribute("data-idx"));
        ev.dataTransfer.effectAllowed = "move";
      });
    });
    var built = $("orderBuilt");
    if (built) {
      built.addEventListener("dragover", function (ev) { ev.preventDefault(); });
      built.addEventListener("drop", function (ev) {
        ev.preventDefault();
        if (run.revealed) return;
        var from = Number(ev.dataTransfer.getData("text/plain"));
        var chips = built.querySelectorAll(".ochip");
        var to = chips.length;
        for (var i = 0; i < chips.length; i++) {
          var r = chips[i].getBoundingClientRect();
          if (ev.clientX < r.left + r.width / 2 && ev.clientY < r.bottom) { to = i; break; }
        }
        if (isNaN(from) || from === to) return;
        var moved = run.orderBuilt.splice(from, 1)[0];
        if (to > from) to -= 1;
        run.orderBuilt.splice(Math.min(to, run.orderBuilt.length), 0, moved);
        render();
      });
    }
    var check = $("orderCheck");
    if (check) check.addEventListener("click", function () {
      if ((run.orderBuilt || []).length !== (item.steps || []).length) {
        $("live").textContent = t().orderNeed;
        return;
      }
      reveal(null, false);
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
    html += meterRow();
    if (run.kind === "level-5") {
      const pct = Math.max(0, Math.min(100, (run.remain / SPEED_SECS) * 100));
      html += '<div class="timer' + (run.remain < 4 && !run.revealed ? " urgent" : "") + '" id="timer"><span id="timerfill" style="transform:scaleX(' + (pct / 100) + ')"></span></div>';
    }
    html += '<div class="card">';
    html += renderBeats(item, lang);
    if (item.term) html += '<div class="term">' + escapeHtml(item.term) + "</div>";
    if (item.say || item.type === "say") html += '<div class="term">' + t().sayAloud + "</div>";
    html += '<p class="qtext">' + escapeHtml(item.q[lang] || item.q.sv) + "</p>";
    if (item.type === "order") {
      html += renderOrder(item, lang);
    } else {
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
    }
    if (run.revealed) {
      var ok = item.type === "order" ? orderIsCorrect(item) && !run.timeout : !!(run.picked && run.picked.ok);
      const lab = run.timeout ? t().timeout : (ok ? t().correct : t().wrong);
      html += '<div class="why ' + (ok ? "ok" : "bad") + '"><p class="lab">' + escapeHtml(lab) + "</p>";
      html += "<p>" + escapeHtml(item.why[lang] || item.why.sv) + "</p></div>";
      var last = run.endedEarly || run.index + 1 >= run.queue.length;
      html += '<div class="actions"><button type="button" class="btn primary" id="nextBtn">' +
        (last ? t().done : t().next) + "</button></div>";
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
    if (item.type === "order") bindOrder(item);
    const next = $("nextBtn");
    if (next) next.addEventListener("click", nextQ);
  }

  function renderResult() {
    const total = run.queue.length;
    const pct = total ? Math.round((run.correct / total) * 100) : 0;
    const perfect = run.correct === total && total;
    let html = '<div class="card">';
    var kicker = t().result;
    if (run.kind === "weak") kicker = t().weakDone;
    if (run.boss) kicker = t().bossResult;
    html += '<p class="kicker">' + kicker + "</p>";
    var denom = run.boss ? run.queue.length : total;
    var shownPct = denom ? Math.round((run.correct / denom) * 100) : 0;
    html += '<p class="result-score"><span>' + run.correct + "</span> / " + denom + " · " + shownPct + "%</p>";
    if (run.boss && run.endedEarly) html += "<p>" + t().bossEarly + "</p>";
    if (run.boss && !run.endedEarly) html += "<p>" + t().bossHeld + "</p>";
    if (perfect) html += "<p class=\"term\">" + t().perfect + "</p>";
    html += "<p>" + t().xp + " +" + run.score + (run.bonus ? " (inkl. bonus " + run.bonus + ")" : "") + "</p>";
    if (run.boss) html += meterRow();
    if (run.kind.indexOf("level-") === 0 && run.level < 7 && isUnlocked(run.level + 1) && run.level !== 6) {
      const nxt = levelMeta(run.level + 1);
      html += "<p>" + t().unlocked(store.lang === "en" ? nxt.en : nxt.sv) + "</p>";
    }
    if (run.level === 6 && isUnlocked(7)) {
      html += "<p>" + t().unlocked(store.lang === "en" ? "the interview" : "Intervjun") + "</p>";
    } else if (isUnlocked(7) && run.level !== 7) {
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
    var topicHits = {};
    run.answers.forEach(function (a) {
      var it = byId(a.id);
      var top = a.topic || itemTopic(it);
      if (!topicHits[top]) topicHits[top] = { ok: 0, n: 0 };
      topicHits[top].n += 1;
      if (a.ok) topicHits[top].ok += 1;
    });
    var weakTopics = Object.keys(topicHits).map(function (k) {
      return { k: k, ok: topicHits[k].ok, n: topicHits[k].n, pct: topicHits[k].ok / topicHits[k].n };
    }).filter(function (x) { return x.pct < 1; }).sort(function (a, b) { return a.pct - b.pct; });
    if (weakTopics.length) {
      html += "<p class=\"sub\" style=\"margin-top:0.7rem\">" + t().topics + ":</p><div class=\"actions\" id=\"topicBtns\">";
      weakTopics.forEach(function (x) {
        var lab = TOPIC_LABEL[x.k] ? (TOPIC_LABEL[x.k][store.lang] || TOPIC_LABEL[x.k].sv) : x.k;
        var dest = TOPIC_LEVEL[x.k] || 1;
        html += '<button type="button" class="btn" data-replay="' + dest + '">' + t().replayTopic + " · " +
          escapeHtml(lab) + " (" + x.ok + "/" + x.n + ")</button>";
      });
      html += "</div>";
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
    $("main").querySelectorAll("[data-replay]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = Number(btn.getAttribute("data-replay"));
        if (isUnlocked(n)) startLevel(n);
        else { view = "hub"; run = null; render(); }
      });
    });
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
    var item = currentItem();
    if (item && item.type === "order") {
      if (ev.key === "Enter") {
        ev.preventDefault();
        if ((run.orderBuilt || []).length === (item.steps || []).length) reveal(null, false);
      }
      return;
    }
    const n = Number(ev.key);
    if (n >= 1 && n <= (run.choices || []).length) {
      ev.preventDefault();
      reveal(run.choices[n - 1], false);
    }
  });

  render();
})();
