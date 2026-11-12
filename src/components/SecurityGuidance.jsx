import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import '../security-guidance.css';

const guidance=[
  {title:'Access follows your responsibilities',text:'Request only the access needed for your role. Keep permissions aligned with assigned duties.',section:'8.1.3 / Chapter 8'},
  {title:'Approval before access',text:'New IDs, role changes and access revocations require authorization by the appropriate authority.',section:'8.1.4'},
  {title:'Keep responsibilities separate',text:'Access procedures should separate duties and clearly assign responsibility and accountability.',section:'8.1.1'},
  {title:'Every action must be traceable',text:'Identify user access activities uniquely and retain logs for audit and investigation.',section:'8.1.5'},
  {title:'Review access regularly',text:'Asset owners should periodically review whether each user still needs their permissions.',section:'8.2.3'},
  {title:'Remove access when duties change',text:'Revoke or disable permissions no longer needed after a transfer, role change or termination.',section:'8.2.4'},
];
const icons=['idCard','check','users','clock','search','key'];
const stages=[0,1,1,2,1,2];
export default function SecurityGuidance(){
  const [paused,setPaused]=useState(false);
  const [discovered,setDiscovered]=useState([0]);
  const [slide,setSlide]=useState({index:0,previous:null,version:0});
  const move=next=>setSlide(current=>({index:(next+guidance.length)%guidance.length,previous:current.index,version:current.version+1}));
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer;
    const schedule=()=>{
      clearTimeout(timer);
      if (!paused && !motion.matches && !document.hidden) timer=setTimeout(()=>setSlide(current=>({index:(current.index+1)%guidance.length,previous:current.index,version:current.version+1})),7000);
    };
    schedule();
    motion.addEventListener('change',schedule);
    document.addEventListener('visibilitychange',schedule);
    return ()=>{clearTimeout(timer);motion.removeEventListener('change',schedule);document.removeEventListener('visibilitychange',schedule);};
  },[paused,slide.version]);
  useEffect(()=>{
    setDiscovered(current=>current.includes(slide.index)?current:[...current,slide.index]);
  },[slide.index]);
  const item=guidance[slide.index];
  const renderReminder=(entry,index)=><><span className="guidance-slide-icon"><Icon name={icons[index]} size={23}/></span><div><small>ACCESS CONTROL / {String(index+1).padStart(2,'0')}</small><h3>{entry.title}</h3><p>{entry.text}</p><span className="guidance-clause">Section {entry.section}</span></div></>;
  return <section className={`login-security-guidance guidance-carousel ${paused?'is-paused':''}`} aria-labelledby="security-guidance-title">
    <header><span className="security-guidance-mark"><Icon name="key" size={18}/></span><div><small>BANGLADESH BANK</small><h2 id="security-guidance-title">ICT security reminders</h2></div><button type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused} aria-label={paused?'Resume security reminders':'Pause security reminders'}>{paused?'Resume':'Pause'}</button></header>
    <div className="guidance-explorer"><span className="explorer-emblem"><Icon name={discovered.length===guidance.length?'check':'idCard'} size={15}/></span><div><strong>{discovered.length===guidance.length?'All insights explored':'Access Explorer'}</strong><span>Discover the essentials of secure access</span></div><span className="explorer-count" key={discovered.length}>{discovered.length}<small> / {guidance.length}</small></span></div>
    <div className="explorer-progress" role="progressbar" aria-label="Security reminders discovered" aria-valuemin={0} aria-valuemax={guidance.length} aria-valuenow={discovered.length}><span style={{width:`${discovered.length/guidance.length*100}%`}}/></div>
    <div className="guidance-journey" aria-hidden="true">{['Request','Review','Manage access'].map((label,index)=><React.Fragment key={label}>{index>0&&<span className={`guidance-connector ${index<=stages[slide.index]?'is-complete':''}`}/>}<span className={`guidance-stage ${index===stages[slide.index]?'is-current':''}`}><i><Icon name={['idCard','check','key'][index]} size={14}/></i><small>{label}</small></span></React.Fragment>)}</div>
    <div className="guidance-slides" role="region" aria-label="ICT security guidance">
      {slide.previous!==null&&<article key={`out-${slide.version}`} className="guidance-slide is-leaving" aria-hidden="true">{renderReminder(guidance[slide.previous],slide.previous)}</article>}
      <article key={`in-${slide.version}`} className="guidance-slide is-entering">{renderReminder(item,slide.index)}</article>
    </div>
    <div className="guidance-controls"><div className="guidance-dots" aria-label="Choose a security reminder">{guidance.map((entry,index)=><button type="button" key={entry.title} aria-label={`Reminder ${index+1}: ${entry.title}`} className={discovered.includes(index)?'is-discovered':''} aria-current={index===slide.index?'true':undefined} onClick={()=>move(index)}/>)}</div><span>{slide.index+1} / {guidance.length}</span><button type="button" aria-label="Previous reminder" onClick={()=>move(slide.index-1)}><Icon name="chevron" size={14} style={{transform:'rotate(180deg)'}}/></button><button type="button" aria-label="Next reminder" onClick={()=>move(slide.index+1)}><Icon name="chevron" size={14}/></button></div>
    <div className="guidance-time-track" aria-hidden="true"><span key={slide.version}/></div>
    <footer><span>Summary of ICT Security v4.0 (2023)</span><a href="https://www.bb.org.bd/mediaroom/circulars/brpd/jun192023brpd10.pdf" target="_blank" rel="noreferrer">Read guideline <Icon name="arrow" size={12}/></a></footer>
  </section>;
}
