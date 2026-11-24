export const requestTypeLabel=type=>({'New ID creation (on behalf)':'New AD request','IDrive access':'I Drive / S Drive Access','N Drive access':'N Drive Access','ID reset / unlock':'Unlock / Reset','ID Unlock / Reset':'Unlock / Reset','ID Reset / Unlock':'Unlock / Reset','Branch / Department change':'Branch / Department Transfer','Branch / Department Change':'Branch / Department Transfer'}[type]||type);

export const emailTemplateCategories={
 'new-id':'New ID creation',
 'employee-deactivation':'Employee ID deactivation',
 'system-deactivation':'System ID deactivation',
 reset:'Unlock / Reset',
 upgrade:'ID Role Upgrade',
 'email-creation':'Email Creation',
 'mailing-group':'Mailing Group Inclusion / Exclusion',
 'auto-forward':'Auto-forward Change',
 drive:'I Drive / S Drive Access',
 external:'External Device Email Access',
};

export const emailTemplateCategory=action=>({
 'System ID creation (self-request)':'new-id','New AD request':'new-id','New ID creation (on behalf)':'new-id','New ID creation':'new-id',
 'Employee ID deactivation':'employee-deactivation','System ID deactivation':'system-deactivation',
 'Unlock / Reset':'reset','ID upgrade':'upgrade','Email creation':'email-creation',
 'Mailing group change':'mailing-group','Auto-forward change':'auto-forward',
 'I Drive / S Drive Access':'drive','External device email access':'external',
}[requestTypeLabel(action)]);

export function requestTitle(ticket, compact=true) {
  const data={...ticket,...ticket.submittedForm?.data};
  const action=data.type||ticket.action;
  const systems=new Set();
  const add=name=>{if(name&&name!=='Multiple systems')systems.add(name);};
  const transfer=data.transferDetails||{};
  for(const key of ['newAccess','newOtherAccess','newTestSystems','additionalTestSystems']){
    const roles=transfer[key]||{};
    const flags=transfer[`${key}Systems`]||{};
    for(const system of new Set([...Object.keys(roles),...Object.keys(flags)]))if(flags[system]??Boolean(roles[system]?.length))add(system);
  }
  for(const person of transfer.people||[])for(const row of person.requestedSystems||[])add(row.system);
  for(const person of data.batchDetails?.people||[])for(const row of person.systems||[])add(row.system);
  for(const system of data.upgradeDetails?.systems||data.resetDetails?.systems||data.deactivationDetails?.systems||[])add(system);
  for(const person of data.newUserDetails?.people||[]){if(person.adId)add('AD ID');if(person.email)add('Email');}
  if(!systems.size)String(ticket.system||'').split(/,\s*| \+ /).forEach(add);
  const names=[...systems];
  const subject=compact&&names.length>3?`${names.slice(0,3).join(', ')} +${names.length-3} more`:names.join(', ');
  const label={'System ID creation (self-request)':'System ID creation','New ID creation':'System ID creation','New ID creation (on behalf)':'New AD request','ID upgrade':'ID Role Upgrade','ID reset / unlock':'ID reset / unlock','System ID deactivation':'System ID deactivation','Employee ID deactivation':'Employee ID deactivation','Branch transfer':'Branch transfer'}[action]||action;
  const displayLabel=requestTypeLabel(label);
  return subject?`${displayLabel} - ${subject}`:displayLabel;
}
