import {requestTypeLabel} from './requestTitle.js';
const legacyCodes=new Set(['batch-access','new-id','branch-transfer']);
export const currentWorkflowTypes=catalog=>(catalog?.requestTypes||[]).filter(type=>!legacyCodes.has(type.Code)).map(type=>({...type,Name:({movement:'Branch / Department Transfer',upgrade:'ID Role Upgrade','self-access':'New ID creation (self request)'})[type.Code]||requestTypeLabel(type.Name)}));
export const olderWorkflowTypes=catalog=>[...(catalog?.legacyRequestTypes||[]),...(catalog?.requestTypes||[]).filter(type=>legacyCodes.has(type.Code))].filter(type=>type.ExistingRequests>0);
export function similarApproverAssignments(rows,scope){
 if(!scope||scope.Kind!=='department'||scope.UserId)return [];
 const normalize=value=>String(value||'').trim().toLowerCase().replace(/[\s_-]+/g,'').replace(/(department|dept)$/,'');
 const matches=rows.filter(row=>row.ScopeId!==scope.ScopeId&&row.Kind===scope.Kind&&row.UserId&&row.Active&&normalize(row.Name)===normalize(scope.Name));
 return new Set(matches.map(row=>row.UserId)).size===1?matches.slice(0,1):[];
}
