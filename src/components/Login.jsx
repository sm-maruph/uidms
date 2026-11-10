import React, { useState } from 'react';
import Icon from './Icon.jsx';
import bankLogo from '../images-removebg-preview.png';
import '../login.css';

export default function Login({ users, onLogin, dark = true, onToggleTheme }) {
  const [employeeId, setEmployeeId] = useState(users[0]?.employeeId || '');
  const selected = users.find(user => user.employeeId === employeeId);
  const initials = selected?.name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('');
  return <main className={`uidms-login ${dark ? 'login-dark' : 'login-light'}`}>
    <section className="login-story" aria-labelledby="login-story-title">
      <a className="login-wordmark" href="#login-form"><span className="login-symbol"><Icon name="grid" size={23}/></span><strong>UIDMS</strong><span className="login-wordmark-divider"/><small>COMMERCIAL BANK</small></a>
      <div className="login-story-content">
        <p className="login-kicker"><span/> IDENTITY & ACCESS MANAGEMENT</p>
        <h1 id="login-story-title">The right access.<br/>A better <em>workday.</em></h1>
        <p className="login-story-description">One workspace to manage your digital identity, request access, and keep work moving.</p>
        <div className="login-workflow" aria-hidden="true">
          <div className="login-workflow-header"><span className="login-workflow-icon"><Icon name="idCard" size={23}/></span><div><strong>Access, simplified.</strong><span>From request to ready.</span></div><span className="login-workflow-badge">UIDMS</span></div>
          <div className="login-workflow-steps"><span><i><Icon name="check" size={15}/></i>Request</span><b/><span><i><Icon name="check" size={15}/></i>Review</span><b/><span><i><Icon name="check" size={15}/></i>Ready</span></div>
        </div>
        <div className="login-benefits"><span><Icon name="key" size={16}/> Role-based workspaces</span><span><Icon name="clock" size={16}/> Clear approval journeys</span></div>
      </div>
      <div className="login-story-footer"><span>Built for the people behind the bank.</span><span>IDENTITY OPERATIONS</span></div>
    </section>
    <section className="login-entry" aria-labelledby="login-heading">
      <div className="login-entry-top"><span>EMPLOYEE PORTAL</span><div className="login-entry-controls"><span className="login-demo-badge"><i/> Demo workspace</span><button type="button" className="login-theme-toggle" onClick={onToggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}><Icon name={dark ? 'sun' : 'moon'} size={17}/><span>{dark ? 'Light mode' : 'Dark mode'}</span></button></div></div>
      <div className="login-form-wrap">
        <img className="login-bank-logo" src={bankLogo} alt="Commercial Bank of Ceylon"/>
        <div className="login-form-heading"><p className="login-form-eyebrow">YOUR WORKSPACE AWAITS</p><h2 id="login-heading">Welcome back.</h2><p>Choose your employee account to get started.</p></div>
        <form id="login-form" className="login-entry-form" onSubmit={event => { event.preventDefault(); if (selected) onLogin(selected); }}>
          <label htmlFor="login-employee">Employee / system ID</label>
          <div className="login-select-wrap"><Icon name="idCard" size={20}/><select id="login-employee" value={employeeId} onChange={event => setEmployeeId(event.target.value)} required disabled={!users.length}>{!users.length && <option value="">No accounts available</option>}{users.map(user => <option key={user.employeeId} value={user.employeeId}>{user.employeeId} · {user.name}</option>)}</select><Icon name="chevron" size={17}/></div>
          <div className="login-profile" aria-live="polite" aria-atomic="true">{selected ? <><span className="login-profile-avatar">{initials}</span><div className="login-profile-info"><strong>{selected.name}</strong><span>{selected.branch}</span></div><span className="login-profile-role">{selected.role}</span></> : <p>No employee accounts are available. Contact your administrator.</p>}</div>
          <button className="login-submit" type="submit" disabled={!selected}>Continue to workspace <Icon name="arrow" size={19}/></button>
          <p className="login-demo-note"><Icon name="key" size={15}/> Demo accounts only. No password required.</p>
        </form>
        <div className="login-entry-note"><Icon name="users" size={18}/><p>Your selected role determines the tools and approvals available in your workspace.</p></div>
      </div>
      <footer className="login-entry-footer"><span>Commercial Bank of Ceylon PLC</span><span>UIDMS · Internal use</span></footer>
    </section>
  </main>;
}

