import React,{useEffect,useState} from 'react';
import {api} from './SystemEmailWorkspace.jsx';
import {hasPortalRole} from './portalRoles.js';
import {actingState,dhakaInputDate,actingPayload} from './actingAssignments.js';
import Icon from './Icon.jsx';
import '../acting-assignments.css';

const optionKey=option=>`${option.PrincipalId}:${option.Role}:${option.ScopeId||''}`;
const stamp=value=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
export default function ActingAssignments({profile,write,onRefresh}){
 const [rows,setRows]=useState([]),[options,setOptions]=useState([]),[selected,setSelected]=useState('');
 const [employee,setEmployee]=useState(''),[candidate,setCandidate]=useState(null),[start,setStart]=useState(()=>dhakaInputDate()),[end,setEnd]=useState(()=>dhakaInputDate(new Date(Date.now()+86400000)));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[loaded,setLoaded]=useState(false);
 const refresh=async()=>{const [list,choices]=await Promise.all([api('/acting-assignments'),api('/acting-options')]);setRows(list.items);setOptions(choices.items);setLoaded(true);};
 useEffect(()=>{const controller=new AbortController();Promise.all([api('/acting-assignments',{signal:controller.signal}),api('/acting-options',{signal:controller.signal})]).then(([list,choices])=>{setRows(list.items);setOptions(choices.items);setLoaded(true);}).catch(err=>{if(!controller.signal.aborted)setError(err.message);});return()=>controller.abort();},[profile.id,profile.role]);
 const option=options.find(item=>optionKey(item)===selected);
 const perform=async work=>{setBusy(true);setError('');setMessage('');try{await work();}catch(err){setError(err.message);}finally{setBusy(false);}};
 const find=event=>{event.preventDefault();perform(async()=>{setCandidate(null);const params=new URLSearchParams({principalId:option.PrincipalId,role:option.Role,search:employee.trim(),...(option.ScopeId?{scopeId:option.ScopeId}:{})});const result=await api('/acting-candidates?'+params);if(!result.items.length)throw new Error(option.ScopeId?'No eligible employee has that system ID in this branch or department.':'No eligible active user has that system ID.');setCandidate(result.items[0]);});};
 const save=()=>perform(async()=>{await write('/acting-assignments','POST',actingPayload(option,candidate.EmployeeId,start,end));setCandidate(null);setEmployee('');await refresh();await onRefresh();setMessage('Acting appointment saved. Authority follows the selected time range automatically.');});
 const finish=row=>perform(async()=>{await write('/acting-assignments/'+row.Id+'/end','POST',{version:row.Version});await refresh();await onRefresh();setMessage('Acting appointment ended. Permanent authority has been restored.');});
 const canEnd=row=>row.PrincipalId===profile.id||hasPortalRole(profile,'Admin','Super Admin')||row.ScopeId&&hasPortalRole(profile,'IT');
 return <section className="panel acting-page"><header className="acting-heading"><div><p className="eyebrow">LEAVE COVER</p><h1>Acting appointments</h1><p>Choose who covers a responsibility and when their authority starts and ends.</p></div><button type="button" className="button button-subtle" disabled={busy} onClick={()=>perform(refresh)}>Reload</button></header>
  {error&&<p className="acting-feedback acting-error" role="alert">{error}</p>}{message&&<p className="acting-feedback acting-success" role="status">{message}</p>}
  <div className="acting-layout"><section className="acting-form"><h2><Icon name="users" size={19}/>Appoint a replacement</h2>
   {!loaded?<p>Loading responsibilities…</p>:!options.length?<p className="acting-help">You have no permanent responsibility to delegate. Appointments you receive appear in the list.</p>:<>
    <label>Responsibility<select value={selected} disabled={busy} onChange={event=>{setSelected(event.target.value);setCandidate(null);setEmployee('');setError('');setMessage('');}}><option value="">Select a responsibility</option>{options.map(item=><option key={optionKey(item)} value={optionKey(item)}>{item.Role} · {item.Name} · {item.PrincipalName} ({item.EmployeeId})</option>)}</select></label>
    {option&&<><div className="acting-principal"><small>Permanent holder</small><strong>{option.PrincipalName}</strong><span>{option.EmployeeId} · {option.Name}</span></div><form onSubmit={find}><label htmlFor="acting-employee">Replacement system ID</label><div className="acting-find"><input id="acting-employee" maxLength={40} value={employee} required disabled={busy} autoComplete="off" placeholder="Enter an employee system ID" onChange={event=>{setEmployee(event.target.value);setCandidate(null);setError('');}}/><button className="button button-primary" disabled={busy||!employee.trim()} type="submit">Find user</button></div></form>
     {candidate&&<div className="acting-candidate"><Icon name="check" size={18}/><div><strong>{candidate.Name}</strong><span>{candidate.EmployeeId}</span></div></div>}
     <div className="acting-dates"><label>Starts (Dhaka time)<input type="datetime-local" required step="60" value={start} disabled={busy} onChange={event=>setStart(event.target.value)}/></label><label>Ends (Dhaka time)<input type="datetime-local" required step="60" value={end} disabled={busy} onChange={event=>setEnd(event.target.value)}/></label></div>
     <button className="button button-primary acting-save" type="button" disabled={busy||!candidate||!start||!end} onClick={save}>{busy?'Saving…':'Save acting appointment'}</button>
     <p className="acting-help">During this period the replacement handles this responsibility. Authority returns automatically at the end. Acting managers and heads must belong to the selected branch or department. Acting authority cannot be delegated again.</p></>}
   </>}
  </section><section className="acting-records"><h2>Appointments</h2><p className="acting-help">All dates and times are shown in Asia/Dhaka (UTC+06:00).</p><div className="acting-list">{!rows.length?<p className="acting-empty">No acting appointments.</p>:rows.map(row=>{const state=actingState(row);return <article key={row.Id} className="acting-record"><header><strong>{row.Role}{row.ScopeName?` · ${row.ScopeName}`:''}</strong><span className={`acting-status ${state.toLowerCase()}`}>{state}</span></header><div className="acting-people"><div><small>Permanent</small><strong>{row.PrincipalName}</strong><span>{row.PrincipalEmployeeId}</span></div><Icon name="arrow" size={18}/><div><small>Acting</small><strong>{row.ActingName}</strong><span>{row.ActingEmployeeId}</span></div></div><p className="acting-period"><Icon name="clock" size={14}/>{stamp(row.StartsAt)} → {stamp(row.EndsAt)}</p>{['Active','Scheduled'].includes(state)&&canEnd(row)&&<button type="button" className="button button-subtle" disabled={busy} onClick={()=>finish(row)}>End appointment</button>}</article>;})}</div></section></div>
 </section>;
}
