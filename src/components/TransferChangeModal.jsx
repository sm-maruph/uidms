import bankLogo from '../images-removebg-preview.png';
import React,{useRef,useState,useEffect} from 'react';
import {Button} from './UI.jsx';
import Icon from './Icon.jsx';
import EmployeeDetails from './EmployeeDetails.jsx';
import BranchTransferFields from './BranchTransferFields.jsx';
import {branchOptions} from './NewUserFields.jsx';
import {defaultDepartments} from './departments.js';
import {canRequestBranchTransfer} from './requestPermissions.js';
import {accessSelection,changedAccess,destinationRole,validateChangeInitiation,validateEmployeeChange} from './transferChangeWorkflow.js';
import TransferChangeSummary from './TransferChangeSummary.jsx';
import '../transfer-change.css';

export default function TransferChangeModal({ticket,profile,users,branches=[],departments=[],onClose,onSubmit}){
 const employeeReview=Boolean(ticket);
 const [lookup,setLookup]=useState('');
 const [employeeProceed,setEmployeeProceed]=useState(Boolean(ticket));
 const [employee,setEmployee]=useState(ticket?.transferChange.employee||null);
 const [change,setChange]=useState(ticket?.transferChange||{kind:'Branch',employeeId:'',fromBranch:'',toBranch:'',fromDepartment:'',toDepartment:'',justification:''});
 const [access,setAccess]=useState(()=>ticket?accessSelection(ticket.transferChange.employee,ticket.transferChange):{});
 const [justification,setJustification]=useState('');
 const [reasons,setReasons]=useState({});
 const [stage,setStage]=useState('edit');
 const [consent,setConsent]=useState(false);
 const [error,setError]=useState('');
 const form=useRef(null);const preview=useRef(null);
 useEffect(()=>{if(preview.current)preview.current.inert=stage==='preview';},[stage]);
 const allowed=employeeReview?ticket.transferChange.stage==='employee'&&ticket.transferChange.employee.employeeId===profile.employeeId:canRequestBranchTransfer(profile.role);
 const unique=items=>[...new Set(items.filter(Boolean))];
 const branchChoices=unique(['Head Office','Corporate Office',...branchOptions,...branches,...users.map(user=>user.branch),change.fromBranch,change.toBranch]);
 const departmentChoices=unique([...defaultDepartments,...departments,...users.map(user=>user.department),change.fromDepartment,change.toDepartment]);
 const update=(key,value)=>{setChange(current=>({...current,[key]:value}));setError('');};
 const search=()=>{
  const found=users.find(user=>user.employeeId?.toUpperCase()===lookup.trim().toUpperCase());
  if(!found){setEmployee(null);setError('No employee found for this employee ID.');return;}
  const snapshot=JSON.parse(JSON.stringify(found));setEmployee(snapshot);setEmployeeProceed(false);
  setChange(current=>({...current,employeeId:found.employeeId,fromBranch:found.branch,toBranch:'',fromDepartment:found.department,toDepartment:found.department}));setError('');
 };
 const validate=()=>employeeReview?validateEmployeeChange(ticket,profile,access,justification,reasons):validateChangeInitiation(change,profile,employee);
 const submit=event=>{event.preventDefault();const message=validate();if(message){setError(message);return;}if(!form.current.reportValidity())return;setConsent(false);setStage('preview');setError('');};
 const confirm=()=>{const message=validate();if(message){setError(message);setStage('edit');return;}if(!consent)return;onSubmit({ticket,change,employee,access,justification,reasons,consent:{accepted:true,at:new Date().toISOString(),text:'I confirm the information is correct and consent to submitting this request with my saved electronic signature.'}});};
 const dropdown=(key,label,options)=><label>{label}<select required value={change[key]||''} onChange={event=>update(key,event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map(item=><option key={item}>{item}</option>)}</select></label>;
 return <div className="modal-scrim"><form ref={form} className="request-modal transfer-modal transfer-change-modal" role="dialog" aria-modal="true" aria-label="Branch / Department change" onSubmit={submit}><header className="official-form-header request-official-header"><div className="official-form-brand"><div><strong>Commercial Bank of Ceylon PLC</strong><span>Bangladesh Operations</span></div><img src={bankLogo} alt="Commercial Bank of Ceylon"/></div><div className="official-form-heading"><div><h2>User ID Request Form - Branch / Department Change</h2><p>{employeeReview?'Review your current access and select the access needed at your destination.':'Find the employee and initiate their branch or department change.'}</p></div></div></header><button type="button" className="icon-button official-modal-close" aria-label="Close" onClick={onClose}><Icon name="close"/></button>{!allowed?<p role="alert">You cannot perform this action for this employee.</p>:<><div ref={preview} className={stage==='preview'?'is-locked':''}>
 {!employeeReview&&<>{!employee?<div className="transfer-change-lookup"><label className="field-label">Employee ID<input value={lookup} onChange={event=>setLookup(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();search();}}} placeholder="Enter employee ID"/></label><Button type="button" onClick={search}>Search employee</Button></div>:<><EmployeeDetails profile={employee}/>{stage==='edit'&&<Button type="button" variant="subtle" onClick={()=>{setEmployee(null);setEmployeeProceed(false);setError('');}}>Choose another employee</Button>}{!employeeProceed&&stage==='edit'&&<Button type="button" onClick={()=>setEmployeeProceed(true)}>Proceed to request</Button>}</>}{employee&&employeeProceed&&<><fieldset className="transfer-change-kind"><legend>Change type</legend>{['Branch','Department'].map(kind=><label key={kind}><input type="radio" name="change-kind" checked={change.kind===kind} onChange={()=>update('kind',kind)}/>{kind} change</label>)}</fieldset><div className="transfer-field-grid">{dropdown('fromBranch','From branch',branchChoices)}{dropdown('toBranch','To branch',branchChoices)}{dropdown('fromDepartment','From department',departmentChoices)}{dropdown('toDepartment','To department',departmentChoices)}</div><p className="transfer-change-route">After employee review: destination {destinationRole(change)} to IT to CITO to COO to IT processing.</p><label className="field-label">Business justification<textarea required rows="3" value={change.justification} onChange={event=>update('justification',event.target.value)}/></label></>}</>}
 {employeeReview&&<><TransferChangeSummary ticket={ticket}/><section><h3>Current access</h3>{unique([...Object.keys(employee.access?.systemRoles||{}),...(employee.access?.enabledSystems||[]),...(employee.access?.otherAccess||[])]).map(system=><div className="transfer-current-access" key={system}><strong>{system}</strong><span>{employee.access?.systemRoles?.[system]?.join(', ')||'Access enabled'}</span></div>)}{!Object.keys(employee.access?.systemRoles||{}).length&&!employee.access?.enabledSystems?.length&&!employee.access?.otherAccess?.length&&<p>No current access recorded.</p>}</section><BranchTransferFields value={access} onChange={setAccess} mode="self" profile={{...employee,branch:change.toBranch,department:change.toDepartment}} allowRoleChange expandSections={stage==='preview'}/>{changedAccess(employee,access).map(row=><label className="field-label" key={row.system}>Justification for {row.system}<textarea required rows="2" value={reasons[row.system]||''} onChange={event=>setReasons(current=>({...current,[row.system]:event.target.value}))}/></label>)}<label className="field-label">Business justification for destination access<textarea required rows="3" value={justification} onChange={event=>setJustification(event.target.value)}/></label></>}
 </div>{error&&<p className="form-error" role="alert">{error}</p>}{stage==='preview'?<footer className="transfer-change-confirm"><h3>Preview and confirm</h3><p>Review the information above before submitting.</p>{profile.signature&&<div className="request-e-signature"><span>Electronic signature of {profile.name}</span><img src={profile.signature} alt={`Signature of ${profile.name}`}/></div>}<label><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>I confirm this information and consent to submit with my saved electronic signature.</label><div className="modal-actions"><Button type="button" variant="subtle" onClick={()=>setStage('edit')}>Back to edit</Button><Button type="button" disabled={!consent} onClick={confirm}>Confirm submission</Button></div></footer>:<div className="modal-actions"><Button type="button" variant="subtle" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!employee||!employeeProceed}>Preview request</Button></div>}</>}</form></div>;
}
