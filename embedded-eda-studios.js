/* ASIC-Skill v37.0.36 — honest external-service diagnostics and safe fallback. */
(()=>{'use strict';
const STUDIOS={
 'microcontroller-studio':{title:'Microcontroller Studio',port:'3080'},
 'analog-circuit-studio':{title:'Analog Circuit Studio',port:'3081'}
};
const $=id=>document.getElementById(id);
function setNotice(id,message,state){
 const n=$(id+'-notice');if(!n)return;
 n.textContent=message;n.dataset.state=state||'info';
}
function getAddress(id){
 const field=$(id+'-url');
 try{
  if(!field)throw Error('Address field missing.');
  const u=new URL(field.value.trim());
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Use an HTTP(S) address with no embedded credentials.');
  if(location.protocol==='https:'&&u.protocol==='http:'&& !['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw Error('HTTPS websites require an HTTPS service address.');
  return u.href;
 }catch(error){setNotice(id,'Invalid service address: '+error.message,'error');return null;}
}
function hideFrame(id){
 const frame=$(id+'-frame'), empty=$(id+'-empty');
 if(frame){frame.hidden=true;frame.removeAttribute('src');}
 if(empty)empty.hidden=false;
}
async function probe(address){
 // Only tests browser reachability, not iframe permission or app health. A
 // cross-origin response is deliberately opaque. No credentials are sent.
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),5500);
 try{
  await fetch(address,{method:'GET',mode:'no-cors',credentials:'omit',cache:'no-store',redirect:'follow',signal:controller.signal});
  return {reachable:true};
 }catch(error){return {reachable:false,reason:error?.name==='AbortError'?'connection timed out':'service unreachable or blocked by browser/network policy'};}
 finally{clearTimeout(timer);}
}
function renderFrame(id,address){
 const frame=$(id+'-frame'),empty=$(id+'-empty');
 if(!frame)return;
 frame.src=address;frame.hidden=false;
 if(empty)empty.hidden=true;
 setNotice(id,'Service is reachable. Loading its workspace… If the frame stays blank, the service may forbid embedding; choose Open in new tab.','info');
}
for(const id of Object.keys(STUDIOS)){
 const frame=$(id+'-frame'), connect=document.querySelector('[data-connect-embedded="'+id+'"]');
 const open=document.querySelector('[data-open-embedded="'+id+'"]');
 const retry=$('force-'+id), urlField=$(id+'-url');
 if(!frame||!connect||!open||!urlField)continue;
 let serial=0;
 function reset(){serial++;hideFrame(id);if(retry)retry.hidden=true;}
 urlField.addEventListener('input',reset);
 connect.addEventListener('click',async()=>{
  const address=getAddress(id);if(!address)return;
  const myId=++serial;
  hideFrame(id);connect.disabled=true;connect.textContent='Checking…';
  setNotice(id,'Checking whether '+new URL(address).host+' is reachable from this browser…','info');
  try{
   const result=await probe(address);
   if(myId!==serial)return;
   if(result.reachable){renderFrame(id,address);}
   else {
    setNotice(id,'Connection failed: '+result.reason+'. Start the optional service, then retry. You can also open the address in a new tab to diagnose it.','error');
    if(retry)retry.hidden=false;
   }
  }finally{if(myId===serial){connect.disabled=false;connect.textContent=id==='microcontroller-studio'?'Connect emulator':'Connect schematic editor';}}
 });
 if(retry)retry.addEventListener('click',()=>{const address=getAddress(id);if(address){serial++;renderFrame(id,address);retry.hidden=true;}});
 open.addEventListener('click',()=>{const address=getAddress(id);if(address)window.open(address,'_blank','noopener,noreferrer');});
 frame.addEventListener('error',()=>setNotice(id,'The embedded page failed to load. Test the address in a new browser tab.','error'));
}
$('analog-studio-open-ngspice')?.addEventListener('click',()=>document.querySelector('[data-tool="ngspice"]')?.click());
})();
