import test from 'node:test';
import assert from 'node:assert/strict';
import {operationsMetrics} from './operationsMetrics.js';

const profile={employeeId:'IT1',role:'IT',name:'IT Reviewer'};
const requests=[
 {id:'1',state:'Pending',assignedRole:'IT'},
 {id:'2',state:'In review',assignedRole:'CITO'},
 {id:'3',state:'Pending',assignedRole:'COO'},
 {id:'4',state:'Approved',assignedRole:'IT'},
 {id:'5',state:'Completed'},
 {id:'6',state:'Rejected'},
 {id:'7',state:'Query',queryTargetIds:['IT1'],queryHistory:[{employeeId:'C1',responses:[]}]},
 {id:'8',state:'In review',assignedRole:'CITO',queryHistory:[{employeeId:'IT1',by:'IT Reviewer',responses:[{response:'First reply'},{response:'Second reply'}]}]},
 {id:'9',state:'Pending',assignedRole:'HR',queryHistory:[{employeeId:'OTHER',by:'Other',responses:[{response:'Not for you'}]}]},
];
test('operation cards reflect live lifecycle counts and personal approval assignments',()=>{
 const metrics=Object.fromEntries(operationsMetrics(requests,profile).map(metric=>[metric.key,metric]));
 assert.equal(metrics.active.value,7);
 assert.equal(metrics.mine.value,1);
 assert.equal(metrics.hr.value,1);
 assert.equal(metrics.it,undefined);
 assert.equal(metrics.cito.value,2);
 assert.equal(metrics.coo.value,1);
 assert.equal(metrics.total.value,9);
 assert.equal(metrics.approved.value,2);
 assert.equal(metrics['it-processing'].value,1);
 assert.equal(metrics['ho-processing'].value,0);
 assert.equal(metrics.closed.value,1);
 assert.equal(metrics.rejected.value,1);
 assert.equal(metrics.queries.value,1);
 assert.equal(metrics['my-queries'].value,1);
 assert.equal(metrics['my-queries'].note,'Tickets with queries you raised');
 assert.equal(metrics['my-queries'].rows.length,1);
});
test('personal query and approval counts change with the signed-in role and user',()=>{
 const cards=operationsMetrics(requests,{employeeId:'C1',role:'CITO',name:'CITO'});
 assert.equal(cards.find(card=>card.key==='mine').value,2);
 assert.equal(cards.find(card=>card.key==='queries').value,0);
 assert.equal(cards.find(card=>card.key==='my-queries').value,1);
});
test('empty data shows zero rather than placeholder counts',()=>{
 const cards=operationsMetrics([],profile);
 assert.equal(cards.length,13);
 assert.ok(cards.every(card=>card.value===0&&card.rows.length===0));
});

test('each operations role sees other role queues and its own personal approval card',()=>{
 for(const role of ['IT','HR','CITO','COO']){
  const cards=operationsMetrics(requests,{...profile,role});
  assert.ok(cards.some(card=>card.key==='mine'));
  assert.equal(cards.some(card=>card.key===role.toLowerCase()),false);
  for(const other of ['IT','HR','CITO','COO'].filter(other=>other!==role))assert.ok(cards.some(card=>card.key===other.toLowerCase()));
  assert.equal(cards.length,13);
 }
});

test('approval, processing and closure counts follow final workflow milestones',()=>{
 const base={id:'T1',state:'In review',assignedRole:'COO',approvalHistory:[{role:'IT',status:'Approved'},{role:'CITO',status:'Approved'}]};
 const metrics=ticket=>Object.fromEntries(operationsMetrics([ticket],profile).map(card=>[card.key,card.value]));
 let counts=metrics(base);
 assert.equal(counts.approved,0);
 assert.equal(counts['it-processing'],0);
 assert.equal(counts['ho-processing'],0);
 assert.equal(counts.closed,0);
 counts=metrics({...base,state:'Approved',assignedRole:'IT'});
 assert.equal(counts.approved,1);
 assert.equal(counts['it-processing'],1);
 assert.equal(counts['ho-processing'],0);
 assert.equal(counts.closed,0);
 counts=metrics({...base,state:'In progress',assignedRole:'IT',fulfilment:{emailSentAt:'2026-11-16T00:00:00Z'}});
 assert.equal(counts.approved,1);
 assert.equal(counts['it-processing'],0);
 assert.equal(counts['ho-processing'],1);
 assert.equal(counts.closed,0);
 counts=metrics({...base,state:'Completed',fulfilment:{emailSentAt:'2026-11-16T00:00:00Z'}});
 assert.equal(counts.approved,1);
 assert.equal(counts['it-processing'],0);
 assert.equal(counts['ho-processing'],0);
 assert.equal(counts.closed,1);
 assert.equal(counts.active,0);
 counts=metrics({...base,state:'Rejected',step:'Closed'});
 assert.equal(counts.closed,0);
 assert.equal(counts.approved,0);
});
test('an approved ticket labelled Completed in its step stays processing until actually closed',()=>{
 const cards=operationsMetrics([{state:'Approved',step:'Completed'}],profile);
 assert.equal(cards.find(card=>card.key==='closed').value,0);
 assert.equal(cards.find(card=>card.key==='it-processing').value,1);
});

test('my queries card count matches tickets rather than number of replies',()=>{
 const data=[{id:'Q1',state:'Query',queryHistory:[{employeeId:profile.employeeId,responses:[{response:'Reply 1'},{response:'Reply 2'}]}]},{id:'Q2',state:'Approved',queryHistory:[{employeeId:profile.employeeId,responses:[{response:'Reply 3'}]}]}];
 const metric=operationsMetrics(data,profile).find(card=>card.key==='my-queries');
 assert.equal(metric.value,2);
 assert.equal(metric.value,metric.rows.length);
 assert.equal(metric.label,'Response');
});

test('query cards use the actual author and recipients, independent of role or ticket ownership',()=>{
 const data=[
  {id:'mine-unanswered',state:'Query',requesterId:'OTHER',queryTargetIds:['HR1'],queryHistory:[{employeeId:'IT1',targetIds:['HR1'],responses:[]}]},
  {id:'to-me-answered',state:'Approved',queryHistory:[{employeeId:'HR1',targetIds:['IT1'],responses:[{employeeId:'IT1',response:'Done'}]}]},
  {id:'same-role',state:'Query',requesterId:'IT1',queryHistory:[{employeeId:'IT2',by:profile.name,targetIds:['HR1'],responses:[]}]},
  {id:'legacy-mine',state:'In review',queryHistory:[{by:profile.name,targetIds:['HR1']}]},
 ];
 const cards=operationsMetrics(data,profile);
 assert.deepEqual(cards.find(card=>card.key==='my-queries').rows.map(ticket=>ticket.id),['mine-unanswered','legacy-mine']);
 assert.deepEqual(cards.find(card=>card.key==='queries').rows.map(ticket=>ticket.id),['to-me-answered']);
 const other=operationsMetrics(data,{employeeId:'IT2',role:'IT',name:'Other IT'});
 assert.deepEqual(other.find(card=>card.key==='my-queries').rows.map(ticket=>ticket.id),['same-role']);
 assert.equal(other.find(card=>card.key==='queries').value,0);
});
