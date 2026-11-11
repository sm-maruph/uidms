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
  const queryHistory=ticket.queryHistory.map((item,i)=>i!==index?item:{...item,responses:[...(item.responses||[]),{employeeId:profile.employeeId,response:message.trim(),responseBy:profile.name,responseAt:at}]});
  const remaining=ticket.queryTargetIds.filter(id=>id!==profile.employeeId);
  return {...ticket,queryHistory,queryTargetIds:remaining,state:remaining.length?'Query':'In review',step:remaining.length?ticket.step:ticket.queryReturnStep||'Branch manager review',assignedRole:remaining.length?null:ticket.queryReturnRole||'Branch manager'};
}
