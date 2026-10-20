/* ASIC-Skill v37.0.28 — split editor, VHDL syntax colors, summary logs and resizable waveform pane.
 * Does not change the authenticated GHDL execution path. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const lab=document.querySelector('[data-panel="ghdl"]');if(!lab||!window.ASICGHDL)return;
const models=lab.querySelector('.ghdl-models'),test=lab.querySelector('.ghdl-testbench-card');
const columns=document.createElement('div');columns.className='ghdl-editor-columns';
models.before(columns);columns.append(models,test);
// Keep style/variant controls ABOVE the two editor columns; design and testbench start at the same Y.
const modelNav=models.querySelector('.ghdl-model-nav');
const modelInfo=models.querySelector('.ghdl-style-info');
if(modelNav)columns.before(modelNav);
if(modelInfo)columns.before(modelInfo);
const keyword=/\b(library|use|entity|architecture|is|begin|end|signal|variable|constant|port|generic|in|out|inout|process|if|then|else|elsif|case|when|others|loop|for|to|downto|wait|until|assert|report|severity|rising_edge|falling_edge|component|map|all|function|return|type|of|after|not|and|or|xor|nand|nor|xnor|mod|rem|sll|srl|std_logic|std_logic_vector|unsigned|signed|integer|natural|boolean)\b/gi;
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function highlight(source){
  // Tokenize before escaping: comments and string literals take precedence over keywords.
  const parts=source.match(/--[^\n]*|"(?:""|[^"])*"|'[01XZUWLH-]'|\b\d+\b|\b[A-Za-z_]\w*\b|[\s\S]/g)||[];
  return parts.map(part=>{
    if(part.startsWith('--'))return `<span class="hl-comment">${escape(part)}</span>`;
    if(/^"|^'[01XZUWLH-]'$/i.test(part))return `<span class="hl-string">${escape(part)}</span>`;
    if(/^\d+$/.test(part))return `<span class="hl-num">${escape(part)}</span>`;
    if(/^(std_logic|std_logic_vector|unsigned|signed|integer|natural|boolean)$/i.test(part))return `<span class="hl-type">${escape(part)}</span>`;
    keyword.lastIndex=0;if(keyword.test(part))return `<span class="hl-kw">${escape(part)}</span>`;
    return escape(part);
  }).join('')+'\n';
}
const themes=document.createElement('label');themes.className='ghdl-color-theme';themes.textContent='Code colors ';const sel=document.createElement('select');sel.id='ghdl-editor-theme';sel.setAttribute('aria-label','Code editor theme');
for(const [value,label] of [['desert','Desert · Dark'],['gray','Gray · Light']]){const o=document.createElement('option');o.value=value;o.textContent=label;sel.append(o);}themes.append(sel);
lab.querySelector('.ghdl-model-nav')?.append(themes);
function setTheme(value){lab.classList.toggle('ghdl-theme-desert',value==='desert');try{localStorage.setItem('asic-ghdl-editor-theme',value);}catch{}}
try{sel.value=localStorage.getItem('asic-ghdl-editor-theme')||'desert';}catch{sel.value='desert';}setTheme(sel.value);sel.addEventListener('change',()=>setTheme(sel.value));
const editors=[...lab.querySelectorAll('#ghdl-rtl,#ghdl-rtl-behavioral,#ghdl-rtl-structural,#ghdl-testbench')];
for(const textarea of editors){
  const holder=document.createElement('div');holder.className='ghdl-code-editor';
  const pre=document.createElement('pre');pre.setAttribute('aria-hidden','true');
  textarea.parentNode.insertBefore(holder,textarea);holder.append(pre,textarea);
  const render=()=>{pre.innerHTML=highlight(textarea.value);pre.scrollTop=textarea.scrollTop;pre.scrollLeft=textarea.scrollLeft;};
  textarea.addEventListener('input',render);textarea.addEventListener('scroll',()=>{pre.scrollTop=textarea.scrollTop;pre.scrollLeft=textarea.scrollLeft;});
  textarea.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const a=textarea.selectionStart,b=textarea.selectionEnd;textarea.setRangeText('    ',a,b,'end');textarea.dispatchEvent(new Event('input',{bubbles:true}));}});
  const card=holder.closest('.editor-card'),head=card.querySelector('.card-head');
  const btn=document.createElement('button');btn.type='button';btn.textContent='⤢ Expand Editor';btn.className='ghdl-editor-expand';btn.setAttribute('aria-label','Expand '+(card.querySelector('h2')?.textContent||'editor'));
  btn.textContent='↗ Open in new tab';
  head.append(btn);btn.onclick=()=>{
    const isTestbench=textarea.id==='ghdl-testbench';
    const model=isTestbench?'testbench':textarea.id==='ghdl-rtl-behavioral'?'behavioral':textarea.id==='ghdl-rtl-structural'?'structural':'dataflow';
    // Keep the GHDL page in the original tab; use a real browser tab.
    const pop=window.open('ghdl-model-window.html?style='+encodeURIComponent(model),'_blank');
    if(!pop)window.alert('Allow pop-ups for this site to open a separate VHDL editor tab.');
  };
  render();
}
// Refresh editor coloration when the example/variant is changed programmatically.
const refreshEditors=()=>{for(const textarea of editors)textarea.dispatchEvent(new Event('input',{bubbles:true}));};
$('ghdl-variant').addEventListener('change',()=>queueMicrotask(refreshEditors));
$('ghdl-example').addEventListener('change',()=>queueMicrotask(refreshEditors));
$('ghdl-load-example').addEventListener('click',()=>queueMicrotask(refreshEditors));
$('ghdl-reset').addEventListener('click',()=>queueMicrotask(refreshEditors));
for(const b of lab.querySelectorAll('[data-ghdl-style]'))b.addEventListener('click',()=>queueMicrotask(refreshEditors));
function addSummary(){
  const output=$('ghdl-output');if(!output)return;
  const card=output.closest('.output-card');const top=document.createElement('section');top.className='ghdl-log-summary';top.setAttribute('aria-label','Parsed simulation results');
  card.insertBefore(top,output);
  function update(){
    const log=output.textContent||'';top.replaceChildren();
    const add=(label,cls='')=>{const span=document.createElement('span');span.className='ghdl-log-chip '+cls;span.textContent=label;top.append(span);};
    if(!log||/Run the selected|is running in an isolated/.test(log)){add('Awaiting simulation…');return;}
    const notes=(log.match(/\(report note\)|\breport note\b/g)||[]).length;
    const assertions=(log.match(/assertion (?:error|failure)|severity (?:error|failure)|\bFAILED\b/gi)||[]).length;
    const warnings=(log.match(/\bwarning\b/gi)||[]).length;
    const successes=(log.match(/tests? PASSED|All .* PASSED|test passed/gi)||[]).length;
    const t=[...log.matchAll(/@([\d.]+(?:fs|ps|ns|us|ms|s)):/g)];
    add(successes?`${successes} test pass marker(s)`:'No explicit PASS marker',successes?'pass':'warn');
    add(`Assertion failure markers: ${assertions}`,assertions?'fail':'pass');
    add(`Warnings: ${warnings}`,warnings?'warn':'');
    add(`Report notes: ${notes}`);
    if(t.length)add('Last report time: '+t[t.length-1][1]);
    const schematic=$('ghdl-schematic-status')?.textContent||'';
    if(/\d+ cells/.test(schematic))add(schematic);
    const vcd=$('ghdl-wave-status')?.textContent||'';if(/signals/.test(vcd))add(vcd);
    if(/failed with exit status|RUN FAILED|cannot find entity|syntax error/i.test(log))add('Check compilation/testbench top and errors in raw log','fail');
  }
  const observer=new MutationObserver(update);observer.observe(output,{childList:true,characterData:true,subtree:true});
  for(const id of ['ghdl-schematic-status','ghdl-wave-status']){const el=$(id);if(el)observer.observe(el,{childList:true,characterData:true,subtree:true});}
  update();
}
addSummary();
for(const grip of lab.querySelectorAll('.ghdl-pane-grip')){
  const sidebar=grip.previousElementSibling,body=grip.closest('.wave-body');let startX=0,startW=0;
  grip.addEventListener('pointerdown',e=>{startX=e.clientX;startW=sidebar.getBoundingClientRect().width;grip.setPointerCapture(e.pointerId);e.preventDefault();});
  grip.addEventListener('pointermove',e=>{if(!grip.hasPointerCapture(e.pointerId))return;
    const width=Math.max(170,Math.min(body.clientWidth*.65,startW+e.clientX-startX));sidebar.style.width=width+'px';});
  grip.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();sidebar.style.width=Math.max(170,sidebar.getBoundingClientRect().width+(e.key==='ArrowRight'?30:-30))+'px';});
}
})();
