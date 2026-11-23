import {hasPortalRole} from './portalRoles.js';
const allowedDepartmentsForIdDeletion = new Set([
  'hr',
  'hrdept',
  'hrdepartment',
  'humanresources',
  'it',
  'itdept',
  'itdepartment',
  'itdivision',
  'informationtechnology',
]);

export function canRequestIdDeletion(department,actor) {
  if(hasPortalRole(typeof actor==='string'?{role:actor}:actor,'IT','HR','Admin','Super Admin'))return true;
  const normalized = String(department || '').toLowerCase().replace(/[^a-z]/g, '');
  return allowedDepartmentsForIdDeletion.has(normalized);
}

export const canRequestBranchTransfer = actor => hasPortalRole(typeof actor==='string'?{role:actor}:actor,'IT','HR','Admin','Super Admin');
