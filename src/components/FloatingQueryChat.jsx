import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { queriesForUser } from './queryInbox.js';
import '../floating-query-chat.css';

export default function FloatingQueryChat({ requests, profile, onOpen }) {
  const [expanded,setExpanded]=useState(false);
  const [announce,setAnnounce]=useState(false);
  const container=useRef(null);
  const trigger=useRef(null);
  const drag=useRef(null);
  const suppressClick=useRef(false);
  const [position,setPosition]=useState(null);
  const [defaultPosition,setDefaultPosition]=useState(null);
  const [dragging,setDragging]=useState(false);
  const constrain=(x,y)=>{
    const size=trigger.current?.offsetWidth||56;
    return {x:Math.max(8,Math.min(x,window.innerWidth-size-8)),y:Math.max(8,Math.min(y,window.innerHeight-size-8))};
  };
  useEffect(()=>{
    const resize=()=>setPosition(previous=>previous?constrain(previous.x,previous.y):null);
    window.addEventListener('resize',resize);
    return ()=>window.removeEventListener('resize',resize);
  },[]);
  const dragHandlers={
    onPointerEnter:event=>{
      if(event.pointerType==='mouse'&&!drag.current)setExpanded(true);
    },
    onPointerDown:event=>{
      if(!event.isPrimary||event.button!==0)return;
      const rect=event.currentTarget.getBoundingClientRect();
      drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};
      suppressClick.current=false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove:event=>{
      const current=drag.current;
      if(!current||current.id!==event.pointerId)return;
      const dx=event.clientX-current.x,dy=event.clientY-current.y;
      if(!current.moved&&Math.hypot(dx,dy)<5)return;
      current.moved=true;
      suppressClick.current=true;
      setDragging(true);
      setExpanded(false);
      setAnnounce(false);
      setPosition(constrain(current.left+dx,current.top+dy));
    },
    onPointerUp:()=>{drag.current=null;setDragging(false);},
    onPointerCancel:()=>{drag.current=null;suppressClick.current=true;setDragging(false);},
    onLostPointerCapture:()=>{drag.current=null;setDragging(false);},
    onClickCapture:event=>{
      if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false;}
    },
  };
  const pending=queriesForUser(requests,profile.employeeId).filter(entry=>entry.pending);
  const latest=pending[0];
  useEffect(()=>{
    if(position||!latest)return;
    const place=()=>{
      const inbox=document.querySelector('.query-inbox');
      if(!inbox){setDefaultPosition(null);return;}
      const rect=inbox.getBoundingClientRect();
      const size=trigger.current?.offsetWidth||56;
      const next=constrain(rect.right-size-12,rect.top+12);
      setDefaultPosition(previous=>previous?.x===next.x&&previous?.y===next.y?previous:next);
    };
    place();
    const observer=new ResizeObserver(place);
    observer.observe(document.body);
    const inbox=document.querySelector('.query-inbox');
    if(inbox)observer.observe(inbox);
    window.addEventListener('resize',place);
    window.addEventListener('scroll',place,true);
    return ()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  });
  const notificationKey=latest?`${profile.employeeId}:${latest.key}:${latest.query.at||''}`:'';
  useEffect(()=>{
    setExpanded(false);
    if(!notificationKey){setAnnounce(false);return;}
    setAnnounce(true);
    const timer=setTimeout(()=>setAnnounce(false),5000);
    return ()=>clearTimeout(timer);
  },[notificationKey]);
  useEffect(()=>{
    if(!expanded)return;
    const dismiss=event=>{if(!container.current?.contains(event.target))setExpanded(false);};
    document.addEventListener('pointerdown',dismiss);
    return ()=>document.removeEventListener('pointerdown',dismiss);
  },[expanded]);
  if(!latest)return null;
  const placement=position||defaultPosition;
  const bubbleSize=trigger.current?.offsetWidth||56;
  const bubbleTop=placement?.y??window.innerHeight-bubbleSize-24;
  const panelBelow=bubbleTop<window.innerHeight/2;
  const panelStyle={
    left:Math.max(8,Math.min((placement?.x??window.innerWidth-bubbleSize-24)+bubbleSize-350,window.innerWidth-358)),
    right:'auto',
    top:panelBelow?bubbleTop+bubbleSize+12:'auto',
    bottom:panelBelow?'auto':window.innerHeight-bubbleTop+12,
    maxHeight:Math.max(0,panelBelow?window.innerHeight-bubbleTop-bubbleSize-24:bubbleTop-24),
    marginBottom:0,
  };
  const openQuery=(entry,reply)=>{setExpanded(false);setAnnounce(false);onOpen(entry.ticket,reply);};
  return <div ref={container} style={placement?{right:window.innerWidth-placement.x-(trigger.current?.offsetWidth||56),bottom:window.innerHeight-placement.y-(trigger.current?.offsetHeight||56)}:undefined} className={`floating-query-chat${announce?' is-announcing':''}${dragging?' is-dragging':''}${placement&&placement.x<window.innerWidth/2?' caption-on-right':''}`} onKeyDown={event=>{if(event.key==='Escape'){setExpanded(false);container.current?.querySelector('.floating-query-trigger')?.focus();}}}>
    {expanded&&<section className="floating-query-panel" style={panelStyle} aria-label="Queries waiting for your reply"><header><div><small>YOUR RESPONSE NEEDED</small><h3>Query messages <b>{pending.length}</b></h3></div><button type="button" className="icon-button" aria-label="Close query messages" onClick={()=>setExpanded(false)}><Icon name="close"/></button></header><div className="floating-query-list">{pending.map(entry=><article className="floating-query-entry" key={entry.key}><div className="floating-query-entry-summary"><span className="floating-query-avatar"><Icon name="mail" size={17}/></span><div><strong>{entry.query.by||'Reviewer'}</strong><small>{entry.ticket.id} · {entry.query.role}</small><p>{entry.query.message}</p></div></div><div className="floating-query-entry-actions"><button type="button" className="button button-primary" onClick={()=>openQuery(entry,true)}>Reply</button><button type="button" className="button button-subtle" onClick={()=>openQuery(entry,false)}>View ticket</button></div></article>)}</div></section>}
    <div className="floating-query-launcher"><button type="button" className="floating-query-caption" onClick={()=>{setAnnounce(false);onOpen(latest.ticket);}} tabIndex={announce?0:-1}><strong>Query from {latest.query.by||'Reviewer'}</strong><small>{latest.ticket.id} · Reply needed</small></button><button type="button" ref={trigger} {...dragHandlers} className="floating-query-trigger" title="Drag to move; click to open queries" aria-label={`${pending.length} queries waiting for your reply`} aria-expanded={expanded} onClick={()=>{setExpanded(value=>!value);setAnnounce(false);}}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-4 3v-11a9 9 0 0 1 19 0Z" transform="translate(1 -1) scale(.95)"/><path d="M7 10h10M7 14h6"/></svg><b>{pending.length}</b></button></div>
    <span className="floating-query-sr" role="status">Query from {latest.query.by}, ticket {latest.ticket.id}, waiting for your reply.</span>
  </div>;
}
