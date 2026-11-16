import {initialUsers} from './mockUsers.js';

const find=role=>initialUsers.find(user=>user.role===role);
const cito=find('CITO'),coo=find('COO'),it=find('IT'),hr=find('HR'),manager=initialUsers.find(user=>user.role==='Branch manager'&&user.branch==='Dhanmondi Branch');
const requester=initialUsers.find(user=>user.employeeId==='BNGL6191');
const scenarios=[
 {action:'ID upgrade',system:'ICBS',target:it,question:'Please confirm the ICBS Supervisor role is the minimum access required for the reconciliation duties.',reply:'Confirmed. Supervisor is sufficient; Manager access is not required.'},
 {action:'Branch transfer',system:'WBO',target:manager,question:'Please confirm the effective transfer date and removal of the employee’s old branch WBO access.',reply:'Transfer is effective 18 November. Old branch WBO access will end on 17 November.'},
 {action:'New ID creation (on behalf)',system:'AD ID, Email',target:hr,question:'Please confirm both reference checks and the police clearance status before account creation.',reply:null},
 {action:'External device email access',system:'Email',target:it,question:'Confirm device encryption and the remote-wipe policy are enabled for the requested mobile email access.',reply:null},
 {action:'ID upgrade',system:'ITMBD',target:it,question:'Confirm the requested ITMBD Inquiry role excludes transaction approval rights.',reply:'Verified. Inquiry access cannot approve or authorize transactions.',cooQuestion:'CITO, please confirm segregation of duties has been checked for the ITMBD role.'},
 {action:'Branch transfer',system:'ICBS',target:manager,question:'Confirm ICBS branch access will be limited to the destination branch after the transfer.',reply:'Confirmed. The old branch assignment will be removed at handover.',cooQuestion:'CITO, confirm the old ICBS branch assignment will be removed before destination access is activated.'},
 {action:'New ID creation (on behalf)',system:'AD ID, Email',target:hr,question:'Confirm the new employee’s joining date and reference verification are recorded.',reply:'The employee joins on 19 November. Both references are checked and police clearance is completed.',cooQuestion:'CITO, confirm the new employee accounts will remain disabled until the approved joining date.'},
 {action:'External device email access',system:'Email',target:it,question:'Verify the device is enrolled in the approved management platform.',reply:'Verified. Device management enrollment, encryption and remote wipe are active.',cooQuestion:'CITO, confirm that the mobile device security controls meet the approved policy before access is enabled.'},
];

export const demoQueryRequests=scenarios.map((scenario,index)=>{
 const at=minutes=>new Date(Date.UTC(2026,10,16,2,index*5+minutes)).toISOString();
 const response=(actor,message,time)=>({employeeId:actor.employeeId,responseBy:actor.name,role:actor.role,response:message,responseAt:time});
 const question=(actor,target,message,time,responses=[])=>({employeeId:actor.employeeId,by:actor.name,role:actor.role,stage:`${actor.role} review`,at:time,message,targetIds:[target.employeeId],targetNames:[target.name],responses});
 const queryHistory=[question(cito,scenario.target,scenario.question,at(25),scenario.reply?[response(scenario.target,scenario.reply,at(35))]:[])];
 if(scenario.cooQuestion)queryHistory.push(question(coo,cito,scenario.cooQuestion,at(50)));
 const pending=Boolean(scenario.cooQuestion)||!scenario.reply;
 const owner=scenario.cooQuestion?coo:cito;
 const recipient=scenario.cooQuestion?cito:scenario.target;
 const approvalHistory=[manager,it].map((actor,n)=>({stage:actor.role,role:actor.role,employeeId:actor.employeeId,by:actor.name,status:'Approved',at:at(10+n*10),remark:'Demo request details and business need verified.'}));
 if(scenario.cooQuestion)approvalHistory.push({stage:'CITO',role:'CITO',employeeId:cito.employeeId,by:cito.name,status:'Approved',at:at(40),remark:'Technical review completed.'});
 const ticket={id:`UID-2026-${1101+index}`,demoQueryScenario:true,action:scenario.action,requesterId:requester.employeeId,requesterRole:requester.role,requesterProfile:requester,name:requester.name,initials:'RK',branch:requester.branch,department:requester.department,system:scenario.system,role:'Requested access',createdAt:at(0),date:'Nov 16, 2026',justification:'Sample query workflow for reviewing access scope and supporting verification.',state:pending?'Query':'In review',step:pending?`Query response · ${recipient.name}`:'CITO review',assignedRole:pending?null:'CITO',queryTargetIds:pending?[recipient.employeeId]:[],queryReturnRole:owner.role,queryReturnStep:`${owner.role} review`,queryHistory,approvalHistory,remarks:[]};
 if(scenario.action==='New ID creation (on behalf)'){
  ticket.newUserDetails={people:[{name:`Demo query employee ${index+1}`,employeeId:`DEMOQUERY${index+1}`,branch:requester.branch,department:requester.department,designation:'Officer',adId:true,email:true}]};
  ticket.hrClearance={checks:[{police:'Completed',reference:'Both checked',recommendation:''}],by:hr.name,employeeId:hr.employeeId,at:at(15)};
  ticket.approvalHistory.splice(1,0,{stage:'HR',role:'HR',employeeId:hr.employeeId,by:hr.name,status:'Approved',at:at(15),remark:'Joining and clearance verified.'});
 }else if(scenario.action==='ID upgrade')ticket.upgradeDetails={systems:[scenario.system],roles:{[scenario.system]:index===0?'Supervisor':'Inquiry'}};
 else if(scenario.action==='Branch transfer')ticket.transferDetails={transferRequestType:'Branch transfer',people:[{...requester,fullName:requester.name,fromBranch:'Agrabad Branch',toBranch:requester.branch,requestedSystems:[{system:scenario.system,role:'Entry'}]}],newAccess:{[scenario.system]:['Entry']},newAccessSystems:{[scenario.system]:true}};
 else ticket.externalDeviceDetails={deviceModel:'Demo managed mobile',deviceNumber:`DEMO-${index+1}`,serialNumber:`DEMO-SERIAL-${index+1}`};
 return ticket;
});
