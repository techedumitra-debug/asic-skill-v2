/* VLSI Topics / ASIC-Skill Topics: accessible deep links and expandable subtopics. */
(() => { 'use strict';
  const wrappers=[...document.querySelectorAll('.topic-nav-wrap')];
  const cards=[...document.querySelectorAll('.topic-card')];
  function closeMenus(except) {
    wrappers.forEach(w=>{if(w===except)return;const menu=w.querySelector('.topic-nav-menu');const btn=w.querySelector('.topic-nav-trigger');menu.hidden=true;btn.setAttribute('aria-expanded','false');});
  }
  for (const wrap of wrappers) {
    const key=wrap.dataset.topicNav;
    const menu=wrap.querySelector('.topic-nav-menu');
    const btn=wrap.querySelector('.topic-nav-trigger');
    const links=wrap.querySelector('.topic-nav-list');
    document.querySelectorAll('[data-topic-group="'+key+'"] .topic-card').forEach(card=>{
      const a=document.createElement('a');a.href='#'+card.id;
      a.textContent=card.querySelector('.topic-heading strong')?.textContent||card.id;
      a.addEventListener('click',()=>{card.open=true;menu.hidden=true;btn.setAttribute('aria-expanded','false');requestAnimationFrame(()=>card.scrollIntoView({block:'start'}));});
      links.appendChild(a);
    });
    btn.addEventListener('click',()=>{const opening=menu.hidden;closeMenus();menu.hidden=!opening;btn.setAttribute('aria-expanded',String(opening));});
  }
  document.addEventListener('click',event=>{
    if (!event.target.closest('.topic-nav-wrap')) closeMenus();
    // Close the EDA mega menu when a different topic menu is selected.
    if(event.target.closest('.topic-nav-trigger')){
      const eda=document.querySelector('#eda-nav-menu');const edaBtn=document.querySelector('#eda-nav-trigger');
      if(eda&&edaBtn){eda.hidden=true;edaBtn.setAttribute('aria-expanded','false');}
    }
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenus();}});
  function activateHash(){
    let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch{return;}
    if(!hash)return;
    const card=cards.find(item=>item.id===hash);
    if(card){card.open=true; requestAnimationFrame(()=>card.scrollIntoView({block:'start',behavior:'auto'}));}
  }
  window.addEventListener('hashchange',activateHash);
  activateHash();
})();
