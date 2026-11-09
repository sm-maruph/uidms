import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import BranchTransferFields from './BranchTransferFields.jsx';
import NewUserFields from './NewUserFields.jsx';
import BatchAccessFields from './BatchAccessFields.jsx';
import ResetAccessFields from './ResetAccessFields.jsx';
import AutoForwardFields from './AutoForwardFields.jsx';
import MailingGroupFields from './MailingGroupFields.jsx';
import { Button } from './UI.jsx';
import { canRequestIdDeletion } from './requestPermissions.js';
import bankLogo from '../images-removebg-preview.png';

const requestTypes = ['New ID creation (on behalf)','System ID creation (self-request)','Existing ID deletion','ID reset / unlock','ID upgrade','Branch transfer','Email creation','Mailing group change','Auto-forward change','IDrive access','N Drive access','External device email access'];

export default function RequestModal({ onClose, onSubmit, profile, initialType='New ID creation (on behalf)' }) {
  const availableRequestTypes = requestTypes.filter(value => value !== 'Existing ID deletion' || canRequestIdDeletion(profile?.department));
  const [type, setType] = useState(availableRequestTypes.includes(initialType) ? initialType : availableRequestTypes[0]);
  const [stage, setStage] = useState('edit');
  const [acknowledged, setAcknowledged] = useState(false);
  const [system, setSystem] = useState('ICBS');
  const [justification, setJustification] = useState('');
  const [transfer, setTransfer] = useState({transferRequestType:'Existing ID Update'});
  const [newUser, setNewUser] = useState({});
  const [batch, setBatch] = useState({});
  const [reset, setReset] = useState({systems:[]});
  const [autoForward, setAutoForward] = useState({forwardTo:''});
  const [mailingGroup, setMailingGroup] = useState({action:'',groupAddress:''});
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  useEffect(() => { if (previewRef.current) previewRef.current.inert = stage !== 'edit'; }, [stage]);
  const officialForm = type === 'Branch transfer' || type === 'System ID creation (self-request)';
  const brandedForm = officialForm || type === 'New ID creation (on behalf)' || type === 'Auto-forward change' || type === 'Mailing group change';
  const signature = localStorage.getItem('uidmsSignature') || profile?.signature;
  const payload = { type, system, justification, signature, transferDetails: officialForm ? transfer : null, newUserDetails: type === 'New ID creation (on behalf)' ? newUser : null, resetDetails: type === 'ID reset / unlock' ? reset : null, autoForwardDetails:type==='Auto-forward change'?{...autoForward,forwardTo:autoForward.forwardTo?`${autoForward.forwardTo}@combankbd.com`:'',profileEmail:profile?.email}:null, mailingGroupDetails:type==='Mailing group change'?{...mailingGroup,groupAddress:mailingGroup.groupAddress?`${mailingGroup.groupAddress}@combankbd.com`:'',profileEmail:profile?.email,requesterName:profile?.name}:null, batchDetails: !officialForm && type !== 'New ID creation (on behalf)' && type !== 'ID reset / unlock' && type !== 'Auto-forward change' && type !== 'Mailing group change' ? batch : null };

  const handleSubmit = event => {
    event.preventDefault();
    if (stage === 'signed') { onSubmit(payload); return; }
    if (stage !== 'edit') return;
    if (type === 'Existing ID deletion' && !canRequestIdDeletion(profile?.department)) { setError('Existing ID deletion requests are available only to HR and IT departments.'); return; }
    if (!justification.trim()) { setError('Add a business justification to continue.'); return; }
    if (type === 'New ID creation (on behalf)' && (newUser.people || []).some(person => !person.adId && !person.email)) { setError('Select AD ID, email, or both for every new user.'); return; }
    if (type === 'ID reset / unlock' && !reset.systems.length) { setError('Select at least one system to reset or unlock.'); return; }
    setAcknowledged(false);
    setStage('preview');
  };

  const formContent = <>
    {type === 'Branch transfer' || type === 'System ID creation (self-request)' ? <BranchTransferFields value={transfer} onChange={setTransfer} mode={type === 'Branch transfer' ? 'transfer' : 'self'} profile={{...profile,signature}}/> : type === 'New ID creation (on behalf)' ? <NewUserFields value={newUser} onChange={setNewUser}/> : type==='Auto-forward change'?<AutoForwardFields profile={profile} value={autoForward} onChange={setAutoForward}/>:type==='Mailing group change'?<MailingGroupFields profile={profile} value={mailingGroup} onChange={setMailingGroup}/>:type === 'ID reset / unlock' ? <ResetAccessFields value={reset} onChange={setReset}/> : <BatchAccessFields value={batch} onChange={setBatch}/>}
    {!officialForm&&stage==='signed'&&<div className="request-e-signature"><span>E-signed by {profile?.name||'User'}</span><img src={signature} alt={`Electronic signature of ${profile?.name||'user'}`}/></div>}
    <label className="field-label print-business-justification">{type==='Branch transfer'?'Business Justification for the New Systems Requested (Mandatory if new access is requested)':'Business justification'}<textarea value={justification} onChange={event => {setJustification(event.target.value);setError('');}} placeholder="Explain why this request is needed…" rows="3" required/></label>
    {officialForm&&<section className="approval-fields print-modal-approvals"><h3>Approvals</h3><div className="approval-signatures">{['User (Signature)','Head of Department / Branch (Signature)','CITO (Signature & Comments)','Head of HR (Signature & Comments)','Deputy CEO & COO (Signature)'].map((label,index)=><div key={label}><strong>{label}</strong>{index===0&&stage==='signed'?<img className="approval-e-signature" src={signature} alt="User e-signature"/>:<span>Signature</span>}{label.includes('Comments')&&<textarea placeholder="Comments" rows="2"/>}</div>)}</div></section>}
  </>;

  return <div className="modal-scrim" onMouseDown={event => event.target === event.currentTarget && onClose()}><form className="request-modal transfer-modal" style={{position:'relative'}} onSubmit={handleSubmit}>
    {brandedForm?<>{!officialForm&&<header className="official-form-header request-official-header"><div className="official-form-brand"><div><strong>Commercial Bank of Ceylon PLC</strong><span>Bangladesh Operations</span></div><img src={bankLogo} alt="Commercial Bank of Ceylon"/></div><div className="official-form-heading"><div><h2>User ID Request Form - {type==='Auto-forward change'?'Email Auto-forwarding':type==='Mailing group change'?'Mailing Group Inclusion / Exclusion':'New ID Creation'}</h2><p>{type==='Auto-forward change'?'Complete your profile details and provide the forwarding destination. Business justification is mandatory.':type==='Mailing group change'?'Complete your profile details and select the mailing group action. Business justification is mandatory.':'Complete all sections. Shaded boxes are fillable. Business justification is mandatory.'}</p></div><button type="button" className="official-form-print" onClick={()=>window.print()}>Print form</button></div></header>}<button type="button" className="icon-button official-modal-close" style={{position:'absolute',top:12,right:12,zIndex:3}} onClick={onClose} aria-label="Close"><Icon name="close"/></button></>:<><div className="modal-header"><div><p className="eyebrow">NEW REQUEST</p><h2>{type==='ID reset / unlock'?'ID Reset / Unlock Request':'Request identity service'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>
    <p className="modal-subtitle">{type === 'New ID creation (on behalf)' ? 'Create AD ID and email accounts for one or more new employees.' : type==='ID reset / unlock'?'Identify the user and select the systems to reset or unlock.':'Select users, systems and roles for this request.'}</p>
    <label className="field-label">Request type<select value={type} disabled={stage!=='edit'} onChange={event => {setType(event.target.value);setError('');}}>{availableRequestTypes.map(value => <option key={value}>{value}</option>)}</select></label></>}

    {stage==='preview'?<div className="request-review-scrim"><section className="request-review-dialog" role="dialog" aria-modal="true" aria-labelledby="request-review-title"><header className="request-review-heading"><div><p className="eyebrow">FINAL CHECK</p><h2 id="request-review-title">Preview your request</h2><p>Review the complete form below. Your e-signature will only be added after you confirm.</p></div><button type="button" className="icon-button" onClick={()=>{setStage('edit');setAcknowledged(false);}} aria-label="Close preview"><Icon name="close"/></button></header><div ref={previewRef} className="request-form-preview is-locked" aria-disabled="true">{formContent}</div><footer className="request-review-footer"><label className="request-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/> I confirm the information is correct and authorize UIDMS to add my saved e-signature.</label><div className="modal-actions"><Button type="button" variant="subtle" onClick={()=>{setStage('edit');setAcknowledged(false);}}>Back to edit</Button><Button type="button" icon="check" disabled={!acknowledged} onClick={()=>setStage('signed')}>Confirm & add e-signature</Button></div></footer></section></div>:<div ref={previewRef} className={`request-form-preview ${stage==='signed'?'is-locked':''}`} aria-disabled={stage==='signed'}>{formContent}</div>}
    {error&&<p className="form-error">{error}</p>}
    {stage==='edit'&&<div className="request-flow-note"><Icon name="check" size={17}/><span>Review the completed form before confirming and signing it.</span></div>}
    <div className="modal-actions">
      {stage==='edit'&&<><Button type="button" variant="subtle" onClick={onClose}>Cancel</Button><Button type="submit" icon="arrow">Preview request</Button></>}
      {stage==='signed'&&<><Button type="button" variant="subtle" onClick={()=>setStage('preview')}>Back to preview</Button><Button type="submit" icon="arrow">Submit signed request</Button></>}
    </div>
  </form></div>;
}
