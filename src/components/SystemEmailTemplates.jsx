import React,{useId,useRef,useState} from 'react';
import {emailTemplateServices} from './emailTemplateServices.js';
import {emailTemplateCategories} from './requestTitle.js';
import {emailAddresses} from './EmailDraftCard.jsx';
import bankLogo from '../images-removebg-preview.png';
import '../system-email.css';

export const emailTemplateVariables=['ticketNumber','requestType','justification','items','name','employeeId','system','systemId','role','operation','department','branch','reason'];
const empty={name:'',systemIds:[],to:[],cc:[],subject:'[{{ticketNumber}}] {{requestType}}',body:'Dear Team,\n\nPlease process the following approved request:\n\n{{items}}\n\nRegards,\nInformation Technology Department'};
const previewValues={ticketNumber:'UID-000123',name:'Sample Employee',employeeId:'EMP001',department:'Operations',branch:'Main Branch',systemId:'sample.user',role:'Operator',currentRole:'Viewer',operation:'Access request',designation:'Officer',justification:'Required for daily duties',reason:'Approved access request',email:'employee@example.com',requestedEmail:'new.employee@example.com',similarId:'sample.reference',additionalFunction:'Reporting',adRole:'Standard employee',otherSoftware:'Reporting tools',scope:'Selected systems',groupAction:'Inclusion',mailingGroups:'Operations Announcements',forwardTo:'forwarding@example.com',driveName:'Operations',deviceModel:'Sample device',deviceNumber:'DEV-001',serialNumber:'SN-001'};

export default function SystemEmailTemplates({allowCategories=false,...props}){
 const [category,setCategory]=useState(null);
 if(!allowCategories)return <TemplateGroup {...props}/>;
 if(category)return <section className="panel directory-panel system-email-panel">
  <header className="system-email-heading"><h2>{emailTemplateCategories[category]}</h2><button type="button" className="button button-subtle" onClick={()=>setCategory(null)}>Back to services</button></header>
  <TemplateGroup key={category} {...props} items={props.items.filter(item=>item.category===category)} category={category} grouped/>
 </section>;
 return <section className="panel directory-panel system-email-panel system-email-service-panel">
  <header className="system-email-heading"><h2>System Email Templates</h2></header>
  <div className="system-email-service-grid">{Object.entries(emailTemplateCategories).map(([id,title])=>{
   const count=props.items.filter(item=>item.category===id).length;
   return <button type="button" key={id} className="system-email-service-card" onClick={()=>setCategory(id)}>
    <strong>{title}</strong><span>{emailTemplateServices[id].description}</span><small>{count} {count===1?'template':'templates'}</small>
   </button>;
  })}</div>
 </section>;
}

