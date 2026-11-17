export const queryRaisedBy = (query,profile) => Boolean(profile?.employeeId)&&(query.employeeId?query.employeeId===profile.employeeId:Boolean(profile.name)&&query.by===profile.name);

export function queriesRaisedBy(requests,profile) {
 return requests.flatMap(ticket=>(ticket.queryHistory||[]).flatMap((query,index)=>queryRaisedBy(query,profile)?[{ticket,query,index,key:`${ticket.id}:${index}`}]:[]));
}

export function queryInboxGroups(requests,profile) {
 const query=queriesForUser(requests,profile.employeeId);
 const response=queriesRaisedBy(requests,profile).map(entry=>({...entry,pending:false,response:entry.query.responses?.at(-1),sent:true}));
 const all=[...new Map([...response,...query].map(entry=>[entry.key,entry])).values()]
   .sort((a,b)=>Number(b.pending)-Number(a.pending)||String(b.query.at||'').localeCompare(String(a.query.at||'')));
 return {query,response,all};
}

export function queriesForUser(requests, employeeId) {
  return requests.flatMap(ticket => (ticket.queryHistory || []).flatMap((query,index) => {
    if (!(query.targetIds || []).includes(employeeId)) return [];
    const response=(query.responses || []).find(item=>item.employeeId===employeeId);
    const pending=!response && ticket.state==='Query' && index===ticket.queryHistory.length-1 && (ticket.queryTargetIds||[]).includes(employeeId);
    return [{ticket,query,index,response,pending,key:`${ticket.id}:${index}`}];
  })).sort((a,b)=>Number(b.pending)-Number(a.pending)||String(b.query.at||'').localeCompare(String(a.query.at||'')));
}

export function respondToQuery(ticket,index,profile,message,at=new Date().toISOString()) {
  const query=ticket.queryHistory?.[index];
  if (!message.trim() || !query || ticket.state!=='Query' || index!==ticket.queryHistory.length-1 || !(ticket.queryTargetIds||[]).includes(profile.employeeId) || !(query.targetIds||[]).includes(profile.employeeId) || (query.responses||[]).some(item=>item.employeeId===profile.employeeId)) return ticket;
  const queryHistory=ticket.queryHistory.map((item,i)=>i!==index?item:{...item,responses:[...(item.responses||[]),{employeeId:profile.employeeId,response:message.trim(),responseBy:profile.name,responseAt:at,role:profile.role}]});
  const remaining=ticket.queryTargetIds.filter(id=>id!==profile.employeeId);
  return {...ticket,queryHistory,queryTargetIds:remaining,state:remaining.length?'Query':'In review',step:remaining.length?ticket.step:ticket.queryReturnStep||'Branch manager review',assignedRole:remaining.length?null:ticket.queryReturnRole||'Branch manager'};
}
