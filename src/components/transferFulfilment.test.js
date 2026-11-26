import test from 'node:test';import assert from 'node:assert/strict';import {fulfilmentItems} from './fulfilment.js';
test('transfer completion asks for new credentials only; kept IDs and removed systems are excluded',()=>{
 const ticket={typeCode:'movement',transferAccess:{version:1,current:[{systemId:'ad',systemRoleId:null}]},sqlPeople:[{id:'person',employeeId:'BD1',name:'Employee'}],sqlItems:[{systemId:'ad',system:'AD ID',systemRoleId:null,personId:'person',operation:'update'},{systemId:'old',system:'Old',personId:'person',operation:'revoke'},{systemId:'new',system:'New',role:'Entry',systemRoleId:'r1',personId:'person',operation:'update'}]};
 const rows=fulfilmentItems(ticket);assert.equal(rows.length,1);assert.equal(rows[0].system,'New');assert.equal(rows[0].employeeId,'BD1');
});
