export const auditTime=value=>value&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',dateStyle:'medium',timeStyle:'medium'}).format(new Date(value)):'Not recorded';
const labels={
 'auth.login':'Signed in','auth.logout':'Signed out','auth.ad_verified':'AD identity verified','auth.session_ended':'Session ended','auth.login_failed':'Sign-in failed','auth.ad_login_failed':'AD sign-in failed','auth.ad_unavailable':'Directory unavailable',
 'page.viewed':'Page viewed','action.failed':'Action failed','request.created':'Request submitted','request.replaced':'Request updated','request.edited':'Request updated','request.approve':'Recommendation approved','request.reject':'Request rejected','request.cancelled':'Request cancelled','request.deleted':'Request removed','request.workflow_updated':'Request workflow updated',
 'workflow.updated':'Workflow saved','organization.approver_assigned':'Approver assigned','role.acting_assigned':'Acting appointment created','role.acting_ended':'Acting appointment ended','query.raised':'Query raised','query.replied':'Query answered','profile.updated':'Profile updated','profile.access_updated':'System access updated','audit.session_viewed':'Audit session viewed',
};
export const auditLabel=event=>labels[event]||String(event||'Activity').replace(/[._]/g,' ').replace(/^./,letter=>letter.toUpperCase());
export const endReasonLabel=reason=>({logout:'Signed out',replaced:'Replaced by another sign-in',expired:'Session expired',idle_timeout:'Inactivity timeout',revoked:'Access revoked',role_changed:'Role changed',account_updated:'Account updated',account_disabled:'Account disabled',password_changed:'Password changed',provider_disabled:'Sign-in method disabled',next_login:'Next sign-in recorded',not_recorded:'End not recorded'})[reason]||'Session ended';
export function auditTone(event){return /failed|unavailable|reject|delete|deactivat/.test(event)?'danger':/login$|approve|completed|saved/.test(event)?'success':event==='auth.session_ended'||event==='auth.logout'?'muted':'blue';}
export function sessionDuration(session,now=Date.now()){
 if(!session?.StartedAt||!session.EndedAt&&session.status!=='Active')return 'Not recorded';
 const start=Date.parse(session.StartedAt),end=session.EndedAt?Date.parse(session.EndedAt):now;
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 'Not recorded';
 const seconds=Math.floor((end-start)/1000),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);
 return hours?`${hours}h ${minutes}m`:minutes?`${minutes}m ${seconds%60}s`:`${seconds}s`;
}
export const eventDescription=row=>row.Event==='page.viewed'?row.Metadata?.page:row.Event==='action.failed'?`${row.Metadata?.method||''} ${row.Metadata?.route||''} · ${row.Metadata?.code||'Action could not be completed'}`:row.Event==='auth.session_ended'?endReasonLabel(row.Metadata?.reason):row.RecordName||row.EntityId||'Authentication';
export const appendAuditEvents=(previous,incoming)=>[...new Map([...previous,...incoming].map(row=>[String(row.Id),row])).values()];
