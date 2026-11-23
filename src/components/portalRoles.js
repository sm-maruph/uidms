export const portalRoles = ['User', 'Branch manager', 'Department head', 'IT', 'CITO', 'COO', 'HR', 'Admin', 'Super Admin'];

export const hasPortalRole=(profile,...roles)=>[profile?.role,...(profile?.roles||[])].some(role=>roles.includes(role==='Platform Admin'?'Admin':role));
export const canManageApprovers = role => ['IT','Admin','Platform Admin','Super Admin'].includes(role);
export const canUseActingAppointments=profile=>Boolean(profile?.canManageActing||profile?.managedScopes?.length||hasPortalRole(profile,'IT','CITO','Admin','Super Admin')||['IT','CITO'].includes(profile?.baseRole));

export const canManageUsers = role => ['Admin','Platform Admin', 'Super Admin'].includes(role);
export function canSetPortalRole(actorRole,previousRole,nextRole){
 if(actorRole==='Super Admin')return true;
 if(!canManageUsers(actorRole))return false;
 const previous=previousRole==='Platform Admin'?'Admin':previousRole;
 if(!['Admin','Super Admin'].includes(nextRole))return true;
 return ['Admin','Super Admin'].includes(previous)&&(nextRole!=='Super Admin'||previous==='Super Admin');
}

export function savePortalUser(users, actor, form, editing = '') {
  if (!canManageUsers(actor?.role)) throw new Error('Only platform admins and super admins can change portal roles.');
  const employeeId = String(form.employeeId || '').trim().toUpperCase();
  if (!employeeId || !form.name?.trim()) throw new Error('Employee ID and full name are required.');
  if (!portalRoles.includes(form.role)) throw new Error('Select a valid portal role.');
  const previous = editing ? users.find(user => user.employeeId === editing) : null;
  if(!canSetPortalRole(actor.role,previous?.role,form.role))throw new Error('Only Super Admin can create or promote administrator accounts.');
  if (editing && !previous) throw new Error('This account no longer exists.');
  if (previous && employeeId !== previous.employeeId) throw new Error('Employee ID cannot be changed.');
  if (users.some(user => user.employeeId === employeeId && user.employeeId !== editing)) throw new Error('An account with this employee ID already exists.');
  const user = {...previous, ...form, employeeId, systemId: employeeId, name: form.name.trim()};
  return editing ? users.map(item => item.employeeId === editing ? user : item) : [...users, user];
}
