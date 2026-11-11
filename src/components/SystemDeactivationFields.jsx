import React from 'react';
import Icon from './Icon.jsx';
import { assignedDeactivationSystems } from './deactivationRequests.js';

export default function SystemDeactivationFields({ value, onChange, profile, users=[] }) {
  const employees=users.length?users:[profile].filter(Boolean);
  const selected=employees.find(user=>user.employeeId===(value.employeeId||profile?.employeeId));
  const systems=assignedDeactivationSystems(selected);
  const checked=value.systems||[];
  const selectEmployee=employee=>onChange({employeeId:employee.employeeId,name:employee.name,userId:employee.systemId||employee.employeeId,department:employee.department,branch:employee.branch,systems:[],scope:'selected systems'});
  const toggle=system=>onChange({...value,name:selected.name,employeeId:selected.employeeId,userId:selected.systemId||selected.employeeId,department:selected.department,branch:selected.branch,scope:'selected systems',systems:checked.includes(system)?checked.filter(item=>item!==system):[...checked,system]});
  return <div className="reset-access-fields system-deactivation-fields">
    <div className="request-flow-note"><Icon name="key" size={18}/><span>Deactivate selected system IDs only. The employee identity and all unselected systems remain active.</span></div>
    <label className="field-label">Employee<select required value={selected?.employeeId||''} onChange={event=>{const employee=employees.find(user=>user.employeeId===event.target.value);if(employee)selectEmployee(employee);}}>{!selected&&<option value="">Select an employee</option>}{employees.map(user=><option key={user.employeeId} value={user.employeeId}>{user.employeeId} · {user.name}</option>)}</select></label>
    {selected&&<div className="transfer-summary-grid">{[['Employee ID',selected.employeeId],['Department',selected.department],['Branch',selected.branch]].map(([label,detail])=><div key={label}><small>{label}</small><strong>{detail}</strong></div>)}</div>}
    <h3>Select systems to deactivate <small>({checked.length} selected)</small></h3>
    <div className="other-access-checks">{systems.map(system=><label key={system}><input type="checkbox" checked={checked.includes(system)} onChange={()=>toggle(system)}/>{system}</label>)}</div>
    {!systems.length&&<p className="form-error" role="status">No system IDs are available.</p>}
    <p className="request-flow-note">{profile?.role==='Branch manager'?'Branch manager → IT → CITO → COO':'User → Branch manager → IT → CITO → COO'}</p>
  </div>;
}
