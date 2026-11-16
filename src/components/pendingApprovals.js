import {approvalRoles} from './mockUsers.js';
import {isNewUser,canReviewNewUser} from './newUserWorkflow.js';
import {isChangeRequest,canViewChange,canReviewChange} from './transferChangeWorkflow.js';

export function awaitsApproval(ticket,profile) {
  if(!profile?.employeeId||!approvalRoles.includes(profile.role)||!['Pending','In review'].includes(ticket.state))return false;
  if(isChangeRequest(ticket))return canViewChange(ticket,profile)&&canReviewChange(ticket,profile);
  if(isNewUser(ticket))return canReviewNewUser(ticket,profile);
  if(ticket.assignedRole!==profile.role)return false;
  if(profile.role==='Branch manager')return Boolean(profile.branch)&&profile.branch===ticket.branch;
  if(profile.role==='Department head')return Boolean(profile.department)&&profile.department===(ticket.department||ticket.requesterProfile?.department);
  return true;
}
