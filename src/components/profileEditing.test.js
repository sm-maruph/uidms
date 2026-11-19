import test from 'node:test';
import assert from 'node:assert/strict';
import {profileAccessRows,profileUpdatePayload} from './profileEditing.js';

const records=[{Id:'grant-a',SystemId:'system-a',SystemRoleId:'role-a',Username:'employee.id',SystemName:'ICBS',RoleName:'Inquiry'},
 {Id:'grant-b',SystemId:'system-b',SystemRoleId:null,Username:null,SystemName:'Email',RoleName:null}];
const initialAccess=profileAccessRows(records);
const options=()=>({designationId:'designation-id',version:'0000000000000001',access:initialAccess,initialAccess,canEditAccess:true,signature:'',initialSignature:''});

test('profile edit preserves access usernames and excludes unchanged access even after reordering',()=>{
 assert.equal(initialAccess[0].username,'employee.id');
 const payload=profileUpdatePayload({...options(),access:[...initialAccess].reverse()});
 assert.deepEqual(payload,{designationId:'designation-id',version:'0000000000000001'});
});
test('changed current access includes only typed assignment fields and supports removing every assignment',()=>{
 const updated=profileUpdatePayload({...options(),access:[{...initialAccess[0],systemRoleId:'role-b',role:'Super Admin',userId:'someone-else'}]});
 assert.deepEqual(updated.access,[{systemId:'system-a',systemRoleId:'role-b',username:'employee.id'}]);
 assert.deepEqual(profileUpdatePayload({...options(),access:[]}).access,[]);
 assert.equal(profileUpdatePayload({...options(),designationId:''}).designationId,null);
});
test('access cannot be sent from the read-only editor and duplicate/incomplete entries are rejected',()=>{
 assert.equal(profileUpdatePayload({...options(),canEditAccess:false,access:[]}).access,undefined);
 assert.throws(()=>profileUpdatePayload({...options(),access:[initialAccess[0],initialAccess[0]]}),/only once/);
 assert.throws(()=>profileUpdatePayload({...options(),access:[{systemId:''}]}),/Choose a system/);
});
test('signature payload accepts a changed PNG and does not resend unchanged images',()=>{
 const image='data:image/png;base64,aGVsbG8=';
 assert.equal(profileUpdatePayload({...options(),signature:image}).signatureBase64,'aGVsbG8=');
 assert.equal(profileUpdatePayload({...options(),signature:image,initialSignature:image}).signatureBase64,undefined);
 assert.throws(()=>profileUpdatePayload({...options(),signature:'data:image/jpeg;base64,aGVsbG8='}),/PNG/);
});
