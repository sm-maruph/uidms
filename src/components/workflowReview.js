// Display decisions follow the actual server-assigned step; API authorization remains authoritative.
export function canReviewDatabaseTicket(ticket,profile){
 if(!profile?.employeeId||!['Pending','In review'].includes(ticket.state))return false;
 if(ticket.requesterId===profile.employeeId||ticket.requesterUserId===profile.id||ticket.subjectUserId&&ticket.subjectUserId===profile.id)return false;
 if(typeof ticket.reviewableByMe==='boolean')return ticket.reviewableByMe;
 const step=Array.isArray(ticket.workflowSteps)?ticket.workflowSteps.find(step=>step.position===ticket.currentPosition&&step.status==='Waiting'):null;
 if(Array.isArray(ticket.workflowSteps)&&!step)return false;
 const role=step?.role||ticket.assignedRole;
 const branch=step?.branchId||ticket.assignedBranchId;
 const department=step?.departmentId||ticket.assignedDepartmentId;
 const assignee=step?.assignedUserId||ticket.assignedUserId;
 if(assignee)return assignee===profile.id;
 return role===profile.role&&(!branch||branch===profile.branchId)&&(!department||department===profile.departmentId);
}
