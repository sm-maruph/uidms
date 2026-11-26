import React,{useEffect,useRef,useState} from 'react';
import {api} from './SystemEmailWorkspace.jsx';
import '../transfer-access-review.css';

const key=row=>`${row.systemId}:${row.systemRoleId||''}`;
export function accessGroups(rows=[]){
 const groups=new Map();for(const row of rows){const group=groups.get(row.systemId)||{id:row.systemId,name:row.system,roles:[],roleIds:[],reason:row.reason||''};if(row.systemRoleId){group.roleIds.push(row.systemRoleId);group.roles.push(row.role);}groups.set(row.systemId,group);}return [...groups.values()];
}
function AccessList({title,rows=[]}){return <section><h4>{title} ({rows.length})</h4>{rows.length?<ul>{rows.map((row,index)=><li key={key(row)+index}><strong>{row.system}</strong>{row.role&&<span> — {row.role}</span>}{row.reason&&<p>{row.reason}</p>}</li>)}</ul>:<p>None</p>}</section>;}
export function TransferAccessSummary({review}){
 if(!review)return null;
 return <section className="transfer-access-summary"><h3>Transfer access review</h3><AccessList title={review.legacy?'Current access captured for IT review':review.employeeConfirmed?'Current access at employee review':'Current access at initiation'} rows={review.current}/>{(review.employeeConfirmed||review.legacy)?<>{review.legacy?<p>Selection from an older transfer request. No explicit employee confirmation was recorded; current access was captured for IT review.</p>:<p>Confirmed by {review.employeeName} · {new Date(review.employeeReviewedAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'})}</p>}<div className="transfer-access-columns"><AccessList title="Keep after transfer" rows={review.employeeDifference?.kept}/><AccessList title="Employee wants to remove" rows={review.employeeDifference?.removed}/><AccessList title="New systems / roles requested" rows={review.employeeDifference?.added}/></div></>:<p>Awaiting employee confirmation. Current access will be refreshed when the employee opens the review.</p>}{review.itReview&&<><h4>Information Technology review</h4><p>{review.itReview.by} · {new Date(review.itReview.at).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'})}</p><p>{review.itReview.notes}</p><div className="transfer-access-columns"><AccessList title="IT accepted destination access" rows={review.itReview.selection}/><AccessList title="IT removed / declined" rows={review.itReview.removedByIT}/></div></>}</section>;
}

