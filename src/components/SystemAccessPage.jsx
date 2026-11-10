import React, { useState } from 'react';
import Icon from './Icon.jsx';
import RequestTypeCards from './RequestTypeCards.jsx';
import '../request-centre.css';

const categories = ['All requests', 'Identity & access', 'Email & collaboration', 'Files & devices'];

export default function SystemAccessPage({ onContinue, department }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All requests');
  return <section className="request-centre" aria-labelledby="request-centre-title">
    <header className="rc-hero">
      <div><p className="rc-eyebrow"><span/> REQUEST CENTRE</p><h1 id="request-centre-title">What can we help you with?</h1><p>From a new identity to the access you need. Start your next request here.</p><div className="rc-hero-tags"><span><Icon name="check" size={14}/> Guided request forms</span><span><Icon name="clock" size={14}/> Track every step</span></div></div>
      <div className="rc-hero-art" aria-hidden="true"><span className="rc-art-orbit"/><span className="rc-art-icon"><Icon name="idCard" size={42}/></span><span className="rc-art-check"><Icon name="check" size={19}/></span></div>
    </header>
    <div className="rc-layout"><div className="rc-services">
      <div className="rc-catalog-heading"><div><h2>Choose a service</h2><p>Select a request type to open its form.</p></div><label className="rc-search"><Icon name="search" size={18}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search requests…" aria-label="Search request types"/>{query && <button type="button" onClick={()=>setQuery('')} aria-label="Clear search"><Icon name="close" size={15}/></button>}</label></div>
      <div className="rc-filters" role="group" aria-label="Filter request categories">{categories.map(item=><button type="button" key={item} aria-pressed={category===item} className={category===item?'is-active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div>
      <RequestTypeCards department={department} onContinue={onContinue} query={query} category={category}/>
    </div><aside className="rc-guide" aria-labelledby="rc-guide-title">
      <div className="rc-guide-heading"><span><Icon name="branch" size={20}/></span><p className="rc-eyebrow">A CLEAR PATH FORWARD</p><h2 id="rc-guide-title">From request to ready.</h2><p>A few simple steps to get your request moving.</p></div>
      <ol className="rc-steps"><li><span>01</span><div><strong>Choose your service</strong><p>Pick the request that matches what you need.</p></div></li><li><span>02</span><div><strong>Add the details</strong><p>Complete the form and explain the business need.</p></div></li><li><span>03</span><div><strong>Review & sign</strong><p>Check your information and confirm your e-signature.</p></div></li><li><span>04</span><div><strong>Submit & track</strong><p>Follow approvals and updates under My requests.</p></div></li></ol>
      <div className="rc-guide-note"><Icon name="key" size={18}/><p>Checking what you already have? Find your assigned systems and roles under <strong>My access</strong>.</p></div>
    </aside></div>
    <footer className="rc-footer"><Icon name="users" size={15}/><span>Available services follow your department permissions.</span><span>Commercial Bank · Identity operations</span></footer>
  </section>;
}
