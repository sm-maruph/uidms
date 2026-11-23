import test from 'node:test';
import assert from 'node:assert/strict';
import {configuredWorkflowRoles,ticketApprovalFlow} from './ticketWorkflow.js';
import {canReviewDatabaseTicket} from './workflowReview.js';
import {requestFromDatabase,requestListItem} from './databaseRequests.js';

test('SQL request journeys use their actual saved steps for reset and other services',()=>{
 for(const action of ['ID reset / unlock','New ID creation (on behalf)','System ID deactivation']){
  const ticket={sqlId:'sql',action,typeCode:'reset',workflowSteps:[{role:'CITO',position:1},{role:'COO',position:2}]};
  assert.deepEqual(ticketApprovalFlow(ticket),['Requester','CITO','COO']);
 }
 assert.deepEqual(ticketApprovalFlow({sqlId:'sql',typeCode:'movement',workflowSteps:[{role:'Department head',position:1},{role:'CITO',position:2}]}),['Requester','Employee review','Department head','CITO']);
 assert.deepEqual(ticketApprovalFlow({sqlId:'sql',action:'ID reset / unlock',assignedRole:'HR'}),['Requester','HR']);
});

test('database detail mapping retains waiting steps separately from completed approval history',()=>{
 const steps=[{position:1,role:'CITO',status:'Approved'},{position:2,role:'COO',status:'Waiting'}];
 const ticket=requestFromDatabase({id:'UID-1',sqlId:'sql',action:'ID reset / unlock'},{id:'sql',details:{},people:[],items:[],approvalHistory:steps,workflowSteps:steps,assignedRole:'COO',currentPosition:2});
 assert.equal(ticket.workflowSteps.length,2);assert.equal(ticket.approvalHistory.length,1);assert.deepEqual(ticketApprovalFlow(ticket),['Requester','CITO','COO']);
 const row=requestListItem({id:'sql',ticketNumber:'UID-1',assignedRole:'HR',state:'Pending',demoRecord:{step:'COO final approval'}});assert.equal(row.step,'HR review');
});

test('workflow editor loads the actual saved order rather than deriving it from IncludesHr',()=>{
 assert.deepEqual(configuredWorkflowRoles({workflowSteps:[{TypeCode:'reset',Position:2,Role:'IT'},{TypeCode:'reset',Position:1,Role:'COO'},{TypeCode:'upgrade',Position:1,Role:'HR'}]},'reset'),['COO','IT']);
});

test('review actions follow the current waiting SQL step and enforce scope and separation of duties',()=>{
 const profile={id:'reviewer',employeeId:'BD2',role:'HR',branchId:'branch',departmentId:'dept'};
 const ticket={sqlId:'sql',requesterId:'BD1',requesterUserId:'requester',state:'In review',assignedRole:'HR',currentPosition:2,workflowSteps:[{position:1,role:'CITO',status:'Approved'},{position:2,role:'HR',status:'Waiting'}]};
 assert.equal(canReviewDatabaseTicket(ticket,profile),true);
 for(const patch of [{role:'CITO'},{employeeId:'BD1'},{id:'requester'}])assert.equal(canReviewDatabaseTicket(ticket,{...profile,...patch}),false);
 for(const state of ['Query','Approved','IT processing','HO processing','Completed','Employee review'])assert.equal(canReviewDatabaseTicket({...ticket,state},profile),false);
 assert.equal(canReviewDatabaseTicket({...ticket,workflowSteps:[{position:2,role:'HR',status:'Approved'}]},profile),false);
 assert.equal(canReviewDatabaseTicket({...ticket,subjectUserId:profile.id},profile),false);
 const manager={...ticket,assignedRole:'Branch manager',workflowSteps:[{position:2,role:'Branch manager',status:'Waiting',branchId:'branch'}]};
 assert.equal(canReviewDatabaseTicket(manager,{...profile,role:'Branch manager'}),true);
 assert.equal(canReviewDatabaseTicket(manager,{...profile,role:'Branch manager',branchId:'other'}),false);
});
