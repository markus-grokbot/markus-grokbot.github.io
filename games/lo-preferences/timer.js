/* Segment timer (UMD): counts ACTIVE run ms only; fires onSegmentEnd every segmentMs. Driven by tick(dt) so it is testable. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.SegTimer = f(); })(typeof self !== 'undefined' ? self : this, function () {
  return { create: function (segmentMs, onEnd) { var t = 0, running = false, total = 0;
    return { start: function () { running = true; }, pause: function () { running = false; }, running: function () { return running; }, left: function () { return Math.max(0, segmentMs - t); }, total: function () { return total; },
      tick: function (dt) { if (!running) return false; t += dt; total += dt; if (t >= segmentMs) { t = 0; running = false; onEnd(); return true; } return false; } }; } };
});
