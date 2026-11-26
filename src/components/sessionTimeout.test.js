import test from 'node:test';import assert from 'node:assert/strict';import {sessionDeadline,sessionSeconds,sessionCountdown} from './sessionTimeout.js';
test('countdown uses server remaining time despite client clock and never shows negative values',()=>{const lease={serverNow:'2026-11-24T12:00:00Z',expiresAt:'2026-11-24T12:15:00Z',absoluteExpiresAt:'2026-11-24T20:00:00Z',warningSeconds:60};const deadline=sessionDeadline(lease,5000);assert.equal(sessionSeconds(deadline,5000),900);assert.equal(sessionCountdown(sessionSeconds(deadline,845000)),'01:00');assert.equal(sessionCountdown(sessionSeconds(deadline,1000000)),'00:00');assert.equal(sessionDeadline(null),null);assert.equal(sessionCountdown(null),'--:--');});
test('renewal replaces the deadline while an expired lease remains at zero',()=>{const now=1000;assert.equal(sessionSeconds(sessionDeadline({serverNow:'2026-11-24T12:00:00Z',expiresAt:'2026-11-24T11:59:59Z',absoluteExpiresAt:'2026-11-24T20:00:00Z'},now),now),0);assert.equal(sessionCountdown(65),'01:05');});
test('renewable lease expiry is separate from the hard sign-in limit',()=>{
 const deadline=sessionDeadline({serverNow:'2026-11-26T12:00:00Z',expiresAt:'2026-11-26T12:00:30Z',absoluteExpiresAt:'2026-11-26T12:00:30Z',hardExpiresAt:'2026-11-26T20:00:00Z'},1000);
 assert.equal(sessionSeconds(deadline,1000),30);assert.equal(deadline.hardAt-1000,8*3600000);
});