export default function TransferAccessReview({ticket,mode='employee',onChange,onSave}){
 const [data,setData]=useState(null),[selected,setSelected]=useState([]),[confirmed,setConfirmed]=useState(false),[notes,setNotes]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 const change=useRef(onChange);change.current=onChange;
 useEffect(()=>{
  const controller=new AbortController();setError('');setData(null);
  api(`/requests/${ticket.sqlId}/transfer-access`,{signal:controller.signal}).then(result=>{
   if(controller.signal.aborted)return;setData(result);
   setSelected(accessGroups(mode==='it'?(result.review?.itReview?.selection||result.review?.employeeSelection||[]):result.current));
   setNotes(result.review?.itReview?.notes||'');setConfirmed(false);
  }).catch(err=>{if(!controller.signal.aborted)setError(err.message);});return()=>controller.abort();
 },[ticket.sqlId,mode,retry]);
 const items=selected.flatMap(row=>(row.roleIds.length?row.roleIds:[null]).map(roleId=>({systemId:row.id,systemRoleId:roleId,reason:row.reason.trim()||'Retain required access after transfer'})));
 const currentKeys=new Set((data?.current||[]).map(key));
 const missing=selected.find(row=>{
  const system=data?.systems.find(system=>system.id===row.id);
  return system?.roles.some(role=>role.active)&&!row.roleIds.length&&!currentKeys.has(`${row.id}:`);
 });
 const unexplained=selected.find(row=>(row.roleIds.length?row.roleIds:[null]).some(role=>!currentKeys.has(`${row.id}:${role||''}`))&&!row.reason.trim());
 const validation=missing?`Choose the required role for ${missing.name}.`:unexplained?`Explain the requirement for ${unexplained.name}.`:'';
 useEffect(()=>{if(data)change.current?.({transferAccessSelection:items,inventoryVersion:data.inventoryVersion,confirmedCurrentAccess:confirmed,validation});},[selected,data,confirmed,validation]);
 if(!data)return <section className="transfer-access-editor" aria-busy={!error}>{error?<p role="alert">{error} <button type="button" onClick={()=>setRetry(value=>value+1)}>Reload access</button></p>:<p>Loading the employee’s current access...</p>}</section>;
 const allowed=mode==='it'?accessGroups(data.review?.employeeSelection||[]):data.systems.filter(system=>system.active||data.current.some(row=>row.systemId===system.id)).map(system=>({id:system.id,name:system.name}));
 const current=accessGroups(data.current),options=mode==='it'?allowed:current;
 const toggle=(system,enabled)=>setSelected(rows=>enabled?[...rows,accessGroups((mode==='it'?data.review.employeeSelection:data.current).filter(row=>row.systemId===system.id))[0]||{...system,roleIds:[],roles:[],reason:''}]:rows.filter(row=>row.id!==system.id));
 const update=(id,field,value)=>setSelected(rows=>rows.map(row=>row.id===id?{...row,[field]:value}:row));
 const cards=[...options,...selected.filter(row=>!options.some(option=>option.id===row.id))];
 return <section className="transfer-access-editor"><h3>{mode==='it'?'IT destination access review':'Confirm access needed after your transfer'}</h3><p className="transfer-access-notice">{mode==='it'?'Review the employee’s current access and the business need for every new system or role. Deselect access that is not required at the destination. Your decisions and remarks will be attached to this request.':'Please confirm that every selected system you currently use is still needed after your transfer. Remove any system you no longer need. You may add new systems, roles and requirements below. New access will be reviewed by the Information Technology department and requires approval.'}</p>
  {mode==='it'&&<TransferAccessSummary review={data.review}/>}
  {!cards.length&&<p>No current access is recorded. You may request destination access below.</p>}
  {cards.map(card=>{const row=selected.find(row=>row.id===card.id),system=data.systems.find(system=>system.id===card.id),wasCurrent=current.some(old=>old.id===card.id);return <fieldset key={card.id} className="transfer-access-card"><legend><label><input type="checkbox" checked={Boolean(row)} onChange={event=>toggle(card,event.target.checked)}/>{card.name} <small>{wasCurrent?'Current system':'Newly requested system'}</small></label></legend>{wasCurrent&&<p>Current roles: {current.find(old=>old.id===card.id).roles.filter(Boolean).join(', ')||'Access enabled'}</p>}{row&&<>
   {system?.roles.length>0&&<div className="transfer-access-roles">{system.roles.filter(role=>mode==='it'?data.review.employeeSelection.some(item=>item.systemId===card.id&&item.systemRoleId===role.id):(role.active||row.roleIds.includes(role.id))).map(role=><label key={role.id}><input type="checkbox" checked={row.roleIds.includes(role.id)} onChange={event=>update(card.id,'roleIds',event.target.checked?[...row.roleIds,role.id]:row.roleIds.filter(id=>id!==role.id))}/>{role.name}</label>)}</div>}
   <label>Business need / additional requirements<textarea rows="2" value={row.reason} onChange={event=>update(card.id,'reason',event.target.value)} maxLength={2000} placeholder={wasCurrent?'Explain changed roles or additional requirements':'Explain why this new system and role are needed'}/></label>
  </>}</fieldset>;})}
  {mode==='employee'&&<><label>Add a new system<select value="" onChange={event=>{const system=data.systems.find(row=>row.id===event.target.value);if(system)toggle({id:system.id,name:system.name},true);}}><option value="">Select a system to add</option>{allowed.filter(row=>!selected.some(selected=>selected.id===row.id)&&!current.some(old=>old.id===row.id)).map(system=><option key={system.id} value={system.id}>{system.name}</option>)}</select></label><label className="transfer-access-confirm"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>I reviewed all my current systems and confirm that the selected access is needed after my transfer. Unselected current access should be removed.</label></>}
  {validation&&<p role="status">{validation}</p>}{error&&<p role="alert">{error}</p>}
  {mode==='it'&&<><label>IT review remarks<textarea value={notes} onChange={event=>setNotes(event.target.value)} rows="3" minLength={10} maxLength={2000} placeholder="Record why existing access is retained/removed and whether new access is required."/></label><button type="button" className="button button-primary" disabled={busy||Boolean(validation)||notes.trim().length<10} onClick={async()=>{setBusy(true);setError('');try{await onSave({items,notes:notes.trim()});}catch(err){setError(err.message);}finally{setBusy(false);}}}>{busy?'Saving...':'Save IT access review'}</button></>}
 </section>;
}
