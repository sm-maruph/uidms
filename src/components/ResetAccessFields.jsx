import EmployeeDetails from './EmployeeDetails.jsx';
import React from 'react';
import { formResetSystems } from './requestCatalog.js';

export default function ResetAccessFields({value,onChange}) {
  const selected=value.systems||[];
  const toggle=system=>onChange({...value,systems:selected.includes(system)?selected.filter(item=>item!==system):[...selected,system]});
  return <div className="reset-access-fields"><p>Select the systems that need a reset or unlock. No role change is included in this request.</p><EmployeeDetails profile={value}/><div className="other-access-checks">{formResetSystems.map(system=><label key={system}><input type="checkbox" checked={selected.includes(system)} onChange={()=>toggle(system)}/>{system}</label>)}</div></div>;
}
