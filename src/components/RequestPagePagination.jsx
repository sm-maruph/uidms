import React, {useEffect, useRef, useState} from 'react';
import Icon from './Icon.jsx';
import '../request-page-pagination.css';

export default function RequestPagePagination({rows, resetKey, renderRows}) {
  const region=useRef(null);
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(5);
  useEffect(()=>{
    const element=region.current;
    if(!element)return;
    const observer=new ResizeObserver(()=>{
      const header=element.querySelector('.request-head');
      setPageSize(Math.max(1,Math.floor((element.clientHeight-(header?.getBoundingClientRect().height||0))/62)));
    });
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>setPage(1),[resetKey,pageSize]);
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  const current=Math.min(page,pages);
  const start=(current-1)*pageSize;
  return <>
    <div className="requests-page-table" ref={region}>{renderRows(rows.slice(start,start+pageSize))}</div>
    <footer className="queue-pagination">
      <span role="status" aria-live="polite">{rows.length?`${start+1}–${Math.min(start+pageSize,rows.length)}`:'0'} of <strong>{rows.length}</strong> requests</span>
      <nav aria-label="Request pagination">
        <button type="button" aria-label="Previous request page" disabled={current===1} onClick={()=>setPage(current-1)}><Icon name="chevron" size={15} className="queue-prev"/></button>
        <span>Page {current} of {pages}</span>
        <button type="button" aria-label="Next request page" disabled={current===pages} onClick={()=>setPage(current+1)}><Icon name="chevron" size={15}/></button>
      </nav>
    </footer>
  </>;
}
