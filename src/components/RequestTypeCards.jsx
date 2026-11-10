import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { canRequestIdDeletion } from './requestPermissions.js';

const requestTypes = [
  { title:'New ID creation', description:'Create a new ID for yourself or request one on behalf of another employee.', icon:'userPlus' },
  { title:'ID deactivation', requestType:'ID deactivation', description:'Request deactivation of an existing user ID.', icon:'trash' },
  { title:'ID Unlock / Reset', requestType:'ID reset / unlock', description:'Reset a password or unlock an account.', icon:'key' },
  { title:'ID upgrade', description:'Request a change to an existing ID or its access.', icon:'arrowUp' },
  { title:'Branch transfer', description:'Update access when an employee moves branch.', icon:'branch' },
  { title:'Email creation', description:'Request an individual or shared email account.', icon:'mail' },
  { title:'Mailing group inclusion/exclusion', requestType:'Mailing group change', description:'Add or remove members from a mailing group.', icon:'users' },
  { title:'Auto-forward change', description:'Request an email auto-forwarding update.', icon:'forward' },
  { title:'IDrive access', description:'Request access to IDrive.', icon:'hardDrive' },
  { title:'N Drive access', description:'Request access to N Drive.', icon:'database' },
  { title:'External device email access', description:'Request email access from an external device.', icon:'device' },
];

export default function RequestTypeCards({ onContinue, department, compact = false }) {
  const [showNewIdChoices,setShowNewIdChoices]=useState(false);
  const availableTypes = requestTypes.filter(({ title }) => title !== 'ID deactivation' || canRequestIdDeletion(department));
  const choose = type => {setShowNewIdChoices(false);onContinue(type);};
  return <div className={`system-access-cards${compact ? ' overview-request-grid' : ''}`}>
    {availableTypes.map(({ title, requestType, description, icon }, index) => (
      <button className={`system-access-card${compact ? ' overview-request-card' : ''}`} key={title} onClick={() => title==='New ID creation'?setShowNewIdChoices(true):onContinue(requestType||title)}>
        <span className={`system-access-card-mark sm-${index % 5}`} aria-hidden="true"><Icon name={icon} size={compact?16:20}/></span>
        <span className="system-access-card-copy"><strong>{title}</strong><small>{description}</small></span>
        <span className="system-access-card-arrow" aria-hidden="true">›</span>
      </button>
    ))}
    {showNewIdChoices&&<div className="request-type-chooser-scrim" onMouseDown={event=>event.target===event.currentTarget&&setShowNewIdChoices(false)}><section className="request-type-chooser" role="dialog" aria-modal="true" aria-labelledby="new-id-chooser-title"><button type="button" className="icon-button request-type-chooser-close" aria-label="Close" onClick={()=>setShowNewIdChoices(false)}><Icon name="close"/></button><p className="eyebrow">NEW ID CREATION</p><h2 id="new-id-chooser-title">Who is this request for?</h2><p className="request-type-chooser-intro">Choose the right form to continue.</p><div className="request-type-chooser-options"><button type="button" onClick={()=>choose('System ID creation (self-request)')}><span className="request-type-choice-icon choice-self"><Icon name="idCard" size={21}/></span><span><strong>New ID for me</strong><small>Request your own non-AD system IDs and access.</small></span><Icon name="chevron" size={18}/></button><button type="button" onClick={()=>choose('New ID creation (on behalf)')}><span className="request-type-choice-icon choice-other"><Icon name="userPlus" size={21}/></span><span><strong>New ID for others (on behalf)</strong><small>Request an AD ID and email for another employee.</small></span><Icon name="chevron" size={18}/></button></div></section></div>}
  </div>;
}
