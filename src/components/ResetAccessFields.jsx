import React from 'react';
import { formResetSystems } from './requestCatalog.js';

export default function ResetAccessFields({value,onChange}) {
  const selected=value.systems||[];
  const toggle=system=>onChange({...value,systems:selected.includes(system)?selected.filter(item=>item!==system):[...selected,system]});
  return <div className="reset-access-fields"><p>Select the systems that need a reset or unlock. No role change is included in this request.</p><div className="transfer-field-grid"><label>User full name<input required value={value.name||''} onChange={e=>onChange({...value,name:e.target.value})}/></label><label>Employee ID<input required value={value.employeeId||''} onChange={e=>onChange({...value,employeeId:e.target.value})}/></label><label>System ID / user ID<input required value={value.userId||''} onChange={e=>onChange({...value,userId:e.target.value})}/></label><label>Department / branch<input value={value.department||''} onChange={e=>onChange({...value,department:e.target.value})}/></label></div><div className="other-access-checks">{formResetSystems.map(system=><label key={system}><input type="checkbox" checked={selected.includes(system)} onChange={()=>toggle(system)}/>{system}</label>)}</div></div>;
}
