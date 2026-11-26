import {gmailDiagnosticsVersion,gmailStatusDiagnostics,gmailErrorDiagnostics} from './gmailDiagnostics.js';
import React,{useEffect,useRef,useState} from 'react';
import {api} from './SystemEmailWorkspace.jsx';
import {Button} from './UI.jsx';

export default function GmailSetup({write}){
 const [status,setStatus]=useState(null),[error,setError]=useState(''),[result,setResult]=useState(''),[to,setTo]=useState(''),[busy,setBusy]=useState(false),[open,setOpen]=useState(false);
 const attempt=useRef(crypto.randomUUID());
 const refresh=async()=>{console.info('[UIDMS Gmail] Checking backend configuration',{version:gmailDiagnosticsVersion});try{const value=await api('/admin/gmail/status');console.info('[UIDMS Gmail] Backend status',gmailStatusDiagnostics(value));setStatus(value);setTo(current=>current||value.testRecipient||'');return value;}catch(err){console.error('[UIDMS Gmail] Status request failed',gmailErrorDiagnostics(err));throw err;}};
 useEffect(()=>{if(open)refresh().catch(err=>setError(err.message));},[open]);
 const authorize=async()=>{
  console.info('[UIDMS Gmail] Authorize button clicked',{version:gmailDiagnosticsVersion,navigation:'same-tab',popupExpected:false});
  setBusy(true);setError('');setResult('');
  try{console.info('[UIDMS Gmail] Requesting authorization link',{version:gmailDiagnosticsVersion});const value=await write('/admin/gmail/authorize','POST',{});if(typeof value?.authorizationUrl!=='string'||!value.authorizationUrl)throw new Error('The backend did not return an authorization link. Check the backend version and Gmail setup logs.');console.info('[UIDMS Gmail] Authorization link received; redirecting in this tab',{version:gmailDiagnosticsVersion,hasAuthorizationLink:true});window.location.assign(value.authorizationUrl);}
  catch(err){console.error('[UIDMS Gmail] Authorization failed',gmailErrorDiagnostics(err));setError(err.message);}finally{setBusy(false);}
 };
 return <details className="admin-user-form" open={open} onToggle={event=>setOpen(event.currentTarget.open)}><summary><strong>Gmail API connection setup</strong></summary><p>Google authorization opens in this tab; no popup is needed. Return to Admin settings after granting consent.</p><p>Connect the official UIDMS sender and send the first test email. Automated notifications use the Gmail worker after a successful live test.</p>
  {status&&<><p><strong>Sender:</strong> {status.senderName} &lt;{status.sender}&gt;</p><p><strong>Connection:</strong> {status.connected?'Authorized':'Not authorized'} · <strong>Live test:</strong> {status.testedAt?new Date(status.testedAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'}):'Not completed'}</p>
   <p><strong>Automated email:</strong> {status.automatedDeliveryEnabled?'Enabled ? keep uidms-mail-worker running':status.notificationsConfigured?'Waiting for authorization and a successful test':'Disabled in backend configuration'}</p>
   {status.storageError&&<p role="alert">The stored Google token could not be opened with the current configuration. Check file permissions and the original encryption key. If the OAuth client changed, authorize again; do not replace the existing UIDMS encryption key.</p>}
   {!status.configured&&<p>Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET privately in backend/.env, check GOOGLE_REDIRECT_URI, then restart the backend. Do not enter secrets into this page.</p>}
   {!status.setupEnabled&&<p>Setup is disabled. Set GMAIL_SETUP_ENABLED=true on the backend only while authorizing and testing.</p>}
   <div className="detail-actions"><Button type="button" disabled={busy||!status.configured||!status.setupEnabled} onClick={authorize}>{busy?'Preparing authorization...':'Authorize official Google account'}</Button><Button type="button" variant="subtle" disabled={busy} onClick={()=>refresh().catch(err=>setError(err.message))}>Refresh connection status</Button></div>
   <Button type="button" variant="subtle" disabled={busy} onClick={()=>refresh().then(value=>setResult(!value.configured?'The running backend has not loaded all Google settings. See the [UIDMS Gmail] console entries.':!value.setupEnabled?'GMAIL_SETUP_ENABLED is false in the running backend.':'Google setup is ready. Authorization opens in this tab, not a popup.')).catch(err=>setError(err.message))}>Check setup diagnostics</Button>
   {error&&<p role="alert" style={{color:'#c93232'}}>{error}</p>}
   <form onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');setResult('');try{const response=await write('/admin/gmail/test','POST',{testId:attempt.current,to});setResult(`Google accepted the test email. Message ID: ${response.messageId}. Confirm it arrived in the recipient mailbox.`);await refresh();}catch(err){setError(err.message);}finally{setBusy(false);}}}>
    <label>Test recipient<input type="email" required maxLength={254} value={to} onChange={event=>{setTo(event.target.value);attempt.current=crypto.randomUUID();setResult('');}}/></label><Button type="submit" disabled={busy||!status.connected||!status.setupEnabled}>Send first test email</Button>
   </form></>}
  {!status&&open&&!error&&<p>Loading connection status...</p>}{!status&&error&&<p role="alert">{error}</p>}{result&&<p role="status">{result}</p>}
 </details>;
}
