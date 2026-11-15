import EmployeeDetails from './EmployeeDetails.jsx';
﻿import React from 'react';
import Icon from './Icon.jsx';
import { systemDeactivationSystems } from './deactivationRequests.js';

export default function SystemDeactivationFields({ value, onChange, profile, users=[] }) {
  const selected=value.employeeId?{employeeId:value.employeeId,name:value.name,designation:value.designation,userId:value.userId,systemId:value.userId,department:value.department,branch:value.branch,email:value.email}:profile;
  const systems=systemDeactivationSystems;
  const checked=value.systems||[];
  const toggle=system=>onChange({...value,name:selected.name,employeeId:selected.employeeId,userId:selected.systemId||selected.employeeId,department:selected.department,branch:selected.branch,designation:selected.designation,email:selected.email,scope:'selected systems',systems:checked.includes(system)?checked.filter(item=>item!==system):[...checked,system]});
  return <div className="reset-access-fields system-deactivation-fields">
    <div className="request-flow-note"><Icon name="key" size={18}/><span>Deactivate selected system IDs only. The employee identity and all unselected systems remain active.</span></div>

    {selected&&<EmployeeDetails profile={selected}/>}
    <h3>Select systems to deactivate <small>({checked.length} selected)</small></h3>
    <div className="other-access-checks">{systems.map(system=><label key={system}><input type="checkbox" checked={checked.includes(system)} onChange={()=>toggle(system)}/>{system}</label>)}</div>
    {!systems.length&&<p className="form-error" role="status">No system IDs are available.</p>}
    <p className="request-flow-note">{profile?.role==='Branch manager'?'Branch manager → IT → CITO → COO':'User → Branch manager → IT → CITO → COO'}</p>
  </div>;
}
