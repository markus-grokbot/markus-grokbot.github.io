#!/usr/bin/env node
/* Headless Parcel Panic v3 (priority field) sim. Same as run-sim2.js but with priority.js geometry. SIM data only.
   node games/parcels/sim/run-sim3.js [--round round-003] [--skill casual|good] [--seed 1] [--out ...] */
process.env.PARCELS_MODE = 'priority'; require('./run-sim2.js');
