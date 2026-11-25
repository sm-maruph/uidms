import {hasPortalRole} from './portalRoles.js';
import React,{useEffect,useState} from 'react';
import SystemEmailTemplates from './SystemEmailTemplates.jsx';
import EmailDraftCard from './EmailDraftCard.jsx';
import {useSqlRefresh} from './useSqlRefresh.js';
import {retryAfterSeconds} from './rateLimit.js';
import {mfaErrorMessages} from './mfaErrors.js';
import '../system-email.css';

const origin=import.meta.env.VITE_UIDMS_API_ORIGIN||(import.meta.env.DEV?`${window.location.protocol}//${window.location.hostname}:4000`:'');
const adminRoles=['Admin','Platform Admin','Super Admin'];
const allowedRoles=['IT',...adminRoles];
const errorMessages={UNAUTHENTICATED:'Sign in again to continue.',SESSION_EXPIRED:'Your session expired. Sign in again to continue.',CSRF_INVALID:'Your session changed. Sign in again and retry.',FORBIDDEN:'Your account does not have permission for this action.',REQUEST_NOT_FOUND:'This request is no longer available to your account.',NOT_ASSIGNED:'This request is assigned to another approver.',REAUTHENTICATION_REQUIRED:'Sign in again before completing this action.',CONFLICT:'Another record already uses those details.',INTERNAL_ERROR:'UIDMS could not complete this action. Try again shortly.'};

export async function api(path,{method='GET',body,csrfToken,signal,format}={}){
 const response=await fetch(`${origin}/api${path}`,{method,signal,credentials:'include',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(csrfToken?{'X-CSRF-Token':csrfToken}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}).catch(error=>{
  if(signal?.aborted)throw error;
  throw new Error('Could not connect to the UIDMS API.');
 });
 if(response.status===204)return;
 if(response.ok&&format==='blob')return response.blob();
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data){
  const {code,message}=data?.error||{};
  if(response.status===401&&!path.startsWith('/auth/'))window.dispatchEvent(new CustomEvent('uidms:session-expired'));
  const text=message&&message!==code?message:mfaErrorMessages[code]||errorMessages[code]||(response.status===429?'Too many requests. Wait a moment and try again.':'UIDMS could not complete this action.');
  throw Object.assign(new Error(text),{status:response.status,code,...(code==='WORKFLOW_ASSIGNMENTS_INCOMPLETE'?{details:data?.error?.details}:{}),...(response.status===429?{retryAfterSeconds:retryAfterSeconds(response.headers.get('Retry-After'),data?.error?.retryAfterSeconds)}:{})});
 }
 return data;
}

// Ready for the portal-wide session supplied by the future AD integration.
export default function SystemEmailWorkspace({session}){
 const [view,setView]=useState('templates');
 if(!session||!hasPortalRole(session.user,...allowedRoles))return null;
 const it=hasPortalRole(session.user,'IT','Admin','Super Admin');
 return <div className="system-email-workspace">
  {it&&<nav className="fulfilment-buttons" aria-label="Email workspace"><button type="button" className="button button-subtle" aria-pressed={view==='templates'} onClick={()=>setView('templates')}>System Email Templates</button><button type="button" className="button button-subtle" aria-pressed={view==='drafts'} onClick={()=>setView('drafts')}>Processing drafts</button></nav>}
  {view==='templates'?<SqlTemplates session={session} admin={hasPortalRole(session.user,...adminRoles)}/>:<ProcessingDrafts session={session}/>}
 </div>;
}

function SqlTemplates({session,admin}){
 const [catalog,setCatalog]=useState(null);
 const [requestTypes,setRequestTypes]=useState([]);
 const [error,setError]=useState('');
 const load=async signal=>{
  const [catalog,lookups]=await Promise.all([api('/system-email-templates',{signal}),admin?api('/lookups',{signal}):null]);
  if(signal?.aborted)return;
  setCatalog(catalog);setError('');
  if(lookups)setRequestTypes(lookups.requestTypes.map(row=>({code:row.Code,name:row.Name,steps:lookups.workflowSteps.filter(step=>step.TypeCode===row.Code).map(step=>step.Role)})));
 };
 useEffect(()=>{
  const controller=new AbortController();
  load(controller.signal).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
  return ()=>controller.abort();
 },[admin]);
 useSqlRefresh(true,load,error=>setError(error.message));
 const update=async(path,method,body)=>{
  await api(`/system-email-templates${path}`,{method,body,csrfToken:session.csrfToken});
  await load();
 };
 if(!catalog)return error?<p role="alert">{error}</p>:<p>Loading templates…</p>;
 return <>{error&&<p role="alert">{error}</p>}<SystemEmailTemplates {...catalog} allowCategories requestTypes={requestTypes}
  onSave={({id,...body})=>update(id?`/${id}`:'',id?'PUT':'POST',body)}
  onDelete={item=>update(`/${item.id}`,'DELETE',{version:item.version})}
  onWorkflow={admin?(item,code,steps)=>update(`/${item.id}/workflows/${code}`,'PUT',{steps}):undefined}/></>;
}

