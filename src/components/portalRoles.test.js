import test from 'node:test';
import assert from 'node:assert/strict';
import { savePortalUser } from './portalRoles.js';
import { canReviewNewUser } from './newUserWorkflow.js';
import { canReviewChange } from './transferChangeWorkflow.js';

const employee = {employeeId:'BD1', name:'Employee', role:'User', branch:'Agrabad Branch', department:'Operations', access:{otherAccess:['Email']}};
for (const role of ['Platform Admin', 'Super Admin']) {
  test(`${role} can assign every workflow role and replace it`, () => {
    for (const assignedRole of ['IT', 'CITO', 'COO', 'HR', 'Branch manager', 'Department head']) {
      const [updated] = savePortalUser([employee], {role}, {...employee, role:assignedRole}, employee.employeeId);
      const ticket = {action:'New ID creation (on behalf)', assignedRole, newUserDetails:{people:[{branch:assignedRole==='Department head'?'Corporate Office':employee.branch, department:employee.department}]}};
      assert.equal(canReviewNewUser(ticket, updated), true);
      assert.deepEqual(updated.access, employee.access);
      const [removed] = savePortalUser([updated], {role}, {...updated, role:'User'}, employee.employeeId);
      assert.equal(canReviewNewUser(ticket, removed), false);
    }
  });
}
test('role changes respect destination branch and department scope', () => {
  const ticket = {action:'Branch / Department change', assignedRole:'Branch manager', transferChange:{stage:'approval', toBranch:'Agrabad Branch'}};
  const [manager] = savePortalUser([employee], {role:'Platform Admin'}, {...employee, role:'Branch manager'}, employee.employeeId);
  assert.equal(canReviewChange(ticket, manager), true);
  assert.equal(canReviewChange(ticket, {...manager, branch:'Other Branch'}), false);
});
test('non-admins cannot change roles and duplicate identities are rejected', () => {
  for (const role of ['User','IT','CITO','COO','Branch manager','HR']) assert.throws(() => savePortalUser([employee], {role}, {...employee, role:'Super Admin'}, employee.employeeId), /Only platform admins/);
  assert.throws(() => savePortalUser([employee], {role:'Super Admin'}, employee), /already exists/);
});
