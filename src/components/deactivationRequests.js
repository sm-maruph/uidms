import { requestSystems } from './requestCatalog.js';

﻿export const EMPLOYEE_DEACTIVATION = 'Employee ID deactivation';
export const SYSTEM_DEACTIVATION = 'System ID deactivation';
export const isDeactivation = type => [EMPLOYEE_DEACTIVATION, SYSTEM_DEACTIVATION].includes(type);
export const deactivationFlow = requesterRole => requesterRole === 'Branch manager' ? ['Requester','IT','CITO','COO'] : ['Requester','Branch manager','IT','CITO','COO'];
export function assignedDeactivationSystems(user) {
  const access=user?.access||{};
  return [...new Set([...Object.keys(access.systemRoles||{}),...(access.enabledSystems||[]),...(access.otherAccess||[])])].filter(system=>system!=='AD ID');
}

export const systemDeactivationSystems = [...new Set([...requestSystems,'N Drive','Remmit Plus','MS Office','External Device Access'])];
export function deactivationScope(type, details) {
  return type===EMPLOYEE_DEACTIVATION ? {...details,scope:'all systems',systems:['All systems']} : {...details,scope:'selected systems'};
}
