import React from 'react';

export default function AutoForwardFields({ profile, value, onChange }) {
  const update = event => onChange({...value,forwardTo:event.target.value});
  const fields = [
    ['Full name',profile?.name],
    ['Designation',profile?.designation],
    ['Employee ID',profile?.employeeId],
    ['Department',profile?.department],
    ['Branch',profile?.branch],
    ['Current email address',profile?.email],
  ];
  return <div className="auto-forward-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Requester Information</h3><p>These details are filled from your profile.</p></div><div className="auto-forward-profile-grid">{fields.map(([label,item])=><label key={label}>{label}<input value={item||''} readOnly/></label>)}</div></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Forwarding Details</h3><p>Enter the mailbox name. Forwarding is limited to a Commercial Bank email address.</p></div><label className="auto-forward-destination">Forward emails to<span className="auto-forward-address"><input type="text" value={value.forwardTo||''} onChange={update} placeholder="name.surname" pattern="[A-Za-z0-9._%+-]+" title="Enter the mailbox name before @combankbd.com" required/><strong>@combankbd.com</strong></span></label></section>
  </div>;
}
