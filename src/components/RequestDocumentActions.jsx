import React,{useEffect,useRef,useState} from 'react';
import {api} from './SystemEmailWorkspace.jsx';
import {canGenerateRequestDocument,requestDocumentFilename} from './requestDocuments.js';
import '../request-documents.css';

export default function RequestDocumentActions({ticket,profile}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const wrap=useRef(null),inFlight=useRef(false);
 useEffect(()=>{if(!open)return;const close=event=>{if(!wrap.current?.contains(event.target))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
 if(!ticket.sqlId||!canGenerateRequestDocument(profile))return null;
 const generate=async format=>{
  if(inFlight.current)return;inFlight.current=true;setOpen(false);setBusy(true);setError('');let popup;
  try{
   if(format==='html'){popup=window.open('','_blank','width=1100,height=800');if(!popup)throw new Error('Allow pop-ups for UIDMS to print this request.');popup.opener=null;popup.document.body.textContent='Preparing request document...';}
   const result=await api(`/requests/${ticket.sqlId}/document?format=${format}`,{format:format==='pdf'?'blob':'text'});
   if(format==='pdf'){const url=URL.createObjectURL(result),anchor=document.createElement('a');anchor.href=url;anchor.download=requestDocumentFilename(ticket);document.body.append(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
   else{if(popup.closed)throw new Error('The print window was closed. Open Print / Download to try again.');popup.document.open();popup.document.write(result);popup.document.close();await popup.document.fonts.ready;await Promise.all([...popup.document.images].map(image=>image.decode()));await new Promise(resolve=>popup.requestAnimationFrame(()=>popup.requestAnimationFrame(resolve)));popup.focus();popup.print();}
  }catch(error){popup?.close();setError(error.message);}finally{inFlight.current=false;setBusy(false);}
 };
 return <div className="request-document-actions" ref={wrap} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);wrap.current?.querySelector('button')?.focus();}}}><button type="button" className="button button-subtle" aria-haspopup="menu" aria-expanded={open} disabled={busy} onClick={()=>{setError('');setOpen(value=>!value);}}>{busy?'Generating document...':'Print / Download'}</button>{open&&<div className="request-document-menu" role="menu" aria-label="Request document"><button type="button" role="menuitem" onClick={()=>generate('html')}>Print request</button><button type="button" role="menuitem" onClick={()=>generate('pdf')}>Download PDF</button></div>}{error&&<p className="request-document-error" role="alert">{error}</p>}</div>;
}
