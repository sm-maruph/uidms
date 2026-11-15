import React from 'react';
import '../employee-details.css';

export default function EmployeeDetails({profile={},showDesignation=true}) {
 const fields=[['Employee',profile.name||profile.fullName,'name'],['Employee ID',profile.employeeId,'employee-id'],['System ID / user ID',profile.systemId||profile.userId||profile.employeeId,'system-id'],['Department',profile.department,'department'],['Branch',profile.branch,'branch'],...(profile.email?[['Email',profile.email,'email']]:[]),...(showDesignation?[['Designation',profile.designation,'designation']]:[])];
 return <dl className={`employee-details${showDesignation?' employee-details-with-designation':''}`} aria-label="Employee details">{fields.map(([label,value,kind])=><div className={`employee-details-card${kind?` employee-details-${kind}`:''}`} key={label}><dt>{label}</dt><dd>{value||'Not recorded'}</dd></div>)}</dl>;
}
