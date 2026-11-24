import {setOrganizationRouting} from './components/organizationRouting.js';
import {timeGreeting} from './components/greeting.js';
import LoginVerification from './components/LoginVerification.jsx';
import ProfileOnboarding from './components/ProfileOnboarding.jsx';
import {startPortalLogin,verifyPortalMfa,restorePortalSession} from './components/authFlow.js';
import {ticketApprovalFlow} from './components/ticketWorkflow.js';
import ActingAssignments from './components/ActingAssignments.jsx';
import ApproverAssignments from './components/ApproverAssignments.jsx';
import {canManageApprovers,hasPortalRole,canUseActingAppointments} from './components/portalRoles.js';
import {canReviewDatabaseTicket} from './components/workflowReview.js';
import {workspaceRequests} from './components/workspaceRequests.js';
import {submittedByMe} from './components/myRequests.js';
import RequestPagePagination from './components/RequestPagePagination.jsx';
import PersonalQueryThreads from './components/PersonalQueryThreads.jsx';
import {respondToQuery} from './components/queryInbox.js';
import { requestStatusLabel, requestStageLabel } from './components/requestLifecycle.js';
import { operationsRoles, operationsMetrics } from './components/operationsMetrics.js';
import { awaitsApproval } from './components/pendingApprovals.js';
import { clientIp, ticketAuditEvents } from './components/auditLog.js';
import { portalRoles, canManageUsers, savePortalUser } from './components/portalRoles.js';
import BranchTransferFields from './components/BranchTransferFields.jsx';
import TransferChangeModal from './components/TransferChangeModal.jsx';
import TransferChangeSummary from './components/TransferChangeSummary.jsx';
import { CHANGE_REQUEST,awaitsChangeAction,isChangeRequest,canReviewChange,canViewChange,destinationRole,validateChangeInitiation,validateEmployeeChange,selectedChangeAccess,changeAccessProfile } from './components/transferChangeWorkflow.js';
import { captureSubmittedForm } from './components/submittedForm.js';
import { canRequestBranchTransfer } from './components/requestPermissions.js';
import { isNewUser, newUserManagerRole, canReviewNewUser, normalizeHrCheck, updateHrClearance, validateHrClearance, validateNewUserRouting, canReceiveCredentials } from './components/newUserWorkflow.js';
import HrClearanceFields from './components/HrClearanceFields.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './components/Icon.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyAccess from './components/MyAccess.jsx';
import RequestFulfilment from './components/RequestFulfilment.jsx';
import SqlCredentialDelivery from './components/SqlCredentialDelivery.jsx';
import DatabaseAdministration,{DatabaseAudit,DatabaseWorkflows} from './components/DatabaseAdministration.jsx';
import {useSqlRefresh} from './components/useSqlRefresh.js';
import SystemEmailWorkspace,{api} from './components/SystemEmailWorkspace.jsx';
import {organizationId,requestFromDatabase,requestListItem,requestPayload,requestSubmittedDate,systemItems} from './components/databaseRequests.js';
import { readyForFulfilment, validateCredentials, mockProcessingDrafts } from './components/fulfilment.js';
import DeleteRequestDialog from './components/DeleteRequestDialog.jsx';
import ReviewActionDialog from './components/ReviewActionDialog.jsx';
import { queryRecipientsFor, validateReviewQuery, approvalDecisionLabel, approvalHistoryLabel } from './components/reviewActions.js';
import { allocateRequestId } from './components/requestIds.js';
import { requestTitle, requestTypeLabel } from './components/requestTitle.js';
import { canEditRequest } from './components/requestEditing.js';
import RequestModal from './components/RequestModal.jsx';
import NewRequestModal from './components/NewRequestModal.jsx';
import { mockSignature } from './components/signature.js';
import {approvalRoles} from './components/mockUsers.js';
import Login from './components/Login.jsx';
import SystemAccessPage from './components/SystemAccessPage.jsx';
import RequestTypeCards from './components/RequestTypeCards.jsx';
import QueryInbox from './components/QueryInbox.jsx';
import FloatingQueryChat from './components/FloatingQueryChat.jsx';
import TicketQueryBubble from './components/TicketQueryBubble.jsx';
import OverviewRequestQueue from './components/OverviewRequestQueue.jsx';
import ApprovalsPage from './components/ApprovalsPage.jsx';
import ApprovalWorkflow from './components/ApprovalWorkflow.jsx';
import { isDeactivation, deactivationFlow } from './components/deactivationRequests.js';
import TransferSummary from './components/TransferSummary.jsx';
import NewUserSummary from './components/NewUserSummary.jsx';
import BatchAccessSummary from './components/BatchAccessSummary.jsx';
import ResetSummary from './components/ResetSummary.jsx';
import { Avatar, Button, SectionTitle, Status } from './components/UI.jsx';
import './mock.css';
import './typography.css';
import './transfer.css';
import './transfer-extra.css';
import './batch.css';
import './form-structure.css';
import './my-access.css';
import './profile-prefill.css';
import './signature.css';
import './auto-forward.css';
import './system-access.css';
import './readability.css';
import './system-fonts.css';
import './viewport.css';
import './overview-design.css';
import './slim-topbar.css';
import './admin-users.css';
import './approval-sequence.css';
import './operations-dashboard.css';
import './upgrade-access.css';

const roles = portalRoles;
const canManageTemplates=(role,profile)=>hasPortalRole(profile||{role},'IT')||canManageUsers(role);
const pagePaths={'Overview':'/','My requests':'/requests','My access':'/my-access','Create a request':'/create-request','Approvals':'/approvals','Reports':'/reports','User directory':'/users','Audit trail':'/audit-trail','Acting appointments':'/acting-appointments','Approver assignments':'/admin/approvers','Workflow studio':'/admin/workflows','Admin settings':'/admin/settings','System Email Templates':'/admin/system-email-templates','Joiners & transfers':'/joiners','Branch / Department change':'/request-types/branch-department-change'};
const routeFromPath=pathname=>{const path=pathname.replace(/\/+$/,'')||'/';if(path==='/changes')return {page:'My requests',requestId:null};const requestMatch=path.match(/^\/requests\/(.+)$/);if(requestMatch)return {page:'My requests',requestId:decodeURIComponent(requestMatch[1])};const page=Object.entries(pagePaths).find(([,route])=>route===path)?.[0]||'Overview';return {page,requestId:null};};
const navFor = (role,profile) => {
  const base = ['Overview','My requests','Create a request'];
  base.splice(2, 0, 'My access');
  if (approvalRoles.includes(role)||profile?.canApproveRequests) base.push('Approvals');
  if (['IT','CITO','Admin','Platform Admin','Super Admin'].includes(role)) base.push('Reports');
  if (['IT','CITO','Admin','Platform Admin','Super Admin'].includes(role)) base.push('User directory');
  if(canManageApprovers(role)||hasPortalRole(profile,'IT'))base.push('Approver assignments');
  if(canUseActingAppointments(profile))base.push('Acting appointments');
  if(canManageUsers(role))base.push('Audit trail');
  if (canManageTemplates(role,profile)) base.push('System Email Templates');
  if (canManageUsers(role)) base.push('Workflow studio','Admin settings');
  if (role === 'HR') base.push('Joiners & transfers');
  return base;
};

function Metric({label,value,note,icon,tone='blue',onClick,selected}) { const content=<><div className="metric-top"><span>{label}</span><i className={`metric-icon mi-${tone}`}><Icon name={icon} size={18}/></i></div><div className="metric-value">{value}</div><small>{note}</small></>;return onClick?<button type="button" className="metric-card metric-card-action" onClick={onClick} aria-pressed={selected} aria-label={`${label}: ${value}. ${note}`}>{content}</button>:<article className="metric-card">{content}</article>; }
function Field({label,children}) { return <label className="field-label">{label}{children}</label>; }
function OperationsFinder({users,requests,onViewAccess,onOpenRequest}) {
 const [mode,setMode]=useState('access');const [query,setQuery]=useState('');
 const term=query.trim().toLowerCase();
 const matchedUsers=term?users.filter(user=>`${user.name} ${user.employeeId} ${user.systemId}`.toLowerCase().includes(term)).slice(0,6):[];
 const matchedRequests=term?requests.filter(request=>`${request.id} ${request.name} ${request.requesterId||request.employeeId||''} ${request.system} ${requestTypeLabel(request.action)} ${request.role} ${request.branch}`.toLowerCase().includes(term)).slice(0,6):[];
 const matches=mode==='access'?matchedUsers:matchedRequests;
 return <div className="operations-finder"><div className="operations-finder-controls"><select aria-label="Search category" value={mode} onChange={event=>setMode(event.target.value)}><option value="access">Current access</option><option value="requests">New request</option></select><label><Icon name="search" size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={mode==='access'?'Search user name or ID':'Search ticket, user or system'}/></label></div>{term&&<div className="operations-finder-results">{matches.length?mode==='access'?matchedUsers.map(user=><article key={user.employeeId}><span><strong>{user.name}</strong><small>{user.employeeId} / {user.role} / {user.branch}</small></span><button type="button" onClick={()=>{onViewAccess(user);setQuery('');}}>View</button></article>):matchedRequests.map(request=><button type="button" className="operations-finder-request" key={request.id} onClick={()=>{onOpenRequest(request);setQuery('');}}><span><strong>{request.id} / {requestTypeLabel(request.action)}</strong><small>{request.name} / {request.system} / {request.state}</small></span><Icon name="chevron" size={16}/></button>):<p>No {mode==='access'?'users':'requests'} found.</p>}</div>}</div>;
}

function ProfileDetails({profile,onClose,onTemplates}) {
 const access=profile?.access||{};const assignments=[...Object.entries(access.systemRoles||{}).map(([system,levels])=>`${system} / ${levels?.length?levels.join(', '):'Assigned'}`),...(access.enabledSystems||[]),...(access.otherAccess||[])];
 const uniqueAssignments=[...new Set(assignments)];
 return <section className="profile-details-popover" role="dialog" aria-labelledby="profile-details-title"><header className="modal-header"><div><p className="eyebrow">WELCOME, {profile?.name?.split(' ')[0]||'USER'}</p><h2 id="profile-details-title">Your profile</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close profile details"><Icon name="close"/></button></header><div className="profile-details-grid">{[['Full name',profile?.name],['Employee / System ID',profile?.employeeId||profile?.systemId],['Role',profile?.role],['Designation',profile?.designation],['Department',profile?.department],['Branch',profile?.branch]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div>{canManageTemplates(profile.role)&&<button type="button" className="button button-subtle" onClick={onTemplates}>System Email Templates</button>}<section className="profile-current-access"><h3>Current access ({uniqueAssignments.length})</h3>{uniqueAssignments.length?<ul>{uniqueAssignments.map(item=><li key={item}>{item}</li>)}</ul>:<p>No access assignments are listed.</p>}</section></section>;
}


