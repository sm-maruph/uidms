const dayKey = value => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function matchesApprovalDate(createdAt, range, now = new Date()) {
  if (range === 'All time') return true;
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) return false;
  const [year,month,day] = dayKey(now).split('-').map(Number);
  const today = Date.UTC(year,month-1,day);
  const [requestYear,requestMonth,requestDay] = dayKey(createdAt).split('-').map(Number);
  const submitted = Date.UTC(requestYear,requestMonth-1,requestDay);
  if (range === 'Today') return submitted === today;
  if (range === 'Yesterday') return submitted === today-86400000;
  if (range === 'This week') { const monday = today-((new Date(today).getUTCDay()+6)%7)*86400000; return submitted>=monday && submitted<=today; }
  if (range === 'This month') return requestYear===year && requestMonth===month && submitted<=today;
  return true;
}
