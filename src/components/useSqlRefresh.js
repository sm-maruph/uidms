import {useEffect,useRef} from 'react';

export function useSqlRefresh(enabled,refresh,onError,interval=10000,scope){
 const callbacks=useRef({refresh,onError});
 useEffect(()=>{callbacks.current={refresh,onError};},[refresh,onError]);
 useEffect(()=>{
  if(!enabled)return;
  const controller=new AbortController();
  let pending=false;
  const tick=async()=>{
   if(pending||document.hidden||controller.signal.aborted)return;
   pending=true;
   try{await callbacks.current.refresh(controller.signal);}
   catch(error){if(!controller.signal.aborted)callbacks.current.onError(error);}
   finally{pending=false;}
  };
  const timer=setInterval(tick,interval);
  window.addEventListener('focus',tick);
  return ()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',tick);};
 },[enabled,interval,scope]);
}
