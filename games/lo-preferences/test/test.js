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
console.log('all tests passed');
