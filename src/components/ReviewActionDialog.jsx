import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';
import {reviewRequestSummary} from './reviewActions.js';
import '../review-actions.css';

export default function ReviewActionDialog({ mode, ticket, recipients=[], onClose, onSubmit }) {
  const [recipient,setRecipient]=useState('');
  const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const dialog=useRef(null),saving=useRef(false);
  const query=mode==='query',reject=mode==='reject',recommend=mode==='recommend';
 const defaultRemark=reject?'Rejected':recommend?'Recommended':'Approved';
 const close=()=>{if(!saving.current)onClose();};
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    dialog.current?.querySelector(query?'input,textarea,button':'button')?.focus();
    const escape=event=>{if(event.key==='Escape'&&!event.defaultPrevented&&!saving.current){event.preventDefault();onClose();}};
    document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('keydown',escape);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
  },[]);
  const submit=async event=>{
    event.preventDefault();if(saving.current)return;
    if(reject&&message.length>350)return;
    if(query&&(!recipient||!message.trim()||message.length>350))return;
    if(!query&&!reject&&message.length>2000)return;
    saving.current=true;setBusy(true);setError('');
    try{
      const result=await (query?onSubmit('Query',{targetIds:[recipient],message:message.trim()}):onSubmit(reject?'Rejected':'Approved',{remark:message.trim()||defaultRemark}));
      if(result===true)onClose();else if(result===false)setError('Your decision was not saved. Check the notification and try again.');
    }catch(error){setError(error.message||'Your decision could not be saved. Try again.');}finally{saving.current=false;setBusy(false);}
  };
  return createPortal(<div className="modal-scrim review-action-scrim" onMouseDown={event=>event.target===event.currentTarget&&close()}>
    <form ref={dialog} className={`request-modal review-action-dialog review-mode-${mode}`} role="dialog" aria-modal="true" aria-busy={busy} aria-labelledby="review-action-title" onSubmit={submit} onKeyDown={event=>{
      if(event.key==='Escape'){event.preventDefault();close();}
      if(event.key==='Tab'){
        const fields=[...event.currentTarget.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)')];
        const first=fields[0],last=fields.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }}>
      <header className="modal-header"><span className="review-dialog-symbol"><Icon name={query?'mail':reject?'close':'check'} size={24}/></span><div><p className="review-dialog-eyebrow">REQUEST REVIEW</p><h2 id="review-action-title">{query?'Have a query?':reject?'Reject request':recommend?'Recommend request':'Approve request'}</h2></div><button type="button" className="icon-button" aria-label="Close" disabled={busy} onClick={close}><Icon name="close"/></button></header>
      <p className="review-dialog-intro">{query?'Ask someone in this request’s approval chain for clarification.':reject?'Add a reason to help the requester understand your decision.':recommend?'Review the request summary and recommend it to the next approver.':'Review the request summary and give the final approval.'}</p>
      {!query&&!reject&&ticket&&<ReviewRequestSummary ticket={ticket}/>}
      {query?<><fieldset className="review-recipient-picker"><legend>Send query to <span>{recipients.length} available</span></legend><div className="review-recipient-list">{recipients.map(user=><label className={`review-recipient${recipient===user.employeeId?' is-selected':''}`} key={user.employeeId}><input type="radio" name="query-recipient" required disabled={busy} checked={recipient===user.employeeId} value={user.employeeId} onChange={()=>{setRecipient(user.employeeId);setMessage('');}}/><span className="review-recipient-avatar" aria-hidden="true">{user.name.split(' ').map(part=>part[0]).slice(0,2).join('')}</span><span className="review-recipient-copy"><strong>{user.name}</strong><small>{user.role} · {user.employeeId}</small></span><Icon name="check" size={17}/></label>)}</div></fieldset>{!recipients.length&&<p className="modal-subtitle">No lower-level users are available.</p>}{recipient&&<label className="field-label review-query-field">Your query<textarea autoFocus rows="4" required disabled={busy} maxLength={350} value={message} onChange={event=>setMessage(event.target.value)} placeholder="What would you like to clarify?"/><small className="review-query-count">{message.length} / 350 characters</small></label>}</>:<><label className="field-label">{reject?'Reason for rejection':'Remarks (optional)'}<textarea rows="3" disabled={busy} maxLength={reject?350:2000} value={message} onChange={event=>setMessage(event.target.value)} placeholder={reject?'Enter a reason':defaultRemark}/>{reject&&<small className="review-query-count">{message.length} / 350 characters</small>}</label>{!reject&&<p className="review-default-note">{message.trim()?'Your remarks will be recorded with this decision.':`No remarks entered. “${defaultRemark}” will be recorded.`}</p>}</>}
      {error&&<p className="review-submit-error" role="alert">{error}</p>}
      <footer className="modal-actions"><Button type="button" variant="subtle" disabled={busy} onClick={close}>Cancel</Button><button type="submit" className={`button ${query?'button-primary':reject?'review-reject':'review-approve'}`} disabled={busy||query&&(!recipient||!message.trim())}><Icon name={query?'mail':reject?'close':'check'} size={17}/>{busy?'Saving…':query?'Send query':reject?'Reject':recommend?'Recommended':'Approve'}</button></footer>
    </form>
  </div>,document.querySelector('.app-shell')||document.body);
}

function ReviewRequestSummary({ticket}){
 const summary=reviewRequestSummary(ticket);
 return <section className="review-request-summary" aria-labelledby="review-request-summary-title"><h3 id="review-request-summary-title">Request summary</h3><dl>{summary.fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
 {summary.employees.length>0&&<div className="review-summary-employees">{summary.employees.map((person,index)=><p key={index}><strong>{person.name||'New employee'}{person.employeeId?` · ${person.employeeId}`:''}</strong><span>{[person.branch,person.department,person.adRole].filter(Boolean).join(' · ')}</span>{person.email&&<span>Preferred email: {person.email}</span>}{person.software&&<span>Software: {person.software}</span>}</p>)}</div>}
 <h4>Requested services</h4><ul>{summary.items.map((item,index)=><li key={index}><strong>{item.system}</strong><span>{[item.person,item.employeeId,item.role,item.operation].filter(Boolean).join(' · ')}</span></li>)}</ul>{summary.justification&&<div className="review-summary-justification"><h4>Business justification</h4><p>{summary.justification}</p></div>}</section>;
}
