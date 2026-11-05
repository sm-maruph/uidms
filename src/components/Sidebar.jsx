import React from 'react';
import Icon from './Icon.jsx';

export default function Sidebar({ active, onNavigate, open, onClose, items = [], profile, onLogout }) {
  const groups = [{ label: 'WORKSPACE', items: items.slice(0, 4) }, { label: 'MANAGEMENT', items: items.slice(4) }].filter(group => group.items.length);
  const iconFor = label => ({Overview:'grid','My requests':'inbox',Approvals:'check','System access':'settings','User directory':'users',Reports:'arrow','Audit trail':'clock','Workflow studio':'filter','Admin settings':'settings','Joiners & transfers':'users'})[label] || 'grid';
  return <><button className={`sidebar-scrim ${open ? 'visible' : ''}`} onClick={onClose} aria-label="Close navigation"/><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="brand"><div className="brand-mark">C</div><div><strong>CBC <span>UIDMS</span></strong><small>Identity management</small></div><button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><Icon name="close"/></button></div>
    <div className="workspace-switch"><span className="workspace-icon">C</span><span><strong>Commercial Bank of Ceylon</strong><small>Mock operations workspace</small></span></div>
    <nav>{groups.map(group => <div className="nav-group" key={group.label}><p className="nav-label">{group.label}</p>{group.items.map(label => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { onNavigate(label); onClose(); }}><Icon name={iconFor(label)}/><span>{label}</span></button>)}</div>)}</nav>
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><strong>Mock data workspace</strong><p>Explore role dashboards, ticket flows and admin tools.</p><button onClick={() => onNavigate('Audit trail')}>View activity <Icon name="arrow" size={15}/></button></div><div className="profile-row"><div className="avatar avatar-navy">{(profile?.name||'RA').split(' ').map(x=>x[0]).join('').slice(0,2)}</div><span><strong>{profile?.name||'Rahim Ahmed'}</strong><small>{profile?.role||'User'} · IT Division</small></span><button className="icon-button" onClick={onLogout} aria-label="Sign out" title="Sign out"><Icon name="more"/></button></div></div>
  </aside></>;
}
