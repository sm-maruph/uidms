import React from 'react';

export default function EmailCreationFields({profile,value,onChange}) {
  const fields=[['Full name',profile?.name],['Designation',profile?.designation],['Employee ID',profile?.employeeId],['Department',profile?.department],['Branch',profile?.branch]];
  return <div className="auto-forward-fields email-creation-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>User details</h3><p>These details are filled from the signed-in user profile.</p></div><div className="auto-forward-profile-grid">{fields.map(([label,detail])=><label key={label}>{label}<input value={detail||''} readOnly/></label>)}</div></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Email address</h3><p>Enter the mailbox name. The bank domain is fixed.</p></div><label className="auto-forward-destination">Requested email address<span className="auto-forward-address"><input type="text" value={value.username||''} onChange={event=>onChange({...value,username:event.target.value})} placeholder="name.surname" pattern="[A-Za-z0-9._%+-]+" title="Enter the mailbox name before @combankbd.com" required/><strong>@combankbd.com</strong></span></label></section>
  </div>;
}
