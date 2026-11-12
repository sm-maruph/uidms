export function dailyRequestSequence(requests = [], previous = 0, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit',
  }).formatToParts(now).map(part=>[part.type,part.value]));
  const date=`${parts.year}-${parts.month}-${parts.day}`;
  const prefix=`UIDMS-${date}-`;
  const maximum=requests.reduce((max,request)=>{
    if (!request.id?.startsWith(prefix)) return max;
    const suffix=request.id.slice(prefix.length);
    return /^\d+$/.test(suffix)?Math.max(max,Number(suffix)):max;
  },Number.isSafeInteger(previous)&&previous>=0?previous:0);
  const count=maximum+1;
  return {date,count,id:`${prefix}${String(count).padStart(2,'0')}`};
}

export function allocateRequestId(requests,storage,now=new Date()) {
  const {date}=dailyRequestSequence([],0,now);
  const key=`uidmsRequestCounter:${date}`;
  const previous=Number(storage.getItem(key)||0);
  const next=dailyRequestSequence(requests,previous,now);
  storage.setItem(key,String(next.count));
  return next.id;
}
