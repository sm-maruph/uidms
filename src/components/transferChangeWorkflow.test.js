import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANGE_REQUEST,validateChangeInitiation,destinationRole,canReviewChange,canViewChange,accessSelection,selectedChangeAccess,changedAccess,validateEmployeeChange,changeAccessProfile} from './transferChangeWorkflow.js';
import {canReceiveCredentials} from './newUserWorkflow.js';
const employee={employeeId:'E1',systemId:'E1',name:'Employee',branch:'Agrabad Branch',department:'Operations',access:{systemRoles:{ICBS:['Entry']},enabledSystems:['WBO'],otherAccess:['AD ID','Email','MS Office']}};
const change={kind:'Branch',employeeId:'E1',fromBranch:'Agrabad Branch',toBranch:'Dhanmondi Branch',fromDepartment:'Operations',toDepartment:'Operations',justification:'New assignment',employee,stage:'employee'};
const ticket={id:'CHANGE-1',action:CHANGE_REQUEST,requesterId:'HR1',transferChange:change,assignedRole:null};
test('only IT and HR can initiate a known employee movement',()=>{
 for(const role of ['IT','HR'])assert.equal(validateChangeInitiation(change,{role},employee),'');
 for(const role of ['User','Branch manager','Department head','CITO','COO','Super Admin'])assert.ok(validateChangeInitiation(change,{role},employee));
 assert.ok(validateChangeInitiation(change,{role:'IT'},null));
 assert.ok(validateChangeInitiation({...change,fromBranch:'Wrong branch'},{role:'IT'},employee));
 assert.ok(validateChangeInitiation({...change,toBranch:employee.branch},{role:'IT'},employee));
 assert.ok(validateChangeInitiation({...change,justification:'  '},{role:'IT'},employee));
});
test('department movement requires a changed department and routes to its head',()=>{
 const department={...change,kind:'Department',toBranch:employee.branch,toDepartment:'IT Department'};
 assert.equal(validateChangeInitiation(department,{role:'HR'},employee),'');
 assert.equal(destinationRole(department),'Department head');
 assert.ok(validateChangeInitiation({...department,toDepartment:employee.department},{role:'HR'},employee));
});
test('destination routing includes Head Office and Gulshan exceptions',()=>{
 assert.equal(destinationRole(change),'Branch manager');
 assert.equal(destinationRole({...change,toBranch:'Head Office',toDepartment:'IT Department'}),'Department head');
 for(const toDepartment of ['Card Center','Digital Banking','Call Centre'])assert.equal(destinationRole({...change,toBranch:'Gulshan Branch',toDepartment}),'Department head');
});
test('employee stage cannot be approved or continued by another employee',()=>{
 const selection=accessSelection(employee,change);
 assert.equal(canReviewChange(ticket,{role:'Branch manager',branch:change.toBranch}),false);
 assert.ok(validateEmployeeChange(ticket,{employeeId:'OTHER'},selection,'Need access'));
 assert.equal(validateEmployeeChange(ticket,employee,selection,'Need access'),'');
});
test('role changes and additional systems require their own justification',()=>{
 const selection=accessSelection(employee,change);
 selection.newAccess.ICBS=['Supervisor'];
 selection.newAccessSystems.BEFTN=true;selection.newAccess.BEFTN=['Maker'];selection.similarIds.BEFTN='EXAMPLE';
 assert.deepEqual(changedAccess(employee,selection).map(row=>row.system).sort(),['BEFTN','ICBS']);
 assert.ok(validateEmployeeChange(ticket,employee,selection,'Destination duties',{}));
 assert.ok(validateEmployeeChange(ticket,employee,selection,'Destination duties',{ICBS:'Supervise'}));
 assert.equal(validateEmployeeChange(ticket,employee,selection,'Destination duties',{ICBS:'Supervise',BEFTN:'Payment processing'}),'');
 assert.ok(validateEmployeeChange({...ticket,transferChange:{...change,stage:'approval'}},employee,selection,'Destination duties',{ICBS:'Supervise',BEFTN:'Payment processing'}));
});
test('only the destination manager or matching department head can review',()=>{
 const approval={...ticket,assignedRole:'Branch manager',transferChange:{...change,stage:'approval'}};
 assert.equal(canReviewChange(approval,{role:'Branch manager',branch:'Dhanmondi Branch'}),true);
 assert.equal(canReviewChange(approval,{role:'Branch manager',branch:'Agrabad Branch'}),false);
 const department={...approval,assignedRole:'Department head',transferChange:{...approval.transferChange,kind:'Department',toDepartment:'IT Department'}};
 assert.equal(canReviewChange(department,{role:'Department head',department:'IT Department'}),true);
 assert.equal(canReviewChange(department,{role:'Department head',department:'Operations'}),false);
 for(const role of ['IT','CITO','COO'])assert.equal(canReviewChange({...approval,assignedRole:role},{role}),true);
});
test('final access replaces selected system roles and preserves AD, email and software',()=>{
 const selection=accessSelection(employee,change);
 assert.equal(selectedChangeAccess(selection).some(row=>['AD ID','Email'].includes(row.system)),false);
 selection.newAccess.ICBS=['Supervisor'];selection.newAccessSystems.WBO=false;
 const access=changeAccessProfile({...ticket,transferDetails:selection});
 assert.deepEqual(access.systemRoles.ICBS,['Supervisor']);
 assert.equal(access.enabledSystems.includes('WBO'),false);
 for(const system of ['AD ID','Email','MS Office'])assert.equal(access.otherAccess.includes(system),true);
 assert.deepEqual(employee.access.systemRoles.ICBS,['Entry']);
});
test('movement credentials belong to employee rather than initiating HR/IT',()=>{
 assert.equal(canReceiveCredentials(ticket,employee),true);
 assert.equal(canReceiveCredentials(ticket,{employeeId:'HR1'}),false);
});

test('movement visibility is restricted to the employee, branch, department and workflow participants',()=>{
 assert.equal(canViewChange(ticket,employee),true);
 assert.equal(canViewChange(ticket,{employeeId:'OTHER',role:'User',branch:employee.branch,department:employee.department}),false);
 for(const branch of [change.fromBranch,change.toBranch])assert.equal(canViewChange(ticket,{employeeId:'MANAGER',role:'Branch manager',branch}),true);
 assert.equal(canViewChange(ticket,{employeeId:'MANAGER',role:'Branch manager',branch:'Gulshan Branch'}),false);
 for(const department of [change.fromDepartment,'IT Department'])assert.equal(canViewChange({...ticket,transferChange:{...change,toDepartment:'IT Department'}},{employeeId:'HEAD',role:'Department head',department}),true);
 assert.equal(canViewChange(ticket,{employeeId:'HEAD',role:'Department head',department:'Treasury'}),false);
 for(const role of ['IT','HR'])assert.equal(canViewChange(ticket,{employeeId:role,role}),true);
 assert.equal(canViewChange(ticket,{employeeId:'CITO',role:'CITO'}),false);
 assert.equal(canViewChange({...ticket,assignedRole:'CITO'},{employeeId:'CITO',role:'CITO'}),true);
 assert.equal(canViewChange(ticket,null),false);
});
