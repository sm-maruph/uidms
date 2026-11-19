import React,{useState} from 'react';
import {portalRoles} from './portalRoles.js';
import {Button} from './UI.jsx';
import {api} from './SystemEmailWorkspace.jsx';
import {useSqlRefresh} from './useSqlRefresh.js';

const empty={employeeId:'',name:'',email:'',role:'User',branchId:'',departmentId:'',designationId:'',active:true,mock:true};

export default function DatabaseAdministration({users,catalog,write,onRefresh,notify,role}){
 const [form,setForm]=useState(empty);
 const [lookup,setLookup]=useState({kind:'branch',name:''});
 const [group,setGroup]=useState({name:'',email:''});
 const [activation,setActivation]=useState('');
 const [membership,setMembership]=useState(null);
 const [busy,setBusy]=useState(false);
 const update=(key,value)=>setForm(current=>({...current,[key]:value}));
 const save=async work=>{
  setBusy(true);
  try{await work();await onRefresh();notify('Saved to SQL Server.');}
  catch(error){notify(error.message);}finally{setBusy(false);}
 };
 const saveUser=event=>{
  event.preventDefault();
  return save(async()=>{
   const {id,version,employeeId,name,email,role,branchId,departmentId,designationId,active}=form;
   const body={name,email,role,branchId,departmentId,designationId:designationId||null};
   const result=id?await write('/users/'+id,'PATCH',{...body,version,active}):await write('/users','POST',{...body,employeeId,mock:Boolean(catalog.mockLoginEnabled)&&form.mock!==false});
   setActivation(result?.activationToken||'');if(result?.mock)notify('Mock user created. Sign in with its employee ID and password 1234.');
   setForm(empty);
  });
 };
 return <section className="panel directory-panel">
  <h2>Organization setup</h2>
  <form className="admin-user-form" onSubmit={saveUser}>
   <h3>{form.id?'Edit user':'Create user'}</h3>{!form.id&&catalog.mockLoginEnabled&&<label><input type="checkbox" checked={form.mock!==false} onChange={event=>update('mock',event.target.checked)}/>Mock account (password 1234, local development only)</label>}
   <div className="transfer-field-grid">
    <label>Employee ID<input value={form.employeeId} disabled={Boolean(form.id)} required onChange={event=>update('employeeId',event.target.value)}/></label>
    <label>Full name<input value={form.name} required onChange={event=>update('name',event.target.value)}/></label>
    <label>Work email (optional)<input type="email" value={form.email||''} onChange={event=>update('email',event.target.value)}/></label>
    <label>Role<select value={form.role} onChange={event=>update('role',event.target.value)}>{portalRoles.map(role=><option key={role}>{role}</option>)}</select></label>
    {['branch','department','designation'].map(kind=><label key={kind}>{kind[0].toUpperCase()+kind.slice(1)}<select required={kind!=='designation'} value={form[kind+'Id']||''} onChange={event=>update(kind+'Id',event.target.value)}><option value="">Select {kind}</option>{catalog.organizations.filter(row=>row.Kind===kind).map(row=><option key={row.Id} value={row.Id}>{row.Name}</option>)}</select></label>)}
    {form.id&&<label><input type="checkbox" checked={form.active} onChange={event=>update('active',event.target.checked)}/>Active account</label>}
   </div>
   <div className="detail-actions"><Button disabled={busy} type="submit">Save user</Button>{form.id&&<Button type="button" variant="subtle" onClick={()=>setForm(empty)}>Cancel</Button>}</div>
   {activation&&<p role="status">One-time activation token <code>{activation}</code></p>}
  </form>
  <div className="admin-user-list">{users.map(user=><div key={user.id} className="admin-user-row"><span>{user.name} · {user.employeeId} · {user.role}</span><Button type="button" variant="subtle" onClick={()=>{setForm(user);setActivation('');}}>Edit</Button></div>)}</div>
  <form className="admin-user-form" onSubmit={event=>{event.preventDefault();save(async()=>{await write('/lookups','POST',lookup);setLookup({...lookup,name:''});});}}>
   <h3>Organization lookups</h3><div className="transfer-field-grid"><label>Type<select value={lookup.kind} onChange={event=>setLookup({...lookup,kind:event.target.value})}>{['branch','department','designation'].map(kind=><option key={kind}>{kind}</option>)}</select></label><label>Name<input required value={lookup.name} onChange={event=>setLookup({...lookup,name:event.target.value})}/></label></div><Button type="submit" disabled={busy}>Add lookup</Button>
  </form>
  <form className="admin-user-form" onSubmit={event=>{event.preventDefault();save(async()=>{await write('/mailing-groups','POST',group);setGroup({name:'',email:''});});}}>
   <h3>Mailing groups</h3><ul>{catalog.mailingGroups.map(row=><li key={row.Id}>{row.Name} · {row.Email} {role==='Super Admin'&&<Button type="button" variant="subtle" onClick={async()=>{try{const {userIds}=await api('/admin/mailing-groups/'+row.Id+'/members');setMembership({group:row,userIds});}catch(error){notify(error.message);}}}>Edit members</Button>}</li>)}</ul><div className="transfer-field-grid"><label>Name<input required value={group.name} onChange={event=>setGroup({...group,name:event.target.value})}/></label><label>Group email<input type="email" required value={group.email} onChange={event=>setGroup({...group,email:event.target.value})}/></label></div><Button type="submit" disabled={busy}>Add group</Button>
  </form>
  {membership&&<form className="admin-user-form" onSubmit={event=>{event.preventDefault();save(async()=>{await write('/admin/mailing-groups/'+membership.group.Id+'/members','PUT',{userIds:membership.userIds});setMembership(null);});}}>
   <h3>Members of {membership.group.Name}</h3><div className="admin-mailing-members">{users.filter(user=>user.active).map(user=><label key={user.id}><input type="checkbox" checked={membership.userIds.includes(user.id)} onChange={event=>setMembership(current=>({...current,userIds:event.target.checked?[...current.userIds,user.id]:current.userIds.filter(id=>id!==user.id)}))}/>{user.name} · {user.employeeId}</label>)}</div><div className="detail-actions"><Button type="submit" disabled={busy}>Save members</Button><Button type="button" variant="subtle" onClick={()=>setMembership(null)}>Cancel</Button></div>
  </form>}
 </section>;
}

