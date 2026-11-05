const assert=require('assert'),fs=require('fs'),P=require('../../lo-preferences/prefs.js'),C=require('../cambio.js');
const D=JSON.parse(fs.readFileSync(__dirname+'/../data/areas.json','utf8'));
assert(D.syntheticOnly);[1,2,3].forEach(l=>assert(C.levelCards(D,l).length>10,'level '+l+' playable'));
assert.equal(C.levelCards(D,1).every(c=>c.level===1),true);assert.equal(D.playableMaxLevel,4);assert(C.levelCards(D,4).length>C.levelCards(D,3).length,'level 4 adds cards');assert.equal(C.levelCards(D,5).length,C.levelCards(D,4).length,'level 5 gated (no extra cards beyond playableMaxLevel)');assert(D.comingLater.every(x=>x.level===5),'only level 5 still coming-later');
// play a level-3 session answering every card with option 0 / up / +1
const LD=Object.assign({},D,{cards:C.levelCards(D,3)});const s=P.create(LD,{});
for(let i=0;i<120;i++){const h=s.next();const c=h.card;s.answer(h,c.type==='choice'?0:c.type==='rate'?1:'up');}
const r=s.result();const pf=P.performance(D,{faced:10,crashes:0,distance:100,idealDistance:100},r.log.map(l=>Object.assign({},l,{ms:2000})));
const dw=P.weighSession(D,3,pf);const x=C.build(D,r.log,dw);
assert.equal(x.schema,'lo-cambio.export.v1');assert(x.golden_label_votes.length>0);const v=x.golden_label_votes[0];['ticket_id','field','vote','dataset_label','agrees','weight'].forEach(k=>assert(k in v,k));
assert(x.scope_decisions.length>0&&x.talking_point_ranking.length>0&&x.abbreviation_picks.length>0);assert.equal(x.level45.status,'level-4-playable');assert.equal(x.level45.level5,'coming-later');assert(x.level45.schemas['new_ticket.v1']);
assert(C.markdown(x).includes('Golden-label votes'));
// 80% rule at 4-5, reviewSchedule semantics
const low={score:0.7};assert.equal(P.weighSession(D,4,low).counted,false);assert.equal(P.weighSession(D,5,{score:0.85}).counted,true);assert.equal(P.weighSession(D,3,low).counted,true);
assert.equal(C.build(D,r.log,P.weighSession(D,4,low)).weight,0);
assert.equal(P.reviewSchedule(1),'weekly-fri-sat');assert.equal(P.reviewSchedule(2),'weekly-fri-sat');assert.equal(P.reviewSchedule(3),'weekly-mon');assert.equal(P.reviewSchedule(4),'immediate');assert.equal(P.reviewSchedule(5),'immediate');
// import accepts lo-cambio exports
r.game='lo-cambio';assert.equal(P.importSessions(D,r).length,1);
// no personnummer-shaped strings outside synthetic tickets flagged; ticket ids map to clean.json
const src='/tmp/cambio-associate-ai-engineer/prep/synthetic-data/merged/clean.json';if(fs.existsSync(src)){const ids=new Set(JSON.parse(fs.readFileSync(src,'utf8')).tickets.map(t=>t.id));D.cards.filter(c=>c.cambio&&c.cambio.ticket_id).forEach(c=>assert(ids.has(c.cambio.ticket_id),c.cambio.ticket_id));}
// round 2: talking playable at L1-2 with allowed executors; abbreviation reveal; new scope/talking cards export
[1,2].forEach(l=>assert(C.levelCards(D,l).filter(c=>c.area==='talking').length>=20,'talking at level '+l));
const cp=P.costPlan(D,2,P.normExec(D,{talking:P.defaultExecutors(D)}));assert(cp.areas.talking.allowedExecutors.length>0,'talking allowed executors');
D.cards.filter(c=>c.cambio&&c.cambio.kind==='abbreviation_pick').forEach(c=>{assert(c.reveal&&c.reveal.expansions.length&&c.reveal.example&&c.reveal.example.text,'reveal '+c.id);assert(c.options.some(o=>o.value==='__unknown__'),'dk '+c.id);});
assert(D.cards.filter(c=>/^sc2-/.test(c.id)).length>=10&&D.cards.filter(c=>/^tp2-/.test(c.id)).length>=10);
assert(!JSON.stringify(D.cards).match(/\bdegree\b|examen/i),'no degree claims');
const L2=Object.assign({},D,{cards:C.levelCards(D,2)}),s2=P.create(L2,{});for(let i=0;i<80;i++){const h=s2.next();s2.answer(h,h.card.type==='choice'?h.card.options.length-1:h.card.type==='rate'?0:'up');}
const x2=C.build(D,s2.result().log,P.weighSession(D,2,{score:1}));assert.equal(x2.schema,'lo-cambio.export.v1');assert(x2.scope_decisions.some(d=>d.decision_id==='backup'||d.decision_id==='fhir-depth'));assert(x2.abbreviation_picks.some(a=>a.dont_know));
assert(fs.statSync(__dirname+'/../data/core.js').size<80000,'core.js stays small');
console.log('lo-cambio tests OK',D.cards.length,'cards');
// round 3: typed overrides (manualReply/overridden), choice+text and text-only
{const s3=P.create(Object.assign({},D,{cards:C.levelCards(D,3)}),{});let n=0,t=0;for(let i=0;i<60;i++){const h=s3.next(),c=h.card;if(c.type!=='choice')continue;if(n<3){const e=s3.answer(h,0);e.manualReply='typed '+n;e.overridden=true;n++;}else if(t<3){const e=s3.answer(h,'skip');e.choice='manual';e.manualReply='only '+t;e.overridden=true;t++;}else s3.answer(h,0);}
const x3=C.build(D,s3.result().log,P.weighSession(D,3,{score:1}));assert.equal(x3.manual_replies.length,6);assert.equal(x3.manual_replies.filter(m=>m.selected_choice===null).length,3);
const tagged=[].concat(x3.golden_label_votes,x3.scope_decisions,x3.abbreviation_picks,x3.edge_case_votes).filter(r=>r.overridden);assert(tagged.length>=1&&tagged.every(r=>/^typed /.test(r.manualReply)));
assert(!JSON.stringify(x3.golden_label_votes).includes('"only '));assert(C.markdown(x3).includes('Typed replies'));assert.equal(P.performance(D,{},s3.result().log).skipped,s3.result().log.filter(l=>l.choice==='skip').length);
console.log('override tests OK');}

