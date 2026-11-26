import React,{useEffect,useRef,useState} from 'react';
import Icon from './Icon.jsx';
import {api} from './SystemEmailWorkspace.jsx';
import {notificationPageSize,notificationLabel,claimDesktopAlerts} from './notificationAlerts.js';
import '../notifications.css';

const timestamp=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dhaka'});
const supported=()=>window.isSecureContext&&'Notification' in window;
export default function NotificationCenter({userId,enabled,onOpen,onAlert}){
 const [open,setOpen]=useState(false),[scope,setScope]=useState('recent'),[page,setPage]=useState(1);
 const [data,setData]=useState({items:[],total:0,unread:0,archivedTotal:0});
 const [counts,setCounts]=useState({unread:0,archivedTotal:0});
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const [permission,setPermission]=useState(supported()?Notification.permission:'unsupported');
 const [desktop,setDesktop]=useState(()=>{try{return localStorage.getItem(`uidms:desktop-enabled:${userId}`)==='true';}catch{return false;}});
 const [desktopError,setDesktopError]=useState('');
 const root=useRef(null),callbacks=useRef({onOpen,onAlert,desktop,enabled}),alerts=useRef(new Set());
 callbacks.current={onOpen,onAlert,desktop,enabled};
 const closeAlerts=()=>{for(const alert of alerts.current)alert.close();alerts.current.clear();};
 useEffect(()=>()=>closeAlerts(),[]);
 useEffect(()=>{
  const change=event=>{if(event.key===null||event.key===`uidms:desktop-enabled:${userId}`){const active=event.newValue==='true';setDesktop(active);if(!active)closeAlerts();}};
  window.addEventListener('storage',change);return()=>window.removeEventListener('storage',change);
 },[userId]);
 useEffect(()=>{if(!enabled){setOpen(false);closeAlerts();}},[enabled]);
 useEffect(()=>{
  if(!open)return;
  const outside=event=>{if(!root.current?.contains(event.target))setOpen(false);};
  const escape=event=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 useEffect(()=>{
  if(!enabled||!open)return;
  const controller=new AbortController();setLoading(true);setError('');
  api(`/notifications?scope=${scope}&page=${page}&pageSize=${notificationPageSize}`,{signal:controller.signal}).then(result=>{
   if(controller.signal.aborted)return;
   const last=Math.max(1,Math.ceil(result.total/notificationPageSize));
   if(page>last){setPage(last);return;}
   setData(result);setCounts({unread:result.unread,archivedTotal:result.archivedTotal});
  }).catch(err=>{if(!controller.signal.aborted)setError(err.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[enabled,open,scope,page,revision]);
 useEffect(()=>{
  if(!enabled)return;
  const controller=new AbortController();let cursor,timer,pending=false,stopped=false;
  const tick=async()=>{
   if(pending||stopped||controller.signal.aborted)return;
   pending=true;let nextDelay=15000;
   try{
    const result=await api('/notifications/feed'+(cursor===undefined?'':`?after=${cursor}`),{signal:controller.signal});
    if(controller.signal.aborted)return;
    setCounts({unread:result.unread,archivedTotal:result.archivedTotal});
    if(result.items.length){
     setRevision(value=>value+1);
     callbacks.current.onAlert?.(result.items.length===1?result.items[0].Message:`${result.items.length} new UIDMS notifications.`);
     if(callbacks.current.desktop&&supported()&&Notification.permission==='granted'){
      try{await claimDesktopAlerts(userId,result.items,async rows=>{
       if(!rows.length||controller.signal.aborted||!callbacks.current.enabled)return;
       // One notification per poll avoids bursts; the paginated inbox retains every item.
       const row=rows[0];
       const alert=new Notification(rows.length>1?`${rows.length} UIDMS updates`:notificationLabel(row.Message),{
        body:'A request needs your attention. Open UIDMS to review it.',icon:'/favicon.svg',tag:`uidms-${userId}`,silent:false,
       });
       alerts.current.add(alert);alert.onclose=()=>alerts.current.delete(alert);
       alert.onclick=()=>{alert.close();window.focus();if(!callbacks.current.enabled)return;if(rows.length===1){setOpen(false);Promise.resolve(callbacks.current.onOpen(row)).catch(err=>callbacks.current.onAlert?.(err.message));}else setOpen(true);};
      });}catch{setDesktopError('Desktop alerts could not be displayed. Check browser notification permissions.');}
     }
    }
    cursor=result.cursor;if(result.hasMore)nextDelay=500;
   }catch(err){
    if(!controller.signal.aborted){
     if(err.status===401)stopped=true;
     else if(err.status===429)nextDelay=Math.max(30000,(err.retryAfterSeconds||60)*1000);
     else nextDelay=30000;
     // Desktop errors must not break the in-app inbox.
     if(err.name==='NotAllowedError'||err.name==='TypeError')setDesktopError('Desktop alerts could not be displayed. Check browser notification permissions.');
    }
   }finally{pending=false;if(!stopped&&!controller.signal.aborted)timer=setTimeout(tick,nextDelay);}
  };
  const focus=()=>{if(supported())setPermission(Notification.permission);clearTimeout(timer);tick();};
  tick();window.addEventListener('focus',focus);
  return()=>{controller.abort();clearTimeout(timer);window.removeEventListener('focus',focus);closeAlerts();};
 },[enabled,userId]);
 const toggleDesktop=async()=>{
  setDesktopError('');
  if(!supported())return;
  if(desktop){setDesktop(false);closeAlerts();try{localStorage.setItem(`uidms:desktop-enabled:${userId}`,'false');}catch{}return;}
  try{
   const value=await Notification.requestPermission();setPermission(value);
   if(value==='granted'){setDesktop(true);try{localStorage.setItem(`uidms:desktop-enabled:${userId}`,'true');}catch{}}
  }catch{setDesktopError('Could not enable desktop alerts. Check this site’s browser permissions.');}
 };
 const openItem=async row=>{
  setError('');
  try{
   await onOpen(row);setRevision(value=>value+1);setOpen(false);
  }catch(err){setError(err.message);}
 };
 const totalPages=Math.max(1,Math.ceil(data.total/notificationPageSize));
 return <div ref={root} className="notification-menu-wrap">
  <button type="button" disabled={!enabled} className="icon-button notification-button" onClick={()=>setOpen(value=>!value)} aria-label={`Notifications, ${counts.unread} unread`} aria-expanded={open}><Icon name="bell" size={19}/>{counts.unread>0&&<i>{counts.unread>99?'99+':counts.unread}</i>}</button>
  {open&&<section className="notification-popover notification-center" aria-label="Your notifications">
   <header><div><strong>Notifications</strong><small>Request activity · Dhaka time</small></div><button type="button" className="icon-button" aria-label="Close notifications" onClick={()=>setOpen(false)}><Icon name="close" size={17}/></button></header>
   <nav className="notification-tabs" aria-label="Notification period">{[['recent','Last month'],['archived','Archive']].map(([value,label])=><button key={value} type="button" aria-pressed={scope===value} onClick={()=>{setScope(value);setPage(1);}}>{label}<span>{value==='recent'?counts.unread:counts.archivedTotal}</span></button>)}</nav>
   <div className="notification-desktop"><button type="button" disabled={!supported()||permission==='denied'} onClick={toggleDesktop}>{desktop&&permission==='granted'?'Disable desktop alerts':'Enable desktop alerts'}</button><small>{permission==='unsupported'?'Desktop alerts require a supported browser and trusted HTTPS.':permission==='denied'?'Blocked in browser settings. Allow notifications for this site.':desktop&&permission==='granted'?'Enabled while signed in with UIDMS open.':'Allow PC alerts for requests that need your attention.'}</small>{desktopError&&<p role="status">{desktopError}</p>}</div>
   {error&&<div className="notification-error" role="alert">{error}<button type="button" onClick={()=>setRevision(value=>value+1)}>Retry</button></div>}
   <div className="notification-items" aria-busy={loading}>{loading?<p>Loading notifications…</p>:!data.items.length?<p>{scope==='archived'?'No archived notifications.':'No notifications in the last month.'}</p>:data.items.map(row=><button type="button" key={row.Id} className={row.ReadAt?'':'unread'} onClick={()=>openItem(row)}><span className="notification-kind">{notificationLabel(row.Message)}{!row.ReadAt&&<i aria-label="Unread"/>}</span><strong>{row.Message}</strong><small>{timestamp.format(new Date(row.CreatedAt))}</small></button>)}</div>
   <footer><small>{data.total?`${(page-1)*notificationPageSize+1}–${Math.min(page*notificationPageSize,data.total)} of ${data.total}`:'0 notifications'}</small><div><button type="button" disabled={loading||page<=1} onClick={()=>setPage(value=>value-1)}>Previous</button><span>{page}/{totalPages}</span><button type="button" disabled={loading||page>=totalPages} onClick={()=>setPage(value=>value+1)}>Next</button></div></footer>
  </section>}
 </div>;
}
