import React, { useEffect, useRef, useState } from 'react';
import {createPortal} from 'react-dom';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';
import { mockSignature } from './signature.js';
import {api} from './SystemEmailWorkspace.jsx';
import {profileAccessRows,profileUpdatePayload} from './profileEditing.js';

export default function ProfileSignatureModal({ profile, onClose, onSave, onSaveProfile, catalog, databaseBacked=false }) {
  const [signature, setSignature] = useState(profile?.signature || (databaseBacked?'':mockSignature));
  const [error, setError] = useState('');
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(!onSaveProfile);
  const [designationId,setDesignationId]=useState(profile?.designationId||'');
  const [version,setVersion]=useState(profile?.version||'');
  const [access,setAccess]=useState([]);
  const [initialAccess,setInitialAccess]=useState([]);
  const [canEditAccess,setCanEditAccess]=useState(false);
  const [loadAttempt,setLoadAttempt]=useState(0);
  const nextKey=useRef(0);
  useEffect(()=>{
    if(!onSaveProfile)return;
    const controller=new AbortController();setLoaded(false);setError('');
    api('/profile',{signal:controller.signal}).then(result=>{
      if(controller.signal.aborted)return;
      setDesignationId(result.user.designationId||'');setVersion(result.user.version);
      const rows=profileAccessRows(result.access);setAccess(rows);setInitialAccess(rows);
      setCanEditAccess(Boolean(result.canEditAccess));setLoaded(true);
    }).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
    return()=>controller.abort();
  },[profile?.id,loadAttempt]);
  const updateAccess=(key,values)=>setAccess(current=>current.map(row=>row.key===key?{...row,...values}:row));
  const upload = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (databaseBacked&&(file.type!=='image/png'||file.size>262144)) {setError('Choose a PNG signature image no larger than 256 KB.');return;}
    if (!file.type.startsWith('image/')) { setError('Choose an image file for your signature.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setSignature(String(reader.result)); setError(''); };
    reader.onerror = () => setError('Could not read this image. Please try another file.');
    reader.readAsDataURL(file);
  };
  const save=async event=>{
    event.preventDefault();if(busy||!loaded)return;
    setBusy(true);setError('');
    try{
      if(onSaveProfile)await onSaveProfile(profileUpdatePayload({designationId,version,access,initialAccess,canEditAccess,signature,initialSignature:profile?.signature||''}));
      else await onSave(signature);
    }catch(error){setError(error.message);}finally{setBusy(false);}
  };
  const modal=<div className="modal-scrim profile-signature-scrim" onMouseDown={event => !busy&&event.target === event.currentTarget && onClose()}><form className={`profile-signature-modal ${onSaveProfile?'profile-editor-modal':''}`} role="dialog" aria-modal="true" aria-labelledby="signature-title" onSubmit={save}>
    <button type="button" className="icon-button profile-signature-close" disabled={busy} onClick={onClose} aria-label="Close"><Icon name="close"/></button>
    <p className="eyebrow">PROFILE</p><h2 id="signature-title">{onSaveProfile?'Edit profile':'Your e-signature'}</h2><p>{onSaveProfile?(canEditAccess?'Update your designation, current access and e-signature.':'Update your designation and e-signature. Review your current access below.'):'Save your signature once. UIDMS will attach it to your requests.'}</p>
    {onSaveProfile&&<>
      <div className="profile-editor-identity"><strong>{profile.name}</strong><span>{profile.employeeId} · {profile.role}</span></div>
      {!loaded&&!error&&<p role="status">Loading your profile…</p>}
      {!loaded&&error&&<Button type="button" variant="subtle" onClick={()=>setLoadAttempt(value=>value+1)}>Reload profile</Button>}
      <fieldset className="profile-editor-fields" disabled={!loaded||busy}>
        <label className="field-label">Designation<select value={designationId} onChange={event=>setDesignationId(event.target.value)}><option value="">Not specified</option>{designationId&&!(catalog?.organizations||[]).some(row=>row.Id===designationId&&row.Kind==='designation')&&<option value={designationId}>{profile.designation||'Recorded designation'}</option>}{(catalog?.organizations||[]).filter(row=>row.Kind==='designation').map(row=><option key={row.Id} value={row.Id}>{row.Name}</option>)}</select></label>
        <section className="profile-editor-access"><h3>Current access <span>{access.length}</span></h3>
          <p>{canEditAccess?'Record the systems and roles for your profile. Changes are audited.':'Request access changes through Create a request.'}</p>
          {access.map((row,index)=>{
            const systems=catalog?.systems||[];
            const roles=(catalog?.systemRoles||[]).filter(role=>role.SystemId===row.systemId);
            const recordedWithoutRole=initialAccess.some(original=>original.key===row.key&&original.systemId===row.systemId&&!original.systemRoleId);
            return canEditAccess?<div className="profile-access-entry" key={row.key}>
              <label>System<select required aria-label={`System ${index+1}`} value={row.systemId} onChange={event=>updateAccess(row.key,{systemId:event.target.value,systemRoleId:'',systemName:'',roleName:''})}><option value="">Select system</option>{row.systemId&&!systems.some(system=>system.Id===row.systemId)&&<option value={row.systemId}>{row.systemName||'Previously recorded system'}</option>}{systems.map(system=><option key={system.Id} value={system.Id}>{system.Name}</option>)}</select></label>
              <label>Access role<select aria-label={`Access role ${index+1}`} required={roles.length>0&&!recordedWithoutRole} value={row.systemRoleId} onChange={event=>updateAccess(row.key,{systemRoleId:event.target.value,roleName:''})}><option value="">{recordedWithoutRole?'Recorded access (no role)':roles.length?'Select role':'Standard access'}</option>{row.systemRoleId&&!roles.some(role=>role.Id===row.systemRoleId)&&<option value={row.systemRoleId}>{row.roleName||'Previously recorded role'}</option>}{roles.map(role=><option key={role.Id} value={role.Id}>{role.Name}</option>)}</select></label>
              <button type="button" className="icon-button" aria-label={`Remove access ${index+1}`} onClick={()=>setAccess(current=>current.filter(item=>item.key!==row.key))}><Icon name="close" size={16}/></button>
            </div>:<div className="profile-access-readonly" key={row.key}><strong>{row.systemName}</strong><span>{row.roleName||'Standard access'}</span></div>;
          })}
          {!access.length&&<p>No current access recorded.</p>}
          {canEditAccess&&<Button type="button" variant="subtle" icon="plus" onClick={()=>setAccess(current=>[...current,{key:`new-${++nextKey.current}`,systemId:'',systemRoleId:'',username:''}])}>Add system access</Button>}
        </section>
      </fieldset>
      <h3 className="profile-editor-signature-title">E-signature</h3>
    </>}
    {signature&&<div className="signature-preview"><img src={signature} alt="Signature preview"/></div>}
    <label className="field-label">Upload signature image<input type="file" disabled={busy||!loaded} accept={databaseBacked?'image/png':'image/*'} onChange={upload}/></label>
    {!databaseBacked&&<button type="button" className="login-setup" onClick={() => {setSignature(mockSignature);setError('');}}>Use mock e-signature</button>}
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="modal-actions"><Button type="button" disabled={busy} variant="subtle" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy||!loaded||(!onSaveProfile&&!signature)}>{busy?'Saving…':'Save to profile'}</Button></div>
  </form></div>;
  return typeof document==='undefined'?modal:createPortal(modal,document.body);
}