export function DatabaseWorkflows({catalog,write,onRefresh,notify,role}){
 const [code,setCode]=useState('');
 const type=catalog.requestTypes.find(row=>row.Code===code);
 const [hr,setHr]=useState(false);
 const [busy,setBusy]=useState(false);
 const roles=type?.Code==='reset'?['CITO']:['Manager',...(hr?['HR']:[]),'IT','CITO','COO'];
 return <section className="panel directory-panel"><h2>Workflow studio</h2>
  <form className="admin-user-form" onSubmit={async event=>{
   event.preventDefault();setBusy(true);
   try{await write('/admin/workflows/'+code,'PUT',{roles});await onRefresh();notify('Workflow saved to SQL Server.');}
   catch(error){notify(error.message);}finally{setBusy(false);}
  }}><label>Request type<select value={code} required onChange={event=>{const next=event.target.value;setCode(next);setHr(catalog.requestTypes.find(row=>row.Code===next)?.IncludesHr||false);}}><option value="">Select service</option>{catalog.requestTypes.map(row=><option key={row.Code} value={row.Code}>{row.Name}</option>)}</select></label>
   {type&&<><ol>{roles.map(item=><li key={item}>{item}</li>)}</ol>{code!=='reset'&&<label><input type="checkbox" checked={hr} disabled={role!=='Super Admin'||['new-user','movement','branch-transfer','employee-deactivate'].includes(code)} onChange={event=>setHr(event.target.checked)}/>Include HR review</label>}{role==='Super Admin'&&<Button type="submit" disabled={busy}>Save workflow</Button>}</>}
  </form></section>;
}

export function DatabaseAudit(){
 const [page,setPage]=useState(1);
 const [data,setData]=useState(null);
 const [error,setError]=useState('');
 const load=async(signal,next=page)=>{
  const result=await api('/audit?page='+next,{signal});
  if(!signal?.aborted){setData(result);setError('');}
 };
 React.useEffect(()=>{const controller=new AbortController();load(controller.signal).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return()=>controller.abort();},[page]);
 useSqlRefresh(true,load,error=>setError(error.message));
 return <section className="panel directory-panel"><h2>Audit trail</h2>
  {error&&<p role="alert">{error}</p>}
  {!data?<p>Loading audit events…</p>:<><div className="system-role-table-wrap"><table className="system-role-table"><thead><tr><th>Time (Dhaka)</th><th>Event</th><th>Actor</th><th>Record</th></tr></thead><tbody>{data.items.map(row=><tr key={row.Id}><td>{new Date(row.CreatedAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'})}</td><td>{row.Event}</td><td>{row.Name||row.EmployeeId||'System'}</td><td>{row.EntityId||'—'}</td></tr>)}</tbody></table></div>{!data.items.length&&<p>No audit events on this page.</p>}<div className="detail-actions"><Button disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</Button><Button disabled={page*data.pageSize>=data.total} onClick={()=>setPage(page+1)}>Next</Button></div></>}
 </section>;
}
