import React from 'react';

export default function ResetSummary({details={}}) {
  return <section className="transfer-summary"><div className="transfer-summary-heading"><div><p className="eyebrow">SYSTEM RESET / UNLOCK</p><h3>Systems requested</h3></div></div><div className="transfer-summary-grid">{[['User',details.name],['Employee ID',details.employeeId],['System ID',details.userId],['Department / branch',details.department]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'—'}</strong></div>)}</div><ul>{(details.systems||[]).map(system=><li key={system}>{system}</li>)}</ul></section>;
}
