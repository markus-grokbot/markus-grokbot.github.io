const assert=require('assert'),fs=require('fs'),P=require('../../lo-preferences/prefs.js'),C=require('../cambio.js');
const D=JSON.parse(fs.readFileSync(__dirname+'/../data/areas.json','utf8'));
assert(D.syntheticOnly);[1,2,3].forEach(l=>assert(C.levelCards(D,l).length>10,'level '+l+' playable'));
assert.equal(C.levelCards(D,1).every(c=>c.level===1),true);assert.equal(C.levelCards(D,5).length,C.levelCards(D,3).length,'4-5 add no cards yet');
// play a level-3 session answering every card with option 0 / up / +1
const LD=Object.assign({},D,{cards:C.levelCards(D,3)});const s=P.create(LD,{});
for(let i=0;i<120;i++){const h=s.next();const c=h.card;s.answer(h,c.type==='choice'?0:c.type==='rate'?1:'up');}
const r=s.result();const pf=P.performance(D,{faced:10,crashes:0,distance:100,idealDistance:100},r.log.map(l=>Object.assign({},l,{ms:2000})));
const dw=P.weighSession(D,3,pf);const x=C.build(D,r.log,dw);
assert.equal(x.schema,'lo-cambio.export.v1');assert(x.golden_label_votes.length>0);const v=x.golden_label_votes[0];['ticket_id','field','vote','dataset_label','agrees','weight'].forEach(k=>assert(k in v,k));
assert(x.scope_decisions.length>0&&x.talking_point_ranking.length>0&&x.abbreviation_picks.length>0);assert.equal(x.level45.status,'coming-later');assert(x.level45.schemas['new_ticket.v1']);
assert(C.markdown(x).includes('Golden-label votes'));
// 80% rule at 4-5, reviewSchedule semantics
const low={score:0.7};assert.equal(P.weighSession(D,4,low).counted,false);assert.equal(P.weighSession(D,5,{score:0.85}).counted,true);assert.equal(P.weighSession(D,3,low).counted,true);
assert.equal(C.build(D,r.log,P.weighSession(D,4,low)).weight,0);
assert.equal(P.reviewSchedule(1),'weekly-fri-sat');assert.equal(P.reviewSchedule(2),'weekly-fri-sat');assert.equal(P.reviewSchedule(3),'weekly-mon');assert.equal(P.reviewSchedule(4),'immediate');assert.equal(P.reviewSchedule(5),'immediate');
// import accepts lo-cambio exports
r.game='lo-cambio';assert.equal(P.importSessions(D,r).length,1);
// no personnummer-shaped strings outside synthetic tickets flagged; ticket ids map to clean.json
const src='/tmp/cambio-associate-ai-engineer/prep/synthetic-data/merged/clean.json';if(fs.existsSync(src)){const ids=new Set(JSON.parse(fs.readFileSync(src,'utf8')).tickets.map(t=>t.id));D.cards.filter(c=>c.cambio&&c.cambio.ticket_id).forEach(c=>assert(ids.has(c.cambio.ticket_id),c.cambio.ticket_id));}
console.log('lo-cambio tests OK',D.cards.length,'cards');
