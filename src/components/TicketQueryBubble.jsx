import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';
import { queriesForUser } from './queryInbox.js';
import '../ticket-query-bubble.css';

function QueryPopup({ entry, reply, responder, onClose, onReply }) {
  const popup=useRef(null);
  const [response,setResponse]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{
    const previous=document.activeElement;
    popup.current?.querySelector('button')?.focus();
    return ()=>previous?.isConnected&&previous.focus();
  },[]);
  const query=entry.query;
  const sender=reply?.responseBy||query.by||'Reviewer';
  const sentAt=reply?.responseAt||query.at;
  const time=sentAt?new Intl.DateTimeFormat('en-BD',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'}).format(new Date(sentAt)):'';
  return createPortal(<div className="modal-scrim review-action-scrim" onMouseDown={event=>event.target===event.currentTarget&&onClose()}>
    <section ref={popup} className="request-modal review-action-dialog received-query-dialog" role="dialog" aria-modal="true" aria-labelledby="received-query-title" onKeyDown={event=>{
      if(event.key==='Escape'){event.preventDefault();onClose();}
      if(event.key==='Tab'){
        const fields=[...event.currentTarget.querySelectorAll('button:not(:disabled),textarea')];
        if(event.shiftKey&&document.activeElement===fields[0]){event.preventDefault();fields.at(-1)?.focus();}
        else if(!event.shiftKey&&document.activeElement===fields.at(-1)){event.preventDefault();fields[0]?.focus();}
      }
    }}>
      <header className="modal-header"><span className="review-dialog-symbol"><Icon name="mail" size={24}/></span><div><p className="review-dialog-eyebrow">{reply?'QUERY RESPONSE':'YOUR RESPONSE NEEDED'}</p><h2 id="received-query-title">{reply?'Reply received':'Query received'}</h2></div><button type="button" className="icon-button" aria-label="Close query" onClick={onClose}><Icon name="close"/></button></header>
      <div className="received-query-sender"><span className="review-recipient-avatar" aria-hidden="true">{sender.split(' ').map(part=>part[0]).slice(0,2).join('')}</span><div><small>{reply?'Replied by':'Sent by'}</small><strong>{sender}</strong><span>{reply?responder?.role:query.role}{time&&` · ${time}`}</span></div></div>
      {reply&&<><dl className="query-response-profile">{[['Employee ID',responder?.employeeId||reply.employeeId],['Designation',responder?.designation],['Department',responder?.department],['Branch',responder?.branch]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><small className="query-reply-recipient">Reply to {query.by} · {query.role}</small><p className="received-query-original">{query.message}</p></>}
      <p className="received-query-message">{reply?reply.response:query.message}</p>
      <p className="review-dialog-intro">{entry.ticket.id} · {entry.ticket.action}</p>
      {reply?<footer className="modal-actions"><Button type="button" variant="subtle" onClick={onClose}>Close</Button></footer>:<form onSubmit={event=>{event.preventDefault();if(!response.trim())return;if(onReply(response.trim())!==true)setError('Your response could not be sent. Please check the query is still awaiting your reply.');}}>
        <label className="field-label">Reply to {query.by||'query sender'}<textarea required rows="4" value={response} onChange={event=>{setResponse(event.target.value);setError('');}} placeholder="Write your response here"/></label>
        {error&&<p className="form-error" role="alert">{error}</p>}
        <footer className="modal-actions"><Button type="button" variant="subtle" onClick={onClose}>Close</Button><Button type="submit" icon="mail" disabled={!response.trim()}>Send response</Button></footer>
      </form>}
    </section>
  </div>,document.querySelector('.app-shell')||document.body);
}

export default function TicketQueryBubble({ ticket, profile, users=[], onReply, autoOpen=false }) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{if(autoOpen)setOpen(true);},[autoOpen,ticket.id]);
  const pending=queriesForUser([ticket],profile?.employeeId).filter(entry=>entry.pending);
  const replies=(ticket.queryHistory||[]).filter(query=>query.by===profile?.name&&query.role===profile?.role).flatMap(query=>(query.responses||[]).map(reply=>({query,reply,ticket}))).sort((a,b)=>String(b.reply.responseAt||'').localeCompare(String(a.reply.responseAt||'')));
  const entry=pending[0]||replies[0];
  const reply=pending.length?null:entry?.reply;
  if(!entry)return null;
  const responder=reply?users.find(user=>user.employeeId===reply.employeeId):null;
  return <div className="ticket-query-notice">
    <button type="button" className="ticket-query-bubble" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open}><span className="ticket-query-bubble-icon"><Icon name="mail" size={19}/><b>{reply?replies.length:pending.length}</b></span><span><strong>{reply?'Reply received':'Query received'}</strong><small>From {reply?reply.responseBy:entry.query.by||'your reviewer'} · View message</small></span><Icon name="chevron" size={17}/></button>
    <span className="ticket-query-announcement" role="status">{reply?`Reply received from ${reply.responseBy}.`:`A query from ${entry.query.by||'your reviewer'} needs your response.`}</span>
    {open&&<QueryPopup entry={entry} reply={reply} responder={responder} onClose={()=>setOpen(false)} onReply={message=>{const result=onReply(message);if(result===true)setOpen(false);return result;}}/>}
  </div>;
}
