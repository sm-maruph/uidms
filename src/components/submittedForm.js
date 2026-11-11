// Store a detached copy so later directory/profile changes cannot alter a submitted form.
export function captureSubmittedForm(data, context = {}) {
  return JSON.parse(JSON.stringify({version:1,data,context}));
}

export function restoreSubmittedForm(ticket) {
  const saved=ticket?.submittedForm;
  if (saved?.version!==1 || !saved.data) return ticket;
  return {...ticket,...saved.data,action:saved.data.type||ticket.action,submittedForm:saved};
}
