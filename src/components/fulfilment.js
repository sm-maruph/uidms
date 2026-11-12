export function fulfilmentItems(ticket) {
 const data={...ticket,...ticket.submittedForm?.data};
 const result=[];
 const add=(system,person=data.requesterProfile?.name||ticket.name,employeeId=ticket.requesterId)=>{if(system&&!result.some(item=>item.system===system&&item.employeeId===employeeId)){
   const transferRole=['newAccess','newOtherAccess','newTestSystems','additionalTestSystems'].flatMap(key=>data.transferDetails?.[key]?.[system]||[]).join(', ');
   const personRole=data.batchDetails?.people?.find(item=>item.employeeId===employeeId)?.systems?.find(row=>row.system===system)?.role;
   result.push({system,person,employeeId,role:data.upgradeDetails?.roles?.[system]||transferRole||personRole||ticket.role||'',key:`${employeeId}:${system}`});
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
export const readyForFulfilment=ticket=>['Approved','In progress'].includes(ticket.state);
export function processingEmail(ticket){
 const items=fulfilmentItems(ticket);
 return {to:'',cc:ticket.requesterProfile?.email||'',subject:`[${ticket.id}] ${ticket.action} - IT processing`,body:`Dear Team,

Please process the following approved identity service request.

Ticket: ${ticket.id}
Request: ${ticket.action}
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
export function validateCredentials(ticket,rows){
 const items=fulfilmentItems(ticket);
 if(items.some(item=>!rows.some(row=>row.key===item.key&&row.username?.trim()&&row.password?.trim())))return 'Enter an ID or email and a temporary password for every requested system.';
 return '';
}
export function credentialVisible(delivery,ticket,profile,now=Date.now()){
 return Boolean(delivery&&ticket.requesterId===profile?.employeeId&&ticket.state==='Completed'&&now<delivery.expiresAt);
}
