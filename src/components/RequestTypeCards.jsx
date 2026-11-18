import {requestTypeLabel} from './requestTitle.js';
import DriveChoicePopup from './DriveChoicePopup.jsx';
﻿import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { canRequestIdDeletion, canRequestBranchTransfer } from './requestPermissions.js';

const requestTypes = [
  { title:'New ID creation', description:'Create a new ID for yourself or request one on behalf of another employee.', icon:'userPlus' },
  { title:'Employee ID deactivation', requestType:'Employee ID deactivation', description:'Deactivate an employee identity and all associated system access.', icon:'trash' },
  { title:'System ID deactivation', description:'Select one or more system IDs to deactivate while keeping other access active.', icon:'key' },
  { title:'ID Unlock / Reset', requestType:'ID reset / unlock', description:'Reset a password or unlock an account.', icon:'key' },
  { title:'ID Role Upgrade', requestType:'ID upgrade', description:'Request a change to an existing ID or its access.', icon:'arrowUp' },
  { title:'Branch / Department change', description:'Initiate an employee branch or department change and access review.', icon:'branch' },
  { title:'Email creation', description:'Request an individual or shared email account.', icon:'mail' },
  { title:'Mailing group inclusion/exclusion', requestType:'Mailing group change', description:'Add or remove members from a mailing group.', icon:'users' },
  { title:'Auto-forward change', description:'Request an email auto-forwarding update.', icon:'forward' },
  { title:'I Drive / S Drive Access', requestType:'IDrive access', description:'Request access to I Drive or S Drive.', icon:'hardDrive' },
  { title:'N Drive Access', requestType:'N Drive access', description:'Request access to N Drive.', icon:'database' },
  { title:'External device email access', description:'Request email access from an external device.', icon:'device' },
];

export default function RequestTypeCards({ pendingChangeCount=0, onContinue, department, role, compact = false, query = '', category = 'All requests' }) {
  const [showNewIdChoices,setShowNewIdChoices]=useState(false);
  const [showDriveChoices,setShowDriveChoices]=useState(false);
  const categoryFor = title => ['Email creation','Mailing group inclusion/exclusion','Auto-forward change'].includes(title) ? 'Email & collaboration' : ['I Drive / S Drive Access','N Drive Access','External device email access'].includes(title) ? 'Files & devices' : 'Identity & access';
  const availableTypes = requestTypes.filter(({ title, description }) => (title !== 'Employee ID deactivation' || canRequestIdDeletion(department)) && (category === 'All requests' || categoryFor(title) === category) && (title + ' ' + requestTypeLabel(title) + ' ' + description).toLowerCase().replace(/\s+/g,'').includes(query.trim().toLowerCase().replace(/\s+/g,'')));
  const choose = type => {setShowNewIdChoices(false);onContinue(type);};
  return <div className={`system-access-cards${compact ? ' overview-request-grid' : ''}`}>
    {!availableTypes.length && <div className="rc-empty" role="status"><Icon name="search" size={28}/><strong>No matching requests</strong><p>Try another search or choose a different category.</p></div>}
    {availableTypes.map(({ title, requestType, description, icon }, index) => (
      <button className={`system-access-card${compact ? ' overview-request-card' : ''}${title==='Branch / Department change'&&pendingChangeCount?' has-pending-action':''}`} key={title} onClick={() => title==='New ID creation'?setShowNewIdChoices(true):requestType==='IDrive access'?setShowDriveChoices(true):onContinue(requestType||title)}>
        <span className={`system-access-card-mark sm-${index % 5}`} aria-hidden="true"><Icon name={icon} size={compact?16:20}/></span>
        <span className="system-access-card-copy"><strong>{requestTypeLabel(title)}</strong><small>{title==='Branch / Department change'?(canRequestBranchTransfer(role)?'Initiate or review branch and department changes.':'View your initiated changes and approval workflow.'):description}</small></span>
        {title==='Branch / Department change'&&pendingChangeCount>0&&<span className="request-pending-badge" title={`${pendingChangeCount} changes awaiting your action`} aria-label={`${pendingChangeCount} changes awaiting your action`}>{pendingChangeCount}</span>}
        <span className="system-access-card-arrow" aria-hidden="true"><Icon name="arrow" size={18}/></span>
      </button>
    ))}
    {showDriveChoices&&<DriveChoicePopup onClose={()=>setShowDriveChoices(false)} onSelect={drive=>{setShowDriveChoices(false);onContinue('IDrive access',drive);}}/>}
    {showNewIdChoices&&<div className="request-type-chooser-scrim" onMouseDown={event=>event.target===event.currentTarget&&setShowNewIdChoices(false)}><section className="request-type-chooser" role="dialog" aria-modal="true" aria-labelledby="new-id-chooser-title"><button type="button" className="icon-button request-type-chooser-close" aria-label="Close" onClick={()=>setShowNewIdChoices(false)}><Icon name="close"/></button><p className="eyebrow">NEW ID CREATION</p><h2 id="new-id-chooser-title">Who is this request for?</h2><p className="request-type-chooser-intro">Choose the right form to continue.</p><div className="request-type-chooser-options"><button type="button" onClick={()=>choose('System ID creation (self-request)')}><span className="request-type-choice-icon choice-self"><Icon name="idCard" size={21}/></span><span><strong>New ID for me</strong><small>Request your own non-AD system IDs and access.</small></span><Icon name="chevron" size={18}/></button><button type="button" onClick={()=>choose('New ID creation (on behalf)')}><span className="request-type-choice-icon choice-other"><Icon name="userPlus" size={21}/></span><span><strong>New ID for others (on behalf)</strong><small>Request an AD ID and email for another employee.</small></span><Icon name="chevron" size={18}/></button></div></section></div>}
  </div>;
}

