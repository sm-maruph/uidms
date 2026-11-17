import test from 'node:test';
import assert from 'node:assert/strict';
import {queryInboxGroups} from './queryInbox.js';

test('inbox separates received queries and authored threads and combines both without duplicates',()=>{
 const profile={employeeId:'ME',name:'Reviewer'};
 const requests=[{id:'T1',state:'Query',queryTargetIds:['ME'],queryHistory:[
  {employeeId:'ME',by:'Reviewer',targetIds:['OTHER'],responses:[{employeeId:'OTHER',response:'Done'}]},
  {employeeId:'OTHER',by:'Other',targetIds:['ME'],responses:[]},
 ]}];
 const groups=queryInboxGroups(requests,profile);
 assert.equal(groups.query.length,1);
 assert.equal(groups.query[0].pending,true);
 assert.equal(groups.response.length,1);
 assert.equal(groups.response[0].response.response,'Done');
 assert.equal(groups.response[0].pending,false);
 assert.equal(groups.all.length,2);
 assert.equal(groups.all[0].pending,true);
 const self=queryInboxGroups([{id:'T2',queryHistory:[{employeeId:'ME',targetIds:['ME']}]}],profile);
 assert.equal(self.all.length,1);
});
