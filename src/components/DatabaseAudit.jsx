import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {api} from './SystemEmailWorkspace.jsx';
import {useSqlRefresh} from './useSqlRefresh.js';
import Icon from './Icon.jsx';
import {auditTime,auditLabel,auditTone,eventDescription,endReasonLabel,sessionDuration,appendAuditEvents} from './sessionAudit.js';
import '../database-audit.css';

const emptyFilters={search:'',from:'',to:'',category:'all'};
export default function DatabaseAudit(){
 const [filters,setFilters]=useState(emptyFilters),[query,setQuery]=useState(emptyFilters),[page,setPage]=useState(1);
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selected,setSelected]=useState(null);
 const load=async signal=>{const params=new URLSearchParams({page:String(page),pageSize:'20',...Object.fromEntries(Object.entries(query).filter(([,value])=>value))});const result=await api('/audit?'+params,{signal});if(!signal?.aborted){setData(result);setError('');setLoading(false);}};
 useEffect(()=>{const controller=new AbortController();setLoading(true);load(controller.signal).catch(err=>{if(!controller.signal.aborted){setError(err.message);setLoading(false);}});return()=>controller.abort();},[page,query]);
 useSqlRefresh(true,load,err=>setError(err.message),10000,JSON.stringify({page,query}));
 const update=(field,value)=>setFilters(current=>({...current,[field]:value}));
 const pages=Math.max(1,Math.ceil((data?.total||0)/20));
 return <section className="panel database-audit" aria-labelledby="database-audit-title">
  <header className="da-heading"><span className="da-heading-icon"><Icon name="clock" size={25}/></span><div><p className="eyebrow">SECURITY & ACCOUNTABILITY</p><h1 id="database-audit-title">Audit trail</h1><p>Review user sessions, IP addresses and recorded activity.</p></div><button className="button button-subtle" type="button" disabled={loading} onClick={()=>{setLoading(true);load().catch(err=>setError(err.message)).finally(()=>setLoading(false));}}>Refresh</button></header>
  <div className="da-statistics"><div><span><Icon name="grid" size={17}/>Recorded events</span><strong>{data?.total??'—'}</strong></div><div><span><Icon name="key" size={17}/>Sign-ins</span><strong>{data?.stats?.signIns??'—'}</strong></div><div><span><Icon name="users" size={17}/>People</span><strong>{data?.stats?.people??'—'}</strong></div></div>
  <form className="da-filters" onSubmit={event=>{event.preventDefault();if(filters.from&&filters.to&&filters.from>filters.to){setError('End date must be on or after start date.');return;}setPage(1);setQuery({...filters});}}>
   <label className="da-search">Search<div><Icon name="search" size={16}/><input aria-label="Search audit activity" value={filters.search} maxLength={100} placeholder="Name, employee ID, IP or ticket" onChange={event=>update('search',event.target.value)}/></div></label>
   <label>Activity<select value={filters.category} onChange={event=>update('category',event.target.value)}>{[['all','All activity'],['auth','Sign-in / sign-out'],['requests','Requests'],['approvals','Recommendations'],['queries','Queries'],['configuration','Configuration'],['navigation','Page views']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label>From (Dhaka)<input aria-label="Audit start date" type="date" value={filters.from} onChange={event=>update('from',event.target.value)}/></label><label>To (Dhaka)<input aria-label="Audit end date" type="date" value={filters.to} min={filters.from||undefined} onChange={event=>update('to',event.target.value)}/></label>
   <button type="submit" className="button button-primary">Apply</button><button type="button" className="button button-subtle" onClick={()=>{setFilters(emptyFilters);setQuery({...emptyFilters});setPage(1);}}>Clear</button>
  </form>
  {error&&<p className="da-error" role="alert">{error}</p>}
  <div className="da-table-wrap" aria-busy={loading}><table className="da-table"><thead><tr><th>Time · Dhaka</th><th>Activity</th><th>Actor</th><th>IP address</th><th>Session</th></tr></thead><tbody>{data?.items.map(row=><tr key={row.Id}><td className="da-time">{auditTime(row.CreatedAt)}</td><td><div className="da-activity"><span className={`da-event-icon ${auditTone(row.Event)}`}><Icon name={row.Event.startsWith('auth.')?'key':row.Event==='page.viewed'?'eye':'clock'} size={16}/></span><div><strong>{auditLabel(row.Event)}</strong><small title={String(eventDescription(row))}>{eventDescription(row)}</small></div></div></td><td><strong>{row.Name||'System'}</strong><small>{row.EmployeeId||'System activity'}</small></td><td className="da-ip">{row.Ip||'Not recorded'}</td><td><button className="button button-subtle da-view" type="button" aria-label={`View activity for ${row.Name||'System'} at ${auditTime(row.CreatedAt)}`} onClick={()=>setSelected(row)}><Icon name="eye" size={15}/>View</button></td></tr>)}</tbody></table>{!data?.items.length&&<div className="da-empty"><Icon name={loading?'clock':'search'} size={28}/><strong>{loading?'Loading activity…':'No matching activity'}</strong><p>{loading?'Reading the audit records.':'Change your filters to see more records.'}</p></div>}</div>
  <footer className="da-footer"><span>{data?.total?`${(page-1)*20+1}–${Math.min(page*20,data.total)}`:'0'} of <strong>{data?.total||0}</strong> events <small>· Times in Asia/Dhaka</small></span><nav aria-label="Audit pages"><button type="button" className="button button-subtle" disabled={page===1||loading} onClick={()=>setPage(value=>value-1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="button button-subtle" disabled={page>=pages||loading} onClick={()=>setPage(value=>value+1)}>Next</button></nav></footer>
  {selected&&<AuditSessionModal entry={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}

export function AuditSessionModal({entry,onClose}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const panel=useRef(null),controller=useRef(null);
 const load=async(page=1)=>{controller.current?.abort();const request=new AbortController();controller.current=request;setBusy(true);setError('');try{const result=await api(`/audit/${entry.Id}/session?page=${page}&pageSize=50`,{signal:request.signal});if(!request.signal.aborted)setData(previous=>page===1?result:{...result,items:appendAuditEvents(previous.items,result.items)});}catch(err){if(!request.signal.aborted)setError(err.message);}finally{if(!request.signal.aborted)setBusy(false);}};
 useEffect(()=>{load();return()=>controller.current?.abort();},[entry.Id]);
 useEffect(()=>{const focused=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector('button')?.focus();return()=>{document.body.style.overflow=overflow;if(focused?.isConnected)focused.focus();};},[]);
 const session=data?.session;
 const keydown=event=>{if(event.key==='Escape')onClose();if(event.key==='Tab'){const items=[...panel.current.querySelectorAll('button:not(:disabled),a[href],summary,[tabindex="0"]')];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
 return createPortal(<div className="da-modal-scrim" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section ref={panel} className="da-session-modal" role="dialog" aria-modal="true" aria-labelledby="audit-session-title" onKeyDown={keydown}>
  <header className="da-modal-heading"><span className="da-heading-icon"><Icon name="clock" size={23}/></span><div><p className="eyebrow">SESSION ACTIVITY</p><h2 id="audit-session-title">{data&&!session?'Activity details':'Sign-in to sign-out'}</h2></div><button type="button" className="icon-button" aria-label="Close session activity" onClick={onClose}><Icon name="close" size={20}/></button></header>
  <div className="da-session-body" tabIndex={0} aria-label="Session activity timeline">
  <div className="da-session-identity"><div><strong>{session?.Name||entry.Name||'System activity'}</strong><span>{session?.EmployeeId||entry.EmployeeId||'No employee identity recorded'}{session?.Role?` · ${session.Role}`:''}{session?.AuthProvider?` · ${session.AuthProvider==='ad'?'Active Directory':'Local sign-in'}`:''}</span></div>{session&&<span className={`da-session-status ${session.status==='Active'?'active':''}`}>{session.status==='Active'?'Active':session.Source==='inferred'||session.Source==='migrated'?'Historical grouping':endReasonLabel(session.EndReason)}</span>}</div>
  {session&&<div className="da-session-facts"><div><small>Signed in</small><strong>{auditTime(session.StartedAt)}</strong></div><div><small>{session.EndReason==='logout'?'Signed out':'Session end'}</small><strong>{session.EndedAt?auditTime(session.EndedAt):session.status==='Active'?'Session still active':'Not recorded'}</strong></div><div><small>Duration</small><strong>{sessionDuration(session)}</strong></div><div><small>Recorded activity</small><strong>{data.total} events</strong></div></div>}
  <div className="da-session-network"><span><Icon name="device" size={16}/><strong>{session?'Sign-in IP:':'IP:'}</strong><code>{session?.Ip||entry.Ip||'Not recorded'}</code></span>{session?.LastIp&&session.LastIp!==session.Ip&&<span><strong>Last IP:</strong><code>{session.LastIp}</code></span>}<small>All timestamps: Asia/Dhaka (UTC+06:00)</small></div>
  {data?.notice&&<p className="da-history-note">{data.notice}</p>}{error&&<p className="da-error" role="alert">{error}</p>}
  <div className="da-timeline-scroll">
   {!data&&<div className="da-empty"><Icon name="clock" size={28}/><strong>{busy?'Loading session activity…':'Activity could not be loaded'}</strong></div>}
   <ol className="da-timeline">{data?.items.map(row=><li key={row.Id} className={String(row.Id)===String(entry.Id)?'is-selected':''}><span className={`da-timeline-node ${auditTone(row.Event)}`}><Icon name={row.Event==='auth.logout'?'logout':row.Event==='auth.login'?'key':row.Event==='page.viewed'?'eye':row.Event.includes('approve')?'check':'clock'} size={17}/></span><article><header><div><strong>{auditLabel(row.Event)}</strong><small>{row.Event}</small></div><time dateTime={row.CreatedAt}>{auditTime(row.CreatedAt)}</time></header><p>{eventDescription(row)}</p><div className="da-timeline-meta"><span>{row.Name||'System'}{row.ActorRole?` · ${row.ActorRole}`:''}</span><code>{row.Ip||'IP not recorded'}</code></div>{row.Metadata&&Object.keys(row.Metadata).length>0&&<details><summary>Details</summary><pre>{JSON.stringify(row.Metadata,null,2)}</pre></details>}</article></li>)}</ol>
   {data&&data.items.length<data.total&&<button type="button" className="button button-subtle da-load-more" disabled={busy} onClick={()=>load(data.page+1)}>{busy?'Loading…':'Load more activity'}</button>}
  </div>
  </div>
  <footer className="da-modal-footer"><span>{data?`${data.items.length} of ${data.total} events`:'Loading…'}</span><button className="button button-subtle" type="button" disabled={busy} onClick={()=>load()}>Refresh</button><button className="button button-primary" type="button" onClick={onClose}>Close</button></footer>
 </section></div>,document.querySelector('.app-shell')||document.body);
}
