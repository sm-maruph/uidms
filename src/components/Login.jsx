import React, { useState } from 'react';
import SecurityGuidance from './SecurityGuidance.jsx';
import Icon from './Icon.jsx';
import bankLogo from '../images-removebg-preview.png';
import '../login.css';

export default function Login({ users, onLogin, dark = true, onToggleTheme }) {
  const [employeeId, setEmployeeId] = useState(users[0]?.employeeId || '');
  const selected = users.find(user => user.employeeId === employeeId);
  const initials = selected?.name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('');
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
        <div className="login-form-heading"><p className="login-form-eyebrow">CBC UIDMS Awaits</p><h2 id="login-heading">Welcome back.</h2><p>Choose your employee account to get started.</p></div>
        <form id="login-form" className="login-entry-form" onSubmit={event => { event.preventDefault(); if (selected) onLogin(selected); }}>
          <label htmlFor="login-employee">Employee / system ID</label>
          <div className="login-select-wrap"><Icon name="idCard" size={20}/><select id="login-employee" value={employeeId} onChange={event => setEmployeeId(event.target.value)} required disabled={!users.length}>{!users.length && <option value="">No accounts available</option>}{users.map(user => <option key={user.employeeId} value={user.employeeId}>{user.employeeId} · {user.name}</option>)}</select><Icon name="chevron" size={17}/></div>
          <div className="login-profile" aria-live="polite" aria-atomic="true">{selected ? <><span className="login-profile-avatar">{initials}</span><div className="login-profile-info"><strong>{selected.name}</strong><span>{selected.branch}</span></div><span className="login-profile-role">{selected.role}</span></> : <p>No employee accounts are available. Contact your administrator.</p>}</div>
          <button className="login-submit" type="submit" disabled={!selected}>Continue to workspace <Icon name="arrow" size={19}/></button>
          <p className="login-demo-note"><Icon name="key" size={15}/> Demo accounts only. No password required.</p>
        </form>
        <div className="login-entry-note"><Icon name="clock" size={18}/><p>All of your activity will be logged for audit trails.</p></div>
      </div>
      <footer className="login-entry-footer"><span>&copy; 2026 Information Technology Department, Commercial Bank of Ceylon. All rights reserved.</span><span>UIDMS · Internal use</span></footer>
    </section>
  </main>;
}

