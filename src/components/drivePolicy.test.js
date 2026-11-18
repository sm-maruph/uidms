import test from 'node:test';
import assert from 'node:assert/strict';
import {driveOptions,driveOptionsForType,isDriveAccess,driveSystemForType} from './drivePolicy.js';
import {requestTypeLabel} from './requestTitle.js';
test('I/S Drive and N Drive remain separate requests with the correct selectable systems',()=>{
 assert.equal(driveOptions.length,3);
 assert.equal(isDriveAccess('IDrive access'),true);
 assert.equal(isDriveAccess('N Drive access'),true);
 assert.equal(isDriveAccess('ID upgrade'),false);
 assert.equal(driveSystemForType('IDrive access'),'IDrive');
 assert.equal(driveSystemForType('N Drive access'),'N Drive');
 assert.deepEqual(driveOptionsForType('IDrive access').map(option=>option.system),['IDrive','S Drive']);
 assert.deepEqual(driveOptionsForType('N Drive access').map(option=>option.system),['N Drive']);
 assert.equal(driveSystemForType('IDrive access','S Drive'),'S Drive');
 assert.equal(driveSystemForType('N Drive access','S Drive'),'N Drive');
 assert.equal(requestTypeLabel('IDrive access'),'I Drive / S Drive Access');
 assert.equal(requestTypeLabel('N Drive access'),'N Drive Access');
});
