/* Independently resize waveform Objects/Name/Value column. */
(()=>{'use strict';
function attach(grip){const sidebar=grip.previousElementSibling,body=grip.parentElement;
 if(!sidebar||!body||!sidebar.classList.contains('wave-sidebar'))return;
 let start=0,initial=0;
 const resize=w=>{const max=Math.max(230,body.getBoundingClientRect().width-220);sidebar.style.width=Math.min(max,Math.max(165,w))+'px';grip.setAttribute('aria-valuenow',String(Math.round(sidebar.getBoundingClientRect().width)));};
 grip.addEventListener('pointerdown',e=>{start=e.clientX;initial=sidebar.getBoundingClientRect().width;grip.setPointerCapture(e.pointerId);e.preventDefault();});
 grip.addEventListener('pointermove',e=>{if(grip.hasPointerCapture(e.pointerId))resize(initial+e.clientX-start);});
 grip.addEventListener('pointerup',e=>{if(grip.hasPointerCapture(e.pointerId))grip.releasePointerCapture(e.pointerId);});
 grip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();resize(sidebar.getBoundingClientRect().width+(e.key==='ArrowRight'?28:-28));});
}
document.querySelectorAll('.asic-wave-resizer').forEach(attach);
})();
