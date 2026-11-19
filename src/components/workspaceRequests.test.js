import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceRequests} from './workspaceRequests.js';

const profile={employeeId:'ME',role:'User',branch:'Dhanmondi Branch'};
const rows=[
 {id:'T1',requesterId:'ME',name:'My request',action:'ID reset / unlock',state:'Pending',assignedRole:'CITO',createdAt:'2026-11-18'},
 {id:'T2',requesterId:'OTHER',name:'Other request',action:'ID upgrade',state:'Query',queryTargetIds:['ME'],createdAt:'2026-11-19'},
];
test('initial unauthenticated render has an empty request scope',()=>{assert.deepEqual(workspaceRequests(rows,{profile:null,page:'Overview'}),[]);});
test('My requests includes submissions only; the user overview also includes received queries',()=>{
 assert.deepEqual(workspaceRequests(rows,{profile,page:'My requests'}).map(row=>row.id),['T1']);
 assert.deepEqual(workspaceRequests(rows,{profile,page:'Overview'}).map(row=>row.id),['T2','T1']);
});
test('scope respects managerial branch and personal approval history',()=>{
 const manager={...profile,role:'Branch manager'};
 const tickets=[{id:'A',assignedRole:'Branch manager',branch:'Dhanmondi Branch'},{id:'B',assignedRole:'Branch manager',branch:'Other Branch'},{id:'C',assignedRole:'IT',approvalHistory:[{employeeId:'ME'}]}];
 assert.deepEqual(workspaceRequests(tickets,{profile:manager,page:'Approvals',sort:'ticket'}).map(row=>row.id),['A','C']);
});
test('search supports renamed request labels and sorting does not mutate source data',()=>{
 assert.deepEqual(workspaceRequests(rows,{profile,page:'My requests',search:'Unlock / Reset'}).map(row=>row.id),['T1']);
 assert.deepEqual(workspaceRequests(rows,{profile,page:'Overview',sort:'oldest'}).map(row=>row.id),['T1','T2']);
 assert.deepEqual(rows.map(row=>row.id),['T1','T2']);
});
