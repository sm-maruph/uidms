import { initialUsers } from './mockUsers.js';

// Fixed scenarios keep the demo repeatable across reloads.
const scenarios = [
  [0,'ID upgrade','ICBS','Supervisor','Pending','Branch manager','Need supervisor access for the branch reconciliation rota.'],
  [1,'IDrive access','IDrive','Read / write','In review','IT','Access to the shared operations archive is required for month-end reporting.'],
  [2,'N Drive access','N Drive','Read / write','In review','CITO','Need the IT support shared folder for incident evidence and runbooks.'],
  [5,'New ID creation (on behalf)','AD ID, Email','New employee','Pending','Branch manager','Provision accounts for a new operations officer joining Corporate Office.'],
  [0,'Email creation','Email','Individual mailbox','Approved',null,'Create a mailbox to coordinate daily branch customer service activities.'],
  [1,'Mailing group change','Email','Group inclusion','Query','IT','Include the branch manager in the operations announcements mailing group.'],
  [2,'External device email access','Email','Mobile access','In review','COO','Mobile email access is required during scheduled out-of-hours IT support.'],
  [0,'ID reset / unlock','WBO','Account unlock','Pending','Branch manager','The account is locked and must be restored for daily trade processing.'],
  [5,'Employee ID deactivation','All systems','Deactivate existing IDs','In review','IT','Disable the accounts of a departing employee after the final working day.'],
  [6,'ID upgrade','ITMBD','Manager','Rejected',null,'Request elevated access for a temporary support assignment.'],
  [0,'Branch transfer','ICBS, WBO','Entry','Query','Branch manager','Move branch system access to the new Gulshan Branch assignment.'],
  [3,'IDrive access','IDrive','Read only','Approved',null,'Review technical governance documents in the shared audit folder.'],
  [4,'N Drive access','N Drive','Read only','In review','CITO','Review consolidated operating reports from the shared management folder.'],
  [0,'Auto-forward change','Email','Forwarding update','In review','IT','Forward operational correspondence to the covering officer during approved leave.'],
  [1,'System ID creation (self-request)','Query','Inquiry','Approved',null,'Query access is needed for daily branch exception monitoring.'],
  [2,'ID reset / unlock','CITRIX_R','Account unlock','Approved',null,'Restore remote support access after an account lock.'],
  [5,'Mailing group change','Email','Group exclusion','Pending','Branch manager','Remove an employee from the HR announcements group after reassignment.'],
  [0,'N Drive access','N Drive','Read only','Rejected',null,'Request access to archived operations reports for an ad hoc review.'],
  [6,'New ID creation (on behalf)','AD ID, Email','New employee','In review','CITO','Create workplace accounts for a new IT service desk officer.'],
  [1,'Email creation','Email','Shared mailbox','In review','COO','Create a shared branch enquiries mailbox for the service team.'],
  [0,'External device email access','Email','Mobile access','Query','IT','Request mobile email for approved field visits and customer follow-up.'],
  [2,'System ID deactivation','ITMBD','Deactivate existing IDs','Approved',null,'Remove a temporary test account after the support assignment ended.'],
  [3,'ID upgrade','HRIS','Inquiry','Pending','Branch manager','Access is required to review workforce information for IT planning.'],
  [5,'Branch transfer','HRIS','Inquiry','In review','COO','Transfer an operations officer to Banani Branch with matching system access.'],
  [0,'IDrive access','IDrive','Read / write','In review','IT','Store daily reconciliation evidence in the branch shared folder.'],
  [1,'Auto-forward change','Email','Forwarding update','Approved',null,'Remove temporary forwarding now that the covering assignment has ended.'],
  [4,'Mailing group change','Email','Group inclusion','In review','IT','Include the operations head in the daily service updates distribution.'],
  [0,'System ID deactivation','WBO','Deactivate selected system ID','Pending','Branch manager','Remove WBO access after reassignment; keep ICBS, email, and other assigned systems active.'],
  [1,'System ID deactivation','HRIS','Deactivate selected system ID','In review','IT','Remove HRIS access no longer needed for the branch manager duties; preserve all other system access.'],
  [0,'System ID creation (self-request)','LOS','Customer Service — Officer','In review','CITO','Need LOS access for the newly assigned customer service responsibilities.'],
];
const reviewers = ['Branch manager','IT','CITO','COO'];
const reviewerFor = role => initialUsers.find(user => user.role === role);

