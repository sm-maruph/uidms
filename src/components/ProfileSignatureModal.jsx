import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';
import { mockSignature } from './signature.js';

export default function ProfileSignatureModal({ profile, onClose, onSave }) {
  const [signature, setSignature] = useState(profile?.signature || mockSignature);
  const [error, setError] = useState('');
  const upload = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file for your signature.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setSignature(String(reader.result)); setError(''); };
    reader.onerror = () => setError('Could not read this image. Please try another file.');
    reader.readAsDataURL(file);
  };
  return <div className="modal-scrim profile-signature-scrim" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="profile-signature-modal" role="dialog" aria-modal="true" aria-labelledby="signature-title">
    <button type="button" className="icon-button profile-signature-close" onClick={onClose} aria-label="Close"><Icon name="close"/></button>
    <p className="eyebrow">PROFILE</p><h2 id="signature-title">Your e-signature</h2><p>Save your signature once. UIDMS will attach it to your requests.</p>
    <div className="signature-preview"><img src={signature} alt="Signature preview"/></div>
    <label className="field-label">Upload signature image<input type="file" accept="image/*" onChange={upload}/></label>
    <button type="button" className="login-setup" onClick={() => {setSignature(mockSignature);setError('');}}>Use mock e-signature</button>
    {error&&<p className="form-error">{error}</p>}
    <div className="modal-actions"><Button type="button" variant="subtle" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => onSave(signature)}>Save to profile</Button></div>
  </section></div>;
}
