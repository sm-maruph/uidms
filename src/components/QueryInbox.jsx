import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { queryInboxGroups } from './queryInbox.js';

const timestamp=value=>value?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dhaka'}).format(new Date(value)):'Time unavailable';
export default function QueryInbox({requests,profile,onOpen}) {
  const [filter,setFilter]=useState('query');
  const [selected,setSelected]=useState(null);
  const groups=queryInboxGroups(requests,profile);
  const pending=groups.query.filter(item=>item.pending);
  const visible=groups[filter];
  const status=item=>item.pending?'Reply needed':item.response?'Replied':item.sent?'Awaiting response':'Closed';
  const active=visible.find(item=>item.key===selected)||visible[0];
  return <section className="query-inbox" aria-label="Queries requiring your attention">
    <header className="query-inbox-heading"><span className="query-inbox-symbol"><Icon name="search" size={19}/></span><div><p>YOUR RESPONSE NEEDED</p><h2>Query inbox <b>{pending.length}</b></h2></div></header>
    <div className="query-inbox-tabs">{[['query','Query'],['response','Response'],['all','All']].map(([key,label])=><button key={key} type="button" aria-pressed={filter===key} onClick={()=>{setFilter(key);setSelected(null);}}>{label} <b>{groups[key].length}</b></button>)}</div>
    {active?<><label className="query-inbox-picker">Ticket / query<select value={active.key} onChange={event=>setSelected(event.target.value)}>{visible.map(item=><option key={item.key} value={item.key}>{item.ticket.id} - {item.query.by} - {status(item)}</option>)}</select></label>
      <div className="query-inbox-content"><article className="query-inbox-ticket"><div><button type="button" onClick={()=>onOpen(active.ticket)}>{active.ticket.id}<Icon name="arrow" size={13}/></button><span className={active.pending?'query-needs-reply':'query-replied'}>{status(active)}</span></div><h3>{active.ticket.action}</h3><p>{active.ticket.name}</p><small>{active.ticket.system} / {active.ticket.branch}</small></article>
      <div className="query-inbox-message"><div className="query-sender"><strong>From {active.query.by}</strong><small>{active.query.role} / {timestamp(active.query.at)}</small></div><p>{active.query.message}</p></div>
      {(active.query.responses||[]).map((reply,index)=><div className="query-inbox-response" key={`${reply.employeeId}:${index}`}><strong>Response from {reply.responseBy||reply.employeeId}</strong><small>{reply.role} / {timestamp(reply.responseAt)}</small><p>{reply.response}</p></div>)}
      </div>
      <footer className="query-inbox-footer"><button type="button" className="button query-inbox-view-ticket" onClick={()=>onOpen(active.ticket,false)}><Icon name="idCard" size={14}/>View ticket</button>{active.pending&&<button type="button" className="button button-primary query-inbox-reply" onClick={()=>onOpen(active.ticket,true)}><span>Reply to {active.query.by||'query sender'}</span><Icon name="arrow" size={14}/></button>}</footer>
    </>:<div className="query-inbox-empty"><Icon name="check" size={28}/><h3>{filter==='response'?'No responses yet':'No queries yet'}</h3><p>{filter==='response'?'Queries you raise and their responses will appear here.':'Your queries and responses will appear here with ticket details.'}</p></div>}
  </section>;
}
