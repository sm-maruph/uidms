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
  const label={'System ID creation (self-request)':'System ID creation','New ID creation':'System ID creation','New ID creation (on behalf)':'New employee ID request','ID upgrade':'ID role change','ID reset / unlock':'ID reset / unlock','System ID deactivation':'System ID deactivation','Employee ID deactivation':'Employee ID deactivation','Branch transfer':'Branch transfer'}[action]||action;
  return subject?`${label} - ${subject}`:label;
}
