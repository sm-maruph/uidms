import React, { useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { matchesApprovalDate } from './approvalFilters.js';
import '../approvals-page.css';

const statuses=['All','Pending','In review','Query','Approved','Rejected'];
const dates=['All time','Today','Yesterday','This week','This month'];
const cards=[['All','Total requests','inbox'],['Pending','Pending','clock'],['In review','In review','search'],['Query','Queries','mail'],['Approved','Approved','check'],['Rejected','Rejected','close']];
export default function ApprovalsPage({ rows, role, filter, onFilter, renderRows }) {
  const [range,setRange]=useState('Today');
  const [search,setSearch]=useState('');
  const [approvalOwner,setApprovalOwner]=useState(null);
  const [sort,setSort]=useState('newest');
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(1);
  const tableRef=useRef(null);
  useLayoutEffect(()=>{const table=tableRef.current;if(!table)return;const measure=()=>{const header=table.querySelector('.request-head');const row=table.querySelector('.request-row');const headerHeight=header?.getBoundingClientRect().height||0;const rowHeight=row?.getBoundingClientRect().height||58;const available=table.clientHeight-headerHeight;setPageSize(Math.max(1,Math.floor(available/rowHeight)));};measure();const observer=new ResizeObserver(measure);observer.observe(table);return()=>observer.disconnect();},[]);
  const dated=rows.filter(row=>matchesApprovalDate(row.createdAt,range));
  const awaiting=dated.filter(row=>['Pending','In review'].includes(row.state)&&row.assignedRole);
  const approvalOwners=[...new Set(['Branch manager','IT','CITO','COO',...awaiting.map(row=>row.assignedRole)])];
  const count=status=>status==='All'?dated.length:dated.filter(row=>row.state===status).length;
  const filtered=dated.filter(row=>(filter==='All'||row.state===filter)&&(!approvalOwner||(['Pending','In review'].includes(row.state)&&row.assignedRole===approvalOwner))&&`${row.id} ${row.name} ${row.action} ${row.system} ${row.branch}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>sort==='oldest'?a.createdAt.localeCompare(b.createdAt):b.createdAt.localeCompare(a.createdAt));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const current=Math.min(page,pages);
  const start=(current-1)*pageSize;
  const choose=status=>{onFilter(status);setApprovalOwner(null);setPage(1);};
  return <section className="approvals-page" aria-labelledby="approvals-title">
    <header className="ap-heading"><div><p>REVIEW WORKSPACE</p><h1 id="approvals-title">Approvals <span>{rows.filter(row=>row.state==='Pending').length} pending</span></h1><small>Review requests, resolve queries, and keep access moving.</small></div><span className="ap-role"><Icon name="users" size={16}/>{role}</span></header>
    <div className="ap-metrics">{cards.map(([status,label,icon])=><button type="button" key={status} className={`ap-metric ap-${status.toLowerCase().replace(' ','-')} ${filter===status?'is-active':''}`} aria-pressed={filter===status} onClick={()=>choose(status)}><span className="ap-metric-label"><Icon name={icon} size={16}/>{label}</span><strong>{count(status)}</strong></button>)}</div>
    <div className="ap-owner-summary" role="group" aria-label="Waiting for approval by role"><span><Icon name="clock" size={14}/> Waiting for approval</span><div>{approvalOwners.map(owner=><button type="button" key={owner} className={approvalOwner===owner?'is-active':''} aria-pressed={approvalOwner===owner} onClick={()=>{setApprovalOwner(approvalOwner===owner?null:owner);onFilter('All');setPage(1);}}>{owner}<strong>{awaiting.filter(row=>row.assignedRole===owner).length}</strong></button>)}{approvalOwner&&<button type="button" className="ap-owner-clear" onClick={()=>{setApprovalOwner(null);setPage(1);}}>Clear <Icon name="close" size={12}/></button>}</div></div>
    <section className="ap-queue"><div className="ap-queue-heading"><div><h2>Requests to review <span>{filtered.length}</span></h2><p>Open a request to review its details and approval history.</p></div><label className="ap-search"><Icon name="search" size={16}/><input type="search" value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} aria-label="Search approvals" placeholder="Search ticket, person, or system"/></label></div>
      <div className="ap-date-filters"><span><Icon name="clock" size={14}/> Submitted</span><div role="group" aria-label="Filter by submission date">{dates.map(date=><button type="button" key={date} aria-pressed={range===date} className={range===date?'is-active':''} onClick={()=>{setRange(date);setPage(1);}}>{date}</button>)}</div><label>Sort<select value={sort} onChange={event=>{setSort(event.target.value);setPage(1);}}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
      <div className="ap-status-filters" role="group" aria-label="Approval status">{statuses.map(status=><button type="button" key={status} aria-pressed={filter===status} className={filter===status?'is-active':''} onClick={()=>choose(status)}>{status}<span>{count(status)}</span></button>)}</div>
      <div className="ap-table" ref={tableRef}>{renderRows(filtered.slice(start,start+pageSize))}</div>
      <footer className="ap-pagination"><span role="status" aria-live="polite">{filtered.length?`${start+1}–${Math.min(start+pageSize,filtered.length)}`:'0'} of <strong>{filtered.length}</strong> requests <small>· {rows.length} total</small></span><nav aria-label="Approvals pagination"><button type="button" disabled={current===1} onClick={()=>setPage(current-1)} aria-label="Previous approvals page"><Icon name="chevron" size={15} className="ap-prev"/></button><span>Page {current} of {pages}</span><button type="button" disabled={current===pages} onClick={()=>setPage(current+1)} aria-label="Next approvals page"><Icon name="chevron" size={15}/></button></nav></footer>
    </section><p className="ap-footnote"><Icon name="clock" size={13}/> All decisions and queries are recorded on each ticket. Dates use Bangladesh time; weeks start Monday.</p>
  </section>;
}



