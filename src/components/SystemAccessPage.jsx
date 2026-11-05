import React from 'react';
import { SectionTitle } from './UI.jsx';

const requestTypes = [
  { title: 'New ID creation (on behalf)', description: 'Request an AD ID and email for one or more employees.' },
  { title: 'System ID creation (self-request)', description: 'Request your own non-AD system IDs and access. AD IDs must be requested on behalf.' },
  { title: 'Existing ID deletion', description: 'Request removal of an existing user ID.' },
  { title: 'ID reset / unlock', description: 'Reset a password or unlock an account.' },
  { title: 'ID upgrade', description: 'Request a change to an existing ID or its access.' },
  { title: 'Branch transfer', description: 'Update access when an employee moves branch.' },
  { title: 'Email creation', description: 'Request an individual or shared email account.' },
  { title: 'Mailing group change', description: 'Add or remove members from a mailing group.' },
  { title: 'Auto-forward change', description: 'Request an email auto-forwarding update.' },
  { title: 'IDrive access', description: 'Request access to IDrive.' },
  { title: 'N Drive access', description: 'Request access to N Drive.' },
  { title: 'External device email access', description: 'Request email access from an external device.' },
];

export default function SystemAccessPage({ onContinue }) {
  return (
    <section className="panel directory-panel system-access-request">
      <SectionTitle eyebrow="REQUEST CENTRE" title="System access" />
      <p className="directory-intro">Choose a request type to open its form. Your current assigned systems and roles are available under My Access.</p>
      <div className="system-access-cards">
        {requestTypes.map(({ title, description }, index) => (
          <button className="system-access-card" key={title} onClick={() => onContinue(title)}>
            <span className={`system-access-card-mark sm-${index % 5}`} aria-hidden="true">{title.charAt(0)}</span>
            <span className="system-access-card-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <span className="system-access-card-arrow" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
