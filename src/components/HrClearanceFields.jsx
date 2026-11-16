import React from 'react';
import {policeClearanceOptions,referenceCheckOptions,normalizeHrCheck} from './newUserWorkflow.js';
export default function HrClearanceFields({ticket,value,onChange,readOnly=false}) {
 return <section className="transfer-person-card hr-clearance-fields"><h3>HR clearance verification</h3><p>HR can update these statuses at any stage. Approval requires both references checked and completed police clearance or a special recommendation.</p>{(ticket.newUserDetails?.people||[]).map((person,index)=>{
 const check=normalizeHrCheck(value[index]);
 const update=(key,next)=>onChange((ticket.newUserDetails?.people||[]).map((_,i)=>i===index?{...check,[key]:next,...(key==='police'&&next!=='Special recommendation'?{recommendation:''}:{})}:normalizeHrCheck(value[i])));
 return <fieldset key={index}><legend>{person.name} / {person.employeeId||'New employee'}</legend><div className="transfer-field-grid">{[['police','Police clearance',policeClearanceOptions],['reference','Reference check',referenceCheckOptions]].map(([key,label,options])=><label key={key}>{label}<select disabled={readOnly} value={check[key]||''} onChange={event=>update(key,event.target.value)}><option value="">Select result</option>{check[key]&&!options.includes(check[key])&&<option value={check[key]}>{check[key]} (previous status)</option>}{options.map(result=><option key={result}>{result}</option>)}</select></label>)}</div>{check.police==='Special recommendation'&&<label className="field-label">Recommendation<textarea required readOnly={readOnly} value={check.recommendation||''} onChange={event=>update('recommendation',event.target.value)} placeholder="Enter the recommendation for proceeding with police clearance"/></label>}</fieldset>;
 })}</section>;
}
