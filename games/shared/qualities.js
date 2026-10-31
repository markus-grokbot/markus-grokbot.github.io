/* Shared player-qualities model (UMD; browser + Node). One block per log: log.qualities (gameplay-log 1.2.0, optional).
   Each quality is 0-100 with confidence 0-1 and the evidence it came from. Per-game ADAPTERS read a log and return
   partial qualities; compute() merges them (confidence-weighted). Registry: games/shared/qualities.registry.json.
   These are rough gameplay estimates for picking a game, NOT assessments of a person. Labelled 'rough' until confidence >= 0.5. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Qualities = f(); })(typeof self !== 'undefined' ? self : this, function () {
  var MODEL_VERSION = '1.2.0';
  var QUALITIES = {
    focus: 'Sustained attention: few avoidable mistakes per opportunity',
    reaction: 'Responding in time to sudden threats',
    pace: 'Speed of play (e.g. seconds per Tetris piece)',
    consistency: 'Low variance between segments / repeat choices agree',
    accuracy: 'Hitting what you aim for (coins, clean placements)',
    planning: 'Keeping a clean board / thinking ahead',
    riskTaking: 'Playing close to the edge (tall stacks, near misses)',
    endurance: 'Holding performance over a session (50 = steady, >50 warming up, <50 tiring)',
    decisionSpeed: 'How fast preference questions are answered',
    decisiveness: 'Strong picks, few ties / neither'
  };
  var DEFAULT_WEIGHTS = { obstacle: 3, projectile: 2, coin: 1 };
  function clamp(x) { return Math.max(0, Math.min(100, Math.round(x))); }
  function conf(n, k) { return n > 0 ? +(n / (n + k)).toFixed(2) : 0; }
  function q(score, n, k, evidence) { return score == null || isNaN(score) ? null : { score: clamp(score), confidence: conf(n, k), n: n, evidence: evidence }; }
  function median(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function sd(a) { var m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)) : 0; }
  function slope(ys) { var n = ys.length; if (n < 2) return 0; var mx = (n - 1) / 2, my = mean(ys), num = 0, den = 0; ys.forEach(function (y, i) { num += (i - mx) * (y - my); den += (i - mx) * (i - mx); }); return num / den; }
  function logScale(v, best, worst) { if (v == null) return null; var t = (Math.log(v) - Math.log(best)) / (Math.log(worst) - Math.log(best)); return 100 * (1 - Math.max(0, Math.min(1, t))); }
  function ext(log, ns) { return (log.levels || []).filter(function (l) { return l.ext && l.ext[ns]; }).map(function (l) { return { level: l, x: l.ext[ns] }; }); }

  // ---------- Runner focus assessment (weighted penalties per opportunity) ----------
  function runnerSegmentExposure(seg, level, coinChance) {
    if (seg.obstaclesFaced != null) return { obstacles: seg.obstaclesFaced, projectiles: seg.projectilesFaced, coins: seg.coinsOffered, hitObstacle: seg.crashesObstacle, hitProjectile: seg.crashesProjectile, coinsMissed: seg.coinsMissed, estimated: false };
    // legacy (runner 0.1.0 logs): no exposure counters. Estimate obstacles from jumps+ducks+crashes, coins from spawn chance.
    var ev = (level && level.events) || [], birdHits = ev.filter(function (e) { return e.type === 'crash' && e.kind === 'bird'; }).length, hits = seg.crashes || 0;
    var faced = (seg.jumps || 0) + (seg.ducks || 0) + hits, offered = Math.max(seg.coins || 0, Math.round(faced * (coinChance == null ? 0.5 : coinChance)));
    return { obstacles: Math.max(hits - birdHits, faced - birdHits), projectiles: birdHits, coins: offered, hitObstacle: hits - birdHits, hitProjectile: birdHits, coinsMissed: offered - (seg.coins || 0), estimated: true };
  }
  function focusFromExposure(e, w) {
    w = w || DEFAULT_WEIGHTS; var parts = [['obstacle', e.hitObstacle, e.obstacles], ['projectile', e.hitProjectile, e.projectiles], ['coin', e.coinsMissed, e.coins]];
    var pen = 0, wsum = 0, rates = {}; parts.forEach(function (p) { if (p[2] > 0) { var r = p[1] / p[2]; rates[p[0]] = +r.toFixed(3); pen += w[p[0]] * r; wsum += w[p[0]]; } });
    return { focus: wsum ? clamp(100 * (1 - pen / wsum)) : null, rates: rates };
  }
  function runnerFocus(log, opt) {
    opt = opt || {}; var w = opt.weights || DEFAULT_WEIGHTS, segs = ext(log, 'runner'), tot = { obstacles: 0, projectiles: 0, coins: 0, hitObstacle: 0, hitProjectile: 0, coinsMissed: 0 }, est = false;
    var out = segs.map(function (s, i) { var e = runnerSegmentExposure(s.x, s.level, opt.coinChance); est = est || e.estimated; Object.keys(tot).forEach(function (k) { tot[k] += e[k]; });
      var f = focusFromExposure(e, w); return { segmentNo: s.x.segmentNo || i + 1, focus: f.focus, rates: f.rates, exposure: e, avgSpeed: s.x.avgSpeed }; });
    var r = focusFromExposure(tot, w), ys = out.map(function (s) { return s.focus; }).filter(function (x) { return x != null; }), sl = slope(ys), min = opt.trendMinSegments || 3;
    var trend = { pointsPerSegment: +sl.toFixed(2), label: ys.length < min ? 'not enough segments' : sl > 1 ? 'warming up' : sl < -1 ? 'tiring' : 'steady', firstHalf: Math.round(mean(ys.slice(0, ys.length >> 1)) || 0), secondHalf: Math.round(mean(ys.slice(ys.length >> 1)) || 0) };
    return { weights: w, estimatedExposure: est, segments: out, round: { focus: r.focus, rates: r.rates, exposure: tot }, trend: trend };
  }

  // ---------- adapters ----------
  var ADAPTERS = {
    runner: function (log, opt) {
      var segs = ext(log, 'runner'); if (!segs.length) return null; var F = runnerFocus(log, opt), n = segs.length, res = { _focus: F };
      var tag = F.estimatedExposure ? ' (exposure estimated from jumps; legacy log)' : '';
      var R = F.round.rates, na = function (v) { return v == null ? 'n/a' : v; };
      res.focus = q(F.round.focus, n, 4, ['runner weighted penalties per opportunity' + tag + ': obstacle hit rate ' + na(R.obstacle) + ', crow hit rate ' + na(R.projectile) + ', coin miss rate ' + na(R.coin)]);
      if (F.estimatedExposure) Object.defineProperty(res, '_capped', { value: true });
      var pf = F.round.exposure.projectiles, ph = F.round.exposure.hitProjectile, nm = segs.reduce(function (a, s) { return a + (s.x.nearMisses || 0); }, 0), fc = F.round.exposure.obstacles + pf;
      if (pf >= 3) res.reaction = q(100 * (1 - ph / pf), pf, 15, ['crows avoided ' + (pf - ph) + '/' + pf]);
      else res.reaction = q(100 * (1 - F.round.exposure.hitObstacle / Math.max(1, F.round.exposure.obstacles)), fc, 40, ['few crows seen; from obstacle clear rate ' + (fc - F.round.exposure.hitObstacle - ph) + '/' + fc]);
      res.accuracy = q(100 * (1 - (F.round.rates.coin || 0)), F.round.exposure.coins, 30, ['coins caught ' + (F.round.exposure.coins - F.round.exposure.coinsMissed) + '/' + F.round.exposure.coins + (F.estimatedExposure ? ' (offered estimated)' : '')]);
      var ys = F.segments.map(function (s) { return s.focus; }).filter(function (x) { return x != null; });
      if (ys.length >= 2) res.consistency = q(100 - 4 * sd(ys), ys.length, 6, ['segment focus sd ' + sd(ys).toFixed(1) + ' over ' + ys.length + ' segments']);
      if (ys.length >= 3) res.endurance = q(50 + 8 * F.trend.pointsPerSegment, ys.length, 8, ['focus trend ' + F.trend.pointsPerSegment + ' pts/segment (' + F.trend.label + ')']);
      if (fc) res.riskTaking = q(Math.min(100, 300 * nm / fc), fc, 40, ['near misses ' + nm + '/' + fc + ' obstacles']);
      if (F.estimatedExposure) Object.keys(res).forEach(function (k) { if (res[k] && res[k].confidence != null) res[k].confidence = Math.min(0.45, res[k].confidence); });
      return res;
    },
    tetris: function (log) {
      var lv = ext(log, 'tetris'); if (!lv.length) return null; var pieces = 0, mis = 0, ms = 0, holes = [], bump = [], maxH = [], gaps = [];
      lv.forEach(function (o) { var x = o.x, L = o.level; pieces += x.pieces || 0; mis += (L.metrics && L.metrics.misplays) || 0; ms += L.durationMs || 0; holes.push(x.avgHoles || 0); bump.push(x.bumpinessEnd || 0); maxH.push(x.maxHeight || 0);
        var lk = (L.events || []).filter(function (e) { return e.type === 'lock'; }); if (!lk.length) lk = (L.events || []).filter(function (e) { return e.type === 'hard_drop'; });
        var prev = 0; lk.forEach(function (e) { gaps.push(e.t - prev); prev = e.t; }); });
      if (!pieces) return null; var med = median(gaps) || ms / pieces, hes = gaps.filter(function (g) { return g > 2.5 * med; }).length, hr = gaps.length ? hes / gaps.length : 0, mr = mis / pieces, res = {};
      res.focus = q(100 * (1 - Math.min(1, 0.6 * mr * 2 + 0.4 * hr * 2)), pieces, 60, ['misdrops ' + mis + '/' + pieces + ' pieces', 'hesitations (gap > 2.5x median) ' + hes + '/' + gaps.length]);
      res.planning = q(100 - 8 * mean(holes) - 2 * mean(bump), lv.length * 10, 30, ['avg holes ' + mean(holes).toFixed(2) + ', end bumpiness ' + mean(bump).toFixed(1)]);
      res.pace = q(logScale(ms / pieces / 1000, 1.5, 10), pieces, 40, [(ms / pieces / 1000).toFixed(2) + ' s/piece']);
      if (gaps.length >= 8) { var cv = sd(gaps) / mean(gaps); res.consistency = q(100 * (1 - Math.min(1, cv / 1.5)), gaps.length, 60, ['piece-time CV ' + cv.toFixed(2)]);
        var h = gaps.length >> 1, a = median(gaps.slice(0, h)), b = median(gaps.slice(h)); res.endurance = q(50 + 50 * (a - b) / Math.max(a, b), gaps.length, 80, ['median piece time 1st half ' + (a / 1000).toFixed(1) + ' s vs 2nd ' + (b / 1000).toFixed(1) + ' s']); }
      res.accuracy = q(100 * (1 - Math.min(1, mr * 2)), pieces, 60, ['clean placements ' + (pieces - mis) + '/' + pieces]);
      res.riskTaking = q(100 * mean(maxH) / 20, lv.length * 10, 30, ['max stack height ' + mean(maxH).toFixed(1) + '/20']);
      return res;
    },
    // Parcel Panic: per wave focus = 100*(1-(misses + 0.5*changed)/shown); reaction = spawn->first touch; decisionSpeed = spawn->commit;
    // accuracy = agreement on anchor parcels (unambiguous ones, flagged in the round file, copied into each decision as d.anchorBin)
    parcels: function (log) {
      var w = ext(log, 'parcels'); if (!w.length) return null; var all = [], fs = [], res = {};
      w.forEach(function (o) { var x = o.x; all = all.concat(x.decisions || []); if (x.parcelsShown) fs.push(100 * (1 - (x.misses + 0.5 * x.changedMind) / x.parcelsShown)); });
      var n = all.length, miss = all.filter(function (d) { return d.missed; }).length, ch = all.filter(function (d) { return d.changedMind; }).length; if (!n) return null;
      res.focus = q(100 * (1 - (miss + 0.5 * ch) / n), n, 25, ['parcels missed ' + miss + '/' + n + ', changed mind ' + ch]);
      var fm = all.filter(function (d) { return d.firstMs != null; }).map(function (d) { return d.firstMs; }), sm = all.filter(function (d) { return !d.missed; }).map(function (d) { return d.sortMs; });
      if (fm.length) res.reaction = q(logScale(median(fm) / 1000, 0.8, 6), fm.length, 25, ['median first touch ' + (median(fm) / 1000).toFixed(2) + ' s after a parcel appears']);
      if (sm.length) res.decisionSpeed = q(logScale(median(sm) / 1000, 1, 8), sm.length, 25, ['median sort ' + (median(sm) / 1000).toFixed(2) + ' s']);
      var an = all.filter(function (d) { return d.anchorBin && !d.missed; }), v2 = all.filter(function (d) { return !d.missed && d.soft; });
      // v2 field: accuracy = mean soft probability on the anchor's bin (partial credit); decisiveness = mean stronger-axis confidence
      if (v2.length) { var a2 = v2.filter(function (d) { return d.anchorBin; }); if (a2.length) res.accuracy = q(100 * mean(a2.map(function (d) { return d.soft[d.anchorBin] || 0; })), a2.length, 8, ['clear-cut parcels: mean soft agreement ' + mean(a2.map(function (d) { return d.soft[d.anchorBin] || 0; })).toFixed(2) + ' over ' + a2.length]);
        res.decisiveness = q(100 * mean(v2.map(function (d) { return d.conf; })), v2.length, 20, ['mean axis confidence x ' + mean(v2.map(function (d) { return d.confX; })).toFixed(2) + ', y ' + mean(v2.map(function (d) { return d.confY; })).toFixed(2) + ' (0 = dropped in the middle)']); }
      else if (an.length) { var ok = an.filter(function (d) { return d.bin === d.anchorBin; }).length; res.accuracy = q(100 * ok / an.length, an.length, 8, ['clear-cut parcels sorted as expected ' + ok + '/' + an.length]); }
      if (fs.length >= 2) res.consistency = q(100 - 3 * sd(fs), fs.length, 4, ['wave focus sd ' + sd(fs).toFixed(1) + ' over ' + fs.length + ' waves']);
      if (fs.length >= 3) res.endurance = q(50 + 8 * slope(fs), fs.length, 5, ['wave focus trend ' + slope(fs).toFixed(1) + ' pts/wave (speed rises each wave)']);
      return res;
    },
    pairwise: function (log) {
      var d = []; ext(log, 'pairwise').forEach(function (o) { (o.x.decisions || []).forEach(function (x) { if (!x.undone) d.push(x); }); }); if (!d.length) return null;
      var n = d.length, t = d.map(function (x) { return x.decisionTimeMs; }).filter(function (x) { return x > 0; }), med = median(t), res = {};
      var ab = d.filter(function (x) { return x.choice === 'A' || x.choice === 'B'; }), st = ab.map(function (x) { return x.strength || 2; }), soft = n - ab.length;
      if (med) res.decisionSpeed = q(logScale(med / 1000, 5, 90), t.length, 8, ['median ' + (med / 1000).toFixed(1) + ' s per pick (n=' + t.length + ')']);
      res.decisiveness = q(100 * (0.6 * (st.length ? (mean(st) - 1) / 2 : 0) + 0.4 * (1 - soft / n)), n, 8, ['mean strength ' + (st.length ? mean(st).toFixed(2) : '-') + ' of 3', 'tie/neither ' + soft + '/' + n]);
      var by = {}; d.forEach(function (x) { (by[x.pairId] = by[x.pairId] || []).push(x.winner || x.choice); }), rep = 0, agree = 0;
      Object.keys(by).forEach(function (k) { var a = by[k]; for (var i = 1; i < a.length; i++) { rep++; if (a[i] === a[0]) agree++; } });
      if (rep) res.consistency = q(100 * agree / rep, rep, 4, ['repeat pairs agree ' + agree + '/' + rep]);
      return res;
    }
  };
  // which adapters apply to a log (by content, so combo = tetris + pairwise, runner = runner + pairwise)
  function compute(log, opt) {
    var parts = {}, used = []; Object.keys(ADAPTERS).forEach(function (k) { var r = ADAPTERS[k](log, opt); if (r) { parts[k] = r; used.push(k); } });
    var items = {}; Object.keys(QUALITIES).forEach(function (qk) {
      var c = used.map(function (k) { return parts[k][qk] ? Object.assign({ from: k }, parts[k][qk]) : null; }).filter(Boolean); if (!c.length) return;
      var ws = c.reduce(function (a, x) { return a + Math.max(0.05, x.confidence); }, 0), sc = c.reduce(function (a, x) { return a + x.score * Math.max(0.05, x.confidence); }, 0) / ws, cf = Math.min(0.95, Math.max.apply(null, c.map(function (x) { return x.confidence; })));
      items[qk] = { score: clamp(sc), confidence: +cf.toFixed(2), label: cf >= 0.5 ? 'estimate' : 'rough', evidence: c.map(function (x) { return x.from + ': ' + x.evidence.join('; '); }) };
    });
    var out = { modelVersion: MODEL_VERSION, computedAt: new Date().toISOString(), runType: log.run && log.run.type, adapters: used, items: items,
      note: 'Rough gameplay estimates for choosing a game; not an assessment of the person. "rough" = confidence < 0.5.' };
    if (parts.runner) out.runnerFocus = parts.runner._focus;
    return out;
  }
  // HTML table for summary screens
  function html(block, max) {
    var ks = Object.keys(block.items); if (!ks.length) return '';
    return '<div style="font-size:12px;margin:8px 0"><b>Play qualities</b> <span style="color:#999">(rough estimates until more rounds)</span><table style="margin:4px auto">' + ks.slice(0, max || 10).map(function (k) { var it = block.items[k];
      return '<tr><td>' + k + '</td><td style="text-align:right"><b>' + it.score + '</b></td><td><span style="display:inline-block;height:6px;width:' + it.score * 0.6 + 'px;background:#5bd;border-radius:3px"></span></td><td style="color:#999">' + it.label + ' · conf ' + it.confidence + '</td></tr>'; }).join('') + '</table></div>';
  }
  return { MODEL_VERSION: MODEL_VERSION, QUALITIES: QUALITIES, DEFAULT_WEIGHTS: DEFAULT_WEIGHTS, ADAPTERS: ADAPTERS, compute: compute, runnerFocus: runnerFocus, focusFromExposure: focusFromExposure, html: html };
});
