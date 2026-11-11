import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { queriesForUser } from './queryInbox.js';

const timestamp=value=>value?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dhaka'}).format(new Date(value)):'Time unavailable';
export default function QueryInbox({requests,profile,onOpen}) {
  const [filter,setFilter]=useState('pending');
  const [selected,setSelected]=useState(null);
  const entries=queriesForUser(requests,profile.employeeId);
  const pending=entries.filter(item=>item.pending);
  const visible=filter==='pending'?pending:entries;
  const active=visible.find(item=>item.key===selected)||visible[0];
  return <section className="query-inbox" aria-label="Queries requiring your attention">
    <header className="query-inbox-heading"><span className="query-inbox-symbol"><Icon name="search" size={19}/></span><div><p>YOUR RESPONSE NEEDED</p><h2>Query inbox <b>{pending.length}</b></h2></div></header>
    <div className="query-inbox-tabs"><button type="button" aria-pressed={filter==='pending'} onClick={()=>setFilter('pending')}>Needs attention <b>{pending.length}</b></button><button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All queries <b>{entries.length}</b></button></div>
    {active?<><label className="query-inbox-picker">Ticket / query<select value={active.key} onChange={event=>setSelected(event.target.value)}>{visible.map(item=><option key={item.key} value={item.key}>{item.ticket.id} - {item.query.by} - {item.pending?'Reply needed':item.response?'Replied':'Closed'}</option>)}</select></label>
      <div className="query-inbox-content"><article className="query-inbox-ticket"><div><button type="button" onClick={()=>onOpen(active.ticket)}>{active.ticket.id}<Icon name="arrow" size={13}/></button><span className={active.pending?'query-needs-reply':'query-replied'}>{active.pending?'Reply needed':active.response?'Replied':'Closed'}</span></div><h3>{active.ticket.action}</h3><p>{active.ticket.name}</p><small>{active.ticket.system} / {active.ticket.branch}</small></article>
      <div className="query-inbox-message"><div className="query-sender"><strong>From {active.query.by}</strong><small>{active.query.role} / {timestamp(active.query.at)}</small></div><p>{active.query.message}</p></div>
      </div>
      <footer className="query-inbox-footer"><button type="button" className="button button-primary" onClick={()=>onOpen(active.ticket,active.pending)}>{active.pending?'Open ticket to reply':'Open ticket'}<Icon name="arrow" size={14}/></button></footer>
    </>:<div className="query-inbox-empty"><Icon name="check" size={28}/><h3>{filter==='pending'?'You are all caught up':'No queries yet'}</h3><p>{filter==='pending'?'No queries are waiting for your response.':'Queries addressed to you will appear here with ticket details and replies.'}</p></div>}
  </section>;
}
