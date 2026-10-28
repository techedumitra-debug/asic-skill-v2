/* ASIC-Skill Visual Content Studio v37.1.12. Browser-local authoring for GitHub Pages. */
(()=>{'use strict';
let sections=[...document.querySelectorAll('.de-lesson[id]')];if(!sections.length)return;
// A saved/exported lesson must never start in Edit mode.
document.body.classList.remove('asic-edit-mode');

/* v37.1.08: repair blank paragraphs caused by previously pasted invalid
   <p><h3>, <p><ul>, <p><table>, and nested <p> markup. Preserve the text,
   styling, and block edit/delete identity. Idempotent; never edit widgets. */
// The editor uses orange outlines to show focus. Old pasted/edited lesson
// HTML accidentally persisted that focus decoration into inline style. Remove
// ONLY the known editor-focus colors, not author-defined borders or outlines.
function removePersistedEditorOutlines(root=document){
 let removed=0;
 const editorColor=/(?:#e88b24|#e6872b|rgb\(\s*232\s*,\s*139\s*,\s*36\s*\)|rgb\(\s*230\s*,\s*135\s*,\s*43\s*\))/i;
 for(const el of root.querySelectorAll('.de-lesson [style],.de-content [style]')){
  const outline=el.style.getPropertyValue('outline');
  const color=el.style.getPropertyValue('outline-color');
  if(!editorColor.test(outline)&&!editorColor.test(color))continue;
  for(const key of ['outline','outline-width','outline-style','outline-color','outline-offset'])el.style.removeProperty(key);
  if(!el.getAttribute('style')?.trim())el.removeAttribute('style');
  removed++;
 }
 return removed;
}
/* v37.1.10: A pasted <h1><h3>heading</h3></h1> can be split by
   the HTML parser into an empty lesson title plus a sibling H3 outside
   .de-content. The editor previously skipped that sibling entirely.
   Repair it before IDs are assigned, on draft cleanup, and on export. */
function repairDetachedLessonContent(root=document){
 let repaired=0;
 const lessons=[...(root.matches?.('.de-lesson[id]')?[root]:[]),
                ...root.querySelectorAll('.de-lesson[id]')];
 for(const lesson of lessons){
  const title=lesson.querySelector(':scope > h1');
  const host=lesson.querySelector(':scope > .de-content');
  if(!title||!host)continue;
  // Match only siblings BETWEEN the title and its content host, never
  // elements from the simulator, header navigation, or other lessons.
  const siblings=[];
  for(let node=title.nextElementSibling;node&&node!==host;node=node.nextElementSibling){
   siblings.push(node);
  }
  const orphanHeading=siblings.find(node=>/^H[2-6]$/.test(node.tagName)
                      && (node.textContent||'').trim());
  if(!(title.textContent||'').trim()&&orphanHeading){
   // Moving actual child nodes preserves inline emphasis/font formatting.
   while(orphanHeading.firstChild)title.appendChild(orphanHeading.firstChild);
   orphanHeading.remove();repaired++;
  }
  // Any remaining stray textual blocks belong to the lesson body, not
  // outside its editable region. Preserve order and block contents.
  const stranded=siblings.filter(node=>node.isConnected
   && node.parentElement===lesson
   && node.matches('h2,h3,h4,h5,h6,p,ul,ol,blockquote,figure,table'));
  for(let i=stranded.length-1;i>=0;i--){host.prepend(stranded[i]);repaired++;}
  // Old editor/paste fragment comments are non-content markup.
  for(const node of [...lesson.childNodes]){
   if(node.nodeType===8&&/^(?:StartFragment|EndFragment)$/.test(node.textContent.trim()))node.remove();
  }
  for(const node of [...title.childNodes]){
   if(node.nodeType===8&&/^(?:StartFragment|EndFragment)$/.test(node.textContent.trim()))node.remove();
  }
 }
 return repaired;
}
function normalizeLessonMarkup(root=document){
 let removed=0, repaired=repairDetachedLessonContent(root);
 removePersistedEditorOutlines(root);
 // Older exports persisted contenteditable on structural containers. Those
 // wrappers must NOT stay editable in normal Preview or intercept child text.
 for(const el of root.querySelectorAll('.de-lesson [data-asic-block-id][contenteditable]:not([data-asic-node-id]):not(.asic-added-block)')){
  if(el.closest('.asic-interactive-embed,[data-lab],[data-demo],[data-widget],.de-demo,.de-workbench,.de-quiz,.quiz,.de-try,.de-lab'))continue;
  el.removeAttribute('contenteditable');el.removeAttribute('spellcheck');
 }
 const lessonHosts=[...(root.matches?.('.de-lesson[id]')?[...root.querySelectorAll(':scope > .de-content')]:[]),...root.querySelectorAll('.de-lesson .de-content')];
 const protectedArea='svg,math,pre,code,template,.asic-interactive-embed,.de-demo,.de-workbench,.de-quiz,.quiz,[data-lab],[data-demo],[data-widget],.de-try,.de-lab';
 const significant=el=>((el.textContent||'').replace(/[\u200B-\u200D\uFEFF\u00A0]/g,'').trim().length>0)||!!el.querySelector('img,svg,video,iframe,canvas,table,ul,ol,button,input,select,textarea,details,figure');
 // A browser can also hold invalid children inside a P when markup is assigned
 // through innerHTML rather than parsed from a file. Convert just those P nodes
 // to DIV containers before they are serialized/exported.
 for(const host of lessonHosts){
  for(const paragraph of [...host.querySelectorAll('p')]){
   if(paragraph.closest(protectedArea)||!paragraph.querySelector('h1,h2,h3,h4,h5,h6,p,ul,ol,table,div,section,article,figure,blockquote'))continue;
   const div=document.createElement('div');
   for(const attr of [...paragraph.attributes])div.setAttribute(attr.name,attr.value);
   div.classList.add('asic-normalized-block');
   div.removeAttribute('data-asic-node-id');
   while(paragraph.firstChild)div.append(paragraph.firstChild);
   paragraph.replaceWith(div);repaired++;
  }
 }
 const emptyP=el=>el?.tagName==='P'&&!el.closest(protectedArea)&&!significant(el)&&!el.hasAttribute('id')&&!el.hasAttribute('role')&&!el.hasAttribute('aria-label')&&!el.hasAttribute('data-asic-keep-empty')&&!/(spacer|placeholder|visual-blank)/i.test(el.className||'');
 for(const host of lessonHosts){
  if(host.closest('.asic-interactive-embed'))continue;
  for(const parent of [host,...host.querySelectorAll('article,section,details,div')]){
   if(parent.closest(protectedArea)||!parent.isConnected)continue;
   for(const node of [...parent.children]){
    if(!node.isConnected||node.tagName!=='P'||!node.hasAttribute('data-asic-block-id')||significant(node))continue;
    const following=[];let walk=node.nextElementSibling;
    while(walk&&!walk.hasAttribute('data-asic-block-id')){
     if(walk.matches('.asic-block-actions')||walk.closest(protectedArea))break;
     following.push(walk);walk=walk.nextElementSibling;
    }
    if(!following.some(el=>significant(el)))continue;
    // Only reconstitute blocks with evidence of browser-split paste markup.
    if(!following.some(el=>el.matches('h1,h2,h3,h4,ul,ol,table,[data-pm-slice]')||el.querySelector('[data-pm-slice]')))continue;
    const wrapper=document.createElement('div');
    for(const attr of [...node.attributes])wrapper.setAttribute(attr.name,attr.value);
    wrapper.classList.add('asic-normalized-block');
    wrapper.removeAttribute('data-asic-node-id'); // container is not a single text node
    node.replaceWith(wrapper);
    for(const item of following){if(item.isConnected&&!item.matches('.asic-block-actions'))wrapper.append(item)}
    repaired++;
   }
  }
 }
 // Flatten invalid heading-in-heading paste without changing its text or SVG.
 for(const host of lessonHosts){
  for(const heading of [...host.querySelectorAll('h1,h2,h3,h4,h5,h6')]){
   const inner=heading.firstElementChild;
   if(!inner||inner.tagName!==heading.tagName||heading.children.length!==1||[...heading.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
   if(!heading.hasAttribute('style')&&inner.hasAttribute('style'))heading.setAttribute('style',inner.getAttribute('style'));
   heading.innerHTML=inner.innerHTML;repaired++;
  }
 }
 for(const host of lessonHosts){
  for(const el of [...host.querySelectorAll('p')]){
   if(!emptyP(el))continue;
   el.remove();removed++;
  }
 }
 return {removed,repaired};
}
/* v37.1.11: Empty wrapper headings/divs can survive the original P-only
   cleanup and cannot be selected. Only remove *contentless editorial nodes*;
   never touch SVGs, charts, controls, media, tables, or intentional spacers. */
function tidyEmptyEditorialLines(root=document){
 const wrappers=[...root.querySelectorAll('.de-lesson .de-content .de-sublesson > h2, .de-lesson .de-content .de-sublesson > h3, .de-lesson .de-content .de-sublesson > h4, .de-lesson .de-content .asic-normalized-block, .de-lesson .de-content > p, .de-lesson .de-content .de-sublesson > p, .de-lesson .de-content .de-sublesson > div:not([class]):not([id])')];
 let count=0;
 for(const el of wrappers){
   if(!el.isConnected||el.closest('svg,math,pre,code,.asic-interactive-embed,[data-lab],[data-demo],[data-widget],.de-workbench,.de-demo,.de-quiz,.quiz,.de-try,.de-lab'))continue;
   if(el.matches('[id],[data-asic-keep-empty],.spacer,.placeholder,.visual-blank'))continue;
   if((el.textContent||'').replace(/[\s\u200B-\u200D\uFEFF\u00A0]/g,'').length)continue;
   if(el.querySelector('svg,math,canvas,iframe,img,picture,video,audio,object,embed,table,figure,ul,ol,details,input,button,select,textarea,[id],[data-asic-keep-empty]'))continue;
   el.remove();count++;
 }
 return count;
}
/* Source documents made with earlier versions may repeat the same saved text
   node ID on several different headings. Such IDs silently route edits into
   the wrong element when drafts are restored. Retain the first, rename repeats. */
function uniqueEditorialIds(root=document){
 const ids=new Set(),counts=new Map();let changed=0;
 for(const el of root.querySelectorAll('.de-lesson [data-asic-node-id]')){
   const id=el.getAttribute('data-asic-node-id');if(!id)continue;
   if(!ids.has(id)){ids.add(id);continue}
   let n=(counts.get(id)||1)+1, candidate=id+'--dup'+n;
   while(ids.has(candidate)){n++;candidate=id+'--dup'+n}
   counts.set(id,n);el.setAttribute('data-asic-node-id',candidate);ids.add(candidate);changed++;
 }
 return changed;
}
function stableEditorialRepair(root=document){
 const base=normalizeLessonMarkup(root);
 const blank=tidyEmptyEditorialLines(root),duplicates=uniqueEditorialIds(root);
 return {removed:base.removed+blank,repaired:base.repaired,duplicates};
}
// Run before creating text IDs and comparing saved revisions.
stableEditorialRepair();

const PAGE=location.pathname.split('/').pop()||'digital-electronics.html';
const STORAGE='asic-skill:office-editor:v37107:'+location.pathname, OLD_STORAGE='asic-skill:office-editor:v99:'+PAGE;
const BACKUP=STORAGE+':recovery';
/* Each VS Code Live Server project path needs isolated drafts, even at localhost:5500. */
function contentHash(){let hash=2166136261; const raw=sections.map(s=>s.id+'::'+s.querySelector(':scope > h1')?.textContent+'::'+[...s.querySelectorAll('.de-content h1,.de-content h2,.de-content h3,.de-content h4,.de-content p,.de-content li,.de-content th,.de-content td,.de-content figcaption')].filter(n=>!n.closest('[data-lab],[data-demo],[data-widget],.de-demo,.de-workbench,.de-quiz,.quiz,.code-panel,.de-try,.de-lab,pre,code,svg')).map(n=>n.innerHTML).join('~')).join('||');for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16)}
const initialHash=contentHash();

const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch{return {}}};
const recoveryRead=()=>{try{return JSON.parse(localStorage.getItem(BACKUP)||localStorage.getItem(OLD_STORAGE))||null}catch{return null}};

const saved=read();
let recoveryDraft=null, recoveryReason='';
if(saved.originHash&&saved.originHash!==initialHash){recoveryDraft=saved;recoveryReason='Your earlier browser draft was made from a different HTML file and was not automatically applied. Use Restore Prior Draft only if needed; export the recovered work before replacing this file.';
try{localStorage.setItem(BACKUP,JSON.stringify(saved));localStorage.removeItem(STORAGE)}catch{}}
else if(!saved.originHash&&Object.keys(saved).length){recoveryDraft=saved;recoveryReason='A legacy draft is available. Restore it explicitly to avoid overwriting the exported HTML.';}
else if(!Object.keys(saved).length&&recoveryRead()){recoveryDraft=recoveryRead();recoveryReason='An earlier draft can be recovered if required.';}
const state=Object.assign({texts:{},attrs:{},modifiedBlocks:{},added:{},order:{},removedBlocks:[],removedNodes:[],deletedLessons:[],lessonNames:{},addedLessons:{},externalLessons:{},lessonOrder:[],originHash:initialHash},recoveryDraft?{}:saved);
state.originHash=initialHash;

const ensure=(obj,name,fallback)=>{if(!obj[name]||typeof obj[name]!=='object')obj[name]=fallback};
ensure(state,'texts',{});ensure(state,'attrs',{});ensure(state,'modifiedBlocks',{});ensure(state,'added',{});ensure(state,'order',{});ensure(state,'lessonNames',{});ensure(state,'addedLessons',{});ensure(state,'externalLessons',{});if(!Array.isArray(state.lessonOrder))state.lessonOrder=[];if(!Array.isArray(state.removedBlocks))state.removedBlocks=[];if(!Array.isArray(state.removedNodes))state.removedNodes=[];if(!Array.isArray(state.deletedLessons))state.deletedLessons=[];
const htmlEscape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const lessonName=s=>(s.querySelector('h1')?.textContent||s.id).trim();
const widgetSel='.asic-interactive-embed,.asic-interactive-frame,[data-lab],[data-demo],[data-widget],.u16-lab,.de-workbench,.u2-workbench,.de-demo,.de-quiz,.quiz,.de-quiz-card,.code-panel,.asic-editor-window,.asic-author-toolbar,.de-try,.de-lab,script,style,svg,canvas,pre,code';
const textSel='h1,h2,h3,h4,h5,h6,p,li,figcaption,th,td,blockquote,summary,span';
let enabled=false, current=null, selectedText=null, savedRange=null, moved=false, pendingSource=null, lastDelete=null, dragging=null, barBlock=null;
const style=document.createElement('style');style.id='asic-v100-css';style.textContent=`
#asic-edit-toggle{border:1px solid #f0a256;background:#db761a;color:#fff;border-radius:8px;padding:9px 13px;font:700 13px system-ui;cursor:pointer;white-space:nowrap}
#asic-editor-window{position:fixed;right:15px;bottom:12px;width:min(530px,calc(100vw - 24px));max-width:calc(100vw - 12px);min-width:285px;min-height:180px;max-height:94vh;resize:both;overflow:auto;z-index:2147483000;background:#fff;color:#1c3542;border:1px solid #0d765e;border-radius:12px;box-shadow:0 12px 40px #062b3c55;font:13px/1.5 system-ui,sans-serif}
#asic-editor-window *{box-sizing:border-box}#asic-editor-window[hidden]{display:none!important}#asic-editor-window .ae-header{background:#104452;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:9px 12px;gap:10px;cursor:move;position:sticky;top:0;z-index:2;user-select:none;touch-action:none}#asic-editor-window .ae-header button{background:#fff;color:#164449;border:0;border-radius:6px;padding:6px 9px;cursor:pointer}
#asic-editor-window .ae-body{padding:12px;max-height:none}#asic-editor-window .ae-help{font-size:11px;color:#556a72;margin:7px 0}#asic-editor-window .ae-row{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0;align-items:center}#asic-editor-window button,#asic-editor-window select,#asic-editor-window input[type=number],#asic-editor-window input[type=text]{background:#fff;color:#18463d;border:1px solid #b9d1ca;border-radius:6px;min-height:31px;padding:5px 7px;font:12px system-ui;cursor:pointer}
#asic-editor-window select{max-width:46%;min-width:95px}#asic-editor-window input[type=number]{width:64px}#asic-editor-window .ae-row.ae-table-tools{background:#f0f8f5;border:1px solid #cadfd7;padding:7px;border-radius:7px}
#asic-editor-window .ae-row.ae-table-tools input[type=number]{width:76px}
body.asic-edit-mode .de-lesson table[data-asic-width-edited="1"]{max-width:none!important}
    .de-content .asic-interactive-embed{max-width:100%;min-width:0;margin:12px 0 24px;background:#fff;border:1px solid #cbdcd7;border-radius:10px;overflow:hidden}
    .de-content .asic-interactive-frame{display:block;width:100%;height:1000px;min-height:500px;border:0;background:#fff}
    .de-content .asic-interactive-caption{padding:7px 11px;font:12px/1.35 system-ui,sans-serif;color:#46645d;background:#edf7f3;border-bottom:1px solid #d0e6dc}
    body.dark .de-content .asic-interactive-embed{background:#122934;border-color:#3d5a64}
    body.dark .de-content .asic-interactive-frame{background:#10242e}
    body.dark .de-content .asic-interactive-caption{background:#1b3945;color:#ddf3eb;border-color:#40616a}
    body.dark .de-footer{color:#c3e0df}
    body.asic-edit-mode .de-lesson figcaption,body.asic-edit-mode .de-lesson .de-caption,body.asic-edit-mode .de-lesson .asic-interactive-caption,
    body.asic-edit-mode .de-lesson .asic-figure-caption{cursor:text;outline:1px dotted #34b89e;outline-offset:2px}
    body.asic-edit-mode .de-lesson figcaption:focus,body.asic-edit-mode .de-lesson .de-caption:focus,
    body.asic-edit-mode .de-lesson .asic-interactive-caption:focus{outline:2px solid #e88b24}
    body.asic-edit-mode .de-content .asic-interactive-embed{outline:1px dashed #128368;outline-offset:2px}
    #asic-editor-window .ae-interactive-editor textarea{width:100%;min-height:190px;max-height:45vh;resize:vertical;font:11px/1.45 ui-monospace,monospace}

#asic-editor-window .ae-row label{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#435866}#asic-editor-window input[type=color]{height:30px;width:36px;padding:2px;border:1px solid #a9c8bc;border-radius:4px;background:#fff}
#asic-editor-window button:hover{background:#e8f6f1}#asic-editor-window button:focus-visible{outline:2px solid #e38b2b}#asic-editor-window .ae-primary{background:#0b745a;color:#fff;border-color:#0b745a}#asic-editor-window .ae-danger{border-color:#be7b7c;color:#9e292c}#asic-editor-window .ae-banner{padding:8px;border-radius:7px;background:#edf8f2;color:#145844;font-size:11px;min-height:28px;white-space:normal}#asic-editor-window .ae-section{font-weight:700;color:#244651;margin:11px 0 4px;border-bottom:1px solid #d6e4df;padding-bottom:3px}
#asic-editor-window #asic-lesson-select,#asic-editor-window #asic-plan-select{width:100%;max-width:100%}#asic-editor-window .ae-sourcetext{width:100%;height:170px;min-height:90px;font:11px/1.45 ui-monospace,monospace;border:1px solid #a7c8b9;border-radius:6px;padding:7px;white-space:pre;tab-size:2}
body.asic-edit-mode .de-lesson > .de-kicker[data-asic-node-id]{outline:1px dotted #118675;outline-offset:2px;cursor:text}body.asic-edit-mode .de-lesson > .de-kicker[data-asic-node-id]:focus{outline:2px solid #e88b24}body.asic-edit-mode .de-lesson > h1[data-asic-lesson-title]{outline:1px dotted #118675;outline-offset:2px;cursor:text}body.asic-edit-mode .de-lesson > .de-kicker[data-asic-node-id]{outline:1px dotted #118675;outline-offset:2px;cursor:text}body.asic-edit-mode .de-lesson > .de-kicker[data-asic-node-id]:focus{outline:2px solid #e88b24}body.asic-edit-mode .de-lesson > h1[data-asic-lesson-title]:focus{outline:2px solid #e88b24}body.asic-edit-mode .de-lesson [data-asic-node-id][contenteditable="true"]{outline:1px dotted #118675;outline-offset:2px;cursor:text}body.asic-edit-mode .de-lesson [data-asic-node-id][contenteditable="true"]:focus{outline:2px solid #e88b24;background:#fff7e81a}body.asic-edit-mode .de-lesson [data-asic-block-id]{transition:outline-color .2s}body.asic-edit-mode .de-lesson [data-asic-block-id].asic-picked{outline:2px solid #e6872b!important;outline-offset:4px}body.asic-edit-mode .de-lesson .asic-added-block{padding:7px;margin:9px 0;min-height:25px;border:1px dashed #34a087;border-radius:6px}body.asic-edit-mode .de-lesson .asic-added-block:empty::after{content:'Empty block - select Delete Content Block to remove';color:#a95125;font-size:11px}
.asic-block-actions{display:none!important}body.asic-edit-mode .asic-block-actions{display:flex!important;gap:5px;flex-wrap:wrap;align-items:center;padding:4px;background:#e7f6f0;border:1px solid #99cabb;margin:8px 0 7px;border-radius:6px;max-width:100%;position:relative;z-index:4}body.asic-edit-mode .asic-block-actions button{border:1px solid #a7c2b9;background:white;border-radius:5px;padding:4px 6px;color:#20574a;font:11px system-ui;cursor:pointer}.asic-block-actions [draggable]{cursor:grab;padding:4px;user-select:none}
.asic-drag-over{border-top:4px solid #df8529!important}body [data-asic-deleted-lesson='1']{display:none!important}body .de-nav-item[data-asic-deleted-nav='1']{display:none!important}
@media(max-width:600px){#asic-editor-window{left:7px;right:7px;bottom:7px;width:auto;min-width:270px;max-height:82vh}#asic-editor-window .ae-body{padding:9px}#asic-edit-toggle{font-size:11px;padding:6px 8px}}
`;document.head.append(style);
// Each block and text region has a persistent ID. Positions are never inferred from a flat table-cell list.
const hosts=[];
function setupLesson(section){
 if(!section||section.dataset.asicSetupDone)return;section.dataset.asicSetupDone="1";
 const title=section.querySelector(':scope > h1');if(title)title.dataset.asicLessonTitle=section.id;
 const kicker=section.querySelector(':scope > .de-kicker');if(kicker&&!kicker.dataset.asicNodeId)kicker.dataset.asicNodeId=section.id+'-kicker';
 section.querySelectorAll('.de-content .de-kicker').forEach((el,i)=>{if(!el.dataset.asicNodeId)el.dataset.asicNodeId=section.id+'-subkicker-'+i});
 [...section.querySelectorAll('.de-content')].forEach((host,i)=>{const owner=host.closest('.de-lesson[id]');if(owner!==section)return;host.dataset.asicHostId=section.id+'--'+i;hosts.push(host);
  [...host.children].forEach((child,j)=>{if(['SCRIPT','STYLE'].includes(child.tagName))return;if(!child.dataset.asicBlockId)child.dataset.asicBlockId=section.id+'-b'+i+'-'+j;});
 });
 const candidates=[...section.querySelectorAll(textSel)].filter(el=>el.closest('.de-lesson[id]')===section&&!el.closest(widgetSel)&&!el.closest('a,button,nav,select,form')&&el.closest('.de-content')&&!el.closest('.asic-block-actions')&&el.children.length<7);
 candidates.forEach((el,i)=>{if(!el.dataset.asicNodeId)el.dataset.asicNodeId=section.id+'-t'+i});
}
sections.forEach(setupLesson);

/* Pick up new native text elements after paste/normalization, not just
   those present at initial setup. Do not modify simulator/widget markup. */
function refreshEditableTextNodes(){
 for(const section of sections){
  const candidates=[...section.querySelectorAll('.de-content '+textSel.split(',').join(',.de-content '))];
  for(const el of candidates){
   if(el.dataset.asicNodeId||el.closest(widgetSel)||el.closest('a,button,nav,select,form')
      ||el.closest('.asic-block-actions')||el.closest('.asic-interactive-frame'))continue;
   if(!(el.textContent||'').trim()&&el.tagName!=='TD'&&el.tagName!=='TH')continue;
   if(el.children.length>=8)continue;
   if(['SPAN','P'].includes(el.tagName)&&el.closest('h1,h2,h3,h4,h5,h6,li,p,th,td,figcaption,blockquote,summary'))continue;
   // Unique, persistent node identity; export will include the new ID.
   let key=section.id+'-extra-'+Math.random().toString(36).slice(2,11);
   while(document.querySelector('[data-asic-node-id="'+key+'"]'))
     key=section.id+'-extra-'+Math.random().toString(36).slice(2,11);
   el.dataset.asicNodeId=key;
  }
 }
}
// Normalize legacy paste artefacts without changing substantive lesson content.
function repairNoteHighlights(scope){
 for(const el of scope.querySelectorAll('.de-note [style]')){
  const value=el.style.backgroundColor.replace(/\s+/g,'').toLowerCase();
  if(['rgb(255,255,255)','white','#fff','#ffffff'].includes(value)){
   el.style.removeProperty('background-color');
   if(!el.getAttribute('style')?.trim())el.removeAttribute('style');
  }
 }
}
sections.forEach(repairNoteHighlights);

// v37.1.03: a lesson plan combines embedded lessons and standalone HTML links.
const planNav=()=>document.querySelector('.de-sidenav');
const planPanel=()=>document.querySelector('.de-study-panel');
const planItems=()=>[...(planNav()?.children||[])].filter(n=>n.matches('.de-nav-item[data-target],.asic-external-lesson[data-asic-link-id]')).map(n=>({node:n,key:n.dataset.asicLinkId?'ext:'+n.dataset.asicLinkId:n.dataset.target,external:!!n.dataset.asicLinkId}));
function externalStyle(){if(document.getElementById('asic-external-nav-css'))return;const sheet=document.createElement('style');sheet.id='asic-external-nav-css';sheet.textContent='.de-sidenav .asic-external-lesson{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;padding:10px 12px;border-radius:8px;font:inherit;cursor:pointer;width:100%;border:0;background:transparent}.de-sidenav .asic-external-lesson:hover,.de-sidenav .asic-external-lesson:focus-visible{background:#e3f5ef;outline:2px solid #168768}.asic-external-lesson .de-nav-index{opacity:.75;min-width:2em}.asic-external-lesson .asic-external-icon{font-size:11px;color:#08755a;margin-left:auto}';document.head.appendChild(sheet)}
function createNav(id,title,href){
 if(href){externalStyle();const link=document.createElement('a');link.className='asic-external-lesson';link.dataset.asicLinkId=id;link.href=href;link.innerHTML='<span class="de-nav-index"></span><span></span><span class="asic-external-icon" title="Opens independent HTML file">HTML ↗</span>';link.children[1].textContent=title;return link;}
 const btn=document.createElement('button');btn.type='button';btn.className='de-nav-item';btn.dataset.target=id;btn.setAttribute('aria-current','false');btn.innerHTML='<span class="de-nav-index"></span><span></span><span class="de-done-mark" hidden aria-label="Completed">✓</span>';btn.children[1].textContent=title;return btn;
}
function refreshSections(){sections=[...document.querySelectorAll('.de-lesson[id]')];}
function applyPlanOrder(keys){
 const nav=planNav(),panel=planPanel();if(!nav||!panel)return;
 const all=planItems(),byKey=new Map(all.map(x=>[x.key,x]));
 const order=[...new Set([...(keys||[]),...all.map(x=>x.key)])].filter(k=>byKey.has(k));
 for(const key of order){const entry=byKey.get(key);nav.appendChild(entry.node);if(!entry.external){const sec=sections.find(s=>s.id===key);if(sec)panel.appendChild(sec)}}
 refreshSections();state.lessonOrder=order;renumberPlan();
}
function renumberPlan(){let i=0;for(const entry of planItems()){const index=entry.node.querySelector('.de-nav-index');if(index)index.textContent=String(i++).padStart(2,'0')}updateLessonSelect?.();updatePlanSelect?.()}
function defaultLessonHTML(id,title,inner){const s=document.createElement('section');s.className='de-lesson';s.id=id;s.hidden=true;s.dataset.asicImportedLesson='1';s.setAttribute('aria-labelledby','title-'+id);const kicker=document.createElement('div');kicker.className='de-kicker';kicker.textContent='ADDED LESSON';const h=document.createElement('h1');h.id='title-'+id;h.textContent=title;const box=document.createElement('div');box.className='de-content';box.innerHTML=inner||'<p>Start writing your lesson here.</p>';const actions=document.createElement('div');actions.className='de-lesson-actions';actions.innerHTML='<button class="de-button alt" data-action="previous" type="button">← Previous</button><button class="de-button" data-action="complete" type="button">Mark complete ✓</button><button class="de-button alt" data-action="next" type="button">Next lesson →</button>';s.append(kicker,h,box,actions);return s}
function addEmbeddedLesson(sec,shouldActivate){if(!sec?.id||document.getElementById(sec.id))return false;sec.dataset.asicImportedLesson='1';planPanel().append(sec);planNav().append(createNav(sec.id,sec.querySelector(':scope > h1')?.textContent||sec.id));refreshSections();setupLesson(sec);repairNoteHighlights(sec);if(shouldActivate){setEdit(true)}if(shouldActivate){state.addedLessons[sec.id]=sec.outerHTML;state.lessonOrder=planItems().map(x=>x.key);applyPlanOrder(state.lessonOrder);selectPlanKey(sec.id);goPlan(sec.id)}return true}
function addExternalLesson(data,shouldSave){if(!data||!data.id||planNav().querySelector('[data-asic-link-id="'+data.id+'"]'))return;const entry=createNav(data.id,data.title,data.href);planNav().append(entry);if(shouldSave){state.externalLessons[data.id]=data;state.lessonOrder=planItems().map(x=>x.key);applyPlanOrder(state.lessonOrder);selectPlanKey('ext:'+data.id)}}
function restorePlanDraft(){for(const [id,html] of Object.entries(state.addedLessons||{})){if(document.getElementById(id))continue;const tpl=document.createElement('template');tpl.innerHTML=html;const sec=tpl.content.firstElementChild;if(sec?.matches('.de-lesson')){sec.removeAttribute('data-asic-setup-done');sec.hidden=true;addEmbeddedLesson(sec,false)}}for(const data of Object.values(state.externalLessons||{}))addExternalLesson(data,false);if(state.lessonOrder?.length)applyPlanOrder(state.lessonOrder);else refreshSections()}
function planTitle(entry){if(entry.external)return entry.node.children[1]?.textContent?.trim()||entry.key;return lessonName(sections.find(s=>s.id===entry.key)||{querySelector:()=>null,id:entry.key})}
function updatePlanSelect(){const el=document.querySelector('#asic-plan-select');if(!el)return;const previous=el.value;const entries=planItems();el.replaceChildren(...entries.map((x,i)=>{const opt=document.createElement('option');opt.value=x.key;opt.textContent=String(i+1).padStart(2,'0')+' · '+planTitle(x)+(x.external?' [SEPARATE HTML]':'');return opt}));el.value=entries.some(x=>x.key===previous)?previous:entries.find(x=>x.key===document.querySelector('#asic-lesson-select')?.value)?.key||entries[0]?.key||'';syncPlanPosition()}
function syncPlanPosition(){const pos=document.querySelector('#asic-plan-position');if(!pos)return;const ix=planItems().findIndex(x=>x.key===document.querySelector('#asic-plan-select')?.value);pos.value=String(Math.max(1,ix+1));pos.max=String(planItems().length)}
function selectPlanKey(key){const el=document.querySelector('#asic-plan-select');if(el){el.value=key;syncPlanPosition()}const picker=document.querySelector('#asic-lesson-select');if(picker&&sections.some(s=>s.id===key))picker.value=key}
function changeLessonOrder(step){const entries=planItems(),key=document.querySelector('#asic-plan-select')?.value,idx=entries.findIndex(x=>x.key===key);if(idx<0)return status('Choose a lesson page in the lesson plan.');const dest=step==='up'?idx-1:step==='down'?idx+1:Number(document.querySelector('#asic-plan-position').value)-1;if(!Number.isInteger(dest)||dest<0||dest>=entries.length)return status('Choose a position from 1 to '+entries.length);if(dest===idx)return status('The lesson is already in that position.');const order=entries.map(x=>x.key);order.splice(dest,0,order.splice(idx,1)[0]);applyPlanOrder(order);document.body.dataset.asicCustomPlan='1';selectPlanKey(key);store(false);status('Lesson moved to position '+(dest+1)+'. Sidebar, Previous/Next and exported HTML follow the new order.')}
function goPlan(key){const entry=planItems().find(x=>x.key===key);if(!entry)return;if(entry.external){location.href=entry.node.href;return}const section=sections.find(s=>s.id===key);if(!section||section.dataset.asicDeletedLesson)return;const items=planItems().filter(x=>x.external||!sections.find(s=>s.id===x.key)?.dataset.asicDeletedLesson);const pos=items.findIndex(x=>x.key===key);sections.forEach(s=>{s.hidden=s!==section});document.querySelectorAll('.de-nav-item[data-target]').forEach(el=>{const active=el.dataset.target===key;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false')});const buttons=section.querySelectorAll('[data-action]');for(const b of buttons){if(b.dataset.action==='previous')b.disabled=pos<=0;if(b.dataset.action==='next')b.disabled=pos>=items.length-1}const counter=document.querySelector('#de-counter');if(counter)counter.textContent=String(pos+1).padStart(2,'0')+' / '+items.length;const route=document.querySelector('#de-route');if(route)route.textContent='LESSON '+String(pos+1).padStart(2,'0')+' / '+items.length;document.title=lessonName(section)+' | ASIC-Skill';if(location.hash.slice(1)!==key)history.replaceState(null,'','#'+key);document.querySelector('#de-sidebar')?.classList.remove('show');const overlay=document.querySelector('#de-sidebar-overlay');if(overlay)overlay.hidden=true;document.querySelector('#de-menu')?.setAttribute('aria-expanded','false');selectPlanKey(key);const pick=document.querySelector('#asic-lesson-select');if(pick)pick.value=key;window.scrollTo({top:0,behavior:'instant'})}
// During editing the unit's original navigation controller retains an old frozen list.
// In exported HTML these sections are already reordered before that controller starts.
// This capture delegate handles the live draft and external HTML links in both modes.
document.addEventListener('click',e=>{
 const entry=e.target.closest?.('.de-nav-item[data-target],.asic-external-lesson[data-asic-link-id]');
 if(entry&&document.body.dataset.asicCustomPlan==='1'){
   e.preventDefault();e.stopImmediatePropagation();goPlan(entry.dataset.asicLinkId?'ext:'+entry.dataset.asicLinkId:entry.dataset.target);return;
 }
 const button=e.target.closest?.('.de-study-panel [data-action]');
 if(!button||document.body.dataset.asicCustomPlan!=='1')return;
 if(!['next','previous','complete'].includes(button.dataset.action))return;
 e.preventDefault();e.stopImmediatePropagation();
 const key=sections.find(s=>!s.hidden)?.id,items=planItems().filter(x=>x.external||!sections.find(s=>s.id===x.key)?.dataset.asicDeletedLesson),idx=items.findIndex(x=>x.key===key);
 if(button.dataset.action==='next'||button.dataset.action==='previous'){const to=idx+(button.dataset.action==='next'?1:-1);if(items[to])goPlan(items[to].key);return}
 const mark=planNav()?.querySelector('.de-nav-item[data-target="'+CSS.escape(key)+'"] .de-done-mark');if(mark){mark.hidden=!mark.hidden;button.textContent=mark.hidden?'Mark complete ✓':'✓ Completed · Mark incomplete'}
},true);
function makeId(title){const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'lesson';let id='custom-'+slug,n=2;while(document.getElementById(id)||state.externalLessons[id]||state.addedLessons[id])id='custom-'+slug+'-'+n++;return id}
// v37.1.04: preserve complete standalone lessons (styles, scripts, SVG, canvases, controls).
// Import runs only inside a sandboxed, opaque-origin iframe; it never injects an imported
// script into the parent editor. Saved/exported markup includes the complete srcdoc.
const FRAME_BRIDGE_START='<!-- ASIC-Skill interactive resize bridge START -->';
const FRAME_BRIDGE_END='<!-- ASIC-Skill interactive resize bridge END -->';
const FRAME_BRIDGE=FRAME_BRIDGE_START+'<script>'+String.raw`(function(){'use strict';
  function report(){if(!document.body)return;var b=document.body,r=b.getBoundingClientRect(),style=getComputedStyle(b);
    parent.postMessage({asicInteractiveHeight:Math.ceil(r.height+(parseFloat(style.marginBottom)||0)+(parseFloat(style.marginTop)||0)+16)},'*');}
  window.addEventListener('load',report);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',report);
  if(window.ResizeObserver){var observer=new ResizeObserver(report);if(document.body)observer.observe(document.body);else document.addEventListener('DOMContentLoaded',function(){observer.observe(document.body);});}
  setTimeout(report,100);setTimeout(report,500);setTimeout(report,1200);
  var active=false,chosen=null,editing=null,visualHint=null;
  var overlay=document.createElement('style');overlay.setAttribute('data-asic-visual-temporary','1');overlay.textContent='html.asic-visual-edit{cursor:crosshair!important}html.asic-visual-edit [data-asic-visual-selected="1"]{outline:3px solid #e87526!important;outline-offset:3px!important;cursor:text!important}html.asic-visual-edit [data-asic-visual-selected="1"][contenteditable="true"]{outline:3px solid #218f65!important;cursor:text!important}';
  (document.head||document.documentElement).appendChild(overlay);
  var darkCSS=document.createElement('style');darkCSS.setAttribute('data-asic-theme-temporary','1');
  darkCSS.textContent=[
    'html.asic-embed-dark{color-scheme:dark!important;--orange:#ffab55;--dark:#e9f4f5;--green:#74ddb1;--green-bg:#1b423d;--ink:#e6f3f4;--muted:#aac8cc;--line:#3a5862;--paper:#0c202a;--card:#1b333f;--blue:#8dbdfa;--violet:#c0a9ec;--shadow:0 5px 18px rgba(0,0,0,.25)}',
    'html.asic-embed-dark body{background:#0c202a!important;color:#e6f3f4!important}',
    'html.asic-embed-dark .hero,html.asic-embed-dark header.hero{background:linear-gradient(105deg,#693b1d,#94501c)!important;color:#fff!important;border-color:#5ac8a0!important}',
    'html.asic-embed-dark .hero p,html.asic-embed-dark .hero .eyebrow{color:#ffeddf!important}',
    'html.asic-embed-dark footer,html.asic-embed-dark .footer{background:#071923!important;color:#ddedef!important;border-color:#d88b42!important}',
    'html.asic-embed-dark .panel,html.asic-embed-dark .principle,html.asic-embed-dark .fact,html.asic-embed-dark .sim-col,html.asic-embed-dark .flowbox,html.asic-embed-dark .value-card,html.asic-embed-dark .fa-cell,html.asic-embed-dark .diagram,html.asic-embed-dark .wave-container,html.asic-embed-dark .table-wrap{background:#19323d!important;border-color:#42606b!important;color:#e7f3f2!important}',
    'html.asic-embed-dark .value-card.emphasis,html.asic-embed-dark .formula,html.asic-embed-dark .note,html.asic-embed-dark .fa-cell.selected{background:#24413a!important;border-color:#5a947b!important;color:#ecf5e8!important}',
    'html.asic-embed-dark .tab,html.asic-embed-dark button.control-btn,html.asic-embed-dark .bit,html.asic-embed-dark .switch,html.asic-embed-dark .steps button{background:#294653!important;color:#e8f5f5!important;border-color:#55717c!important}',
    'html.asic-embed-dark .tab[aria-selected="true"],html.asic-embed-dark .bit.one,html.asic-embed-dark .switch.active,html.asic-embed-dark .control-btn.primary{background:#176a55!important;color:#fff!important}',
    'html.asic-embed-dark p.lead,html.asic-embed-dark .smallprint,html.asic-embed-dark .status,html.asic-embed-dark .wavelegend,html.asic-embed-dark .principle span,html.asic-embed-dark .flowbox small,html.asic-embed-dark .fact small,html.asic-embed-dark .value-card small{color:#b7d2d4!important}',
    'html.asic-embed-dark .panel h2,html.asic-embed-dark .sim-col h3,html.asic-embed-dark .principle b,html.asic-embed-dark .flowbox strong,html.asic-embed-dark .fact strong,html.asic-embed-dark .value-card b,html.asic-embed-dark .digits,html.asic-embed-dark .num{color:#d3f3e4!important}',
    'html.asic-embed-dark .table-wrap th,html.asic-embed-dark .history th,html.asic-embed-dark table.truth th{background:#285047!important;color:#eaf8ed!important}',
    'html.asic-embed-dark table td{color:#e7f3f2!important;border-color:#3f5864!important}',
    'html.asic-embed-dark .fa-cell.selected,html.asic-embed-dark table.truth tr.active{background:#405137!important}',
    'html.asic-embed-dark .value-card,html.asic-embed-dark .principle,html.asic-embed-dark .fact{box-shadow:none!important}',
    'html.asic-embed-dark input:not([type="range"]),html.asic-embed-dark textarea,html.asic-embed-dark select{background:#17323f!important;color:#eaf6f4!important;border-color:#54747a!important}',
    'html.asic-embed-dark .de-caption,html.asic-embed-dark figcaption,html.asic-embed-dark .asic-imported-figure-caption{color:#cbebdf!important;background:#193540!important}',
    'html.asic-embed-dark .mini-tag{background:#245344!important;color:#c6f1df!important}'
  ].join('');(document.head||document.documentElement).appendChild(darkCSS);
  function setTheme(dark){document.documentElement.classList.toggle('asic-embed-dark',!!dark);report();}
  function emit(kind,data){parent.postMessage(Object.assign({asicInteractiveEditor:true,kind:kind},data||{}),'*');}
  function clear(){if(chosen)chosen.removeAttribute('data-asic-visual-selected');chosen=null;}
  function editableTarget(node){var el=node&&node.nodeType===1?node:node&&node.parentElement;if(!el)return null;
    if(el.closest('svg'))return el.closest('text')||el.closest('svg');
    return el.closest('figcaption,.de-caption,.asic-imported-figure-caption,[class*="figure-caption"],[class*="image-caption"],.caption,[data-caption],img,h1,h2,h3,h4,h5,h6,p,li,th,td,blockquote,summary,button,label,.note,.formula,.fact strong,.flowbox strong,.principle span,.principle b,.mini-tag,figure,.diagram,.panel,.sim-col,.value-card,.fact,.flowbox,header .eyebrow,header,footer');}
  function captionNode(item){return item&&item.matches('figcaption,.de-caption,.asic-imported-figure-caption,[class*="figure-caption"],[class*="image-caption"],.caption,[data-caption]');}
  function describe(){if(chosen){var tag=chosen.tagName.toLowerCase(),fig=chosen.closest('figure');var cap=captionNode(chosen)?chosen:(fig&&fig.querySelector('figcaption,.de-caption'));
      emit('selected',{tag:tag,html:chosen.innerHTML||'',text:tag==='img'?(chosen.getAttribute('alt')||chosen.getAttribute('title')||''):tag==='svg'?(chosen.getAttribute('aria-label')||chosen.querySelector('title')?.textContent||''):chosen.textContent||'',isSvg:!!chosen.closest('svg'),isFigure:!!(tag==='img'||tag==='svg'||tag==='figure'||captionNode(chosen)||chosen.matches('.diagram')),caption:cap?cap.textContent:''});
    }else emit('selected',{tag:'',html:'',text:'',caption:''});}
  function select(el){if(editing&&editing!==el)finishEdit();clear();chosen=el;chosen.setAttribute('data-asic-visual-selected','1');describe();}
  function snapshot(){var copy=document.documentElement.cloneNode(true);
    copy.classList.remove('asic-visual-edit','asic-embed-dark');copy.querySelectorAll('[data-asic-visual-temporary],[data-asic-theme-temporary]').forEach(function(node){node.remove();});
    copy.querySelectorAll('[data-asic-visual-selected]').forEach(function(node){node.removeAttribute('data-asic-visual-selected');});
    copy.querySelectorAll('[data-asic-visual-editing]').forEach(function(node){node.removeAttribute('data-asic-visual-editing');node.removeAttribute('contenteditable');node.removeAttribute('spellcheck');});
    emit('commit',{html:'<!DOCTYPE html>\n'+copy.outerHTML});report();}
  function finishEdit(){if(!editing)return;editing.removeAttribute('data-asic-visual-editing');editing.removeAttribute('contenteditable');editing.removeAttribute('spellcheck');editing=null;describe();snapshot();}
  function updateCaption(label){if(!chosen)return;var target=chosen,figure=target.closest('figure');
    if(captionNode(target)){target.textContent=label;var icon=target.closest('figure')?.querySelector('img');if(icon)icon.alt=label;describe();snapshot();return;}
    var graphic=target.matches('img,svg')?target:(target.querySelector('img,svg')||target.closest('.diagram')?.querySelector('svg'));
    if(!graphic&&!figure){emit('notice',{text:'Select an image, SVG diagram, or existing caption first.'});return;}
    if(graphic?.tagName.toLowerCase()==='img')graphic.alt=label;
    if(graphic?.tagName.toLowerCase()==='svg'){graphic.setAttribute('aria-label',label);var title=graphic.querySelector(':scope > title');if(title)title.textContent=label;else{title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=label;graphic.insertBefore(title,graphic.firstChild);}}
    var cap=figure?.querySelector('figcaption,.de-caption')||target.querySelector?.('figcaption,.de-caption');
    if(!cap){var anchor=figure||target.closest('.diagram')||target;cap=document.createElement(figure?'figcaption':'p');if(!figure)cap.className='asic-imported-figure-caption de-caption';anchor.insertAdjacentElement('afterend',cap);}
    cap.textContent=label;select(cap);snapshot();}
  document.addEventListener('click',function(e){if(!active||editing)return;var hit=editableTarget(e.target);if(!hit)return;
    e.preventDefault();e.stopImmediatePropagation();select(hit);
  },true);
  document.addEventListener('dblclick',function(e){if(!active)return;var hit=editableTarget(e.target);if(!hit||hit.closest('svg')||hit.tagName==='IMG'||hit.tagName==='SVG')return;
    e.preventDefault();e.stopImmediatePropagation();if(chosen!==hit)select(hit);editing=hit;
    hit.setAttribute('data-asic-visual-editing','1');hit.setAttribute('contenteditable','true');hit.setAttribute('spellcheck','true');hit.focus();
  },true);
  document.addEventListener('focusout',function(e){if(editing&&e.target===editing){finishEdit();}},true);
  document.addEventListener('keydown',function(e){if(editing&&e.key==='Escape'){e.preventDefault();editing.blur();}},true);
  window.addEventListener('message',function(event){if(event.source!==parent||!event.data||event.data.asicInteractiveCommand!==true)return;
    var m=event.data,action=m.action;
    if(action==='theme'){setTheme(m.dark);return;}
    if(action==='mode'){active=!!m.enabled;document.documentElement.classList.toggle('asic-visual-edit',active);if(!active){finishEdit();clear();describe();}emit('mode',{enabled:active});return;}
    if(!active){emit('notice',{text:'Enable Visual Editing first.'});return;}
    if(action==='selectNone'){clear();describe();return;}
    if(!chosen){emit('notice',{text:'First click a text element or diagram in the imported lesson.'});return;}
    if(editing)finishEdit();
    if(action==='setText'&&chosen.tagName.toLowerCase()==='svg'){emit('notice',{text:'Select an SVG text label, or use Rename Image / Diagram Caption for its title.'});return;}
    if(action==='caption'){updateCaption(String(m.value||''));return;}
    if(action==='setText'||action==='setHTML'){
      if(chosen.tagName.toLowerCase()==='img'&&action==='setText'){chosen.alt=String(m.value||'');}
      else if(action==='setHTML'){chosen.innerHTML=String(m.value||'');}
      else{chosen.textContent=String(m.value||'');}
      describe();snapshot();return;}
    if(action==='delete'){if(chosen.matches('html,head,body,script,style'))return;chosen.remove();clear();describe();snapshot();return;}
    if(action==='moveUp'||action==='moveDown'){var el=chosen,par=el.parentElement;if(!par||par.tagName==='HTML')return;
      if(action==='moveUp'&&el.previousElementSibling)par.insertBefore(el,el.previousElementSibling);
      if(action==='moveDown'&&el.nextElementSibling)par.insertBefore(el.nextElementSibling,el);
      describe();snapshot();return;}
    if(action==='insert'){var node=document.createElement(m.tag==='h2'?'h2':m.tag==='div'?'div':'p');
      if(m.tag==='div'){node.className='note';node.innerHTML='<strong>Important:</strong> Enter your note here.';}else{node.textContent=m.tag==='h2'?'New heading':'Write your explanation here.';}
      var near=chosen.closest('svg')||chosen;var container=near.parentNode;if(container&&container.namespaceURI==='http://www.w3.org/1999/xhtml'){
        container.insertBefore(node,near.nextSibling);select(node);snapshot();}return;}
  });
  emit('ready');
})()`+'</scr'+'ipt>'+FRAME_BRIDGE_END;
function stripFrameBridge(html){const a=String(html||'');const begin=a.indexOf(FRAME_BRIDGE_START),end=a.indexOf(FRAME_BRIDGE_END);return begin<0||end<begin?a:a.slice(0,begin)+a.slice(end+FRAME_BRIDGE_END.length)}
function frameHTML(source){const original=stripFrameBridge(source);const pos=original.search(/<\/body\s*>/i);return pos<0?original+FRAME_BRIDGE:original.slice(0,pos)+FRAME_BRIDGE+original.slice(pos)}
function sourceTitle(html,file){const doc=new DOMParser().parseFromString(html,'text/html');return (doc.querySelector('header.hero h1,main h1,article h1,h1')?.textContent||doc.title||file?.name?.replace(/\.html?$/i,'')||'Interactive HTML Lesson').trim().slice(0,180)}
function createInteractiveInner(html,fileName){const wrapper=document.createElement('div');wrapper.className='asic-interactive-embed';wrapper.dataset.asicInteractive='1';
 const caption=document.createElement('div');caption.className='asic-interactive-caption';caption.textContent='Interactive lesson · '+fileName+' · diagrams, waveforms and controls run inside this embedded page';
 const frame=document.createElement('iframe');frame.className='asic-interactive-frame';frame.setAttribute('title','Interactive lesson: '+fileName);
 frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('loading','eager');
 frame.setAttribute('srcdoc',frameHTML(html));wrapper.append(caption,frame);return wrapper.outerHTML;
}
function activeInteractiveFrame(){const section=selectedSection?.()||getLesson();return section?.querySelector('.asic-interactive-frame')||null}
function openInteractiveSource(){const frame=activeInteractiveFrame();if(!frame)return status('Select an imported interactive lesson to edit its original HTML.');
 document.querySelector('#asic-interactive-source').value=stripFrameBridge(frame.getAttribute('srcdoc'));
 document.querySelector('#asic-interactive-source-wrap').hidden=false;status('Full imported document source is available below. Changes are applied to the embedded page when you click Apply Interactive HTML.');}
function applyInteractiveSource(){const frame=activeInteractiveFrame(),input=document.querySelector('#asic-interactive-source');if(!frame||!input)return status('Open an imported interactive lesson first.');
 const html=input.value;if(!/<(?:html|body|main|section)\b/i.test(html))return status('Enter a valid HTML document with a body or main section.');
 frame.setAttribute('srcdoc',frameHTML(html));interactiveUndo.length=0;interactiveSelection=null;document.querySelector('#asic-interactive-source-wrap').hidden=true;store(false);status('Interactive page updated in its isolated viewer. Export ALL Lessons HTML to publish changes.');}
// Visual authoring messages are restricted to the actual imported iframe window.
let interactiveVisualMode=false,interactiveSelection=null,interactiveUndo=[];
function selectedInteractiveFrame(){const showing=sections.find(s=>!s.hidden&&s.querySelector('.asic-interactive-frame'));return showing?.querySelector('.asic-interactive-frame')||activeInteractiveFrame()}
function interactiveTools(){return document.querySelector('#asic-interactive-visual-tools')}
function syncImportedTheme(){const dark=document.body.classList.contains('dark');for(const frame of document.querySelectorAll('.asic-interactive-frame')){frame.contentWindow?.postMessage({asicInteractiveCommand:true,action:'theme',dark},'*')}}
new MutationObserver(syncImportedTheme).observe(document.body,{attributes:true,attributeFilter:['class']});
function interactiveMessage(action,extra){const frame=selectedInteractiveFrame();if(!frame)return status('Open an imported interactive HTML lesson first.');
 frame.contentWindow?.postMessage(Object.assign({asicInteractiveCommand:true,action},extra||{}),'*');}
function setInteractiveVisual(on){const frame=selectedInteractiveFrame();if(!frame)return status('Open an imported interactive HTML lesson first.');
 interactiveVisualMode=!!on;interactiveSelection=null;interactiveTools().hidden=!on;
 document.querySelector('#asic-interactive-selected').textContent='Click a heading, paragraph, note, diagram, or control inside the imported page.';
 document.querySelector('#asic-interactive-text').value='';interactiveMessage('mode',{enabled:on});
 status(on?'Visual editing enabled. Click an item in the imported lesson; double-click text to edit it directly, or use the inspector below.':'Interactive Preview enabled. Simulator controls and waveforms are live again.');}
function applyInteractiveVisual(asHTML){if(!interactiveVisualMode||!interactiveSelection)return status('Select an element inside the imported page first.');
 const field=document.querySelector('#asic-interactive-text');interactiveMessage(asHTML?'setHTML':'setText',{value:field.value});}
function renameInteractiveCaption(){if(!interactiveVisualMode||!interactiveSelection)return status('Select an image, SVG diagram, or caption in the imported page first.');
 const caption=interactiveSelection.caption||interactiveSelection.text||'';const name=prompt('Image / diagram caption:',caption.trim().slice(0,500));if(name===null)return;
 interactiveMessage('caption',{value:name.slice(0,500)});}
function removeInteractiveVisual(){if(!interactiveVisualMode||!interactiveSelection)return status('Select an imported element first.');
 if(!confirm('Delete selected '+interactiveSelection.tag+' from this interactive page? Removing a simulator control or SVG component could affect its script.'))return;
 interactiveMessage('delete');}
function undoInteractiveVisual(){const frame=selectedInteractiveFrame();if(!frame||!interactiveUndo.length)return status('Nothing to undo in this imported page.');
 const previous=interactiveUndo.pop();frame.setAttribute('srcdoc',frameHTML(previous));interactiveSelection=null;
 document.querySelector('#asic-interactive-selected').textContent='Undone. Select another element inside the imported page.';
 store(false);status('Restored the previous interactive page version.');}
window.addEventListener('message',event=>{const msg=event.data;if(!msg||msg.asicInteractiveEditor!==true)return;
 const frame=[...document.querySelectorAll('.asic-interactive-frame')].find(f=>f.contentWindow===event.source);if(!frame)return;
 if(msg.kind==='ready'){frame.contentWindow.postMessage({asicInteractiveCommand:true,action:'theme',dark:document.body.classList.contains('dark')},'*');if(interactiveVisualMode&&frame===selectedInteractiveFrame())frame.contentWindow.postMessage({asicInteractiveCommand:true,action:'mode',enabled:true},'*');return;}
 if(msg.kind==='selected'){if(frame!==selectedInteractiveFrame())return;
 interactiveSelection=msg.tag?{tag:msg.tag,html:msg.html||'',text:msg.text||'',isSvg:!!msg.isSvg}:null;
 const label=document.querySelector('#asic-interactive-selected'),input=document.querySelector('#asic-interactive-text');
 label.textContent=msg.tag?'Selected <'+msg.tag+'>. '+(msg.isFigure?'Rename its figure caption, or edit an SVG text label.':'Edit its text, or double-click to type.'): 'Click a heading, caption, figure, header or footer text in the imported page.';
 if(msg.tag)input.value=msg.text||'';else input.value='';return;}
 if(msg.kind==='commit'&&typeof msg.html==='string'&&msg.html.length<=8000000){
 const old=stripFrameBridge(frame.getAttribute('srcdoc')||'');interactiveUndo.push(old);if(interactiveUndo.length>15)interactiveUndo.shift();
 frame.setAttribute('srcdoc',frameHTML(msg.html));interactiveSelection=null;store(false);
 if(frame===selectedInteractiveFrame())document.querySelector('#asic-interactive-selected').textContent='Saved. Select another element to continue editing.';
 status('Imported HTML change applied and saved. Export ALL Lessons HTML to publish it.');return;}
 if(msg.kind==='notice'&&frame===selectedInteractiveFrame())status(String(msg.text).slice(0,220));
});
window.addEventListener('message',event=>{const message=event.data;if(!message||typeof message!=='object'||!Number.isFinite(message.asicInteractiveHeight))return;
 const frame=[...document.querySelectorAll('.asic-interactive-frame')].find(f=>f.contentWindow===event.source);if(!frame)return;
 const height=Math.max(500,Math.min(16000,Math.ceil(message.asicInteractiveHeight)));if(Math.abs((parseFloat(frame.style.height)||1000)-height)>2)frame.style.height=height+'px';
});
function safeImport(content){const parser=new DOMParser(),doc=parser.parseFromString(content,'text/html');const source=doc.querySelector('.de-lesson .de-content')||doc.querySelector('main article')||doc.querySelector('main')||doc.querySelector('article')||doc.body;const clone=source.cloneNode(true);if(!source.matches('.de-content')){const first=clone.querySelector(':scope > h1, :scope > header > h1');if(first)first.remove()}clone.querySelectorAll('script,style,link,meta,base,iframe,object,embed,form,nav,header,footer,input,button,textarea,select').forEach(n=>n.remove());clone.querySelectorAll('*').forEach(n=>{for(const attr of [...n.attributes]){const v=attr.value.trim();if(/^on/i.test(attr.name)||attr.name==='contenteditable'||attr.name==='id'||['href','src','xlink:href'].includes(attr.name)&&(/^(javascript|vbscript|data:text\/html):/i.test(v)||/^https?:/i.test(v)))n.removeAttribute(attr.name)}});if(!source.classList.contains('de-content')){const lead=clone.querySelector(':scope > h1');if(lead)lead.remove()}return {title:doc.querySelector('.de-lesson > h1, main h1, article h1, h1')?.textContent?.trim()||doc.title?.trim()||'New HTML Lesson',html:clone.innerHTML}}
function createLesson(title,inner){const id=makeId(title),section=defaultLessonHTML(id,title,inner);if(!addEmbeddedLesson(section,true))return status('Lesson could not be added.');document.body.dataset.asicCustomPlan='1';state.addedLessons[id]=section.outerHTML;store(false);status('HTML lesson added. Choose its desired position under Lesson plan, then export updated unit HTML.')}
async function importLessonFile(file){if(!file)return;if(!/\.html?$/i.test(file.name)&&file.type!=='text/html')return status('Please choose an HTML (.html or .htm) file.');if(file.size>4000000)return status('HTML file is larger than 4 MB. Use a separate linked HTML lesson for very large pages.');try{const html=await file.text();const preserve=document.querySelector('#asic-preserve-interactive')?.checked!==false;const imported=preserve?{title:sourceTitle(html,file),html:createInteractiveInner(html,file.name)}:safeImport(html);const name=document.querySelector('#asic-new-lesson-title')?.value.trim()||imported.title||file.name.replace(/\.html?$/i,'');createLesson(name,imported.html);if(preserve)status('Full interactive HTML imported in an isolated frame. SVG diagrams, CSS, controls, scripts and waveforms are preserved. Export to publish.');else status('Static editable lesson imported (interactive scripts and document styles excluded).');}catch(err){status('Could not import HTML: '+err.message)}}
function linkLesson(){const title=document.querySelector('#asic-new-lesson-title')?.value.trim()||prompt('Name of the separate HTML lesson:','New HTML Lesson');if(!title)return;const href=prompt('Exact HTML filename/path that will be uploaded next to this unit (example: extra-lesson.html):','');if(!href)return;const path=href.trim();if(!/^[a-zA-Z0-9_./-]+\.html?(?:#[a-zA-Z0-9_-]+)?$/i.test(path)||path.startsWith('/')||path.split('/').includes('..'))return status('Use a relative local .html or .htm filename/path, without ../ or a full URL.');const id=makeId(title),data={id,title:title.slice(0,180),href:path};addExternalLesson(data,true);document.body.dataset.asicCustomPlan='1';store(false);status('Separate HTML link added. Upload '+path+' beside your website files when publishing. Choose its position in the lesson plan.')}
function removeLinkedLesson(){const key=document.querySelector('#asic-plan-select')?.value;if(!key?.startsWith('ext:'))return status('Choose a linked HTML page (marked SEPARATE HTML) first.');const id=key.slice(4),data=state.externalLessons[id];if(!confirm('Remove link to “'+data.title+'” from this lesson plan? The external HTML file itself will not be deleted.'))return;planNav()?.querySelector('[data-asic-link-id="'+id+'"]').remove();delete state.externalLessons[id];state.lessonOrder=planItems().map(x=>x.key);applyPlanOrder(state.lessonOrder);document.body.dataset.asicCustomPlan='1';store(false);status('Separate HTML lesson link removed from the content list.')}
restorePlanDraft();
if(document.body.dataset.asicCustomPlan==='1'||Object.keys(state.addedLessons||{}).length||Object.keys(state.externalLessons||{}).length||state.lessonOrder?.some((k,i)=>k!==planItems()[i]?.key))document.body.dataset.asicCustomPlan='1';

function isEditableRoot(n){
 if(!n?.dataset?.asicNodeId||!n.closest('.de-lesson[id]')||n.closest(widgetSel))return false;
 for(let p=n.parentElement;p&&!p.matches('.de-lesson,.de-content');p=p.parentElement){
  if(p.matches('h1,h2,h3,h4,h5,h6,p,li,figcaption,th,td,blockquote,summary'))return false;
 }
 return true;
}
function allNodes(){return $$('[data-asic-node-id]').filter(isEditableRoot)}
function blockFor(n){if(!n)return null;const h=n.closest('.de-content');if(!h)return null;let b=n;while(b.parentElement&&b.parentElement!==h)b=b.parentElement;return b.parentElement===h?b:null}
function findBlock(id){return $$('[data-asic-block-id]').find(el=>el.dataset.asicBlockId===id)}
function getLesson(){return sections.find(s=>!s.hidden&&!s.dataset.asicDeletedLesson)||sections.find(s=>!s.dataset.asicDeletedLesson)}
function uniqueId(){return 'added-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}
function cleanTransient(root){stableEditorialRepair(root);root.querySelector('#asic-editor-window')?.remove();root.querySelector('#asic-edit-toggle')?.remove();root.querySelector('#asic-v100-css')?.remove();root.querySelectorAll('.asic-block-actions').forEach(x=>x.remove());root.querySelectorAll('[data-asic-block-id][draggable]').forEach(x=>x.removeAttribute('draggable'));root.querySelectorAll('[data-asic-node-id][contenteditable],[data-asic-lesson-title][contenteditable],.asic-added-block[contenteditable],.asic-added-block [contenteditable],.de-lesson figcaption[contenteditable],.de-lesson .de-caption[contenteditable],.de-lesson .asic-interactive-caption[contenteditable],.de-lesson .asic-figure-caption[contenteditable]').forEach(n=>{n.removeAttribute('contenteditable');n.removeAttribute('spellcheck')});root.querySelectorAll('.asic-block-actions [draggable]').forEach(n=>n.removeAttribute('draggable'));root.querySelectorAll('.asic-picked,.asic-drag-over').forEach(el=>el.classList.remove('asic-picked','asic-drag-over'));root.querySelectorAll('[data-asic-setup-done]').forEach(x=>x.removeAttribute('data-asic-setup-done'));root.querySelector('body')?.classList.remove('asic-edit-mode');}
function capture(){state.texts={};state.attrs={};for(const section of sections){const title=section.querySelector(':scope > h1');if(title)state.lessonNames[section.id]=title.textContent.trim()}for(const node of allNodes()){if(node.isConnected&&node.dataset.asicNodeId){state.texts[node.dataset.asicNodeId]=node.innerHTML;state.attrs[node.dataset.asicNodeId]={style:node.getAttribute('style')||''}}}
 for(const host of hosts){if(!host.isConnected)continue;state.order[host.dataset.asicHostId]=[...host.children].filter(c=>c.dataset.asicBlockId).map(x=>x.dataset.asicBlockId)}
 for(const b of $$('.asic-added-block[data-asic-block-id]')){const clone=b.cloneNode(true);clone.querySelectorAll('.asic-block-actions').forEach(x=>x.remove());clone.removeAttribute('contenteditable');clone.removeAttribute('spellcheck');clone.classList.remove('asic-picked');state.added[b.dataset.asicBlockId]=clone.outerHTML}
 for(const section of sections.filter(x=>x.dataset.asicImportedLesson==='1')){const cloned=section.cloneNode(true);cleanTransient(cloned);cloned.removeAttribute('data-asic-setup-done');cloned.hidden=true;state.addedLessons[section.id]=cloned.outerHTML}
 state.lessonOrder=planItems().map(x=>x.key);
 }
function rememberBlock(node){const b=node?.closest?.('[data-asic-block-id]');if(!b)return;const clone=b.cloneNode(true);clone.querySelectorAll('.asic-block-actions').forEach(x=>x.remove());clone.removeAttribute('contenteditable');clone.classList.remove('asic-picked');state.modifiedBlocks[b.dataset.asicBlockId]=clone.outerHTML}
function store(message){pendingSource=null;stableEditorialRepair();refreshEditableTextNodes();capture();try{localStorage.setItem(STORAGE,JSON.stringify(state));if(message)status('Draft saved on this device. Export the HTML to publish.');return true}catch{status('Local storage is full; export your HTML to avoid losing changes.');return false}}
function restoreDraft(){
 for(const [id,html] of Object.entries(state.added)){if(findBlock(id)||state.removedBlocks.includes(id))continue;const box=document.createElement('div');box.innerHTML=html;const el=box.firstElementChild;if(!el)continue;el.dataset.asicBlockId=id;el.dataset.asicNew='1';el.classList.add('asic-added-block');let hostId=Object.keys(state.order).find(k=>state.order[k].includes(id));let host=hosts.find(h=>h.dataset.asicHostId===hostId);if(host)host.append(el)}
 for(const [id,markup] of Object.entries(state.modifiedBlocks)){const original=findBlock(id);if(!original)continue;const box=document.createElement('div');box.innerHTML=markup;const newer=box.firstElementChild;if(newer){newer.dataset.asicBlockId=id;original.replaceWith(newer)}}
 for(const [id,html] of Object.entries(state.texts)){const t=allNodes().find(n=>n.dataset.asicNodeId===id);if(t&&t.innerHTML!==html)t.innerHTML=html; if(t&&state.attrs[id]?.style)t.setAttribute('style',state.attrs[id].style)}
 for(const id of state.removedNodes){const n=allNodes().find(n=>n.dataset.asicNodeId===id);if(n)n.remove()}
  for(const id of state.removedBlocks){const b=findBlock(id);if(b)b.remove()}
 for(const host of hosts){const seq=state.order[host.dataset.asicHostId];if(!seq)continue;for(const id of seq){const b=findBlock(id);if(b)host.append(b)}}
 for(const [id,name] of Object.entries(state.lessonNames)){const sec=sections.find(s=>s.id===id);if(sec&&name)applyLessonName(sec,name)}
 for(const id of state.deletedLessons){const sec=sections.find(s=>s.id===id);if(sec)markDeleted(sec,true)}
}
function applyLessonName(section,name){const next=String(name||'').replace(/\s+/g,' ').trim().slice(0,180);if(!next)return false;const heading=section.querySelector(':scope > h1');if(heading)heading.textContent=next;const button=$$('.de-nav-item').find(b=>b.dataset.target===section.id);if(button){const label=[...button.children].find(c=>c.tagName==='SPAN'&&!c.classList.contains('de-nav-index')&&!c.classList.contains('de-done-mark'));if(label)label.textContent=next;else button.setAttribute('aria-label',next)}const opt=$('#asic-lesson-select option[value="'+section.id+'"]');if(opt)opt.textContent=section.id+' · '+next+(section.dataset.asicDeletedLesson?' [DELETED]':'');return true}
function markDeleted(section,yes){if(yes)section.dataset.asicDeletedLesson='1';else section.removeAttribute('data-asic-deleted-lesson');const btn=$$('.de-nav-item').find(b=>b.dataset.target===section.id);if(btn){if(yes)btn.dataset.asicDeletedNav='1';else btn.removeAttribute('data-asic-deleted-nav')}updateLessonSelect()}
function updateCounts(){const count=sections.filter(s=>!s.dataset.asicDeletedLesson).length;const txt=$('#de-progress-text');if(txt){const old=txt.textContent||'';const m=old.match(/\d+/);txt.textContent=(m?Math.min(Number(m[0]),count):0)+' of '+count+' complete'}const fill=$('#de-progress-fill');if(fill){const m=(txt?.textContent||'').match(/^(\d+) of (\d+)/);if(m)fill.style.width=(Number(m[1])/(count||1)*100)+'%'}}
function status(txt){const t=$('#asic-office-status');if(t)t.textContent=txt}
function showBlockTools(target){
 document.querySelectorAll('.asic-block-actions').forEach(e=>e.remove());barBlock=null;
 if(!enabled||!target?.dataset.asicBlockId||!target.parentElement)return;
 const bar=document.createElement('div');bar.className='asic-block-actions';bar.contentEditable='false';bar.dataset.asicFor=target.dataset.asicBlockId;
 bar.innerHTML='<span class="asic-drag-handle" draggable="true" title="Drag the selected original or new block">⠿ Drag block</span><button type="button" data-move="up">↑ Up</button><button type="button" data-move="down">↓ Down</button><button type="button" data-move="delete">✕ Delete</button>';
 target.parentElement.insertBefore(bar,target);barBlock=target;
}
function captionElements(){return [...document.querySelectorAll('.de-lesson figcaption,.de-lesson .de-caption,.de-lesson .asic-figure-caption,.de-lesson .asic-interactive-caption')].filter(el=>!el.closest('#asic-editor-window')&&!el.closest('.asic-interactive-frame'))}
function setEdit(yes){if(enabled&&!yes)store(false);stableEditorialRepair();refreshEditableTextNodes();if(!yes&&interactiveVisualMode)setInteractiveVisual(false);enabled=yes;document.body.classList.toggle('asic-edit-mode',yes);windowPanel.hidden=!yes;toggle.textContent=yes?'✓ Editor Open':'✎ Edit Content';for(const el of allNodes()){if(el.closest('.asic-added-block'))continue;el.contentEditable=yes?'true':'false';el.spellcheck=yes}
 for(const section of sections){const title=section.querySelector(':scope > h1');if(title){title.contentEditable=yes?'true':'false';title.spellcheck=yes}}
 for(const block of $$('.asic-added-block')){if(!['FIGURE','TABLE'].includes(block.tagName))block.contentEditable=yes?'true':'false'}
 for(const caption of captionElements()){caption.contentEditable=yes?'true':'false';caption.spellcheck=yes}
 if(!yes)showBlockTools(null);else {if(current)showBlockTools(blockFor(current));status('Select any table, image, diagram, paragraph or section. Drag the block handle or Move Up/Down; rename a lesson using the lesson controls.')}}
if(!recoveryDraft){restoreDraft();stableEditorialRepair();refreshEditableTextNodes();}
// Upgrade interactive embeds authored using v37.1.04 so their existing lessons gain
// visual editing without forcing the author to import each HTML file again.
for(const frame of document.querySelectorAll('.asic-interactive-frame')){
 const source=frame.getAttribute('srcdoc');
 if(source&&!source.includes('asicInteractiveCommand'))frame.setAttribute('srcdoc',frameHTML(source));
}
document.querySelectorAll('.asic-block-actions').forEach(e=>e.remove());
const toggle=document.createElement('button');toggle.id='asic-edit-toggle';toggle.type='button';toggle.textContent='✎ Edit Content';(document.querySelector('.de-head-links')||document.querySelector('.de-topbar')||document.body).append(toggle);
const windowPanel=document.createElement('aside');windowPanel.id='asic-editor-window';windowPanel.className='asic-editor-window';windowPanel.hidden=true;windowPanel.setAttribute('aria-label','ASIC-Skill visual editor');windowPanel.innerHTML=`<div class="ae-header" id="asic-panel-handle"><strong>ASIC-Skill · Office-style Editor</strong><button type="button" data-a="close" aria-label="Close content editor">✕</button></div><div class="ae-body">
<div class="ae-help">Rename lesson titles, edit visible text and table cells. Select ANY existing or new block, then use its drag handle or Move Up/Down/Delete. Changes publish only when the updated HTML is uploaded to GitHub.</div>
<div class="ae-section">Text formatting</div>
<div class="ae-row"><select id="asic-font" title="Font family"><option value="Carlito">Carlito</option><option value="Calibri">Calibri</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option><option value="Cambria">Cambria</option><option value="monospace">Monospace</option></select><button type="button" data-a="fontSmaller" title="Decrease font size by 1 point" aria-label="Decrease font size">A−</button><input id="asic-size" type="number" min="7" max="96" step="0.5" value="12" title="Font size in points; type a size and press Enter" aria-label="Font size in points"><label>pt</label><button type="button" data-a="fontLarger" title="Increase font size by 1 point" aria-label="Increase font size">A+</button><button data-f="undo" title="Undo">↶</button><button data-f="redo" title="Redo">↷</button></div>
<div class="ae-row"><button data-f="bold" title="Bold"><b>B</b></button><button data-f="italic" title="Italic"><i>I</i></button><button data-f="underline" title="Underline"><u>U</u></button><button data-f="strikeThrough" title="Strikethrough"><s>S</s></button><button data-f="subscript" title="Subscript">x₂</button><button data-f="superscript" title="Superscript">x²</button><label title="Text color">A <input type="color" id="asic-text-color" value="#17415b"></label><label title="Highlight color">▧ <input type="color" id="asic-highlight" value="#fff0a0"></label></div>
<div class="ae-row"><button data-f="justifyLeft" title="Align left">☰◀</button><button data-f="justifyCenter" title="Align center">☰</button><button data-f="justifyRight" title="Align right">☰▶</button><button data-f="justifyFull" title="Justify">▤</button><button data-f="insertUnorderedList" title="Bulleted list">• List</button><button data-f="insertOrderedList" title="Numbered list">1. List</button><button data-f="indent">Indent →</button><button data-f="outdent">← Outdent</button><button data-f="removeFormat" title="Clear selected styling">Clear</button></div>
<div class="ae-section">Insert and arrange content</div>
<div class="ae-row"><button data-a="heading">+ Heading</button><button data-a="paragraph">+ Paragraph</button><button data-a="note">+ Note</button><button data-a="list">+ List</button><button data-a="table">+ Table</button><button data-a="image">+ Image</button></div>
<div class="ae-row"><button data-a="up">↑ Move</button><button data-a="down">↓ Move</button><button data-a="imageName">Rename Image / Figure Caption</button><button data-a="replaceImage">Replace Image</button><button data-a="editMarkup">Edit Selected HTML</button></div>
<div class="ae-row"><button data-a="addRow">+ Row</button><button data-a="delRow">− Row</button><button data-a="addColumn">+ Column</button><button data-a="delColumn">− Column</button><button data-a="removeBullet" title="Convert the chosen bullet or numbered item into ordinary text without deleting its contents">Remove Bullet / Number</button><button data-a="deleteListItem" class="ae-danger" title="Delete a complete bullet or numbered item, including the marker">Delete List Item</button><button data-a="deleteElement" class="ae-danger">Delete Selected Element</button><button data-a="deleteBlock" class="ae-danger">Delete Content Block</button></div>
<div class="ae-section">Table width and columns</div>
<div class="ae-help">Click a table cell first. Set table width, then resize the selected column. Values are retained in exported HTML. On narrow screens, wide tables can scroll horizontally.</div>
<div class="ae-row ae-table-tools"><label>Table width <input id="asic-table-width" type="number" min="30" max="250" step="5" value="100"> %</label><button data-a="applyTableWidth">Set table width</button><button data-a="autoTableWidth">Auto fit</button></div>
<div class="ae-row ae-table-tools"><label>Selected column <input id="asic-column-width" type="number" min="5" max="95" step="1" value="34"> %</label><button data-a="applyColumnWidth">Set column width</button><button data-a="equalColumns">Equal columns</button></div>
<div class="ae-section">Lesson pages</div><select id="asic-lesson-select" aria-label="Select lesson page to edit or delete"></select>
<div class="ae-row"><button data-a="goLesson">Open Lesson</button><button data-a="renameLesson">✎ Rename Lesson Page</button><button data-a="deleteLesson" class="ae-danger">Delete Lesson Page</button><button data-a="restoreLesson">Restore Lesson</button><button data-a="undoDelete">Undo Last Delete</button></div>
<div class="ae-section">Add HTML lesson / Manage lesson plan</div>
<div class="ae-help">Import an HTML file as a lesson in this unit, create a blank lesson, or link an independent .html page already present in your website folder. Preserve full interactive HTML to keep SVG diagrams, waveforms, controls, embedded CSS and JavaScript. The page runs safely in a sandboxed viewer and is included in the exported unit HTML. Or uncheck to convert it into editable static content (interactive features will be lost). External links need publishing separately.</div>
<div class="ae-row"><label style="width:100%">Lesson title (optional for imports) <input id="asic-new-lesson-title" type="text" placeholder="Read heading from HTML file" style="width:100%;cursor:text"></label></div>
<div class="ae-row"><label style="font-size:12px"><input id="asic-preserve-interactive" type="checkbox" checked> Preserve complete interactive page (recommended)</label></div><div class="ae-row"><button data-a="importLesson" class="ae-primary">⬆ Add HTML File as Lesson</button><button data-a="blankLesson">+ Blank Lesson</button><button data-a="linkLesson">↗ Link Separate HTML Page</button><input type="file" id="asic-import-lesson" accept=".html,.htm,text/html" hidden></div>
<div class="ae-row"><button data-a="visualInteractiveOn" class="ae-primary">✎ Edit Interactive Visually</button><button data-a="visualInteractiveOff">▶ Preview Interactive Page</button><button data-a="editInteractiveHTML">&lt;/&gt; Edit Full Interactive HTML Source</button></div>
<div id="asic-interactive-visual-tools" hidden><p class="ae-help">Click header, footer, figure captions, images, SVG diagrams, text, notes, or controls in the embedded lesson to select them. Double-click normal text to edit it directly. Switch to Preview before testing interactive buttons. Complex code, SVG paths, and JavaScript can still be edited using Full Interactive HTML Source.</p><div id="asic-interactive-selected" class="ae-banner" aria-live="polite">Click an element inside the imported lesson.</div>
<textarea id="asic-interactive-text" class="ae-sourcetext" spellcheck="false" aria-label="Selected interactive element text" placeholder="Select an element in the imported page first."></textarea>
<div class="ae-row"><button class="ae-primary" data-a="interactiveApplyText">Apply Selected Text</button><button data-a="interactiveCaption" title="Rename image, diagram, or caption while preserving its image/SVG">Rename Image / Diagram Caption</button><button data-a="interactiveLoadHTML" title="Load the selected item’s existing HTML into the editor field">Load Selected HTML</button><button data-a="interactiveApplyHTML" title="Use the editor field as HTML markup">Apply as HTML</button><button class="ae-danger" data-a="interactiveDelete">Delete Selected</button><button data-a="interactiveUndo">↶ Undo</button></div>
<div class="ae-row"><button data-a="interactiveUp">↑ Move</button><button data-a="interactiveDown">↓ Move</button><button data-a="interactiveInsertHeading">+ Heading</button><button data-a="interactiveInsertParagraph">+ Paragraph</button><button data-a="interactiveInsertNote">+ Note</button></div></div>
<div id="asic-interactive-source-wrap" class="ae-interactive-editor" hidden><p class="ae-help">Edit the imported page's COMPLETE source (HTML/CSS/JavaScript). Changes inside the interactive frame are separate from ordinary paragraph editing. The imported page is kept inside a script sandbox.</p><textarea id="asic-interactive-source" spellcheck="false" aria-label="Complete imported HTML source"></textarea><div class="ae-row"><button data-a="applyInteractiveHTML" class="ae-primary">Apply Interactive HTML</button><button data-a="cancelInteractiveHTML">Cancel</button></div></div>
<div class="ae-help">Select a lesson or linked page, then move it to an exact position. The sidebar and Next/Previous lesson order will follow this arrangement.</div>
<select id="asic-plan-select" aria-label="Select lesson in lesson plan"></select>
<div class="ae-row"><button data-a="planUp">↑ Earlier</button><button data-a="planDown">↓ Later</button><label>Position <input type="number" id="asic-plan-position" min="1" max="99" step="1" value="1" aria-label="Lesson plan position"></label><button data-a="planMove" class="ae-primary">Move to Position</button></div>
<div class="ae-row"><button data-a="planOpen">Open Selected Lesson</button><button data-a="planRemove" class="ae-danger">Remove Linked HTML Page</button></div>
<div class="ae-section">Save and publish</div><div class="ae-row"><button data-a="cleanBlankParagraphs">Clean Empty Paragraphs</button><button data-a="save">Save Draft</button><button data-a="backupDraft" title="Download a copy of the browser-saved draft as JSON">⬇ Backup Draft</button><button data-a="preview">Preview</button><button data-a="source">Edit Full Page HTML</button></div>
<div class="ae-row"><button data-a="export" class="ae-primary">⬇ Export ALL Lessons HTML</button><button data-a="reset" class="ae-danger">Discard Local Draft</button><button data-a="restoreSaved">Restore Prior Draft</button></div>
<div id="asic-source-wrap" hidden><p class="ae-help">Advanced: edit the full exported HTML, including CSS, SVG and scripts. Applying full source changes affects the next download, not the live preview. Test before publishing.</p><textarea id="asic-source-editor" class="ae-sourcetext" spellcheck="false"></textarea><div class="ae-row"><button data-a="applySource">Use Edited HTML for Export</button><button data-a="cancelSource">Cancel</button></div></div>
<div class="ae-help">The panel is draggable by its title and resizable at its bottom-right corner. GitHub Pages cannot save to your repository: upload the exported HTML. <a href="content-editor.html">All 19 units</a></div><div class="ae-banner" id="asic-office-status" role="status" aria-live="polite"></div>
<input id="asic-upload-image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
</div>`;document.body.append(windowPanel);
function updateLessonSelect(){const selector=$('#asic-lesson-select');if(!selector)return;const last=selector.value;selector.replaceChildren(...sections.map((s,i)=>{const opt=document.createElement('option');opt.value=s.id;opt.textContent=String(i).padStart(2,'0')+' · '+lessonName(s)+(s.dataset.asicDeletedLesson?' [DELETED]':'');return opt}));if(last&&sections.some(s=>s.id===last))selector.value=last;else {const cur=sections.find(s=>!s.hidden&&!s.dataset.asicDeletedLesson);if(cur)selector.value=cur.id}updatePlanSelect()};
updateLessonSelect();updatePlanSelect();updateCounts();if(recoveryDraft)setTimeout(()=>status(recoveryReason+' Use Restore Prior Draft if you need it.'),0);
toggle.addEventListener('click',()=>setEdit(!enabled));
// Avoid losing an existing text selection when a toolbar button is clicked.
windowPanel.addEventListener('mousedown',e=>{if(e.target.closest('button[data-f],button[data-a=fontSmaller],button[data-a=fontLarger]'))e.preventDefault()});
document.addEventListener('selectionchange',()=>{const s=window.getSelection();if(!s||!s.rangeCount)return;const node=s.anchorNode?.nodeType===1?s.anchorNode:s.anchorNode?.parentElement;if(node?.closest?.('#asic-editor-window'))return;if(node?.closest?.('.de-lesson')){selectedText=node;try{savedRange=s.getRangeAt(0).cloneRange()}catch{}}});
function selectTarget(e){if(!enabled||e.target.closest?.('#asic-editor-window,.asic-block-actions'))return;let el=e.target.closest?.('figcaption,.de-caption,.asic-figure-caption,.asic-interactive-caption,[data-asic-node-id],[data-asic-lesson-title],[data-asic-block-id],.de-content figure,.de-content img,.de-content table');if(!el||!el.closest('.de-lesson'))return;if(el.hasAttribute('data-asic-node-id')&&!isEditableRoot(el)){let parent=el.parentElement;while(parent&&!isEditableRoot(parent))parent=parent.parentElement;if(parent)el=parent;}if(current!==el){const r=savedRange;if(!r||!el.contains(r.commonAncestorContainer))savedRange=null;}current=el;selectedText=el;syncFontSizeFor(el);$$('.asic-picked').forEach(e=>e.classList.remove('asic-picked'));const block=blockFor(el);if(block)block.classList.add('asic-picked');showBlockTools(block);const lesson=el.closest('.de-lesson[id]');if(lesson)$('#asic-lesson-select').value=lesson.id}
document.addEventListener('click',selectTarget,true);
document.addEventListener('click',e=>{if(!enabled)return;if(!e.target.closest?.('.de-nav-item,[data-action="next"],[data-action="previous"],.de-prev,.de-next'))return;setTimeout(()=>{const opened=getLesson();if(opened){current=null;selectedText=null;savedRange=null;showBlockTools(null);$('#asic-lesson-select').value=opened.id;status('Editing '+lessonName(opened)+'. Changes to this lesson will be included when exporting the entire unit.')}},0)},false);

function newBlock(kind){const selectedHost=current?.closest('.de-content');const h=(selectedHost&&!selectedHost.closest('.de-lesson[id]')?.hidden?selectedHost:getLesson()?.querySelector('.de-content'));if(!h){status('Open a lesson first.');return null}let target=blockFor(current);if(target&&!target.parentElement?.isSameNode(h))target=null;let n;
 if(kind==='heading'){n=document.createElement('h2');n.textContent='New heading'}
 if(kind==='paragraph'){n=document.createElement('p');n.textContent='Type your explanation here.'}
 if(kind==='note'){n=document.createElement('div');n.className='de-note';n.innerHTML='<p><strong>Important:</strong> Type your note here.</p>'}
 if(kind==='list'){n=document.createElement('ul');n.innerHTML='<li>First point</li><li>Second point</li>'}
 if(kind==='table'){n=document.createElement('table');n.innerHTML='<thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value A</td><td>Value B</td></tr></tbody>'}
 if(!n)return null;n.classList.add('asic-added-block');n.dataset.asicNew='1';n.dataset.asicBlockId=uniqueId();h.insertBefore(n,target?target.nextSibling:null);[...n.querySelectorAll(textSel)].forEach((t,i)=>{t.dataset.asicNodeId=n.dataset.asicBlockId+'-text'+i});if(!['TABLE','FIGURE'].includes(n.tagName))n.contentEditable='true';current=n;showBlockTools(n);store(false);n.scrollIntoView({block:'nearest'});status('Content inserted. Drag its handle or use Move Up/Down.');return n}
function moveBlock(which){const b=blockFor(current);if(!b)return status('Select a table, image, diagram or content block first.');const h=b.parentElement;const blocks=[...h.children].filter(e=>e.dataset.asicBlockId);const ix=blocks.indexOf(b);if(which==='up'&&ix>0)h.insertBefore(b,blocks[ix-1]);else if(which==='down'&&ix>=0&&ix<blocks.length-1)h.insertBefore(blocks[ix+1],b);else return status('The selected block is already at this edge.');showBlockTools(b);store(false);status('Original or added content moved. Export HTML to publish its position.')}
function deleteBlock(){const b=blockFor(current);if(!b)return status('Select a content block first.');if(!confirm('Delete this content block? You can undo before exporting.'))return;lastDelete={type:'block',elem:b,next:b.nextSibling,parent:b.parentElement,id:b.dataset.asicBlockId};if(b.dataset.asicBlockId&&!state.removedBlocks.includes(b.dataset.asicBlockId))state.removedBlocks.push(b.dataset.asicBlockId);b.remove();current=null;showBlockTools(null);store(false);status('Content block removed. Click Undo Last Delete to restore before exporting.')}
 // A list marker belongs to LI/UL/OL; it is not an editable text character.
 // Never delete only an inner P and leave a ghost bullet behind. Work at the
 // list-item level while preserving nested paragraphs, headings and sublists.
 function selectedListItem(){
  const candidates=[current,selectedText].filter(Boolean);
  for(const candidate of candidates){
   const item=candidate.closest?.('li');
   if(item?.parentElement?.matches('ul,ol')&&item.closest('.de-lesson .de-content')&&!item.closest(widgetSel))return item;
  }
  return null;
 }
 function snapshotListBlock(block){
  return {type:'listStructure',id:block.dataset.asicBlockId,before:block.cloneNode(true),parent:block.parentElement};
 }
 function finalizeListChange(block,message){
  // The whole enclosing content block must be saved. Saving text alone cannot
  // persist changes from <li> to <p> through localStorage and export/reopen.
  const updated=findBlock(block.dataset.asicBlockId)||block;
  if(updated?.isConnected)rememberBlock(updated);
  current=updated;selectedText=null;savedRange=null;
  setEdit(true);store(false);status(message+' Use Undo Last Delete if necessary, then export HTML.');
 }
 function removeSelectedBullet(){
  const li=selectedListItem();if(!li)return status('Click inside a bulleted or numbered list item first.');
  let list=li.parentElement;const original=blockFor(li);
  if(!original?.dataset.asicBlockId)return status('This list is not in an editable content block.');
  lastDelete=snapshotListBlock(original);
  // If UL/OL is the editable block itself, keep its block identifier on a
  // wrapper so the editor can restore/reorder/save the new paragraph structure.
  if(list===original){
   const holder=document.createElement('div');holder.className='asic-normalized-block';
   for(const name of ['data-asic-block-id','data-asic-new'])if(list.hasAttribute(name))holder.setAttribute(name,list.getAttribute(name));
   if(list.classList.contains('asic-added-block'))holder.classList.add('asic-added-block');
   list.removeAttribute('data-asic-block-id');list.removeAttribute('data-asic-new');list.classList.remove('asic-added-block');
   list.replaceWith(holder);holder.append(list);
  }
  // Retain existing list items before and after this one (including numbering).
  const later=[];for(let n=li.nextElementSibling;n;n=n.nextElementSibling)later.push(n);
  let tail=null;
  if(later.length){
   tail=list.cloneNode(false);tail.classList.remove('asic-picked','asic-drag-over');tail.removeAttribute('id');tail.removeAttribute('data-asic-node-id');tail.removeAttribute('data-asic-block-id');
   if(list.tagName==='OL')tail.start=(Number(list.getAttribute('start'))||1)+[...list.children].indexOf(li)+1;
   for(const node of later)tail.append(node);
   list.parentNode.insertBefore(tail,list.nextSibling);
  }
  const hasBlocks=[...li.children].some(el=>el.matches('p,div,ul,ol,h1,h2,h3,h4,h5,h6,section,article,table,figure,blockquote'));
  const itemText=document.createElement(hasBlocks?'div':'p');
  if(hasBlocks)itemText.className='asic-unlisted-content';
  // An inline-only LI becomes an editable paragraph with its existing ID.
  // Compound LI retains IDs on its child paragraphs; do not assign an ID
  // to their wrapping DIV, as it would reintroduce nested editing roots.
  if(!hasBlocks){for(const a of li.attributes){if(!['contenteditable','spellcheck','value'].includes(a.name))itemText.setAttribute(a.name,a.value)}}
  while(li.firstChild)itemText.append(li.firstChild);
  list.parentNode.insertBefore(itemText,tail||list.nextSibling);
  li.remove();list.classList.remove('asic-picked','asic-drag-over');if(!list.children.length)list.remove();
  finalizeListChange(original,'List marker removed; original text and nested content preserved.');
 }
 function deleteSelectedListItem(){
  const li=selectedListItem();if(!li)return status('Click the list item (or its text) before deleting its bullet and contents.');
  const list=li.parentElement,block=blockFor(li);
  if(!block)return status('Select a list item inside a lesson first.');
  if(list===block&&list.children.length===1){current=block;return deleteBlock();}
  if(!confirm('Delete this entire list item, including its bullet/number and its text? You can undo.'))return;
  lastDelete=snapshotListBlock(block);
  li.remove();if(!list.children.length)list.remove();
  finalizeListChange(block,'List item and its marker deleted.');
 }
// Delete only the selected text element, not the entire parent section/diagram.
// Works for kickers and nested headings/paragraphs as well as normal content.
function deleteElement(){
 let node=current?.closest?.('[data-asic-node-id]')||selectedText?.closest?.('[data-asic-node-id]');while(node&&!isEditableRoot(node))node=node.parentElement?.closest?.('[data-asic-node-id]')||null;
 if(!node||!node.isConnected)return status('Click the heading, subtitle, paragraph or text element to delete first.');
 if(node.closest('#asic-editor-window')||node.closest(widgetSel))return status('This interactive element is protected. Select its full content block instead.');
 if(node.matches('[data-asic-lesson-title]'))return status('Use Rename Lesson Page to change the main lesson title.');
 const block=blockFor(node);
 if(node===block)return deleteBlock();
 if(!confirm('Delete only the selected text element? You can undo before exporting.'))return;
 const id=node.dataset.asicNodeId;
 lastDelete={type:'element',elem:node,next:node.nextSibling,parent:node.parentElement,id};
 if(id&&!state.removedNodes.includes(id))state.removedNodes.push(id);
 node.remove();current=null;selectedText=null;showBlockTools(null);
 store(false);status('Selected heading or text element removed. Use Undo Last Delete to restore.');
}
function selectedSection(){const id=$('#asic-lesson-select')?.value;return sections.find(s=>s.id===id)||getLesson()}
function renameLesson(){const sec=selectedSection();if(!sec)return status('Select a lesson first.');const next=prompt('Lesson page name (updates heading and sidebar label):',lessonName(sec));if(next===null)return;if(!next.trim())return status('Lesson title cannot be blank.');applyLessonName(sec,next);state.lessonNames[sec.id]=next.trim();updateLessonSelect();$('#asic-lesson-select').value=sec.id;store(false);updatePlanSelect();status('Lesson renamed. Heading, sidebar and dropdown now match. Export HTML to publish.')}
function deleteLesson(){const s=selectedSection();if(!s||s.dataset.asicDeletedLesson)return status('Select an active lesson page.');const left=sections.filter(x=>!x.dataset.asicDeletedLesson);if(left.length<=1)return status('Cannot remove the final lesson page of a unit.');const sub=s.querySelectorAll('.de-sublesson').length;const msg=`Delete lesson page “${lessonName(s)}”?`+(sub?`\nThis page also contains ${sub} grouped related topic(s).`:'')+'\n\nThe page and its sidebar entry will be excluded from exported HTML. You can restore it before export.';if(!confirm(msg))return;lastDelete={type:'lesson',id:s.id};if(!state.deletedLessons.includes(s.id))state.deletedLessons.push(s.id);markDeleted(s,true);const alt=sections.find(x=>!x.dataset.asicDeletedLesson);const nav=$$('.de-nav-item').find(x=>x.dataset.target===alt.id);nav?.click();updateCounts();store(false);status('Lesson page deleted from this draft. It will be removed from navigation and HTML on export.')}
function restoreLesson(){const s=selectedSection();if(!s||!s.dataset.asicDeletedLesson)return status('This lesson is not deleted.');state.deletedLessons=state.deletedLessons.filter(x=>x!==s.id);markDeleted(s,false);updateCounts();store(false);status('Lesson restored. Its content is available again.');}
function undoDelete(){if(!lastDelete)return status('Nothing recently deleted to undo. Use Restore Lesson for previously removed pages.');if(lastDelete.type==='lesson'){const s=sections.find(x=>x.id===lastDelete.id);if(s){$('#asic-lesson-select').value=s.id;restoreLesson()}}else if(lastDelete.type==='element'){const {parent,elem,next,id}=lastDelete;if(parent.isConnected){parent.insertBefore(elem,next?.parentElement===parent?next:null);state.removedNodes=state.removedNodes.filter(x=>x!==id);current=elem;setEdit(true);store(false);status('Selected element restored.')}}else if(lastDelete.type==='listStructure'){const {id,before,parent}=lastDelete;const latest=findBlock(id);if(latest?.isConnected){latest.replaceWith(before);rememberBlock(before);current=before;selectedText=null;savedRange=null;setEdit(true);store(false);status('Original list and bullet markers restored.')}}else if(lastDelete.type==='block'){const {parent,elem,next,id}=lastDelete;if(parent.isConnected){parent.insertBefore(elem,next?.parentElement===parent?next:null);state.removedBlocks=state.removedBlocks.filter(x=>x!==id);current=elem;showBlockTools(elem);store(false);status('Deleted content restored.')}}lastDelete=null}
function format(cmd,value){const target=(selectedText?.closest?.('[data-asic-node-id],.asic-added-block')||current);if(!target||!target.closest('.de-lesson'))return status('Select text in a lesson first.');if(savedRange){const s=window.getSelection();s.removeAllRanges();try{s.addRange(savedRange)}catch{}}target.focus();document.execCommand('styleWithCSS',false,true);try{document.execCommand(cmd,false,value||null)}catch{}
 const node=target.closest('[data-asic-node-id]')||target;if(node.dataset.asicNodeId)state.texts[node.dataset.asicNodeId]=node.innerHTML;store(false);status('Formatting applied. Export HTML when ready.')}
// Font size editing uses a stable saved selection; toolbar focus must not change which lesson text is targeted.
function getSizeTarget(){
 const pick=current?.closest?.('[data-asic-node-id],[data-asic-lesson-title],.asic-added-block')||current;
 const text=selectedText?.closest?.('[data-asic-node-id],[data-asic-lesson-title],.asic-added-block');
 if(text?.isConnected&&pick?.contains?.(text))return text;
 if(pick?.isConnected&&pick.closest?.('.de-lesson[id]'))return pick;
 if(text?.isConnected&&text.closest?.('.de-lesson[id]'))return text;
 return null;
}
function nearestPt(node){if(!node)return 12;const size=parseFloat(getComputedStyle(node).fontSize);return Number.isFinite(size)?Math.max(7,Math.min(96,Math.round(size*.75*2)/2)):12}
function syncFontSizeFor(node){const target=node?.closest?.('[data-asic-node-id],[data-asic-lesson-title],.asic-added-block')||node;
 if(target?.closest?.('.de-lesson[id]'))$('#asic-size').value=nearestPt(target);
}
function applyFontSize(size){
 const entry=size==null?Number($('#asic-size').value):Number(size);
 if(!Number.isFinite(entry)||entry<7||entry>96){return status('Choose a font size from 7 to 96 pt.')}
 const points=Math.round(entry*2)/2;$('#asic-size').value=String(points);
 let target=getSizeTarget();if(!target||!target.closest('.de-lesson[id]'))return status('Click lesson text or a table cell before changing font size.');
 // Apply selected characters precisely when the Range belongs entirely to this editable element.
 let range=savedRange?.cloneRange?.();
 const inTarget=!!(range&&range.startContainer?.isConnected&&range.endContainer?.isConnected&&target.contains(range.startContainer)&&target.contains(range.endContainer));
 if(inTarget&&!range.collapsed){
  const existing=selectedText?.closest?.('[data-asic-font-size]');
  const reuse=existing&&target.contains(existing)&&range.toString()===existing.textContent;
  if(reuse){ // Repeated A+/A− edits reuse the same span instead of nesting dozens of new spans.
   existing.style.setProperty('font-size',points+'pt','important');existing.dataset.asicFontSize=String(points);
  }else{
   const mark=document.createElement('span');mark.style.setProperty('font-size',points+'pt','important');mark.dataset.asicFontSize=String(points);
   try{const fragment=range.extractContents();mark.append(fragment);range.insertNode(mark);
    const sel=window.getSelection();const selected=document.createRange();selected.selectNodeContents(mark);sel.removeAllRanges();sel.addRange(selected);savedRange=selected.cloneRange();selectedText=mark;
   }catch(e){target.style.setProperty('font-size',points+'pt','important');savedRange=null}
  }
 }else{
  // No highlighted characters: resize the WHOLE current heading/paragraph/list item/table cell.
  target.style.setProperty('font-size',points+'pt','important');savedRange=null;
 }
 current=target;
 const node=target.closest('[data-asic-node-id]');if(node)state.texts[node.dataset.asicNodeId]=node.innerHTML;
 store(false);status('Font size set to '+points+' pt. Export Updated HTML to keep the change.');
}
function adjustFontSize(delta){const target=getSizeTarget();if(!target)return status('Select or click lesson text before using A+ or A−.');
 const currentSize=selectedText?.dataset?.asicFontSize&&target.contains(selectedText)?Number(selectedText.dataset.asicFontSize):nearestPt(target);applyFontSize(Math.max(7,Math.min(96,currentSize+delta)));
}
function renameImage(){
 const selected=current||selectedText;const figure=selected?.closest?.('figure')||(selected?.matches?.('figure')?selected:null);
 const image=selected?.matches?.('img')?selected:figure?.querySelector('img');
 const caption=selected?.matches?.('figcaption,.de-caption,.asic-interactive-caption,.asic-figure-caption')?selected:figure?.querySelector('figcaption,.de-caption');
 const svg=selected?.matches?.('svg')?selected:figure?.querySelector('svg');
 if(!image&&!svg&&!caption)return status('Click the image, SVG diagram, or its caption first.');
 const old=caption?.textContent?.trim()||image?.alt||svg?.getAttribute('aria-label')||'Figure caption';
 const value=prompt('Image / diagram caption:',old);if(value===null)return;const next=value.trim().slice(0,500);
 if(image)image.alt=next;
 if(svg)svg.setAttribute('aria-label',next);
 if(caption)caption.textContent=next;
 else{const text=document.createElement(figure?'figcaption':'p');if(!figure)text.className='de-caption asic-figure-caption';text.textContent=next;(figure||image||svg).insertAdjacentElement(figure?'beforeend':'afterend',text);text.contentEditable=enabled?'true':'false';}
 rememberBlock(figure||caption||image||svg);const field=caption||figure?.querySelector('figcaption');if(field?.dataset.asicNodeId)state.texts[field.dataset.asicNodeId]=field.innerHTML;
 store(false);status('Figure caption updated. Save/export the unit HTML to publish it.');} 

function selectedTable(){const cell=current?.closest?.('td,th')||selectedText?.closest?.('td,th');const table=cell?.closest('table')||current?.closest?.('table')||current?.querySelector?.('table');return {table,cell:cell?.closest('table')===table?cell:null}}
function columnAt(table,cell){if(!table)return -1;if(!cell)return 0;let idx=0;for(const c of [...cell.parentElement.children]){if(c===cell)break;idx+=Number(c.getAttribute('colspan')||1)}return idx}
function colCount(table){return Math.max(...[...table.querySelectorAll('tr')].map(tr=>[...tr.children].reduce((s,c)=>s+Number(c.getAttribute('colspan')||1),0)),0)}
function colGroup(table){const n=colCount(table);if(!n)return null;let colg=table.querySelector(':scope > colgroup');if(!colg){colg=document.createElement('colgroup');table.insertBefore(colg,table.firstChild)}while(colg.children.length<n)colg.append(document.createElement('col'));while(colg.children.length>n)colg.lastElementChild.remove();return colg}
function setColumnPercent(table,column,pct){const group=colGroup(table);if(!group)return;const count=group.children.length;const ix=Math.max(0,Math.min(column,count-1));if(count===1){group.children[0].style.width='100%';return}const v=Math.max(5,Math.min(95,Number(pct)||34));const widths=[...group.children].map(c=>parseFloat(c.style.width)||100/count);const remaining=widths.reduce((a,b,i)=>a+(i!==ix?b:0),0)||1;
[...group.children].forEach((c,i)=>{c.style.width=(i===ix?v:(100-v)*widths[i]/remaining).toFixed(3)+'%'})}
function tableSizing(action){const {table,cell}=selectedTable();if(!table)return status('Click a cell inside a table first.');const count=colCount(table);if(action==='applyTableWidth'){const v=Math.max(30,Math.min(250,Number($('#asic-table-width').value)||100));table.style.setProperty('width',v+'%','important');table.style.maxWidth='none';table.dataset.asicWidthEdited='1';table.style.tableLayout='fixed';table.style.boxSizing='border-box';if(v>100){table.parentElement.style.overflowX='auto';table.parentElement.style.maxWidth='100%';}}
if(action==='autoTableWidth'){table.style.removeProperty('width');table.style.removeProperty('max-width');table.style.removeProperty('table-layout');table.removeAttribute('data-asic-width-edited');table.querySelector(':scope > colgroup')?.remove()}
if(action==='applyColumnWidth'){setColumnPercent(table,columnAt(table,cell),$('#asic-column-width').value);table.style.tableLayout='fixed';table.dataset.asicWidthEdited='1'}
if(action==='equalColumns'){const group=colGroup(table);if(group)[...group.children].forEach(c=>c.style.width=(100/count).toFixed(3)+'%');table.style.tableLayout='fixed';table.dataset.asicWidthEdited='1'}
// Preserve the table node and its column order; never rebuild or transpose its cells.
rememberBlock(table);store(false);status('Table sizing applied. It will be included in the exported HTML.');}

function tableAction(a){const cell=current?.closest('td,th')||selectedText?.closest?.('td,th');const row=cell?.closest('tr'),table=cell?.closest('table');if(!table)return status('Select a table cell first.');const cells=[...row.children].filter(x=>/^(TH|TD)$/.test(x.tagName));const ix=cells.indexOf(cell);
 if(a==='addRow'){const clone=row.cloneNode(true);[...clone.children].forEach(c=>{c.textContent='New value';c.removeAttribute('data-asic-node-id')});row.insertAdjacentElement('afterend',clone)}
 if(a==='delRow'){if(table.querySelectorAll('tr').length<=1)return status('A table needs at least one row.');row.remove()}
 if(a==='addColumn'){table.querySelectorAll('tr').forEach(tr=>{const source=tr.children[Math.min(ix,tr.children.length-1)]||tr.lastElementChild;const n=source?.cloneNode(false)||document.createElement('td');n.textContent='New column';n.removeAttribute('data-asic-node-id');if(source)source.insertAdjacentElement('afterend',n);else tr.append(n)})}
 if(a==='delColumn'){if(cells.length<=1)return status('A table needs at least one column.');table.querySelectorAll('tr').forEach(tr=>tr.children[ix]?.remove())}
 [...table.querySelectorAll('td,th')].forEach((c,i)=>{if(!c.dataset.asicNodeId)c.dataset.asicNodeId=table.closest('.de-lesson')?.id+'-cell-'+uniqueId()});rememberBlock(table);setEdit(true);store(false);status('Table updated without changing the other columns.');}
function htmlEditor(){const target=blockFor(current);if(!target)return status('Select a block to edit its HTML.');const markup=prompt('Edit this block HTML (advanced).',target.outerHTML);if(markup===null)return;const box=document.createElement('div');box.innerHTML=markup;const next=box.firstElementChild;if(!next)return status('Invalid HTML block.');if(['SCRIPT','STYLE','IFRAME'].includes(next.tagName))return status('For scripts and CSS, use Edit Full Page HTML.');next.dataset.asicBlockId=target.dataset.asicBlockId;rememberBlock(next);target.replaceWith(next);current=next;setEdit(true);store(false);status('Selected block replaced with edited HTML.');}
let imageTarget=null;
async function imageFile(file){if(!file||!/^image\/(png|jpeg|webp|gif)$/.test(file.type))return status('Choose a PNG/JPEG/WebP/GIF image.');if(file.size>12*1024*1024)return status('Please choose an image smaller than 12 MB.');const imgData=await new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.onerror=rej;rd.readAsDataURL(file)});const data=await new Promise(res=>{if(file.type==='image/gif')return res(imgData);const im=new Image();im.onload=()=>{const scale=Math.min(1,1200/Math.max(im.naturalWidth,im.naturalHeight));const cn=document.createElement('canvas');cn.width=Math.max(1,im.naturalWidth*scale);cn.height=Math.max(1,im.naturalHeight*scale);cn.getContext('2d').drawImage(im,0,0,cn.width,cn.height);res(cn.toDataURL('image/jpeg',.78))};im.onerror=()=>res(imgData);im.src=imgData});if(data.length>2200000)return status('Image too large after compression.');const name=prompt('Image caption:',file.name.replace(/\.[^.]+$/,''))||'Lesson illustration';if(imageTarget){imageTarget.src=data;imageTarget.alt=name;const cap=imageTarget.closest('figure')?.querySelector('figcaption');if(cap)cap.textContent=name;rememberBlock(imageTarget.closest('[data-asic-block-id]'));imageTarget=null}else{const h=current?.closest('.de-content')||getLesson()?.querySelector('.de-content');if(!h)return;const figure=document.createElement('figure');figure.className='asic-added-block';figure.dataset.asicNew='1';figure.dataset.asicBlockId=uniqueId();figure.innerHTML=`<img src="${data}" alt="${htmlEscape(name)}" style="max-width:100%;height:auto;display:block;margin:auto;border-radius:8px"><figcaption>${htmlEscape(name)}</figcaption>`;let anchor=blockFor(current);h.insertBefore(figure,anchor?.nextSibling||null);current=figure;showBlockTools(figure)}store(false);status('Image updated; name and caption can be changed any time.')}
$('#asic-upload-image').addEventListener('change',e=>{imageFile(e.target.files?.[0]).catch(x=>status(x.message));e.target.value=''});
function dropBlockAt(e){const nav=e.target.closest?.('.asic-block-actions');if(nav?.dataset.asicFor)return findBlock(nav.dataset.asicFor);return blockFor(e.target)}
document.addEventListener('dragstart',e=>{const grip=e.target.closest?.('.asic-drag-handle');if(!enabled||!grip)return;dragging=findBlock(grip.closest('.asic-block-actions')?.dataset.asicFor);if(!dragging)return;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragging.dataset.asicBlockId)});
document.addEventListener('dragover',e=>{if(!dragging)return;const b=dropBlockAt(e);if(!b||b===dragging||dragging.contains(b)||b.closest('.de-lesson[id]')!==dragging.closest('.de-lesson[id]'))return;e.preventDefault();$$('.asic-drag-over').forEach(x=>x.classList.remove('asic-drag-over'));b.classList.add('asic-drag-over')});
document.addEventListener('drop',e=>{if(!dragging)return;const b=dropBlockAt(e);if(b&&b!==dragging&&!dragging.contains(b)&&b.closest('.de-lesson[id]')===dragging.closest('.de-lesson[id]')){e.preventDefault();b.parentElement.insertBefore(dragging,b);current=dragging;showBlockTools(dragging);store(false);status('Content moved by dragging, preserving its full table/diagram structure.')}$$('.asic-drag-over').forEach(x=>x.classList.remove('asic-drag-over'));dragging=null});
document.addEventListener('dragend',()=>{dragging=null;$$('.asic-drag-over').forEach(x=>x.classList.remove('asic-drag-over'))});
document.addEventListener('click',e=>{if(!enabled)return;const button=e.target.closest('.asic-block-actions [data-move]');if(!button)return;e.preventDefault();e.stopPropagation();const block=findBlock(button.closest('.asic-block-actions').dataset.asicFor);current=block;const action=button.dataset.move;if(action==='delete')deleteBlock();else moveBlock(action)},true);
// Legacy course scripts may still include a deleted ID in their in-memory Next/Previous arrays.
// Redirect only if that navigation lands on a deleted section during the current editing session.
document.addEventListener('click',e=>{if(!enabled||!e.target.closest('[data-action="next"],[data-action="prev"],.de-next,.de-prev,.de-nav-item'))return;setTimeout(()=>{const missing=sections.find(s=>s.dataset.asicDeletedLesson&&!s.hidden);if(!missing)return;const fallback=sections.find(s=>!s.dataset.asicDeletedLesson);const nav=$$('.de-nav-item').find(b=>b.dataset.target===fallback?.id);if(nav)nav.click();},0)});

// Sanitize rich content pasted from Word and websites into any lesson text.
// A malformed paste must not create new ghost paragraph blocks on reopen.
document.addEventListener('paste',e=>{
 if(!enabled||!e.target.closest?.('.de-lesson [contenteditable="true"]'))return;
 const html=e.clipboardData?.getData('text/html');if(!html)return;
 const fragment=document.createElement('div');fragment.innerHTML=html;
 fragment.querySelectorAll('script,style,meta,link,base').forEach(el=>el.remove());
 fragment.querySelectorAll('[data-pm-slice]').forEach(el=>el.removeAttribute('data-pm-slice'));
 for(const node of fragment.querySelectorAll('[style]')){
  const v=node.style.backgroundColor.replace(/\s+/g,'').toLowerCase();
  if(['rgb(255,255,255)','white','#fff','#ffffff'].includes(v))node.style.removeProperty('background-color');
  if(!node.getAttribute('style')?.trim())node.removeAttribute('style');
 }
 e.preventDefault();document.execCommand('insertHTML',false,fragment.innerHTML);
 const section=e.target.closest('.de-lesson');
 requestAnimationFrame(()=>{if(!section?.isConnected)return;stableEditorialRepair(section)});
});

document.addEventListener('focusout',e=>{
 if(!enabled||!e.target.closest?.('.de-lesson [contenteditable="true"]'))return;
 // Delay until focus settles, so the edited node is not replaced mid-keystroke.
 setTimeout(()=>{if(enabled)store(false)},0);
},true);
document.addEventListener('input',e=>{if(!enabled||!e.target.closest?.('.de-lesson'))return;if(e.target.closest('#asic-editor-window'))return;pendingSource=null;const node=e.target.closest('[data-asic-node-id]');if(node)state.texts[node.dataset.asicNodeId]=node.innerHTML;const title=e.target.closest('[data-asic-lesson-title]');if(title){const sec=title.closest('.de-lesson[id]');if(sec){state.lessonNames[sec.id]=title.textContent.trim();const button=$$('.de-nav-item').find(b=>b.dataset.target===sec.id);const label=button?[...button.children].find(c=>c.tagName==='SPAN'&&!c.classList.contains('de-nav-index')&&!c.classList.contains('de-done-mark')):null;if(label)label.textContent=title.textContent.trim();}}/* Do not persist on each keystroke: localStorage serialization can lag for large images. */});
// Export exactly the edited DOM order. No positional reapplication or duplicate text insertion.
function stripDevReloadScripts(html){return html.replace(/<!--\s*Code injected by live-server\s*-->\s*<script\b[^>]*>[\s\S]*?<\/script>\s*/gi,'')}
function makeExport(){stableEditorialRepair();refreshEditableTextNodes();capture();const clone=document.documentElement.cloneNode(true);cleanTransient(clone);clone.querySelectorAll('[data-asic-deleted-lesson="1"]').forEach(x=>x.remove());clone.querySelectorAll('[data-asic-deleted-nav="1"]').forEach(x=>x.remove());let idx=0;clone.querySelectorAll('.de-sidenav > .de-nav-item[data-target],.de-sidenav > .asic-external-lesson[data-asic-link-id]').forEach(b=>{if(b.matches('.asic-external-lesson')){const label=b.querySelector('.de-nav-index');if(label)label.textContent=String(idx++).padStart(2,'0');return}const target=b.dataset.target;if(!clone.querySelector('.de-lesson[id="'+CSS.escape(target)+'"]')){b.remove();return}const lab=b.querySelector('.de-nav-index');if(lab)lab.textContent=String(idx++).padStart(2,'0')});clone.querySelectorAll('script[src^="content-editor.js"]').forEach(x=>x.src='content-editor.js?v=37.1.11');/* Keep .asic-added-block identity so older exported content remains editable/deletable. */clone.querySelectorAll('.de-lesson').forEach(s=>s.removeAttribute('data-asic-deleted-lesson'));clone.querySelectorAll('.de-nav-item').forEach(b=>b.removeAttribute('data-asic-deleted-nav'));return stripDevReloadScripts('<!DOCTYPE html>\n'+clone.outerHTML)}
function doExport(){const content=stripDevReloadScripts(pendingSource||makeExport()), blob=new Blob([content],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=PAGE;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);store(false);status('Exported '+PAGE+'. New HTML lessons and lesson order are included. If you linked separate HTML files, upload those files too.')}
// Draggable floating window (without obstructing the close control).
let drag=null;$('#asic-panel-handle').addEventListener('pointerdown',e=>{if(e.button||e.target.closest('button'))return;const r=windowPanel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};windowPanel.style.left=r.left+'px';windowPanel.style.top=r.top+'px';windowPanel.style.right='auto';windowPanel.style.bottom='auto';e.preventDefault()});document.addEventListener('pointermove',e=>{if(!drag)return;const left=Math.max(0,Math.min(innerWidth-windowPanel.offsetWidth,drag.left+e.clientX-drag.x)),top=Math.max(0,Math.min(innerHeight-45,drag.top+e.clientY-drag.y));windowPanel.style.left=left+'px';windowPanel.style.top=top+'px'});document.addEventListener('pointerup',()=>drag=null);
windowPanel.addEventListener('click',e=>{const b=e.target.closest('button[data-f],button[data-a]');if(!b)return;const f=b.dataset.f,a=b.dataset.a;if(f){format(f);return}if(a==='close'||a==='preview'){setEdit(false);return}
 if(['heading','paragraph','note','list','table'].includes(a)){newBlock(a);return}if(a==='image'){imageTarget=null;$('#asic-upload-image').click();return}if(a==='replaceImage'){imageTarget=current?.closest('figure')?.querySelector('img')||(current?.tagName==='IMG'?current:null);if(!imageTarget)return status('Select an image first.');$('#asic-upload-image').click();return}
 if(['applyTableWidth','autoTableWidth','applyColumnWidth','equalColumns'].includes(a)){tableSizing(a);return}if(a==='cleanBlankParagraphs'){const r=stableEditorialRepair();store(false);status('Removed '+r.removed+' empty lines and repaired '+r.repaired+' malformed blocks; corrected '+r.duplicates+' repeated text IDs. Export the updated HTML.');return}if(a==='restoreSaved'){if(!recoveryDraft)recoveryDraft=recoveryRead();if(!recoveryDraft)return status('No earlier saved draft was found.');if(!confirm('Apply the previous draft onto this HTML? This may overwrite newer content. Continue?'))return;Object.assign(state,recoveryDraft);state.originHash=initialHash;restoreDraft();setEdit(true);store(false);recoveryDraft=null;status('Previous draft recovered. Review all lessons before exporting.');return}if(a==='fontSmaller'){adjustFontSize(-1);return}if(a==='fontLarger'){adjustFontSize(1);return}if(a==='imageName'){renameImage();return}if(a==='up'||a==='down'){moveBlock(a);return}if(a==='removeBullet'){removeSelectedBullet();return}if(a==='deleteListItem'){deleteSelectedListItem();return}if(a==='deleteElement'){deleteElement();return}if(a==='deleteBlock'){deleteBlock();return}if(['addRow','delRow','addColumn','delColumn'].includes(a)){tableAction(a);return}if(a==='editMarkup'){htmlEditor();return}
 if(a==='visualInteractiveOn'){setInteractiveVisual(true);return}if(a==='visualInteractiveOff'){setInteractiveVisual(false);return}
 if(a==='interactiveLoadHTML'){if(!interactiveSelection)return status('Select an element inside the imported page first.');$('#asic-interactive-text').value=interactiveSelection.html;status('Selected HTML loaded. Edit markup then use Apply as HTML.');return}
 if(a==='interactiveCaption'){renameInteractiveCaption();return}
 if(a==='interactiveApplyText'||a==='interactiveApplyHTML'){applyInteractiveVisual(a==='interactiveApplyHTML');return}
 if(a==='interactiveDelete'){removeInteractiveVisual();return}if(a==='interactiveUndo'){undoInteractiveVisual();return}
 if(a==='interactiveUp'||a==='interactiveDown'){interactiveMessage(a==='interactiveUp'?'moveUp':'moveDown');return}
 if(a==='interactiveInsertHeading'||a==='interactiveInsertParagraph'||a==='interactiveInsertNote'){interactiveMessage('insert',{tag:a==='interactiveInsertHeading'?'h2':a==='interactiveInsertNote'?'div':'p'});return}
 if(a==='editInteractiveHTML'){openInteractiveSource();return}if(a==='applyInteractiveHTML'){applyInteractiveSource();return}if(a==='cancelInteractiveHTML'){$('#asic-interactive-source-wrap').hidden=true;return}if(a==='importLesson'){$('#asic-import-lesson').click();return}if(a==='blankLesson'){createLesson($('#asic-new-lesson-title').value.trim()||'New Lesson','<p>Start writing your lesson here.</p>');return}if(a==='linkLesson'){linkLesson();return}if(a==='planUp'||a==='planDown'||a==='planMove'){changeLessonOrder(a==='planUp'?'up':a==='planDown'?'down':'position');return}if(a==='planOpen'){goPlan($('#asic-plan-select').value);return}if(a==='planRemove'){removeLinkedLesson();return}
 if(a==='goLesson'){const s=selectedSection();if(!s||s.dataset.asicDeletedLesson)return status('Restore the deleted lesson to open it.');$$('.de-nav-item').find(b=>b.dataset.target===s.id)?.click();return}
 if(a==='renameLesson'){renameLesson();return}if(a==='deleteLesson'){deleteLesson();return}if(a==='restoreLesson'){restoreLesson();return}if(a==='undoDelete'){undoDelete();return}if(a==='save'){store(true);return}
 if(a==='backupDraft'){capture();const data=JSON.stringify({format:'asic-skill-editor-draft',version:'37.1.12',page:PAGE,exportedAt:new Date().toISOString(),draft:state},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=PAGE.replace(/\.html?$/i,'')+'-draft-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status('Draft backup downloaded. Export ALL Lessons HTML too for a publishable page.');return}if(a==='reset'){if(!confirm('Discard all saved changes for this page and reload the published HTML?'))return;localStorage.removeItem(STORAGE);location.reload();return}if(a==='export'){try{doExport()}catch(err){status('Export error: '+err.message)}return}
 if(a==='source'){capture();$('#asic-source-editor').value=pendingSource||makeExport();$('#asic-source-wrap').hidden=false;status('Advanced full-page HTML editor opened.');return}
 if(a==='applySource'){const val=$('#asic-source-editor').value;if(!val.includes('<html')||!val.includes('de-lesson'))return status('HTML must contain the page and at least one lesson.');pendingSource=val;$('#asic-source-wrap').hidden=true;status('Full-page HTML will be used for your next export. In-page preview remains unchanged.');return}
 if(a==='cancelSource'){$('#asic-source-wrap').hidden=true;return}
});
$('#asic-font').addEventListener('change',e=>format('fontName',e.target.value));
$('#asic-size').addEventListener('change',()=>applyFontSize());
$('#asic-size').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyFontSize();}});
$('#asic-size').addEventListener('input',e=>{if(e.inputType===undefined && e.target.validity.valid){ /* native spinner and arrow-key increments */ applyFontSize(); }});
$('#asic-text-color').addEventListener('input',e=>format('foreColor',e.target.value));$('#asic-highlight').addEventListener('input',e=>format('hiliteColor',e.target.value));
$('#asic-import-lesson').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importLessonFile(f);e.target.value=''});
$('#asic-plan-select').addEventListener('change',syncPlanPosition);
$('#asic-lesson-select').addEventListener('change',()=>{const id=$('#asic-lesson-select').value;status('Selected '+(sections.find(s=>s.id===id)?lessonName(sections.find(s=>s.id===id)):'lesson')+'. Click Open Lesson or Delete Lesson Page.')});
window.addEventListener('beforeunload',()=>{if(enabled)store(false)});
if(new URLSearchParams(location.search).get('edit')==='1')setEdit(true);
})();
