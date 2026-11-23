import React,{useState} from 'react';
import '../fulfilment.css';
import {mergeProcessingCc,requiredProcessingCc} from './processingRecipients.js';

export const emailAddresses=value=>value.split(',').map(address=>address.trim()).filter(Boolean);
const formatAddress=value=>Array.isArray(value)?value.join(', '):value||'';

export default function EmailDraftCard({draft,canSend,onSent,requesterEmail}){
 const requiredCc=mergeProcessingCc(draft.requiredCc||requiredProcessingCc(requesterEmail),requiredProcessingCc());
 const [email,setEmail]=useState({to:formatAddress(draft.to),cc:mergeProcessingCc(draft.cc,requiredCc).join(', '),subject:draft.subject,body:draft.body});
 const outgoing={...email,cc:mergeProcessingCc(email.cc,requiredCc).join(', ')};
 const [opened,setOpened]=useState(false);
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const field=(key,value)=>{setEmail(current=>({...current,[key]:value}));setOpened(false);setConfirmed(false);};
 const copy=async()=>{
  try{await navigator.clipboard.writeText(`To: ${outgoing.to}\nCC: ${outgoing.cc}\nSubject: ${outgoing.subject}\n\n${outgoing.body}`);setFeedback('Draft copied.');}
  catch{setFeedback('Copy is unavailable. Select and copy the draft fields manually.');}
 };
 const open=event=>{
  if(!event.currentTarget.form.reportValidity())return;
  const params=new URLSearchParams({view:'cm',fs:'1',to:outgoing.to,cc:outgoing.cc,su:outgoing.subject,body:outgoing.body});
  window.open(`https://mail.google.com/mail/?${params}`,'_blank','noopener,noreferrer');
  setOpened(true);
 };
 if(draft.sentAt)return <article className="email-draft-card"><h3>{draft.name}</h3><p>{draft.systems?.join(', ')}</p><p>Sent confirmation by {draft.sentBy} · {new Date(draft.sentAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'})}</p></article>;
 return <form className="email-draft-card" onSubmit={async event=>{
  event.preventDefault();
  if(!canSend||!confirmed||busy)return;
  setBusy(true);setFeedback('');
  try{await onSent(draft,{...outgoing,to:emailAddresses(outgoing.to),cc:emailAddresses(outgoing.cc)});}catch(error){setFeedback(error.message);}finally{setBusy(false);}
 }}>
  <h3>{draft.name}</h3>{draft.systems?.length>0&&<p>{draft.systems.join(', ')}</p>}
  <fieldset disabled={busy}>
   <div className="fulfilment-email-addresses"><label>To<input type="email" multiple required value={email.to} onChange={event=>field('to',event.target.value)}/></label><label>CC<input type="email" multiple value={email.cc} onChange={event=>field('cc',event.target.value)} onBlur={()=>setEmail(current=>({...current,cc:mergeProcessingCc(current.cc,requiredCc).join(', ')}))}/></label></div>
   <label>Subject<input required value={email.subject} onChange={event=>field('subject',event.target.value)}/></label>
   <label>Body<textarea rows="8" required value={email.body} onChange={event=>field('body',event.target.value)}/></label>
   <div className="fulfilment-buttons"><button type="button" className="button button-subtle" onClick={copy}>Copy draft</button><button type="button" className="button button-primary" disabled={!canSend} onClick={open}>Open Gmail</button>{canSend&&<button type="button" className="button button-subtle" onClick={()=>setOpened(true)}>Confirm manual send</button>}</div>
   {opened&&canSend&&<label className="fulfilment-consent"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>I sent this email to the listed recipients.</label>}
   {opened&&<button type="submit" className="button button-primary" disabled={!canSend||!confirmed||busy}>Mark email sent</button>}
  </fieldset>
  {feedback&&<p role="status">{feedback}</p>}
 </form>;
}
