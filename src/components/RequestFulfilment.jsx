import React,{useEffect,useState} from 'react';
import {readyForFulfilment,fulfilmentItems,processingEmail,credentialVisible} from './fulfilment.js';
import Icon from './Icon.jsx';
import '../fulfilment.css';
const stamp=value=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'}).format(new Date(value));
export default function RequestFulfilment({ticket,profile,onAction,delivery}){
 const [draft,setDraft]=useState(()=>ticket.fulfilment?.email||processingEmail(ticket));
 const [opened,setOpened]=useState(false);
 const [sent,setSent]=useState(false);
 const [rows,setRows]=useState({});
 const [reveal,setReveal]=useState(false);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{if(!delivery)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[delivery]);
 const it=profile.role==='IT';
 const owner=ticket.requesterId===profile.employeeId;
 const final=readyForFulfilment(ticket);
 const emailSent=ticket.fulfilment?.emailSentAt;
 const items=fulfilmentItems(ticket);
 if(!it&&!owner)return null;
 if(!final&&ticket.state!=='Completed')return null;
 const update=(key,field,value)=>setRows(current=>({...current,[key]:{...current[key],[field]:value}}));
 const credentials=items.map(item=>({...item,username:rows[item.key]?.username||'',password:rows[item.key]?.password||''}));
 return <section className="fulfilment-panel"><header><span><Icon name="settings" size={20}/></span><div><p>IT FULFILMENT</p><h2>{ticket.state==='Completed'?'Request completed and ticket closed':final?'ID creation in progress':'Prepare processing email'}</h2></div></header>
 {!final&&ticket.state!=='Completed'&&<p className="fulfilment-note">CITO approval is recorded. IT may prepare the draft; sending and fulfilment become available after final approval.</p>}
 {owner&&ticket.state!=='Completed'&&<p className="fulfilment-note">{final?'Your request is approved. IT is processing the requested systems. You will be notified here when completed.':'Your request is awaiting final approval.'}</p>}
 {it&&ticket.state!=='Completed'&&!emailSent&&<form onSubmit={event=>{event.preventDefault();if(final&&opened&&sent)onAction('Email sent',{email:draft});}}><h3>Processing email draft</h3><div className="fulfilment-email-addresses"><label>To (required)<input type="email" multiple required value={draft.to} onChange={e=>{setDraft({...draft,to:e.target.value});setOpened(false);setSent(false);}} placeholder="Processing team email"/></label><label>CC<input type="email" multiple value={draft.cc} onChange={e=>setDraft({...draft,cc:e.target.value})}/></label></div><label>Subject<input required value={draft.subject} onChange={e=>setDraft({...draft,subject:e.target.value})}/></label><label>Body<textarea rows="8" required value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label><div className="fulfilment-buttons"><button className="button button-subtle" type="button" onClick={()=>{navigator.clipboard?.writeText(`To: ${draft.to}
CC: ${draft.cc}
Subject: ${draft.subject}

${draft.body}`);}}>Copy draft</button><button className="button button-primary" type="button" disabled={!final||!draft.to.trim()||!draft.subject.trim()||!draft.body.trim()} onClick={event=>{if(!event.currentTarget.form.reportValidity())return;window.location.href=`mailto:${encodeURIComponent(draft.to)}?cc=${encodeURIComponent(draft.cc)}&subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;setOpened(true);}}>Open email client</button></div>{opened&&<label className="fulfilment-consent"><input type="checkbox" checked={sent} onChange={e=>setSent(e.target.checked)}/>I confirm I have sent this processing email.</label>}<button type="submit" className="button button-primary" disabled={!final||!opened||!sent}>Mark email sent</button><small className="fulfilment-help">Opening the mail client does not send the email. Confirm only after sending it.</small></form>}
 {emailSent&&<p className="fulfilment-note">Processing email marked sent by {ticket.fulfilment.emailSentBy} / {stamp(emailSent)}</p>}
 {it&&emailSent&&ticket.state!=='Completed'&&<form onSubmit={event=>{event.preventDefault();if(onAction('Fulfilled',{credentials}))setRows({});}}><h3>Provide system IDs / credentials</h3><p className="fulfilment-help">The requester can view credentials for 24 hours after completion. Credentials are excluded from the ticket audit and submitted form.</p>{items.map(item=><fieldset key={item.key}><legend>{item.system} / {item.person}</legend><div className="fulfilment-email-addresses"><label>ID / email (required)<input required autoComplete="off" value={rows[item.key]?.username||''} onChange={e=>update(item.key,'username',e.target.value)}/></label><label>Temporary password (required)<input required type="password" autoComplete="new-password" value={rows[item.key]?.password||''} onChange={e=>update(item.key,'password',e.target.value)}/></label></div></fieldset>)}<button className="button button-primary" type="submit">Provide IDs and close ticket</button></form>}
 {owner&&ticket.state==='Completed'&&<div className="credential-delivery">{credentialVisible(delivery,ticket,profile,now)?<><p className="fulfilment-note">Credentials are available until {stamp(delivery.expiresAt)}. Change temporary passwords when you sign in.</p><button className="button button-subtle" type="button" onClick={()=>setReveal(value=>!value)}>{reveal?'Hide credentials':'Show my credentials'}</button>{reveal&&delivery.rows.map(row=><div className="credential-row" key={row.key}><strong>{row.system} / {row.person}</strong><dl><dt>ID / email</dt><dd>{row.username}</dd><dt>Temporary password</dt><dd>{row.password}</dd></dl></div>)}</>:<p className="fulfilment-note">This request is completed. Credential viewing has expired or is unavailable in this session. Contact IT for assistance.</p>}</div>}
 </section>;
}
