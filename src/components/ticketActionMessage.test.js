import test from 'node:test';
import assert from 'node:assert/strict';
import {ticketActionMessage} from './ticketActionMessage.js';
test('queries, replies, recommendations and approvals have clear distinct confirmations',()=>{
 assert.match(ticketActionMessage('Query'),/Your query has been sent.*Response/);
 assert.equal(ticketActionMessage('Responded'),'Your reply has been sent.');
 assert.equal(ticketActionMessage('Approved','Recommended'),'Your recommendation has been sent.');
 assert.equal(ticketActionMessage('Approved','Approved'),'The request has been approved.');
 assert.equal(ticketActionMessage('Fulfilled'),'The request has been completed.');
});
