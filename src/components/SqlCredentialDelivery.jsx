import React,{useEffect,useState} from 'react';
import {api} from './SystemEmailWorkspace.jsx';
import {Button} from './UI.jsx';

export default function SqlCredentialDelivery({ticket,write}){
 const [delivery,setDelivery]=useState(null);
 const [rows,setRows]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  api('/deliveries',{signal:controller.signal}).then(({items})=>{
   if(!controller.signal.aborted)setDelivery(items.find(row=>row.RequestId===ticket.sqlId)||null);
  }).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
  return()=>controller.abort();
 },[ticket.sqlId]);
 if(!delivery&&!rows&&!error)return null;
 return <section className="fulfilment-panel">
  <h3>Secure credential delivery</h3>
  {error&&<p role="alert">{error}</p>}
  {delivery&&!rows&&<><p>Credentials can be opened once.</p><Button type="button" disabled={busy} onClick={async()=>{
   setBusy(true);setError('');
   try{const result=await write('/deliveries/'+delivery.Id+'/consume','POST',{});setRows(result.credentials);}
   catch(error){setError(error.code==='REAUTHENTICATION_REQUIRED'?'Sign in again before opening these credentials.':error.message);}
   finally{setBusy(false);}
  }}>Open credentials</Button></>}
  {rows?.map((row,index)=><dl className="credential-row" key={index}><dt>Employee ID</dt><dd>{row.employeeId}</dd><dt>System</dt><dd>{ticket.sqlItems?.find(item=>item.systemId===row.systemId)?.system||row.systemId}</dd><dt>Username</dt><dd>{row.username}</dd><dt>Temporary password</dt><dd>{row.password}</dd></dl>)}
 </section>;
}
