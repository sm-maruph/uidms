import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { captureSubmittedForm, restoreSubmittedForm } from './submittedForm.js';
import { transferPreviewDetails } from './transferPreview.js';
import BranchTransferFields from './BranchTransferFields.jsx';
import NewUserFields from './NewUserFields.jsx';
import BatchAccessFields from './BatchAccessFields.jsx';
import ResetAccessFields from './ResetAccessFields.jsx';
import DeactivationFields from './DeactivationFields.jsx';
import SystemDeactivationFields from './SystemDeactivationFields.jsx';
import UpgradeAccessFields from './UpgradeAccessFields.jsx';
import EmailCreationFields from './EmailCreationFields.jsx';
import { isDeactivation, systemDeactivationSystems, deactivationScope } from './deactivationRequests.js';
import AutoForwardFields from './AutoForwardFields.jsx';
import MailingGroupFields from './MailingGroupFields.jsx';
import ExternalDeviceAccessFields from './ExternalDeviceAccessFields.jsx';
import { Button } from './UI.jsx';
import { canRequestIdDeletion } from './requestPermissions.js';
import { validateTransferAccess, validateBatchAccess } from './accessValidation.js';
import { validateUpgradeRequest } from './upgradePermissions.js';
import bankLogo from '../images-removebg-preview.png';

const requestTypes = ['New ID creation (on behalf)','System ID creation (self-request)','Employee ID deactivation','System ID deactivation','ID reset / unlock','ID upgrade','Branch transfer','Email creation','Mailing group change','Auto-forward change','IDrive access','N Drive access','External device email access'];

