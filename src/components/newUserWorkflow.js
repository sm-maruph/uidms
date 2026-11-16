export const isNewUser = ticket => ticket?.action === 'New ID creation (on behalf)';
const normalize = value => String(value||'').trim().toLowerCase().replace(/centre/g,'center').replace(/[^a-z0-9]/g,'');
const departmentLed = new Set(['cardcenter','digitalbanking','callcenter','digitalbankingandcardcenter']);
export function newUserApproverRole(person = {}) {
 const branch=normalize(person.branch);
 const department=normalize(person.department).replace(/department$/, '');
 return ['headoffice','corporateoffice','digitalbankingandcardcenter'].includes(branch)||(branch==='gulshanbranch'&&departmentLed.has(department))?'Department head':'Branch manager';
}
export const newUserManagerRole = details => newUserApproverRole(details?.people?.[0]);
export function matchesNewUserApprover(person, profile) {
 const role=newUserApproverRole(person);
 return profile?.role===role&&Boolean(role==='Department head'?normalize(person?.department)&&normalize(person.department)===normalize(profile.department):normalize(person?.branch)&&normalize(person.branch)===normalize(profile.branch));
}
export function validateNewUserRouting(details = {}) {
 const people = details.people || [];
 if (!people.length) return 'Add at least one new employee.';
 const role = newUserManagerRole(details);
 const first = people[0];
 if (people.some(person=>!person.branch?.trim()||!person.department?.trim())) return 'Select a branch and department for every employee.';
 if (people.some(person => newUserApproverRole(person)!==role||(role === 'Branch manager' ? normalize(person.branch) !== normalize(first.branch) : normalize(person.department) !== normalize(first.department)))) return 'Create separate requests for employees with different approving branches or departments.';
 return '';
}
export function canReviewNewUser(ticket, profile) {
 if (!isNewUser(ticket)) return ticket.assignedRole === profile?.role;
 if (ticket.assignedRole !== profile?.role) return false;
 const person = ticket.newUserDetails?.people?.[0];
 if (['Branch manager','Department head'].includes(profile.role)) return matchesNewUserApprover(person,profile);
 return true;
}
export const policeClearanceOptions = ['Completed','Pending','Special recommendation'];
export const referenceCheckOptions = ['Both checked','One checked','Pending'];
export function normalizeHrCheck(check = {}) {
 const police=check.police==='Clear'?'Completed':check.police==='Pending'&&check.exception&&check.specialRemarks?.trim()?'Special recommendation':check.police||'';
 return {police,reference:check.reference==='Clear'?'Both checked':check.reference||'',recommendation:police==='Special recommendation'?(check.recommendation||check.specialRemarks||''):''};
}
export function validateHrClearance(ticket, checks = [], {forApproval=true} = {}) {
 const people = ticket.newUserDetails?.people || [];
 if (!people.length) return 'Employee details are required before HR clearance.';
 for (const [index, person] of people.entries()) {
  const check = normalizeHrCheck(checks[index]);
  if (!policeClearanceOptions.includes(check.police)) return `Record police clearance for ${person.name}.`;
  if (!referenceCheckOptions.includes(check.reference)) return `Record reference check status for ${person.name}.`;
  if (check.police==='Special recommendation'&&!check.recommendation.trim()) return `Enter a special recommendation for ${person.name}.`;
  if (forApproval&&check.reference!=='Both checked') return `Both references must be checked for ${person.name} before approval.`;
  if (forApproval&&check.police==='Pending') return `Complete police clearance or select Special recommendation for ${person.name} before approval.`;
 }
 return '';
}
export function updateHrClearance(ticket, actor, checks, at=new Date().toISOString(), ip='Not recorded') {
 if(!isNewUser(ticket)||actor?.role!=='HR'||!actor.employeeId)throw new Error('Only HR can update new employee clearance statuses.');
 const error=validateHrClearance(ticket,checks,{forApproval:false});
 if(error)throw new Error(error);
 const next=ticket.newUserDetails.people.map((_,index)=>normalizeHrCheck(checks[index]));
 const entry={by:actor.name,employeeId:actor.employeeId,role:actor.role,at,ip,previousChecks:(ticket.hrClearance?.checks||[]).map(normalizeHrCheck),checks:next};
 return {...ticket,hrClearance:{checks:next,by:actor.name,employeeId:actor.employeeId,at},hrClearanceHistory:[...(ticket.hrClearanceHistory||[]),entry]};
}
export const canReceiveCredentials = (ticket, profile) => isNewUser(ticket)
 ? Boolean(ticket.custodian?.employeeId && ticket.custodian.employeeId === profile?.employeeId)
 : ticket.action==='Branch / Department change'?ticket.transferChange?.employee?.employeeId===profile?.employeeId:ticket.requesterId === profile?.employeeId;
