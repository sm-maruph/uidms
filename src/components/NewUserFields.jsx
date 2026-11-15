import { newUserApproverRole, matchesNewUserApprover } from './newUserWorkflow.js';
import React from 'react';
import { Button } from './UI.jsx';
import '../new-user-form.css';
import { defaultDesignations } from './designations.js';
import { defaultDepartments } from './departments.js';

const blank = () => ({name:'',designation:'',employeeId:'',department:'',branch:'',adId:true,email:true,adRole:'',preferredEmail:'',msOffice:false,otherSoftwareEnabled:false,otherSoftware:''});

export const branchOptions = ['Agrabad Branch','CDA Avenue SME Service Centre','CEPZ Sub Branch','Corporate Branch','DEPZ Sub-Branch & Offshore Banking Unit','Dhanmondi Branch','Dhaka OBU','Digital Banking and Card Centre','Gulshan Branch','Jubilee Road SME Service Centre','Mirpur Branch','Motijheel Branch','Narayangonj Branch','Old Dhaka SME Service Centre','Panthapath Branch','Pragati Sarani SME Service Centre','Shantinagar SME Service Centre','Sylhet Branch','Tejgaon Branch','Tongi SME Service Centre','US Embassy Sub Branch','Uttara Branch'];

export default function NewUserFields({value,onChange,users=[],branches=[],departments=[]}) {
  const people=value.people?.length?value.people:[blank()];
  const update=(index,key,next)=>onChange({...value,people:people.map((person,i)=>i===index?{...person,[key]:next}:person)});
  const unique=items=>[...new Set(items.filter(Boolean))];
  const options={
    designation:defaultDesignations,
    department:unique([...defaultDepartments,...departments]),
    branch:unique(['Head Office','Corporate Office',...branchOptions,...branches,...users.map(user=>user.branch)]),
    adRole:unique(['Standard employee','Branch Operations',...users.map(user=>user.adRole)])
  };
  const dropdown=(person,index,key,label,required=false)=>{
    const selected=key==='designation'&&person[key]?.trim().toLowerCase()==='super admin'?'':person[key]||'';
    return <label>{label}<select required={required} value={selected} onChange={e=>update(index,key,e.target.value)}><option value="">Select {label.toLowerCase()}</option>{unique([...options[key],selected]).map(option=><option key={option} value={option}>{option}</option>)}</select></label>;
  };

  return <div className="new-user-fields">

    {people.map((person,index)=><section className="transfer-person-card" key={index}>
      <div className="transfer-person-heading"><div className="new-user-person-title"><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><strong>New user {index+1}</strong><small>Employee details & access</small></div></div>{people.length>1&&<button type="button" onClick={()=>onChange({...value,people:people.filter((_,i)=>i!==index)})}>Remove</button>}</div>
      <div className="transfer-field-grid">
        <label>Full name<input required value={person.name} onChange={e=>update(index,'name',e.target.value)}/></label>
        {dropdown(person,index,'designation','Designation',true)}
        <label>Employee ID<input value={person.employeeId} onChange={e=>update(index,'employeeId',e.target.value)}/></label>
        {dropdown(person,index,'branch','Branch',true)}
        {dropdown(person,index,'department','Department',true)}
        {dropdown(person,index,'adRole','AD role / group')}
      </div>
      {person.branch&&<div className="new-user-routing" role="status"><strong>Initial approval and ID custody: {newUserApproverRole(person)}</strong><span>{newUserApproverRole(person)==='Department head'&&!person.department?'Select a department to find its department head.':`${newUserApproverRole(person)==='Department head'?person.department:person.branch} ? ${users.filter(user=>matchesNewUserApprover(person,user)).map(user=>user.name).join(', ')||'No matching approver configured'}`}</span></div>}
      <div className="new-user-services new-user-account-services">
        <strong className="new-user-section-label">Account services</strong>
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