export default function RequestModal({ onClose, onSubmit, profile, users=[], mailingGroups=[], initialType='New ID creation (on behalf)', ticket=null, printOnOpen=false, embedded=false, editable=false }) {
  ticket = restoreSubmittedForm(ticket);
  const readOnly = Boolean(ticket) && !editable;
  users = !editable && ticket?.submittedForm?.context?.users || users;
  mailingGroups = !editable && ticket?.submittedForm?.context?.mailingGroups || mailingGroups;
  profile = ticket ? (ticket.requesterProfile || {...profile, name:ticket.name, employeeId:ticket.requesterId, branch:ticket.branch, signature:ticket.signature}) : profile;
  const availableRequestTypes = requestTypes.filter(value => value !== 'Employee ID deactivation' || canRequestIdDeletion(profile?.department));
  const [type, setType] = useState((ticket?.action === 'New ID creation' ? 'System ID creation (self-request)' : ticket?.action) || (availableRequestTypes.includes(initialType) ? initialType : availableRequestTypes[0]));
  const [stage, setStage] = useState(readOnly ? 'signed' : 'edit');
  const [acknowledged, setAcknowledged] = useState(false);
  const [system, setSystem] = useState(ticket?.system || 'ICBS');
  const [justification, setJustification] = useState(ticket?.justification || '');
  const [transfer, setTransfer] = useState((ticket?.transferDetails ? transferPreviewDetails(ticket.transferDetails) : null) || (ticket?.action === 'New ID creation' ? {people:[{fullName:profile?.name||ticket.name,designation:profile?.designation||'',employeeId:ticket.requesterId||'',systemId:profile?.userId||ticket.requesterId||'',department:profile?.department||'',branch:ticket.branch||''}],newAccessSystems:{[ticket.system]:true},newAccess:{[ticket.system]:[ticket.role]},newAccessExtra:{[ticket.system]:{justification:ticket.justification}}} : {transferRequestType:'Existing ID Update'}));
  const [newUser, setNewUser] = useState(ticket?.newUserDetails || {});
  const [batch, setBatch] = useState(ticket?.batchDetails || {});
  const [reset, setReset] = useState(ticket?.resetDetails || {systems:[]});
  const [deactivation, setDeactivation] = useState(ticket?.deactivationDetails || {systems:[]});
  const [upgrade, setUpgrade] = useState(ticket?.upgradeDetails || {systems:[],roles:{}});
  const [emailCreation, setEmailCreation] = useState(ticket?.emailCreationDetails || {username:''});
  const [autoForward, setAutoForward] = useState(ticket?.autoForwardDetails ? {...ticket.autoForwardDetails, forwardTo:(ticket.autoForwardDetails.forwardTo||'').split('@')[0]} : {forwardTo:''});
  const [mailingGroup, setMailingGroup] = useState(ticket?.mailingGroupDetails || {action:'',groupAddresses:[]});
  const [externalDevice, setExternalDevice] = useState(ticket?.externalDeviceDetails || {deviceModel:'',deviceNumber:'',serialNumber:''});
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const blockedFieldRef = useRef(null);
  const dismissError = () => {
    setError('');
    requestAnimationFrame(()=>{
      const field=blockedFieldRef.current;
      if (field?.isConnected) {
        for (let parent=field.parentElement;parent;parent=parent.parentElement) if(parent.tagName==='DETAILS') parent.open=true;
        field.focus();
      } else formRef.current?.querySelector('button[type=submit]')?.focus();
      blockedFieldRef.current=null;
    });
  };
  const previewRef = useRef(null);
  useEffect(() => { if (previewRef.current) previewRef.current.inert = stage !== 'edit'; }, [stage]);
  const officialForm = type === 'Branch transfer' || type === 'System ID creation (self-request)';
  const showRequestTypeSelector = !readOnly && !editable && !officialForm && !['New ID creation (on behalf)', 'Auto-forward change', 'Mailing group change'].includes(type);
  const formTitle = {'ID reset / unlock':'ID Reset / Unlock','ID upgrade':'ID Upgrade','Email creation':'Email Creation','Auto-forward change':'Email Auto-forwarding','Mailing group change':'Mailing Group Inclusion / Exclusion','New ID creation (on behalf)':'New ID Creation','Employee ID deactivation':'Employee ID Deactivation','System ID deactivation':'System ID Deactivation','IDrive access':'IDrive Access','N Drive access':'N Drive Access','External device email access':'External Device Email Access'}[type] || type;
  const signature = readOnly ? ticket.signature : localStorage.getItem('uidmsSignature') || profile?.signature;
  useEffect(() => {
    if (!readOnly || embedded) return;
    document.body.classList.add('approval-form-open');
    const timer = printOnOpen ? setTimeout(() => window.print(), 300) : null;
    return () => { clearTimeout(timer); document.body.classList.remove('approval-form-open'); };
  }, [readOnly, printOnOpen, embedded]);
  const requestData = { requesterProfile: profile, type, system, justification, signature, transferDetails: officialForm ? {...transfer,people:transfer.people?.length?transfer.people:type==='System ID creation (self-request)'?[{fullName:profile?.name||'',designation:profile?.designation||'',employeeId:profile?.employeeId||'',systemId:profile?.systemId||profile?.userId||profile?.employeeId||'',department:profile?.department||'',branch:profile?.branch||''}]:[]} : null, newUserDetails: type === 'New ID creation (on behalf)' ? newUser : null, emailCreationDetails:type==='Email creation'?{...emailCreation,email:`${emailCreation.username}@combankbd.com`,name:profile?.name,designation:profile?.designation,employeeId:profile?.employeeId,department:profile?.department,branch:profile?.branch}:null, resetDetails: type === 'ID reset / unlock' ? reset : null, upgradeDetails:type==='ID upgrade'?{...upgrade,currentAccess:profile?.access?.systemRoles||{},currentEnabledSystems:profile?.access?.enabledSystems||[],currentOtherAccess:profile?.access?.otherAccess||[]}:null, externalDeviceDetails:type==='External device email access'?{...externalDevice,name:profile?.name,employeeId:profile?.employeeId||profile?.systemId,department:profile?.department,branch:profile?.branch,email:profile?.email}:null, deactivationDetails:isDeactivation(type)?{...deactivationScope(type,deactivation),name:deactivation.name||profile?.name,employeeId:deactivation.employeeId||profile?.employeeId,userId:deactivation.userId||profile?.systemId||profile?.employeeId,department:deactivation.department||profile?.department,branch:deactivation.branch||profile?.branch}:null, autoForwardDetails:type==='Auto-forward change'?{...autoForward,forwardTo:autoForward.forwardTo?`${autoForward.forwardTo}@combankbd.com`:'',profileEmail:profile?.email}:null, mailingGroupDetails:type==='Mailing group change'?{...mailingGroup,profileEmail:profile?.email,requesterName:profile?.name}:null, batchDetails: !officialForm && type !== 'New ID creation (on behalf)' && type !== 'ID reset / unlock' && type!=='ID upgrade' && type!=='Email creation' && type!=='External device email access' && !isDeactivation(type) && type !== 'Auto-forward change' && type !== 'Mailing group change' ? batch : null };

  const payload = {...requestData,submittedForm:captureSubmittedForm(requestData,{
    users:users.filter(user=>user.employeeId===deactivation.employeeId||user.employeeId===profile?.employeeId),
    mailingGroups,
  })};

  const validateSelectedAccess = () => officialForm ? validateTransferAccess(transfer) : requestData.batchDetails ? validateBatchAccess(batch) : '';

  const handleSubmit = event => {
    event.preventDefault();
    if (readOnly) return;
    const accessError = validateSelectedAccess();
    if (accessError) { setError(accessError); return; }
    if (type === 'ID upgrade') { const upgradeError = validateUpgradeRequest(upgrade, profile?.access); if (upgradeError) { setError(upgradeError); return; } }
    if (stage !== 'edit') return;
    if (type === 'Employee ID deactivation' && !canRequestIdDeletion(profile?.department)) { setError('Employee ID deactivation requests are available only to HR and IT departments.'); return; }
    if (!justification.trim()) { setError('Add a business justification to continue.'); return; }
    if (type === 'New ID creation (on behalf)' && (newUser.people || []).some(person => !person.adId && !person.email)) { setError('Select AD ID, email, or both for every new user.'); return; }
    if (type === 'ID reset / unlock' && !reset.systems.length) { setError('Select at least one system to reset or unlock.'); return; }
    if (type === 'Mailing group change' && (!mailingGroup.action||!mailingGroup.groupAddresses?.length)) { setError('Choose an action and select at least one mailing group.'); return; }
    if (type === 'External device email access' && (!externalDevice.deviceModel.trim()||!externalDevice.deviceNumber.trim()||!externalDevice.serialNumber.trim())) { setError('Enter the device model, device number, and serial number.'); return; }
    if (type === 'System ID deactivation' && !(deactivation.systems||[]).length) { setError('Select at least one system ID to deactivate.'); return; }
    if (type === 'System ID deactivation') { const employee=users.find(user=>user.employeeId===deactivation.employeeId); const allowed=systemDeactivationSystems; if (!employee || deactivation.systems.some(system=>!allowed.includes(system))) { setError('Select an employee and valid system IDs.'); return; } }
    const invalid = formRef.current?.querySelector(':invalid');
    if (invalid) {
      blockedFieldRef.current=invalid;
      const label=invalid.labels?.[0]?.textContent?.trim()||invalid.getAttribute('aria-label')||invalid.placeholder||'Required field';
      setError(`${label}: ${invalid.validationMessage}`);
      return;
    }
    setError('');
    setAcknowledged(false);
    setStage('preview');
  };

  const confirmSubmission = () => {
    if (!acknowledged || stage !== 'preview') return;
    const accessError = validateSelectedAccess();
    if (accessError) { setError(accessError); setStage('edit'); return; }
    if (type === 'ID upgrade') {
      const upgradeError = validateUpgradeRequest(upgrade, profile?.access);
      if (upgradeError) { setError(upgradeError); setStage('edit'); return; }
    }
    onSubmit({...payload, consent:{accepted:true, at:new Date().toISOString(), text:'I confirm the information is correct and consent to submitting this request with my saved electronic signature.'}});
  };

  const formContent = <>
    {type === 'Branch transfer' || type === 'System ID creation (self-request)' ? <BranchTransferFields expandSections={stage!=='edit'} readOnly={readOnly} value={transfer} onChange={setTransfer} mode={type === 'Branch transfer' ? 'transfer' : 'self'} profile={{...profile,signature}}/> : type === 'New ID creation (on behalf)' ? <NewUserFields value={newUser} onChange={setNewUser}/> : type==='Email creation'?<EmailCreationFields profile={profile} value={emailCreation} onChange={setEmailCreation}/>:type==='Auto-forward change'?<AutoForwardFields profile={profile} value={autoForward} onChange={setAutoForward}/>:type==='Mailing group change'?<MailingGroupFields profile={profile} value={mailingGroup} onChange={setMailingGroup} mailingGroups={mailingGroups}/>:type==='External device email access'?<ExternalDeviceAccessFields profile={profile} value={externalDevice} onChange={setExternalDevice}/>:type === 'ID reset / unlock' ? <ResetAccessFields value={reset} onChange={setReset}/> : type === 'System ID deactivation' ? <SystemDeactivationFields value={deactivation} onChange={setDeactivation} profile={profile} users={users}/> : type === 'Employee ID deactivation' ? <DeactivationFields value={deactivation} onChange={setDeactivation} profile={profile}/> : type==='ID upgrade'?<UpgradeAccessFields value={upgrade} onChange={setUpgrade} profile={profile} readOnly={readOnly||stage!=='edit'}/>:<BatchAccessFields value={batch} onChange={setBatch}/>}
    {!officialForm&&stage==='signed'&&signature&&<div className="request-e-signature"><span>E-signed by {profile?.name||'User'}</span><img src={signature} alt={`Electronic signature of ${profile?.name||'user'}`}/></div>}
    <label className="field-label print-business-justification">Business justification / Clarification / Remarks<textarea value={justification} onChange={event => {setJustification(event.target.value);setError('');}} placeholder="Explain the business need or provide clarification or remarks for this request." rows="3" required/></label>
  </>;

  const formHeader = <header className="official-form-header request-official-header"><div className="official-form-brand"><div><strong>Commercial Bank of Ceylon PLC</strong><span>Bangladesh Operations</span></div><img src={bankLogo} alt="Commercial Bank of Ceylon"/></div><div className="official-form-heading"><div><h2>User ID Request Form - {formTitle}</h2><p>Complete all sections. Business justification is mandatory.</p></div></div></header>;

  const modal = <div className={`modal-scrim ${readOnly?'approval-form-scrim':''}`} onMouseDown={event => event.target === event.currentTarget && onClose()}><form ref={formRef} noValidate className={`request-modal transfer-modal ${readOnly?'approval-form-modal':''}`} role="dialog" aria-modal="true" aria-label={readOnly?'Preview Form':'Request form'} style={{position:'relative'}} onSubmit={handleSubmit}>
    {readOnly&&<div className="approval-form-toolbar"><strong>Preview Form - {ticket.id}</strong><div className="approval-form-toolbar-actions"><Button type="button" onClick={()=>window.print()}>Print</Button><button type="button" className="icon-button" onClick={onClose} aria-label="Close preview"><Icon name="close"/></button></div></div>}
    {!officialForm&&formHeader}
    {readOnly&&!ticket.submittedForm&&<section className="preview-ticket-record"><h3>Submitted request details</h3><dl>{[['Ticket',ticket.id],['Submitted by',profile?.name||ticket.name],['Employee ID',ticket.requesterId],['Department',profile?.department],['Branch',ticket.branch],['System',ticket.system],['Requested role',ticket.role],['Status',ticket.state]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not recorded'}</dd></div>)}</dl></section>}
    {!readOnly&&<button type="button" className="icon-button official-modal-close" style={{position:'absolute',top:12,right:12,zIndex:3}} onClick={onClose} aria-label="Close"><Icon name="close"/></button>}
    {showRequestTypeSelector&&<label className="field-label">Request type<select value={type} disabled={stage!=='edit'} onChange={event => {setType(event.target.value);setDeactivation({systems:[]});setError('');}}>{availableRequestTypes.map(value => <option key={value}>{value}</option>)}</select></label>}

    {stage==='preview'?createPortal(<div className="request-review-scrim"><section className="request-review-dialog" role="dialog" aria-modal="true" aria-labelledby="request-review-title"><header className="request-review-heading"><div><p className="eyebrow">FINAL CHECK</p><h2 id="request-review-title">Confirm request submission</h2><p>Review the full form below. Confirm your consent to submit this request with your electronic signature.</p></div><button type="button" className="icon-button" onClick={()=>{setStage('edit');setAcknowledged(false);}} aria-label="Close preview"><Icon name="close"/></button></header><div className="request-form-preview is-locked" tabIndex={0} role="region" aria-label="Scrollable form preview"><div ref={previewRef} aria-disabled="true">{!officialForm&&formHeader}{formContent}</div></div><footer className="request-review-footer"><label className="request-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/><span>I confirm the information is correct and consent to submitting this request with my saved electronic signature.</span></label><div className="modal-actions"><Button type="button" variant="subtle" onClick={()=>{setStage('edit');setAcknowledged(false);}}>Cancel</Button><Button type="button" icon="check" disabled={!acknowledged} onClick={confirmSubmission}>{editable?'Confirm changes':'Confirm submission'}</Button></div></footer></section></div>, document.body):<div ref={previewRef} className={`request-form-preview ${stage==='signed'?'is-locked':''}`} aria-disabled={stage==='signed'}>{formContent}</div>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    {stage==='edit'&&<div className="request-flow-note"><Icon name="check" size={17}/><span>Submit request to review the full form and confirm your consent and signature.</span></div>}
    {!readOnly&&stage==='edit'&&<footer className="modal-actions request-sticky-actions"><Button type="button" variant="subtle" onClick={onClose}>Cancel</Button><Button type="submit" icon="arrow">{editable?'Save changes':'Submit request'}</Button></footer>}
  </form></div>;
  const validationPopup = error && !readOnly ? createPortal(<div className="validation-popup-scrim"><section className="validation-popup" role="alertdialog" aria-modal="true" aria-labelledby="validation-popup-title" aria-describedby="validation-popup-message" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();dismissError();}if(event.key==='Tab'){event.preventDefault();event.currentTarget.querySelector('button')?.focus();}}}><span className="validation-popup-icon"><Icon name="idCard" size={25}/></span><p className="validation-popup-eyebrow">ACTION REQUIRED</p><h2 id="validation-popup-title">Please complete your request</h2><p id="validation-popup-message">{error}</p><p className="validation-popup-help">Your request has not been submitted. Correct the item above, then submit again.</p><Button type="button" autoFocus onClick={dismissError}>Back to form</Button></section></div>, document.body) : null;
  if (embedded) return <section className="embedded-form-preview" aria-label="Submitted form details"><header className="submitted-form-details-heading"><p className="eyebrow">SUBMITTED REQUEST</p><h2>Form details</h2></header><div ref={previewRef} className="request-form-preview is-locked" aria-disabled="true">{!officialForm&&formHeader}{formContent}</div></section>;
  return <>{readOnly ? createPortal(modal, document.body) : modal}{validationPopup}</>;

}
