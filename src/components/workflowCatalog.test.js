import test from 'node:test';
import assert from 'node:assert/strict';
import {currentWorkflowTypes,olderWorkflowTypes,similarApproverAssignments} from './workflowCatalog.js';
test('configuration lists live forms and keeps used legacy workflows separate',()=>{
 const catalog={requestTypes:[{Code:'movement',Name:'Branch / Department change'},{Code:'batch-access',Name:'Batch access request'},{Code:'new-id',Name:'New ID creation'},{Code:'branch-transfer',Name:'Branch transfer',ExistingRequests:5}],legacyRequestTypes:[]};
 assert.deepEqual(currentWorkflowTypes(catalog).map(row=>row.Name),['Branch / Department Transfer']);assert.deepEqual(olderWorkflowTypes(catalog).map(row=>row.Code),['branch-transfer']);
});
test('similar department names offer an explicit assignment suggestion without assuming routing equivalence',()=>{
 const scope={ScopeId:'it-dept',Kind:'department',Name:'IT Department',UserId:null};
 const assigned={ScopeId:'it',Kind:'department',Name:'IT',UserId:'head',UserName:'IT head',Active:true};
 assert.deepEqual(similarApproverAssignments([scope,assigned],scope),[assigned]);
 assert.deepEqual(similarApproverAssignments([scope,assigned],{...scope,UserId:'existing'}),[]);
 assert.deepEqual(similarApproverAssignments([scope,assigned,{...assigned,ScopeId:'another',Name:'IT Dept',UserId:'different'}],scope),[]);
 assert.deepEqual(similarApproverAssignments([scope,{...assigned,Name:'Operations'}],scope),[]);
});
