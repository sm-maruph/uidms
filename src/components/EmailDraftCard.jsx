import React,{useState} from 'react';
import '../fulfilment.css';

export const emailAddresses=value=>value.split(',').map(address=>address.trim()).filter(Boolean);
const formatAddress=value=>Array.isArray(value)?value.join(', '):value||'';

export default function EmailDraftCard({draft,canSend,onSent}){
 const [email,setEmail]=useState({to:formatAddress(draft.to),cc:formatAddress(draft.cc),subject:draft.subject,body:draft.body});
 const [opened,setOpened]=useState(false);
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const field=(key,value)=>{setEmail(current=>({...current,[key]:value}));setOpened(false);setConfirmed(false);};
 const copy=async()=>{
  try{await navigator.clipboard.writeText(`To: ${email.to}\nCC: ${email.cc}\nSubject: ${email.subject}\n\n${email.body}`);setFeedback('Draft copied.');}
  catch{setFeedback('Copy is unavailable. Select and copy the draft fields manually.');}
 };
 const open=event=>{
  if(!event.currentTarget.form.reportValidity())return;
  const params=new URLSearchParams({view:'cm',fs:'1',to:email.to,cc:email.cc,su:email.subject,body:email.body});
  window.open(`https://mail.google.com/mail/?${params}`,'_blank','noopener,noreferrer');
  setOpened(true);
 };
 if(draft.sentAt)return <article className="email-draft-card"><h3>{draft.name}</h3><p>{draft.systems?.join(', ')}</p><p>Sent confirmation by {draft.sentBy} · {new Date(draft.sentAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'})}</p></article>;
 return <form className="email-draft-card" onSubmit={async event=>{
  event.preventDefault();
  if(!canSend||!confirmed||busy)return;
  setBusy(true);setFeedback('');
  try{await onSent(draft,{...email,to:emailAddresses(email.to),cc:emailAddresses(email.cc)});}catch(error){setFeedback(error.message);}finally{setBusy(false);}
 }}>
  <h3>{draft.name}</h3>{draft.systems?.length>0&&<p>{draft.systems.join(', ')}</p>}
  <fieldset disabled={busy}>
   <div className="fulfilment-email-addresses"><label>To<input type="email" multiple required value={email.to} onChange={event=>field('to',event.target.value)}/></label><label>CC<input type="email" multiple value={email.cc} onChange={event=>field('cc',event.target.value)}/></label></div>
   <label>Subject<input required value={email.subject} onChange={event=>field('subject',event.target.value)}/></label>
   <label>Body<textarea rows="8" required value={email.body} onChange={event=>field('body',event.target.value)}/></label>
   <div className="fulfilment-buttons"><button type="button" className="button button-subtle" onClick={copy}>Copy draft</button><button type="button" className="button button-primary" disabled={!canSend} onClick={open}>Open Gmail</button>{canSend&&<button type="button" className="button button-subtle" onClick={()=>setOpened(true)}>Confirm manual send</button>}</div>
   {opened&&canSend&&<label className="fulfilment-consent"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>I sent this email to the listed recipients.</label>}
   {opened&&<button type="submit" className="button button-primary" disabled={!canSend||!confirmed||busy}>Mark email sent</button>}
  </fieldset>
  {feedback&&<p role="status">{feedback}</p>}
 </form>;
}
