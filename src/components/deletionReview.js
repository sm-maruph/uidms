export const deletingUsers=(plan,choice)=>plan.kind==='user'||plan.kind!=='request'&&choice.employees==='delete';
export function deletionSelection(plan,choice){
 const users=deletingUsers(plan,choice);
 const removed=plan.requests.filter(row=>plan.kind==='request'||choice.requests==='delete'&&(plan.kind!=='user'||row.CreatedByUser)||choice.deleteOtherRequests&&users&&row.UserDependency);
 const ids=new Set(removed.map(row=>row.Id));
 return {removed,kept:plan.requests.filter(row=>!ids.has(row.Id)),blockers:plan.requests.filter(row=>!ids.has(row.Id)&&(row.ScopeDependency||users&&row.UserDependency)),removedUsers:users?plan.users:[]};
}
