import test from 'node:test';
import assert from 'node:assert/strict';
import {awaitsApproval} from './pendingApprovals.js';

test('sidebar count includes pending and in-review requests currently assigned to this role',()=>{
  const profile={employeeId:'IT1',role:'IT'};
  const ticket={action:'ID upgrade',state:'Pending',assignedRole:'IT'};
  assert.equal(awaitsApproval(ticket,profile),true);
  assert.equal(awaitsApproval({...ticket,state:'In review'},profile),true);
  for(const state of ['Query','Approved','Completed','Rejected','In progress'])assert.equal(awaitsApproval({...ticket,state},profile),false);
  assert.equal(awaitsApproval(ticket,{...profile,role:'CITO'}),false);
});
test('sidebar count respects branch and new-user department scope',()=>{
  const manager={employeeId:'M1',role:'Branch manager',branch:'Agrabad Branch'};
  const ticket={action:'ID upgrade',state:'Pending',assignedRole:'Branch manager',branch:'Agrabad Branch'};
  assert.equal(awaitsApproval(ticket,manager),true);
  assert.equal(awaitsApproval({...ticket,branch:'Other'},manager),false);
  const head={employeeId:'H1',role:'Department head',department:'Operations'};
  const newUser={...ticket,action:'New ID creation (on behalf)',assignedRole:'Department head',newUserDetails:{people:[{branch:'Corporate Office',department:'Operations'}]}};
  assert.equal(awaitsApproval(newUser,head),true);
  assert.equal(awaitsApproval(newUser,{...head,department:'IT Department'}),false);
});
test('employee movement review is distinct from manager approval and counts destination approver',()=>{
  const ticket={action:'Branch / Department change',state:'Pending',assignedRole:'Branch manager',transferChange:{stage:'approval',employee:{employeeId:'E1'},fromBranch:'Agrabad Branch',toBranch:'Dhanmondi Branch'}};
  assert.equal(awaitsApproval(ticket,{employeeId:'M1',role:'Branch manager',branch:'Dhanmondi Branch'}),true);
  assert.equal(awaitsApproval(ticket,{employeeId:'M2',role:'Branch manager',branch:'Agrabad Branch'}),false);
  assert.equal(awaitsApproval({...ticket,assignedRole:null,transferChange:{...ticket.transferChange,stage:'employee'}},{employeeId:'E1',role:'User'}),false);
  assert.equal(awaitsApproval(ticket,null),false);
});
