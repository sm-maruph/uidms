export function retryAfterSeconds(header,bodyValue,now=Date.now()){
 for(const value of [bodyValue,header]){
  if(value!==undefined&&value!==null&&/^\d+$/.test(String(value))){
   const seconds=Number(value);
   if(Number.isSafeInteger(seconds))return Math.min(86400,Math.max(1,seconds));
  }
 }
 if(header){const timestamp=Date.parse(header);if(Number.isFinite(timestamp))return Math.min(86400,Math.max(1,Math.ceil((timestamp-now)/1000)));}
 return 60;
}
export function retryTimeLabel(seconds){
 const remaining=Math.max(0,Math.ceil(seconds));
 return remaining>=60?`${Math.floor(remaining/60)}m ${remaining%60}s`:`${remaining}s`;
}
