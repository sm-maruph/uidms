import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationLabel,newerCursor,claimDesktopAlerts} from './notificationAlerts.js';
test('desktop labels distinguish recommendations, final approvals, queries and replies',()=>{
 assert.equal(notificationLabel('UID-1: recommendation required.'),'Recommendation required');
 assert.equal(notificationLabel('UID-1: approval required.'),'Approval required');
 assert.equal(notificationLabel('UID-1: a query needs your response.'),'Query needs your response');
 assert.equal(notificationLabel('UID-1: query response received.'),'Query response');
});
test('desktop claims preserve large IDs, suppress repeats and ignore read items across tabs',async()=>{
 const state=new Map(),shown=[],environment={localStorage:{getItem:key=>state.get(key),setItem:(key,value)=>state.set(key,value)}};
 const items=[{Id:'9007199254740992'},{Id:'9007199254740993',ReadAt:'now'},{Id:'9007199254740994'}];
 await claimDesktopAlerts('user1',items,async rows=>shown.push(...rows),environment);
 await claimDesktopAlerts('user1',items,async rows=>shown.push(...rows),environment);
 assert.deepEqual(shown.map(row=>row.Id),['9007199254740992','9007199254740994']);
 assert.equal(newerCursor('9007199254740992','9007199254740993'),'9007199254740993');
 await claimDesktopAlerts('user2',[items[0]],async rows=>shown.push(...rows),environment);assert.equal(shown.length,3);
});
test('failed desktop delivery does not claim IDs and denied storage still permits alerts',async()=>{
 const state=new Map(),environment={localStorage:{getItem:key=>state.get(key),setItem:(key,value)=>state.set(key,value)}};
 await assert.rejects(claimDesktopAlerts('u',[{Id:'4'}],async()=>{throw new Error('denied');},environment));assert.equal(state.size,0);
 let displayed=false;await claimDesktopAlerts('u',[{Id:'4'}],async()=>{displayed=true;},{localStorage:{getItem(){throw new Error();},setItem(){throw new Error();}}});assert.equal(displayed,true);
});
