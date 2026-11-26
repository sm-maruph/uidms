import {emailTemplateCategory,requestTypeLabel} from './requestTitle.js';
import { canReceiveCredentials } from './newUserWorkflow.js';
import {mergeProcessingCc,requiredProcessingCc} from './processingRecipients.js';
export function fulfilmentItems(ticket) {
 if(ticket.typeCode==='movement'&&ticket.transferAccess?.version===1){const groups=new Map();for(const item of ticket.sqlItems||[]){if(item.operation==='revoke'||ticket.transferAccess.current.some(old=>old.systemId===item.systemId&&(old.systemRoleId||null)===(item.systemRoleId||null)))continue;const person=ticket.sqlPeople?.find(person=>person.id===item.personId);const key=`${person?.employeeId}:${item.systemId}`;const row=groups.get(key)||{system:item.system,systemId:item.systemId,person:person?.name||ticket.transferChange?.employee?.name,employeeId:person?.employeeId||ticket.transferChange?.employee?.employeeId,role:'',key};row.role=[row.role,item.role].filter(Boolean).join(', ');groups.set(key,row);}return [...groups.values()];}

 const data={...ticket,...ticket.submittedForm?.data};
 const result=[];
 const add=(system,person=data.requesterProfile?.name||ticket.name,employeeId=ticket.requesterId)=>{if(system&&!result.some(item=>item.system===system&&item.employeeId===employeeId)){
   const transferRole=['newAccess','newOtherAccess','newTestSystems','additionalTestSystems'].flatMap(key=>data.transferDetails?.[key]?.[system]||[]).join(', ');
   const personRole=data.batchDetails?.people?.find(item=>item.employeeId===employeeId)?.systems?.find(row=>row.system===system)?.role;
   const employee=[...(data.transferDetails?.people||[]),...(data.batchDetails?.people||[]),...(data.newUserDetails?.people||[]),data.deactivationDetails,data.requesterProfile].find(row=>row?.employeeId===employeeId);
   const requested=employee?.requestedSystems?.find(row=>row.system===system);
   const requestedRole=Array.isArray(requested?.roles)?requested.roles.join(', '):requested?.role;
   result.push({system,person,employeeId,systemId:requested?.systemId||employee?.access?.systemIds?.[system]||'',branch:employee?.branch||employee?.toBranch||ticket.branch||'',department:employee?.department||employee?.toDepartment||ticket.department||'',role:data.upgradeDetails?.roles?.[system]||transferRole||personRole||requestedRole||ticket.role||'',reason:requested?.reason||'',key:`${employeeId}:${system}`});
 }};
 const transfer=data.transferDetails;
 if(transfer){
  for(const person of transfer.people?.length?transfer.people:[{fullName:ticket.name,employeeId:ticket.requesterId}]){
   for(const key of ['newAccess','newOtherAccess','newTestSystems','additionalTestSystems'])for(const system of new Set([...Object.keys(transfer[key]||{}),...Object.keys(transfer[`${key}Systems`]||{})]))if(transfer[`${key}Systems`]?.[system]??Boolean(transfer[key]?.[system]?.length))add(system,person.fullName||person.name,person.employeeId);
   for(const row of person.requestedSystems||[])add(row.system,person.fullName||person.name,person.employeeId);
  }
 }
 for(const person of data.batchDetails?.people||[])for(const row of person.systems||[])add(row.system,person.name,person.employeeId);
 for(const person of data.newUserDetails?.people||[]){if(person.adId)add('AD ID',person.name,person.employeeId);if(person.email)add('Email',person.name,person.employeeId);}
 for(const system of data.upgradeDetails?.systems||data.resetDetails?.systems||data.deactivationDetails?.systems||[])add(system);
 if(!result.length)String(ticket.system||'Request service').split(/,\s*| \+ /).forEach(system=>add(system));
 return result;
}
export const citoApproved=ticket=>(ticket.approvalHistory||[]).some(event=>event.role==='CITO'&&event.status==='Approved');
export const readyForFulfilment=ticket=>['Approved','In progress','IT processing','HO processing'].includes(ticket.state);
export function processingEmail(ticket,items=fulfilmentItems(ticket)){
 const requiredCc=requiredProcessingCc(ticket.requesterProfile?.email);
 return {to:'',requiredCc,cc:requiredCc.join(', '),subject:`[${ticket.id}] ${requestTypeLabel(ticket.action)} - IT processing`,body:`Dear Team,

Please process the following approved identity service request.

Ticket: ${ticket.id}
Request: ${requestTypeLabel(ticket.action)}
Requester: ${ticket.name}
Branch: ${ticket.branch}

Requested systems:
${items.map(item=>`- ${item.system}: ${item.person} (${item.employeeId||'ID not recorded'})${item.role?` / Role: ${item.role}`:''}`).join('\n')}

Business justification:
${ticket.justification||'See request form.'}

Please confirm completion to IT. Credentials should be delivered through the approved secure channel.

Regards,
Information Technology Department`};
}
export function processingEmailDraft(ticket) {
 const draft={...(ticket.fulfilment?.email||processingEmail(ticket))};
 draft.requiredCc=requiredProcessingCc(ticket.requesterProfile?.email);
 draft.cc=mergeProcessingCc(draft.cc,draft.requiredCc).join(', ');
 return draft;
}
export function generalProcessingDraft(ticket){
 const systems=[...new Set(fulfilmentItems(ticket).map(item=>item.system))];
 return {...processingEmailDraft(ticket),id:'general',name:'General processing',systems};
}
export function mockProcessingDrafts(ticket,templates){
 const data={...ticket,...ticket.submittedForm?.data};
 const requestPerson=data.deactivationDetails||data.resetDetails||data.requesterProfile||{};
 const items=fulfilmentItems(ticket).map(item=>data.deactivationDetails?{...item,person:requestPerson.name||item.person,employeeId:requestPerson.employeeId||item.employeeId,branch:requestPerson.branch||item.branch,department:requestPerson.department||item.department}:item);
 for(const person of data.newUserDetails?.people||[]){
  for(const system of [person.msOffice&&'MS Office',person.otherSoftwareEnabled&&'Other software'].filter(Boolean))items.push({system,person:person.name,employeeId:person.employeeId,department:person.department,branch:person.branch});
 }
 const category=emailTemplateCategory(ticket.action);
 const categoryTemplates=category?templates.filter(template=>template.category===category):[];
 const defaultTemplate=categoryTemplates.find(template=>!template.systemIds.length);
 const templateFor=item=>categoryTemplates.find(template=>template.systemIds.includes(item.system))||defaultTemplate;
 const matching=items.map(item=>({item,template:templateFor(item)}));
 const drafts=templates.flatMap(template=>{
  const rows=matching.filter(row=>row.template===template).map(row=>row.item);
  if(!rows.length)return [];
  const systems=[...new Set(rows.map(row=>row.system))];
  const values={ticketNumber:ticket.id,requestType:requestTypeLabel(ticket.action),justification:ticket.justification,
   operation:ticket.resetDetails?'reset':ticket.deactivationDetails?'revoke':ticket.upgradeDetails?'update':'grant',
   items:rows.map(row=>`- ${row.system}: ${row.person} (${row.employeeId})${row.role?` / ${row.role}`:''}`).join('\n')};
  for(const [key,field] of Object.entries({name:'person',employeeId:'employeeId',system:'system',systemId:'systemId',role:'role',branch:'branch',department:'department',reason:'reason'})){
   values[key]=[...new Set(rows.map(row=>row[field]).filter(Boolean))].join(', ');
  }
  const join=values=>[...new Set(values.flat().filter(Boolean))].join(', ');
  const people=rows.map(row=>data.newUserDetails?.people?.find(person=>person.employeeId===row.employeeId)||requestPerson);
  Object.assign(values,{
   systemId:values.systemId||requestPerson.userId||requestPerson.systemId,
   designation:join(people.map(person=>person.designation)),email:data.mailingGroupDetails?.profileEmail||data.autoForwardDetails?.profileEmail||data.externalDeviceDetails?.email||join(people.map(person=>typeof person.email==='string'?person.email:'')),
   requestedEmail:data.emailCreationDetails?.email||join(rows.map((row,index)=>row.system==='Email'&&people[index].preferredEmail?people[index].preferredEmail+'@combankbd.com':'')),
   adRole:join(rows.map((row,index)=>row.system==='AD ID'&&people[index].adRole)),otherSoftware:join(rows.map((row,index)=>row.system==='Other software'&&people[index].otherSoftware)),
   scope:data.deactivationDetails?.scope,groupAction:data.mailingGroupDetails?.action,mailingGroups:join(data.mailingGroupDetails?.groupAddresses||[]),forwardTo:data.autoForwardDetails?.forwardTo,
   driveName:join(rows.map(row=>data.batchDetails?.people?.find(person=>person.employeeId===row.employeeId)?.systems?.find(system=>system.system===row.system)?.driveName)),
   deviceModel:data.externalDeviceDetails?.deviceModel,deviceNumber:data.externalDeviceDetails?.deviceNumber,serialNumber:data.externalDeviceDetails?.serialNumber,
   currentRole:join(rows.map(row=>data.upgradeDetails?.currentAccess?.[row.system])),similarId:join(rows.map(row=>data.upgradeDetails?.similarIds?.[row.system]||data.transferDetails?.similarIds?.[row.system])),
   additionalFunction:join(rows.map(row=>data.upgradeDetails?.additionalFunctions?.[row.system]||['newAccess','newOtherAccess','newTestSystems','additionalTestSystems'].map(key=>data.transferDetails?.[key+'Extra']?.[row.system]?.additionalFunction))),
  });
  const render=value=>value.replace(/\{\{\s*(\w+)\s*\}\}/g,(_,key)=>Object.hasOwn(values,key)?values[key]||'':'');
  const requiredCc=requiredProcessingCc(ticket.requesterProfile?.email);
  return [{id:template.id,name:template.name,systems,to:template.to,requiredCc,cc:mergeProcessingCc(template.cc,requiredCc),subject:render(template.subject).replace(/[\r\n]+/g,' '),body:render(template.body)}];
 });
 if(!drafts.length)return [generalProcessingDraft(ticket)];
 const unassigned=matching.filter(row=>!row.template).map(row=>row.item);
 if(unassigned.length)drafts.push({...processingEmail(ticket,unassigned),id:'general',name:'General processing',systems:[...new Set(unassigned.map(row=>row.system))]});
 return drafts;
}
export function validateCredentials(ticket,rows){
 const items=fulfilmentItems(ticket);
 if(items.some(item=>!rows.some(row=>row.key===item.key&&row.username?.trim()&&row.password?.trim())))return 'Enter an ID or email and a temporary password for every requested system.';
 return '';
}
export function credentialVisible(delivery,ticket,profile,now=Date.now()){
 return Boolean(delivery&&canReceiveCredentials(ticket,profile)&&ticket.state==='Completed'&&now<delivery.expiresAt);
}
