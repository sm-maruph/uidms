import test from 'node:test';
import assert from 'node:assert/strict';
import {retryAfterSeconds,retryTimeLabel} from './rateLimit.js';

test('rate-limit cooldown prefers numeric body seconds and accepts numeric/date Retry-After',()=>{
 const now=Date.parse('2026-11-19T08:00:00Z');
 assert.equal(retryAfterSeconds('90',120,now),120);
 assert.equal(retryAfterSeconds('90',undefined,now),90);
 assert.equal(retryAfterSeconds('Thu, 19 Nov 2026 08:01:30 GMT',undefined,now),90);
});
test('missing, malformed, expired or oversized retry values produce a bounded cooldown',()=>{
 const now=Date.parse('2026-11-19T08:00:00Z');
 assert.equal(retryAfterSeconds(null),60);assert.equal(retryAfterSeconds('unknown'),60);
 assert.equal(retryAfterSeconds('0'),1);assert.equal(retryAfterSeconds('999999999'),86400);
 assert.equal(retryAfterSeconds('Thu, 19 Nov 2026 07:59:00 GMT',undefined,now),1);
});
test('countdown labels reflect remaining seconds without claiming to retry automatically',()=>{
 assert.equal(retryTimeLabel(90),'1m 30s');assert.equal(retryTimeLabel(15),'15s');assert.equal(retryTimeLabel(0),'0s');
});
