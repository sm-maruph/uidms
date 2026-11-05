import React, { useState } from 'react';
import { Button } from './UI.jsx';

const roles=['User','Branch manager','Department head','IT','CITO','COO','HR','Administrator'];
const designations=['Officer','Senior Officer','Manager','Senior Manager','Department Head','Branch Manager','IT Officer'];
const departments=['IT Division','Operations','Human Resources','Finance','Risk Management','Corporate Banking'];
const branches=['Corporate Office','Gulshan Branch','Dhanmondi Branch','Banani Branch','Chattogram Branch'];

export default function Login({onLogin}) {
  const [name,setName]=useState('Rahim Ahmed');
  const [email,setEmail]=useState('shahriarmaruph@combankbd.com');
  const [employeeId,setEmployeeId]=useState('CB-10428');
  const [designation,setDesignation]=useState('Officer');
  const [department,setDepartment]=useState('IT Division');
  const [branch,setBranch]=useState('Corporate Office');
  const [role,setRole]=useState('User');
  const [setup,setSetup]=useState(false);
  const field=(label,control)=><label className="field-label">{label}{control}</label>;
  return <main className="login-screen"><form className="login-card" onSubmit={e=>{e.preventDefault();onLogin({name,email,employeeId,designation,department,branch,role});}}><div className="brand-mark">C</div><p className="eyebrow">COMMERCIAL BANK OF CEYLON · IDENTITY OPERATIONS</p><h1>Welcome to UIDMS</h1><p className="login-copy">Sign in to manage identity requests and access approvals.</p>{field('Email or employee ID',<input value={email} onChange={e=>setEmail(e.target.value)} required/>)}{field('Mock role',<select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(value=><option key={value}>{value}</option>)}</select>)}{setup&&<>{field('Full name',<input value={name} onChange={e=>setName(e.target.value)} required/>)}{field('Employee ID',<input value={employeeId} onChange={e=>setEmployeeId(e.target.value)}/>)}{field('Designation',<select value={designation} onChange={e=>setDesignation(e.target.value)}>{designations.map(value=><option key={value}>{value}</option>)}</select>)}{field('Department',<select value={department} onChange={e=>setDepartment(e.target.value)}>{departments.map(value=><option key={value}>{value}</option>)}</select>)}{field('Branch',<select value={branch} onChange={e=>setBranch(e.target.value)}>{branches.map(value=><option key={value}>{value}</option>)}</select>)}</>}<Button type="submit">Continue to workspace</Button><button type="button" className="login-setup" onClick={()=>setSetup(!setup)}>{setup?'Hide profile details':'First time here? Complete your profile'}</button><small className="mock-hint">Mock sign-in · choose a role to preview its dashboard</small></form></main>;
}
