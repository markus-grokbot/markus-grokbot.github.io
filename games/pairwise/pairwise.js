/* Pairwise Pit core (UMD, no DOM) + optional browser UI (PairwisePit.mount). Decisions are logged as
   ext.pairwise in gameplay-log 1.1.0. Choice values: 'A' | 'B' | 'tie' | 'neither' | 'not_enough_info'.
   'neither' = both versions rejected (tone sets: neither sounds like me). */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.PairwisePit = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var REASON_TAGS = ['clearer', 'more_specific', 'more_credible', 'shorter_better', 'better_hook', 'less_generic'];
  function winnerOf(pair, choice) { return choice === 'A' ? pair.a.id : choice === 'B' ? pair.b.id : null; }
  // Round state machine shared by the UI and the sim.
  function createRound(set, opts) {
    opts = opts || {}; var clock = opts.clock || Date.now, rng = opts.rng || Math.random;
    var order = set.pairs.map(function (p, i) { return { pair: p, swapped: opts.noSwap ? false : rng() < 0.5 }; });
    var idx = 0, shownAt = clock(), decisions = [], seq = 0;
    function current() { return idx < order.length ? order[idx] : null; }
    return {
      set: set, order: order,
      current: current, index: function () { return idx; }, total: order.length, done: function () { return idx >= order.length; },
      // choice in SET terms (A/B as defined in the set file, not screen position)
      decide: function (choice, strength, tags, source) {
        var c = current(); if (!c) return null; var t = clock();
        var d = { seq: seq++, pairId: c.pair.id, criterion: c.pair.criterion, itemA: c.pair.a.id, itemB: c.pair.b.id, choice: choice,
          winner: winnerOf(c.pair, choice), strength: (choice === 'A' || choice === 'B') ? (strength || 1) : null,
          decisionTimeMs: t - shownAt, reasonTags: tags || [], swapped: c.swapped, undone: false, source: source || 'human' };
        decisions.push(d); idx++; shownAt = clock(); return d;
      },
      undo: function () { for (var i = decisions.length - 1; i >= 0; i--) if (!decisions[i].undone) { decisions[i].undone = true; decisions[i].undoneAt = new Date(clock()).toISOString(); idx = Math.max(0, idx - 1); shownAt = clock(); return decisions[i]; } return null; },
      // call when the current pair actually appears on screen (e.g. runner shows it after a play segment)
      markShown: function () { shownAt = clock(); },
      decisions: function () { return decisions; },
      ext: function () {
        var live = decisions.filter(function (d) { return !d.undone; });
        return { setId: set.setId, setVersion: set.setVersion, demo: !!set.demo, pairsShown: order.length, decisionsMade: live.length,
          undos: decisions.length - live.length, decisions: decisions };
      }
    };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Browser UI. el: container; onEvent(type,data) for log events; onDone(round)
  function mount(el, set, opts) {
    // opts.round: reuse an existing round; opts.single: render only the current pair, then call opts.onDecision(d)
    opts = opts || {}; var r = opts.round || createRound(set, opts), strength = 2, tags = [], RT = set.reasonTags || REASON_TAGS, single = !!opts.single;
    if (single) r.markShown();
    function render() {
      var c = r.current(); if (!c) { if (opts.onDone) opts.onDone(r); return; }
      var L = c.swapped ? c.pair.b : c.pair.a, R = c.swapped ? c.pair.a : c.pair.b, Lk = c.swapped ? 'B' : 'A', Rk = c.swapped ? 'A' : 'B';
      el.innerHTML = '<div class="pw">' +
        '<div class="pw-top"><span>Pair ' + (r.index() + 1) + '/' + r.total + '</span>' + (set.demo ? '<span class="pw-demo">DEMO DATA</span>' : set.kind === 'tone-discovery' ? '<span class="pw-demo" style="background:#246">TONE · fictional text</span>' : '') + '<button class="pw-undo"' + (single ? ' style="visibility:hidden"' : '') + ' ' + (r.decisions().some(function (d) { return !d.undone; }) ? '' : 'disabled') + '>↶ Undo</button></div>' +
        '<div class="pw-crit">' + esc(c.pair.criterion) + '</div><div style="font-size:12px;color:#999">' + (c.pair.kind ? esc(c.pair.kind) + ' · ' : '') + 'Set strength (optional tags) first, then tap your pick.</div>' +
        '<div class="pw-items"><button class="pw-item" data-k="' + Lk + '"><b>A</b> ' + esc(L.text) + '</button><button class="pw-item" data-k="' + Rk + '"><b>B</b> ' + esc(R.text) + '</button></div>' +
        '<div class="pw-row"><span>Strength</span>' + [1, 2, 3].map(function (s) { return '<button class="pw-str' + (s === strength ? ' on' : '') + '" data-s="' + s + '">' + ['slightly', 'clearly', 'much'][s - 1] + '</button>'; }).join('') + '</div>' +
        '<div class="pw-row pw-tags">' + RT.map(function (t) { return '<button class="pw-tag' + (tags.indexOf(t) >= 0 ? ' on' : '') + '" data-t="' + t + '">' + t.replace(/_/g, ' ') + '</button>'; }).join('') + '</div>' +
        '<div class="pw-row"><button class="pw-tie">Tie / can\'t tell</button><button class="pw-nth">Neither</button><button class="pw-nei">Not enough info</button></div></div>';
      // screen labels A/B are positions; map back to set A/B via data-k
      el.querySelectorAll('.pw-item').forEach(function (b) { b.onclick = function () { go(b.getAttribute('data-k')); }; });
      el.querySelectorAll('.pw-str').forEach(function (b) { b.onclick = function () { strength = +b.getAttribute('data-s'); render(); }; });
      el.querySelectorAll('.pw-tag').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-t'), i = tags.indexOf(t); if (i >= 0) tags.splice(i, 1); else tags.push(t); b.classList.toggle('on'); }; });
      el.querySelector('.pw-tie').onclick = function () { go('tie'); };
      el.querySelector('.pw-nth').onclick = function () { go('neither'); };
      el.querySelector('.pw-nei').onclick = function () { go('not_enough_info'); };
      el.querySelector('.pw-undo').onclick = function () { var d = r.undo(); if (d && opts.onEvent) opts.onEvent('pairwise_undo', { pairId: d.pairId, seq: d.seq }); render(); };
      el.scrollTop = 0; window.scrollTo && window.scrollTo(0, 0);
    }
    function go(choice) { var d = r.decide(choice, strength, tags.slice()); if (opts.onEvent) opts.onEvent('pairwise_decision', { pairId: d.pairId, choice: d.choice, seq: d.seq }); strength = 2; tags = []; if (single) { if (opts.onDecision) opts.onDecision(d, r); } else render(); }
    render(); return r;
  }
  var CSS = '.pw{display:flex;flex-direction:column;gap:8px;padding:8px 4px}.pw-top{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#aaa}' +
    '.pw-demo{background:#a60;color:#fff;border-radius:6px;padding:1px 6px;font-size:11px}.pw-crit{font-weight:600;font-size:15px;color:#fc0}' +
    '.pw-items{display:flex;flex-direction:column;gap:8px}.pw-item{text-align:left;font-size:14px;line-height:1.4;padding:10px;border-radius:10px;background:#1d1d1d;color:#eee;border:1px solid #555}.pw-item b{color:#7cf;margin-right:4px}' +
    '.pw-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px}.pw-row button{font-size:13px;padding:8px 10px;border-radius:8px;background:#2a2a2a;color:#eee;border:1px solid #444}.pw-row button.on{background:#264;border-color:#4a8}' +
    '.pw-undo{font-size:13px;padding:6px 10px;border-radius:8px;background:#2a2a2a;color:#eee;border:1px solid #444}.pw-undo:disabled{opacity:.4}';
  return { REASON_TAGS: REASON_TAGS, createRound: createRound, mount: mount, CSS: CSS };
});
