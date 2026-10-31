#!/usr/bin/env node
/* Parcel consistency ledger CLI.  node games/parcels/tools/ledger.js --rebuild   (from every graded human log in data/model-scores.json)
   node games/parcels/tools/ledger.js            (print counts)   Rule: ledger.js (3 consistent human evals in a row -> settled; 5 tries -> manual-review) */
const L = require('./lib.js'), path = require('path'), fs = require('fs');
const LP = path.join(L.ROOT, 'data/parcel-ledger.json');
function empty() { return { schema: 'parcels-ledger', version: '1.0.0', kind: 'human', note: 'Per-parcel evaluations across rounds and modes. Only human evaluations count toward settling; model evaluations are for comparison. SYNTHETIC fictional parcels only.', logs: [], parcels: {} }; }
function rebuild() { const board = L.readJ(path.join(L.ROOT, 'data/model-scores.json')), led = empty();
  board.rounds.slice().sort((a, b) => a.round < b.round ? -1 : 1).forEach(r => { const R = L.readJ(path.join(L.ROOT, 'rounds', r.round + '.json')); (r.logs || [r.log]).forEach(lg => { const n = L.ledgerAddLog(led, L.readJ(path.join(L.REPO, lg)), R, lg); console.log(r.round, lg, '+' + n, 'human evals'); }); L.ledgerAddModels(led, R); });
  return L.ledgerRefresh(led); }
if (require.main === module) { if (process.argv.includes('--rebuild')) { const led = rebuild(); L.writeJ(LP, led); }
  const led = L.readJ(LP); console.log(JSON.stringify(led.counts)); }
module.exports = { LP, empty, rebuild };
