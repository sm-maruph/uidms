import React,{useEffect,useRef,useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import '../login-verification.css';
import {useRateLimitCooldown} from './useRateLimitCooldown.js';
import {mfaErrorMessage,mfaNeedsNewSignIn,mfaCodeRejected} from './mfaErrors.js';

export default function LoginVerification({challenge,api,onVerify,onCancel}){
 const [setup,setSetup]=useState(null);
 const [code,setCode]=useState('');
 const [busy,setBusy]=useState(false);
 const cooldown=useRateLimitCooldown();
 const [error,setError]=useState('');
 const [restartRequired,setRestartRequired]=useState(false);
 const [codeRejected,setCodeRejected]=useState(false);
 const codeField=useRef(null);
 const backButton=useRef(null);
 const panel=useRef(null);
 useEffect(()=>{panel.current?.querySelector('button,input')?.focus();},[]);
 useEffect(()=>{if(busy)return;if(restartRequired)backButton.current?.focus();else if(codeRejected){codeField.current?.focus();codeField.current?.select();}},[codeRejected,restartRequired,busy]);
 const showError=error=>{
  cooldown.register(error);setError(error.status===429?'':mfaErrorMessage(error));
  setRestartRequired(mfaNeedsNewSignIn(error));setCodeRejected(mfaCodeRejected(error));
 };
 const enroll=async()=>{
  if(busy||cooldown.blocked||restartRequired)return;
  setBusy(true);setError('');
  try{setSetup(await api('/auth/mfa/enroll',{method:'POST',body:{challenge:challenge.challenge}}));}
  catch(error){showError(error);}finally{setBusy(false);}
 };
 const submit=async event=>{
  event.preventDefault();if(busy||cooldown.blocked||restartRequired)return;setBusy(true);setError('');setCodeRejected(false);
  try{await onVerify(code);}catch(error){showError(error);}finally{setBusy(false);}
 };
 return <div className="login-verification-scrim"><section ref={panel} className="login-verification" role="dialog" aria-modal="true" aria-labelledby="login-verification-title" onKeyDown={event=>{
  if(event.key==='Escape'&&!busy)onCancel();
  if(event.key==='Tab'){
   const fields=[...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')].filter(field=>field.getClientRects().length);
   if(event.shiftKey&&document.activeElement===fields[0]){event.preventDefault();fields.at(-1)?.focus();}
   else if(!event.shiftKey&&document.activeElement===fields.at(-1)){event.preventDefault();fields[0]?.focus();}
  }
 }}><p className="eyebrow">SECURE SIGN-IN</p><h2 id="login-verification-title">{challenge.mfaEnrollmentRequired?'Set up your authenticator':'Verify your sign-in'}</h2>
 <p>{challenge.mfaEnrollmentRequired?'Scan the QR code with your authenticator app, then enter its six-digit code to finish setup.':'Enter the current six-digit code from your authenticator app.'}</p>
 {challenge.mfaEnrollmentRequired&&!setup&&<button className="button button-primary" type="button" disabled={busy||cooldown.blocked||restartRequired} onClick={enroll}>{busy?'Preparing…':'Show QR code'}</button>}
 {setup&&<div className="authenticator-enrollment">
  <div className="authenticator-qr"><QRCodeSVG value={setup.otpauthUrl} size={208} marginSize={4} level="M" bgColor="#ffffff" fgColor="#000000" role="img" title="Scan to add your CBC UIDMS account to your authenticator"/></div>
  <p className="authenticator-scan-help">In your authenticator app, add an account and scan this code.</p>
  <details className="authenticator-manual"><summary>Can't scan? Enter a setup key instead</summary><label>Authenticator setup key<input value={setup.secret} readOnly autoComplete="off" spellCheck={false}/><small>Add an account manually using this key and choose time-based codes.</small></label></details>
 </div>}
 <form onSubmit={submit}><label htmlFor="login-mfa-code">Verification code<input ref={codeField} id="login-mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} aria-invalid={codeRejected||undefined} aria-describedby={error||cooldown.blocked?'login-mfa-error':undefined} onChange={event=>{setCode(event.target.value.replace(/\D/g,''));if(!restartRequired){setError('');setCodeRejected(false);}}} required disabled={busy||restartRequired||challenge.mfaEnrollmentRequired&&!setup}/></label>
 {(cooldown.blocked||error)&&<div id="login-mfa-error" className="mfa-error" role="alert"><strong>{cooldown.blocked?'Too many verification requests':restartRequired?'Sign in again':'Verification failed'}</strong><p>{cooldown.blocked?`Try again in ${cooldown.label}.`:error}</p></div>}
 <footer><button ref={backButton} className="button button-subtle" type="button" disabled={busy} onClick={onCancel}>{restartRequired?'Back to sign in':'Cancel'}</button><button className="button button-primary" type="submit" disabled={busy||restartRequired||cooldown.blocked||code.length!==6||challenge.mfaEnrollmentRequired&&!setup}>{cooldown.blocked?`Try again in ${cooldown.label}`:busy?'Verifying…':'Verify and sign in'}</button></footer></form>
 </section></div>;
}
