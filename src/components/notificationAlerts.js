export const notificationPageSize=8;
export function notificationLabel(message=''){
 if(/query response/i.test(message))return 'Query response';
 if(/query/i.test(message))return 'Query needs your response';
 if(/recommendation required/i.test(message))return 'Recommendation required';
 if(/approval required/i.test(message))return 'Approval required';
 if(/processing required/i.test(message))return 'Processing required';
 if(/employee access review/i.test(message))return 'Employee review required';
 return 'Request update';
}
export function unreadAlerts(items){return items.filter(row=>!row.ReadAt);}
export function newerCursor(left='0',right='0'){return BigInt(left)>BigInt(right)?String(left):String(right);}

// The lock makes only one open tab display each alert. Only IDs, not messages,
// passwords or session tokens, are persisted in the browser.
export async function claimDesktopAlerts(userId,items,work,environment=globalThis){
 const run=async()=>{
  const key=`uidms:desktop-notification:${userId}`;
  let seen='0';
  try{seen=environment.localStorage.getItem(key)||'0';if(!/^\d+$/.test(seen))seen='0';}catch{}
  const fresh=items.filter(row=>BigInt(row.Id)>BigInt(seen));
  if(!fresh.length)return;
  await work(unreadAlerts(fresh));
  const latest=fresh.reduce((value,row)=>newerCursor(value,row.Id),seen);
  try{environment.localStorage.setItem(key,latest);}catch{}
 };
 return environment.navigator?.locks?environment.navigator.locks.request(`uidms-alerts-${userId}`,run):run();
}
