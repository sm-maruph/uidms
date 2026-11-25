export async function startPortalLogin(api,employeeId,password,provider='local'){
 if(!['local','ad'].includes(provider))throw new Error('Choose Local or Active Directory sign-in.');
 const result=await api('/auth/login',{method:'POST',body:{employeeId,password,provider}});
 if(result.user&&result.csrfToken||result.challenge||result.onboardingRequired&&result.onboardingToken&&result.profile?.employeeId)return result;
 throw new Error('The sign-in response was incomplete. Please try again.');
}
export async function verifyPortalMfa(api,challenge,code){
 if(!/^\d{6}$/.test(code))throw new Error('Enter the six-digit code from your authenticator.');
 const result=await api('/auth/mfa/verify',{method:'POST',body:{challenge,code}});
 if(!result.user||!result.csrfToken)throw new Error('Verification did not establish a session. Sign in again.');
 return result;
}

// Restore only a server-validated cookie session; never persist credentials in browser storage.
export async function restorePortalSession(api){
 try{
  const result=await api('/auth/session');
  if(result.authenticated===false)return null;
  if(!result.user?.id||!result.csrfToken)throw new Error('The session response was incomplete. Try again.');
  return result;
 }catch(error){if(error.status===401)return null;throw error;}
}
