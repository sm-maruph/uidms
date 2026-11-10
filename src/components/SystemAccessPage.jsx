import React from 'react';
import { SectionTitle } from './UI.jsx';
import RequestTypeCards from './RequestTypeCards.jsx';

export default function SystemAccessPage({ onContinue, department, role }) {
  return (
    <section className="panel directory-panel system-access-request">
      <SectionTitle eyebrow="REQUEST CENTRE" title="Create a request" />
      <p className="directory-intro">Choose a request type to open its form. Your current assigned systems and roles are available under My Access.</p>
      <RequestTypeCards department={department} role={role} onContinue={onContinue}/>
    </section>
  );
}
