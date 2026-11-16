import test from 'node:test';
import assert from 'node:assert/strict';
import {queriesRaisedBy,queriesForUser,respondToQuery} from './queryInbox.js';

const cito={employeeId:'C1',role:'CITO',name:'CITO Reviewer'};
const ticket={id:'T1',state:'Query',assignedRole:null,queryTargetIds:['C1'],queryReturnRole:'COO',queryReturnStep:'COO final approval',queryHistory:[
 {employeeId:'C1',by:'CITO Reviewer',role:'CITO',message:'IT: confirm old access removal.',targetIds:['IT1'],responses:[{employeeId:'IT1',responseBy:'IT Reviewer',response:'Old access removed.'}]},
 {employeeId:'CO1',by:'COO Reviewer',role:'COO',message:'CITO: confirm the effective date.',targetIds:['C1'],responses:[]},
]};
test('CITO authored and received threads stay separate even on the same ticket',()=>{
 const sent=queriesRaisedBy([ticket],cito);
 const received=queriesForUser([ticket],cito.employeeId);
 assert.equal(sent.length,1);
 assert.equal(sent[0].query.message,'IT: confirm old access removal.');
 assert.equal(sent[0].query.responses[0].response,'Old access removed.');
 assert.equal(received.length,1);
 assert.equal(received[0].query.message,'CITO: confirm the effective date.');
 assert.equal(received[0].pending,true);
});
test('CITO can reply to the COO query without modifying its earlier question or replies',()=>{
 const updated=respondToQuery(ticket,1,cito,'Effective 16 November.');
 assert.notEqual(updated,ticket);
 assert.deepEqual(updated.queryHistory[0],ticket.queryHistory[0]);
 assert.equal(updated.queryHistory[1].responses[0].response,'Effective 16 November.');
 assert.equal(updated.assignedRole,'COO');
 assert.equal(queriesForUser([updated],cito.employeeId)[0].pending,false);
 assert.equal(queriesRaisedBy([updated],cito)[0].query.responses.length,1);
});
test('users cannot reply to someone else’s query or reply twice',()=>{
 assert.equal(respondToQuery(ticket,1,{employeeId:'IT1'},'Wrong recipient'),ticket);
 assert.equal(respondToQuery(ticket,0,cito,'Wrong thread'),ticket);
 const updated=respondToQuery(ticket,1,cito,'Reply');
 assert.equal(respondToQuery(updated,1,cito,'Duplicate reply'),updated);
});
