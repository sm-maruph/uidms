import React from 'react';
import { Button } from './UI.jsx';
import { otherAccessSystems, requestRoles } from './requestCatalog.js';
import { supportsSimilarId } from './similarIdSystems.js';
import bankLogo from '../images-removebg-preview.png';

const blankPerson = () => ({ fullName:'', designation:'', employeeId:'', systemId:'', department:'', fromBranch:'', toBranch:'' });
const coreSystems = ['ICBS','RVI Web Portal Access','Query','ITMBD','T4S','Cheque Clearing','BEFTN','HRIS','LOS','WBO','Eximbills','SWIFT_Jump','SWIFT ID','SWIFT Demerged ID (ex-BNGLXXXXX / BD0XXXXXX)','CITRIX_R'];
const testSystems = ['ITMBD Test','ICBS Test'];
const losDepartments = ['Corporate Banking','Credit Admin','Islamic Banking','Card Center','Customer Service'];

export default function BranchTransferFields({ value, onChange, mode='transfer', profile, readOnly=false, expandSections=false }) {
  const availableOtherAccessSystems = mode === 'self' ? otherAccessSystems.filter(system => system !== 'AD ID') : otherAccessSystems;
  const update = (key,next) => onChange({...value,[key]:next});
  const selfPerson={...blankPerson(),fullName:profile?.name||'',designation:profile?.designation||'',employeeId:profile?.employeeId||'',systemId:profile?.systemId||profile?.userId||profile?.employeeId||'',department:profile?.department||'',branch:profile?.branch||''};
  const people = value.people?.length ? value.people : (readOnly&&mode==='transfer'?[]:[mode==='self'?selfPerson:blankPerson()]);
  const updatePerson = (index,key,next) => update('people',people.map((person,i)=>i===index?{...person,[key]:next}:person));
  const toggleSystem = (key,name,checked) => onChange({...value,[`${key}Systems`]:{...value[`${key}Systems`],[name]:checked},...(checked?{}:{[key]:{...value[key],[name]:[]},[`${key}Departments`]:{...value[`${key}Departments`],[name]:''}})});
  const chooseRole = (key,name,role) => onChange({...value,[key]:{...value[key],[name]:value[key]?.[name]?.includes(role)?[]:[role]},[`${key}Systems`]:{...value[`${key}Systems`],[name]:true}});
  const chooseLOSDepartment = (key,department) => onChange({...value,[`${key}Departments`]:{...value[`${key}Departments`],LOS:department},[key]:{...value[key],LOS:[]},[`${key}Systems`]:{...value[`${key}Systems`],LOS:true}});
  const rolesFor = system => requestRoles[system] || [];
  const labelFor = system => system==='ITMBD'?'ITMBD (Card Center only)':system==='HRIS'?'HRIS (HR only)':system==='SWIFT Demerged ID (ex-BNGLXXXXX / BD0XXXXXX)'?'SWIFT Demerged ID (ex-BNGLXXXXX / BD0XXXXXX)':system;
  const extraFor = (key,system,field) => value[`${key}Extra`]?.[system]?.[field]||'';
  const updateExtra = (key,system,field,next) => update(`${key}Extra`,{...value[`${key}Extra`],[system]:{...value[`${key}Extra`]?.[system],[field]:next}});
  const previewOnly = readOnly || expandSections;
  const isSystemSelected = (key,system) => value[`${key}Systems`]?.[system] ?? Boolean(value[key]?.[system]?.length);
  const checkRows = (key,heading,list,similar=false) => {
    const visibleSystems = previewOnly ? list.filter(system=>isSystemSelected(key,system)) : list;
    if (!visibleSystems.length) return null;
    return <details className="transfer-access system-section-accordion" open={readOnly||expandSections} onInvalidCapture={event=>{event.currentTarget.open=true;}}><summary><span className="system-section-overview"><span className="system-section-title">{heading}</span><span className="system-section-system-list">{visibleSystems.map(system=><span key={system}>{labelFor(system)}</span>)}</span></span>{!previewOnly&&<span className="system-section-instruction"><span className="system-expand-hint">Click here to select required systems</span><span className="system-collapse-hint">Click here to collapse</span></span>}</summary><div className="system-section-content">{!previewOnly&&<p>Select the systems and role levels that apply.</p>}{visibleSystems.map(system=>{
    const selected=value[key]?.[system]||[];
    const selectedRole=selected.find(role=>rolesFor(system).includes(role));
    const systemChecked=value[`${key}Systems`]?.[system]??Boolean(selected.length);
    const selectedDepartment=value[`${key}Departments`]?.[system]||'';
    const showRoleDetails=systemChecked;
    const departmentRoles=system==='LOS'&&selectedDepartment?rolesFor(system).filter(role=>role.startsWith(`${selectedDepartment} `)):[];
    return <div className="transfer-system" key={system}>
      <strong><label><input type="checkbox" checked={systemChecked} onChange={e=>toggleSystem(key,system,e.target.checked)}/>{labelFor(system)}</label></strong>
      {system==='LOS'&&systemChecked&&<div className="los-departments">{losDepartments.filter(department=>!previewOnly||department===selectedDepartment).map(department=><label key={department}><input type="radio" name={`${key}-LOS-department`} required={systemChecked} checked={selectedDepartment===department} onChange={()=>chooseLOSDepartment(key,department)}/>{department}</label>)}</div>}
      {system==='LOS'&&selectedDepartment&&<>
        <div className="los-department-details">
          {selectedDepartment==='Corporate Banking'&&<label>Unit<input required value={extraFor(key,system,'unit')} onChange={e=>updateExtra(key,system,'unit',e.target.value)}/></label>}
          {(selectedDepartment==='Corporate Banking'||selectedDepartment==='Credit Admin'||selectedDepartment==='Islamic Banking')&&<label>Reference<input required value={extraFor(key,system,'reference')} onChange={e=>updateExtra(key,system,'reference',e.target.value)}/></label>}
        </div>
        <div className="los-roles">{departmentRoles.filter(role=>!previewOnly||selected.includes(role)).map(role=><label className={selectedRole&&selectedRole!==role?'transfer-role role-dimmed':'transfer-role'} key={role}><input type="radio" name={`${key}-LOS-role`} required={systemChecked} checked={selectedRole===role} disabled={Boolean(selectedRole&&selectedRole!==role)} onChange={()=>chooseRole(key,system,role)}/>{role.slice(selectedDepartment.length).replace(/^\W+/, '').trim()}</label>)}</div>
      </>}
      {system!=='LOS'&&systemChecked&&rolesFor(system).filter(role=>!previewOnly||selected.includes(role)).map(role=><label className={selectedRole&&selectedRole!==role?'transfer-role role-dimmed':'transfer-role'} key={role}><input type="radio" name={`${key}-${system}`} required={systemChecked} checked={selectedRole===role} disabled={Boolean(selectedRole&&selectedRole!==role)} onChange={()=>chooseRole(key,system,role)}/>{role}</label>)}
      {system==='CITRIX_R'&&systemChecked&&<input required value={extraFor(key,system,'mentionId')} onChange={e=>updateExtra(key,system,'mentionId',e.target.value)} placeholder="Mention ID (required)"/>}
      {supportsSimilarId(system)&&showRoleDetails&&<label className="transfer-similar-id-field"><span>Similar ID for {system} (required)</span><input required aria-label={`Similar ID for ${system}`} className="transfer-similar-id" value={value.similarIds?.[system]||''} onChange={e=>update('similarIds',{...value.similarIds,[system]:e.target.value})} placeholder="Enter a similar ID"/></label>}
    </div>})}</div></details>;
  };
  return <div className="branch-transfer-fields">
    <header className="official-form-header">
      <div className="official-form-brand"><div><strong>Commercial Bank of Ceylon PLC</strong><span>Bangladesh Operations</span></div><img src={bankLogo} alt="Commercial Bank of Ceylon"/></div>
      <div className="official-form-heading"><div><h2>User ID Request Form - {mode==='transfer'?'Branch Transfer':'System Access'}</h2><p>Complete all sections. Business justification is mandatory.</p></div></div>
    </header>
    <div className={`transfer-people-heading ${mode==='transfer'?'official-section-heading':''}`}><div><h3>Requester Information</h3><p>{mode==='transfer'?'Add employee details below, then select systems and roles in the sections that follow.':'Complete your information below, then select systems and roles in the sections that follow.'}</p></div>{mode==='transfer'&&<Button type="button" icon="plus" onClick={()=>update('people',[...people,blankPerson()])}>Add employee</Button>}</div>
    {mode==='transfer'&&<div className="official-form-recipient"><strong>To Whom:</strong><span>CITO / Deputy CEO & COO</span></div>}
    {readOnly&&!people.length&&<p className="preview-missing-record" role="status">Employee transfer details and system selections were not recorded in this older request. The available ticket information is shown above; no employee or access selections have been assumed.</p>}
    {people.map((person,index)=><section className="transfer-person-card" key={index}><div className="transfer-person-heading"><strong>Employee {index+1}</strong>{people.length>1&&<button type="button" onClick={()=>update('people',people.filter((_,i)=>i!==index))}>Remove</button>}</div>
      <div className="transfer-field-grid"><label>Full name<input value={person.fullName||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'fullName',e.target.value)} required/></label><label>Designation<input value={person.designation||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'designation',e.target.value)} required/></label><label>Employee ID<input value={person.employeeId||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'employeeId',e.target.value)} required={mode==='transfer'}/></label><label>System ID<input value={person.systemId||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'systemId',e.target.value)} required={mode==='transfer'}/></label><label>Department<input value={person.department||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'department',e.target.value)} required/></label>{mode==='transfer'?<><label>Transferred From (Branch)<input value={person.fromBranch||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'fromBranch',e.target.value)} required/></label><label>Transferred To (Branch)<input value={person.toBranch||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'toBranch',e.target.value)} required/></label></>:<label>Branch<input value={person.branch||(readOnly?'Not recorded':'')} onChange={e=>updatePerson(index,'branch',e.target.value)} required/></label>}</div>
