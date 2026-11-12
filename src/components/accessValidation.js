import { requestRoles } from './requestCatalog.js';
import { supportsSimilarId } from './similarIdSystems.js';

export function validateTransferAccess(value) {
  let selectedCount=0;
  for (const key of ['currentAccess','currentOtherAccess','currentTestSystems','newAccess','newOtherAccess','newTestSystems','additionalTestSystems']) {
    const selected=value[key]||{};
    const flags=value[`${key}Systems`]||{};
    for (const system of new Set([...Object.keys(selected),...Object.keys(flags)])) {
      const roles=selected[system]||[];
      if (!(flags[system]??Boolean(roles.length))) continue;
      selectedCount++;
      const available=requestRoles[system]||[];
      if (available.length && !roles.some(role=>available.includes(role))) return `Select a role for ${system}.`;
      if (system==='LOS' && (!value[`${key}Departments`]?.LOS || !roles.some(role=>role.startsWith(value[`${key}Departments`].LOS)))) return 'Select the department and matching role for LOS.';
      if (supportsSimilarId(system) && !value.similarIds?.[system]?.trim()) return `Enter a similar ID for ${system}.`;
    }
  }
  return selectedCount ? '' : 'Select at least one system to continue.';
}

export function validateBatchAccess(value) {
  if (!value.people?.length || value.people.some(person=>!(person.systems||[]).some(entry=>entry.system?.trim()))) return 'Select at least one system for each user to continue.';
  for (const person of value.people||[]) for (const entry of person.systems||[]) {
    if (!entry.system) continue;
    const roles=requestRoles[entry.system]||[];
    if (roles.length && !roles.includes(entry.role)) return `Select a role for ${entry.system}.`;
    if (supportsSimilarId(entry.system) && !entry.similarId?.trim()) return `Enter a similar ID for ${entry.system}.`;
  }
  return '';
}
