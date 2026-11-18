export const driveOptions=[{type:'IDrive access',label:'I Drive',system:'IDrive'},{type:'IDrive access',label:'S Drive',system:'S Drive'},{type:'N Drive access',label:'N Drive',system:'N Drive'}];
export const isDriveAccess=type=>driveOptions.some(option=>option.type===type);
export const driveOptionsForType=type=>driveOptions.filter(option=>option.type===type);
export const driveSystemForType=(type,selected)=>driveOptionsForType(type).find(option=>option.system===selected)?.system||driveOptionsForType(type)[0]?.system;
