import { newUserApproverRole, isNewUser } from './newUserWorkflow.js';
import { isChangeRequest, destinationRole } from './transferChangeWorkflow.js';
const ranks={'User':0,'Branch manager':1,'Department head':1,'HR':2,'IT':3,'CITO':4,'COO':5};
const normalized=value=>String(value||'').trim().toLowerCase();

export function queryRecipientsFor(users,profile,ticket) {
  if(!ticket||!profile?.employeeId)return [];
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
