export function transferPreviewDetails(details = {}) {
  return {...details, people:(details.people||[]).map(person=>({...person,
    fullName:person.fullName||person.name||'',
    systemId:person.systemId||person.userId||'',
    fromBranch:person.fromBranch||details.oldBranch||'',
    toBranch:person.toBranch||details.newBranch||'',
  }))};
}
