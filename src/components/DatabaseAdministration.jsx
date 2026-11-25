import AdminDeleteDialog from './AdminDeleteDialog.jsx';
import OrganizationManagement from './OrganizationManagement.jsx';
import React,{useState} from 'react';
import {portalRoles,canSetPortalRole} from './portalRoles.js';
import {Button} from './UI.jsx';
import {api} from './SystemEmailWorkspace.jsx';
import {useSqlRefresh} from './useSqlRefresh.js';
import {configuredWorkflowRoles} from './ticketWorkflow.js';
import {currentWorkflowTypes,olderWorkflowTypes} from './workflowCatalog.js';
import Icon from './Icon.jsx';
import '../workflow-editor.css';

const empty={employeeId:'',name:'',email:'',role:'User',branchId:'',departmentId:'',designationId:'',active:true,mock:true};

export default function DatabaseAdministration({users,catalog,write,onRefresh,notify,role}){
 const [form,setForm]=useState(empty);
 const [deleteTarget,setDeleteTarget]=useState(null);
 const [group,setGroup]=useState({name:'',email:''});
 const [activation,setActivation]=useState('');
 const [membership,setMembership]=useState(null);
 const [userSearch,setUserSearch]=useState('');
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
 const findUser=async event=>{
  event.preventDefault();setBusy(true);
  try{const result=await api('/users?search='+encodeURIComponent(userSearch.trim())+'&pageSize=100');const found=result.items.find(user=>user.employeeId.toLowerCase()===userSearch.trim().toLowerCase());if(!found)throw new Error('No registered UIDMS employee has this system ID.');setForm({...found,role:found.baseRole||found.role,originalRole:found.baseRole||found.role});setActivation('');notify('Employee loaded. Choose a role and save.');}
  catch(error){notify(error.message);}finally{setBusy(false);}
 };
 return <section className="panel directory-panel">
  <h2>Organization setup</h2>
  {['Admin','Super Admin'].includes(role)&&<OrganizationManagement write={write} onRefresh={onRefresh} notify={notify}/>}
  <form className="admin-user-form" onSubmit={findUser}>
   <h3>Find an employee to change their role</h3><label>System ID<input value={userSearch} maxLength={40} autoComplete="off" required placeholder="Enter the employee system ID" onChange={event=>setUserSearch(event.target.value)}/></label><Button type="submit" disabled={busy}>Find employee</Button>
  </form>
  <form className="admin-user-form" onSubmit={saveUser}>
   <h3>{form.id?'Edit user':'Create user'}</h3>{!form.id&&catalog.mockLoginEnabled&&<label><input type="checkbox" checked={form.mock!==false} onChange={event=>update('mock',event.target.checked)}/>Mock account (password 1234, local development only)</label>}
   <div className="transfer-field-grid">
    <label>Employee ID<input value={form.employeeId} disabled={Boolean(form.id)} required onChange={event=>update('employeeId',event.target.value)}/></label>
    <label>Full name<input value={form.name} required onChange={event=>update('name',event.target.value)}/></label>
    <label>Work email (optional)<input type="email" value={form.email||''} onChange={event=>update('email',event.target.value)}/></label>
    <label>Role<select value={form.role} onChange={event=>update('role',event.target.value)}>{portalRoles.filter(value=>canSetPortalRole(role,form.originalRole,value)).map(role=><option key={role}>{role}</option>)}</select></label>
    {['branch','department','designation'].map(kind=><label key={kind}>{kind[0].toUpperCase()+kind.slice(1)}<select required={kind!=='designation'} value={form[kind+'Id']||''} onChange={event=>update(kind+'Id',event.target.value)}><option value="">Select {kind}</option>{catalog.organizations.filter(row=>row.Kind===kind).map(row=><option key={row.Id} value={row.Id}>{row.Name}</option>)}</select></label>)}
    {form.id&&<label><input type="checkbox" checked={form.active} onChange={event=>update('active',event.target.checked)}/>Active account</label>}
   </div>
   <div className="detail-actions"><Button disabled={busy} type="submit">Save user</Button>{form.id&&<><Button type="button" variant="subtle" onClick={()=>setDeleteTarget({kind:'user',id:form.id})}>Delete user</Button><Button type="button" variant="subtle" onClick={()=>setForm(empty)}>Cancel</Button></>}</div>
   {activation&&<p role="status">One-time activation token <code>{activation}</code></p>}
  </form>
  <div className="admin-user-list">{users.map(user=><div key={user.id} className="admin-user-row"><span>{user.name} · {user.employeeId} · {user.role}</span><Button type="button" variant="subtle" onClick={()=>{setForm({...user,role:user.baseRole||user.role,originalRole:user.baseRole||user.role});setActivation('');}}>Edit</Button><Button type="button" variant="subtle" onClick={()=>setDeleteTarget({kind:'user',id:user.id})}>Delete</Button></div>)}</div>
  <form className="admin-user-form" onSubmit={event=>{event.preventDefault();save(async()=>{await write('/mailing-groups','POST',group);setGroup({name:'',email:''});});}}>
   <h3>Mailing groups</h3><ul>{catalog.mailingGroups.map(row=><li key={row.Id}>{row.Name} · {row.Email} {['Admin','Super Admin'].includes(role)&&<Button type="button" variant="subtle" onClick={async()=>{try{const {userIds}=await api('/admin/mailing-groups/'+row.Id+'/members');setMembership({group:row,userIds});}catch(error){notify(error.message);}}}>Edit members</Button>}</li>)}</ul><div className="transfer-field-grid"><label>Name<input required value={group.name} onChange={event=>setGroup({...group,name:event.target.value})}/></label><label>Group email<input type="email" required value={group.email} onChange={event=>setGroup({...group,email:event.target.value})}/></label></div><Button type="submit" disabled={busy}>Add group</Button>
  </form>
  {membership&&<form className="admin-user-form" onSubmit={event=>{event.preventDefault();save(async()=>{await write('/admin/mailing-groups/'+membership.group.Id+'/members','PUT',{userIds:membership.userIds});setMembership(null);});}}>
   <h3>Members of {membership.group.Name}</h3><div className="admin-mailing-members">{users.filter(user=>user.active).map(user=><label key={user.id}><input type="checkbox" checked={membership.userIds.includes(user.id)} onChange={event=>setMembership(current=>({...current,userIds:event.target.checked?[...current.userIds,user.id]:current.userIds.filter(id=>id!==user.id)}))}/>{user.name} · {user.employeeId}</label>)}</div><div className="detail-actions"><Button type="submit" disabled={busy}>Save members</Button><Button type="button" variant="subtle" onClick={()=>setMembership(null)}>Cancel</Button></div>
  </form>}
 {deleteTarget&&<AdminDeleteDialog {...deleteTarget} write={write} onClose={()=>setDeleteTarget(null)} onDeleted={async()=>{setDeleteTarget(null);setForm(empty);notify("User deleted. Selected requests updated and audit history retained.");await onRefresh();}}/>}
 </section>;
}

