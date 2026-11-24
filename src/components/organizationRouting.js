const names=new Map();
export function setOrganizationRouting(rows=[]){names.clear();for(const row of rows)names.set(row.Kind+':'+row.Name,row.RoutingName||row.Name);}
export const organizationRoutingName=(kind,name)=>names.get(kind+':'+name)||name;
