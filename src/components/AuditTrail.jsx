import React, {useMemo,useState} from 'react';
import {Button,SectionTitle} from './UI.jsx';
import {auditTypes,auditTimestamp,auditCsv,dhakaDate,filterAudit,groupAudit} from './auditLog.js';
import '../audit-trail.css';

const initialFilters={search:'',from:'',to:'',type:'All',category:'All',outcome:'All',requestType:'All',sort:'newest'};
const colors=['#2563eb','#16a34a','#d97706','#7c3aed','#db2777','#0891b2','#64748b'];
function AuditCharts({events,onType}) {
  const counts=new Map();const days=new Map();
  for(const event of events){counts.set(event.type,(counts.get(event.type)||0)+1);const date=dhakaDate(event.at);if(date)days.set(date,(days.get(date)||0)+1);}
  const types=[...counts].sort((a,b)=>b[1]-a[1]);const daily=[...days].sort(([a],[b])=>a.localeCompare(b));
  const max=Math.max(1,...types.map(([,count])=>count));const peak=Math.max(1,...daily.map(([,count])=>count));
  const dayX=index=>daily.length===1?180:20+(Date.parse(daily[index][0])-Date.parse(daily[0][0]))/(Date.parse(daily.at(-1)[0])-Date.parse(daily[0][0]))*320;
  let offset=0;const slices=types.map(([type,count],index)=>{const slice={type,count,color:colors[index%colors.length],start:offset};offset+=count/events.length*100;return {...slice,end:offset};});
  return <div className="audit-charts">
    <section className="audit-chart"><h3>Activity over time</h3><p>Events per day · Asia/Dhaka</p>{daily.length?<><svg viewBox="0 0 360 155" role="img" aria-label={`${daily.length} days of activity. ${daily.map(([date,count])=>`${date}: ${count} events`).join('; ')}`}><path d="M20 12V130H344" fill="none" stroke="currentColor" opacity=".25"/><polyline points={daily.map(([,count],index)=>`${dayX(index)},${125-count/peak*105}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3"/>{daily.map(([date,count],index)=><circle key={date} cx={dayX(index)} cy={125-count/peak*105} r="4" fill="#2563eb"><title>{`${date}: ${count} events`}</title></circle>)}</svg><div className="audit-chart-range"><span>{daily[0][0]}</span><span>{daily.at(-1)[0]}</span></div><details><summary>View daily counts</summary><ul>{daily.map(([date,count])=><li key={date}>{date}: {count}</li>)}</ul></details></>:<p>No dated events in this selection.</p>}</section>
    <section className="audit-chart"><h3>Events by type</h3><p>Select a bar to filter events</p><div className="audit-bars">{types.map(([type,count],index)=><button type="button" key={type} onClick={()=>onType(type)} aria-label={`Filter ${type}: ${count} events`}><span>{type}</span><i><b style={{width:`${count/max*100}%`,background:colors[index%colors.length]}}/></i><strong>{count}</strong></button>)}</div>{!types.length&&<p>No events in this selection.</p>}</section>
    <section className="audit-chart"><h3>Activity distribution</h3><p>Share of filtered events</p>{events.length?<><div className="audit-pie" role="img" aria-label={types.map(([type,count])=>`${type}: ${Math.round(count/events.length*100)}%`).join(', ')} style={{background:`conic-gradient(${slices.map(slice=>`${slice.color} ${slice.start}% ${slice.end}%`).join(',')})`}}/><div className="audit-legend">{slices.map(slice=><button type="button" key={slice.type} onClick={()=>onType(slice.type)}><i style={{background:slice.color}}/>{slice.type}<strong>{Math.round(slice.count/events.length*100)}%</strong></button>)}</div></>:<p>No events in this selection.</p>}</section>
  </div>;
}

export default function AuditTrail({events=[],storageError=''}) {
  const [filters,setFilters]=useState(initialFilters);const [grouping,setGrouping]=useState('entity');const [page,setPage]=useState(1);
  const update=(key,value)=>{setFilters(current=>({...current,[key]:value}));setPage(1);};
  const filtered=useMemo(()=>filterAudit(events,filters),[events,filters]);
  const groups=useMemo(()=>groupAudit(filtered,grouping),[filtered,grouping]);
  const pages=Math.max(1,Math.ceil(groups.length/20));const currentPage=Math.min(page,pages);
  const requestTypes=[...new Set(events.map(event=>event.requestType).filter(Boolean))].sort();
  const exportReport=()=>{const url=URL.createObjectURL(new Blob([auditCsv(filtered)],{type:'text/csv;charset=utf-8;'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`uidms-audit-${dhakaDate(new Date().toISOString())}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const select=(key,title,options)=><label>{title}<select value={filters[key]} onChange={event=>update(key,event.target.value)}>{options.map(option=><option key={option}>{option}</option>)}</select></label>;
  return <section className="panel directory-panel audit-page">
    <SectionTitle eyebrow="CONTROL & COMPLIANCE" title="Audit trail"><Button type="button" variant="subtle" onClick={exportReport} disabled={!filtered.length}>Export filtered CSV ({filtered.length})</Button></SectionTitle>
    <p className="directory-intro">Explore ticket histories, account changes and session activity. Filters apply to every chart, event pack and exported row. Dates use Asia/Dhaka.</p>
    <p className="audit-data-note">Demo audit records are stored in this browser. Client IP is shown when provided by the host; earlier events may have no recorded IP. Login and logout failures appear when an attempt fails.</p>
    {storageError&&<p className="audit-error" role="alert">{storageError}</p>}
    <div className="audit-filters">
      <label className="audit-search">Search<input type="search" value={filters.search} onChange={event=>update('search',event.target.value)} placeholder="Ticket, name, employee ID, IP or details"/></label>
      <label>From date<input type="date" value={filters.from} onChange={event=>update('from',event.target.value)}/></label><label>To date<input type="date" min={filters.from||undefined} value={filters.to} onChange={event=>update('to',event.target.value)}/></label>
      {select('type','Event type',['All',...auditTypes])}{select('category','Category',['All','Ticket','Session','Account','Organization'])}{select('outcome','Outcome',['All','Success','Rejected','Failed'])}{select('requestType','Request type',['All',...requestTypes])}
      <label>Sort by<select value={filters.sort} onChange={event=>update('sort',event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="type">Event type A–Z</option><option value="actor">Actor A–Z</option></select></label>
      <label>Group by<select value={grouping} onChange={event=>{setGrouping(event.target.value);setPage(1);}}><option value="entity">Ticket / account / session</option><option value="type">Create / update / delete / event type</option></select></label>
      <Button type="button" variant="subtle" onClick={()=>{setFilters(initialFilters);setGrouping('entity');setPage(1);}}>Clear filters</Button>
    </div>
    {filters.from&&filters.to&&filters.from>filters.to&&<p role="alert" className="audit-error">Choose an end date on or after the start date.</p>}
    <div className="audit-metrics">{[['Matching events',filtered.length],['Tickets',new Set(filtered.filter(event=>event.category==='Ticket').map(event=>event.entityId)).size],['Session events',filtered.filter(event=>event.category==='Session').length],['Failed attempts',filtered.filter(event=>event.outcome==='Failed').length]].map(([label,count])=><article key={label}><small>{label}</small><strong>{count}</strong></article>)}</div>
    <AuditCharts events={filtered} onType={type=>update('type',type)}/>
    <div className="audit-result-heading"><h3>Event packs</h3><span>{groups.length} packs · {filtered.length} matching events</span></div>
    <p className="audit-data-note">Expand a pack to inspect its matching events. Clear filters to see its full history.</p>
    {!groups.length&&<p className="empty-state">No audit events match these filters.</p>}
    <div className="audit-packs">{groups.slice((currentPage-1)*20,currentPage*20).map(group=><details className="audit-pack" key={group.key}><summary><span><strong>{group.key}</strong><small>{group.title}</small></span><span className="audit-pack-meta">{group.events.length} events<small>{auditTimestamp(group.events[0]?.at)}</small></span></summary><div className="audit-event-table"><table><thead><tr><th>Time (Asia/Dhaka)</th><th>Type / outcome</th><th>Actor</th><th>Ticket / entity</th><th>IP address</th><th>Details</th></tr></thead><tbody>{group.events.map(event=><tr key={event.id}><td><time dateTime={event.at}>{auditTimestamp(event.at)}</time></td><td><strong>{event.type}</strong><small className={event.outcome==='Failed'?'audit-failure':''}>{event.outcome}</small></td><td>{event.actor}<small>{[event.employeeId,event.role].filter(Boolean).join(' · ')}</small></td><td>{event.entityId}<small>{event.requestType||event.category}</small></td><td>{event.ip||'Not recorded'}</td><td>{event.message||'—'}</td></tr>)}</tbody></table></div></details>)}</div>
    <div className="audit-pagination"><Button type="button" variant="subtle" disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)}>Previous</Button><span>Page {currentPage} of {pages}</span><Button type="button" variant="subtle" disabled={currentPage>=pages} onClick={()=>setPage(currentPage+1)}>Next</Button></div>
  </section>;
}
