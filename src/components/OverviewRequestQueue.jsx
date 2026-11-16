import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { SectionTitle } from './UI.jsx';
import '../request-pagination.css';


export default function OverviewRequestQueue({ rows, filter, onFilter, search, onSearch, title, eyebrow, onViewQueue, renderRows }) {
  const [page, setPage] = useState(1);
  const [viewSize,setViewSize]=useState(()=>{try{const saved=localStorage.getItem('uidmsQueueViewSize');return ['5','10','20','50','100','all'].includes(saved)?saved:'10';}catch{return '10';}});
  const scrollRef=useRef(null);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=0;},[page,viewSize,filter,search,title]);
  const filtered = rows.filter(row => filter === 'All' || row.state === filter);
  const pageSize=viewSize==='all'?Math.max(1,filtered.length):Number(viewSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  return <section className="panel request-panel overview-paginated-queue">
    <SectionTitle eyebrow={eyebrow} title={title}><button className="text-link" onClick={onViewQueue}>View queue <Icon name="arrow" size={15}/></button></SectionTitle>
    <div className="table-toolbar"><div className="tabs" aria-label="Request status filters">{['All','Pending','In review','Query'].map(status => <button type="button" key={status} className={filter===status?'selected':''} aria-pressed={filter===status} onClick={()=>{setPage(1);onFilter(status);}}>{status}<span className="queue-tab-count">{status==='All'?rows.length:rows.filter(row=>row.state===status).length}</span></button>)}</div><label className="table-search"><Icon name="search" size={16}/><input value={search} onChange={event=>{setPage(1);onSearch(event.target.value);}} placeholder="Find a ticket" aria-label="Find a ticket"/></label></div>
    <div className="queue-scroll-region" ref={scrollRef} role="region" aria-label="Scrollable request queue" tabIndex={0}>{renderRows(filtered.slice(start,start+pageSize))}</div>
    <footer className="queue-pagination"><span role="status" aria-live="polite">{filtered.length?`${start+1}–${Math.min(start+pageSize,filtered.length)}`:'0'} of <strong>{filtered.length}</strong> requests{filter!=='All'&&<span className="queue-overall-count"> · {rows.length} total</span>}</span><label className="queue-view-size">Rows per page<select aria-label="Rows per page" value={viewSize} onChange={event=>{const next=event.target.value;setViewSize(next);setPage(1);try{localStorage.setItem('uidmsQueueViewSize',next);}catch{}}}>{['5','10','20','50','100'].map(size=><option key={size} value={size}>{size}</option>)}<option value="all">All</option></select></label><nav aria-label="Request pagination"><button type="button" aria-label="Previous request page" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}><Icon name="chevron" size={15} className="queue-prev"/></button><span>Page {currentPage} of {pageCount}</span><button type="button" aria-label="Next request page" disabled={currentPage===pageCount} onClick={()=>setPage(currentPage+1)}><Icon name="chevron" size={15}/></button></nav></footer>
  </section>;
}
