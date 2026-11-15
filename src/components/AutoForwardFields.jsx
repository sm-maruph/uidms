import EmployeeDetails from './EmployeeDetails.jsx';
import React from 'react';

export default function AutoForwardFields({ profile, value, onChange }) {
  const update = event => onChange({...value,forwardTo:event.target.value});

  return <div className="auto-forward-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Requester Information</h3><p>These details are filled from your profile.</p></div><EmployeeDetails profile={profile} showDesignation/></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Forwarding Details</h3><p>Enter the mailbox name. Forwarding is limited to a Commercial Bank email address.</p></div><label className="auto-forward-destination">Forward emails to<span className="auto-forward-address"><input type="text" value={value.forwardTo||''} onChange={update} placeholder="name.surname" pattern="[A-Za-z0-9._%+-]+" title="Enter the mailbox name before @combankbd.com" required/><strong>@combankbd.com</strong></span></label></section>
  </div>;
}
