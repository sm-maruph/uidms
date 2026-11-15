import test from 'node:test';
import assert from 'node:assert/strict';
import {newUserManagerRole,canReviewNewUser,validateNewUserRouting,validateHrClearance,canReceiveCredentials} from './newUserWorkflow.js';
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
test('HR requires reference clearance and either police clearance or a documented pending exception',()=>{
 assert.equal(validateHrClearance(ticket,[{police:'Clear',reference:'Clear'}]),'');
 assert.ok(validateHrClearance(ticket,[]));
 assert.ok(validateHrClearance(ticket,[{police:'Clear',reference:'Pending'}]));
 assert.ok(validateHrClearance(ticket,[{police:'Pending',reference:'Clear'}]));
 assert.ok(validateHrClearance(ticket,[{police:'Pending',reference:'Clear',exception:true,specialRemarks:'   '}]));
 assert.equal(validateHrClearance(ticket,[{police:'Pending',reference:'Clear',exception:true,specialRemarks:'Urgent joining; police verification pending'}]),'');
 assert.ok(validateHrClearance(ticket,[{police:'Not clear',reference:'Clear',exception:true,specialRemarks:'Urgent'}]));
});
test('HR must verify every employee in a batch',()=>{
 const batch={...ticket,newUserDetails:{people:[person,{...person,name:'Second employee'}]}};
 assert.ok(validateHrClearance(batch,[{police:'Clear',reference:'Clear'}]));
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
