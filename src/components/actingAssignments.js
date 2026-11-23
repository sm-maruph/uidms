export function actingState(row,now=Date.now()){
 if(row.RevokedAt)return 'Ended';
 if(row.Valid===false)return 'Unavailable';
 if(new Date(row.EndsAt).getTime()<=now)return 'Expired';
 if(new Date(row.StartsAt).getTime()>now)return 'Scheduled';
 return 'Active';
}
export function dhakaInputDate(value=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(value).map(part=>[part.type,part.value]));
 return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function actingPayload(option,employeeId,start,end){
 if(!option||!employeeId.trim())throw new Error('Select a responsibility and find the replacement by system ID.');
 const startsAt=new Date(start+':00+06:00'),endsAt=new Date(end+':00+06:00');
 if(!Number.isFinite(+startsAt)||!Number.isFinite(+endsAt)||endsAt<=startsAt)throw new Error('Select an end date and time after the start.');
 return {principalId:option.PrincipalId,employeeId:employeeId.trim(),role:option.Role,scopeId:option.ScopeId||null,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString()};
}
