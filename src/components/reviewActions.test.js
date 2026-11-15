import test from 'node:test';
import assert from 'node:assert/strict';
import { queryRecipientsFor, validateReviewQuery, approvalRecommendation } from './reviewActions.js';

const actor={employeeId:'IT1',role:'IT'};
const users=[actor,{employeeId:'U1',role:'User',branch:'Dhanmondi Branch',department:'Operations'},{employeeId:'U2',role:'User',branch:'Dhanmondi Branch'},{employeeId:'M1',role:'Branch manager',branch:'Dhanmondi Branch'},{employeeId:'M2',role:'Branch manager',branch:'Agrabad Branch'},{employeeId:'HR1',role:'HR'},{employeeId:'IT2',role:'IT'},{employeeId:'C1',role:'CITO'},{employeeId:'CO1',role:'COO'},{employeeId:'D1',role:'Department head',department:'IT'},{employeeId:'D2',role:'Department head',department:'Operations'}];
const ticket={requesterId:'U1',branch:'Dhanmondi Branch',requesterProfile:users[1]};
test('IT can query the requester and relevant manager, excluding other end users',()=>{
  assert.deepEqual(queryRecipientsFor(users,actor,ticket).map(user=>user.employeeId),['U1','M1']);
});
test('CITO can query IT and the relevant manager, excluding unrelated users',()=>{
  assert.deepEqual(queryRecipientsFor(users,users.find(user=>user.role==='CITO'),ticket).map(user=>user.employeeId),['IT1','U1','M1']);
});
test('manager can query only the requester',()=>{
  assert.deepEqual(queryRecipientsFor(users,users.find(user=>user.employeeId==='M1'),ticket).map(user=>user.employeeId),['U1']);
});
test('head office and department changes select the relevant department head',()=>{
  const office={...ticket,branch:'Corporate Office',requesterProfile:{department:'IT'}};
  assert.deepEqual(queryRecipientsFor(users,actor,office).map(user=>user.employeeId),['U1','D1']);
  const movement={...ticket,action:'Branch / Department change',transferChange:{kind:'Department',toBranch:'Corporate Office',toDepartment:'IT'}};
  assert.deepEqual(queryRecipientsFor(users,actor,movement).map(user=>user.employeeId),['U1','D1']);
});
test('recorded IT approver takes precedence over another IT account',()=>{
  const recorded={...ticket,approvalHistory:[{role:'IT',employeeId:'IT2'}]};
  assert.deepEqual(queryRecipientsFor(users,users.find(user=>user.role==='CITO'),recorded).map(user=>user.employeeId),['U1','M1','IT2']);
});
test('queries require one eligible recipient and at most 350 characters',()=>{
  assert.equal(validateReviewQuery({targetIds:['M1'],message:'a'.repeat(350)},users,actor,ticket),'');
  assert.equal(validateReviewQuery({targetIds:['U1'],message:'Please clarify.'},users,actor,ticket),'');
  for(const details of [{targetIds:[],message:'Question'},{targetIds:['M1','HR1'],message:'Question'},{targetIds:['U2'],message:'Question'},{targetIds:['M2'],message:'Question'},{targetIds:['IT2'],message:'Question'},{targetIds:['C1'],message:'Question'},{targetIds:['M1'],message:' '},{targetIds:['M1'],message:'a'.repeat(351)}])assert.ok(validateReviewQuery(details,users,actor,ticket));
});
test('approval defaults to Recommended and preserves an entered recommendation',()=>{
  assert.equal(approvalRecommendation('  '),'Recommended');
  assert.equal(approvalRecommendation(undefined),'Recommended');
  assert.equal(approvalRecommendation('  Access is required for daily duties.  '),'Access is required for daily duties.');
});