export const extraMockRequests = scenarios.map(([userIndex, action, system, requestedRole, state, owner, justification], index) => {
  const user = initialUsers[userIndex];
  const created = new Date(Date.UTC(2026, 10, 9 - Math.floor(index / 4), 2 + index % 4, 10));
  const at = minutes => new Date(created.getTime() + minutes * 60000).toISOString();
  const flow = action === 'System ID deactivation' && user.role === 'Branch manager' ? reviewers.slice(1) : action === 'ID reset / unlock' ? reviewers.slice(0, 3) : reviewers;
  const completedCount = ['Approved','Rejected'].includes(state) ? flow.length : Math.max(0, flow.indexOf(owner));
  const approvalHistory = flow.slice(0, completedCount).map((role, stageIndex) => ({
    stage:role, role, by:reviewerFor(role).name, at:at(20 + stageIndex * 25),
    status:state === 'Rejected' && stageIndex === completedCount - 1 ? 'Rejected' : 'Approved',
    remark:state === 'Rejected' && stageIndex === completedCount - 1 ? 'Requested access exceeds the documented business need. Submit a revised request with the minimum required access.' : 'Business need and requested access verified for this approval stage.',
  }));
  const isQuery = state === 'Query';
  const queryHistory = isQuery ? [{stage:`${owner} review`,by:reviewerFor(owner).name,role:owner,at:at(20 + completedCount * 25),message:'Please confirm the required access scope and effective date so this request can proceed.',targetIds:[user.employeeId],targetNames:[user.name],responses:[]}] : [];
  const ticket = {
    id:`UID-2026-${1005 + index}`,requesterId:user.employeeId,name:user.name,initials:user.name.split(' ').map(part=>part[0]).slice(0,2).join(''),
    action,requesterRole:user.role,system,role:requestedRole,branch:user.branch,createdAt:created.toISOString(),
    date:created.toLocaleString('en-US',{timeZone:'Asia/Dhaka',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),
    state,step:state === 'Approved' ? 'Completed' : state === 'Rejected' ? 'Request rejected' : isQuery ? `Query response · ${user.name}` : `${owner} review`,
    assignedRole:isQuery ? null : owner,justification,approvalHistory,queryHistory,
    remarks:[{by:user.name,role:user.role,at:at(5),message:'Supporting details checked before submission.'}],
    ...(isQuery ? {queryTargetIds:[user.employeeId],queryReturnRole:owner,queryReturnStep:`${owner} review`} : {}),
  };
  const person = {...user,systems:system.split(', ').map(value=>({system:value,role:requestedRole}))};
  if (action === 'ID reset / unlock') ticket.resetDetails = {name:user.name,employeeId:user.employeeId,userId:user.systemId,department:user.department,systems:system.split(', ')};
  else if (action === 'System ID deactivation') ticket.deactivationDetails = {name:user.name,employeeId:user.employeeId,userId:user.systemId,department:user.department,branch:user.branch,systems:system.split(', '),scope:'selected systems'};
  else if (action === 'Employee ID deactivation') ticket.deactivationDetails = {name:'Demo departing employee',employeeId:`DEMO${index}`,userId:`DEMO${index}`,department:'Operations',branch:user.branch,scope:'all systems',systems:['All systems']};
  else if (action === 'New ID creation (on behalf)') ticket.newUserDetails = {people:[{name:index === 3 ? 'Ayesha Rahman (Demo)' : 'Tanvir Ahmed (Demo)',employeeId:`DEMO${index}`,designation:'Officer',department:index === 3 ? 'Operations' : 'IT Department',branch:'Corporate Office',adId:true,email:true,adRole:'Standard employee',preferredEmail:`demo.employee${index}`,msOffice:true}]};
  else if (action === 'Branch transfer' || action === 'System ID creation (self-request)') ticket.transferDetails = {transferRequestType:action === 'Branch transfer' ? 'Branch transfer' : 'Existing ID Update',newAccess:Object.fromEntries(system.split(', ').map(value=>[value,[requestedRole]])),newAccessSystems:Object.fromEntries(system.split(', ').map(value=>[value,true])),people:[{...person,fullName:user.name,requestedSystems:person.systems}],...(action === 'Branch transfer' ? {newBranch:index === 10 ? 'Gulshan Branch' : 'Banani Branch',effectiveDate:'2026-11-15'} : {})};
  else if (action === 'Auto-forward change') ticket.autoForwardDetails = {name:user.name,employeeId:user.employeeId,forwardTo:'demo.covering.officer@combankbd.com',profileEmail:`demo.employee${userIndex}@combankbd.com`};
  else if (action === 'Mailing group change') ticket.mailingGroupDetails = {requesterName:user.name,action:requestedRole === 'Group exclusion' ? 'Exclusion' : 'Inclusion',groupAddress:'demo.operations@combankbd.com',profileEmail:`demo.employee${userIndex}@combankbd.com`};
  else ticket.batchDetails = {people:[person]};
  return ticket;
});
