import React,{useEffect,useRef,useState} from 'react';
import bankLogo from '../images-removebg-preview.png';
import '../profile-onboarding.css';

const fields=[['name','Full name','text'],['employeeId','Employee ID','text'],['email','Work email','email'],['department','Department','select'],['branch','Branch','select']];
const tips=['Use My requests to follow your tickets.','Use My access to review your system access.','Check notifications for updates and questions from approvers.'];

export default function ProfileOnboarding({systemId,branches,departments,onCancel,onComplete,users}){
 const [step,setStep]=useState(0);
 const [values,setValues]=useState({});
 const [error,setError]=useState('');
 const [setup,setSetup]=useState(false);
 const [tip,setTip]=useState(0);
 const complete=useRef(onComplete);
 useEffect(()=>{complete.current=onComplete;},[onComplete]);
 useEffect(()=>{
  if(!setup)return;
  const rotation=setInterval(()=>setTip(current=>Math.min(current+1,tips.length-1)),1400);
  const finish=setTimeout(()=>complete.current(setup),4200);
  return ()=>{clearInterval(rotation);clearTimeout(finish);};
 },[setup]);
 const [key,label,type]=fields[step];
 const submit=event=>{
  event.preventDefault();
  const value=values[key]?.trim();
  if(!value){setError('Enter a value to continue.');return;}
  if(key==='employeeId'&&users.some(user=>user.employeeId.toUpperCase()===value.toUpperCase())){setError('This employee ID already belongs to another demo profile.');return;}
  if(key==='email'&&users.some(user=>user.email?.toLowerCase()===value.toLowerCase())){setError('This email already belongs to another demo profile.');return;}
  const next={...values,[key]:key==='employeeId'?value.toUpperCase():key==='email'?value.toLowerCase():value};
  setValues(next);setError('');
  if(step===fields.length-1)setSetup({...next,systemId,role:'User',access:{}});
  else setStep(step+1);
 };
 return <main className="profile-onboarding">
  <section className="profile-onboarding-card">
   <aside className="profile-onboarding-rail">
    <img src={bankLogo} alt="Commercial Bank of Ceylon"/>
    <div><h2>Profile setup</h2><ol>{fields.map(([id,title],index)=><li key={id} className={setup||index<step?'is-complete':index===step?'is-current':undefined} aria-current={!setup&&index===step?'step':undefined}><span aria-hidden="true">{setup||index<step?'✓':index+1}</span>{title}</li>)}</ol></div>
    <small>{systemId}</small>
   </aside>
   <div className="profile-onboarding-content">
   {setup?<div className="profile-onboarding-loading" role="status">
    <span className="profile-onboarding-spinner" aria-hidden="true"/><h1>Welcome, {setup.name}!</h1><p>Setting up your dashboard…</p><progress aria-label="Profile information complete" value={fields.length} max={fields.length}/><div className="profile-onboarding-tip" key={tip}><strong>Quick tip</strong><p>{tips[tip]}</p></div>
   </div>:<>
    <h1>Set up your UIDMS profile</h1>
    <div className="profile-onboarding-progress"><label htmlFor="profile-setup-progress">Step {step+1} of {fields.length}</label><div id="profile-setup-progress" className="profile-onboarding-progress-track" role="progressbar" aria-label="Profile setup progress" aria-valuenow={step} aria-valuemin={0} aria-valuemax={fields.length}><span style={{width:`${step/fields.length*100}%`}}/></div></div>
    <form onSubmit={submit}>
     <div key={key} className="profile-onboarding-field">
     <label htmlFor="profile-setup-field">{label}</label>
     {type==='select'?<select key={key} id="profile-setup-field" autoFocus required value={values[key]||''} onChange={event=>{setValues({...values,[key]:event.target.value});setError('');}}><option value="">Select {label.toLowerCase()}</option>{(key==='branch'?branches:departments).map(option=><option key={option}>{option}</option>)}</select>:<input key={key} id="profile-setup-field" autoFocus required type={type} maxLength={key==='employeeId'?40:key==='name'?160:254} pattern={key==='employeeId'?'[A-Za-z0-9_\\-]+':undefined} value={values[key]||''} onChange={event=>{setValues({...values,[key]:event.target.value});setError('');}}/>}
     {error&&<p role="alert">{error}</p>}
     </div>
     <div className="profile-onboarding-actions"><button type="button" className="button button-subtle" onClick={()=>{setError('');if(step)setStep(step-1);else onCancel();}}>{step?'Back':'Cancel'}</button><button type="submit" className="button button-primary">{step===fields.length-1?'Finish setup':'Continue'}</button></div>
    </form>
   </>}
   </div>
  </section>
 </main>;
}
