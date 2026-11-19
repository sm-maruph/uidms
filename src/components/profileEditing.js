export const profileAccessRows=records=>records.map(row=>({key:row.Id,systemId:row.SystemId,systemRoleId:row.SystemRoleId||'',username:row.Username||'',systemName:row.SystemName,roleName:row.RoleName||''}));
const normalize=rows=>rows.map(row=>({systemId:row.systemId,systemRoleId:row.systemRoleId||null,username:String(row.username||'').trim()})).sort((a,b)=>`${a.systemId}:${a.systemRoleId||''}`.localeCompare(`${b.systemId}:${b.systemRoleId||''}`));

export function profileUpdatePayload({designationId,version,access,initialAccess,canEditAccess,signature,initialSignature}){
 const payload={designationId:designationId||null,version};
 if(canEditAccess){
  const selected=normalize(access);
  if(selected.some(row=>!row.systemId))throw new Error('Choose a system for each access entry.');
  if(new Set(selected.map(row=>`${row.systemId}:${row.systemRoleId||''}`)).size!==selected.length)throw new Error('Each system and role can be listed only once.');
  if(JSON.stringify(selected)!==JSON.stringify(normalize(initialAccess)))payload.access=selected;
 }
 if(signature&&signature!==initialSignature){
  if(!signature.startsWith('data:image/png;base64,'))throw new Error('Choose a PNG signature image.');
  payload.signatureBase64=signature.slice('data:image/png;base64,'.length);
 }
 return payload;
}
