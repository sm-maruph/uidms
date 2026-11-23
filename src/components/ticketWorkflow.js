import {resetApprovalFlow} from './resetPolicy.js';
import {isChangeRequest,destinationRole} from './transferChangeWorkflow.js';
import {isNewUser,newUserManagerRole} from './newUserWorkflow.js';
import {deactivationFlow} from './deactivationRequests.js';

export function ticketApprovalFlow(ticket){
 if(Array.isArray(ticket.workflowSteps))return ['Requester',...(ticket.typeCode==='movement'?['Employee review']:[]),...[...ticket.workflowSteps].sort((a,b)=>a.position-b.position).map(step=>step.role)];
 // Before a SQL detail response arrives, display only the actual known stages.
 if(ticket.sqlId){
  const stages=[...(ticket.approvalHistory||[]).filter(step=>['Approved','Rejected'].includes(step.status)).map(step=>step.role||step.stage),ticket.assignedRole].filter(Boolean);
  return ['Requester',...(ticket.typeCode==='movement'?['Employee review']:[]),...new Set(stages)];
 }
 if(ticket.action==='ID reset / unlock')return resetApprovalFlow();
 if(isChangeRequest(ticket))return ['Requester','Employee review',destinationRole(ticket.transferChange),'IT','CITO','COO'];
 if(isNewUser(ticket))return ['Requester',newUserManagerRole(ticket.newUserDetails),'HR','IT','CITO','COO'];
 return ticket.action==='System ID deactivation'?deactivationFlow(ticket.requesterRole):['Requester','Branch manager','IT','CITO','COO'];
}

export const configuredWorkflowRoles=(catalog,code)=>(catalog?.workflowSteps||[]).filter(step=>step.TypeCode===code).sort((a,b)=>a.Position-b.Position).map(step=>step.Role);
