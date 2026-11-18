import {formResetSystems,requestSystems} from './requestCatalog.js';
import {systemDeactivationSystems} from './deactivationRequests.js';

export const emailTemplateServices={
 'new-id':{systems:[...new Set([...formResetSystems,'Email','MS Office','Other software'])],fields:['designation','email','requestedEmail','adRole','otherSoftware','similarId','additionalFunction'],description:'Self-requests select systems and roles. On-behalf forms request AD, email, and optional software.'},
 'employee-deactivation':{fields:['designation','email','scope'],description:'Employee identity and all system access.'},
 'system-deactivation':{systems:systemDeactivationSystems,fields:['designation','email','scope'],description:'Employee identity and selected systems to deactivate.'},
 reset:{systems:formResetSystems,fields:['designation','email'],description:'Employee identity and systems to unlock or reset.'},
 upgrade:{systems:[...new Set([...requestSystems,'MS Office'])],fields:['currentRole','similarId','additionalFunction'],description:'Existing system access, current and requested roles, and system-specific details.'},
 'email-creation':{fields:['requestedEmail','designation'],description:'Employee details and the requested mailbox address.'},
 'mailing-group':{fields:['email','groupAction','mailingGroups'],description:'Requester mailbox, inclusion or exclusion, and selected mailing groups.'},
 'auto-forward':{fields:['email','forwardTo'],description:'Existing mailbox and forwarding destination.'},
 drive:{systems:['IDrive','S Drive'],fields:['driveName'],description:'Selected I Drive or S Drive and the requested drive name.'},
 external:{fields:['email','deviceModel','deviceNumber','serialNumber'],description:'Employee mailbox and device model, device number, and serial number.'},
};

const demoServices=[
 ['employee-deactivation','Employee identity closure','identity-operations','Scope: {{scope}}'],
 ['system-deactivation','System access removal','access-operations','Scope: {{scope}}'],
 ['reset','Account unlock or reset','service-desk','Systems: {{system}}'],
 ['upgrade','System role change','access-operations','Current role: {{currentRole}}\nRequested role: {{role}}'],
 ['email-creation','Mailbox creation','messaging','Requested address: {{requestedEmail}}'],
 ['mailing-group','Mailing group membership','messaging','Action: {{groupAction}}\nGroups: {{mailingGroups}}'],
 ['auto-forward','Mailbox forwarding change','messaging','Mailbox: {{email}}\nForward to: {{forwardTo}}'],
 ['drive','I Drive / S Drive access','file-services','Drive: {{driveName}}'],
 ['external','External device email access','device-support','Device: {{deviceModel}}\nDevice number: {{deviceNumber}}\nSerial number: {{serialNumber}}'],
];

export const demoServiceTemplates=demoServices.map(([category,name,mailbox,details])=>({
 id:`demo-${category}`,category,name,systemIds:[],to:[`${mailbox}@example.com`],cc:[],
 subject:`[{{ticketNumber}}] ${name}`,body:`Dear Team,\n\nPlease process the approved request for {{name}} ({{employeeId}}).\n\n${details}\n\n{{items}}`,
}));
