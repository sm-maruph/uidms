import React,{useEffect,useState} from 'react';
import {api} from './SystemEmailWorkspace.jsx';
import Icon from './Icon.jsx';
import '../approver-assignments.css';

export default function ApproverAssignments({write,onRefresh}){
 const [rows,setRows]=useState([]),[kind,setKind]=useState('department'),[search,setSearch]=useState('');
 const [selected,setSelected]=useState(null),[employeeId,setEmployeeId]=useState(''),[candidate,setCandidate]=useState(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=async()=>{const result=await api('/approver-assignments');setRows(result.items);return result.items;};
 const reload=async()=>{setBusy(true);setError('');try{const updated=await load();setSelected(current=>current?updated.find(row=>row.ScopeId===current.ScopeId)||null:null);setCandidate(null);setMessage('Assignments reloaded.');}catch(err){setError(err.message);}finally{setBusy(false);}};
 useEffect(()=>{let active=true;api('/approver-assignments').then(result=>{if(active)setRows(result.items);}).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 const choose=row=>{setSelected(row);setEmployeeId(row.EmployeeId||'');setCandidate(null);setError('');setMessage('');};
 const find=async event=>{
  event.preventDefault();setBusy(true);setError('');setCandidate(null);
  try{const id=employeeId.trim();const result=await api('/users?search='+encodeURIComponent(id)+'&pageSize=100');const user=result.items.find(item=>item.employeeId.toLowerCase()===id.toLowerCase()&&item.active);if(!user)throw new Error('No active registered user has this system ID. Check the ID and try again.');setCandidate(user);}
  catch(err){setError(err.message);}finally{setBusy(false);}
 };
 const save=async()=>{
  setBusy(true);setError('');setMessage('');
  try{const result=await write('/approver-assignments/'+selected.ScopeId,'PUT',{employeeId:candidate.employeeId,version:selected.Version});const updated=await load();setSelected(updated.find(row=>row.ScopeId===selected.ScopeId));setCandidate(null);setMessage(`Assignment saved. ${result.updatedRequests} open request${result.updatedRequests===1?'':'s'} updated.`);await onRefresh();}
  catch(err){setError(err.message);}finally{setBusy(false);}
 };
 const filtered=rows.filter(row=>row.Kind===kind&&`${row.Name} ${row.UserName||''} ${row.EmployeeId||''}`.toLowerCase().includes(search.toLowerCase()));
 return <section className="panel approver-page">
  <header className="approver-heading"><div><p className="eyebrow">APPROVAL ROUTING</p><h1>Approver assignments</h1><p>Assign department heads and branch managers using their system ID.</p></div><button className="button button-subtle" type="button" disabled={busy||loading} onClick={reload}>Reload</button></header>
  <div className="approver-layout">
   <section className="approver-directory" aria-label="Departments and branches">
    <div className="approver-tools"><div className="approver-tabs" role="group" aria-label="Organization type">{[['department','Departments'],['branch','Branches']].map(([value,label])=><button key={value} type="button" disabled={busy} aria-pressed={kind===value} onClick={()=>{setKind(value);setSelected(null);setCandidate(null);setError('');setMessage('');}}>{label}<span>{rows.filter(row=>row.Kind===value).length}</span></button>)}</div><label className="approver-search"><Icon name="search" size={16}/><input aria-label="Search scopes or assignees" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search name or system ID"/></label></div>
    <div className="approver-list" aria-busy={loading}>{loading?<p className="approver-empty">Loading assignments…</p>:!filtered.length?<p className="approver-empty">No matching {kind==='branch'?'branches':'departments'}.</p>:filtered.map(row=><button type="button" key={row.ScopeId} disabled={busy} className={`approver-scope${selected?.ScopeId===row.ScopeId?' selected':''}`} onClick={()=>choose(row)}><span className="approver-scope-icon"><Icon name={kind==='branch'?'grid':'users'} size={18}/></span><span><strong>{row.Name}</strong><small>{row.UserName?`${row.UserName} · ${row.EmployeeId}`:'No approver assigned'}</small></span><span className={`approver-badge ${row.UserId&&row.Active?'assigned':'unassigned'}`}>{row.UserId?(row.Active?'Assigned':'Inactive'):'Unassigned'}</span><Icon name="arrow" size={15}/></button>)}</div>
   </section>
   <aside className="approver-editor">
    {selected?<><p className="eyebrow">{selected.Kind==='branch'?'BRANCH MANAGER':'DEPARTMENT HEAD'}</p><h2>{selected.Name}</h2><div className="approver-current"><small>Current approver</small><strong>{selected.UserName||'Not assigned'}</strong><span>{selected.EmployeeId||'Select a registered employee below'}</span></div>
     <form onSubmit={find}><label htmlFor="approver-system-id">Approver system ID</label><div className="approver-id-search"><input id="approver-system-id" value={employeeId} autoComplete="off" maxLength={40} disabled={busy} placeholder="e.g. BD06653" onChange={event=>{setEmployeeId(event.target.value);setCandidate(null);setError('');setMessage('');}} required/><button className="button button-primary" type="submit" disabled={busy||!employeeId.trim()}>{busy?'Please wait…':'Find user'}</button></div></form>
     {candidate&&<div className="approver-candidate"><span className="approver-avatar">{candidate.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('')}</span><div><strong>{candidate.name}</strong><span>{candidate.employeeId}</span><small>{candidate.role} · {candidate.branch} · {candidate.department}</small></div></div>}
     <div className="approver-save"><button className="button button-primary" type="button" disabled={!candidate||busy} onClick={save}>{busy?'Saving…':`Assign ${selected.Kind==='branch'?'branch manager':'department head'}`}</button></div>
     <p className="approver-note">This person receives the Manager approval step for this {selected.Kind}. Saving updates waiting steps on open requests and keeps completed approvals. Their portal role stays the same.</p></>:<div className="approver-empty-editor"><Icon name="users" size={32}/><h2>Choose a department or branch</h2><p>Select a scope to review or change its approver.</p></div>}
    {error&&<p className="approver-error" role="alert">{error}</p>}{message&&<p className="approver-success" role="status">{message}</p>}
   </aside>
  </div>
 </section>;
}
