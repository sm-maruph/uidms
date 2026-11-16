export const AUDIT_KEY = 'uidmsAuditEventsV1';
export const auditTypes = ['Create','Update','Delete','Approval','Rejection','Query','Response','Remark','Processing','Complete','Login','Logout','Failed login','Failed logout'];
export const dhakaDate = at => at && Number.isFinite(Date.parse(at)) ? new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at)) : '';
export const auditTimestamp = at => at && Number.isFinite(Date.parse(at)) ? new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Dhaka',dateStyle:'medium',timeStyle:'medium'}).format(new Date(at)) : 'Time not recorded';

export function readAudit(storage = localStorage) {
  try { const value=JSON.parse(storage.getItem(AUDIT_KEY)||'[]'); return Array.isArray(value)?value.filter(event=>event&&typeof event.id==='string'):[]; } catch { return []; }
}
export function mergeAudit(previous, incoming) {
  const events=new Map(previous.map(event=>[event.id,event]));
  for(const event of incoming) if(!events.has(event.id)) events.set(event.id,event);
  return [...events.values()];
}
// The browser cannot supply the client IP reliably. A hosting backend can inject it.
export const clientIp = () => typeof window!=='undefined' && typeof window.__UIDMS_CLIENT_IP__==='string' ? window.__UIDMS_CLIENT_IP__ : 'Not available (demo)';
export function auditEvent(type, actor, details={}) {
  return {id:globalThis.crypto.randomUUID(),type,category:'Session',entityId:actor?.employeeId||'Unknown account',actor:actor?.name||'Unknown user',employeeId:actor?.employeeId||'',role:actor?.role||'',at:new Date().toISOString(),ip:clientIp(),outcome:type.startsWith('Failed')?'Failed':'Success',...details};
}
export function ticketAuditEvents(ticket) {
  const base={category:'Ticket',ticketId:ticket.id,entityId:ticket.id,title:ticket.action,requestType:ticket.action,subject:ticket.name,branch:ticket.branch,system:ticket.system,ip:'Not recorded',outcome:'Success'};
  const events=[];
  const add=(key,type,item={},message='')=>events.push({...base,id:`ticket:${ticket.id}:${key}:${item.at||item.responseAt||'undated'}`,type,actor:item.by||item.responseBy||ticket.name,employeeId:item.employeeId||'',role:item.role||'',at:item.at||item.responseAt||'',message,ip:item.ip||base.ip,outcome:type==='Rejection'?'Rejected':'Success'});
  add('create','Create',{by:ticket.name,employeeId:ticket.requesterId,role:ticket.requesterRole||ticket.requesterProfile?.role,at:ticket.createdAt,ip:ticket.auditIp},'Request created');
  (ticket.revisionHistory||[]).forEach((item,index)=>add(`revision:${index}`,'Update',item,'Request form updated'));
  (ticket.approvalHistory||[]).forEach((item,index)=>add(`approval:${index}`,item.status==='Rejected'?'Rejection':'Approval',item,`${item.stage||item.role}: ${item.status}${item.remark?` — ${item.remark}`:''}`));
  (ticket.queryHistory||[]).forEach((item,index)=>{
    add(`query:${index}`,'Query',item,`${item.message||''}${item.targetNames?.length?` | To: ${item.targetNames.join(', ')}`:''}`);
    (item.responses||[]).forEach((response,n)=>add(`query:${index}:response:${n}`,'Response',response,response.response||''));
  });
  (ticket.remarks||[]).forEach((item,index)=>add(`remark:${index}`,'Remark',item,item.message||''));
  (ticket.fulfilmentHistory||[]).forEach((item,index)=>add(`fulfilment:${index}`,item.status==='Fulfilled'?'Complete':'Processing',item,item.status));
  if(ticket.transferChange?.employeeSubmittedAt&&!events.some(event=>event.type==='Approval'&&event.at===ticket.transferChange.employeeSubmittedAt)) add('employee-review','Update',{by:ticket.transferChange.employee?.name,employeeId:ticket.transferChange.employee?.employeeId,at:ticket.transferChange.employeeSubmittedAt},'Employee access review submitted');
  return events;
}
export function deletionAuditEvents(entry) {
  return {...entry,id:`ticket:${entry.ticketId}:delete`,type:'Delete',category:'Ticket',entityId:entry.ticketId,title:entry.requestType,actor:entry.by,ip:entry.ip||'Not recorded',message:entry.action,outcome:'Success'};
}
export function filterAudit(events, filters={}) {
  const term=(filters.search||'').trim().toLowerCase();
  return events.filter(event=>{
    const date=dhakaDate(event.at);
    return (!filters.from||(date&&date>=filters.from))&&(!filters.to||(date&&date<=filters.to))&&(!filters.type||filters.type==='All'||event.type===filters.type)&&(!filters.category||filters.category==='All'||event.category===filters.category)&&(!filters.outcome||filters.outcome==='All'||event.outcome===filters.outcome)&&(!filters.requestType||filters.requestType==='All'||event.requestType===filters.requestType)&&(!term||[event.entityId,event.ticketId,event.title,event.type,event.category,event.actor,event.employeeId,event.role,event.subject,event.branch,event.system,event.message,event.ip].join(' ').toLowerCase().includes(term));
  }).sort((a,b)=>filters.sort==='oldest'?String(a.at).localeCompare(String(b.at)):filters.sort==='type'?a.type.localeCompare(b.type)||String(b.at).localeCompare(String(a.at)):filters.sort==='actor'?String(a.actor).localeCompare(String(b.actor)):String(b.at).localeCompare(String(a.at)));
}
export function groupAudit(events, mode='entity') {
  const groups=new Map();
  for(const event of events) {
    const key=mode==='type'?event.type:event.category==='Ticket'?`Ticket · ${event.entityId}`:event.category==='Session'?`Session · ${event.sessionId||event.entityId}`:`${event.category} · ${event.entityId}`;
    if(!groups.has(key)) groups.set(key,{key,title:mode==='type'?event.type:event.title||event.subject||event.actor,events:[]});
    groups.get(key).events.push(event);
  }
  return [...groups.values()];
}
const csvCell=value=>{
  let text=String(value??'');
  if(/^[\s]*[=+@-]/.test(text)) text=`'${text}`;
  return `"${text.replaceAll('"','""')}"`;
};
export function auditCsv(events) {
  const columns=[['Event ID','id'],['Ticket / entity','entityId'],['Category','category'],['Request type','requestType'],['Subject','subject'],['Branch','branch'],['Systems','system'],['Event type','type'],['Outcome','outcome'],['Actor','actor'],['Employee ID','employeeId'],['Role','role'],['IP address','ip'],['Session','sessionId'],['Timestamp UTC','at'],['Timestamp Asia/Dhaka',null],['Details','message']];
  return '\uFEFF'+[columns.map(([label])=>csvCell(label)).join(','),...events.map(event=>columns.map(([,key])=>csvCell(key?event[key]:auditTimestamp(event.at))).join(','))].join('\r\n');
}
