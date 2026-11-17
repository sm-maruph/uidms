import test from 'node:test';
import assert from 'node:assert/strict';
import {submittedByMe} from './myRequests.js';

const profile={employeeId:'ME',name:'Same name'};
test('my requests includes submissions for myself and on behalf of others',()=>{
  assert.equal(submittedByMe({requesterId:'ME'},profile),true);
  assert.equal(submittedByMe({requesterId:'ME',newUserDetails:{people:[{employeeId:'OTHER'}]}},profile),true);
  assert.equal(submittedByMe({requesterId:'ME',transferChange:{employee:{employeeId:'OTHER'}}},profile),true);
});
test('review assignments, query recipients, beneficiaries and matching names do not establish submission',()=>{
  for(const ticket of [
    {requesterId:'OTHER',assignedEmployeeId:'ME'},
    {requesterId:'OTHER',queryTargetIds:['ME']},
    {requesterId:'OTHER',transferChange:{employee:{employeeId:'ME'}}},
    {requesterId:'OTHER',name:'Same name'},
    {name:'Same name'},
  ])assert.equal(submittedByMe(ticket,profile),false);
  assert.equal(submittedByMe({},null),false);
});
test('older tickets can identify their submitter through the initiator or requester profile',()=>{
  assert.equal(submittedByMe({transferChange:{initiatorId:'ME'}},profile),true);
  assert.equal(submittedByMe({requesterProfile:{employeeId:'ME'}},profile),true);
});
