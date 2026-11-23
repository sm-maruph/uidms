import {queryRaisedBy} from './queryInbox.js';
import {awaitsApproval} from './pendingApprovals.js';
import {isTicketClosed,isFullyApproved,processingStage} from './requestLifecycle.js';

export const operationsRoles=['IT','HR','CITO','COO','Admin','Super Admin'];
export function operationsMetrics(requests,profile) {
  const active=requests.filter(ticket=>!isTicketClosed(ticket)&&ticket.state!=='Rejected');
  const awaitingRole=role=>requests.filter(ticket=>ticket.assignedRole===role&&['Pending','In review'].includes(ticket.state));
  const raisedByMe=query=>queryRaisedBy(query,profile);
  const queriesToMe=requests.filter(ticket=>Boolean(profile?.employeeId)&&((ticket.queryTargetIds||[]).includes(profile.employeeId)||(ticket.queryHistory||[]).some(query=>(query.targetIds||[]).includes(profile.employeeId))));
  const myQueries=requests.filter(ticket=>(ticket.queryHistory||[]).some(raisedByMe));
  return [
    {key:'active',label:'Active request',rows:active,note:'Requests not completed or rejected',icon:'inbox'},
    {key:'mine',label:'Pending for my approval',rows:requests.filter(ticket=>awaitsApproval(ticket,profile)),note:'Awaiting your review',icon:'check',tone:'amber'},
    {key:'hr',label:'Pending at HR',rows:awaitingRole('HR'),note:'Awaiting HR clearance and review',icon:'users',tone:'green'},
    {key:'it',label:'Pending at IT',rows:awaitingRole('IT'),note:'Awaiting IT review',icon:'settings'},
    {key:'cito',label:'Pending at CITO',rows:awaitingRole('CITO'),note:'Awaiting CITO review',icon:'clock',tone:'violet'},
    {key:'coo',label:'Pending at COO',rows:awaitingRole('COO'),note:'Awaiting COO approval',icon:'clock',tone:'amber'},
    {key:'total',label:'Total requests',rows:requests,note:'All recorded requests',icon:'grid'},
    {key:'approved',label:'Approved',rows:requests.filter(isFullyApproved),note:'All required approvals completed',icon:'check',tone:'green'},
    {key:'it-processing',label:'IT processing',rows:requests.filter(ticket=>processingStage(ticket)==='IT processing'),note:'Fully approved; processing email not yet sent',icon:'settings'},
    {key:'ho-processing',label:'HO processing',rows:requests.filter(ticket=>processingStage(ticket)==='HO processing'),note:'Processing email sent; ticket still open',icon:'mail',tone:'violet'},
    {key:'closed',label:'Completed',rows:requests.filter(isTicketClosed),note:'Fulfilled and ticket closed',icon:'check',tone:'green'},
    {key:'rejected',label:'Rejected',rows:requests.filter(ticket=>ticket.state==='Rejected'),note:'Requests rejected during review',icon:'close',tone:'amber'},
    {key:'queries',label:'Query',rows:queriesToMe,note:'Tickets with queries addressed to you',icon:'mail',tone:'violet'},
    {key:'my-queries',label:'Response',rows:myQueries,note:'Tickets with queries you raised',icon:'mail',tone:'green'},
  ].filter(metric=>metric.key!==profile?.role?.toLowerCase()).map(metric=>({...metric,value:metric.value??metric.rows.length}));
}
