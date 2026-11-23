import React, { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import RequestTypeCards from './RequestTypeCards.jsx';
import '../new-request-modal.css';

export default function NewRequestModal({ pendingChangeCount=0, department, role, profile, onClose, onContinue }) {
  const closeButton = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButton.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  return <div className="modal-scrim" onMouseDown={event=>event.target===event.currentTarget&&onClose()}>
    <section className="request-modal new-request-modal" role="dialog" aria-modal="true" aria-labelledby="new-request-title" onKeyDown={event=>{
      if(event.key==='Escape') {
        if(event.target.closest('.request-type-chooser-scrim')) return;
        event.stopPropagation();onClose();
      }
      if(event.key==='Tab') {
        const nested=event.currentTarget.querySelector('.request-type-chooser');
        const buttons=(nested||event.currentTarget).querySelectorAll('button:not([disabled])');
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }}>
      <header className="modal-header"><div><p className="eyebrow">START A REQUEST</p><h2 id="new-request-title">New request</h2></div><button ref={closeButton} type="button" className="icon-button" aria-label="Close new request" onClick={onClose}><Icon name="close"/></button></header>
      <p className="modal-subtitle">Choose a service to get started.</p>
      <RequestTypeCards pendingChangeCount={pendingChangeCount} compact department={department} role={role} profile={profile} onContinue={onContinue}/>
    </section>
  </div>;
}
