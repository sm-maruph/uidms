import test from 'node:test';
import assert from 'node:assert/strict';
import {canManageApprovers} from './portalRoles.js';
import {canReviewDatabaseTicket} from './workflowReview.js';
import {awaitsApproval} from './pendingApprovals.js';
import {workspaceRequests} from './workspaceRequests.js';
import {queryRecipientsFor} from './reviewActions.js';

const profile={id:'assigned',employeeId:'BD001',role:'User',branchId:'other',departmentId:'other'};
const ticket={id:'ticket',sqlId:'sql-ticket',state:'Pending',requesterId:'BD002',requesterUserId:'requester',assignedRole:'Branch manager',assignedUserId:'assigned',assignedBranchId:'branch'};
test('only administrators and IT see assignment management',()=>{
 for(const role of ['User','Branch manager','Department head','HR','IT','CITO','COO','Platform Admin','Super Admin'])assert.equal(canManageApprovers(role),['IT','Platform Admin','Super Admin'].includes(role));
});
test('an assigned ordinary User sees their approval and badge without a role change',()=>{
 assert.equal(canReviewDatabaseTicket(ticket,profile),true);assert.equal(awaitsApproval(ticket,profile),true);
 assert.equal(workspaceRequests([ticket],{profile,page:'Approvals'}).length,1);
 assert.equal(workspaceRequests([ticket],{profile,page:'My requests'}).length,0);
 assert.equal(canReviewDatabaseTicket(ticket,{...profile,id:'other',role:'Branch manager',branchId:'branch'}),false);
 assert.equal(canReviewDatabaseTicket({...ticket,requesterUserId:profile.id},profile),false);
 assert.equal(canReviewDatabaseTicket({...ticket,subjectUserId:profile.id},profile),false);
 assert.equal(canReviewDatabaseTicket({...ticket,state:'Completed'},profile),false);
});
test('actual waiting detail assignment takes precedence and query options use authorized participants',()=>{
 const current={...ticket,currentPosition:2,workflowSteps:[{position:2,status:'Waiting',role:'Department head',assignedUserId:'another'}]};
 assert.equal(canReviewDatabaseTicket(current,profile),false);
 const participants=[{id:'requester',employeeId:'BD002',name:'Requester',role:'User'}];
 assert.deepEqual(queryRecipientsFor([],profile,{...ticket,queryParticipants:participants}),participants);
 assert.deepEqual(queryRecipientsFor([],profile,{...ticket,queryParticipants:[]}),[]);
});
