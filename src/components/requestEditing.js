export function canEditRequest(ticket,profile) {
  return Boolean(ticket && profile?.employeeId && ticket.requesterId===profile.employeeId && ticket.state==='Pending' && !(ticket.approvalHistory||[]).some(event=>String(event.status||'').toLowerCase()==='approved'));
}
