import React,{useEffect,useRef} from 'react';
import Icon from './Icon.jsx';
import {driveOptionsForType} from './drivePolicy.js';

export default function DriveChoicePopup({onSelect,onClose}){
 const popup=useRef(null);
 const chosen=useRef(false);
 useEffect(()=>{
  const previous=document.activeElement;
  popup.current?.querySelector('[data-drive-choice]')?.focus();
  return ()=>{if(!chosen.current&&previous?.isConnected)previous.focus();};
 },[]);
 return <div className="request-type-chooser-scrim" onMouseDown={event=>event.target===event.currentTarget&&onClose()} onKeyDown={event=>{
  if(event.key==='Escape'){event.stopPropagation();onClose();}
  if(event.key==='Tab'){
   event.stopPropagation();
   const buttons=[...popup.current.querySelectorAll('button')];
   if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1)?.focus();}
   else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0]?.focus();}
  }
 }}><section ref={popup} className="request-type-chooser" role="dialog" aria-modal="true" aria-labelledby="drive-choice-title">
  <button type="button" className="icon-button request-type-chooser-close" aria-label="Close drive selection" onClick={onClose}><Icon name="close"/></button>
  <p className="eyebrow">I DRIVE / S DRIVE ACCESS</p><h2 id="drive-choice-title">Select a drive</h2>
  <p className="request-type-chooser-intro">Choose the drive to open its access request form.</p>
  <div className="request-type-chooser-options">{driveOptionsForType('IDrive access').map(option=><button data-drive-choice type="button" key={option.system} onClick={()=>{chosen.current=true;onSelect(option.system);}}><span className="request-type-choice-icon"><Icon name="hardDrive" size={21}/></span><span><strong>{option.label}</strong><small>Request access to {option.label}.</small></span><Icon name="chevron" size={18}/></button>)}</div>
 </section></div>;
}
