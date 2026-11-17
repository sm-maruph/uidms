export function submittedByMe(ticket, profile) {
  if (!profile?.employeeId) return false;
  const submitterId = ticket.requesterId || ticket.transferChange?.initiatorId || ticket.requesterProfile?.employeeId;
  return submitterId === profile.employeeId;
}
