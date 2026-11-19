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
