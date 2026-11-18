import test from 'node:test';
import assert from 'node:assert/strict';
import {requestTypeLabel,requestTitle} from './requestTitle.js';
import {isChangeRequest} from './transferChangeWorkflow.js';
import {requiresBusinessJustification} from './resetPolicy.js';
test('new display names preserve legacy request actions and workflow behavior',()=>{
 assert.equal(requestTypeLabel('ID reset / unlock'),'Unlock / Reset');
 assert.equal(requestTypeLabel('ID Unlock / Reset'),'Unlock / Reset');
 assert.equal(requestTypeLabel('Branch / Department change'),'Branch / Department Transfer');
 assert.equal(requestTypeLabel('ID upgrade'),'ID upgrade');
 const reset={action:'ID reset / unlock',system:'ICBS'};
 assert.equal(requestTitle(reset),'Unlock / Reset - ICBS');
 assert.equal(reset.action,'ID reset / unlock');
 assert.equal(requiresBusinessJustification(reset.action),false);
 const movement={action:'Branch / Department change',system:'Employee movement'};
 assert.equal(requestTitle(movement),'Branch / Department Transfer - Employee movement');
 assert.equal(isChangeRequest(movement),true);
});
