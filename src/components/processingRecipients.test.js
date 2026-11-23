import test from 'node:test';
import assert from 'node:assert/strict';
import {fixedProcessingCc,mergeProcessingCc,requiredProcessingCc} from './processingRecipients.js';
import {processingEmail,processingEmailDraft,mockProcessingDrafts} from './fulfilment.js';

const requester='requester@combankbd.com';
const ticket={id:'UID-1',action:'New ID creation (on behalf)',requesterId:'BD1',name:'Requester',requesterProfile:{email:requester},newUserDetails:{people:[{name:'New Employee',employeeId:'BDNEW',adId:true,email:true}]}};

test('new-user and existing saved processing emails include the requester and required fixed CCs',()=>{
 for(const draft of [processingEmail(ticket),processingEmailDraft({...ticket,fulfilment:{email:{to:'team@combankbd.com',cc:'EXISTING@combankbd.com; SHAFI@COMBANKBD.COM',subject:'Subject',body:'Body'}}})]){
  const cc=mergeProcessingCc(draft.cc);
  for(const address of [...fixedProcessingCc,requester])assert.equal(cc.filter(value=>value===address).length,1);
 }
 assert.ok(processingEmailDraft({...ticket,fulfilment:{email:{cc:'existing@combankbd.com'}}}).cc.includes('existing@combankbd.com'));
});

test('every system template group and general fallback include all required CCs',()=>{
 const drafts=mockProcessingDrafts(ticket,[{id:'ad',category:'new-id',systemIds:['AD ID'],name:'AD',to:['team@combankbd.com'],cc:['SHAFI@COMBANKBD.COM'],subject:'{{ticketNumber}}',body:'{{name}}'}]);
 assert.equal(drafts.length,2);
 for(const draft of drafts)assert.deepEqual(mergeProcessingCc(draft.cc),[...fixedProcessingCc,requester]);
});

test('missing requester emails are omitted and required recipients survive edited CCs without duplicates',()=>{
 for(const value of [undefined,null,true,'','invalid','a@example.com\r\nBcc: b@example.com'])assert.deepEqual(requiredProcessingCc(value),fixedProcessingCc);
 const required=requiredProcessingCc(requester);
 assert.deepEqual(mergeProcessingCc('',required),[...fixedProcessingCc,requester]);
 assert.deepEqual(mergeProcessingCc(['SHAFI@COMBANKBD.COM',requester.toUpperCase(),'extra@combankbd.com'],required),[...fixedProcessingCc,requester,'extra@combankbd.com']);
});
