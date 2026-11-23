import { canRequestBranchTransfer } from './requestPermissions.js';
import { newUserApproverRole } from './newUserWorkflow.js';
import { otherAccessSystems, formResetSystems } from './requestCatalog.js';
import { validateTransferAccess } from './accessValidation.js';
import {canReviewDatabaseTicket} from './workflowReview.js';
const editableSystems=new Set(formResetSystems.filter(system=>system!=='AD ID'));
export const CHANGE_REQUEST = 'Branch / Department change';
export const isChangeRequest = ticket => ticket?.action===CHANGE_REQUEST;
const normalized=value=>String(value||'').trim().toLowerCase().replace(/centre/g,'center');
export const destinationRole = change => change.kind==='Department'?'Department head':newUserApproverRole({branch:change.toBranch,department:change.toDepartment});
export function canViewChange(ticket,profile){
 if(!isChangeRequest(ticket))return true;
 if(!profile?.employeeId)return false;
 if(ticket.sqlId)return true; // SQL has already authorized visibility, including historical reviewers/custodians.
 const change=ticket.transferChange;
 if(change?.employee?.employeeId===profile.employeeId)return true;
 if(canRequestBranchTransfer(profile.role))return true;
 if(profile.role==='Branch manager')return Boolean(profile.branch)&&[change.fromBranch,change.toBranch].some(branch=>normalized(branch)===normalized(profile.branch));
 if(profile.role==='Department head')return Boolean(profile.department)&&[change.fromDepartment,change.toDepartment].some(department=>normalized(department)===normalized(profile.department));
 return ['CITO','COO'].includes(profile.role)&&(ticket.assignedRole===profile.role||ticket.queryReturnRole===profile.role||(ticket.approvalHistory||[]).some(event=>event.employeeId===profile.employeeId));
}
export function canReviewChange(ticket,profile){
 if(ticket.sqlId)return canReviewDatabaseTicket(ticket,profile);
 if(!isChangeRequest(ticket))return true;
 if(ticket.transferChange?.stage!=='approval'||ticket.assignedRole!==profile?.role)return false;
 if(profile.role==='Branch manager')return normalized(profile.branch)===normalized(ticket.transferChange.toBranch);
 if(profile.role==='Department head')return normalized(profile.department)===normalized(ticket.transferChange.toDepartment);
 return true;
}
export function awaitsChangeAction(ticket,profile){
 if(!isChangeRequest(ticket)||!profile?.employeeId||!['Pending','In review'].includes(ticket.state))return false;
 if(ticket.transferChange?.stage==='employee')return ticket.transferChange.employee?.employeeId===profile.employeeId;
 return canViewChange(ticket,profile)&&canReviewChange(ticket,profile);
}
export function validateChangeInitiation(change,actor,employee){
 if(!canRequestBranchTransfer(actor))return 'Only IT, HR and administrators can initiate a branch or department change.';
 if(!employee?.employeeId||change.employeeId!==employee.employeeId)return 'Search for a valid employee ID first.';
 if(!['Branch','Department'].includes(change.kind))return 'Select branch change or department change.';
 if(!change.fromBranch||!change.toBranch)return 'Select the current and destination branches.';
 if(change.fromBranch!==employee.branch)return 'The From branch must match the employee record.';
 if(change.fromDepartment!==employee.department)return 'The From department must match the employee record.';
 if(!change.toDepartment)return 'Select the destination department.';
 if(change.kind==='Branch'&&change.fromBranch===change.toBranch)return 'Choose a different destination branch.';
 if(change.kind==='Department'&&change.fromDepartment===change.toDepartment)return 'Choose a different destination department.';
 if(!change.justification?.trim())return 'Add a business justification.';
 return '';
}
export function accessSelection(employee,change){
 const value={people:[{...employee,fullName:employee.name,branch:change.toBranch,department:change.toDepartment}],similarIds:{}};
 const access=employee.access||{};
 for(const system of new Set([...Object.keys(access.systemRoles||{}),...(access.enabledSystems||[]),...(access.otherAccess||[])])){
  if(!editableSystems.has(system))continue;
  const key=['ITMBD Test','ICBS Test'].includes(system)?'newTestSystems':otherAccessSystems.includes(system)?'newOtherAccess':'newAccess';
  value[key]={...value[key],[system]:access.systemRoles?.[system]||[]};
  value[`${key}Systems`]={...value[`${key}Systems`],[system]:true};
  value.similarIds[system]=employee.systemId||employee.employeeId;
  const role=access.systemRoles?.[system]?.[0];
  if(system==='LOS'&&role){const department=['Corporate Banking','Credit Admin','Islamic Banking','Card Center','Customer Service'].find(item=>role.startsWith(item));value[`${key}Departments`]={LOS:department||''};}
 }
 return value;
}
export function selectedChangeAccess(value){
 return ['newAccess','newOtherAccess','newTestSystems','additionalTestSystems'].flatMap(key=>[...new Set([...Object.keys(value[key]||{}),...Object.keys(value[`${key}Systems`]||{})])].filter(system=>value[`${key}Systems`]?.[system]??Boolean(value[key]?.[system]?.length)).map(system=>({system,roles:value[key]?.[system]||[]})));
}
export function changedAccess(employee,value){
 const access=employee.access||{};
 const current=new Set([...Object.keys(access.systemRoles||{}),...(access.enabledSystems||[]),...(access.otherAccess||[])]);
 return selectedChangeAccess(value).filter(row=>!current.has(row.system)||JSON.stringify([...(access.systemRoles?.[row.system]||[])].sort())!==JSON.stringify([...row.roles].sort()));
}
export function validateEmployeeChange(ticket,actor,value,justification,reasons={}){
 if(!isChangeRequest(ticket)||ticket.transferChange?.stage!=='employee'||ticket.transferChange.employee.employeeId!==actor?.employeeId)return 'Only the selected employee can continue this initiated change.';
 if(selectedChangeAccess(value).some(row=>!editableSystems.has(row.system)))return 'Select valid destination systems.';
 const error=validateTransferAccess(value);if(error)return error;
 if(!justification?.trim())return 'Add your access business justification.';
 for(const row of changedAccess(ticket.transferChange.employee,value))if(!reasons[row.system]?.trim())return `Add a justification for ${row.system}.`;
 return '';
}
export function changeAccessProfile(ticket){
 const old=ticket.transferChange.employee.access||{};
 const rows=selectedChangeAccess(ticket.transferDetails||{});
 // Preserve services outside the system-access form, such as existing email and software.
 const keep=system=>!editableSystems.has(system);
 const systemRoles=Object.fromEntries(Object.entries(old.systemRoles||{}).filter(([system])=>keep(system)));
 const enabledSystems=(old.enabledSystems||[]).filter(keep);
 const otherAccess=(old.otherAccess||[]).filter(keep);
 for(const row of rows){if(row.roles.length)systemRoles[row.system]=row.roles;else if(otherAccessSystems.includes(row.system))otherAccess.push(row.system);else enabledSystems.push(row.system);}
 return {...old,systemRoles,enabledSystems:[...new Set(enabledSystems)],otherAccess:[...new Set(otherAccess)]};
}
