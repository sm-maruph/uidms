import React from 'react';
import { Button } from './UI.jsx';

const blank = () => ({name:'',designation:'',employeeId:'',department:'',branch:'',adId:true,email:true,adRole:'',preferredEmail:'',msOffice:false,otherSoftwareEnabled:false,otherSoftware:''});

export default function NewUserFields({value,onChange}) {
  const people=value.people?.length?value.people:[blank()];
  const update=(index,key,next)=>onChange({...value,people:people.map((person,i)=>i===index?{...person,[key]:next}:person)});

  return <div className="new-user-fields">
    <div className="new-user-note"><strong>New joiner request</strong><span>New user provisioning is limited to Active Directory (AD ID) and email.</span></div>
    {people.map((person,index)=><section className="transfer-person-card" key={index}>
      <div className="transfer-person-heading"><strong>New user {index+1}</strong>{people.length>1&&<button type="button" onClick={()=>onChange({...value,people:people.filter((_,i)=>i!==index)})}>Remove</button>}</div>
      <div className="transfer-field-grid">
        <label>Full name<input required value={person.name} onChange={e=>update(index,'name',e.target.value)}/></label>
        <label>Designation<input required value={person.designation} onChange={e=>update(index,'designation',e.target.value)}/></label>
        <label>Employee ID<input value={person.employeeId} onChange={e=>update(index,'employeeId',e.target.value)}/></label>
        <label>Department<input required value={person.department} onChange={e=>update(index,'department',e.target.value)}/></label>
        <label>Branch<input required value={person.branch} onChange={e=>update(index,'branch',e.target.value)}/></label>
        <label>AD role / group<input value={person.adRole} onChange={e=>update(index,'adRole',e.target.value)} placeholder="e.g. Branch Operations"/></label>
      </div>
      <div className="new-user-services">
        <label><input type="checkbox" checked={person.adId} onChange={e=>update(index,'adId',e.target.checked)}/> Active Directory ID</label>
        <label><input type="checkbox" checked={person.email} onChange={e=>update(index,'email',e.target.checked)}/> Email account</label>
        {person.email&&<label className="preferred-email">Preferred email ID<input required value={person.preferredEmail} onChange={e=>update(index,'preferredEmail',e.target.value)} placeholder="name.surname"/><span>@combankbd.com</span></label>}
      </div>
      <div className="new-user-services">
        <strong>Required software</strong>
        <label><input type="checkbox" checked={person.msOffice} onChange={e=>update(index,'msOffice',e.target.checked)}/> MS Office</label>
        <label><input type="checkbox" checked={person.otherSoftwareEnabled} onChange={e=>update(index,'otherSoftwareEnabled',e.target.checked)}/> Other</label>
        {person.otherSoftwareEnabled&&<input value={person.otherSoftware} onChange={e=>update(index,'otherSoftware',e.target.value)} placeholder="Specify other software"/>}
      </div>
    </section>)}
    <Button type="button" variant="subtle" icon="plus" onClick={()=>onChange({...value,people:[...people,blank()]})}>Add another new user</Button>
  </div>;
}
