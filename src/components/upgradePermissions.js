import { supportsSimilarId } from './similarIdSystems.js';
import { requestRoles } from './requestCatalog.js';

export function canChangeSystemRole(access = {}, system) {
  return Boolean(access.systemRoles?.[system]?.length || access.enabledSystems?.includes(system) || access.otherAccess?.includes(system));
}

export function availableUpgradeRoles(access = {}, system) {
  if (!canChangeSystemRole(access, system)) return [];
  return (requestRoles[system] || []).filter(role => !(access.systemRoles?.[system] || []).includes(role));
}

export function validateUpgradeRequest(value, access = {}) {
  if (!value.systems?.length) return 'Select an existing system and choose a different role.';
  if (value.systems.some(system => !canChangeSystemRole(access, system))) return 'Role changes are limited to systems you already have access to. Create a new ID request for other systems.';
  if (value.systems.some(system => !availableUpgradeRoles(access, system).includes(value.roles?.[system]))) return 'Choose a valid role different from your current role for every selected system.';
  if (value.systems.some(system => supportsSimilarId(system) && !value.similarIds?.[system]?.trim())) return 'Enter a similar ID for each selected system that requires one.';
  return '';
}
