import React from 'react';
import Icon from './Icon.jsx';

export default function DeactivationFields({value,onChange,profile}) {
 return <div className="reset-access-fields">
   <div className="request-flow-note"><Icon name="trash" size={18}/><span>Employee ID deactivation covers the employee identity and all associated system access. No individual system selection is required.</span></div>
   <div className="transfer-field-grid"><label>Employee full name<input required value={value.name??profile?.name??''} onChange={event=>onChange({...value,name:event.target.value})}/></label><label>Employee ID<input required value={value.employeeId??profile?.employeeId??''} onChange={event=>onChange({...value,employeeId:event.target.value})}/></label><label>System ID / user ID<input required value={value.userId??profile?.systemId??profile?.employeeId??''} onChange={event=>onChange({...value,userId:event.target.value})}/></label><label>Department<input value={value.department??profile?.department??''} onChange={event=>onChange({...value,department:event.target.value})}/></label><label>Branch<input value={value.branch??profile?.branch??''} onChange={event=>onChange({...value,branch:event.target.value})}/></label></div>
   <p className="request-flow-note"><strong>Deactivation scope: All systems and employee identity.</strong></p>
 </div>;
}
