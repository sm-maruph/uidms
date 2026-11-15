import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { queriesForUser } from './queryInbox.js';
import '../floating-query-chat.css';

export default function FloatingQueryChat({ requests, profile, onOpen }) {
  const [expanded,setExpanded]=useState(false);
  const [announce,setAnnounce]=useState(false);
  const container=useRef(null);
  const pending=queriesForUser(requests,profile.employeeId).filter(entry=>entry.pending);
  const latest=pending[0];
  const notificationKey=latest?`${profile.employeeId}:${latest.key}:${latest.query.at||''}`:'';
  useEffect(()=>{
    setExpanded(false);
    if(!notificationKey){setAnnounce(false);return;}
    setAnnounce(true);
    const timer=setTimeout(()=>setAnnounce(false),8000);
    return ()=>clearTimeout(timer);
  },[notificationKey]);
  useEffect(()=>{
    if(!expanded)return;
    const dismiss=event=>{if(!container.current?.contains(event.target))setExpanded(false);};
    document.addEventListener('pointerdown',dismiss);
    return ()=>document.removeEventListener('pointerdown',dismiss);
  },[expanded]);
  if(!latest)return null;
  return <div ref={container} className={`floating-query-chat${announce?' is-announcing':''}`} onKeyDown={event=>{if(event.key==='Escape'){setExpanded(false);container.current?.querySelector('.floating-query-trigger')?.focus();}}}>
    {expanded&&<section className="floating-query-panel" aria-label="Queries waiting for your reply"><header><div><small>YOUR RESPONSE NEEDED</small><h3>Query messages <b>{pending.length}</b></h3></div><button type="button" className="icon-button" aria-label="Close query messages" onClick={()=>setExpanded(false)}><Icon name="close"/></button></header><div className="floating-query-list">{pending.map(entry=><button type="button" key={entry.key} onClick={()=>{setExpanded(false);setAnnounce(false);onOpen(entry.ticket);}}><span className="floating-query-avatar"><Icon name="mail" size={17}/></span><span><strong>{entry.query.by||'Reviewer'}</strong><small>{entry.ticket.id} · {entry.query.role}</small><p>{entry.query.message}</p></span><Icon name="chevron" size={16}/></button>)}</div></section>}
    <div className="floating-query-launcher"><button type="button" className="floating-query-caption" onClick={()=>{setAnnounce(false);onOpen(latest.ticket);}} tabIndex={announce?0:-1}><strong>Query from {latest.query.by||'Reviewer'}</strong><small>{latest.ticket.id} · Reply needed</small></button><button type="button" className="floating-query-trigger" aria-label={`${pending.length} queries waiting for your reply`} aria-expanded={expanded} onClick={()=>{setExpanded(value=>!value);setAnnounce(false);}}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-4 3v-11a9 9 0 0 1 19 0Z" transform="translate(1 -1) scale(.95)"/><path d="M7 10h10M7 14h6"/></svg><b>{pending.length}</b></button></div>
    <span className="floating-query-sr" role="status">Query from {latest.query.by}, ticket {latest.ticket.id}, waiting for your reply.</span>
  </div>;
}
