import React, { useState } from 'react';
import Icon from './Icon.jsx';
import BranchTransferFields from './BranchTransferFields.jsx';
import NewUserFields from './NewUserFields.jsx';
import BatchAccessFields from './BatchAccessFields.jsx';
import ResetAccessFields from './ResetAccessFields.jsx';
import { Button } from './UI.jsx';

const serviceList = ['ICBS','ITMBD','T4S','Cheque Clearing','BEFTN','HRIS','Eximbills','Swift_Jump','Swift ID','Swift Demerage ID','AD ID','Amlock ID','Internet Access','Quantum','ITMBD Test','ICBS Test','RVI Web Portal Access','Query','LOS','WBO','CITRIX_R','E-Journal','FX Portal','NID Verification','E2Gen','MCAS','JIRA ID','Remmit Plus','Email','IDrive','N Drive'];
const requestTypes = ['New ID creation (on behalf)','System ID creation (self-request)','Existing ID deletion','ID reset / unlock','ID upgrade','Branch transfer','Email creation','Mailing group change','Auto-forward change','IDrive access','N Drive access','External device email access'];

export default function RequestModal({ onClose, onSubmit, profile, initialType='New ID creation (on behalf)' }) {
  const [type, setType] = useState(requestTypes.includes(initialType) ? initialType : 'New ID creation (on behalf)');
  const [system, setSystem] = useState('ICBS');
  const [justification, setJustification] = useState('');
  const [transfer, setTransfer] = useState({transferRequestType:'Existing ID Update'});
  const [newUser, setNewUser] = useState({});
  const [batch, setBatch] = useState({});
  const [reset, setReset] = useState({systems:[]});
  const [error, setError] = useState('');
  return <div className="modal-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}><form className="request-modal transfer-modal" onSubmit={e => { e.preventDefault(); if (!justification.trim()) { setError('Add a business justification to continue.'); return; } if (type === 'New ID creation (on behalf)' && (newUser.people || []).some(person => !person.adId && !person.email)) { setError('Select AD ID, email, or both for every new user.'); return; } if (type === 'ID reset / unlock' && !reset.systems.length) { setError('Select at least one system to reset or unlock.'); return; } onSubmit({ type, system, justification, transferDetails: type === 'Branch transfer' || type === 'System ID creation (self-request)' ? transfer : null, newUserDetails: type === 'New ID creation (on behalf)' ? newUser : null, resetDetails: type === 'ID reset / unlock' ? reset : null, batchDetails: type !== 'Branch transfer' && type !== 'System ID creation (self-request)' && type !== 'New ID creation (on behalf)' && type !== 'ID reset / unlock' ? batch : null }); }}>
    <div className="modal-header"><div><p className="eyebrow">{type==='Branch transfer'||type==='System ID creation (self-request)'?'COMMERCIAL BANK OF CEYLON PLC · BANGLADESH OPERATIONS':'NEW REQUEST'}</p><h2>{type === 'Branch transfer' ? 'User ID Request Form - Branch Transfer' : type==='System ID creation (self-request)'?'System ID Request Form - Self Request':type === 'New ID creation (on behalf)' ? 'New User AD ID & Email Request' : type==='ID reset / unlock'?'ID Reset / Unlock Request':'Request identity service'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>
    <p className="modal-subtitle">{type === 'Branch transfer' ? 'Complete all sections. Shaded boxes are fillable. Business justification is mandatory.' : type==='System ID creation (self-request)'?'Request your own non-AD system IDs and access. AD ID creation is only available on behalf of another employee.' : type === 'New ID creation (on behalf)' ? 'Create AD ID and email accounts for one or more new employees.' : type==='ID reset / unlock'?'Identify the user and select the systems to reset or unlock.':'Select users, systems and roles for this request.'}</p>
    <label className="field-label">Request type<select value={type} onChange={e => setType(e.target.value)}>{requestTypes.map(x => <option key={x}>{x}</option>)}</select></label>
    {type === 'Branch transfer' || type === 'System ID creation (self-request)' ? <BranchTransferFields value={transfer} onChange={setTransfer} mode={type === 'Branch transfer' ? 'transfer' : 'self'} profile={profile}/> : type === 'New ID creation (on behalf)' ? <NewUserFields value={newUser} onChange={setNewUser}/> : type === 'ID reset / unlock' ? <ResetAccessFields value={reset} onChange={setReset}/> : <BatchAccessFields value={batch} onChange={setBatch}/>}
    <label className="field-label">{type==='Branch transfer'?'Business Justification for the New Systems Requested (Mandatory if new access is requested)':'Business justification'}<textarea value={justification} onChange={e => { setJustification(e.target.value); setError(''); }} placeholder="Explain why this request is needed…" rows="3" required/></label>{(type==='Branch transfer'||type==='System ID creation (self-request)')&&<section className="approval-fields"><h3>Approvals</h3><div className="approval-signatures">{['User (Signature)','Head of Department / Branch (Signature)','CITO (Signature & Comments)','Head of HR (Signature & Comments)','Deputy CEO & COO (Signature)'].map(label=><div key={label}><strong>{label}</strong><span>Signature</span>{label.includes('Comments')&&<textarea placeholder="Comments" rows="2"/>}</div>)}</div></section>}{error && <p className="form-error">{error}</p>}
    <div className="request-flow-note"><Icon name="check" size={17}/><span>Workflow is selected using the service and requester role. Every step is logged.</span></div><div className="modal-actions"><Button type="button" variant="subtle" onClick={onClose}>Cancel</Button><Button type="submit" icon="arrow">Submit request</Button></div>
  </form></div>;
}
