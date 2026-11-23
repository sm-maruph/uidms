export const fixedProcessingCc=['shafi@combankbd.com','hailyalgewatte@combankbd.com'];
const addresses=value=>(Array.isArray(value)?value:[value]).flatMap(value=>typeof value==='string'?value.split(/[,;]/):[]).map(value=>value.trim().toLowerCase()).filter(Boolean);
export const mergeProcessingCc=(existing=[],required=[])=>[...new Set([...addresses(required),...addresses(existing)])];
export function requiredProcessingCc(requesterEmail){
 const requester=typeof requesterEmail==='string'?requesterEmail.trim():'';
 return mergeProcessingCc(/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(requester)?[requester]:[],fixedProcessingCc);
}
