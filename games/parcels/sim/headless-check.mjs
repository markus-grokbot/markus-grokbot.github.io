// Headless Chrome check (CDP, Node >= 22): node games/parcels/sim/headless-check.mjs [url] -> waits for window.__parcelsLog, reports JS errors
import { spawn } from 'node:child_process';
const url = process.argv[2] || 'http://127.0.0.1:8765/games/parcels/?sim=1&skill=good&fast=16', port = 9333;
const ch = spawn('/opt/google/chrome/chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + port, '--window-size=390,844', '--user-data-dir=/tmp/pp-chrome-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errors = []; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' ')); };
const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }); await send('Page.enable');
await send('Page.navigate', { url }); if (process.env.CLICK_GO) { await sleep(1500); await send('Runtime.evaluate', { expression: "document.getElementById('go').click()" }); }
let log = null; const t0 = Date.now();
const SHOT = +(process.env.SHOT_AT || 0);
while (Date.now() - t0 < 240000) { if (SHOT && Date.now() - t0 > SHOT) break; await sleep(1000); const r = await send('Runtime.evaluate', { expression: 'window.__parcelsLog ? JSON.stringify(window.__parcelsLog) : null', returnByValue: true }); if (r.result?.result?.value) { log = JSON.parse(r.result.result.value); break; } }
if (process.argv[3]) { const s = await send('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(process.argv[3], Buffer.from(s.result.data, 'base64')); }
ch.kill(); const seg = log ? log.levels.map(l => l.segment === 'parcels' ? 'w' : 'q').join('') : null;
console.log(JSON.stringify({ ok: !!log && !errors.length, errors, segments: seg, summary: log && log.summary.parcels, qualities: log && Object.fromEntries(Object.entries(log.qualities.items).map(([k, v]) => [k, v.score])), ms: Date.now() - t0 }, null, 1));
if (log && process.argv[4]) (await import('node:fs')).writeFileSync(process.argv[4], JSON.stringify(log, null, 1));
process.exit(log && !errors.length ? 0 : 1);