</section>)}
    {mode==='transfer'&&<div className="transfer-subtype"><strong>Request type</strong>{readOnly&&!['New ID Creation','Existing ID Update'].includes(value.transferRequestType)?<span>{value.transferRequestType||'Not recorded'}</span>:<><label><input type="radio" name="transferType" checked={value.transferRequestType==='New ID Creation'} onChange={()=>update('transferRequestType','New ID Creation')}/>New ID Creation</label><label><input type="radio" name="transferType" checked={value.transferRequestType==='Existing ID Update'} onChange={()=>update('transferRequestType','Existing ID Update')}/>Existing ID Update</label></>}</div>}
    {mode==='transfer'&&<>{checkRows('currentAccess','A. Current access — systems the user currently has',coreSystems)}{checkRows('currentOtherAccess','A. Current access — Other Access (if currently has)',otherAccessSystems)}{checkRows('currentTestSystems','A. Current access — Specialized Test Systems',testSystems)}</>}
    {checkRows('newAccess',mode==='transfer'?'B. New ID required after transfer — Systems Required':'Systems Required',coreSystems,true)}
    {checkRows('newOtherAccess',mode==='transfer'?'B. New ID required after transfer — Other Access': 'Other Access (if required)',availableOtherAccessSystems,true)}
    {checkRows('newTestSystems',mode==='transfer'?'B. New ID required after transfer — Specialized Test Systems':'Specialized Test Systems',testSystems,true)}
    {checkRows('additionalTestSystems','Specialized Test Systems (Specialized Dept / Purpose only)',testSystems)}

  </div>;
}
