import {submittedByMe} from './myRequests.js';
import {isChangeRequest,canViewChange,canReviewChange} from './transferChangeWorkflow.js';
import {isNewUser,canReviewNewUser} from './newUserWorkflow.js';
import {canManageUsers} from './portalRoles.js';
import {requestTypeLabel} from './requestTitle.js';
import {canReviewDatabaseTicket} from './workflowReview.js';

// The API remains the authorization boundary. This scopes its authorized results
// to the selected workspace, then applies the shared search and sort controls.
export function workspaceRequests(requests,{profile,page,search='',sort='newest'}){
 if(!profile?.employeeId)return [];
 const role=profile.role;
 const term=search.trim().toLowerCase();
 return requests.filter(ticket=>{
  if(!canViewChange(ticket,profile))return false;
  if(page==='My requests')return submittedByMe(ticket,profile);
  const target=(ticket.queryTargetIds||[]).includes(profile.employeeId)||(ticket.queryHistory||[]).some(query=>(query.targetIds||[]).includes(profile.employeeId));
  if(role==='User')return ticket.scopeVisible&&page!=='Approvals'||(page==='Approvals'?ticket.sqlId&&(canReviewDatabaseTicket(ticket,profile)||ticket.reviewedByMe):submittedByMe(ticket,profile)||ticket.sqlId&&(canReviewDatabaseTicket(ticket,profile)||ticket.reviewedByMe))||target||ticket.deliveryForMe||(isChangeRequest(ticket)&&ticket.transferChange?.employee?.employeeId===profile.employeeId);
  if(!['Overview','Approvals'].includes(page)||canManageUsers(role))return true;
  const reviewed=ticket.reviewedByMe||(ticket.approvalHistory||[]).some(event=>event.employeeId===profile.employeeId);
  const assigned=ticket.sqlId?canReviewDatabaseTicket(ticket,profile):isChangeRequest(ticket)?canReviewChange(ticket,profile):isNewUser(ticket)?canReviewNewUser(ticket,profile):ticket.assignedRole===role&&(role!=='Branch manager'||Boolean(profile.branch)&&profile.branch===ticket.branch)&&(role!=='Department head'||Boolean(profile.department)&&profile.department===(ticket.department||ticket.requesterProfile?.department));
  return assigned||reviewed||target||ticket.scopeVisible||ticket.deliveryForMe||ticket.custodian?.employeeId===profile.employeeId;
 }).filter(ticket=>`${ticket.id} ${ticket.name} ${ticket.action} ${requestTypeLabel(ticket.action)} ${ticket.system} ${ticket.branch} ${ticket.step}`.toLowerCase().includes(term))
 .sort((a,b)=>sort==='ticket'?String(a.id).localeCompare(String(b.id)):sort==='oldest'?String(a.createdAt||a.id).localeCompare(String(b.createdAt||b.id)):String(b.createdAt||b.id).localeCompare(String(a.createdAt||a.id)));
}
