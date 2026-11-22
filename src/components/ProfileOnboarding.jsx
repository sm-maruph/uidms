import React,{useEffect,useState} from 'react';
import bankLogo from '../images-removebg-preview.png';
import {useRateLimitCooldown} from './useRateLimitCooldown.js';
import '../profile-onboarding.css';

const fields=[['name','Full name','text'],['departmentId','Department','select'],['branchId','Branch','select'],['email','Work email (optional)','email']];

export default function ProfileOnboarding({enrollment,api,onCancel,onComplete}){
 const [step,setStep]=useState(0);
 const [values,setValues]=useState({name:enrollment.profile.name||'',email:enrollment.profile.email||'',branchId:'',departmentId:''});
 const [organizations,setOrganizations]=useState(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [reload,setReload]=useState(0);
 const cooldown=useRateLimitCooldown();
 useEffect(()=>{
  const controller=new AbortController();setError('');
  api('/auth/onboarding/options',{method:'POST',body:{onboardingToken:enrollment.onboardingToken},signal:controller.signal})
   .then(result=>{if(!controller.signal.aborted)setOrganizations(result.organizations);})
   .catch(error=>{if(!controller.signal.aborted){cooldown.register(error);setError(error.message);}});
  return()=>controller.abort();
 },[enrollment.onboardingToken,reload]);
 const [key,label,type]=fields[step];
 const submit=async event=>{
  event.preventDefault();if(busy||cooldown.blocked)return;
  const value=values[key].trim();
  if(key!=='email'&&!value){setError('Enter a value to continue.');return;}
  const next={...values,[key]:value};setValues(next);setError('');
  if(step<fields.length-1){setStep(step+1);return;}
  setBusy(true);
  try{
   const result=await api('/auth/onboarding/complete',{method:'POST',body:{onboardingToken:enrollment.onboardingToken,...next}});
   await onComplete(result);
  }catch(error){cooldown.register(error);setError(error.status===429?'':error.message);}finally{setBusy(false);}
 };
 return <main className="profile-onboarding">
  <section className="profile-onboarding-card" aria-labelledby="profile-onboarding-heading">
   <aside className="profile-onboarding-rail">
    <img src={bankLogo} alt="Commercial Bank of Ceylon"/>
    <div><h2>Profile setup</h2><ol>{fields.map(([id,title],index)=><li key={id} className={busy||index<step?'is-complete':index===step?'is-current':undefined} aria-current={!busy&&index===step?'step':undefined}><span aria-hidden="true">{busy||index<step?'✓':index+1}</span>{title}</li>)}</ol></div>
    <small>{enrollment.profile.employeeId} · User</small>
   </aside>
   <div className="profile-onboarding-content">
    <h1 id="profile-onboarding-heading">Set up your UIDMS profile</h1>
    <p className="profile-onboarding-identity">AD verified: <strong>{enrollment.profile.employeeId}</strong>. Your initial role is User.</p>
    <div className="profile-onboarding-progress"><label htmlFor="profile-setup-progress">{busy?'Saving your profile…':`Step ${step+1} of ${fields.length}`}</label><div id="profile-setup-progress" className="profile-onboarding-progress-track" role="progressbar" aria-label="Profile setup progress" aria-valuenow={busy?fields.length:step} aria-valuemin={0} aria-valuemax={fields.length}><span style={{width:`${(busy?fields.length:step)/fields.length*100}%`}}/></div></div>
    {!organizations?<div><p role="status">{error||'Loading branches and departments…'}</p><div className="profile-onboarding-actions"><button type="button" className="button button-subtle" onClick={onCancel}>Back to sign in</button>{error&&<button type="button" className="button button-primary" disabled={cooldown.blocked} onClick={()=>setReload(value=>value+1)}>Retry</button>}</div></div>:<form onSubmit={submit} aria-busy={busy}>
     <div key={key} className="profile-onboarding-field">
      <label htmlFor="profile-setup-field">{label}</label>
      {type==='select'?<select key={key} id="profile-setup-field" autoFocus required disabled={busy} value={values[key]} onChange={event=>{setValues({...values,[key]:event.target.value});setError('');}}><option value="">Select {label.toLowerCase()}</option>{organizations.filter(row=>row.Kind===(key==='branchId'?'branch':'department')).map(row=><option key={row.Id} value={row.Id}>{row.Name}</option>)}</select>:<input key={key} id="profile-setup-field" autoFocus required={key!=='email'} disabled={busy} type={type} autoComplete={key==='name'?'name':'email'} maxLength={key==='name'?160:254} value={values[key]} onChange={event=>{setValues({...values,[key]:event.target.value});setError('');}}/>}
      {key==='email'&&<small>Leave this blank if you do not have a work email address yet.</small>}
      {cooldown.blocked?<p role="alert">Try again in {cooldown.label}.</p>:error&&<p role="alert">{error}</p>}
     </div>
     <div className="profile-onboarding-actions"><button type="button" className="button button-subtle" disabled={busy} onClick={()=>{setError('');if(step)setStep(step-1);else onCancel();}}>{step?'Back':'Cancel'}</button><button type="submit" className="button button-primary" disabled={busy||cooldown.blocked}>{busy?'Saving…':step===fields.length-1?'Complete profile':'Continue'}</button></div>
    </form>}
   </div>
  </section>
 </main>;
}
