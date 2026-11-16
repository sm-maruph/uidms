export const isTicketClosed = ticket => ['Completed','Closed'].includes(ticket.state);

// Approved is set by the final required approver, rather than an individual approval.
export const isFullyApproved = ticket => ['Approved','In progress','Completed','Closed','IT processing','HO processing'].includes(ticket.state);

export function processingStage(ticket) {
  if(isTicketClosed(ticket)||!isFullyApproved(ticket))return null;
  return ticket.fulfilment?.emailSentAt||ticket.state==='HO processing'?'HO processing':'IT processing';
}

export const requestStatusLabel = ticket => isTicketClosed(ticket)?'Closed':processingStage(ticket)||ticket.state;
export const requestStageLabel = ticket => processingStage(ticket)|| (isTicketClosed(ticket)?'Ticket closed':ticket.step);
