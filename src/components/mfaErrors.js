export const mfaErrorMessages={
 MFA_INVALID:'That code is incorrect or has expired. Enter the latest six-digit code for CBC UIDMS from your authenticator app.',
 MFA_CODE_USED:'This code has already been used. Wait for a new code in your authenticator app, then try again.',
 CHALLENGE_INVALID:'This sign-in attempt has expired or is no longer valid. Close this window and sign in again.',
 MFA_LOCKED:'Too many unsuccessful verification attempts. Wait 15 minutes, then sign in again.',
 MFA_ATTEMPTS_EXCEEDED:'Too many incorrect codes. Close this window and sign in again.',
 MFA_ENROLLMENT_REQUIRED:'Set up your authenticator first. Select Show QR code and scan it before entering a code.',
 MFA_ALREADY_ENABLED:'This account already has an authenticator. Close this window and sign in again to use it.',
};
export const mfaErrorMessage=error=>mfaErrorMessages[error.code]||error.message||'We could not verify your sign-in. Please try again.';
export const mfaNeedsNewSignIn=error=>['CHALLENGE_INVALID','MFA_LOCKED','MFA_ATTEMPTS_EXCEEDED','MFA_ALREADY_ENABLED','AUTH_PROVIDER_DISABLED'].includes(error.code);
export const mfaCodeRejected=error=>['MFA_INVALID','MFA_CODE_USED'].includes(error.code);
