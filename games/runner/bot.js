/* Lynx Dash SIM bot. Returns held inputs {jump, duck} each step. Skills differ in timing noise and miss chance.
   Sim data is NOT human data: sim logs carry run.type 'sim' and player.kind 'bot'. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.RunnerBot = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var SKILLS = { novice: { noiseMs: 120, miss: 0.12 }, casual: { noiseMs: 70, miss: 0.05 }, good: { noiseMs: 35, miss: 0.015 } };
  function create(skill, rng) {
    var K = SKILLS[skill] || SKILLS.casual, plan = {}, holdUntil = -1;
    return { skill: skill, decide: function (g) {
      var s = g.state(), me = g.player(), ahead = s.obstacles.filter(function (o) { return !o.passed && o.x + o.w > me.x; }).sort(function (a, b) { return a.x - b.x; })[0];
      var out = { jump: s.t < holdUntil, duck: false };
      if (!ahead) return out;
      var key = ahead.x0 || (ahead.x0 = ahead.x + ':' + s.t); if (!plan[key]) plan[key] = { lead: 120 + ahead.w / s.speed * 0.25 + (rng() - 0.5) * 2 * K.noiseMs, skip: rng() < K.miss };
      var pl = plan[key], gapMs = (ahead.x - (me.x + me.w)) / s.speed;
      if (pl.skip || (ahead.kind === 'bird' && ahead.lvl === 'high')) return out;
      if (ahead.kind === 'bird' && ahead.lvl === 'mid') { if (gapMs < 260) out.duck = true; return out; }
      if (gapMs < pl.lead && me.air === false) { out.jump = true; holdUntil = s.t + 220; }
      return out;
    } };
  }
  return { SKILLS: Object.keys(SKILLS), create: create };
});