export function DatabaseWorkflows({catalog,write,onRefresh,notify,role,onBack}){
 const [code,setCode]=useState('');
 const currentTypes=currentWorkflowTypes(catalog),olderTypes=olderWorkflowTypes(catalog);
 const type=[...currentTypes,...olderTypes].find(row=>row.Code===code);
 const [draft,setDraft]=useState({roles:[],original:[],dirty:false});
 const [applyToOpenRequests,setApplyToOpenRequests]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [assignmentIssues,setAssignmentIssues]=useState([]);
 const choices=['Manager','HR','IT','CITO','COO'];
 const saved=configuredWorkflowRoles(catalog,code).join('|');
 React.useEffect(()=>{if(!draft.dirty){const roles=configuredWorkflowRoles(catalog,code);setDraft({roles,original:roles,dirty:false});}},[code,saved,draft.dirty]);
 const editable=['Admin','Super Admin'].includes(role)&&!busy;
 const chooseType=next=>{const roles=configuredWorkflowRoles(catalog,next);setCode(next);setDraft({roles,original:roles,dirty:false});setError('');setAssignmentIssues([]);};
 const change=roles=>{setDraft(current=>({...current,roles,dirty:true}));setError('');setAssignmentIssues([]);};
 const move=(index,offset)=>{const roles=[...draft.roles];[roles[index],roles[index+offset]]=[roles[index+offset],roles[index]];change(roles);};
 const journey=['Submitted',...(code==='movement'?['Employee review']:[]),...draft.roles,'Processing','Completed'];
 return <section className="panel directory-panel workflow-editor" aria-labelledby="workflow-studio-title">
  <header className="workflow-editor-header">{onBack&&<button type="button" className="button button-subtle workflow-editor-back" onClick={onBack} disabled={busy}><Icon name="chevron" size={16}/><span>Back</span></button>}<span className="workflow-editor-mark"><Icon name="branch" size={23}/></span><div><p className="workflow-editor-eyebrow">REQUEST ADMINISTRATION</p><h2 id="workflow-studio-title">Workflow studio</h2><p>Set the approval journey for each request type.</p></div><span className="workflow-editor-access"><Icon name="settings" size={14}/>Configuration</span></header>
  <form className="workflow-editor-form" onSubmit={async event=>{
   event.preventDefault();if(!editable||!draft.roles.length)return;setBusy(true);setError('');setAssignmentIssues([]);
   try{
    const result=await write('/admin/workflows/'+code,'PUT',{roles:draft.roles,expectedRoles:draft.original,applyToOpenRequests});
    setDraft(current=>({...current,original:current.roles,dirty:false}));
    let refreshFailed=false;try{await onRefresh();}catch{refreshFailed=true;}
    notify(`Workflow saved. ${result.updatedRequests} ongoing request${result.updatedRequests===1?'':'s'} updated.${refreshFailed?' Reload the page to refresh the latest data.':''}`);
    setBusy(false);onBack?.();
   }catch(error){setError(error.message);setAssignmentIssues(Array.isArray(error.details?.assignments)?error.details.assignments:[]);}finally{setBusy(false);}
  }}>
   <div className="workflow-editor-toolbar"><label htmlFor="workflow-request-type">Request type<select id="workflow-request-type" value={code} required disabled={busy} onChange={event=>chooseType(event.target.value)}><option value="">Select a request type</option>{currentTypes.map(row=><option key={row.Code} value={row.Code}>{row.Name}</option>)}{type&&!currentTypes.some(row=>row.Code===code)&&<option value={code}>{type.Name} (older requests)</option>}</select></label>{type&&<span className={`workflow-editor-status${draft.dirty?' is-dirty':''}`} role="status"><i/>{draft.dirty?'Unsaved changes':'Saved workflow'}</span>}{olderTypes.length>0&&<details className="workflow-editor-older"><summary>Older request workflows</summary><div>{olderTypes.map(row=><button type="button" disabled={busy} key={row.Code} onClick={()=>chooseType(row.Code)}>{row.Name}<small>{row.ExistingRequests} existing requests</small></button>)}</div></details>}</div>
   {type?<div className="workflow-editor-grid">
    <section className="workflow-editor-steps" aria-labelledby="workflow-steps-title">
     <div className="workflow-editor-section-heading"><div><h3 id="workflow-steps-title">Approval steps <span>{draft.roles.length}</span></h3><p>Choose reviewers and arrange their order.</p></div><Button type="button" variant="subtle" icon="plus" disabled={!editable||draft.roles.length===choices.length} onClick={()=>change([...draft.roles,choices.find(choice=>!draft.roles.includes(choice))])}>Add approval</Button></div>
     <ol className="workflow-editor-roles">{draft.roles.map((item,index)=><li key={index}>
      <span className="workflow-editor-step-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
      <label><span className="workflow-editor-field-label">Approval {index+1}</span><select aria-label={`Approval ${index+1} role`} value={item} disabled={!editable} onChange={event=>change(draft.roles.map((value,i)=>i===index?event.target.value:value))}>{choices.filter(choice=>choice===item||!draft.roles.includes(choice)).map(choice=><option key={choice}>{choice}</option>)}</select></label>
      <div className="workflow-editor-step-actions"><button type="button" disabled={!editable||index===0} aria-label={`Move approval ${index+1} up`} title="Move up" onClick={()=>move(index,-1)}><Icon name="chevron" size={16} className="workflow-editor-up"/></button><button type="button" disabled={!editable||index===draft.roles.length-1} aria-label={`Move approval ${index+1} down`} title="Move down" onClick={()=>move(index,1)}><Icon name="chevron" size={16} className="workflow-editor-down"/></button><button type="button" className="workflow-editor-remove" disabled={!editable} aria-label={`Remove approval ${index+1}`} title="Remove approval" onClick={()=>change(draft.roles.filter((_,i)=>i!==index))}><Icon name="trash" size={16}/></button></div>
     </li>)}</ol>
     {!draft.roles.length&&<div className="workflow-editor-no-steps" role="status"><Icon name="users" size={26}/><strong>No approval steps yet</strong><p>Add at least one reviewer to save this workflow.</p></div>}
     <p className="workflow-editor-scope-note"><Icon name="branch" size={15}/>Manager routes to the relevant branch manager or department head.</p>
    </section>
    <aside className="workflow-editor-summary" aria-label="Workflow preview and application settings">
     <section className="workflow-editor-preview"><div className="workflow-editor-preview-heading"><span><Icon name="branch" size={17}/></span><div><h3>Approval journey</h3><p>Preview of your selected steps</p></div></div><ol aria-label="Configured approval journey">{journey.map((stage,index)=>{const fixed=index===0||index>=journey.length-2||stage==='Employee review';return <li className={fixed?'is-fixed':''} key={`${stage}-${index}`}><span className="workflow-editor-journey-node">{stage==='Submitted'?<Icon name="idCard" size={14}/>:stage==='Processing'?<Icon name="settings" size={14}/>:stage==='Completed'?<Icon name="check" size={14}/>:<i/>}</span><strong>{stage}</strong><small>{stage==='Submitted'?'Requester':stage==='Processing'?'After approval':stage==='Completed'?'Request fulfilled':stage==='Employee review'?'Employee':'Approval'}</small></li>;})}</ol></section>
     <label className={`workflow-editor-apply${applyToOpenRequests?' is-enabled':''}`}><input type="checkbox" checked={applyToOpenRequests} disabled={!editable} onChange={event=>setApplyToOpenRequests(event.target.checked)}/><span><strong>Update ongoing requests</strong><small>Update pending steps. Keep completed approvals and finished requests unchanged.</small></span></label>
     <details className="workflow-editor-overrides"><summary>System-specific workflows</summary><p>Approval overrides set in System Email Templates remain in effect.</p></details>
    </aside>
   </div>:<div className="workflow-editor-empty"><span><Icon name="branch" size={34}/></span><h3>Choose a request type to get started</h3><p>Set its reviewers, check the journey, then save your workflow.</p></div>}
   {error&&<div className="workflow-editor-feedback" role="alert"><p>{error}</p>{assignmentIssues.length>0&&<><ul>{assignmentIssues.map(issue=><li key={issue.scopeId+issue.role}><div><strong>{issue.role}: {issue.scopeName}</strong><span>{issue.branch} / {issue.department} · {issue.requestCount} request{issue.requestCount===1?'':'s'}{issue.reason==='APPROVER_INACTIVE'?' · Assigned employee is inactive':''}</span><small>{issue.tickets.join(', ')}</small></div><a href={'/admin/approvers?scope='+encodeURIComponent(issue.scopeId)} target="_blank" rel="noopener noreferrer">Set assignment</a></li>)}</ul><p className="workflow-editor-exact-scope">Choose the exact department or branch shown above. Similar department names are separate records. Assignment opens in another tab so you can keep this workflow draft.</p></>}</div>}
   <footer className="workflow-editor-footer"><p><Icon name={draft.dirty?'edit':'check'} size={15}/>{type?draft.dirty?'Changes apply after saving':'Workflow is saved':'Select a request type to begin'}</p><div><Button type="button" variant="subtle" aria-label="Reload saved workflow" title="Reload saved workflow" disabled={busy||!type} onClick={async()=>{setBusy(true);try{await onRefresh();setDraft(current=>({...current,dirty:false}));setError('');}catch(error){setError(error.message);}finally{setBusy(false);}}}>Reload</Button>{['Admin','Super Admin'].includes(role)&&<Button type="submit" icon="check" disabled={busy||!type||!draft.roles.length}>{busy?'Saving…':'Save workflow'}</Button>}</div></footer>
  </form></section>;
}

export {default as DatabaseAudit} from './DatabaseAudit.jsx';
