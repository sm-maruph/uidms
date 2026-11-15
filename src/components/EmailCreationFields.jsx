import EmployeeDetails from './EmployeeDetails.jsx';
import React from 'react';

export default function EmailCreationFields({profile,value,onChange,existingEmail=''}) {

  return <div className="auto-forward-fields email-creation-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>User details</h3><p>These details are filled from the signed-in user profile.</p></div><EmployeeDetails profile={profile} showDesignation/></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Email address</h3><p>{existingEmail?'You already have an email address. Email creation is not available for your account.':'Enter the mailbox name. The bank domain is fixed.'}</p></div><label className="auto-forward-destination">Requested email address<span className={`auto-forward-address${existingEmail?' email-address-unavailable':''}`}>{existingEmail?<input type="email" value={existingEmail} disabled aria-label="Existing email address"/>:<><input type="text" value={value.username||''} onChange={event=>onChange({...value,username:event.target.value})} placeholder="name.surname" pattern="[A-Za-z0-9._%+-]+" title="Enter the mailbox name before @combankbd.com" required/><strong>@combankbd.com</strong></>}</span></label></section>
  </div>;
}
