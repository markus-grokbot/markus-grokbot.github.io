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
/* v2 field bot (SIM only): aims at the zone centre of its guess with gaussian noise; sometimes commits only one axis
   (partial sort: the other coordinate stays near the middle). Drags in small steps, releases after a think time. */
(function (root) {
  var B = typeof module === 'object' && module.exports ? module.exports : root.ParcelBot, A0 = typeof module === 'object' && module.exports ? require('./axes.js') : root.ParcelAxes;
  var SK2 = { casual: { acc: 0.7, think: 2600, sd: 0.28, partial: 0.25, slow: 0.08 }, good: { acc: 0.85, think: 1900, sd: 0.16, partial: 0.12, slow: 0.03 } };
  B.createField = function (skill, rng, AXM) { var A = AXM || A0;
    var k = SK2[skill] || SK2.casual, plan = null; function g() { return (rng() + rng() + rng() - 1.5) * 1.15; }
    return { skill: skill, abChoose: B.create(skill, rng).abChoose, act: function (wave) {
      var c = wave.current(), st = wave.state(); if (!c) { plan = null; return; }
      if (!plan || plan.id !== c.p.id) { var bin = rng() < k.acc ? B.guess(c.p) : B.BINS[Math.floor(rng() * 5)], z = A.ZONES[bin], tx = z.x + g() * k.sd, ty = z.y + g() * k.sd;
        if (rng() < k.partial) { if (rng() < 0.5) tx = g() * 0.15; else ty = g() * 0.15; }
        plan = { id: c.p.id, grabAt: st.t + 500 + rng() * 900, relAt: st.t + k.think * (0.7 + rng() * 0.8) / st.speed, never: rng() < k.slow, tx: tx, ty: ty }; }
      if (plan.never) return; var now = st.t;
      if (!c.held && !c.touched && now >= plan.grabAt) { wave.grab(); plan.sx = c.x; plan.sy = c.y; plan.g0 = now; }
      if (c.held) { var f = Math.min(1, (now - plan.g0) / Math.max(200, plan.relAt - plan.g0 - 150)); wave.move(plan.sx + (plan.tx - plan.sx) * f, plan.sy + (plan.ty - plan.sy) * f); if (now >= plan.relAt) wave.release(); }
    } };
  };
})(typeof self !== 'undefined' ? self : this);
