import React from 'react';
import { Button, SectionTitle, Status } from './UI.jsx';
import { otherAccessSystems, requestRoles } from './requestCatalog.js';

const groups = [
  { title:'A. Current Access — Systems the user currently has', names:['ICBS','RVI Web Portal Access','Query','ITMBD','T4S','Cheque Clearing','BEFTN','HRIS','LOS','WBO','Eximbills','SWIFT_Jump','SWIFT ID','SWIFT Demerged ID (ex-BNGLXXXXX / BD0XXXXXX)','CITRIX_R'] },
  { title:'A. Current Access — Other Access', names:otherAccessSystems },
  { title:'A. Current Access — Specialized Test Systems', names:['ITMBD Test','ICBS Test'] },
];
const assigned = {
  ICBS:['Entry'], ITMBD:['Inquiry','Entry'], HRIS:['Inquiry'], 'SWIFT ID':['Operator'], WBO:['Operator'], Eximbills:['Operator'],
};
const activeSystems = new Set(['RVI Web Portal Access','CITRIX_R']);
const otherAssigned = new Set(['AD ID','Internet Access','Jira ID','IDrive','N Drive','Email','MS Office']);
const specialInfo = { CITRIX_R:'Mention ID: RA-IT-0084', 'RVI Web Portal Access':'Business justification: Branch service support' };
const label = system => system==='ITMBD'?'ITMBD (Card Center only)':system==='HRIS'?'HRIS (HR only)':system;

function AccessSection({title,names,values,other=false}) {
  return <section className="access-form-section"><h3>{title}</h3><div className="access-form-head"><span>SYSTEM / ACCESS</span><span>ASSIGNED ROLE LEVEL</span><span>STATUS</span></div>{names.map(system=>{const selected=values[system]||[];const hasAccess=other?otherAssigned.has(system):selected.length>0||activeSystems.has(system);const roles=requestRoles[system]||[];return <div className={`access-form-row ${hasAccess?'access-selected':''}`} key={system}><div className="access-system-name"><input type="checkbox" checked={hasAccess} readOnly/><strong>{label(system)}</strong>{specialInfo[system]&&<small>{specialInfo[system]}</small>}</div><div className="access-role-options">{roles.length?roles.map(role=><label key={role}><input type="checkbox" checked={selected.includes(role)} readOnly/>{role}</label>):<small>{hasAccess?(other?'Assigned':'System access enabled'):'No access assigned'}</small>}</div><div className="access-status">{hasAccess?<Status>Active</Status>:<span>Not assigned</span>}</div></div>;})}</section>;
}

export default function MyAccess({onRequest,requests=[],profile,onOpen}) {
  const pending=requests.filter(request=>request.name===(profile?.name||'Rahim Ahmed')&&request.state!=='Approved');
  return <section className="panel directory-panel my-access-page"><div className="my-access-paper"><header className="my-access-paper-header"><div className="bank-monogram">C</div><div><strong>Commercial Bank of Ceylon PLC</strong><span>Bangladesh Operations</span></div><small>IDENTITY & ACCESS</small></header><div className="my-access-title"><div><p className="eyebrow">PERSONAL ACCESS RECORD</p><h1>User ID Request Form - My Access</h1><p>Current systems and role levels assigned to {profile?.name||'Rahim Ahmed'}.</p></div><Button icon="plus" onClick={onRequest}>Request access</Button></div><div className="my-access-person"><span><small>FULL NAME</small><strong>{profile?.name||'Rahim Ahmed'}</strong></span><span><small>EMPLOYEE ID</small><strong>CB-10428</strong></span><span><small>DEPARTMENT / BRANCH</small><strong>IT Division</strong></span><span><small>RECORD STATUS</small><strong>Active access</strong></span></div>{groups.map(group=><AccessSection key={group.title} title={group.title} names={group.names} values={assigned}/>)}<AccessSection title="Email & Required Software" names={['Email','MS Office']} values={assigned} other/><AccessSection title="Wi-Fi & Device Access" names={['Wi-Fi Access','External Device Access']} values={assigned} other/><section className="pending-access-section"><div><p className="eyebrow">SECTION B</p><h3>Pending access changes</h3><p>Requests that may add, update or remove systems from this access record.</p></div>{pending.length?pending.map(request=><button className="pending-access-row" key={request.id} onClick={()=>onOpen?.(request)}><span><strong>{request.system}</strong><small>{request.action} · {request.id} · submitted {request.date}</small></span><Status>{request.state}</Status><span className="pending-owner">{request.step}</span></button>):<div className="no-pending-access">No pending access changes.</div>}</section><footer className="my-access-paper-footer"><span>Commercial Bank of Ceylon PLC (Bangladesh Operations)</span><span>Generated from current UIDMS access records</span></footer></div></section>;
}
