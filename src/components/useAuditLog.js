import {useCallback,useEffect,useRef,useState} from 'react';
import {AUDIT_KEY,readAudit,mergeAudit,ticketAuditEvents,deletionAuditEvents,auditEvent} from './auditLog.js';

export default function useAuditLog(requests,deletions,users,profile,organization={}) {
  const {branches,departments,designations,mailingGroups}=organization;
  const [events,setEvents]=useState(readAudit);const cache=useRef(events);const [storageError,setStorageError]=useState('');
  const previousUsers=useRef(users);
  const previousOrganization=useRef(organization);
  const append=useCallback(incoming=>{
    const merged=mergeAudit(mergeAudit(readAudit(),cache.current),incoming);
    if(merged.length===cache.current.length&&!incoming.length)return true;
    try { localStorage.setItem(AUDIT_KEY,JSON.stringify(merged));setStorageError(''); }
    catch { cache.current=merged;setEvents(merged);setStorageError('Audit storage is unavailable. New events are visible in this session but may be lost after reload. Export a report to retain them.');return false; }
    if(merged.length!==cache.current.length){cache.current=merged;setEvents(merged);}
    return true;
  },[]);
  const record=useCallback((type,actor,details)=>append([auditEvent(type,actor,details)]),[append]);
  useEffect(()=>{append([...requests.flatMap(ticketAuditEvents),...deletions.map(deletionAuditEvents)]);},[requests,deletions,append]);
  useEffect(()=>{
    const before=previousUsers.current;previousUsers.current=users;
    if(!profile||before===users)return;
    const changes=[];const fields=['name','role','branch','department','designation'];
    for(const user of users){
      const old=before.find(item=>item.employeeId===user.employeeId);
      if(!old)changes.push(auditEvent('Create',profile,{category:'Account',entityId:user.employeeId,title:user.name,message:`Account created with role ${user.role}`}));
      else {const changed=fields.filter(field=>old[field]!==user[field]);if(changed.length)changes.push(auditEvent('Update',profile,{category:'Account',entityId:user.employeeId,title:user.name,message:changed.map(field=>`${field}: ${old[field]||'Not set'} → ${user[field]||'Not set'}`).join('; ')}));}
    }
    for(const old of before)if(!users.some(user=>user.employeeId===old.employeeId))changes.push(auditEvent('Delete',profile,{category:'Account',entityId:old.employeeId,title:old.name,message:'Account removed'}));
    if(changes.length)append(changes);
  },[users,profile,append]);
  useEffect(()=>{
    const before=previousOrganization.current;
    previousOrganization.current={branches,departments,designations,mailingGroups};
    if(!profile)return;
    const changes=[];
    for(const [key,label,current] of [['branches','Branch',branches],['departments','Department',departments],['designations','Designation',designations]]) {
      if(!current||!before[key]||current===before[key])continue;
      for(const name of current)if(!before[key].includes(name))changes.push(auditEvent('Create',profile,{category:'Organization',entityId:`${label}: ${name}`,title:name,message:`${label} added`}));
      for(const name of before[key])if(!current.includes(name))changes.push(auditEvent('Delete',profile,{category:'Organization',entityId:`${label}: ${name}`,title:name,message:`${label} removed`}));
    }
    if(mailingGroups&&before.mailingGroups&&mailingGroups!==before.mailingGroups) {
      for(const group of mailingGroups){
        const old=before.mailingGroups.find(item=>item.address===group.address);
        if(!old)changes.push(auditEvent('Create',profile,{category:'Organization',entityId:group.address,title:'Mailing group',message:'Mailing group created'}));
        else if(old.category!==group.category||JSON.stringify(old.members)!==JSON.stringify(group.members))changes.push(auditEvent('Update',profile,{category:'Organization',entityId:group.address,title:'Mailing group',message:`Membership or category changed; ${(old.members||[]).length} → ${(group.members||[]).length} members`}));
      }
      for(const old of before.mailingGroups)if(!mailingGroups.some(group=>group.address===old.address))changes.push(auditEvent('Delete',profile,{category:'Organization',entityId:old.address,title:'Mailing group',message:'Mailing group removed'}));
    }
    if(changes.length)append(changes);
  },[branches,departments,designations,mailingGroups,profile,append]);
  useEffect(()=>{
    const sync=event=>{if(event.key!==AUDIT_KEY)return;const merged=mergeAudit(cache.current,readAudit());if(merged.length!==cache.current.length){cache.current=merged;setEvents(merged);}};
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);
  return {events,record,append,storageError};
}
