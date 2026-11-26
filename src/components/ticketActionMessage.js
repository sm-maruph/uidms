export function ticketActionMessage(action,decisionLabel){
 if(action==='Approved')return decisionLabel==='Recommended'?'Your recommendation has been sent.':'The request has been approved.';
 return {
  Query:'Your query has been sent. You can track the reply under Response.',
  Responded:'Your reply has been sent.',
  Rejected:'The request has been rejected.',
  'Clearance updated':'The HR clearance has been updated.',
  'Transfer access reviewed':'Your access review has been saved.',
  'Refresh drafts':'The unsent email drafts have been refreshed.',
  'Email sent':'The email has been marked as sent.',
  Fulfilled:'The request has been completed.'
 }[action]||'Your changes have been saved.';
}
