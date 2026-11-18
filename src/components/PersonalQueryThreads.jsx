import {requestTypeLabel} from './requestTitle.js';
import React,{useState} from 'react';
import {queriesForUser,queriesRaisedBy} from './queryInbox.js';
import {Button} from './UI.jsx';
import {auditTimestamp} from './auditLog.js';
import '../personal-query-threads.css';

function QueryThread({entry,mode,onReply,onOpen,users,profile}) {
 const [editing,setEditing]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const {ticket,query}=entry;
 const responses=(query.responses||[]).filter(response=>mode==='mine'||response.employeeId===profile.employeeId);
 const recipients=(query.targetIds||[]).map(id=>users.find(user=>user.employeeId===id)?.name||id);
 return <article className="personal-query-thread">
  <header><span><strong>{ticket.id} · {requestTypeLabel(ticket.action)}</strong><small>{mode==='mine'?'Asked by you':`From ${query.by||'Reviewer'}`} · {auditTimestamp(query.at)}</small></span><Button variant="subtle" type="button" onClick={()=>onOpen(ticket)}>View ticket</Button></header>
  <p className="personal-query-recipient">To: {mode==='mine'?recipients.join(', ')||'Recorded recipient':profile.name}</p>
  <div className="personal-query-question"><strong>Original query</strong><p>{query.message||'Query text was not recorded.'}</p></div>
  {responses.map((response,index)=><div className="personal-query-response" key={`${response.employeeId}:${index}`}><strong>{mode==='mine'?`Reply from ${response.responseBy||response.employeeId}`:'Your reply'}</strong><small>{auditTimestamp(response.responseAt)}</small><p>{response.response}</p></div>)}
  {!responses.length&&<p className="personal-query-waiting">{mode==='mine'?'No replies received yet.':entry.pending?'This query is awaiting your reply.':'No reply recorded from you.'}</p>}
  {mode==='received'&&entry.pending&&(!editing?<Button type="button" onClick={()=>setEditing(true)}>Reply to {query.by||'sender'}</Button>:<form onSubmit={event=>{event.preventDefault();const result=onReply(ticket,entry.index,message);if(result===true){setEditing(false);setMessage('');setError('');}else setError('This query is no longer awaiting your response. Refresh the queue and try again.');}}><label>Your response<textarea required rows="3" value={message} onChange={event=>setMessage(event.target.value)}/></label>{error&&<p role="alert">{error}</p>}<div><Button type="submit" disabled={!message.trim()}>Send reply</Button><Button type="button" variant="subtle" onClick={()=>setEditing(false)}>Cancel</Button></div></form>)}
 </article>;
}

export default function PersonalQueryThreads({rows,mode,profile,users,onReply,onOpen}) {
 const entries=(mode==='mine'?queriesRaisedBy(rows,profile):queriesForUser(rows,profile.employeeId)).sort((a,b)=>String(b.query.at||'').localeCompare(String(a.query.at||'')));
 return <div className="personal-query-threads">{entries.length?entries.map(entry=><QueryThread key={`${mode}:${entry.key}`} entry={entry} mode={mode} profile={profile} users={users} onReply={onReply} onOpen={onOpen}/>):<p className="empty-state">No {mode==='mine'?'queries raised by you':'queries addressed to you'} match this view.</p>}</div>;
}
