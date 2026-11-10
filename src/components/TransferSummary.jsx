import React from 'react';
import { Button } from './UI.jsx';
import bankLogo from '../images-removebg-preview.png';
import { requestRoles } from './requestCatalog.js';

const formatTimestamp = value => {
  if (!value) return 'Timestamp unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function TransferSummary({ details = {}, title = 'Branch transfer', ticket, flow = [] }) {
  const people = details.people || [];
  const accessKeys = ['currentAccess','currentOtherAccess','currentTestSystems','newAccess','newOtherAccess','newTestSystems','additionalTestSystems'];
  const isSelected = (key,system) => Boolean(details[`${key}Systems`]?.[system] || (Array.isArray(details[key]?.[system]) ? details[key][system].length : details[key]?.[system]));
  const selections = key => {
    const roles = details[key] || {};
    return [...new Set([...Object.keys(roles),...Object.keys(requestRoles)])]
      .filter(system => isSelected(key,system))
      .map(system => {
        const value = roles[system];
        const extra = details[`${key}Extra`]?.[system] || {};
        const extraText = Object.entries(extra).filter(([,entry])=>entry).map(([name,entry])=>`${name}: ${entry}`).join(', ');
        const department = details[`${key}Departments`]?.[system];
        return `${system}${department?` · ${department}`:''}${Array.isArray(value)&&value.length?`: ${value.join(', ')}`:''}${details.similarIds?.[system]?` · Similar ID: ${details.similarIds[system]}`:''}${extraText?` · ${extraText}`:''}`;
      });
  };
  const requested = person => (person.requestedSystems||[]).filter(row=>row.system).map(row=>{
    const extra=Object.entries(row).filter(([key,value])=>!['system','role','similarId'].includes(key)&&value).map(([key,value])=>`${key}: ${value}`);
    return `${row.system} · ${row.role||'No role level'}${row.similarId?` · Similar ID: ${row.similarId}`:''}${extra.length?` · ${extra.join(', ')}`:''}`;
  });
  const systemJustifications = accessKeys.flatMap(key => Object.entries(details[`${key}Extra`]||{})
    .filter(([system,extra])=>extra.justification&&isSelected(key,system))
    .map(([system,extra])=>({system,section:key,justification:extra.justification})));
  const personJustifications = people.flatMap((person,index)=>(person.requestedSystems||[])
    .filter(row=>row.system&&row.justification)
    .map(row=>({system:row.system,section:`Employee ${index+1}`,justification:row.justification})));
  const justifications = [...systemJustifications,...personJustifications];
  const queries = ticket?.queryHistory || [];
  const approvals = ticket?.approvalHistory || [];
  const submittedAt = ticket?.createdAt || ticket?.date;
  const SelectionGroup = ({heading,items}) => <div><strong>{heading}</strong>{items.length?<ul>{items.map((item,index)=><li key={`${heading}-${index}`}>{item}</li>)}</ul>:<p>None selected.</p>}</div>;

  return <section className="transfer-summary">
    <div className="transfer-summary-heading print-bank-heading">
      <div className="print-bank-brand"><img src={bankLogo} alt="Commercial Bank of Ceylon"/><span><strong>Commercial Bank of Ceylon PLC</strong><small>Bangladesh Operations</small></span></div>
      <Button variant="subtle" onClick={()=>window.print()}>Print full form</Button>
    </div>
    <div className="print-form-title"><h2>User ID Request Form - {title}</h2><p>Complete all sections. Business justification is mandatory.</p></div>
    <section className="print-form-section"><h3>Requester Information</h3><div className="transfer-summary-grid">{[['To whom','CITO / Deputy CEO & COO'],['Request type',title==='Branch Transfer'?details.transferRequestType:'System access request'],['Number of employees',String(people.length||1)],['Ticket',ticket?.id],['Submitted by',ticket?.name],['Submitted at',formatTimestamp(submittedAt)]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div></section>
    {people.map((person,index)=><section className="transfer-person-summary print-form-section" key={`${person.employeeId}-${index}`}><h3>Employee {index+1}</h3><div className="transfer-summary-grid">{[['Full Name',person.fullName],['Designation',person.designation],['Employee ID',person.employeeId],['System ID',person.systemId],['Department',person.department],['Branch',person.branch],['Transferred From (Branch)',person.fromBranch],['Transferred To (Branch)',person.toBranch]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div>{requested(person).length?<ul>{requested(person).map((item,i)=><li key={`${person.employeeId}-${i}`}>{item}</li>)}</ul>:<p>No individual system entries selected.</p>}</section>)}
    <div className="transfer-access-summary print-access-groups">{accessKeys.map((key,index)=><SelectionGroup key={key} heading={['A. Current access — Systems','A. Current access — Other Access','A. Current access — Specialized Test Systems','B. New ID required — Systems','B. New ID required — Other Access','B. New ID required — Specialized Test Systems','Additional Specialized Test Systems'][index]} items={selections(key)}/>)}</div>
    <section className="print-form-section"><h3>Individual System Justifications</h3>{justifications.length?<table className="print-record-table"><thead><tr><th>System</th><th>Section</th><th>Justification</th></tr></thead><tbody>{justifications.map((item,index)=><tr key={`${item.system}-${index}`}><td>{item.system}</td><td>{item.section}</td><td>{item.justification}</td></tr>)}</tbody></table>:<p>No individual system justifications were entered.</p>}</section>
    <section className="print-form-section"><h3>Business Justification</h3><p>{ticket?.justification||'—'}</p></section>
    <section className="print-form-section"><h3>Query History</h3>{queries.length?<table className="print-record-table"><thead><tr><th>Timestamp</th><th>Raised by</th><th>Role</th><th>Query</th></tr></thead><tbody>{queries.map((query,index)=><tr key={`${query.at}-${index}`}><td>{formatTimestamp(query.at)}</td><td>{query.by||'—'}</td><td>{query.role||'—'}</td><td>{query.message}</td></tr>)}</tbody></table>:<p>{ticket?.state==='Query'?'A query is pending; timestamped details are unavailable for this older record.':'No queries recorded.'}</p>}</section>
    <section className="print-form-section"><h3>Approval Tree</h3><table className="print-record-table"><thead><tr><th>Step</th><th>Status</th><th>Approved / handled by</th><th>Timestamp</th></tr></thead><tbody>
      <tr><td>Requester</td><td>Submitted</td><td>{ticket?.name||'Requester'}</td><td>{formatTimestamp(submittedAt)}</td></tr>
      {flow.filter(step=>step!=='Requester').map(step=>{
        const event=approvals.find(item=>item.stage?.toLowerCase().includes(step.toLowerCase())||step.toLowerCase().includes(item.stage?.toLowerCase()));
        const query=queries.find(item=>item.stage?.toLowerCase().includes(step.toLowerCase())||step.toLowerCase().includes(item.stage?.toLowerCase()));
        const isCurrent=!event&&!query&&ticket?.step?.toLowerCase().includes(step.toLowerCase());
        const legacyCompleted=ticket?.state==='Approved'&&!approvals.length&&step!=='Requester';
        return <tr key={step}><td>{step}</td><td>{event?.status||(query?'Query raised':legacyCompleted?'Completed (timestamp unavailable)':isCurrent?ticket.state:'Upcoming')}</td><td>{event?`${event.by}${event.role?` (${event.role})`:''}`:query?`${query.by}${query.role?` (${query.role})`:''}`:isCurrent?ticket.step:legacyCompleted?'Approver unavailable':'—'}</td><td>{event?formatTimestamp(event.at):query?formatTimestamp(query.at):'—'}</td></tr>;
      })}
    </tbody></table></section>
    <section className="approval-fields print-signatures"><h3>Approvals & Signatures</h3><div className="approval-signatures">{['User (Signature)','Head of Department / Branch (Signature)','CITO (Signature & Comments)','Head of HR (Signature & Comments)','Deputy CEO & COO (Signature)'].map((label,index)=><div key={label}><strong>{label}</strong>{index===0&&ticket.signature?<img className="approval-e-signature" src={ticket.signature} alt="User e-signature"/>:<span>Signature</span>}{label.includes('Comments')&&<small>Comments</small>}</div>)}</div></section>
  </section>;
}
