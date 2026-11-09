import React from 'react';
import { SectionTitle } from './UI.jsx';
import RequestTypeCards from './RequestTypeCards.jsx';

export default function SystemAccessPage({ onContinue, department }) {
  return (
    <section className="panel directory-panel system-access-request">
      <SectionTitle eyebrow="REQUEST CENTRE" title="System access" />
      <p className="directory-intro">Choose a request type to open its form. Your current assigned systems and roles are available under My Access.</p>
      <RequestTypeCards department={department} onContinue={onContinue}/>
    </section>
  );
}
