import test from 'node:test';
import assert from 'node:assert/strict';
import {actingState,dhakaInputDate,actingPayload} from './actingAssignments.js';
import {canUseActingAppointments,hasPortalRole,savePortalUser,canManageUsers,canManageApprovers,canSetPortalRole} from './portalRoles.js';
import {canReviewDatabaseTicket} from './workflowReview.js';
import {canRequestIdDeletion,canRequestBranchTransfer} from './requestPermissions.js';
test('acting status and Dhaka time conversion use the selected interval precisely',()=>{
 const row={StartsAt:'2026-11-23T03:00:00Z',EndsAt:'2026-11-23T04:00:00Z'};
 assert.equal(actingState(row,Date.parse('2026-11-23T02:59:59Z')),'Scheduled');assert.equal(actingState(row,Date.parse(row.StartsAt)),'Active');assert.equal(actingState(row,Date.parse(row.EndsAt)),'Expired');assert.equal(actingState({...row,RevokedAt:row.StartsAt},Date.parse(row.StartsAt)),'Ended');
 assert.equal(dhakaInputDate(new Date(row.StartsAt)),'2026-11-23T09:00');
 assert.deepEqual(actingPayload({PrincipalId:'principal',Role:'IT',ScopeId:null},' BD01 ','2026-11-23T09:00','2026-11-23T10:00'),{principalId:'principal',employeeId:'BD01',role:'IT',scopeId:null,startsAt:row.StartsAt.replace('Z','.000Z'),endsAt:row.EndsAt.replace('Z','.000Z')});
 assert.throws(()=>actingPayload({PrincipalId:'p'},'BD1','2026-11-23T10:00','2026-11-23T09:00'),/after the start/);
});
test('own managers and absent IT/CITO retain leave-cover navigation; acting IT gets IT functions',()=>{
 assert.equal(canUseActingAppointments({role:'User',managedScopes:[{Role:'Department head'}]}),true);assert.equal(canUseActingAppointments({role:'User',baseRole:'CITO'}),true);assert.equal(canUseActingAppointments({role:'User'}),false);
 assert.equal(hasPortalRole({role:'CITO',roles:['User','IT','CITO']},'IT'),true);assert.equal(canManageUsers('Admin'),true);assert.equal(canManageApprovers('Admin'),true);
 const actingIt={role:'CITO',roles:['User','IT','CITO'],department:'Operations'};assert.equal(canRequestIdDeletion(actingIt.department,actingIt),true);assert.equal(canRequestBranchTransfer(actingIt),true);
 const person={employeeId:'BD1',name:'Person',role:'User'};
 assert.throws(()=>savePortalUser([person],{role:'Admin'},{...person,role:'Admin'},'BD1'),/Only Super Admin/);assert.equal(savePortalUser([person],{role:'Admin'},{...person,role:'CITO'},'BD1')[0].role,'CITO');
 assert.equal(canSetPortalRole('Admin','Admin','Admin'),true);assert.equal(canSetPortalRole('Admin','Admin','User'),true);assert.equal(canSetPortalRole('Admin','Admin','Super Admin'),false);assert.equal(canSetPortalRole('Admin','User','Admin'),false);
});
test('server-computed recommendation authority overrides a cached permanent assignment',()=>{
 const ticket={state:'Pending',requesterId:'BD2',requesterUserId:'requester',assignedUserId:'permanent',reviewableByMe:false};
 assert.equal(canReviewDatabaseTicket(ticket,{id:'permanent',employeeId:'BD1',role:'Department head'}),false);
 assert.equal(canReviewDatabaseTicket({...ticket,reviewableByMe:true},{id:'acting',employeeId:'BD3',role:'User'}),true);
 assert.equal(canReviewDatabaseTicket({...ticket,reviewableByMe:true},{id:'requester',employeeId:'BD2',role:'IT'}),false);
});
