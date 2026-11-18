import { canReceiveCredentials, isNewUser } from './newUserWorkflow.js';
import React,{useEffect,useState} from 'react';
import {readyForFulfilment,fulfilmentItems,mockProcessingDrafts,credentialVisible} from './fulfilment.js';
import Icon from './Icon.jsx';
import EmailDraftCard from './EmailDraftCard.jsx';
import '../fulfilment.css';
const stamp=value=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'}).format(new Date(value));
export default function RequestFulfilment({ticket,profile,onAction,delivery,templates}){
 const [rows,setRows]=useState({});
 const [reveal,setReveal]=useState(false);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{if(!delivery)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[delivery]);
 const it=profile.role==='IT';
 const requester=ticket.requesterId===profile.employeeId||canReceiveCredentials(ticket,profile);
 const owner=canReceiveCredentials(ticket,profile);
 const final=readyForFulfilment(ticket);
 const emailSent=ticket.fulfilment?.emailSentAt;
 const drafts=it?(ticket.fulfilment?.emailDrafts||mockProcessingDrafts(ticket,templates)):[];
 const items=fulfilmentItems(ticket);
 if(!it&&!owner&&!requester)return null;
 if(!final&&ticket.state!=='Completed')return null;
 const update=(key,field,value)=>setRows(current=>({...current,[key]:{...current[key],[field]:value}}));
 const credentials=items.map(item=>({...item,username:rows[item.key]?.username||'',password:rows[item.key]?.password||''}));
 return <section className="fulfilment-panel"><header><span><Icon name="settings" size={20}/></span><div><p>IT FULFILMENT</p><h2>{ticket.state==='Completed'?'Request completed and ticket closed':final?(emailSent?'HO processing':'Processing'):'Prepare processing email'}</h2></div></header>
 {!final&&ticket.state!=='Completed'&&<p className="fulfilment-note">CITO approval is recorded. IT may prepare the draft; sending and fulfilment become available after final approval.</p>}
 {requester&&ticket.state!=='Completed'&&<p className="fulfilment-note">{final?'Your request is approved. IT is processing the requested systems. You will be notified here when completed.':'Your request is awaiting final approval.'}</p>}
 {it&&ticket.state!=='Completed'&&(!emailSent||ticket.fulfilment?.emailDrafts)&&<>
  <h3>Processing email drafts ({drafts.filter(draft=>draft.sentAt).length}/{drafts.length} sent)</h3>
  {drafts.map(draft=><EmailDraftCard key={draft.id} draft={draft} canSend={final&&!emailSent} onSent={(row,email)=>onAction('Email sent',{draftId:row.id,email})}/>)}
 </>}
 {emailSent&&<p className="fulfilment-note">Processing email marked sent by {ticket.fulfilment.emailSentBy} / {stamp(emailSent)}</p>}
 {it&&emailSent&&ticket.state!=='Completed'&&<form onSubmit={event=>{event.preventDefault();if(onAction('Fulfilled',{credentials}))setRows({});}}><h3>Provide system IDs / credentials</h3><p className="fulfilment-help">{isNewUser(ticket)?`The approving ${ticket.custodian?.role||'manager or head'}, ${ticket.custodian?.name||'not recorded'}, receives these IDs for custody and can view them for 24 hours.`:'The requester can view credentials for 24 hours after completion.'} Credentials are excluded from the ticket audit and submitted form.</p>{items.map(item=><fieldset key={item.key}><legend>{item.system} / {item.person}</legend><div className="fulfilment-email-addresses"><label>ID / email (required)<input required autoComplete="off" value={rows[item.key]?.username||''} onChange={e=>update(item.key,'username',e.target.value)}/></label><label>Temporary password (required)<input required type="password" autoComplete="new-password" value={rows[item.key]?.password||''} onChange={e=>update(item.key,'password',e.target.value)}/></label></div></fieldset>)}<button className="button button-primary" type="submit">{isNewUser(ticket)?'Hand IDs to custodian and close ticket':'Provide IDs and close ticket'}</button></form>}
 {isNewUser(ticket)&&ticket.state==='Completed'&&<p className="fulfilment-note">IDs handed to {ticket.fulfilment?.custodyRecipient?.name||ticket.custodian?.name||'the approving manager or department head'} for custody.</p>}
 {owner&&ticket.state==='Completed'&&<div className="credential-delivery">{credentialVisible(delivery,ticket,profile,now)?<><p className="fulfilment-note">Credentials are available until {stamp(delivery.expiresAt)}. Change temporary passwords when you sign in.</p><button className="button button-subtle" type="button" onClick={()=>setReveal(value=>!value)}>{reveal?'Hide credentials':'Show my credentials'}</button>{reveal&&delivery.rows.map(row=><div className="credential-row" key={row.key}><strong>{row.system} / {row.person}</strong><dl><dt>ID / email</dt><dd>{row.username}</dd><dt>Temporary password</dt><dd>{row.password}</dd></dl></div>)}</>:<p className="fulfilment-note">This request is completed. Credential viewing has expired or is unavailable in this session. Contact IT for assistance.</p>}</div>}
 </section>;
}
