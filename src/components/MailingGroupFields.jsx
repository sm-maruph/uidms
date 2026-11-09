import React from 'react';

export default function MailingGroupFields({ profile, value, onChange }) {
  const update = event => onChange({...value,groupAddress:event.target.value});
  const fields = [['Full name',profile?.name],['Designation',profile?.designation],['Employee ID',profile?.employeeId],['Department',profile?.department],['Branch',profile?.branch],['User email address',profile?.email]];
  return <div className="mailing-group-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Requester Information</h3><p>These details are filled from your profile.</p></div><div className="auto-forward-profile-grid">{fields.map(([label,item])=><label key={label}>{label}<input value={item||''} readOnly/></label>)}</div></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Mailing Group Request</h3><p>Select the change you need and identify the mailing group.</p></div><fieldset className="mailing-group-action"><legend>Request action</legend><label><input type="radio" name="mailing-group-action" value="Inclusion" checked={value.action==='Inclusion'} onChange={()=>onChange({...value,action:'Inclusion'})} required/> Add me to the mailing group</label><label><input type="radio" name="mailing-group-action" value="Exclusion" checked={value.action==='Exclusion'} onChange={()=>onChange({...value,action:'Exclusion'})}/> Remove me from the mailing group</label></fieldset><label className="auto-forward-destination">Mailing group email<span className="auto-forward-address"><input type="text" value={value.groupAddress||''} onChange={update} placeholder="group.name" pattern="[A-Za-z0-9._%+-]+" title="Enter the mailbox name before @combankbd.com" required/><strong>@combankbd.com</strong></span></label></section>
  </div>;
}
