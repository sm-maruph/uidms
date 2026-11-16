export const defaultDesignations = [
  'Chief Executive Officer (CEO)',
  'Chief Operations Officer (COO)',
  'Deputy Chief Operations Officer (DCOO)',
  'Head of Corporate Banking',
  'Senior Assistant General Manager',
  'Assistant General Manager',
  'General Manager',
  'Deputy General Manager',
  'Chief Manager',
  'Senior Manager',
  'Deputy Chief Manager',
  'Manager',
  'Deputy Manager',
  'Assistant Manager',
  'Senior Executive Officer (SEO)',
  'Senior Officer',
  'Management Trainee Officer (MTO)',
  'Officer',
  'Trainee Officer',
  'Trainee Executive',
  'Junior Officer',
];


export function loadDesignations() {
  let saved = [];
  try {
    const value = JSON.parse(localStorage.getItem('uidmsDesignations') || '[]');
    if (Array.isArray(value)) saved = value.filter(item => typeof item === 'string' && item.trim());
  } catch {}
  const seen = new Set();
  return [...defaultDesignations, ...saved].map(item => item.trim()).filter(item => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
