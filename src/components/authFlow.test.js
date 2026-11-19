import test from 'node:test';
import assert from 'node:assert/strict';
import {startPortalLogin,verifyPortalMfa} from './authFlow.js';
test('valid credentials can return an MFA challenge without being treated as login failure',async()=>{
 const result=await startPortalLogin(async(path,options)=>{assert.equal(path,'/auth/login');assert.deepEqual(options.body,{employeeId:'EMP1',password:'Private passphrase',provider:'local'});return {challenge:'challenge',mfaEnrollmentRequired:true};},'EMP1','Private passphrase');
 assert.equal(result.challenge,'challenge');assert.equal(result.user,undefined);
});

test('AD is an explicit provider and rejected AD credentials are never retried locally',async()=>{
 let calls=0;
 await assert.rejects(startPortalLogin(async(path,options)=>{calls++;assert.equal(options.body.provider,'ad');throw Object.assign(new Error('AD unavailable'),{status:503});},'EMP1','Domain password','ad'),error=>error.status===503);
 assert.equal(calls,1);
 await assert.rejects(startPortalLogin(async()=>{throw new Error('Must not call');},'EMP1','password','other'),/Choose Local/);
});
test('login rejects invalid credentials and incomplete responses',async()=>{
 await assert.rejects(startPortalLogin(async()=>{throw Object.assign(new Error('Invalid credentials'),{status:401});},'EMP1','wrong'),error=>error.status===401);
 await assert.rejects(startPortalLogin(async()=>({}),'EMP1','password'));
});

test('a verified new AD employee starts enrollment without being treated as signed in',async()=>{
 const onboarding={onboardingRequired:true,onboardingToken:'enrollment-token',profile:{employeeId:'NEW1',name:'New Employee'}};
 const result=await startPortalLogin(async()=>onboarding,'NEW1','AD password','ad');
 assert.equal(result,onboarding);assert.equal(result.user,undefined);assert.equal(result.csrfToken,undefined);
 await assert.rejects(startPortalLogin(async()=>({onboardingRequired:true}),'NEW1','AD password','ad'),/incomplete/);
});
test('MFA requires a valid code and an authenticated session response',async()=>{
 let calls=0;
 const api=async(path,options)=>{calls++;assert.equal(path,'/auth/mfa/verify');assert.deepEqual(options.body,{challenge:'pending',code:'123456'});return {user:{employeeId:'EMP1'},csrfToken:'csrf'};};
 await assert.rejects(verifyPortalMfa(api,'pending','123'));assert.equal(calls,0);
 assert.equal((await verifyPortalMfa(api,'pending','123456')).user.employeeId,'EMP1');
 await assert.rejects(verifyPortalMfa(async()=>({challenge:'still pending'}),'pending','123456'));
});
