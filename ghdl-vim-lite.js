/* ASIC-Skill Vim Lite for expanded VHDL editors.
   Implements normal/insert/character-visual/line-visual editing over a native textarea.
   Intentionally a learning-oriented subset, not a complete Vim emulator. */
(()=>{'use strict';
const t=document.getElementById('model-source');
const toggle=document.getElementById('vim-toggle');
const modeEl=document.getElementById('vim-mode');
const cmd=document.getElementById('vim-command');
if(!t||!toggle||!modeEl||!cmd)return;
const byId=id=>document.getElementById(id);
let enabled=false, mode='INSERT', pending='', anchor=0, head=0, yankText='', yankLine=false;
const sync=()=>t.dispatchEvent(new Event('input',{bubbles:true}));
function setMode(m, detail=''){
  mode=m;
  modeEl.textContent=enabled?`Vim Lite · ${m}${detail?' · '+detail:''}`:'Standard editing';
  modeEl.dataset.mode=enabled?m:'STANDARD';
}
function line(p=t.selectionStart){
 const a=t.value.lastIndexOf('\n',Math.max(0,p)-1)+1;
 const e=t.value.indexOf('\n',p);
 return {a,e:e<0?t.value.length:e};
}
const clamp=p=>Math.max(0,Math.min(t.value.length,p));
function caret(p){head=clamp(p);t.setSelectionRange(head,head);t.focus();}
function replace(a,b,value){
 t.setRangeText(value,a,b,'end');
 sync();
 head=t.selectionStart;
}
function lineBounds(a,b){
 const from=line(a).a;
 const last=line(Math.max(a,b-1));
 const to=last.e<t.value.length?last.e+1:last.e;
 return {from,to};
}
function selectedRange(){
 if(mode==='V-LINE')return lineBounds(Math.min(anchor,head),Math.max(anchor,head)+1);
 const from=Math.min(anchor,head),to=Math.min(t.value.length,Math.max(anchor,head)+1);
 return {from,to};
}
function showSelection(){
 const {from,to}=selectedRange();
 t.setSelectionRange(from,to,head<anchor?'backward':'forward');
 t.focus();
}
function exitVisual(){
 const p=head;
 pending='';setMode('NORMAL');caret(p);
}
function startVisual(kind){
 if(!enabled)enable();
 if(mode==='VISUAL'||mode==='V-LINE'){exitVisual();return;}
 anchor=t.selectionStart;head=anchor;
 setMode(kind==='line'?'V-LINE':'VISUAL');showSelection();
}
function motion(key,p){
 const pos=clamp(p),inf=line(pos);
 if(key==='h'||key==='ArrowLeft')return Math.max(0,pos-1);
 if(key==='l'||key==='ArrowRight')return Math.min(t.value.length,pos+1);
 if(key==='0')return inf.a;
 if(key==='$')return inf.e;
 if(key==='G')return t.value.length;
 if(key==='j'||key==='k'||key==='ArrowDown'||key==='ArrowUp'){
  const forward=key==='j'||key==='ArrowDown';
  const col=pos-inf.a;
  if(forward){if(inf.e===t.value.length)return pos;const nxt=line(inf.e+1);return nxt.a+Math.min(col,nxt.e-nxt.a);}
  if(inf.a===0)return pos;
  const prev=line(inf.a-1);return prev.a+Math.min(col,prev.e-prev.a);
 }
 if(key==='w'){
  const rest=t.value.slice(Math.min(t.value.length,pos+1));
  const m=/\w+/.exec(rest);return m?Math.min(t.value.length,pos+1+m.index):pos;
 }
 if(key==='b'){
  const left=t.value.slice(0,pos),m=/(?:^|\W)(\w+)(?:\W*)$/.exec(left);
  return m?left.lastIndexOf(m[1]):0;
 }
 return null;
}
function indentSelection(outdent){
 const range=selectedRange(),chunk=t.value.slice(range.from,range.to);
 const width=4;
 const updated=chunk.split('\n').map(v=>outdent?v.replace(/^(?: {1,4}|\t)/,''):' '.repeat(width)+v).join('\n');
 replace(range.from,range.to,updated);
 setMode('NORMAL');caret(range.from);
}
function visualOperation(key){
 const {from,to}=selectedRange();
 if(key==='>'){indentSelection(false);return;}
 if(key==='<'){indentSelection(true);return;}
 if(key==='y'){
  yankText=t.value.slice(from,to);yankLine=mode==='V-LINE';exitVisual();setMode('NORMAL','Yanked '+yankText.length+' chars');return;
 }
 if(key==='d'||key==='x'||key==='c'){
  yankText=t.value.slice(from,to);yankLine=mode==='V-LINE';
  replace(from,to,'');
  setMode(key==='c'?'INSERT':'NORMAL');caret(from);
  return;
 }
 if(key==='p'){
  replace(from,to,yankText);setMode('NORMAL');caret(from);return;
 }
}
function undo(){window.ASICCodeEditor?.undo?.(t);head=t.selectionStart;setMode('NORMAL');}
function redo(){window.ASICCodeEditor?.redo?.(t);head=t.selectionStart;setMode('NORMAL');}
function yankOrDeleteLine(key){
 const inf=line(),from=inf.a,to=inf.e<t.value.length?inf.e+1:inf.e;
 yankText=t.value.slice(from,to);yankLine=true;
 if(key==='d')replace(from,to,'');
 caret(Math.min(from,t.value.length));
 setMode('NORMAL',key==='y'?'Line yanked':'Line deleted');
}
function put(){if(!yankText)return;
 const at=yankLine?(line().e<t.value.length?line().e+1:line().e):Math.min(t.value.length,t.selectionStart+1);
 const value=yankLine&&at===t.value.length&&t.value.length&&!t.value.endsWith('\n')?'\n'+yankText:yankText;
 replace(at,at,value);caret(at+value.length);
}
function execute(lineText){
 const v=lineText.trim().replace(/^:/,'');
 if(v==='w'){sync();setMode('NORMAL','Source synchronized');return;}
 if(v==='q'||v==='wq'){if(v==='wq')sync();byId('model-return')?.click();return;}
 if(v==='u'||v==='undo'){undo();return;}
 if(v==='redo'){redo();return;}
 if(v==='1'){caret(0);return;}
 if(v==='$'){caret(t.value.length);return;}
 setMode('NORMAL','Unsupported command: '+v);
}
function enable(){enabled=true;toggle.setAttribute('aria-pressed','true');toggle.textContent='Vim Lite: On';pending='';setMode('NORMAL');caret(t.selectionStart);}
function disable(){enabled=false;toggle.setAttribute('aria-pressed','false');toggle.textContent='Vim Lite: Off';pending='';cmd.hidden=true;setMode('INSERT');t.setSelectionRange(t.selectionEnd,t.selectionEnd);t.focus();}
toggle.addEventListener('click',()=>enabled?disable():enable());
byId('vim-undo')?.addEventListener('click',()=>{if(!enabled)enable();undo();});
byId('vim-redo')?.addEventListener('click',()=>{if(!enabled)enable();redo();});
byId('vim-visual')?.addEventListener('click',()=>startVisual('char'));
byId('vim-visual-line')?.addEventListener('click',()=>startVisual('line'));
cmd.addEventListener('keydown',e=>{
 if(e.key==='Enter'){
  e.preventDefault();execute(cmd.value);cmd.value='';cmd.hidden=true;t.focus();
 }else if(e.key==='Escape'){
  e.preventDefault();cmd.value='';cmd.hidden=true;t.focus();
 }
});
t.addEventListener('keydown',e=>{
 if(!enabled)return;
 if(e.key==='Escape'){
  e.preventDefault();pending='';cmd.hidden=true;
  if(mode==='VISUAL'||mode==='V-LINE')exitVisual();else setMode('NORMAL');
  return;
 }
 if(e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='r'){
  e.preventDefault();e.stopImmediatePropagation();redo();return;
 }
 if(mode==='INSERT')return;
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key===':'){
  e.preventDefault();cmd.hidden=false;cmd.value=':';cmd.focus();return;
 }
 if(e.key.length!==1&&!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
 e.preventDefault();
 const key=e.key;
 if(pending==='g'){
  pending='';if(key==='g'){
   if(mode==='NORMAL')caret(0);else{head=0;showSelection();}
   return;
  }
 }
 if(pending==='d'||pending==='y'){
  const command=pending;pending='';
  if(key===command&&mode==='NORMAL')yankOrDeleteLine(command);
  return;
 }
 if(key==='g'){pending='g';return;}
 if(mode==='VISUAL'||mode==='V-LINE'){
  if(key==='v'){if(mode==='VISUAL')exitVisual();else{setMode('VISUAL');showSelection();}return;}
  if(key==='V'){if(mode==='V-LINE')exitVisual();else{setMode('V-LINE');showSelection();}return;}
  if(['y','d','x','c','p','>','<'].includes(key)){visualOperation(key);return;}
  const next=motion(key,head);if(next!==null){head=next;showSelection();}return;
 }
 if(key==='u'){undo();return;}
 if(key==='v'){startVisual('char');return;}
 if(key==='V'){startVisual('line');return;}
 if(key==='i'){setMode('INSERT');return;}
 if(key==='a'){caret(t.selectionStart+1);setMode('INSERT');return;}
 if(key==='o'||key==='O'){
  const inf=line(),at=key==='o'?inf.e:inf.a;
  replace(at,at,'\n');caret(key==='o'?at+1:at);setMode('INSERT');return;
 }
 if(key==='d'||key==='y'){pending=key;return;}
 if(key==='p'){put();return;}
 if(key==='x'&&t.selectionStart<t.value.length){const pos=t.selectionStart;replace(pos,pos+1,'');caret(pos);return;}
 const next=motion(key,t.selectionStart);if(next!==null)caret(next);
},true);
window.ASICGHDLVimLite={isEnabled:()=>enabled,mode:()=>mode};
})();
