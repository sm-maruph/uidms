import test from 'node:test';
import assert from 'node:assert/strict';
import {newUserManagerRole,canReviewNewUser,validateNewUserRouting,validateHrClearance,updateHrClearance,normalizeHrCheck,canReceiveCredentials} from './newUserWorkflow.js';
import {credentialVisible} from './fulfilment.js';
const person={name:'New employee',branch:'Dhanmondi Branch',department:'Operations'};
const ticket={action:'New ID creation (on behalf)',requesterId:'requester',assignedRole:'Branch manager',newUserDetails:{people:[person]}};
test('approval belongs to the employee branch or department, regardless of requester',()=>{
 assert.equal(canReviewNewUser(ticket,{role:'Branch manager',branch:person.branch}),true);
 assert.equal(canReviewNewUser(ticket,{role:'Branch manager',branch:'Other branch'}),false);
 const departmentTicket={...ticket,assignedRole:'Department head',newUserDetails:{people:[{...person,branch:'Head Office'}]}};
 assert.equal(canReviewNewUser(departmentTicket,{role:'Department head',department:'Operations'}),true);
 assert.equal(canReviewNewUser(departmentTicket,{role:'Department head',department:'IT'}),false);
 assert.equal(canReviewNewUser(ticket,{role:'HR'}),false);
});
test('batch requests cannot mix approving scopes',()=>{
 const people=[person,{...person,branch:'Other branch'}];
 assert.ok(validateNewUserRouting({people}));
 assert.ok(validateNewUserRouting({people,approvalRole:'Department head'}));
 assert.equal(validateNewUserRouting({people:[{...person,branch:'Head Office'},{...person,branch:'Corporate Office'}]}),'');
 assert.ok(validateNewUserRouting({people:[{...person,branch:'Head Office'},{...person,branch:'Head Office',department:'IT'}]}));
 assert.ok(validateNewUserRouting({people:[]}));
});
test('HR approval requires both references and completed police clearance or a written recommendation',()=>{
 assert.equal(validateHrClearance(ticket,[{police:'Completed',reference:'Both checked'}]),'');
 assert.ok(validateHrClearance(ticket,[]));
 for(const reference of ['One checked','Pending'])assert.ok(validateHrClearance(ticket,[{police:'Completed',reference}]));
 assert.ok(validateHrClearance(ticket,[{police:'Pending',reference:'Both checked'}]));
 assert.ok(validateHrClearance(ticket,[{police:'Special recommendation',reference:'Both checked',recommendation:'   '}]));
 assert.equal(validateHrClearance(ticket,[{police:'Special recommendation',reference:'Both checked',recommendation:'Verified by HR; proceed under recommendation'}]),'');
});
test('HR must verify every employee in a batch',()=>{
 const batch={...ticket,newUserDetails:{people:[person,{...person,name:'Second employee'}]}};
 assert.ok(validateHrClearance(batch,[{police:'Completed',reference:'Both checked'}]));
});
test('HR can revise statuses at every workflow stage without changing approval or custody',()=>{
 const actor={employeeId:'HR1',name:'HR reviewer',role:'HR'};
 for(const state of ['Pending','In review','Query','Approved','In progress','Completed','Rejected']){
  const current={...ticket,state,assignedRole:'IT',custodian:{employeeId:'M1'},approvalHistory:[{status:'Approved',role:'HR'}]};
  const updated=updateHrClearance(current,actor,[{police:'Pending',reference:'One checked'}],'2026-11-16T06:00:00Z','192.0.2.5');
  assert.equal(updated.state,state);
  assert.equal(updated.assignedRole,'IT');
  assert.deepEqual(updated.custodian,current.custodian);
  assert.deepEqual(updated.approvalHistory,current.approvalHistory);
  assert.equal(updated.hrClearance.checks[0].reference,'One checked');
  assert.equal(updated.hrClearanceHistory[0].ip,'192.0.2.5');
  const revised=updateHrClearance(updated,actor,[{police:'Completed',reference:'Both checked'}]);
  assert.equal(revised.hrClearanceHistory.length,2);
  assert.equal(revised.hrClearanceHistory[1].previousChecks[0].police,'Pending');
 }
});
test('only HR may save and special recommendations require text even on status-only updates',()=>{
 for(const role of ['User','IT','CITO','COO','Branch manager','Super Admin'])assert.throws(()=>updateHrClearance(ticket,{role,employeeId:'1'},[{police:'Completed',reference:'Both checked'}]),/Only HR/);
 assert.throws(()=>updateHrClearance(ticket,{role:'HR',employeeId:'HR1'},[{police:'Special recommendation',reference:'Pending',recommendation:' '}]),/recommendation/);
 assert.equal(validateHrClearance(ticket,[{police:'Pending',reference:'Pending'}],{forApproval:false}),'');
});
test('legacy clearances retain their meaning and obsolete recommendation text is removed',()=>{
 assert.deepEqual(normalizeHrCheck({police:'Clear',reference:'Clear'}),{police:'Completed',reference:'Both checked',recommendation:''});
 assert.equal(normalizeHrCheck({police:'Pending',exception:true,specialRemarks:'Urgent joining'}).police,'Special recommendation');
 assert.equal(normalizeHrCheck({police:'Completed',recommendation:'Old recommendation'}).recommendation,'');
 assert.ok(validateHrClearance(ticket,[{police:'Not clear',reference:'Clear'}]));
});
test('new user credentials go only to the recorded custodian and expire',()=>{
 const completed={...ticket,state:'Completed',custodian:{employeeId:'manager'}};
 assert.equal(canReceiveCredentials(completed,{employeeId:'requester'}),false);
 assert.equal(canReceiveCredentials(completed,{employeeId:'other-manager',role:'Branch manager',branch:person.branch}),false);
 assert.equal(credentialVisible({expiresAt:200},completed,{employeeId:'manager'},100),true);
 assert.equal(credentialVisible({expiresAt:200},completed,{employeeId:'manager'},200),false);
 assert.equal(canReceiveCredentials({...completed,custodian:null},{employeeId:'requester'}),false);
 assert.equal(canReceiveCredentials({action:'ID upgrade',requesterId:'requester'},{employeeId:'requester'}),true);
});

test('office routing and Gulshan exceptions are automatic and ignore manual approval roles',()=>{
 const role=(branch,department)=>newUserManagerRole({approvalRole:'Department head',people:[{branch,department}]});
 assert.equal(role('Agrabad Branch','Operations'),'Branch manager');
 assert.equal(role('Head Office','IT Department'),'Department head');
 assert.equal(role('Corporate Office','Operations'),'Department head');
 assert.equal(role('Gulshan Branch','Operations'),'Branch manager');
 for(const department of ['Card Center','Card Centre','Digital Banking','Call Center','Call Centre'])assert.equal(role('Gulshan Branch',department),'Department head');
 assert.equal(role('Agrabad Branch','Card Center'),'Branch manager');
 assert.ok(validateNewUserRouting({people:[{branch:'Gulshan Branch',department:'Operations'},{branch:'Gulshan Branch',department:'Card Center'}]}));
 const cardTicket={...ticket,assignedRole:'Department head',newUserDetails:{people:[{branch:'Gulshan Branch',department:'Card Center'}]}};
 assert.equal(canReviewNewUser(cardTicket,{role:'Department head',department:'Card Center'}),true);
 assert.equal(canReviewNewUser(cardTicket,{role:'Department head',department:'Digital Banking'}),false);
 assert.equal(canReviewNewUser({...cardTicket,assignedRole:'Branch manager'},{role:'Branch manager',branch:'Gulshan Branch'}),false);
});
