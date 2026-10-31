// Touch-drag check at 390x844 (human mode): starts a round, drags the first parcel to the top-left with CDP touch events,
// verifies a decision was logged near Reply, the page did not scroll and there were no JS errors. node sim/drag-check.mjs [url] [shot.png]
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const url = process.argv[2] || 'http://127.0.0.1:8765/games/parcels/', port = 9334;
const ch = spawn('/opt/google/chrome/chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + port, '--window-size=390,844', '--user-data-dir=/tmp/pp-drag-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errors = []; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }); await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(1500); await ev("document.getElementById('go').click()"); await sleep(4200);
const tp = (type, x, y) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
await tp('touchStart', 200, 600); for (let i = 1; i <= 12; i++) { await tp('touchMove', 200 - i * 9, 600 - i * 22); await sleep(40); }
if (process.argv[3]) { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(process.argv[3], Buffer.from(s.result.data, 'base64')); }
await tp('touchEnd'); await sleep(300);
const st = await ev('JSON.stringify(window.__parcelsState())'), sy = await ev('window.scrollY + document.scrollingElement.scrollTop'), d = st && JSON.parse(st).decisions[0];
ch.kill(); console.log(JSON.stringify({ ok: !!d && !d.missed && d.x < -0.3 && d.y > 0.3 && !errors.length && !sy, decision: d, scroll: sy, errors }, null, 1)); process.exit(0);
