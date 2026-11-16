import test from 'node:test';
import assert from 'node:assert/strict';
import {auditEvent,readAudit,mergeAudit,ticketAuditEvents,deletionAuditEvents,filterAudit,groupAudit,auditCsv,dhakaDate} from './auditLog.js';

const ticket={id:'UID-1',action:'ID upgrade',name:'Employee',requesterId:'BD1',branch:'Agrabad Branch',system:'ICBS',createdAt:'2026-11-15T18:30:00Z',auditIp:'192.0.2.4',revisionHistory:[{by:'Employee',employeeId:'BD1',at:'2026-11-16T01:00:00Z',previousForm:{password:'never export this'}}],approvalHistory:[{by:'Manager',role:'Branch manager',status:'Approved',at:'2026-11-16T02:00:00Z',remark:'Recommended'}],queryHistory:[{by:'IT',at:'2026-11-16T03:00:00Z',message:'Confirm scope',targetNames:['Employee'],responses:[{employeeId:'BD1',responseBy:'Employee',responseAt:'2026-11-16T03:10:00Z',response:'Confirmed'}]}],remarks:[{by:'IT',at:'2026-11-16T03:20:00Z',message:'Verified'}],fulfilmentHistory:[{by:'IT',status:'Fulfilled',at:'2026-11-16T04:00:00Z'}],fulfilment:{password:'secret'}};

test('one ticket pack includes the full lifecycle and survives deletion without secrets',()=>{
  const lifecycle=ticketAuditEvents(ticket);
  assert.deepEqual(lifecycle.map(event=>event.type),['Create','Update','Approval','Query','Response','Remark','Complete']);
  const deletion=deletionAuditEvents({ticketId:ticket.id,requestType:ticket.action,by:'Employee',at:'2026-11-16T05:00:00Z',action:'Request permanently deleted'});
  const archived=mergeAudit(lifecycle,[deletion]);
  assert.equal(groupAudit(archived).length,1);
  assert.equal(groupAudit(archived)[0].events.length,8);
  assert.equal(mergeAudit(archived,ticketAuditEvents(ticket)).length,8);
  assert.equal(JSON.stringify(archived).includes('secret'),false);
  assert.equal(JSON.stringify(archived).includes('never export'),false);
  assert.equal(lifecycle[0].ip,'192.0.2.4');
});
test('date filtering is inclusive in Dhaka, including UTC day boundaries',()=>{
  const events=ticketAuditEvents(ticket);
  assert.equal(dhakaDate(ticket.createdAt),'2026-11-16');
  assert.equal(filterAudit(events,{from:'2026-11-16',to:'2026-11-16'}).length,7);
  assert.equal(filterAudit(events,{to:'2026-11-15'}).length,0);
  assert.equal(filterAudit(events,{from:'2026-11-17',to:'2026-11-16'}).length,0);
  assert.equal(filterAudit([{id:'1',type:'Create',at:'invalid'}],{from:'2026-11-16'}).length,0);
});
test('search and type/category/outcome/request type filters intersect before grouping/export',()=>{
  const events=ticketAuditEvents(ticket);
  const filtered=filterAudit(events,{search:'manager',type:'Approval',category:'Ticket',outcome:'Success',requestType:'ID upgrade'});
  assert.equal(filtered.length,1);
  assert.equal(filterAudit(events,{search:'192.0.2.4'}).length,1);
  assert.equal(filterAudit(events,{type:'Delete'}).length,0);
  assert.equal(groupAudit(events,'type').length,7);
  const csv=auditCsv(filtered);
  assert.equal(csv.includes('Recommended'),true);
  assert.equal(csv.includes('Request form updated'),false);
});
test('sorting supports time, type, and actor',()=>{
  const events=ticketAuditEvents(ticket);
  assert.equal(filterAudit(events,{sort:'oldest'})[0].type,'Create');
  assert.equal(filterAudit(events,{sort:'newest'})[0].type,'Complete');
  assert.equal(filterAudit(events,{sort:'type'})[0].type,'Approval');
  assert.equal(filterAudit(events,{sort:'actor'})[0].actor,'Employee');
});
test('session events have truthful IP fallback and failures grouped with the same session',()=>{
  const actor={employeeId:'BD1',name:'Employee',role:'IT'};
  const events=['Login','Failed logout','Logout'].map(type=>auditEvent(type,actor,{sessionId:'session-1'}));
  assert.equal(events[1].outcome,'Failed');
  assert.equal(events[1].ip,'Not available (demo)');
  assert.equal(groupAudit(events).length,1);
  assert.equal(filterAudit(events,{outcome:'Failed'}).length,1);
});
test('historical updates at reused history indices remain distinct',()=>{
  const original=ticketAuditEvents(ticket);
  const revised=ticketAuditEvents({...ticket,revisionHistory:[{at:'2026-11-17T01:00:00Z',by:'Employee'}]});
  assert.equal(mergeAudit(original,revised).length,original.length+1);
});
test('CSV quotes multiline fields, escapes quotes and guards spreadsheet formulas',()=>{
  const csv=auditCsv([{type:'Update',actor:'=SUM(1,2)',message:'Text, "quote"\nnew line',at:'2026-11-16T01:00:00Z'}]);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"Text, ""quote""\nnew line"'));
  assert.ok(csv.startsWith('\uFEFF'));
});
test('invalid and missing local audit data do not crash the report',()=>{
  for(const value of ['invalid','null','{}','[null, {}, {"id":"valid"}]']) {
    const result=readAudit({getItem:()=>value});
    assert.equal(result.length,value.includes('valid"')?1:0);
  }
});
