import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';
import '../review-actions.css';

export default function ReviewActionDialog({ mode, recipients, onClose, onSubmit }) {
  const [recipient,setRecipient]=useState('');
  const [message,setMessage]=useState('');
  const dialog=useRef(null);
  const query=mode==='query',reject=mode==='reject';
  useEffect(()=>{
    const previous=document.activeElement;
    dialog.current?.querySelector('input,textarea')?.focus();
    return ()=>previous?.isConnected&&previous.focus();
  },[]);
  const submit=event=>{
    event.preventDefault();
    if(reject&&message.length>350)return;
    if(query&&(!recipient||!message.trim()||message.length>350))return;
    const result=query?onSubmit('Query',{targetIds:[recipient],message:message.trim()}):onSubmit(reject?'Rejected':'Approved',{remark:message.trim()||(reject?'Rejected':'Recommended')});
    if(result===true)onClose();
  };
  return createPortal(<div className="modal-scrim review-action-scrim" onMouseDown={event=>event.target===event.currentTarget&&onClose()}>
    <form ref={dialog} className={`request-modal review-action-dialog review-mode-${mode}`} role="dialog" aria-modal="true" aria-labelledby="review-action-title" onSubmit={submit} onKeyDown={event=>{
      if(event.key==='Escape'){event.preventDefault();onClose();}
      if(event.key==='Tab'){
        const fields=[...event.currentTarget.querySelectorAll('button:not(:disabled),input,textarea')];
        const first=fields[0],last=fields.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }}>
      <header className="modal-header"><span className="review-dialog-symbol"><Icon name={query?'mail':reject?'close':'check'} size={24}/></span><div><p className="review-dialog-eyebrow">REQUEST REVIEW</p><h2 id="review-action-title">{query?'Have a query?':reject?'Reject request':'Approve request'}</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={onClose}><Icon name="close"/></button></header>
      <p className="review-dialog-intro">{query?'Ask someone in this request’s approval chain for clarification.':reject?'Add a reason to help the requester understand your decision.':'Record your recommendation before continuing the approval flow.'}</p>
      {query?<><fieldset className="review-recipient-picker"><legend>Send query to <span>{recipients.length} available</span></legend><div className="review-recipient-list">{recipients.map(user=><label className={`review-recipient${recipient===user.employeeId?' is-selected':''}`} key={user.employeeId}><input type="radio" name="query-recipient" required checked={recipient===user.employeeId} value={user.employeeId} onChange={()=>{setRecipient(user.employeeId);setMessage('');}}/><span className="review-recipient-avatar" aria-hidden="true">{user.name.split(' ').map(part=>part[0]).slice(0,2).join('')}</span><span className="review-recipient-copy"><strong>{user.name}</strong><small>{user.role} · {user.employeeId}</small></span><Icon name="check" size={17}/></label>)}</div></fieldset>{!recipients.length&&<p className="modal-subtitle">No lower-level users are available.</p>}{recipient&&<label className="field-label review-query-field">Your query<textarea autoFocus rows="4" required maxLength={350} value={message} onChange={event=>setMessage(event.target.value)} placeholder="What would you like to clarify?"/><small className="review-query-count">{message.length} / 350 characters</small></label>}</>:<><label className="field-label">{reject?'Reason for rejection':'Recommendation / justification'}<textarea rows="5" maxLength={reject?350:undefined} value={message} onChange={event=>setMessage(event.target.value)} placeholder={reject?'Enter a reason':'Recommended'}/>{reject&&<small className="review-query-count">{message.length} / 350 characters</small>}</label>{!reject&&<p className="review-default-note">{message.trim()?`Recommendation: ${message.trim()}`:'No remarks entered. “Recommended” will be recorded with your approval.'}</p>}</>}
      <footer className="modal-actions"><Button type="button" variant="subtle" onClick={onClose}>Cancel</Button><button type="submit" className={`button ${query?'button-primary':reject?'review-reject':'review-approve'}`} disabled={query&&(!recipient||!message.trim())}><Icon name={query?'mail':reject?'close':'check'} size={17}/>{query?'Send query':reject?'Reject':'Approve'}</button></footer>
    </form>
  </div>,document.querySelector('.app-shell')||document.body);
}
