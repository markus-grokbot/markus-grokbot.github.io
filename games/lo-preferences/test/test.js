const assert=require('assert'),fs=require('fs'),P=require('../prefs.js'),T=require('../timer.js'),E=require('../engine.js');
const D=JSON.parse(fs.readFileSync(__dirname+'/../data/areas.json','utf8'));
// lengths
assert.equal(P.cardsForMinutes(5),10);assert.equal(P.cardsForMinutes(10),20);assert.equal(P.cardsForMinutes(15),30);
assert(D.cards.length>=30,'>=30 cards');
// setup filtering
let s=P.create(D,{areas:['bend','pavo']});assert(s.pool.every(c=>['bend','pavo'].includes(c.area)));
for(let i=0;i<40;i++){const h=s.next();assert(['bend','pavo'].includes(h.card.area));}
// 3-confirmation
s=P.create(D,{areas:['bend']});const ud=D.cards.find(c=>c.id==='bend-ud1');
let e=s.answer({card:ud,seq:1,shownAt:Date.now()},'up');assert.equal(e.status,'1/3');
e=s.answer({card:D.cards.find(c=>c.id==='bend-ud2'),seq:2,shownAt:Date.now()},'up');assert.equal(e.status,'2/3');assert(!e.becameStrong);
e=s.answer({card:ud,seq:3,shownAt:Date.now()},'up');assert.equal(e.status,'strong');assert(e.becameStrong);
e=s.answer({card:ud,seq:4,shownAt:Date.now()},'up');assert(!e.becameStrong);
const r1=D.cards.find(c=>c.id==='bend-r1');[2,1,1].forEach((v,i)=>e=s.answer({card:r1,seq:5+i,shownAt:Date.now()},v));assert.equal(e.status,'strong');
s.answer({card:r1,seq:9,shownAt:Date.now()},'skip');
const r=s.result();assert.equal(r.strong.length,2);assert.equal(r.areaRanking[0].net,4);assert(s.markdown().includes('Strong current preferences'));
// confirmations prioritised on re-pass
s=P.create(D,{areas:['bend'],rng:()=>0.3});const first=[];for(let i=0;i<8;i++){const h=s.next();first.push(h);s.answer(h,i===0?(h.card.type==='choice'?0:h.card.type==='rate'?1:'up'):'skip');}
const h9=s.next();assert.equal(h9.card.id,first[0].card.id,'pending pref card re-asked first');
// timer counts active ms only, fires every segment
let fired=0;const t=T.create(30000,()=>fired++);t.tick(10000);assert.equal(fired,0);t.start();for(let i=0;i<1800;i++)t.tick(1000/60);assert.equal(fired,1);assert(!t.running());t.tick(5000);assert.equal(fired,1);
t.start();t.tick(29999);assert.equal(fired,1);t.tick(2);assert.equal(fired,2);
// engine runs a segment
const g=E.create({seed:3});for(let i=0;i<1800;i++)g.step(1000/60,{jump:i%40<5});assert(g.state().dist>0);
// executors
assert.equal(D.executors.length,5);let ex=P.normExec(D,null);assert.deepEqual(ex.bend,['free-models','opencode-lenovo','opencode-grokbot','codex','grok-build']);
// migration: old saved settings (pre execDefaultsVersion 2) without lenovo get lenovo ticked once; later unticks persist
let old={bend:['codex'],__known:D.executors.map(x=>x.id)};let mig=P.normExec(D,old);assert(mig.bend.includes('opencode-lenovo'));
mig.bend=['codex'];assert.deepEqual(P.normExec(D,mig).bend,['codex']);
P.setAll(ex,D.areas.map(a=>a.id),'opencode-lenovo',false);
const A=D.areas.map(a=>a.id);function A0(){return A;}assert.equal(P.masterState(ex,A,'codex'),'all');assert.equal(P.masterState(ex,A,'opencode-lenovo'),'none');
P.setAll(ex,['bend'],'opencode-lenovo',true);assert.equal(P.masterState(ex,A,'opencode-lenovo'),'mixed');P.setAll(ex,A,'opencode-lenovo',true);assert.equal(P.masterState(ex,A,'opencode-lenovo'),'all');
P.setAll(ex,A,'codex',false);assert.equal(P.masterState(ex,A,'codex'),'none');
const ex2=P.normExec(D,JSON.parse(JSON.stringify(ex)));assert.deepEqual(ex2.bend,ex.bend,'persist roundtrip');
s=P.create(D,{areas:['bend'],executors:ex});const rr=s.result();assert(rr.executors.bend.includes('opencode-lenovo'));assert(!rr.executors.pavo);assert(s.markdown().includes('Executors per area'));
// countdown gate
const gg=P.gate(3000,300);assert.equal(gg.count(),3);assert(!gg.shown()&&!gg.clickable());gg.tick(1500);assert.equal(gg.count(),2);gg.tick(1499);assert.equal(gg.count(),1);assert(!gg.shown());
gg.tick(1);assert(gg.shown());assert(!gg.clickable());gg.tick(299);assert(!gg.clickable());gg.tick(1);assert(gg.clickable());
// decision mode deck filtering
let ds=P.create(D,{mode:'decision',area:'bend'});assert(ds.pool.length>=6&&ds.pool.length<=10);for(let i=0;i<20;i++){const h=ds.next();assert(h.card.id.startsWith('bend-d-'));ds.answer(h,h.card.type==='updown'?'up':0);}
let dr=ds.result();assert.equal(dr.mode,'decision');assert.equal(dr.area,'bend');assert(dr.strong.length>0);assert.deepEqual(dr.areasIncluded,['bend']);
D.areas.forEach(a=>{assert(a.decisions.length>=6&&a.decisions.length<=10,a.id);['scope','first-deliverable','executors','timeline','public-private','success-metric'].forEach(t=>assert(a.decisions.some(c=>c.topic===t),a.id+t));});
assert.equal(P.sessionEntry(D,dr).delta.bend,undefined,'decision rounds do not move the ladder');
// ledger: session entry, threshold crossing
function sess(at,ups,downs,rate){const x=P.create(D,{areas:['bend']});let r=x.result();r.at=at;r.log=[];for(let i=0;i<ups;i++)r.log.push({card:'bend-ud1',area:'bend',choice:'up',pref:'bend:up'});for(let i=0;i<downs;i++)r.log.push({card:'bend-ud1',area:'bend',choice:'down',pref:'bend:down'});if(rate)r.log.push({card:'bend-r1',area:'bend',choice:2,pref:'bend-ports-value:+'});return r;}
assert(D.cards.find(c=>c.id==='bend-r1').priority);
let L=P.emptyLedger();const e1=P.sessionEntry(D,sess('2026-11-01T10:00:00.000Z',4,0,true));assert.equal(e1.delta.bend,4.25);assert.equal(e1.up.bend,4);
P.mergeLedger(L,[e1]);let st=P.standings(D,L).find(x=>x.id==='bend');assert.equal(st.minScore,5);assert.equal(st.minUpSessions,2);assert(!st.crossed,'1 session not enough');assert.deepEqual(P.suggested(D,L),[]);
P.mergeLedger(L,[P.sessionEntry(D,sess('2026-11-02T10:00:00.000Z',1,1))]);st=P.standings(D,L).find(x=>x.id==='bend');assert.equal(st.score,4.25);assert(!st.crossed,'score <5');
P.mergeLedger(L,[P.sessionEntry(D,sess('2026-11-03T10:00:00.000Z',1,0))]);st=P.standings(D,L).find(x=>x.id==='bend');assert.equal(st.score,5.25);assert.equal(st.upSessions,3);assert(st.crossed);assert.deepEqual(P.suggested(D,L),['bend']);
// per-area override
const D2=JSON.parse(JSON.stringify(D));D2.areas.find(a=>a.id==='bend').threshold={minScore:10};assert(!P.standings(D2,L).find(x=>x.id==='bend').crossed);
// import dedupe + merge from another device
const exported={game:'lo-preferences',at:'2026-11-03T10:00:00.000Z',log:[],ledger:{sessions:JSON.parse(JSON.stringify(L.sessions))}};
let L2=P.mergeLedger(P.emptyLedger(),[P.sessionEntry(D,sess('2026-11-04T09:00:00.000Z',2,0))]);P.mergeLedger(L2,P.importSessions(D,exported));assert.equal(L2.sessions.length,4);assert.equal(L2.added,3);
P.mergeLedger(L2,P.importSessions(D,exported));assert.equal(L2.sessions.length,4,'re-import dedupes');assert.equal(L2.added,0);
const lone=sess('2026-11-05T09:00:00.000Z',1,0);P.mergeLedger(L2,P.importSessions(D,lone));assert.equal(L2.sessions.length,5,'export without ledger imports as one session');
console.log('all tests passed');
