const allowedDepartmentsForIdDeletion = new Set([
  'hr',
  'hrdept',
  'hrdepartment',
  'humanresources',
  'it',
  'itdept',
  'itdepartment',
  'itdivision',
  'informationtechnology',
]);

export function canRequestIdDeletion(department) {
  const normalized = String(department || '').toLowerCase().replace(/[^a-z]/g, '');
  return allowedDepartmentsForIdDeletion.has(normalized);
}
