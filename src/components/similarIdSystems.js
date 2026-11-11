const systems = new Set([
  'icbs','query','itmbd','t4s','hris','los','eximbills','swiftjump','swiftid',
  'swiftdemergedidexbnglxxxxxbd0xxxxxx','swiftdemerageid','swiftdemergedid',
  'itmbdtest','icbstest','wbo',
]);
export const supportsSimilarId = system => systems.has(String(system).toLowerCase().replace(/[^a-z0-9]/g,''));
