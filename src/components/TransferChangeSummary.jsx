import React from 'react';
import EmployeeDetails from './EmployeeDetails.jsx';
export default function TransferChangeSummary({ticket}){
 const change=ticket.transferChange;
 return <section className="transfer-change-summary"><h3>Employee being transferred</h3><EmployeeDetails profile={change.employee}/><dl className="transfer-summary-grid">{[['Change',change.kind],['From branch',change.fromBranch],['To branch',change.toBranch],['From department',change.fromDepartment],['To department',change.toDepartment],['Initiated by',change.initiatedBy]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'Not recorded'}</strong></div>)}</dl><label className="field-label">Initiation business justification<p>{change.justification}</p></label>{change.employeeJustification&&<label className="field-label">Employee access justification<p>{change.employeeJustification}</p></label>}{Object.entries(change.accessJustifications||{}).map(([system,reason])=><p key={system}><strong>{system}:</strong> {reason}</p>)}</section>;
}
