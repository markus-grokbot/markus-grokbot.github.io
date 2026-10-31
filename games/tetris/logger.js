/* Game-agnostic gameplay logger, schema gameplay-log v1 (see /schema/gameplay-log.v1.schema.json) */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.GameLog = f(); })(typeof self !== 'undefined' ? self : this, function () {
  function now() { return Date.now(); }
  function iso(t) { return new Date(t).toISOString(); }
  function rid() { return iso(now()).replace(/[-:.TZ]/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 7); }
  function diff(a, b) { var ch = []; Object.keys(Object.assign({}, a, b)).forEach(function (k) { if (k === 'level') return; if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) ch.push({ param: k, from: a[k] === undefined ? null : a[k], to: b[k] === undefined ? null : b[k] }); }); return ch; }
  function createLog(o) {
    var t0 = o.clock ? o.clock() : now(), clock = o.clock || now;
    var log = {
      schema: 'gameplay-log', schemaVersion: '1.1.0',
      game: { id: o.gameId, version: o.gameVersion, iteration: o.iteration, namespace: o.gameId },
      run: { id: rid(), type: o.runType, startedAt: iso(t0), endedAt: null, device: o.device || {}, player: o.player || {}, seed: o.seed == null ? null : o.seed, tuningSource: o.tuningSource || 'defaults' },
      levels: [], transitions: [], summary: null
    };
    // 1.1.0 (additive): optional session {id, kind, segments[]} for multi-game sessions (e.g. combo tetris->pairwise)
    if (o.session) log.session = { id: log.run.id, kind: o.session.kind, segments: [] };
    var cur = null;
    return {
      data: log,
      // segment: optional {kind:'tetris'|'pairwise', ...} (1.1.0). The level is also listed in session.segments.
      startLevel: function (level, params, segment) {
        var prev = log.levels[log.levels.length - 1];
        cur = { level: level, params: params, startedAt: iso(clock()), _t: clock(), endedAt: null, durationMs: null, outcome: null, metrics: {}, events: [{ t: 0, type: 'level_start' }], ext: {} };
        log.levels.push(cur);
        if (segment) { cur.segment = segment.kind; if (log.session) log.session.segments.push(Object.assign({ index: log.session.segments.length, levelIndex: log.levels.length - 1 }, segment)); }
        if (prev) log.transitions.push({ from: prev.level, to: level, fromOutcome: prev.outcome, at: cur.startedAt, changes: diff(prev.params, params), mechanicsAdded: [], mechanicsRemoved: [] });
      },
      event: function (type, data) { if (cur) cur.events.push(Object.assign({ t: clock() - cur._t, type: type }, data || {})); },
      // ns (1.1.0, optional): ext namespace for this level; defaults to game.namespace
      endLevel: function (outcome, metrics, ext, ns) {
        if (!cur) return; var t = clock(); cur.endedAt = iso(t); cur.durationMs = t - cur._t; cur.outcome = outcome;
        cur.metrics = Object.assign({ durationMs: cur.durationMs }, metrics); cur.ext[ns || log.game.namespace] = ext || {};
        if (log.session) { var sg = log.session.segments.filter(function (x) { return x.levelIndex === log.levels.indexOf(cur); })[0]; if (sg) { sg.outcome = outcome; sg.durationMs = cur.durationMs; } }
        cur.events.push({ t: cur.durationMs, type: 'level_' + outcome }); delete cur._t; var c = cur; cur = null; return c;
      },
      finish: function () {
        log.run.endedAt = iso(clock()); var done = log.levels.filter(function (l) { return l.outcome === 'complete'; });
        log.summary = { levelsCompleted: done.length, highestLevel: done.length ? Math.max.apply(null, done.map(function (l) { return l.level; })) : 0, totalDurationMs: log.levels.reduce(function (a, l) { return a + (l.durationMs || 0); }, 0) };
        return log;
      },
      toJSON: function () { var c = JSON.parse(JSON.stringify(log)); c.levels.forEach(function (l) { delete l._t; }); return c; }
    };
  }
  return { createLog: createLog, diffParams: diff };
});