// round 4: level-4 data-creation records (ticket_edit, bulk_label, abbreviation_verification+source, level 5 gated)
{const L4=Object.assign({},D,{cards:C.levelCards(D,4)});const s4=P.create(L4,{});
  let got={te:0,bl:0,av:0,ps:0};
  for(let i=0;i<200 && (got.te<1||got.bl<1||got.av<1||got.ps<1);i++){
    const h=s4.next(),c=h.card,k=c.cambio&&c.cambio.kind;
    if(k==='ticket_edit'&&!got.te){const e=s4.answer(h,0);e.manualReply='Omskrivet: '+c.cambio.original;e.overridden=true;got.te++;}
    else if(k==='bulk_label'&&!got.bl){s4.answer(h,0);got.bl++;}
    else if(k==='abbreviation_verification'&&!got.av){const e=s4.answer(h,0);e.sourceUrl='https://termbank.socialstyrelsen.se/?query=medicinskt+ansvarig+sjuksk%C3%B6terska&src_lang=swe';got.av++;}
    else if(k==='pii_span_annotation'&&!got.ps){s4.answer(h,0);got.ps++;}
    else s4.answer(h,c.type==='choice'?0:c.type==='rate'?1:'up');
  }
  const x4=C.build(D,s4.result().log,P.weighSession(D,4,{score:0.9}));
  assert.equal(x4.level45.status,'level-4-playable');
  const rec=x4.level45.records;assert(rec.length>=3,'level45 records');
  const te=rec.find(r=>r.schema==='ticket_edit.v1');assert(te&&te.synthetic_attestation===true&&te.edited&&te.ticket_id&&te.field);
  const bl=rec.find(r=>r.schema==='bulk_label.v1');assert(bl&&bl.labels&&bl.labels.category&&bl.confidence>=1&&bl.confidence<=5);
  const av=rec.find(r=>r.schema==='abbreviation_verification.v1');assert(av&&av.source_url&&/^https:\/\//.test(av.source_url)&&av.verdict);
  assert(D.cards.some(c=>c.level===4&&c.cambio&&c.cambio.kind==='ticket_edit'));
  assert(D.cards.some(c=>c.level===4&&c.cambio&&c.cambio.kind==='bulk_label'));
  assert(D.cards.some(c=>c.level===4&&c.cambio&&c.cambio.kind==='abbreviation_verification'));
  assert(!D.cards.some(c=>c.cambio&&c.cambio.kind==='new_ticket'),'new_ticket stays gated for level 5');
  assert.equal(D.playableMaxLevel,4);
  console.log('level4 tests OK',rec.length,'records',got);
}
