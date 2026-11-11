import React from 'react';

export default function ExternalDeviceAccessFields({profile,value,onChange}) {
  const update=(key,next)=>onChange({...value,[key]:next});
  return <div className="external-device-access-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Requester Information</h3><p>Details are filled from your UIDMS profile.</p></div><div className="auto-forward-profile-grid">{[['Full name',profile?.name],['Employee ID / System ID',profile?.employeeId||profile?.systemId],['Department',profile?.department],['Branch',profile?.branch],['Email address',profile?.email]].map(([label,detail])=><label key={label}>{label}<input value={detail||''} readOnly/></label>)}</div></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>External Device Details</h3><p>Provide the device details for which email access is requested.</p></div><div className="transfer-field-grid"><label>Device model<input required value={value.deviceModel||''} onChange={event=>update('deviceModel',event.target.value)} placeholder="e.g. iPhone 15"/></label><label>Device number<input required value={value.deviceNumber||''} onChange={event=>update('deviceNumber',event.target.value)} placeholder="Device or asset number"/></label><label>Serial number<input required value={value.serialNumber||''} onChange={event=>update('serialNumber',event.target.value)} placeholder="Device serial number"/></label></div></section>
  </div>;
}
