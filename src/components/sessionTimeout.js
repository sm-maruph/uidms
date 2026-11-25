export function sessionDeadline(window,now=Date.now()){
 if(!window?.expiresAt||!window.serverNow)return null;
 const remaining=Date.parse(window.expiresAt)-Date.parse(window.serverNow);
 if(!Number.isFinite(remaining))return null;
 return {at:now+Math.max(0,remaining),absoluteAt:now+Math.max(0,Date.parse(window.absoluteExpiresAt)-Date.parse(window.serverNow)),warningSeconds:window.warningSeconds||60};
}
export const sessionSeconds=(deadline,now=Date.now())=>deadline?Math.max(0,Math.ceil((deadline.at-now)/1000)):null;
export function sessionCountdown(seconds){if(seconds==null)return '--:--';const value=Math.max(0,Math.floor(seconds));return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
