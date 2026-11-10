import React, { useState } from 'react';
import { Button } from './UI.jsx';

export default function Login({users,onLogin}) {
  const [employeeId,setEmployeeId]=useState(users[0]?.employeeId||'');
  const selected=users.find(user=>user.employeeId===employeeId);
  return <main className="login-screen theme-dark"><form className="login-card" onSubmit={event=>{event.preventDefault();if(selected)onLogin(selected);}}><div className="brand-mark">C</div><p className="eyebrow">COMMERCIAL BANK OF CEYLON · IDENTITY OPERATIONS</p><h1>Welcome to UIDMS</h1><p className="login-copy">Choose a mock employee account to open its role dashboard.</p><label className="field-label">Employee ID / System ID<select value={employeeId} onChange={event=>setEmployeeId(event.target.value)} required>{users.map(user=><option key={user.employeeId} value={user.employeeId}>{user.employeeId} · {user.name}</option>)}</select></label>{selected&&<div className="login-account-summary"><strong>{selected.name}</strong><span>{selected.role} · {selected.branch}</span></div>}<Button type="submit">Continue to workspace</Button><small className="mock-hint">Mock accounts · no password required</small></form></main>;
}