function ProcessingDrafts({session}){
 const [status,setStatus]=useState('Approved');
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState('');
 const [page,setPage]=useState(1);
 const [tickets,setTickets]=useState(null);
 const [ticket,setTicket]=useState(null);
 const [drafts,setDrafts]=useState(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const path=ticket&&`/requests/${ticket.id}/email-drafts`;
 useSqlRefresh(!busy,async signal=>{
  if(path){
   const [data,current]=await Promise.all([api(path,{signal}),api('/requests/'+ticket.id,{signal})]);
   if(!signal.aborted){setDrafts(data.items);setTicket(previous=>previous?.id===current.id?{...previous,...current}:previous);}
  }else{
   const data=await api(`/requests?${new URLSearchParams({scope:'visible',status,search:filter,page})}`,{signal});
   if(!signal.aborted)setTickets(data);
  }
 },error=>setError(error.message),10000,path||`${status}:${filter}:${page}`);
 useEffect(()=>{
  const controller=new AbortController();
  setTickets(null);setError('');
  api(`/requests?${new URLSearchParams({scope:'visible',status,search:filter,page})}`,{signal:controller.signal}).then(setTickets).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
  return ()=>controller.abort();
 },[status,filter,page]);
 useEffect(()=>{
  if(!path)return;
  const controller=new AbortController();
  api(path,{signal:controller.signal}).then(data=>setDrafts(data.items)).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
  return ()=>controller.abort();
 },[path]);
 const initialize=async()=>{
  setBusy(true);setError('');
  try{const data=await api(path,{method:'POST',body:{},csrfToken:session.csrfToken});setDrafts(data.items);}
  catch(error){setError(error.message);}finally{setBusy(false);}
 };
 const markSent=async(draft,email)=>{
  const edited=Object.keys(email).some(key=>JSON.stringify(email[key])!==JSON.stringify(draft[key]));
  await api(`${path}/${draft.id}/sent`,{method:'POST',csrfToken:session.csrfToken,body:{confirmedSent:true,...(edited?{email}:{})}});
  setDrafts((await api(path)).items);
 };
 const recordProcessing=async event=>{
  event.preventDefault();
  const fields=new FormData(event.currentTarget);
  setBusy(true);setError('');
  try{
   const requestPath=`/requests/${ticket.id}`;
   const latest=await api(requestPath);
   await api(`${requestPath}/processing`,{method:'POST',csrfToken:session.csrfToken,body:{version:latest.version,reference:fields.get('reference'),notes:fields.get('notes')}});
   setTicket(current=>({...current,state:'HO processing'}));
  }catch(error){setError(error.message);}finally{setBusy(false);}
 };
 const canProcess=ticket&&ticket.requesterUserId!==session.user.id&&ticket.subjectUserId!==session.user.id;
 return <section className="panel directory-panel system-email-panel"><h2>Processing drafts</h2>
  {error&&<p role="alert">{error}</p>}
  {ticket?<><div className="fulfilment-buttons"><button className="button button-subtle" type="button" disabled={busy} onClick={()=>{setTicket(null);setDrafts(null);setError('');}}>Back to tickets</button></div>
   <h3>{ticket.ticketNumber} · {ticket.action}</h3>
   {drafts===null?<p>Loading drafts…</p>:drafts.length?<div className="fulfilment-panel"><p>{drafts.filter(draft=>draft.sentAt).length} of {drafts.length} drafts confirmed sent</p>{drafts.map(draft=><EmailDraftCard key={draft.id} draft={draft} requesterEmail={ticket.requesterProfile?.email} canSend={ticket.state!=='Completed'&&canProcess} onSent={markSent}/>)}</div>:<><p>No drafts are recorded for this ticket.</p>{ticket.state==='Approved'&&canProcess&&<button className="button button-primary" type="button" disabled={busy} onClick={initialize}>Create processing drafts</button>}</>}
   {canProcess&&['Approved','IT processing'].includes(ticket.state)&&drafts?.length>0&&drafts.every(draft=>draft.sentAt)&&<form className="system-email-form" onSubmit={recordProcessing}>
    <h3>Record processing</h3><label>Processing reference<input name="reference" required maxLength={250}/></label><label>Notes<textarea name="notes" rows="3" maxLength={2000}/></label><button className="button button-primary" disabled={busy} type="submit">Record processing</button>
   </form>}
   {ticket.state==='HO processing'&&<p>HO processing</p>}
  </>:<>
   <form className="system-email-form" onSubmit={event=>{event.preventDefault();setPage(1);setFilter(search.trim());}}>
    <label>Status<select value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}>{['Approved','IT processing','HO processing','Completed'].map(value=><option key={value}>{value}</option>)}</select></label>
    <label>Search by ticket or requester<input type="search" maxLength={100} value={search} onChange={event=>setSearch(event.target.value)}/></label><button className="button button-subtle" type="submit">Search</button>
   </form>
   {tickets?<><div className="system-email-list">{tickets.items.map(row=><article key={row.id}><strong>{row.ticketNumber}</strong><p>{row.action} · {row.name}</p><button className="button button-subtle" type="button" onClick={()=>{setTicket(row);setDrafts(null);setError('');}}>View drafts</button></article>)}{!tickets.items.length&&<p>No tickets found.</p>}</div>
    <div className="fulfilment-buttons"><button className="button button-subtle" type="button" disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page}</span><button className="button button-subtle" type="button" disabled={page*tickets.pageSize>=tickets.total} onClick={()=>setPage(page+1)}>Next</button></div></>:<p>Loading tickets…</p>}
  </>}
 </section>;
}
