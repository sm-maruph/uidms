import React, { useState } from 'react';

export default function MailingGroupFields({ profile, value, onChange, mailingGroups=[] }) {
  const fields = [['Full name',profile?.name],['Designation',profile?.designation],['Employee ID',profile?.employeeId],['Department',profile?.department],['Branch',profile?.branch],['User email address',profile?.email]];
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All');
  const [groupName,setGroupName]=useState('All');
  const currentGroups=mailingGroups.filter(group=>(group.members||[]).includes(profile?.employeeId));
  const choices=value.action==='Exclusion'?currentGroups:mailingGroups;
  const availableNames=[...new Set(choices.filter(group=>category==='All'||(group.category||'Branch')===category).map(group=>group.address.split('/')[0].replace(/^#/,'').trim()))].sort();
  const filteredChoices=choices.filter(group=>{
    const kind=group.category||'Branch';
    const name=group.address.split('/')[0].replace(/^#/,'').trim();
    return (category==='All'||kind===category)&&(groupName==='All'||name===groupName)&&group.address.toLowerCase().includes(search.trim().toLowerCase());
  });
  const selected=value.groupAddresses||[];
  const toggle=address=>onChange({...value,groupAddresses:selected.includes(address)?selected.filter(item=>item!==address):[...selected,address]});
  return <div className="mailing-group-fields">
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Requester Information</h3><p>These details are filled from your profile.</p></div><div className="auto-forward-profile-grid">{fields.map(([label,item])=><label key={label}>{label}<input value={item||''} readOnly/></label>)}</div></section>
    <section className="auto-forward-section"><div className="auto-forward-section-heading"><h3>Mailing Group Request</h3><p>Select one or more groups for the requested change.</p></div><fieldset className="mailing-group-action"><legend>Request action</legend><label><input type="radio" name="mailing-group-action" value="Inclusion" checked={value.action==='Inclusion'} onChange={()=>{onChange({...value,action:'Inclusion',groupAddresses:[]});setGroupName('All');}} required/> Add me to mailing group(s)</label><label><input type="radio" name="mailing-group-action" value="Exclusion" checked={value.action==='Exclusion'} onChange={()=>{onChange({...value,action:'Exclusion',groupAddresses:[]});setGroupName('All');}}/> Remove me from current group(s)</label></fieldset>{value.action&&<><div className="mailing-group-filters"><label>Search groups<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search group path"/></label><label>Filter by<select value={category} onChange={event=>{setCategory(event.target.value);setGroupName('All');}}><option>All</option><option>Branch</option><option>Department</option></select></label><label>{category==='All'?'Group name':category}<select value={groupName} onChange={event=>setGroupName(event.target.value)}><option>All</option>{availableNames.map(name=><option key={name}>{name}</option>)}</select></label></div><p className="mailing-group-count">Showing {filteredChoices.length} of {choices.length} groups</p><section className="mailing-group-selected" aria-live="polite"><strong>Selected groups ({selected.length})</strong>{selected.length?<div>{selected.map(address=><button type="button" key={address} onClick={()=>toggle(address)} aria-label={`Remove ${address}`}>{address}<span aria-hidden="true"> ×</span></button>)}</div>:<small>No groups selected</small>}</section><div className="mailing-group-options" role="group" aria-label={value.action==='Exclusion'?'Current mailing groups':'Available mailing groups'}>{filteredChoices.map(group=><label key={group.address}><input type="checkbox" checked={selected.includes(group.address)} onChange={()=>toggle(group.address)}/><span>{group.address}</span>{value.action==='Exclusion'&&<small>Current membership</small>}</label>)}{!filteredChoices.length&&<p>{choices.length?'No groups match these filters.':value.action==='Exclusion'?'You are not currently listed in any mailing groups.':'No mailing groups are configured yet. Contact an administrator.'}</p>}</div></>}</section>
  </div>;
}
