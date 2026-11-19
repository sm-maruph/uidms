import React, { useState } from 'react';
import SecurityGuidance from './SecurityGuidance.jsx';
import Icon from './Icon.jsx';
import bankLogo from '../images-removebg-preview.png';
import '../login.css';

export default function Login({ users, onLogin, onCreateMockUser, dark = true, onToggleTheme, initialError='', passwordRequired=false }) {
  const [error,setError] = useState(initialError);
  const [employeeId, setEmployeeId] = useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const enteredId=employeeId.trim().toUpperCase();
  const selected=enteredId?(users.find(user=>user.employeeId.toUpperCase()===enteredId)||users.find(user=>user.systemId?.toUpperCase()===enteredId)):undefined;
  const setId=value=>{setEmployeeId(value);setError('');};
  const displayName=selected?.name?.trim()||selected?.employeeId||'';
  const initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('');
  const submit=async event=>{
    event.preventDefault();
    if(busy)return;
    if(!selected&&!passwordRequired){setError('That employee or system ID was not found. Check the ID or use Switch demo user.');return;}
    setBusy(true);setError('');
    try{setError(await onLogin(selected||{employeeId:enteredId},password)||'');}
    catch(error){setError(error.status===401?'The employee ID or password is incorrect.':error.message);}
    finally{setBusy(false);}
  };
  return <main className={`uidms-login ${dark ? 'login-dark' : 'login-light'}`}>
    <section className="login-story" aria-label="Identity and access security guidance">
      <a className="login-wordmark" href="#login-form"><span className="login-symbol login-identity-symbol"><Icon name="idCard" size={25}/><i aria-hidden="true"><Icon name="check" size={9}/></i></span><span className="login-wordmark-copy"><strong>User ID Management System</strong><small>Commercial Bank &mdash; Bangladesh Operations</small></span></a>
      <div className="login-story-content">
        <p className="login-kicker"><span/> IDENTITY & ACCESS MANAGEMENT</p>
        <SecurityGuidance/>
        <div className="login-benefits"><span><Icon name="key" size={16}/> Role-based workspaces</span><span><Icon name="clock" size={16}/> Clear approval journeys</span></div>
      </div>
      <div className="login-story-footer login-credit"><span className="login-credit-spark" aria-hidden="true"><Icon name="check" size={12}/></span><div id="login-credit-text" className="login-credit-window" tabIndex={0} aria-label="Designed and developed by Information Technology Department, Commercial Bank of Ceylon, Bangladesh Operations."><div className="login-credit-track" aria-hidden="true"><span>Designed and developed by Information Technology Department, Commercial Bank of Ceylon, Bangladesh Operations.</span><span>Designed and developed by Information Technology Department, Commercial Bank of Ceylon, Bangladesh Operations.</span></div></div></div>
    </section>
    <section className="login-entry" aria-labelledby="login-heading">
      <div className="login-entry-top"><span>EMPLOYEE PORTAL</span><div className="login-entry-controls"><span className="login-demo-badge"><i/> Demo workspace</span><button type="button" className="login-theme-toggle" onClick={onToggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}><Icon name={dark ? 'sun' : 'moon'} size={17}/><span>{dark ? 'Light mode' : 'Dark mode'}</span></button></div></div>
      <div className="login-form-wrap">
        <img className="login-bank-logo" src={bankLogo} alt="Commercial Bank of Ceylon"/>
        <div className="login-form-heading"><p className="login-form-eyebrow">CBC UIDMS Awaits</p><h2 id="login-heading">Welcome back.</h2><p>Enter your employee or system ID to open your demo profile.</p></div>
        <form id="login-form" className="login-entry-form" onSubmit={submit}>
          {error&&<p role="alert">{error}</p>}<label htmlFor="login-employee">Employee / system ID</label>
          <div className="login-select-wrap"><Icon name="idCard" size={20}/><input id="login-employee" value={employeeId} onChange={event=>setId(event.target.value)} placeholder="Enter your ID" autoComplete="off" required maxLength={160}/></div>
          <label htmlFor="login-password" className="login-password-label">Password</label>
          <div className="login-select-wrap"><Icon name="key" size={18}/><input id="login-password" type="password" value={password} onChange={event=>setPassword(event.target.value)} disabled={!passwordRequired} required={passwordRequired} autoComplete={passwordRequired?'current-password':'off'} aria-describedby="demo-password-help"/></div>
          {selected&&<div className="login-profile" aria-live="polite"><span className="login-profile-avatar">{initials}</span><div className="login-profile-info"><strong>{displayName}</strong><span>{selected.branch}</span></div><span className="login-profile-role">{selected.role}</span></div>}
          <button className="login-submit" type="submit" disabled={(!passwordRequired&&!users.length)||busy}>{busy?'Signing in…':'Continue to workspace'} <Icon name="arrow" size={19}/></button>
          {users.length>0&&<details className="login-switch-demo"><summary>Switch demo user</summary><select aria-label="Choose a demo user" value={selected?.employeeId||''} onChange={event=>setId(event.target.value)}><option value="">Choose an account</option>{users.map(user=><option key={user.employeeId} value={user.employeeId}>{user.employeeId} ? {user.name}</option>)}</select></details>}
          {onCreateMockUser&&<button className="login-create-mock" type="button" onClick={onCreateMockUser}>Create mock user</button>}
          <p id="demo-password-help" className="login-demo-note"><Icon name="key" size={15}/> {passwordRequired?'Local test sign-in. Active Directory will verify passwords when connected.':'Demo sign-in uses your ID. Active Directory will verify passwords when connected.'}</p>
        </form>
        <div className="login-entry-note"><Icon name="clock" size={18}/><p>All of your activity will be logged for audit trails.</p></div>
      </div>
      <footer className="login-entry-footer"><span>&copy; 2026 Information Technology Department, CBC Bangladesh. All rights reserved.</span><span>UIDMS · Internal use</span></footer>
    </section>
  </main>;
}

