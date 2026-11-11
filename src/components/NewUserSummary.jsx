import React from 'react';
import { Button } from './UI.jsx';

export default function NewUserSummary({ people = [] }) {
  return <section className="transfer-summary"><div className="transfer-summary-heading"><div><p className="eyebrow">NEW JOINER PROVISIONING</p><h3>AD ID & Email Request</h3></div></div>{people.map((person,index)=><div className="new-user-summary-card" key={`${person.employeeId}-${index}`}><strong>New user {index+1}: {person.name}</strong><div className="transfer-summary-grid">{[['Designation',person.designation],['Employee ID',person.employeeId],['Department',person.department],['Branch',person.branch],['AD role / group',person.adRole],['Services',[person.adId&&'AD ID',person.email&&'Email'].filter(Boolean).join(', ')],['Preferred email',person.preferredEmail&&`${person.preferredEmail}@combankbd.com`],['Software',[person.msOffice&&'MS Office',person.otherSoftware?.trim()].filter(Boolean).join(', ')]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div></div>)}</section>;
}
