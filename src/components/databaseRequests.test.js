import test from 'node:test';
import assert from 'node:assert/strict';
import {requestListItem,requestSubmittedDate} from './databaseRequests.js';

test('new database requests render a submitted date without mock display fields',()=>{
 const request=requestListItem({id:'sql-id',ticketNumber:'UID-2026-2000',typeCode:'reset',action:'Unlock / Reset',name:'New Employee',createdAt:'2026-11-21T18:30:00.000Z',state:'Pending',assignedRole:'CITO'});
 assert.equal(request.date,'Nov 22, 2026');assert.equal(request.initials,'NE');
 assert.equal(request.id,'UID-2026-2000');assert.equal(request.sqlId,'sql-id');assert.equal(request.action,'Unlock / Reset');
 assert.deepEqual(requestSubmittedDate(request).split(', '),['Nov 22','2026']);
 assert.deepEqual(request.queryHistory,[]);
});

test('missing or invalid timestamps retain a legacy date or display a truthful fallback',()=>{
 for(const createdAt of [undefined,null,'','invalid',{},123]){
  assert.equal(requestSubmittedDate({createdAt}),'Date unavailable');
  assert.equal(requestSubmittedDate({createdAt,date:'Nov 16, 2026'}),'Nov 16, 2026');
 }
 assert.equal(requestSubmittedDate({date:{}}),'Date unavailable');
 assert.equal(requestSubmittedDate({date:'   '}),'Date unavailable');
 assert.equal(requestSubmittedDate({createdAt:new Date('2026-11-22T00:00:00Z')}),'Nov 22, 2026');
});

test('mixed imported and live requests keep SQL identity, date, status and query routing',()=>{
 const queryHistory=[{targetIds:['BD1'],closedAt:null},{targetIds:['BD2'],closedAt:'2026-11-22'}];
 const request=requestListItem({id:'sql-id',ticketNumber:'UID-2026-2001',name:'Current Name',state:'Query',createdAt:'2026-11-22T00:00:00Z',demoRecord:{id:'old-id',name:'Old Name',state:'Pending',date:'Nov 1, 2025',initials:'CN',action:'ID reset / unlock',approvalHistory:[{status:'Approved'}]}},queryHistory);
 assert.equal(request.name,'Current Name');assert.equal(request.state,'Query');assert.equal(request.date,'Nov 22, 2026');assert.equal(request.id,'UID-2026-2001');
 assert.equal(request.action,'ID reset / unlock');assert.equal(request.initials,'CN');assert.equal(request.approvalHistory.length,1);
 assert.deepEqual(request.queryTargetIds,['BD1']);assert.equal(request.queryHistory,queryHistory);
 const movement=requestListItem({id:'sql-id',ticketNumber:'UID-2026-2002',typeCode:'movement',action:'Movement'});
 assert.equal(movement.action,'Branch / Department change');assert.equal(movement.date,'Date unavailable');
});
