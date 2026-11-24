import {ticketApprovalFlow} from './ticketWorkflow.js';
import {requestTypeLabel} from './requestTitle.js';
import {fulfilmentItems} from './fulfilment.js';
import { newUserApproverRole, isNewUser } from './newUserWorkflow.js';
import { isChangeRequest, destinationRole } from './transferChangeWorkflow.js';
const ranks={'User':0,'Branch manager':1,'Department head':1,'HR':2,'IT':3,'CITO':4,'COO':5};
const normalized=value=>String(value||'').trim().toLowerCase();

export function queryRecipientsFor(users,profile,ticket) {
  if(!ticket||!profile?.employeeId)return [];
  if(ticket.sqlId&&Array.isArray(ticket.queryParticipants))return ticket.queryParticipants;
  const requester=users.find(user=>user.employeeId===ticket.requesterId);
  const subject=isChangeRequest(ticket)?{branch:ticket.transferChange.toBranch,department:ticket.transferChange.toDepartment}:isNewUser(ticket)?ticket.newUserDetails?.people?.[0]:{...requester,...ticket.requesterProfile,branch:ticket.branch||ticket.requesterProfile?.branch||requester?.branch};
  const managerRole=isChangeRequest(ticket)?destinationRole(ticket.transferChange):newUserApproverRole(subject);
  const rank=ranks[profile.role];
  if(rank===undefined)return [];
  const includesHr=isNewUser(ticket)||isChangeRequest(ticket)||ticket.action==='Branch transfer';
  if(profile.role==='HR'&&!includesHr)return [];
  return users.filter(user=>{
    if(user.employeeId===profile.employeeId)return false;
    if(user.role==='HR'&&includesHr&&rank>=1)return true;
    // The requester is available to managers and higher reviewers on this ticket.
    if(rank===1)return user.employeeId===ticket.requesterId;
    if(rank<2)return false;
    if(user.employeeId===ticket.requesterId)return true;
    if(user.role===managerRole){
      const key=managerRole==='Department head'?'department':'branch';
      return Boolean(subject?.[key])&&normalized(user[key])===normalized(subject[key]);
    }
    if(!['IT','CITO','COO'].includes(user.role)||ranks[user.role]>=rank)return false;
    const recorded=(ticket.approvalHistory||[]).filter(event=>event.role===user.role&&event.employeeId);
    return recorded.length?recorded.some(event=>event.employeeId===user.employeeId):user.employeeId===users.find(candidate=>candidate.role===user.role)?.employeeId;
  });
}

export function validateReviewQuery(details,users,profile,ticket) {
  if(details.targetIds?.length!==1)return 'Select one query recipient.';
  if(!queryRecipientsFor(users,profile,ticket).some(user=>user.employeeId===details.targetIds[0]))return 'Select an eligible participant from this request’s workflow.';
  if(!details.message?.trim())return 'Enter your query.';
  if(details.message.length>350)return 'Keep your query within 350 characters.';
  return '';
}

export const approvalRecommendation=remark=>remark?.trim()||'Recommended';

// Use saved ticket positions, including system overrides and acting reviewers.
export function isFinalApproval(ticket,step){
 if(Array.isArray(ticket.workflowSteps)){
  const current=step||ticket.workflowSteps.find(row=>row.position===ticket.currentPosition&&row.status==='Waiting');
  return Boolean(current&&ticket.workflowSteps.some(row=>row.position===current.position)&&!ticket.workflowSteps.some(row=>row.position>current.position));
 }
 if(ticket.sqlId)return false; // A list response cannot prove the final step.
 const roles=ticketApprovalFlow(ticket).filter(role=>!['Requester','Employee review'].includes(role));
 return Boolean(roles.length&&roles.at(-1)===(step?.role||step?.stage||ticket.assignedRole));
}
export const approvalDecisionLabel=ticket=>isFinalApproval(ticket)?'Approve':'Recommended';
export const approvalHistoryLabel=(ticket,step)=>step.status==='Approved'?(isFinalApproval(ticket,step)?'Approved':'Recommended'):step.status;

export function reviewRequestSummary(ticket){
 const data={...ticket,...ticket.submittedForm?.data};
 const people=data.sqlPeople||[];
 const items=data.sqlItems?.length?data.sqlItems.map(item=>{const person=people.find(row=>row.id===item.personId);return {system:item.system,person:person?.name||data.name,employeeId:person?.employeeId||data.requesterId,role:item.role,operation:item.operation};}):fulfilmentItems(data);
 const change=data.transferChange;
 const fields=[['Ticket',ticket.id],['Request',requestTypeLabel(ticket.action)],['Requested by',data.name],['System / employee ID',data.requesterId],['Branch',data.branch],['Department',data.department],...(change?[['Transfer from',[change.fromBranch,change.fromDepartment].filter(Boolean).join(' / ')],['Transfer to',[change.toBranch,change.toDepartment].filter(Boolean).join(' / ')]]:[])].filter(([,value])=>value);
 return {fields,items,justification:data.justification||'',employees:(data.newUserDetails?.people||[]).map(person=>({name:person.name,employeeId:person.employeeId,branch:person.branch,department:person.department,adRole:person.adRole,email:person.email?person.preferredEmail:'',software:[person.msOffice&&'MS Office',person.otherSoftware].filter(Boolean).join(', ')}))};
}
