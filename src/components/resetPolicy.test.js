import test from 'node:test';
import assert from 'node:assert/strict';
import {requiresBusinessJustification,resetApprovalFlow} from './resetPolicy.js';
import {awaitsApproval} from './pendingApprovals.js';
import {readyForFulfilment} from './fulfilment.js';
test('reset/unlock skips justification and routes to CITO before processing',()=>{
 assert.equal(requiresBusinessJustification('ID reset / unlock'),false);
 assert.equal(requiresBusinessJustification('ID upgrade'),true);
 assert.deepEqual(resetApprovalFlow(),['Requester','CITO']);
 const ticket={action:'ID reset / unlock',state:'Pending',assignedRole:'CITO'};
 assert.equal(awaitsApproval(ticket,{employeeId:'CITO1',role:'CITO'}),true);
 assert.equal(awaitsApproval(ticket,{employeeId:'IT1',role:'IT'}),false);
 assert.equal(awaitsApproval(ticket,{employeeId:'BM1',role:'Branch manager',branch:'Dhanmondi Branch'}),false);
 assert.equal(readyForFulfilment({...ticket,state:'Approved'}),true);
});
