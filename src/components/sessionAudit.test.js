import test from 'node:test';
import assert from 'node:assert/strict';
import {auditTime,auditLabel,endReasonLabel,sessionDuration,appendAuditEvents,eventDescription} from './sessionAudit.js';
test('audit timestamps use Dhaka and missing or unknown end times are not invented',()=>{
 assert.match(auditTime('2026-11-23T13:21:08Z'),/19:21:08/);assert.equal(auditTime(null),'Not recorded');
 assert.equal(sessionDuration({StartedAt:'2026-11-23T10:00:00Z',EndedAt:'2026-11-23T11:15:00Z'}),'1h 15m');
 assert.equal(sessionDuration({StartedAt:'2026-11-23T10:00:00Z',status:'Historical'}),'Not recorded');
 assert.equal(sessionDuration({StartedAt:'2026-11-23T10:00:00Z',status:'Active'},Date.parse('2026-11-23T10:00:25Z')),'25s');
 assert.equal(endReasonLabel('idle_timeout'),'Inactivity timeout');assert.equal(endReasonLabel('not_recorded'),'End not recorded');
});
test('activity labels, context and paginated timelines retain distinct event identities',()=>{
 assert.equal(auditLabel('auth.login'),'Signed in');assert.equal(auditLabel('request.approve'),'Recommendation approved');assert.equal(eventDescription({Event:'page.viewed',Metadata:{page:'My access'}}),'My access');
 assert.deepEqual(appendAuditEvents([{Id:'1'},{Id:'2'}],[{Id:'2'},{Id:'3'}]).map(row=>row.Id),['1','2','3']);
});
