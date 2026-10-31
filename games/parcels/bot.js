/* SIM sorter (not preference data). Keyword heuristic + noise; think time grows with load. skills: casual | good */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ParcelBot = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var BINS = ['reply', 'archive', 'later', 'info', 'spam'];
  function guess(p) {
    var s = (p.subject + ' ' + p.snippet + ' ' + (p.badge || '')).toLowerCase(), ty = p.senderType;
    if (/off|free|sign up|points|webinar|exclusive|urgent|suspicious|photo|!!!/.test(s) || ty === 'marketing') return 'spam';
    if (/which|\?|could you|what range|confirm|need your|missing/.test(s)) return /need|missing|which/.test(s) ? 'info' : 'reply';
    if (/failed|bug|review requested/.test(s)) return 'reply';
    if (ty === 'newsletter' || /digest|report|issue \d|new jobs|deadline|review/.test(s)) return 'later';
    return 'archive';
  }
  var SK = { casual: { acc: 0.7, think: 2200, change: 0.12 }, good: { acc: 0.85, think: 1500, change: 0.06 } };
  function create(skill, rng) {
    var k = SK[skill] || SK.casual, plan = null;
    return { skill: skill, decide: function (wave) { // returns a bin to press now, or null
      var tg = wave.target(), st = wave.state(); if (!tg) { plan = null; return null; }
      if (!plan || plan.id !== tg.p.id) { var g = rng() < k.acc ? guess(tg.p) : BINS[Math.floor(rng() * 5)]; plan = { id: tg.p.id, at: st.t + k.think * (0.6 + rng() * 0.9) / Math.sqrt(st.speed), bin: g, alt: rng() < k.change ? BINS[Math.floor(rng() * 5)] : null, pressed: 0 }; }
      if (st.t < plan.at || plan.pressed > 1) return null;
      if (plan.alt && plan.pressed === 0 && plan.alt !== plan.bin) { plan.pressed = 1; plan.at = st.t + 150; return plan.alt; }
      plan.pressed = 2; return plan.bin;
    }, abChoose: function (q, rng2) { var r = (rng2 || rng)(); if (r < 0.15) return 'neither'; return (q.a.text.length <= q.b.text.length) === (r < 0.65) ? 'A' : 'B'; } };
  }
  return { BINS: BINS, guess: guess, create: create };
});