function TemplateGroup({items,systems,services,variables=emailTemplateVariables,requestTypes=[],onSave,onDelete,onWorkflow,category='',grouped=false}){
 const [form,setForm]=useState(null);
 const [preview,setPreview]=useState(false);
 const [error,setError]=useState('');
 const [deleting,setDeleting]=useState(null);
 const [busy,setBusy]=useState(false);
 const [search,setSearch]=useState('');
 const service=emailTemplateServices[category];
 const connectedService=services?.find(entry=>entry.category===category);
 const builtInVariables=connectedService?.variables||(service?[...variables.filter(variable=>!['role','reason'].includes(variable)||['new-id','upgrade'].includes(category)),...service.fields]:variables);
 const helpId=useId();
 const subjectInput=useRef(null);
 const bodyInput=useRef(null);
 const [variableTarget,setVariableTarget]=useState('body');
 const names=new Map(systems.map(system=>[system.id,system.name]));
 const owned=new Map(items.filter(item=>item.id!==form?.id&&(item.category||'')===(form?.category||'')).flatMap(item=>item.systemIds.map(id=>[id,item.name])));
 const serviceSystems=connectedService?systems.filter(system=>connectedService.systemIds.includes(system.id)||form?.systemIds.includes(system.id)):service?.systems?.map(id=>systems.find(system=>system.id===id)||{id,name:id});
 const canChooseSystems=connectedService?Boolean(serviceSystems.length):!service||Boolean(service.systems);
 const visibleSystems=(serviceSystems||systems).filter(system=>(system.active!==false||form?.systemIds.includes(system.id))&&system.name.toLowerCase().includes(search.trim().toLowerCase()));
 const edit=item=>{setForm({...item,to:item.to.join(', '),cc:item.cc.join(', ')});setPreview(false);setVariableTarget('body');setSearch('');setError('');setDeleting(null);};
 const field=(key,value)=>setForm(current=>({...current,[key]:value}));
 const insertVariable=variable=>{
  const input=variableTarget==='subject'?subjectInput.current:bodyInput.current;
  const token=`{{${variable}}}`;
  const {selectionStart:start,selectionEnd:end,value,maxLength}=input;
  if(value.length-(end-start)+token.length>maxLength){setError('This variable would exceed the field length limit.');return;}
  setError('');
  field(variableTarget,value.slice(0,start)+token+value.slice(end));
  requestAnimationFrame(()=>{if(input.isConnected){input.focus();input.setSelectionRange(start+token.length,start+token.length);}});
 };
 const toggleSystem=id=>setForm(current=>({...current,systemIds:current.systemIds.includes(id)?current.systemIds.filter(selected=>selected!==id):[...current.systemIds,id]}));
 const renderPreview=value=>{
  const systems=form.systemIds.length?form.systemIds.map(id=>names.get(id)||id):[serviceSystems?.[0]?.name||emailTemplateCategories[category]||'Sample system'];
  const values={...previewValues,requestType:emailTemplateCategories[category]||'System access',system:systems.join(', '),items:systems.map(system=>`- ${system}: Sample Employee (EMP001)`).join('\n')};
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g,(token,key)=>Object.hasOwn(values,key)?values[key]:token);
 };
 const perform=async action=>{
  setError('');setBusy(true);
  try{await action();}catch(error){setError(error.message);}finally{setBusy(false);}
 };
 const save=event=>{
  event.preventDefault();
  const {id,version,name,systemIds,subject,body,category=''}=form;
  if(!systemIds.length&&!category){setError('Select at least one system.');return;}
  const overlaps=items.some(item=>item.id!==id&&(item.category||'')===category&&(
   systemIds.length ? item.systemIds.some(system=>systemIds.includes(system)) : !item.systemIds.length
  ));
  if(overlaps){setError('A template already covers that selection in this category.');return;}
  const allowed=new Set(builtInVariables);
  const valid=value=>!/\{\{|\}\}/.test(value.replace(/\{\{\s*([\w]+)\s*\}\}/g,(match,key)=>allowed.has(key)?'':match));
  if(!name.trim()||!subject.trim()||!body.trim()){setError('Enter a template name, subject and body.');return;}
  if(!valid(subject)||!valid(body)){setError('Use supported {{variables}} in the subject and body.');return;}
  return perform(async()=>{await onSave({id,version,...(grouped?{category}:{}),name:name.trim(),systemIds,to:emailAddresses(form.to),cc:emailAddresses(form.cc),subject:subject.trim(),body:body.trim()});setForm(null);});
 };
 return <section className={grouped?'system-email-group-content':'panel directory-panel system-email-panel'}>
  <header className="system-email-heading"><div>{grouped?<p>{service?.description||'These templates can be used across services.'}</p>:<h2>System Email Templates</h2>}</div>{!grouped&&!form&&<button type="button" className="button button-primary" disabled={busy} onClick={()=>edit({...empty,category})}>Create template</button>}</header>
  {grouped&&<div className="system-email-tabs" role="group" aria-label="Template views">
   <button type="button" aria-pressed={!form} disabled={busy} onClick={()=>{setForm(null);setError('');}}>Saved templates</button>
   <button type="button" aria-pressed={Boolean(form)} disabled={busy} onClick={()=>{if(!form)edit({...empty,category});}}>{form?.id?'Edit template':'Create new'}</button>
  </div>}
  {error&&<p role="alert">{error}</p>}
  {form&&<form className="system-email-form system-email-editor" onSubmit={save}>
   <div className="system-email-editor-title"><h3>{form.id?'Edit template':'New template'}</h3><img src={bankLogo} alt="Commercial Bank of Ceylon"/></div>
   {preview?<section className="system-email-preview" aria-label="Email preview">
    <h4>Email preview</h4><p className="fulfilment-help">Variables use sample request data.</p>
    <dl><dt>To</dt><dd>{form.to||'—'}</dd><dt>CC</dt><dd>{form.cc||'—'}</dd><dt>Subject</dt><dd>{renderPreview(form.subject).replace(/[\r\n]+/g,' ')}</dd></dl>
    <div className="system-email-preview-body">{renderPreview(form.body)}</div>
   </section>:<div className="system-email-editor-grid">
    <div className="system-email-editor-section">
     <h4>Template setup</h4>
     <label>Template name<input required maxLength={160} placeholder="e.g. Digital Banking Team" value={form.name} onChange={event=>field('name',event.target.value)}/></label>
     {canChooseSystems&&<fieldset className="system-email-picker"><legend>Systems</legend>{form.category&&<small className="fulfilment-help">Leave systems unselected to cover the whole category.</small>}
      <label className="system-email-search">Search systems<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="e.g. T4S or WBO"/></label>
      <div className="system-email-selection" aria-live="polite"><span>{form.systemIds.length} selected</span>{form.systemIds.map(id=><button type="button" key={id} onClick={()=>toggleSystem(id)} aria-label={`Remove ${names.get(id)||id}`}>{names.get(id)||id} <span aria-hidden="true">×</span></button>)}</div>
      <div className="system-email-checkboxes">{visibleSystems.map(system=><label key={system.id} className={form.systemIds.includes(system.id)?'is-selected':undefined}><input type="checkbox" checked={form.systemIds.includes(system.id)} disabled={owned.has(system.id)} onChange={()=>toggleSystem(system.id)}/><span>{system.name}{owned.has(system.id)&&<small>{owned.get(system.id)}</small>}</span></label>)}{!visibleSystems.length&&<p>No matching systems.</p>}</div>
     </fieldset>}
     {service&&!canChooseSystems&&<p>This template covers the whole service.</p>}
    </div>
    <div className="system-email-editor-section system-email-message">
     <h4>Email message</h4>
     <div className="fulfilment-email-addresses"><label>To<input type="email" multiple required placeholder="team@example.com, lead@example.com" aria-describedby={helpId} value={form.to} onChange={event=>field('to',event.target.value)}/></label><label><span>CC <span className="system-email-optional">Optional</span></span><input type="email" multiple aria-describedby={helpId} value={form.cc} onChange={event=>field('cc',event.target.value)}/></label></div>
     <small id={helpId} className="fulfilment-help">Separate multiple addresses with commas.</small>
     <label>Subject<input ref={subjectInput} onFocus={()=>setVariableTarget('subject')} required maxLength={300} value={form.subject} onChange={event=>field('subject',event.target.value)}/></label>
     <label>Email body<textarea ref={bodyInput} onFocus={()=>setVariableTarget('body')} rows="6" required maxLength={4000} value={form.body} onChange={event=>field('body',event.target.value)}/></label>
     <details className="system-email-variable-help" open><summary>Available variables</summary><p>Insert into <strong>{variableTarget==='subject'?'Subject':'Email body'}</strong>.</p><div className="system-email-variables" tabIndex={0} aria-label="Template variables">{builtInVariables.map(variable=><button type="button" key={variable} onClick={()=>insertVariable(variable)}><code>{`{{${variable}}}`}</code></button>)}</div></details>
    </div>
   </div>}
   <footer className="system-email-editor-actions"><button className="button button-subtle" type="button" disabled={busy} onClick={()=>setPreview(current=>!current)}>{preview?'Back to editor':'Preview'}</button>{!preview&&<><button className="button button-subtle" type="button" disabled={busy} onClick={()=>setForm(null)}>Cancel</button><button className="button button-primary" disabled={busy} type="submit">Save template</button></>}</footer>
  </form>}
  {(!grouped||!form)&&<section className="system-email-saved"><h3>Saved templates</h3>{items.length>0&&<ul className="system-email-list">{items.map(item=><li key={item.id}>
   <h3>{item.name}</h3><p>{item.systemIds.length?item.systemIds.map(id=>names.get(id)||id).join(', '):'Whole service'}</p><p>To {item.to.join(', ')}</p>
   <div className="fulfilment-buttons"><button type="button" className="button button-subtle" disabled={busy} onClick={()=>edit(item)}>Edit</button><button type="button" className="button button-subtle" disabled={busy} onClick={()=>{setDeleting(item.id);setError('');}}>Delete</button></div>
   {deleting===item.id&&<div className="fulfilment-buttons"><span>Delete {item.name}?</span><button type="button" disabled={busy} className="button button-subtle" onClick={()=>perform(async()=>{await onDelete(item);setDeleting(null);if(form?.id===item.id)setForm(null);})}>Confirm deletion</button><button type="button" className="button button-subtle" onClick={()=>setDeleting(null)}>Keep template</button></div>}
   {onWorkflow&&<WorkflowEditor item={item} requestTypes={requestTypes} onSave={(code,steps)=>perform(()=>onWorkflow(item,code,steps))} busy={busy}/>}
  </li>)}</ul>}{!items.length&&<p className="system-email-empty">No saved templates yet.</p>}</section>}
 </section>;
}

