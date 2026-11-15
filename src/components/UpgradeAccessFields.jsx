import EmployeeDetails from './EmployeeDetails.jsx';
import React from 'react';
import { requestRoles, requestSystems, supportsAdditionalFunction } from './requestCatalog.js';
import { supportsSimilarId } from './similarIdSystems.js';
import { availableUpgradeRoles } from './upgradePermissions.js';

const upgradeSystems=[...new Set([...requestSystems,'N Drive','MS Office','External Device Access'])];

export default function UpgradeAccessFields({value,onChange,profile,readOnly=false}) {
  const access=profile?.access||{};
  const roleAccess=value.currentAccess||access.systemRoles||{};
  const enabledSystems=value.currentEnabledSystems||access.enabledSystems||[];
  const otherAccess=value.currentOtherAccess||access.otherAccess||[];
  const selectedSystems=value.systems||[];
  const selectedRoles=value.roles||{};
  const currentFor=system=>{
    const roles=roleAccess[system]||[];
    const enabled=roles.length>0||enabledSystems.includes(system)||otherAccess.includes(system);
    return {roles,enabled,label:roles.length?roles.join(', '):enabled?'Access enabled':'No current access'};
  };
  const currentAccess={systemRoles:roleAccess,enabledSystems,otherAccess};
  const toggle=system=>{
    if (!availableUpgradeRoles(currentAccess,system).length) return;
    const systems=selectedSystems.includes(system)?selectedSystems.filter(item=>item!==system):[...selectedSystems,system];
    const roles={...selectedRoles};
    if(!systems.includes(system))delete roles[system];
    onChange({...value,systems,roles});
  };
  const systems=[...new Set([...upgradeSystems,...selectedSystems])].filter(system=>readOnly?selectedSystems.includes(system):(
    currentFor(system).enabled
  ));
  return <section className="upgrade-access-form upgrade-redesign">
    <section className="upgrade-profile-section"><div className="upgrade-section-title"><span>01</span><div><h3>Requester information</h3><p>Access changes will apply to the employee below.</p></div></div>
      <EmployeeDetails profile={profile} showDesignation/>
    </section>
    <section><div className="upgrade-section-title"><span>02</span><div><h3>Select systems and requested roles</h3><p>Upgrade or downgrade roles for systems you already have access to. For access to another system, create a new ID request.</p></div><b className="upgrade-selection-count">{selectedSystems.length} selected</b></div>
      <section className="transfer-access upgrade-systems-required" aria-label="Systems Required"><h3>Systems Required</h3><p>Choose a different role to automatically select its system. Current roles are shown for reference.</p>{systems.map(system=>{
        const current=currentFor(system);
        const levels=availableUpgradeRoles(currentAccess,system);
        const checked=selectedSystems.includes(system);
        const selectedRole=selectedRoles[system];
        const canChange=current.enabled&&levels.length>0;
        const updateDetail=(key,next)=>onChange({...value,[key]:{...value[key],[system]:next}});
        return <div className="upgrade-system-block" key={system}>
          <div className="upgrade-system-roles"><label className="upgrade-system-name"><input type="checkbox" checked={checked} disabled={readOnly||!canChange} onChange={()=>toggle(system)}/><strong>{system}</strong></label>
            {(requestRoles[system]||[]).filter(role=>!readOnly||role===selectedRole).map(role=>{
              const isCurrent=current.roles.includes(role);
              return <label key={role} className={`upgrade-radio-role ${isCurrent||selectedRole&&selectedRole!==role?'is-muted':''}`}><input type="radio" name={`upgrade-role-${system}`} checked={checked&&selectedRole===role} disabled={readOnly||!levels.includes(role)} required={checked} onChange={()=>onChange({...value,systems:checked?selectedSystems:[...selectedSystems,system],roles:{...selectedRoles,[system]:role}})}/><span>{role}{isCurrent&&<small> (current)</small>}</span></label>;
            })}
          </div>
          <small className="upgrade-existing-access">Current access: {current.label}{!canChange?' - No role change available':''}</small>
          {checked&&supportsAdditionalFunction(system)&&<div className="upgrade-system-details"><label>Additional function for {system} (optional)<input aria-label={`Additional function for ${system}`} value={value.additionalFunctions?.[system]||''} readOnly={readOnly} onChange={event=>updateDetail('additionalFunctions',event.target.value)} placeholder="Enter additional function"/></label></div>}
          {checked&&supportsSimilarId(system)&&<div className="upgrade-system-details"><label>Similar ID for {system} (required)<input required aria-label={`Similar ID for ${system}`} value={value.similarIds?.[system]||''} readOnly={readOnly} onChange={event=>updateDetail('similarIds',event.target.value)} placeholder={`Enter a similar ID for ${system}`}/></label></div>}
        </div>;
      })}{!systems.length&&<p className="upgrade-no-results">No permitted systems match this view. Create a new ID request for access to another system.</p>}</section>
    </section>
  </section>;
}
