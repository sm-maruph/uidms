import {fulfilmentItems} from './fulfilment.js';

const types={
 'New ID creation':'new-id','System ID creation (self-request)':'self-access','New ID creation (on behalf)':'new-user',
 'Employee ID deactivation':'employee-deactivate','System ID deactivation':'system-deactivate','ID reset / unlock':'reset','ID upgrade':'upgrade',
 'Email creation':'email','Mailing group change':'mailing-group','Auto-forward change':'auto-forward','IDrive access':'idrive','N Drive access':'n-drive',
 'External device email access':'external-device','Branch transfer':'branch-transfer','Branch / Department change':'movement',
};
const formKeys=['transferDetails','newUserDetails','batchDetails','resetDetails','upgradeDetails','emailCreationDetails','deactivationDetails','autoForwardDetails','mailingGroupDetails','externalDeviceDetails'];
const normalize=value=>String(value||'').trim().toLowerCase();
const unique=rows=>[...new Map(rows.map(row=>[JSON.stringify(row),row])).values()];
const equal=(a,b)=>normalize(a)===normalize(b);

export function organizationId(catalog,kind,name){
 const found=catalog.organizations.find(row=>row.Kind===kind&&equal(row.Name,name));
 if(!found)throw new Error(`Choose a ${kind} from the UIDMS directory.`);
 return found.Id;
}

export function systemItems(catalog,items,operation){
 return unique(items.flatMap(item=>{
  const system=catalog.systems.find(row=>equal(row.Name,item.system));
  if(!system)throw new Error(`${item.system} is missing from the SQL system directory. Ask IT to add it.`);
  const roles=catalog.systemRoles.filter(row=>row.SystemId===system.Id);
  const requested=(Array.isArray(item.roles)?item.roles:String(item.role||'').split(',')).map(value=>value.trim()).filter(Boolean);
  const selected=requested.map(name=>roles.find(row=>equal(row.Name,name))?.Id).filter(Boolean);
  if(roles.length&&['grant','update'].includes(operation)&&selected.length!==requested.length)throw new Error(`Choose a valid role for ${system.Name}.`);
  if(roles.length&&['grant','update'].includes(operation)&&!selected.length)throw new Error(`Choose a role for ${system.Name}.`);
  return (selected.length?selected:[null]).map(systemRoleId=>({employeeId:item.employeeId,systemId:system.Id,systemRoleId,operation,...(item.reason?{reason:item.reason}:{})}));
 }));
}

export function requestPayload(form,profile,catalog){
 const typeCode=types[form.type];
 if(!typeCode)throw new Error('This request service is missing from SQL. Contact IT.');
 const details=Object.fromEntries(formKeys.flatMap(key=>form[key]?[ [key,form[key]] ]:[]));
 const request={...details,system:form.system,action:form.type,name:profile.name,requesterId:profile.employeeId,requesterProfile:profile};
 const selected=details.deactivationDetails;
 const requesters=details.newUserDetails?.people||details.batchDetails?.people||details.transferDetails?.people||[selected||profile];
 const people=requesters.map(row=>{
  const person={employeeId:row.employeeId||profile.employeeId,name:row.name||row.fullName||profile.name,
   branchId:organizationId(catalog,'branch',row.branch||row.toBranch||profile.branch),departmentId:organizationId(catalog,'department',row.department||profile.department),details:{}};
  return person;
 });
 if(!people.length)throw new Error('Enter the employee details before submitting.');
 let selectedItems=fulfilmentItems(request);
 if(selected)selectedItems=selectedItems.map(item=>({...item,employeeId:people[0].employeeId}));
 if(typeCode==='employee-deactivate'){
  selectedItems=catalog.systems.map(system=>({system:system.Name,employeeId:people[0].employeeId}));
 }
 if(['email','mailing-group','auto-forward','external-device'].includes(typeCode))selectedItems=[{system:typeCode==='external-device'?'External Device Access':'Email',employeeId:people[0].employeeId}];
 if(typeCode==='new-user')for(const person of details.newUserDetails.people){
  if(person.msOffice)selectedItems.push({system:'MS Office',employeeId:person.employeeId});
  if(person.otherSoftwareEnabled)selectedItems.push({system:'Other software',employeeId:person.employeeId});
 }
 const operation=typeCode==='reset'?'reset':typeCode.endsWith('-deactivate')?'revoke':typeCode==='upgrade'?'update':'grant';
 const items=systemItems(catalog,selectedItems,operation);
 if(!items.length)throw new Error('Select at least one system before submitting.');
 return {typeCode,branchId:people[0].branchId,departmentId:people[0].departmentId,justification:form.justification||'',details,people,items,consent:true};
}

export function requestFromDatabase(ticket,detail){
 const {details,steps,queries,items,people,...summary}=detail;
 const approvalHistory=(detail.approvalHistory||steps||[]).filter(step=>step.status!=='Waiting');
 const queryHistory=(queries||[]).map(query=>({...query,employeeId:query.authorEmployeeId,targetIds:[query.recipientEmployeeId],targetNames:[query.recipient],responses:query.responseAt?[{employeeId:query.recipientEmployeeId,response:query.response,responseBy:query.recipient,responseAt:query.responseAt}]:[]}));
 const hrClearance=detail.hrClearance?.length?{checks:people.map(person=>{
  const check=detail.hrClearance.find(row=>row.PersonId===person.id);
  return {police:check?.Police||'Pending',reference:check?.ReferenceCheck||'Pending',recommendation:check?.Recommendation||''};
 })}:ticket.hrClearance;
 return {...ticket,...summary,...Object.fromEntries(formKeys.flatMap(key=>details?.[key]?[[key,details[key]]]:[])),
  id:ticket.id,sqlId:detail.id,action:ticket.action,system:ticket.system||[...new Set(items.map(item=>item.system))].join(', '),transferChange:details?.transferChange||ticket.transferChange,
  approvalHistory,queryHistory,queryTargetIds:(queries||[]).filter(query=>!query.resolvedAt).map(query=>query.recipientEmployeeId),hrClearance,sqlPeople:people,sqlItems:items};
}