function WorkflowEditor({item,requestTypes,onSave,busy}){
 const [code,setCode]=useState('');
 const [steps,setSteps]=useState([]);
 const type=requestTypes.find(row=>row.code===code);
 const roles=['Manager','HR','IT','CITO','COO'];
 const move=(index,offset)=>setSteps(current=>{const next=[...current];[next[index],next[index+offset]]=[next[index+offset],next[index]];return next;});
 return <details className="system-email-workflow"><summary>Approval workflow</summary>
  <p>Changes apply to new requests. Mixed requests combine the applicable approval steps.</p>
  <label>Request type<select value={code} onChange={event=>{const selected=event.target.value;setCode(selected);setSteps(item.workflows?.[selected]||requestTypes.find(row=>row.code===selected)?.steps||[]);}}><option value="">Choose request type</option>{requestTypes.filter(row=>row.code!=='reset').map(row=><option key={row.code} value={row.code}>{row.name}</option>)}</select></label>
  {type&&<><ol>{steps.map((role,index)=><li key={role}><span>{role}</span><button type="button" disabled={index===0||busy} onClick={()=>move(index,-1)} aria-label={`Move ${role} up`}>↑</button><button type="button" disabled={index===steps.length-1||busy} onClick={()=>move(index,1)} aria-label={`Move ${role} down`}>↓</button><button type="button" disabled={busy} onClick={()=>setSteps(steps.filter(step=>step!==role))}>Remove</button></li>)}</ol>
   <label>Add step<select value="" disabled={busy} onChange={event=>setSteps([...steps,event.target.value])}><option value="">Select role</option>{roles.filter(role=>!steps.includes(role)).map(role=><option key={role}>{role}</option>)}</select></label>
   <div className="fulfilment-buttons"><button type="button" className="button button-primary" disabled={!steps.length||busy} onClick={()=>onSave(code,steps)}>Save approval override</button>{item.workflows?.[code]&&<button type="button" disabled={busy} className="button button-subtle" onClick={()=>{setSteps(type.steps);onSave(code,[]);}}>Use default workflow</button>}</div>
  </>}
 </details>;
}
