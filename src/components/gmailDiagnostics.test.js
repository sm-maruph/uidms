import test from 'node:test';import assert from 'node:assert/strict';
import {gmailStatusDiagnostics,gmailErrorDiagnostics} from './gmailDiagnostics.js';
test('Gmail console diagnostics show running backend readiness without copying credentials or OAuth responses',()=>{
 const status={configured:false,setupEnabled:true,connected:false,diagnosticsVersion:'gmail-diag-v1',diagnostics:{clientIdConfigured:true,clientSecretConfigured:false,redirectConfigured:true},clientSecret:'private-value',refreshToken:'private-token',authorizationUrl:'https://example.com/?state=private-state'};
 const output=gmailStatusDiagnostics(status);assert.equal(output.clientIdLoaded,true);assert.equal(output.clientSecretLoaded,false);assert.equal(output.navigation,'same-tab');assert.ok(output.buttonDisabledReason);assert.equal(JSON.stringify(output).includes('private-'),false);
 const failure=gmailErrorDiagnostics({status:403,code:'REAUTHENTICATION_REQUIRED',message:'private-token',response:{secret:'private-value'}});assert.equal(failure.httpStatus,403);assert.equal(failure.code,'REAUTHENTICATION_REQUIRED');assert.equal(JSON.stringify(failure).includes('private-'),false);
 assert.equal(gmailStatusDiagnostics({configured:true,setupEnabled:true}).backendVersion,'older-backend');
});
