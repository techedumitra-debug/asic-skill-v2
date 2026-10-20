/* ASIC-Skill GHDL: cocotb-style guided workspace navigation, v37.0.29. */
(()=>{'use strict';
const root=document.querySelector('[data-panel="ghdl"]');if(!root)return;
const buttons=[...root.querySelectorAll('[data-ghdl-workflow]')];
const activate=(key,scroll=true)=>{
  const target=key==='examples'?root.querySelector('#ghdl-setup'):key==='editors'?root.querySelector('.ghdl-editor-columns'):root.querySelector('#ghdl-results');
  if(!target)return;
  buttons.forEach(b=>{const selected=b.dataset.ghdlWorkflow===key;b.classList.toggle('active',selected);b.setAttribute('aria-current',selected?'step':'false');});
  if(['log','wave','logic','truth'].includes(key)&&window.ASICGHDL)window.ASICGHDL.showPanel(key);
  if(scroll)target.scrollIntoView({behavior:'smooth',block:'start'});
};
buttons.forEach(b=>b.addEventListener('click',()=>activate(b.dataset.ghdlWorkflow)));
root.querySelector('#ghdl-run')?.addEventListener('click',()=>activate('log',false));
root.querySelectorAll('[data-ghdl-result]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.ghdlResult,false)));
const params=new URLSearchParams(location.search);const entry=params.get('view');if(['wave','logic','truth','log','editors','examples'].includes(entry)){requestAnimationFrame(()=>activate(entry));}
})();
