import {useEffect,useState} from 'react';
import {retryTimeLabel} from './rateLimit.js';

export function useRateLimitCooldown(){
 const [deadline,setDeadline]=useState(0),[now,setNow]=useState(Date.now);
 useEffect(()=>{
  if(!deadline)return;
  const timer=setInterval(()=>{const time=Date.now();setNow(time);if(time>=deadline)clearInterval(timer);},1000);
  return()=>clearInterval(timer);
 },[deadline]);
 const remaining=Math.max(0,Math.ceil((deadline-now)/1000));
 const register=error=>{
  if(error.status!==429)return;
  const seconds=Number.isFinite(error.retryAfterSeconds)?Math.max(1,error.retryAfterSeconds):60;
  const time=Date.now();setNow(time);setDeadline(time+seconds*1000);
 };
 return {blocked:remaining>0,remaining,label:retryTimeLabel(remaining),register};
}
