export const isResetRequestType=type=>type==='ID reset / unlock';
export const requiresBusinessJustification=type=>!isResetRequestType(type);
export const resetApprovalFlow=()=>['Requester','CITO'];
