import test from 'node:test';
import assert from 'node:assert/strict';
import {mfaErrorMessage,mfaNeedsNewSignIn,mfaCodeRejected} from './mfaErrors.js';

test('coded MFA errors replace generic API text with a clear reason and next action',()=>{
 assert.match(mfaErrorMessage({code:'MFA_INVALID',message:'UIDMS could not complete this action.'}),/latest six-digit code for CBC UIDMS/);
 assert.match(mfaErrorMessage({code:'MFA_CODE_USED'}),/already been used/);
 assert.match(mfaErrorMessage({code:'CHALLENGE_INVALID'}),/sign in again/);
 assert.match(mfaErrorMessage({code:'MFA_LOCKED'}),/Wait 15 minutes/);
 assert.equal(mfaErrorMessage({message:'Could not connect to UIDMS.'}),'Could not connect to UIDMS.');
});

test('only retryable code failures mark the code invalid; expired or locked attempts require a new sign-in',()=>{
 for(const code of ['MFA_INVALID','MFA_CODE_USED']){assert.equal(mfaCodeRejected({code}),true);assert.equal(mfaNeedsNewSignIn({code}),false);}
 for(const code of ['CHALLENGE_INVALID','MFA_LOCKED','MFA_ATTEMPTS_EXCEEDED','MFA_ALREADY_ENABLED']){assert.equal(mfaNeedsNewSignIn({code}),true);assert.equal(mfaCodeRejected({code}),false);}
 for(const code of ['INTERNAL_ERROR','AUTH_RATE_LIMITED'])assert.equal(mfaNeedsNewSignIn({code}),false);
});
