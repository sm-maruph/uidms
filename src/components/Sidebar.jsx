import React from 'react';
import Icon from './Icon.jsx';
import ProfileSignatureModal from './ProfileSignatureModal.jsx';
import { useState } from 'react';
import bankLogo from '../images-removebg-preview.png';

export default function Sidebar({ active, onNavigate, open, onClose, items = [], profile, onLogout }) {
  const [signatureOpen,setSignatureOpen]=useState(false);
  const groups = [{ label: 'WORKSPACE', items: items.slice(0, 4) }, { label: 'MANAGEMENT', items: items.slice(4) }].filter(group => group.items.length);
  const iconFor = label => ({Overview:'grid','My requests':'inbox',Approvals:'check','Create a request':'plus','User directory':'users',Reports:'arrow','Audit trail':'clock','Workflow studio':'filter','Admin settings':'settings','Joiners & transfers':'users'})[label] || 'grid';
  return <><button className={`sidebar-scrim ${open ? 'visible' : ''}`} onClick={onClose} aria-label="Close navigation"/><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="sidebar-branding"><img className="sidebar-bank-logo" src={bankLogo} alt="Commercial Bank of Ceylon"/><div className="brand"><div className="brand-mark">C</div><div><strong>CBC <span>UIDMS</span></strong><small>Identity management</small></div><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close"/></button></div></div>
    <nav>{groups.map(group => <div className="nav-group" key={group.label}><p className="nav-label">{group.label}</p>{group.items.map(label => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { onNavigate(label); onClose(); }}><Icon name={iconFor(label)}/><span>{label}</span></button>)}</div>)}</nav>
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><strong>Mock data workspace</strong><p>Explore role dashboards, ticket flows and admin tools.</p><button onClick={() => onNavigate('Audit trail')}>View activity <Icon name="arrow" size={15}/></button></div><div className="profile-row"><div className="avatar avatar-navy">{(profile?.name||'RA').split(' ').map(x=>x[0]).join('').slice(0,2)}</div><span><strong>{profile?.name||'Rahim Ahmed'}</strong><small>{profile?.role||'User'} | {profile?.department||'IT Department'}</small></span><button className="icon-button" onClick={()=>setSignatureOpen(true)} aria-label="Profile and e-signature" title="Profile and e-signature"><Icon name="edit"/></button></div><button className="sidebar-logout-button" onClick={onLogout}>Sign out</button>{signatureOpen&&<ProfileSignatureModal profile={{...profile,signature:localStorage.getItem('uidmsSignature')||profile?.signature}} onClose={()=>setSignatureOpen(false)} onSave={signature=>{localStorage.setItem('uidmsSignature',signature);setSignatureOpen(false);}}/>}</div>
  </aside></>;
}