function DeactivationSummary({details,type}) { return <section className="transfer-summary"><div className="transfer-summary-heading"><h3>{type} details</h3></div><div className="transfer-summary-grid">{[['Employee',details.name],['Employee ID',details.employeeId],['System ID',details.userId],['Department',details.department],['Branch',details.branch]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div>{type==='Employee ID deactivation'&&<p className="request-flow-note">Deactivate the employee identity and all associated system access.</p>}{type==='System ID deactivation'&&<p className="request-flow-note">Only the listed system IDs are requested for deactivation. Other access remains active.</p>}{type!=='Employee ID deactivation'&&<ul>{(details.systems||[]).map(system=><li key={system}>{system}</li>)}</ul>}</section>; }
function UpgradeSummary({details,requester}) {const systems=details.systems||[];return <section className="transfer-summary"><div className="transfer-summary-heading"><h3>System access and role change request</h3></div><div className="upgrade-summary-table"><table><thead><tr><th>System</th><th>Current role</th><th>Requested role</th></tr></thead><tbody>{systems.map(system=>{const current=details.currentAccess?.[system]||[];const hasCurrent=current.length>0||(details.currentEnabledSystems||[]).includes(system)||(details.currentOtherAccess||[]).includes(system);return <tr key={system}><td>{system}</td><td>{current.join(', ')||(hasCurrent?'Access enabled':'No access')}</td><td>{details.roles?.[system]||'Access request'}</td></tr>;})}</tbody></table></div><p>Requested by {requester}.</p></section>;}
const formatDhakaTimestamp = value => value ? new Intl.DateTimeFormat('en-BD',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'}).format(new Date(value)) : 'Timestamp unavailable';
function TicketDetail({ticket,role,profile,users,onBack,onAction,focusReply=false,onEdit,onDelete,delivery,onContinueChange,queryMode,sqlWrite}) {

 const [hrChecks,setHrChecks]=useState(()=>(ticket.hrClearance?.checks||[]).map(normalizeHrCheck));
 useEffect(()=>setHrChecks((ticket.hrClearance?.checks||[]).map(normalizeHrCheck)),[ticket.id,ticket.hrClearance]);


 const [showDetails,setShowDetails]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [reviewDialog,setReviewDialog]=useState(null);
 const scrollToSection=id=>requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
 const canReview=ticket.sqlId?canReviewDatabaseTicket(ticket,profile):approvalRoles.includes(role)&&canReviewNewUser(ticket,profile)&&canReviewChange(ticket,profile)&&['Pending','In review'].includes(ticket.state);
 const flow=ticketApprovalFlow(ticket);
 const decisionLabel=approvalDecisionLabel(ticket);
 const normalizeStage=value=>String(value||'').toLowerCase().replace(/\s+(review|final approval)$/,'').trim();
 const approvalEventFor=step=>(ticket.approvalHistory||[]).find(event=>normalizeStage(event.stage)===normalizeStage(step)||normalizeStage(event.role)===normalizeStage(step));
 const queryRecipients=queryRecipientsFor(users,profile,ticket);
 const currentFlowRole=ticket.assignedRole||(ticket.state==='Query'?ticket.queryReturnRole:null);
 const approvalForStep=step=>{const event=approvalEventFor(step);if(event)return `${event.status} by ${event.by} - ${formatDhakaTimestamp(event.at)}${event.remark?` - ${event.remark}`:''}`;return currentFlowRole&&normalizeStage(currentFlowRole)===normalizeStage(step)?ticket.step:'Upcoming approval step';};
 const sequence=[{title:'Request submitted',actor:ticket.name,role:'Requester',at:ticket.createdAt,message:ticket.justification},...(ticket.approvalHistory||[]).map(item=>({title:approvalHistoryLabel(ticket,item),actor:item.by,role:item.role||item.stage,at:item.at,message:item.remark})),...(ticket.queryHistory||[]).flatMap(item=>[{title:'Query raised',actor:item.by,role:item.role,at:item.at,message:`To ${(item.targetNames||[]).join(', ')}: ${item.message}`},...(item.responses||[]).map(response=>({title:'Query response',actor:response.responseBy,role:users.find(user=>user.employeeId===response.employeeId)?.role||'User',at:response.responseAt,message:response.response}))]),...(ticket.fulfilmentHistory||[]).map(item=>({title:item.status,actor:item.by,role:item.role,at:item.at,message:item.status==='Fulfilled'?'IDs provided; request completed and ticket closed.':'Processing email marked sent.'})),...(ticket.hrClearanceHistory||[]).map(item=>({title:'HR clearance updated',actor:item.by,role:item.role,at:item.at,message:item.checks.map((check,index)=>`${ticket.newUserDetails?.people?.[index]?.name||'Employee'}: Police clearance - ${check.police}; Reference check - ${check.reference}${check.recommendation?`; Recommendation - ${check.recommendation}`:''}`).join(' | ')})),...(ticket.remarks||[]).map(item=>({title:'Remark',actor:item.by,role:item.role,at:item.at,message:item.message}))].filter(item=>item.at).sort((a,b)=>new Date(b.at)-new Date(a.at));
 return <section className="detail-layout">
  <div className="panel detail-main">
   <div className="ticket-detail-toolbar"><button className="back-link" onClick={onBack}>Back to requests</button></div>
   <div className="detail-heading"><div><p className="eyebrow">TICKET - {ticket.id}</p><h1>{ticket.action==='System ID creation (self-request)'?'New ID creation (self request)':ticket.action==='ID upgrade'?'ID Role Upgrade':requestTypeLabel(ticket.action)}</h1><p className="ticket-heading-systems" title={requestTitle(ticket,false).split(' - ').slice(1).join(' - ')}>{requestTitle(ticket,false).split(' - ').slice(1).join(' - ')||ticket.system}</p><p>{ticket.name} - {ticket.branch} - submitted {ticket.date}</p></div><div className="ticket-heading-notifications"><Status>{requestStatusLabel(ticket)}</Status><TicketQueryBubble key={ticket.id} mode={queryMode} autoOpen={focusReply} ticket={ticket} profile={profile} users={users} onReply={message=>onAction('Responded',{message})}/></div></div>

   <div id="ticket-approval-workflow"><ApprovalWorkflow ticket={ticket} flow={flow} users={users}/></div>
   {isChangeRequest(ticket)&&ticket.transferChange.stage==='employee'&&<section className="request-flow-note"><span>A branch or department change was initiated for {ticket.transferChange.employee.name}. {ticket.transferChange.employee.employeeId===profile.employeeId?'Review your current access and continue the request.':'Waiting for the employee to review and continue.'}</span>{ticket.transferChange.employee.employeeId===profile.employeeId&&<Button onClick={()=>onContinueChange(ticket)}>Continue</Button>}</section>}
   <div className="ticket-request-actions"><Button variant={showDetails?'primary':'subtle'} icon="idCard" aria-expanded={showDetails} aria-controls="ticket-form-details" onClick={()=>{setShowDetails(true);scrollToSection('ticket-form-details');}}>Request details</Button>{canReview&&<div className="ticket-review-action-row"><button type="button" className="button review-reject" onClick={()=>setReviewDialog('reject')}><Icon name="close" size={17}/>Reject</button><button type="button" className="button review-query" onClick={()=>setReviewDialog('query')}>Have query?</button><button type="button" className="button review-approve" onClick={()=>setReviewDialog('approve')}><Icon name="check" size={17}/>{decisionLabel}</button></div>}{!isChangeRequest(ticket)&&canEditRequest(ticket,profile)&&<><Button variant="subtle" icon="edit" onClick={()=>onEdit(ticket)}>Edit request</Button><button type="button" className="button ticket-delete-request" onClick={()=>setConfirmDelete(true)}><Icon name="trash" size={17}/>Delete request</button></>}</div>
   <div className="detail-facts"><div><small>SYSTEM</small><strong>{ticket.system}</strong></div><div><small>REQUESTED ROLE</small><strong>{ticket.role}</strong></div><div><small>CURRENT OWNER</small><strong>{requestStageLabel(ticket)}</strong></div></div>
   <div onTransitionEnd={event=>{if(showDetails&&event.target===event.currentTarget&&event.propertyName==='grid-template-rows')scrollToSection('ticket-form-details');}} id="ticket-form-details" className={`ticket-form-reveal ${showDetails?'is-open':''}`} aria-hidden={!showDetails} inert={showDetails?undefined:''}><div className="ticket-form-reveal-inner"><div className="ticket-form-workflow-link"><Button variant="subtle" icon="arrowUp" onClick={()=>{setShowDetails(false);scrollToSection('ticket-approval-workflow');}}>View approval flow</Button></div>{isChangeRequest(ticket)?<><TransferChangeSummary ticket={ticket}/>{ticket.transferDetails&&<BranchTransferFields value={ticket.transferDetails} onChange={()=>{}} mode="self" profile={ticket.transferChange.employee} readOnly expandSections/>}</>:<RequestModal key={`${ticket.id}:${ticket.updatedAt||ticket.createdAt}`} embedded ticket={ticket} profile={users.find(user=>user.employeeId===ticket.requesterId)||{}} users={users}/>}</div></div>
   {ticket.sqlId&&ticket.state==='Completed'&&<SqlCredentialDelivery key={ticket.sqlId} ticket={ticket} write={sqlWrite}/>}
   <RequestFulfilment key={`${ticket.id}:${ticket.fulfilment?.emailSentAt||'draft'}`} ticket={ticket} profile={profile} onAction={onAction} delivery={delivery}/>
   <section className="ticket-interactions">
    {isNewUser(ticket)&&(role==='HR'||ticket.hrClearance)&&<><HrClearanceFields ticket={ticket} value={role==='HR'?hrChecks:ticket.hrClearance?.checks||[]} onChange={setHrChecks} readOnly={role!=='HR'}/>{role==='HR'&&<div className="detail-actions"><Button type="button" onClick={()=>onAction('Clearance updated',{hrChecks})}>Save clearance status</Button></div>}</>}
   </section>
  </div>
  <aside className="panel audit-panel"><h3>Approval sequence and audit trail</h3><p>Approver actions, queries, responses, remarks, and Dhaka timestamps.</p><div className="approval-sequence-scroll" tabIndex={0} role="region" aria-label="Approval sequence entries">{sequence.map((event,index)=><div className="audit-event approval-sequence-event" key={`${event.at}-${index}`}><i/><div><strong>{event.title}</strong><small>{event.actor} - {event.role} - {formatDhakaTimestamp(event.at)}</small>{event.message&&<small>{event.message}</small>}</div></div>)}</div></aside>
  {reviewDialog&&canReview&&<ReviewActionDialog key={`${ticket.id}:${reviewDialog}`} mode={reviewDialog==='approve'&&decisionLabel!=='Approve'?'recommend':reviewDialog} ticket={ticket} recipients={queryRecipients} onClose={()=>setReviewDialog(null)} onSubmit={(state,details)=>onAction(state,{...details,hrChecks})}/>}
  {confirmDelete&&<DeleteRequestDialog ticket={ticket} onCancel={()=>setConfirmDelete(false)} onConfirm={()=>{setConfirmDelete(false);onDelete(ticket);}}/>}
 </section>;
}

function SnapshotFields({value}) {
 if(Array.isArray(value))return value.length?<div className="request-snapshot-list">{value.map((entry,index)=><div className="request-snapshot-item" key={index}>{entry&&typeof entry==='object'?<SnapshotFields value={entry}/>:String(entry)}</div>)}</div>:<span className="snapshot-empty">None provided</span>;
 if(!value||typeof value!=='object')return <strong>{String(value??'—')}</strong>;
 const entries=Object.entries(value).filter(([key,item])=>item!==undefined&&item!==null&&item!==''&&!['signature','profileEmail','requesterName'].includes(key));
 if(!entries.length)return <span className="snapshot-empty">No additional details</span>;
 return <div className="request-snapshot-grid">{entries.map(([key,item])=><div className="request-snapshot-field" key={key}><small>{key.replace(/([A-Z])/g,' $1').replace(/^./,letter=>letter.toUpperCase())}</small>{Array.isArray(item)||typeof item==='object'?<SnapshotFields value={item}/>:<strong>{String(item)}</strong>}</div>)}</div>;
}

function requestedAccessRows(ticket) {
 const rows=[];
 const add=(system,requestedRole,employee='Request subject',requestType=ticket.action)=>{if(system)rows.push({system,requestedRole:requestedRole||'No role specified',employee,requestType});};
 const transfer=ticket.transferDetails||{};
 for(const [key,label] of [['newAccess','New system access'],['newOtherAccess','New other access'],['newTestSystems','New test system access'],['additionalTestSystems','Additional test system access'],['currentAccess','Current system access'],['currentOtherAccess','Current other access'],['currentTestSystems','Current test system access']]){
  const access=transfer[key]||{};const flags=transfer[`${key}Systems`]||{};
  for(const [system,selectedRole] of Object.entries(access))if(flags[system]||selectedRole?.length)add(system,Array.isArray(selectedRole)?selectedRole.join(', '):selectedRole,label);
 }
 for(const person of transfer.people||[])for(const requested of person.requestedSystems||[])add(requested.system,requested.role,person.fullName||person.name||person.employeeId||'Employee','Branch transfer');
 for(const person of ticket.batchDetails?.people||[])for(const requested of person.systems||[])add(requested.system,requested.role,person.name||person.employeeId||'Employee');
 for(const person of ticket.newUserDetails?.people||[]){if(person.adId)add('Active Directory ID',person.adRole||'New account',person.name||person.employeeId||'New employee','New ID creation');if(person.email)add('Email account',person.preferredEmail||'New email',person.name||person.employeeId||'New employee','New ID creation');if(person.msOffice)add('MS Office','Software access',person.name||person.employeeId||'New employee','New ID creation');if(person.otherSoftware)add(person.otherSoftware,'Software access',person.name||person.employeeId||'New employee','New ID creation');}
 for(const [system,level] of Object.entries(ticket.upgradeDetails?.roles||{}))add(system,level,ticket.name,'ID upgrade');
 for(const group of ticket.mailingGroupDetails?.groupAddresses||[])add(group,`Group ${requestTypeLabel(ticket.mailingGroupDetails.action)}`,ticket.name,'Mailing group change');
 if(ticket.emailCreationDetails)add('Email',ticket.emailCreationDetails.email||'Mailbox creation',ticket.emailCreationDetails.name||ticket.name,'Email creation');
 if(ticket.externalDeviceDetails)add('External device email access',`${ticket.externalDeviceDetails.deviceModel} / ${ticket.externalDeviceDetails.deviceNumber} / ${ticket.externalDeviceDetails.serialNumber}`,ticket.externalDeviceDetails.name||ticket.name,'External device email access');
 for(const system of ticket.resetDetails?.systems||[])add(system,'Reset / unlock',ticket.resetDetails.name||ticket.resetDetails.employeeId||'Employee','ID reset / unlock');
 for(const system of ticket.deactivationDetails?.systems||[])add(system,'Deactivate ID',ticket.deactivationDetails.name||ticket.deactivationDetails.employeeId||'Employee',ticket.action);
 if(!rows.length)add(ticket.system,ticket.role,ticket.name,ticket.action);
 return rows;
}

function RequestSummaryModal({ticket,flow,sequence,currentFlowRole,onClose}) {
 const formSections=[['Request details',{requestType:requestTypeLabel(ticket.action),requester:ticket.name,employeeId:ticket.requesterId,branch:ticket.branch,system:ticket.system,requestedRole:ticket.role}],['New ID request',ticket.newUserDetails],['Branch transfer / system access form',ticket.transferDetails],['Batch access request',ticket.batchDetails],['ID Role Upgrade form',ticket.upgradeDetails],['Email creation form',ticket.emailCreationDetails],['External device access form',ticket.externalDeviceDetails],['Unlock / Reset form',ticket.resetDetails],[ticket.action+' form',ticket.deactivationDetails],['Email auto-forward form',ticket.autoForwardDetails],['Mailing group form',ticket.mailingGroupDetails]].filter(([,value])=>value&&(!Array.isArray(value)||value.length));
 const accessRows=requestedAccessRows(ticket);
 return <div className="request-summary-scrim" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><section className="request-summary-modal" role="dialog" aria-modal="true" aria-labelledby="request-summary-title"><header className="request-summary-header"><div><p className="eyebrow">REQUEST REVIEW</p><h2 id="request-summary-title">{requestTypeLabel(ticket.action)} - {ticket.id}</h2><p>{ticket.name} · {ticket.branch} · {formatDhakaTimestamp(ticket.createdAt)}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close request summary">×</button></header><div className="request-summary-content"><section className="request-summary-executive"><h3>Executive summary</h3><div className="request-summary-meta">{[['Status',ticket.state],['Current owner',ticket.step],['Requester',ticket.name],['Employee ID',ticket.requesterId],['Branch',ticket.branch],['System',ticket.system],['Requested role',ticket.role]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div><section className="request-summary-access"><h4>Systems and roles requested</h4><div className="request-summary-access-table"><table><thead><tr><th>System</th><th>Requested role / action</th><th>For</th><th>Request type</th></tr></thead><tbody>{accessRows.map((row,index)=><tr key={`${row.system}-${row.employee}-${index}`}><td>{row.system}</td><td>{row.requestedRole}</td><td>{row.employee}</td><td>{row.requestType}</td></tr>)}</tbody></table></div></section><div className="request-summary-justification"><strong>Business justification</strong><p>{ticket.justification||'No business justification was provided.'}</p></div></section><section className="request-summary-form"><h3>Submitted request form</h3>{formSections.map(([title,value])=><article className="request-snapshot-section" key={title}><h4>{title}</h4><SnapshotFields value={value}/></article>)}</section><section className="request-summary-flow"><h3>Approval flow</h3><div className="request-summary-steps">{flow.map((step,index)=>{const event=(ticket.approvalHistory||[]).find(item=>String(item.stage||item.role||'').toLowerCase().replace(/\s+(review|final approval)$/,'')===step.toLowerCase());const done=step==='Requester'||Boolean(event);const current=currentFlowRole&&String(currentFlowRole).toLowerCase().replace(/\s+(review|final approval)$/,'')===step.toLowerCase();return <div className={`request-summary-step ${done?'done':''} ${current?'current':''}`} key={step}><span>{done?'✓':index+1}</span><div><strong>{step}</strong><small>{event?`${event.status} by ${event.by} · ${formatDhakaTimestamp(event.at)}`:current?ticket.step:'Upcoming'}</small>{event?.remark&&<p>{event.remark}</p>}</div></div>;})}</div><h4>Queries, responses, and remarks</h4>{sequence.map((event,index)=><div className="request-summary-event" key={`${event.at}-${index}`}><strong>{event.title}</strong><small>{event.actor} · {event.role} · {formatDhakaTimestamp(event.at)}</small>{event.message&&<p>{event.message}</p>}</div>)}</section></div></section></div>;
}
export default function App() {
 const [changeModal,setChangeModal]=useState(null);
 const [credentialVault,setCredentialVault]=useState({});
 useEffect(()=>{const timer=setInterval(()=>setCredentialVault(current=>{const entries=Object.entries(current).filter(([,delivery])=>delivery.expiresAt>Date.now());return entries.length===Object.keys(current).length?current:Object.fromEntries(entries);}),30000);return ()=>clearInterval(timer);},[]);
 const [editingTicket,setEditingTicket]=useState(null);
 const [replyTicketId,setReplyTicketId]=useState(null);
 const [designations,setDesignations]=useState([]); const [operationsMetric,setOperationsMetric]=useState(null); const [profile,setProfile]=useState(null); const [users,setUsers]=useState([]); const [mailingGroups,setMailingGroups]=useState([]); const [branches,setBranches]=useState([]); const [departments,setDepartments]=useState([]); const [active,setActive]=useState(()=>routeFromPath(window.location.pathname).page); const [dark,setDark]=useState(()=>{try{return localStorage.getItem('uidmsTheme')!=='light';}catch{return true;}}); const [menu,setMenu]=useState(false); const [modal,setModal]=useState(false); const [requestChooserOpen,setRequestChooserOpen]=useState(false); const [requestType,setRequestType]=useState('ID reset / unlock'); const [requestDrive,setRequestDrive]=useState(null); const [search,setSearch]=useState(''); const [filter,setFilter]=useState('All'); const [sort,setSort]=useState('newest'); const [requests,setRequests]=useState([]); const [selected,setSelected]=useState(null); const [accessProfile,setAccessProfile]=useState(null); const [finderProfile,setFinderProfile]=useState(null); const [profileDetailsOpen,setProfileDetailsOpen]=useState(false); const [notificationsOpen,setNotificationsOpen]=useState(false); const [toast,setToast]=useState('');
 const [greetingTime,setGreetingTime]=useState(()=>new Date());
 useEffect(()=>{const update=()=>setGreetingTime(new Date());const timer=window.setInterval(update,60000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{window.clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
 const [apiSession,setApiSession]=useState(null);
 const [sessionRestore,setSessionRestore]=useState({loading:true,error:''});
 const [restoreAttempt,setRestoreAttempt]=useState(0);
 const restoreRequest=useRef(null);
 const [pendingAuth,setPendingAuth]=useState(null);
 const [pendingEnrollment,setPendingEnrollment]=useState(null);
 const [sqlNotifications,setSqlNotifications]=useState([]);
 const [syncError,setSyncError]=useState('');
 const [switchUsers,setSwitchUsers]=useState([]);
 const [mockLogin,setMockLogin]=useState(false);
 const [loginOptions,setLoginOptions]=useState({localLogin:false,adLogin:true});
 useEffect(()=>{const controller=new AbortController();api('/auth/options',{signal:controller.signal}).then(async options=>{if(controller.signal.aborted)return;setMockLogin(Boolean(options.mockLogin));setLoginOptions({localLogin:options.localLogin!==false,adLogin:Boolean(options.adLogin)});if(options.mockLogin){const result=await api('/auth/mock-directory',{signal:controller.signal});if(!controller.signal.aborted)setSwitchUsers(result.users);}}).catch(()=>{});return()=>controller.abort();},[]);
 const [sqlCatalog,setSqlCatalog]=useState(null);
 const [sqlDetailRevision,setSqlDetailRevision]=useState(0);
 const logout=async()=>{
   try {
     if(apiSession)await api('/auth/logout',{method:'POST',body:{},csrfToken:apiSession.csrfToken}).catch(error=>{if(error.status!==401)throw error;});
     setApiSession(null);setSqlNotifications([]);setSyncError('');
     
     setProfileDetailsOpen(false);setNotificationsOpen(false);setSelected(null);setModal(false);setProfile(null);setUsers([]);setRequests([]);
   } catch(error) {
     notify('Sign-out failed. Please try again.');
   }
 };
 useEffect(()=>{document.documentElement.style.colorScheme=dark?'dark':'light';document.body.style.backgroundColor=dark?'#0b1422':'#f8fafc';try{localStorage.setItem('uidmsTheme',dark?'dark':'light');}catch{}},[dark]);
 useEffect(()=>{if(profile&&active!==CHANGE_REQUEST&&!navFor(profile.role,profile).includes(active)){setActive('Overview');setSelected(null);}},[profile?.role,profile?.canApproveRequests,profile?.canManageActing,active]);
 useEffect(()=>{if(!profile)return;const path=selected?`/requests/${encodeURIComponent(selected.id)}`:(pagePaths[active]||'/');if(window.location.pathname!==path)window.history.pushState({uidms:true},'',path);},[active,selected,profile?.employeeId]);
 useEffect(()=>{const handlePopState=()=>{const route=routeFromPath(window.location.pathname);setActive(route.page);setSelected(route.requestId?requests.find(request=>request.id===route.requestId)||null:null);};window.addEventListener('popstate',handlePopState);return()=>window.removeEventListener('popstate',handlePopState);},[requests]);
 const lastAuditNavigation=useRef('');
 useEffect(()=>{
  if(!apiSession?.user?.id){lastAuditNavigation.current='';return;}
  const key=apiSession.user.id+':'+active+':'+(selected?.sqlId||'');
  if(lastAuditNavigation.current===key)return;lastAuditNavigation.current=key;
  api('/activity',{method:'POST',csrfToken:apiSession.csrfToken,body:{page:selected?.sqlId?'Ticket details':active,...(selected?.sqlId?{ticketId:selected.sqlId}:{})}}).catch(error=>console.warn('UIDMS activity could not be recorded.',error.code||'ACTIVITY_UNAVAILABLE'));
 },[apiSession?.user?.id,active,selected?.sqlId]);
 const workflowReturnPage=useRef('Overview');
 const toastTimer=useRef(null);
 const [toastKey,setToastKey]=useState(0);
 useEffect(()=>{if(active!=='Workflow studio')workflowReturnPage.current=active;},[active]);
 useEffect(()=>()=>window.clearTimeout(toastTimer.current),[]);
 const closeWorkflow=()=>{const previous=workflowReturnPage.current;setSelected(null);setActive(navFor(profile?.role,profile).includes(previous)?previous:'Overview');};
 const notify=message=>{window.clearTimeout(toastTimer.current);setToast(message);setToastKey(key=>key+1);toastTimer.current=window.setTimeout(()=>setToast(''),3200);};
 const role=profile?.role||'User';
 const scopedRequests=useMemo(()=>workspaceRequests(requests,{profile,page:active,search,sort}),[requests,profile,active,search,sort]);
 const isOperationsRole=operationsRoles.includes(role);
 const operationCards=operationsMetrics(requests.filter(ticket=>canViewChange(ticket,profile)),profile);
 const selectedOperation=operationCards.find(card=>card.key===operationsMetric)||operationCards.find(card=>card.key==='mine')||operationCards[0];
 useEffect(()=>setOperationsMetric(null),[profile?.employeeId,profile?.role]);
 useEffect(()=>{
   if(active==='Overview'||active==='My requests'){
     setFilter('All');
     setSearch('');
   }
   if(active==='Overview')setOperationsMetric(null);
 },[active]);
 const personalQueryMode=isOperationsRole?(selectedOperation.key==='my-queries'?'mine':selectedOperation.key==='queries'?'received':null):null;
 const replyToPersonalQuery=(ticket,index,message)=>{replySqlQuery(ticket,message,index);return false;};
 const pendingApprovalRequests=requests.filter(request=>awaitsApproval(request,profile));
 const pendingChangeCount=requests.filter(request=>awaitsChangeAction(request,profile)).length;
 const visible=scopedRequests.filter(request=>filter==='All'||(filter==='Awaiting me'?awaitsChangeAction(request,profile):request.state===filter));
 const submit=form=>{saveSqlRequest(form);};
 const submitChange=form=>{saveSqlMovement(form);};
 const action=(state,details={})=>{if(!selected?.sqlId)return false;const pending=runSqlAction(state,details);return ['Approved','Rejected','Query'].includes(state)?pending:false;};
 const enterWorkspace=current=>{
  setActive('Overview');setSelected(null);setReplyTicketId(null);setModal(false);
  setEditingTicket(null);setChangeModal(null);setFinderProfile(null);setAccessProfile(null);
  setMenu(false);setProfileDetailsOpen(false);setNotificationsOpen(false);setSearch('');setFilter('All');setSort('newest');
  window.history.replaceState({uidms:true},'', '/');
  setProfile(current);
 };
 const fetchDatabaseRequests=async signal=>{
  let page=1,total;
  const rows=[];
  do{
   const result=await api(`/requests?scope=visible&pageSize=100&page=${page++}`,{signal});
   total=result.total;
   rows.push(...result.items);
   if(!result.items.length)break;
  }while(rows.length<total);
  const {items:queries}=await api('/queries?pageSize=100',{signal});
  const threads=new Map();
  for(const row of [...queries].reverse()){
   const history=threads.get(row.RequestId)||[];
   history.push({id:row.Id,by:row.AuthorName,employeeId:row.AuthorEmployeeId,role:row.AuthorRole,message:row.Message,at:row.CreatedAt,closedAt:row.ResolvedAt,
    targetIds:[row.RecipientEmployeeId],targetNames:[row.RecipientName],responses:row.ResponseAt?[{employeeId:row.RecipientEmployeeId,response:row.Response,responseBy:row.RecipientName,responseAt:row.ResponseAt}]:[]});
   threads.set(row.RequestId,history);
  }
  return rows.map(row=>requestListItem(row,threads.get(row.id)||[]));
 };

 const sqlWrite=(path,method,body)=>api(path,{method,body,csrfToken:apiSession.csrfToken});
 const refreshSqlRequests=async id=>{
  const tickets=await fetchDatabaseRequests();
  setRequests(tickets);
  if(id){setSelected(tickets.find(ticket=>ticket.id===id)||null);setSqlDetailRevision(revision=>revision+1);}
 };
 const saveSqlRequest=async form=>{
  try{
   const payload=requestPayload(form,profile,sqlCatalog);
   const saved=editingTicket?await sqlWrite('/requests/'+editingTicket.sqlId,'PUT',{...payload,version:editingTicket.version}):await sqlWrite('/requests','POST',payload);
   await refreshSqlRequests(saved?.ticketNumber||editingTicket?.id);
   setModal(false);setEditingTicket(null);setActive('My requests');
   notify('Request saved to SQL Server.');
  }catch(error){notify(error.message);}
 };
 const saveSqlMovement=async({ticket,change,employee,access,justification,reasons})=>{
  try{
   const getOrg=(kind,name)=>organizationId(sqlCatalog,kind,name);
   if(ticket){
    const error=validateEmployeeChange(ticket,profile,access,justification,reasons);
    if(error)throw new Error(error);
    const items=systemItems(sqlCatalog,selectedChangeAccess(access).map(row=>({...row,employeeId:profile.employeeId,reason:reasons?.[row.system]||justification})),'update').map(({systemId,systemRoleId,reason})=>({systemId,systemRoleId,reason}));
    await sqlWrite('/requests/'+ticket.sqlId+'/employee-review','POST',{version:ticket.version,justification,details:{transferChange:{...ticket.transferChange,stage:'approval'},transferDetails:access},items});
    await refreshSqlRequests(ticket.id);
   }else{
    const current=users.find(user=>user.employeeId===employee?.employeeId);
    const error=validateChangeInitiation(change,profile,current);
    if(error)throw new Error(error);
    const branchId=getOrg('branch',current.branch),departmentId=getOrg('department',current.department);
    const destinationBranchId=getOrg('branch',change.toBranch),destinationDepartmentId=getOrg('department',change.toDepartment);
    const {id,employeeId,name,branch,department,access}=current;
    const created=await sqlWrite('/requests','POST',{typeCode:'movement',subjectUserId:id,branchId,departmentId,destinationBranchId,destinationDepartmentId,justification:change.justification,consent:true,items:[],
     people:[{employeeId,name,userId:id,branchId:destinationBranchId,departmentId:destinationDepartmentId}],
     details:{transferChange:{...change,employee:{employeeId,name,branch,department,access},stage:'employee'}}});
    await refreshSqlRequests(created.ticketNumber);
   }
   setChangeModal(null);setActive('My requests');notify('Employee change saved to SQL Server.');
  }catch(error){notify(error.message);}
 };
 const deleteSqlRequest=async ticket=>{
  try{await sqlWrite('/requests/'+ticket.sqlId,'DELETE',{version:ticket.version});await refreshSqlRequests();setSelected(null);notify('Request cancelled.');}
  catch(error){notify(error.message);}
 };
 const replySqlQuery=async(ticket,message,index)=>{
  try{
   const latest=await api('/requests/'+ticket.sqlId);
   const queries=latest.queries.filter(query=>query.recipientId===profile.id&&!query.resolvedAt);
   const match=ticket.queryHistory?.[index];
   const row=queries.find(query=>query.message===match?.message)||queries[0];
   if(!row)throw new Error('This query has already closed or is assigned to another employee.');
   await sqlWrite('/queries/'+row.id+'/reply','POST',{message,version:latest.version});
   await refreshSqlRequests(ticket.id);notify('Reply saved to SQL Server.');
  }catch(error){notify(error.message);}
 };
 const runSqlAction=async(state,details)=>{
  const ticket=selected;
  try{
   const path='/requests/'+ticket.sqlId;
   if(state==='Responded')return replySqlQuery(ticket,details.message);
   if(state==='Query'){
    if(details.targetIds?.length!==1)throw new Error('Choose one query recipient.');
    const participants=queryRecipientsFor(users,profile,ticket);
    let recipient=participants.find(user=>user.employeeId===details.targetIds[0]&&user.id);
    if(!recipient){const directory=await api('/users?search='+encodeURIComponent(details.targetIds[0]));recipient=directory.items.find(user=>user.employeeId===details.targetIds[0]);}
    if(!recipient)throw new Error('The recipient could not be found in the directory.');
    await sqlWrite(path+'/queries','POST',{recipientId:recipient.id,message:details.message,version:ticket.version});
   }else if(state==='Clearance updated'||['Approved','Rejected'].includes(state)){
    let version=ticket.version;
    if(state==='Clearance updated'||state==='Approved'&&profile.role==='HR'&&ticket.typeCode==='new-user'){
     if(!ticket.sqlPeople||details.hrChecks?.length!==ticket.sqlPeople.length)throw new Error('Load the ticket and complete the clearance fields for every employee.');
     const checks=details.hrChecks.map((check,index)=>({...normalizeHrCheck(check),personId:ticket.sqlPeople[index].id}));
     await sqlWrite(path+'/hr-clearance','PUT',{version,checks});
     version=(await api(path)).version;
    }
    if(state!=='Clearance updated')await sqlWrite(path+'/decisions','POST',{version,decision:state==='Approved'?'approve':'reject',...(details.remark?.trim()?{remark:details.remark.trim()}:{})});
   }else if(state==='Email sent'){
    await sqlWrite(path+'/email-drafts/'+details.draftId+'/sent','POST',{confirmedSent:true,email:details.email});
   }else if(state==='Fulfilled'){
    const credentials=details.credentials.flatMap(row=>ticket.sqlItems?.filter(item=>item.system===row.system&&ticket.sqlPeople.some(person=>person.id===item.personId&&person.employeeId===row.employeeId)).slice(0,1).map(item=>({employeeId:row.employeeId,systemId:item.systemId,username:row.username,password:row.password}))||[]);
    await sqlWrite(path+'/complete','POST',{version:ticket.version,notes:'Provisioning confirmed in UIDMS.',confirmedProvisioned:true,credentials});
   }else{
    throw new Error('This action is not available for SQL-backed tickets.');

   }
   await refreshSqlRequests(ticket.id);notify('Ticket updated in SQL Server.');return true;
  }catch(error){notify(error.message);return false;}
 };
 useEffect(()=>{
  if(!apiSession||!selected?.sqlId)return;
  const controller=new AbortController(),ticket=selected;
  api('/requests/'+ticket.sqlId,{signal:controller.signal}).then(async detail=>{
   const updated=requestFromDatabase(ticket,detail);
   if(hasPortalRole(profile,'IT','Admin','Super Admin')&&['Approved','IT processing','HO processing','Completed'].includes(detail.state)){
    const {items}=await api('/requests/'+ticket.sqlId+'/email-drafts',{signal:controller.signal});
    const allSent=items.length&&items.every(draft=>draft.sentAt);
    const last=allSent?[...items].sort((a,b)=>b.sentAt.localeCompare(a.sentAt))[0]:null;
    updated.fulfilment={...updated.fulfilment,emailDrafts:items,emailSentAt:last?.sentAt,emailSentBy:last?.sentBy};
   }
   setSelected(current=>current?.sqlId===ticket.sqlId?updated:current);
  }).catch(error=>{if(!controller.signal.aborted)notify(error.message);});
  return()=>controller.abort();
 },[apiSession,selected?.sqlId,selected?.version,selected?.reviewableByMe,profile?.role,sqlDetailRevision]);
 const refreshOrganization=async(signal)=>{
  const [catalog,directory,self]=await Promise.all([api('/lookups',{signal}),api('/users?pageSize=100',{signal}),api('/profile',{signal})]);
  if(signal?.aborted)return;
  setOrganizationRouting(catalog.organizations);
  setSqlCatalog(catalog);
  const own={...self.user,branch:catalog.organizations.find(row=>row.Id===self.user.branchId)?.Name||'',department:catalog.organizations.find(row=>row.Id===self.user.departmentId)?.Name||''};
  if(own){
   const scope=self;
   if(signal?.aborted)return;
   const access={enabledSystems:[],otherAccess:[],systemRoles:{}};
   for(const grant of scope.access){
    if(grant.RoleName)(access.systemRoles[grant.SystemName]||=[]).push(grant.RoleName);
    else access.enabledSystems.push(grant.SystemName);
   }
   const designation=catalog.organizations.find(row=>row.Id===own.designationId)?.Name||'';
   setProfile(current=>current?.id===own.id?{...current,...own,designation,access}:current);
   setApiSession(session=>session?{...session,user:own}:session);
  }
  setUsers(current=>directory.items.map(user=>{
   const previous=current.find(item=>item.id===user.id);
   const designation=catalog.organizations.find(row=>row.Id===user.designationId)?.Name||'';
   return {...previous,...user,branch:catalog.organizations.find(row=>row.Id===user.branchId)?.Name||'',department:catalog.organizations.find(row=>row.Id===user.departmentId)?.Name||'',designation,systemId:user.employeeId,access:previous?.access||{}};
  }));
  setBranches(catalog.organizations.filter(row=>row.Kind==='branch').map(row=>row.Name));
  setDepartments(catalog.organizations.filter(row=>row.Kind==='department').map(row=>row.Name));
  setDesignations(catalog.organizations.filter(row=>row.Kind==='designation').map(row=>row.Name));
  setMailingGroups(catalog.mailingGroups.map(row=>({address:row.Email,name:row.Name,members:row.IsMember?[profile.employeeId]:[]})));
 };
 const refreshLive=async signal=>{
  const [tickets,notifications]=await Promise.all([fetchDatabaseRequests(signal),api('/notifications?pageSize=40',{signal}),refreshOrganization(signal)]);
  if(signal?.aborted)return;
  setRequests(tickets);
  setSqlNotifications(notifications.items);
  setSelected(current=>{
   if(!current?.sqlId)return current;
   const latest=tickets.find(ticket=>ticket.sqlId===current.sqlId);
   return !latest?null:latest.version===current.version&&latest.reviewableByMe===current.reviewableByMe?{...current,branch:latest.branch,department:latest.department}:latest;
  });
  setSyncError('');
 };
 useSqlRefresh(Boolean(apiSession),refreshLive,error=>setSyncError(error.status===401?'Your session expired. Sign in again to resume updates.':'Could not refresh UIDMS data. Updates will retry automatically.'));
 const openSqlNotification=async notification=>{
  try{
   if(!notification.ReadAt)await sqlWrite('/notifications/'+notification.Id+'/read','POST',{});
   setSqlNotifications(current=>current.map(row=>row.Id===notification.Id?{...row,ReadAt:row.ReadAt||new Date().toISOString()}:row));
   setNotificationsOpen(false);
   const target=requests.find(ticket=>ticket.sqlId===notification.RequestId);
   if(target)setSelected(target);
  }catch(error){notify(error.message);}
 };
 const completeDatabaseSignIn=async(result,{restoring=false,isCurrent=()=>true}={})=>{
  try{
   const [catalog,tickets,directory,notifications]=await Promise.all([api('/lookups'),fetchDatabaseRequests(),api('/users?pageSize=100'),api('/notifications?pageSize=40')]);
   setSqlNotifications(notifications.items);
   const lookup=id=>catalog.organizations.find(row=>row.Id===id)?.Name||'';
   const mapUser=user=>({...user,systemId:user.employeeId,branch:lookup(user.branchId),department:lookup(user.departmentId),designation:lookup(user.designationId),access:{}});
   const [current,...visibleUsers]=await Promise.all([result.user,...directory.items.filter(user=>user.id!==result.user.id)].map(async user=>{
    const row=mapUser(user);
    const {access}=await api('/users/'+user.id+'/access');
    row.access={systemRoles:{},enabledSystems:[],otherAccess:[]};
    for(const grant of access){
      if(grant.RoleName)(row.access.systemRoles[grant.SystemName]||=[]).push(grant.RoleName);
      else row.access.enabledSystems.push(grant.SystemName);
    }
    return row;
   }));
   const signature=await api('/profile/signature',{format:'blob'}).catch(error=>{if(error.status!==404||error.code!=='SIGNATURE_NOT_FOUND')throw error;return null;});
   if(signature)current.signature=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read your saved signature.'));reader.readAsDataURL(signature);});
   if(!isCurrent())return;
   if(restoring){const route=routeFromPath(window.location.pathname);setProfile(current);setActive(route.page);setSelected(route.requestId?tickets.find(ticket=>ticket.id===route.requestId)||null:null);}
   else enterWorkspace(current);
   setOrganizationRouting(catalog.organizations);
  setSqlCatalog(catalog);
   setMailingGroups(catalog.mailingGroups.map(row=>({address:row.Email,name:row.Name,members:row.IsMember?[result.user.employeeId]:[]})));
   setUsers([current,...visibleUsers]);
   setBranches(catalog.organizations.filter(row=>row.Kind==='branch').map(row=>row.Name));
   setDepartments(catalog.organizations.filter(row=>row.Kind==='department').map(row=>row.Name));
   setDesignations(catalog.organizations.filter(row=>row.Kind==='designation').map(row=>row.Name));
   setApiSession(result);
   setRequests(tickets);
  }catch(error){
   if(!restoring)await api('/auth/logout',{method:'POST',body:{},csrfToken:result.csrfToken}).catch(()=>{});
   throw error;
  }
 };
 useEffect(()=>{
  let current=true;
  setSessionRestore({loading:true,error:''});
  // Reuse the request during React StrictMode's development effect replay.
  const pending=restoreRequest.current||(restoreRequest.current=restorePortalSession(api));
  pending.then(async result=>{if(!current)return;if(result)await completeDatabaseSignIn(result,{restoring:true,isCurrent:()=>current});if(current)setSessionRestore({loading:false,error:''});}).catch(error=>{if(current)setSessionRestore({loading:false,error:error.message||'Could not restore your session. Please retry.'});});
  return()=>{current=false;};
 },[restoreAttempt]);
 const signInWithDatabase=async(selected,password,provider='local')=>{
  const result=await startPortalLogin(api,selected.employeeId,password,provider);
  if(result.onboardingRequired){setPendingEnrollment(result);return '';}
  if(result.challenge){setPendingAuth(result);return '';}
  await completeDatabaseSignIn(result);
 };
 const saveProfile=async changes=>{
  const result=await sqlWrite('/profile','PATCH',changes);
  const designation=sqlCatalog.organizations.find(row=>row.Id===result.user.designationId)?.Name||'';
  setProfile(current=>({...current,...result.user,designation,...(changes.signatureBase64?{signature:`data:image/png;base64,${changes.signatureBase64}`}:{})}));
  try{await refreshOrganization();notify('Profile saved to SQL Server.');}
  catch{notify('Profile saved. Refresh the page to load the latest access records.');}
 };
 if(!profile&&(sessionRestore.loading||sessionRestore.error))return <main className="session-restore-screen" style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:24}}><section style={{maxWidth:440,textAlign:'center'}} aria-live="polite"><h1>{sessionRestore.loading?'Restoring your session...':'Could not load your workspace'}</h1>{sessionRestore.error&&<><p role="alert">{sessionRestore.error}</p><button type="button" className="button button-primary" onClick={()=>{restoreRequest.current=null;setSessionRestore({loading:true,error:''});setRestoreAttempt(value=>value+1);}}>Retry</button></>}</section></main>;
 if(!profile&&pendingEnrollment)return <ProfileOnboarding enrollment={pendingEnrollment} api={api} onCancel={()=>setPendingEnrollment(null)} onComplete={async result=>{if(result.challenge)setPendingAuth(result);else await completeDatabaseSignIn(result);setPendingEnrollment(null);}}/>;
 if(!profile)return <><Login users={switchUsers} dark={dark} onToggleTheme={()=>setDark(value=>!value)} onLogin={signInWithDatabase} passwordRequired mockLogin={mockLogin} loginOptions={loginOptions}/>{pendingAuth&&<LoginVerification challenge={pendingAuth} api={api} onCancel={()=>setPendingAuth(null)} onVerify={async code=>{const result=await verifyPortalMfa(api,pendingAuth.challenge,code);await completeDatabaseSignIn(result);setPendingAuth(null);}}/>}</>;
 const unreadNotifications=sqlNotifications.filter(row=>!row.ReadAt).length;
 const nav=navFor(role,profile); const displayName=profile.name||'Rahim Ahmed'; const initials=displayName.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
 return <div className={`app-shell ${dark?'theme-dark':''}`}><Sidebar catalog={sqlCatalog} onSaveProfile={saveProfile} pendingApprovalCount={pendingApprovalRequests.length} active={active} onNavigate={x=>{setActive(x);setSelected(null);setAccessProfile(null);if(x==='Approvals'){setOperationsMetric(null);setSearch('');setFilter(pendingApprovalRequests.length?'Awaiting me':'All');}}} open={menu} onClose={()=>setMenu(false)} items={nav} profile={profile} onLogout={logout} onSaveSignature={async signature=>{await sqlWrite('/profile/signature','PUT',{base64:signature.split(',')[1]});setProfile(current=>({...current,signature}));notify('Signature saved to SQL Server.');}}/><main className={active === 'Overview' && !selected ? 'content-shell overview-shell' : active === 'Create a request' && !selected ? 'content-shell request-centre-shell' : active === 'Approvals' && !selected ? 'content-shell approvals-shell' : active === 'Audit trail' && !selected ? 'content-shell audit-shell' : 'content-shell'}><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setMenu(true)} aria-label="Open navigation"><Icon name="menu"/></button><div className="breadcrumbs"><span>UIDMS</span><Icon name="chevron" size={14}/><strong>{selected?.id||requestTypeLabel(active)}</strong></div></div><div className="topbar-actions"><label className="global-search"><Icon name="search" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets, people, systems" aria-label="Search"/><kbd>⌘ K</kbd></label><span className="topbar-divider"/><button type="button" className="topbar-theme-switch" role="switch" aria-checked={dark} onClick={()=>setDark(value=>!value)} aria-label="Dark theme" title={dark?"Switch to light mode":"Switch to dark mode"}><span className="theme-switch-thumb"/><span className="theme-switch-sun"><Icon name="sun" size={15}/></span><span className="theme-switch-moon"><Icon name="moon" size={15}/></span></button><div className="notification-menu-wrap"><button type="button" className="icon-button notification-button" onClick={()=>setNotificationsOpen(open=>!open)} aria-label={`Notifications, ${unreadNotifications} unread`} aria-expanded={notificationsOpen}><Icon name="bell" size={19}/>{unreadNotifications>0&&<i>{Math.min(unreadNotifications,9)}</i>}</button>{notificationsOpen&&<section className="notification-popover"><header><strong>Notifications</strong><span>{unreadNotifications}</span></header>{sqlNotifications.length?sqlNotifications.map(row=><button type="button" key={row.Id} onClick={()=>openSqlNotification(row)}><strong>{row.Message}</strong><small>{formatDhakaTimestamp(row.CreatedAt)}{row.ReadAt?'':' ? Unread'}</small></button>):<p>No notifications yet.</p>}</section>}</div><span className="topbar-system-id" title="System ID">{profile?.systemId||profile?.employeeId||'No ID'}</span><span className="role-chip" aria-label="Current role">{role}</span><div className="profile-menu-wrap" onMouseEnter={()=>setProfileDetailsOpen(true)} onMouseLeave={()=>setProfileDetailsOpen(false)} onKeyDown={event=>event.key==='Escape'&&setProfileDetailsOpen(false)}><button type="button" className="topbar-profile-trigger" onClick={()=>setProfileDetailsOpen(true)} onFocus={()=>setProfileDetailsOpen(true)} aria-label={`Open profile for ${displayName}`} aria-expanded={profileDetailsOpen} title="View your profile"><Avatar initials={initials} tone="navy"/></button>{profileDetailsOpen&&<ProfileDetails profile={profile} onClose={()=>setProfileDetailsOpen(false)} onTemplates={()=>{setSelected(null);setActive('System Email Templates');setProfileDetailsOpen(false);}}/>}</div><button type="button" className="icon-button topbar-logout" aria-label="Log out" title="Log out" onClick={logout}><Icon name="logout" size={19}/></button></div></header><div className="page-content">
 {syncError&&<p role="status" className="fulfilment-note">{syncError}</p>}
 {selected&&!canViewChange(selected,profile)?<section className="panel directory-panel"><p>This request is not available to your account.</p><Button onClick={()=>setSelected(null)}>Back to requests</Button></section>:selected?<TicketDetail sqlWrite={sqlWrite} queryMode={personalQueryMode} ticket={selected} role={role} profile={profile} users={users} focusReply={replyTicketId===selected.id} onBack={()=>{setSelected(null);setReplyTicketId(null);}} onAction={action} onContinueChange={ticket=>setChangeModal(ticket)} delivery={canReceiveCredentials(selected,profile)?credentialVault[selected.id]:undefined} onEdit={ticket=>{setEditingTicket(ticket);setModal(true);}} onDelete={deleteSqlRequest}/>:active==='Overview'?<><div className="welcome-banner"><div><p className="eyebrow">{new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'Asia/Dhaka'}).format(greetingTime).toUpperCase()} <span className="live-dot"/> {role.toUpperCase()} WORKSPACE</p><h1>{timeGreeting(greetingTime)}, {displayName}</h1><p className="welcome-audit-note"><Icon name="clock" size={13}/>All decisions and queries are logged on each ticket.</p></div>{['IT','CITO'].includes(role)&&<OperationsFinder users={users} requests={requests.filter(request=>canViewChange(request,profile))} onViewAccess={setFinderProfile} onOpenRequest={setSelected}/>}<div className="banner-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-shield"><Icon name="users" size={28}/></div></div></div>{isOperationsRole?<div className="metrics-grid operations-metrics">{[['total','active','approved','closed','rejected'],['mine','it','coo','it-processing','ho-processing','hr'],['cito','queries','my-queries']].map((keys,index)=><div key={index} className="metrics-grid operations-metric-row" style={{'--metric-columns':keys.filter(key=>operationCards.some(card=>card.key===key)).length}}>{keys.map(key=>operationCards.find(card=>card.key===key)).filter(Boolean).map(card=><Metric key={card.key} label={card.label} value={card.value} note={card.note} icon={card.icon} tone={card.tone} selected={selectedOperation.key===card.key} onClick={()=>{setOperationsMetric(card.key);setFilter('All');setSearch('');}}/>)}</div>)}</div>:(<div className="metrics-grid"><Metric label={role==='User'?'My active access':'Active identities'} value={role==='User'?'12':users.length} note={role==='User'?'Across 8 systems':'Across all roles'} icon="grid" onClick={()=>setActive(['IT','CITO','Admin','Platform Admin','Super Admin'].includes(role)?'User directory':'My access')}/><Metric label={role==='User'?'Pending requests':'Awaiting my review'} value={requests.filter(request=>request.state==='Pending'&&(role==='User'?request.requesterId===profile.employeeId:(isChangeRequest(request)?canReviewChange(request,profile):isNewUser(request)?canReviewNewUser(request,profile):request.assignedRole===role&&(role!=='Branch manager'||request.branch===profile.branch)))).length} note="Needs attention" icon="clock" tone="amber" onClick={()=>{setFilter('Pending');setActive(role==='User'?'My requests':'Approvals');}}/><Metric label="In progress" value="05" note="Moving through approval" icon="inbox" tone="violet" onClick={()=>{setFilter('In review');setActive(role==='User'?'My requests':'Approvals');}}/><Metric label="Completed this month" value="18" note="All activity is audited" icon="check" tone="green" onClick={()=>{setFilter('Approved');setActive(role==='User'?'My requests':'Approvals');}}/></div>)}{!isOperationsRole&&(<section className="panel overview-request-panel"><SectionTitle eyebrow="QUICK REQUESTS" title="Start a request"><span className="dashboard-section-note">Choose a service to get started</span></SectionTitle><RequestTypeCards profile={profile} pendingChangeCount={pendingChangeCount} compact role={role} department={profile?.department} onContinue={(type,drive)=>{setRequestDrive(drive||null);if(type===CHANGE_REQUEST||type==='Branch transfer'){setSelected(null);setFilter(pendingChangeCount?'Awaiting me':'All');setSearch('');setActive(CHANGE_REQUEST);return;}setRequestType(type);setModal(true);}}/></section>)}<div className={`main-grid${personalQueryMode?' personal-query-grid':''}`}><OverviewRequestQueue key={`${profile.employeeId}:${operationsMetric}`} rows={isOperationsRole?selectedOperation.rows.filter(ticket=>`${ticket.id} ${ticket.name} ${requestTypeLabel(ticket.action)} ${ticket.system} ${ticket.branch}`.toLowerCase().includes(search.toLowerCase())):scopedRequests} filter={filter} onFilter={setFilter} search={search} onSearch={setSearch} eyebrow={role==='User'?'YOUR ACTIVITY':'WORK QUEUE'} title={isOperationsRole?selectedOperation.label:role==='User'?'Recent requests':'Requests needing attention'} onViewQueue={()=>{if(isOperationsRole){setOperationsMetric(selectedOperation.key);setFilter('All');setSearch('');}setActive(role==='User'?'My requests':'Approvals');}} renderRows={rows=>personalQueryMode?<PersonalQueryThreads rows={rows} mode={personalQueryMode} profile={profile} users={users} onOpen={setSelected} onReply={replyToPersonalQuery}/>:<RequestRows rows={rows} onOpen={setSelected}/>}/>{!personalQueryMode&&<aside className="right-rail"><QueryInbox requests={requests.filter(request=>canViewChange(request,profile))} profile={profile} onOpen={(ticket,reply=false)=>{setReplyTicketId(reply?ticket.id:null);setSelected(ticket);}}/></aside>}</div></>:active==='Approvals'?<ApprovalsPage key={filter==='Awaiting me'?'awaiting-me':'all-approvals'} initialRange={filter==='Awaiting me'||isOperationsRole&&operationsMetric?'All time':'Today'} rows={filter==='Awaiting me'?pendingApprovalRequests:isOperationsRole&&operationsMetric?selectedOperation.rows:scopedRequests} role={role} filter={filter==='Awaiting me'?'All':filter} onFilter={setFilter} renderRows={rows=>personalQueryMode?<PersonalQueryThreads rows={rows} mode={personalQueryMode} profile={profile} users={users} onOpen={setSelected} onReply={replyToPersonalQuery}/>:<RequestRows rows={rows} onOpen={setSelected}/>}/>:active==='My access'?<MyAccess onRequest={()=>setModal(true)} requests={requests} profile={profile} onOpen={setSelected}/>:active==='Create a request'?<SystemAccessPage profile={profile} pendingChangeCount={pendingChangeCount} department={profile?.department} role={role} onContinue={(type,drive)=>{setRequestDrive(drive||null);if(type===CHANGE_REQUEST||type==='Branch transfer'){setSelected(null);setFilter(pendingChangeCount?'Awaiting me':'All');setSearch('');setActive(CHANGE_REQUEST);return;}setRequestType(type);setModal(true);}}/>:active==='User directory'?(accessProfile?<MyAccess profile={users.find(user=>user.employeeId===accessProfile.employeeId)||accessProfile} requests={requests} onOpen={setSelected} onBack={()=>setAccessProfile(null)} readOnly/>:<UserDirectory onBack={()=>{setAccessProfile(null);setActive('Overview');}} users={users} requests={requests} onViewAccess={setAccessProfile} onOpenRequest={setSelected}/>):active==='System Email Templates'&&canManageTemplates(role,profile)?<SystemEmailWorkspace session={apiSession}/>:active==='Acting appointments'&&canUseActingAppointments(profile)?<ActingAssignments profile={profile} write={sqlWrite} onRefresh={refreshLive}/>:active==='Approver assignments'&&(canManageApprovers(role)||hasPortalRole(profile,'IT'))?<ApproverAssignments write={sqlWrite} onRefresh={refreshLive}/>:active==='Workflow studio'&&canManageUsers(role)?<DatabaseWorkflows onBack={closeWorkflow} catalog={sqlCatalog} write={sqlWrite} onRefresh={refreshLive} notify={notify} role={role}/>:active==='Admin settings'&&canManageUsers(role)?<DatabaseAdministration users={users} catalog={sqlCatalog} write={sqlWrite} onRefresh={refreshOrganization} notify={notify} role={role}/>:active==='Reports'?<Reports requests={requests.filter(request=>canViewChange(request,profile))} users={users} onOpen={setSelected}/>:active==='Audit trail'&&canManageUsers(role)?<DatabaseAudit/>:active==='Joiners & transfers'?<RequestsPage title="Joiners & transfers" rows={requests.filter(ticket=>['new-user','movement','branch-transfer'].includes(ticket.typeCode))} showCreate role={role} onOpen={setSelected} onRequest={()=>setChangeModal('new')} onFilter={setFilter} filter={filter} sort={sort} onSort={setSort} notify={notify}/>:<RequestsPage title={active} rows={active===CHANGE_REQUEST?visible.filter(isChangeRequest):visible} showCreate={active!==CHANGE_REQUEST||canRequestBranchTransfer(profile)} role={role} onOpen={setSelected} onRequest={()=>active===CHANGE_REQUEST?setChangeModal('new'):setRequestChooserOpen(true)} onFilter={setFilter} filter={filter} sort={sort} onSort={setSort} notify={notify}/> }
 </div><footer className="page-footer"><span>&copy; 2026 Information Technology Department, CBC Bangladesh. All rights reserved.</span><span><i/> CBC internal portal</span></footer></main>{requestChooserOpen&&<NewRequestModal profile={profile} pendingChangeCount={pendingChangeCount} department={profile?.department} role={role} onClose={()=>setRequestChooserOpen(false)} onContinue={(type,drive)=>{setRequestDrive(drive||null);setRequestChooserOpen(false);if(type===CHANGE_REQUEST||type==='Branch transfer'){setSelected(null);setFilter(pendingChangeCount?'Awaiting me':'All');setSearch('');setActive(CHANGE_REQUEST);return;}setEditingTicket(null);setRequestType(type);setModal(true);}}/>}{changeModal&&<TransferChangeModal key={changeModal.id||'new-change'} ticket={changeModal==='new'?null:changeModal} profile={profile} users={users} branches={branches} departments={departments} onClose={()=>setChangeModal(null)} onSubmit={submitChange}/ >}{modal&&<RequestModal key={editingTicket?.id||'new'} ticket={editingTicket} editable={Boolean(editingTicket)} onClose={()=>{setModal(false);setEditingTicket(null);}} onSubmit={submit} profile={profile} users={users} branches={branches} departments={departments} mailingGroups={mailingGroups} initialType={requestType} initialDrive={requestDrive}/ >}{finderProfile&&<div className="modal-scrim" role="presentation" onClick={()=>setFinderProfile(null)}><section className="request-modal finder-access-modal" role="dialog" aria-modal="true" aria-label={`Current access for ${finderProfile.name}`} onClick={event=>event.stopPropagation()}><header className="modal-header"><div><p className="eyebrow">CURRENT ACCESS</p><h2>{finderProfile.name}</h2><p className="modal-subtitle">{finderProfile.employeeId} / {finderProfile.department} / {finderProfile.branch}</p></div><button type="button" className="icon-button" onClick={()=>setFinderProfile(null)} aria-label="Close current access"><Icon name="close"/></button></header><MyAccess profile={users.find(user=>user.employeeId===finderProfile.employeeId)||finderProfile} readOnly/></section></div>}<FloatingQueryChat key={profile.employeeId} profile={profile} requests={requests.filter(request=>canViewChange(request,profile))} onOpen={(ticket,reply=false)=>{setSelected(ticket);setReplyTicketId(null);if(reply)requestAnimationFrame(()=>setReplyTicketId(ticket.id));}}/>{toast&&<div key={toastKey} className="toast" role="status" aria-live="polite" aria-atomic="true"><span><Icon name="check" size={17}/></span>{toast}</div>}</div>;
}

function RequestRows({rows,onOpen}) {
 return <div className="request-list"><div className="request-head"><span>REQUESTER / TICKET</span><span>SYSTEM & ROLE</span><span>SUBMITTED</span><span>STATUS</span><span/></div>{rows.length?rows.map(r=>{
  const [submitted,...detail]=requestSubmittedDate(r).split(', ');
  return <button className="request-row" key={r.id} onClick={()=>onOpen(r)}><span className="request-person"><Avatar initials={r.initials} tone="blue"/><span><strong>{r.name}</strong><small>{r.id}  |  {requestTypeLabel(r.action)}</small></span></span><span className="system-role"><strong>{r.system}</strong><small>{r.role}</small></span><span className="submitted"><strong>{submitted}</strong><small>{detail.join(', ')}</small></span><span className="status-cell"><Status>{requestStatusLabel(r)}</Status><small>{requestStageLabel(r)}</small></span><Icon name="chevron" size={16} className="row-chevron"/></button>;
 }):<div className="empty-state">No requests match these filters.</div>}</div>;
}
function RequestsPage({title,rows,role,onOpen,onRequest,onFilter,filter,sort,onSort,notify,showCreate=true}) {return <section className="panel directory-panel requests-paginated-page"><SectionTitle eyebrow={title==='Approvals'?'REVIEW QUEUE':'REQUEST MANAGEMENT'} title={requestTypeLabel(title)}>{showCreate&&<Button icon={title==='Approvals'?'check':'plus'} onClick={title==='Approvals'?()=>notify('Showing requests assigned to your role.'):onRequest}>{title==='Approvals'?'Bulk review':title===CHANGE_REQUEST?'Initiate transfer':'New request'}</Button>}</SectionTitle><p className="directory-intro">{title==='Approvals'?`Review, query or decide requests routed to ${role}. Decisions and remarks are recorded on the ticket.`:'Search and review tickets with their current approval owner and status.'}</p><div className="table-toolbar"><div className="tabs">{['All',...(title===CHANGE_REQUEST?['Awaiting me']:[]),'Pending','In review','Query','Approved'].map(t=><button key={t} className={filter===t?'selected':''} onClick={()=>onFilter(t)}>{t}</button>)}</div><label className="sort-control">Sort <select value={sort} onChange={e=>onSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="ticket">Ticket ID</option></select></label></div><RequestPagePagination rows={rows} resetKey={`${title}:${filter}:${sort}:${rows.map(row=>row.id).join(",")}`} renderRows={pageRows=><RequestRows rows={pageRows} onOpen={onOpen}/>}/></section>;}
function UserDirectory({users,requests,onViewAccess,onOpenRequest,onBack}) {
 const [userSearch,setUserSearch]=useState('');const [requestSearch,setRequestSearch]=useState('');const [systemFilter,setSystemFilter]=useState('All');const [requestedRoleFilter,setRequestedRoleFilter]=useState('All');const [fromDate,setFromDate]=useState('');const [toDate,setToDate]=useState('');const [sortBy,setSortBy]=useState('newest');
 const [accessSystemFilter,setAccessSystemFilter]=useState('All');const [accessRoleFilter,setAccessRoleFilter]=useState('All');const [accessBranchFilter,setAccessBranchFilter]=useState('All');const [accessDepartmentFilter,setAccessDepartmentFilter]=useState('All');const [viewingAccess,setViewingAccess]=useState(null);
 const roleCounts=roles.map(role=>({role,count:users.filter(user=>user.role===role).length})).filter(item=>item.count);
 const accessGroups=new Map();users.forEach(user=>{const access=user.access||{};const recorded=new Set();Object.entries(access.systemRoles||{}).forEach(([system,levels])=>{const roleNames=Array.isArray(levels)&&levels.length?levels:['Assigned'];roleNames.forEach(level=>{const key=`${system}|||${level}`;recorded.add(system);if(!accessGroups.has(key))accessGroups.set(key,{system,role:level,users:[]});accessGroups.get(key).users.push(user);});});[...(access.enabledSystems||[]),...(access.otherAccess||[])].forEach(system=>{if(recorded.has(system))return;const key=`${system}|||Assigned`;if(!accessGroups.has(key))accessGroups.set(key,{system,role:'Assigned',users:[]});accessGroups.get(key).users.push(user);});});
 const accessRows=[...accessGroups.values()].sort((a,b)=>a.system.localeCompare(b.system)||a.role.localeCompare(b.role));const accessSystems=[...new Set(accessRows.map(row=>row.system))].sort();const accessRoles=[...new Set(accessRows.map(row=>row.role))].sort();const accessBranches=[...new Set(users.map(user=>user.branch).filter(Boolean))].sort();const accessDepartments=[...new Set(users.map(user=>user.department).filter(Boolean))].sort();const filteredAccess=accessRows.map(row=>({...row,users:row.users.filter(user=>(accessBranchFilter==='All'||user.branch===accessBranchFilter)&&(accessDepartmentFilter==='All'||user.department===accessDepartmentFilter))})).filter(row=>row.users.length>0&&(accessSystemFilter==='All'||row.system===accessSystemFilter)&&(accessRoleFilter==='All'||row.role===accessRoleFilter));const accessUserTotal=new Set(filteredAccess.flatMap(row=>row.users.map(user=>user.employeeId))).size;const accessAssignmentTotal=filteredAccess.reduce((total,row)=>total+row.users.length,0);
 const systems=[...new Set(requests.flatMap(request=>String(request.system||'').split(',').map(system=>system.trim()).filter(Boolean)))].sort();
 const requestedRoles=[...new Set(requests.map(request=>request.role).filter(Boolean))].sort();
 const filteredRequests=requests.filter(request=>{const date=(request.createdAt||'').slice(0,10);const matchesDate=(!fromDate||date>=fromDate)&&(!toDate||date<=toDate);return matchesDate&&(systemFilter==='All'||String(request.system||'').split(',').map(value=>value.trim()).includes(systemFilter))&&(requestedRoleFilter==='All'||request.role===requestedRoleFilter)&&`${request.id} ${request.name} ${request.employeeId||''} ${requestTypeLabel(request.action)} ${request.system} ${request.role} ${request.branch}`.toLowerCase().includes(requestSearch.toLowerCase());}).sort((a,b)=>sortBy==='oldest'?(a.createdAt||'').localeCompare(b.createdAt||''):sortBy==='system'?String(a.system).localeCompare(String(b.system)):sortBy==='role'?String(a.role).localeCompare(String(b.role)):(b.createdAt||'').localeCompare(a.createdAt||''));
 const matchingUsers=users.filter(user=>`${user.name} ${user.employeeId} ${user.systemId} ${user.role} ${user.department} ${user.branch}`.toLowerCase().includes(userSearch.toLowerCase()));
 return <section className="panel directory-panel operations-directory"><SectionTitle eyebrow="SYSTEM-WIDE ACCESS" title="Users and requests"><Button type="button" variant="subtle" onClick={onBack}>Back to overview</Button></SectionTitle><p className="directory-intro">View user access records and search requests across the system. Employee ID and system ID are the same.</p><div className="role-count-summary"><article><small>Total users</small><strong>{users.length}</strong></article>{roleCounts.map(item=><article key={item.role}><small>{item.role}</small><strong>{item.count}</strong></article>)}</div><section className="operations-users"><SectionTitle eyebrow="ACCESS BREAKDOWN" title="Users by system and access role"/><p className="directory-intro">Counts show employees with each role or access assignment in each system.</p><div className="system-role-summary"><article><small>Unique users</small><strong>{accessUserTotal}</strong></article><article><small>Total system role assignments</small><strong>{accessAssignmentTotal}</strong></article></div><div className="system-role-filters"><label>System<select value={accessSystemFilter} onChange={event=>setAccessSystemFilter(event.target.value)}><option>All</option>{accessSystems.map(system=><option key={system}>{system}</option>)}</select></label><label>Access role<select value={accessRoleFilter} onChange={event=>setAccessRoleFilter(event.target.value)}><option>All</option>{accessRoles.map(accessRole=><option key={accessRole}>{accessRole}</option>)}</select></label><label>Branch<select value={accessBranchFilter} onChange={event=>setAccessBranchFilter(event.target.value)}><option>All</option>{accessBranches.map(branch=><option key={branch}>{branch}</option>)}</select></label><label>Department<select value={accessDepartmentFilter} onChange={event=>setAccessDepartmentFilter(event.target.value)}><option>All</option>{accessDepartments.map(department=><option key={department}>{department}</option>)}</select></label></div><div className="system-role-table-wrap"><table className="system-role-table"><thead><tr><th>System</th><th>Role / access</th><th>User count</th><th>Details</th></tr></thead><tbody>{filteredAccess.map(row=><tr key={`${row.system}-${row.role}`}><td>{row.system}</td><td>{row.role}</td><td><strong>{row.users.length}</strong></td><td><button type="button" className="system-role-view" onClick={()=>setViewingAccess(row)}>View users</button></td></tr>)}</tbody></table>{!filteredAccess.length&&<p className="directory-intro">No matching system access records.</p>}</div></section>{viewingAccess&&<div className="modal-scrim" role="presentation" onClick={()=>setViewingAccess(null)}><section className="request-modal system-role-modal" role="dialog" aria-modal="true" aria-labelledby="system-role-modal-title" onClick={event=>event.stopPropagation()}><header className="modal-header"><div><p className="eyebrow">{viewingAccess.system} / {viewingAccess.role}</p><h2 id="system-role-modal-title">Assigned users ({viewingAccess.users.length})</h2></div><button type="button" className="icon-button" aria-label="Close user details" onClick={()=>setViewingAccess(null)}><Icon name="close" size={16}/></button></header><p className="modal-subtitle">Employees assigned to this system role.</p><div className="system-role-user-list">{viewingAccess.users.map(user=><article key={user.employeeId}><span className="avatar avatar-blue">{user.name.split(' ').map(part=>part[0]).join('').slice(0,2).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.employeeId} | {user.role} | {user.department} | {user.branch}</small></div></article>)}</div><div className="modal-actions"><button type="button" className="button" onClick={()=>setViewingAccess(null)}>Close</button></div></section></div>}<section className="operations-users"><SectionTitle eyebrow="EMPLOYEE DIRECTORY" title="User access records"/><div className="table-toolbar"><label className="table-search"><Icon name="search" size={16}/><input value={userSearch} onChange={event=>setUserSearch(event.target.value)} placeholder="Search name, employee ID, role"/></label></div><div className="operations-user-list">{matchingUsers.map(user=><article className="operations-user-row" key={user.employeeId}><div><strong>{user.name}</strong><small>{user.employeeId} / {user.systemId} - {user.role} - {user.department} - {user.branch}</small></div><Button variant="subtle" onClick={()=>onViewAccess(user)}>View current access</Button></article>)}</div></section><section className="operations-requests"><SectionTitle eyebrow="SYSTEM REQUESTS" title={`All requests (${filteredRequests.length})`}/><div className="operations-request-filters"><label>Search<input value={requestSearch} onChange={event=>setRequestSearch(event.target.value)} placeholder="Ticket, requester, system"/></label><label>From<input type="date" value={fromDate} onChange={event=>setFromDate(event.target.value)}/></label><label>To<input type="date" value={toDate} onChange={event=>setToDate(event.target.value)}/></label><label>System<select value={systemFilter} onChange={event=>setSystemFilter(event.target.value)}><option>All</option>{systems.map(system=><option key={system}>{system}</option>)}</select></label><label>Requested role<select value={requestedRoleFilter} onChange={event=>setRequestedRoleFilter(event.target.value)}><option>All</option>{requestedRoles.map(requestedRole=><option key={requestedRole}>{requestedRole}</option>)}</select></label><label>Sort by<select value={sortBy} onChange={event=>setSortBy(event.target.value)}><option value="newest">Newest date</option><option value="oldest">Oldest date</option><option value="system">System A-Z</option><option value="role">Role A-Z</option></select></label><button type="button" onClick={()=>{setRequestSearch('');setSystemFilter('All');setRequestedRoleFilter('All');setFromDate('');setToDate('');setSortBy('newest');}}>Clear filters</button></div><RequestRows rows={filteredRequests} onOpen={onOpenRequest}/></section></section>;
}
function Reports({requests,users,onOpen}) {
 const [search,setSearch]=useState('');const [fromDate,setFromDate]=useState('');const [toDate,setToDate]=useState('');const [branchFilter,setBranchFilter]=useState('All');const [departmentFilter,setDepartmentFilter]=useState('All');const [systemFilter,setSystemFilter]=useState('All');const [roleFilter,setRoleFilter]=useState('All');const [sortBy,setSortBy]=useState('newest');
 const departmentFor=request=>request.department||request.resetDetails?.department||request.newUserDetails?.department||request.transferDetails?.department||request.batchDetails?.people?.[0]?.department||users.find(user=>user.employeeId===(request.requesterId||request.employeeId)||user.name===request.name)?.department||'Unspecified';
 const systemRolesFor=request=>{const entries=[];const add=(system,role=request.role)=>{if(system&&!entries.some(entry=>entry.system===system&&entry.role===(role||'Requested access')))entries.push({system,role:role||'Requested access'});};const addPeople=people=>(people||[]).forEach(person=>(person.requestedSystems||person.systems||[]).forEach(item=>add(item.system,item.role)));addPeople(request.transferDetails?.people);addPeople(request.newUserDetails?.people);addPeople(request.batchDetails?.people);(request.resetDetails?.systems||[]).forEach(system=>add(system,request.role));(request.deactivationDetails?.systems||[]).forEach(system=>add(system,request.role));if(!entries.length)String(request.system||'').split(',').map(value=>value.trim()).filter(Boolean).forEach(system=>add(system,request.role));return entries;};
 const systems=[...new Set(requests.flatMap(request=>systemRolesFor(request).map(entry=>entry.system)))].sort();const branches=[...new Set(requests.map(request=>request.branch).filter(Boolean))].sort();const departments=[...new Set(requests.map(departmentFor))].sort();const requestedRoles=[...new Set(requests.flatMap(request=>systemRolesFor(request).map(entry=>entry.role)))].sort();
 const filtered=requests.filter(request=>{const date=(request.createdAt||'').slice(0,10);const department=departmentFor(request);const entries=systemRolesFor(request);const matchingEntries=entries.filter(entry=>(systemFilter==='All'||entry.system===systemFilter)&&(roleFilter==='All'||entry.role===roleFilter));const haystack=`${request.id} ${request.name} ${request.requesterId||''} ${requestTypeLabel(request.action)} ${entries.map(entry=>`${entry.system} ${entry.role}`).join(' ')} ${request.branch} ${department} ${request.state}`.toLowerCase();return (!fromDate||date>=fromDate)&&(!toDate||date<=toDate)&&(branchFilter==='All'||request.branch===branchFilter)&&(departmentFilter==='All'||department===departmentFilter)&&matchingEntries.length>0&&haystack.includes(search.trim().toLowerCase());}).sort((a,b)=>sortBy==='oldest'?(a.createdAt||'').localeCompare(b.createdAt||''):sortBy==='requester'?String(a.name).localeCompare(String(b.name)):sortBy==='system'?String(a.system).localeCompare(String(b.system)):sortBy==='role'?String(a.role).localeCompare(String(b.role)):(b.createdAt||'').localeCompare(a.createdAt||''));
 return <section className="panel directory-panel report-page"><SectionTitle eyebrow="INSIGHTS" title="Reports & exports"><Button icon="arrow" onClick={()=>window.print()}>Export report</Button></SectionTitle><p className="directory-intro">Search, filter, and inspect request activity by date, organization, system, and access role.</p><div className="metrics-grid report-metrics"><Metric label="Requests this month" value={requests.length+126} note="Across all workflows" icon="inbox"/><Metric label="Average approval time" value="1.8 d" note="Down 0.3 days this month" icon="clock" tone="green"/><Metric label="Open queries" value="12" note="Awaiting requester response" icon="search" tone="amber"/><Metric label="SLA met" value="94%" note="Target: 90%" icon="check" tone="violet"/></div><div className="report-bars">{[['New ID creation',76],['Access upgrade',59],['ID reset',43],['Email services',34],['Branch transfer',22]].map(([label,value])=><div key={label}><span>{label}</span><i><b style={{width:`${value}%`}}/></i><strong>{value}</strong></div>)}</div><section className="report-records"><SectionTitle eyebrow="REQUEST DATA" title={`Individual requests (${filtered.length})`}/><div className="report-filters"><label className="report-search">Search<input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Ticket, requester, or request type"/></label><label>From<input type="date" value={fromDate} onChange={event=>setFromDate(event.target.value)}/></label><label>To<input type="date" value={toDate} onChange={event=>setToDate(event.target.value)}/></label><label>Branch<select value={branchFilter} onChange={event=>setBranchFilter(event.target.value)}><option>All</option>{branches.map(value=><option key={value}>{value}</option>)}</select></label><label>Department<select value={departmentFilter} onChange={event=>setDepartmentFilter(event.target.value)}><option>All</option>{departments.map(value=><option key={value}>{value}</option>)}</select></label><label>System<select value={systemFilter} onChange={event=>setSystemFilter(event.target.value)}><option>All</option>{systems.map(value=><option key={value}>{value}</option>)}</select></label><label>System role<select value={roleFilter} onChange={event=>setRoleFilter(event.target.value)}><option>All</option>{requestedRoles.map(value=><option key={value}>{value}</option>)}</select></label><label>Sort by<select value={sortBy} onChange={event=>setSortBy(event.target.value)}><option value="newest">Newest date</option><option value="oldest">Oldest date</option><option value="requester">Requester A-Z</option><option value="system">System A-Z</option><option value="role">Role A-Z</option></select></label><button type="button" onClick={()=>{setSearch('');setFromDate('');setToDate('');setBranchFilter('All');setDepartmentFilter('All');setSystemFilter('All');setRoleFilter('All');setSortBy('newest');}}>Clear filters</button></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Request / requester</th><th>Date</th><th>Branch</th><th>Department</th><th>System</th><th>System role</th><th>Status</th></tr></thead><tbody>{filtered.map(request=><tr key={request.id} onClick={()=>onOpen(request)} tabIndex={0} onKeyDown={event=>event.key==='Enter'&&onOpen(request)}><td><strong>{request.id}</strong><small>{request.name} · {requestTypeLabel(request.action)}</small></td><td>{request.createdAt?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'Asia/Dhaka'}).format(new Date(request.createdAt)):request.date}</td><td>{request.branch||'—'}</td><td>{departmentFor(request)}</td><td>{systemRolesFor(request).map(entry=>entry.system).join(', ')}</td><td>{systemRolesFor(request).map(entry=>entry.role).join(', ')}</td><td><Status>{requestStatusLabel(request)}</Status></td></tr>)}</tbody></table>{!filtered.length&&<p className="empty-state">No requests match these report filters.</p>}</div></section></section>;
}

