import React from 'react';
import Icon from './Icon.jsx';
import '../approval-workflow.css';

const normalize=value=>String(value||'').toLowerCase().replace(/\s+(review|final approval)$/,'').trim();
const timestamp=value=>value?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'';
export default function ApprovalWorkflow({ ticket, flow, users }) {
  const eventFor=stage=>(ticket.approvalHistory||[]).find(event=>normalize(event.stage)===normalize(stage)||normalize(event.role)===normalize(stage));
  const owner=ticket.assignedRole||(ticket.state==='Query'?ticket.queryReturnRole:null);
  const rejectedIndex=flow.findIndex(stage=>eventFor(stage)?.status==='Rejected');
  const approvalStages=flow.map((stage,index)=>{
    const event=eventFor(stage);
    const isOwner=normalize(owner)===normalize(stage);
    const state=stage==='Requester'?'done':event?.status==='Rejected'?'rejected':event?.status==='Approved'?'done':ticket.state==='Query'&&isOwner?'query':isOwner&&!['Approved','Rejected','In progress','Completed'].includes(ticket.state)?'active':rejectedIndex>=0&&index>rejectedIndex?'stopped':'upcoming';
    const approver=stage==='Requester'?ticket.name:event?.by||users.find(user=>user.role===stage&&(stage!=='Branch manager'||user.branch===ticket.branch))?.name;
    return {stage,event,state,approver};
  });
  const approved=['Approved','In progress','Completed'].includes(ticket.state);
  const closed=ticket.state==='Completed';
  const stages=[...approvalStages,
    {stage:'IT fulfilment',state:closed?'done':approved?'active':ticket.state==='Rejected'?'stopped':'upcoming',approver:ticket.fulfilment?.emailSentBy||users.find(user=>user.role==='IT')?.name,event:ticket.fulfilment?.emailSentAt?{at:ticket.fulfilment.emailSentAt}:null},
    {stage:'Ticket closed',state:closed?'done':ticket.state==='Rejected'?'stopped':'upcoming',approver:ticket.fulfilment?.completedBy,event:closed?{at:ticket.fulfilment?.completedAt}:null},
  ];
  const completed=stages.filter(stage=>stage.state==='done').length;
  const current=stages.find(stage=>['active','query','rejected'].includes(stage.state));
  const label=ticket.state==='Completed'?'Request completed - ticket closed':['Approved','In progress'].includes(ticket.state)?'Approved - ID creation in progress':ticket.state==='Rejected'?'Request rejected':ticket.state==='Query'?'Awaiting query response':current?`Waiting for ${current.stage}`:'Awaiting approval';
  const labels={done:'Completed',rejected:'Rejected',query:'Query raised',active:'Awaiting approval',upcoming:'Upcoming',stopped:'Not reached'};
  return <section className="approval-workflow" aria-labelledby="approval-workflow-title">
    <header className="aw-header"><div><p>APPROVAL JOURNEY</p><h3 id="approval-workflow-title">Approval workflow</h3></div><span className={`aw-state aw-state-${ticket.state.toLowerCase().replace(' ','-')}`}><i/>{label}</span></header>
    <div className="aw-progress-meta"><span>{completed} of {stages.length} stages complete</span><strong>{Math.round(completed/stages.length*100)}%</strong></div>
    <div className="aw-progress" role="progressbar" aria-label="Completed approval stages" aria-valuemin={0} aria-valuemax={stages.length} aria-valuenow={completed}><span style={{width:`${completed/stages.length*100}%`}}/></div>
    <ol className="aw-stages" style={{'--aw-columns':stages.length}}>{stages.map(({stage,event,state,approver},index)=><li key={`${ticket.id}-${stage}-${state}`} className={`aw-stage aw-${state}`} style={{'--aw-delay':`${index*65}ms`}} aria-current={['active','query'].includes(state)?'step':undefined}>
      <div className="aw-track"><span className="aw-node">{state==='done'?<Icon name="check" size={18}/>:state==='rejected'?<Icon name="close" size={18}/>:state==='query'?<Icon name="mail" size={17}/>:state==='active'?<Icon name="clock" size={18}/>:String(index+1).padStart(2,'0')}</span>{index<stages.length-1&&<span className="aw-connector"><i/></span>}</div>
      <div className="aw-stage-copy"><span className="aw-stage-label">{stage==='Requester'?'Submitted':stage==='IT fulfilment'?'ID creation in progress':stage==='Ticket closed'?'IDs provided / Ticket closed':stage}</span><strong>{approver||'Assigned by role'}</strong><span className="aw-stage-status">{stage==='IT fulfilment'&&state==='active'?'IT processing':labels[state]}</span><time dateTime={stage==='Requester'?ticket.createdAt:event?.at}>{timestamp(stage==='Requester'?ticket.createdAt:event?.at)||(['active','query'].includes(state)?'Action required':'—')}</time>{event?.remark&&<p className="aw-remark">{event.remark}</p>}</div>
    </li>)}</ol>
    {ticket.state==='Query'&&<div className="aw-query-note"><Icon name="mail" size={16}/><p>Approval is paused while <strong>{ticket.queryHistory?.at(-1)?.targetNames?.join(', ')||'the requested employees'}</strong> respond. It will return to <strong>{ticket.queryReturnRole||'the reviewer'}</strong>.</p></div>}
    {approved&&!closed&&<div className="aw-query-note"><Icon name="settings" size={16}/><p>Your request is approved. <strong>ID creation is in progress.</strong> You will be notified here when completed.</p></div>}
    {closed&&<div className="aw-query-note"><Icon name="check" size={16}/><p>IDs have been provided. This request is completed and the ticket is closed.</p></div>}
    {ticket.state==='Rejected'&&<div className="aw-query-note aw-rejected-note"><Icon name="close" size={16}/><p>This request was rejected. Later approval stages will not proceed.</p></div>}
  </section>;
}
