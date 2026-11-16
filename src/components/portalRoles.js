export const portalRoles = ['User', 'Branch manager', 'Department head', 'IT', 'CITO', 'COO', 'HR', 'Platform Admin', 'Super Admin'];

export const canManageUsers = role => ['Platform Admin', 'Super Admin'].includes(role);

export function savePortalUser(users, actor, form, editing = '') {
  if (!canManageUsers(actor?.role)) throw new Error('Only platform admins and super admins can change portal roles.');
  const employeeId = String(form.employeeId || '').trim().toUpperCase();
  if (!employeeId || !form.name?.trim()) throw new Error('Employee ID and full name are required.');
  if (!portalRoles.includes(form.role)) throw new Error('Select a valid portal role.');
  const previous = editing ? users.find(user => user.employeeId === editing) : null;
  if (editing && !previous) throw new Error('This account no longer exists.');
  if (previous && employeeId !== previous.employeeId) throw new Error('Employee ID cannot be changed.');
  if (users.some(user => user.employeeId === employeeId && user.employeeId !== editing)) throw new Error('An account with this employee ID already exists.');
  const user = {...previous, ...form, employeeId, systemId: employeeId, name: form.name.trim()};
  return editing ? users.map(item => item.employeeId === editing ? user : item) : [...users, user];
}
