/* ASIC-Skill lightweight offline code editor enhancement. No CDN needed. */
(function (root) {
  'use strict';
  const settings = new WeakMap();
  const textSnapshot = el => ({text: el.value, start: el.selectionStart || 0, end: el.selectionEnd || 0});
  function editSelection(el, newText, start, end, caretStart, caretEnd) {
    el.setRangeText(newText, start, end, 'preserve');
    el.setSelectionRange(caretStart, caretEnd);
    el.dispatchEvent(new Event('input', {bubbles:true}));
  }
  function lineRange(text, start, end) {
    const from = text.lastIndexOf('\n', Math.max(0,start-1)) + 1;
    const lastSelected = end > start && text[end-1] === '\n' ? end-1 : end;
    const nextBreak = text.indexOf('\n', lastSelected);
    return {from, to: nextBreak < 0 ? text.length : nextBreak};
  }
  function transformLines(el, kind, spaces=2) {
    const original = el.value, start=el.selectionStart, end=el.selectionEnd;
    const {from,to} = lineRange(original,start,end);
    const lines=original.slice(from,to).split('\n');
    const token=' '.repeat(spaces);
    const language=el.dataset.language || 'verilog';
    const prefix=(['sdc','tcl','python'].includes(language))?'#':'//';
    const nonEmpty=lines.filter(l=>l.trim());
    const uncomment=kind==='comment' && nonEmpty.length && nonEmpty.every(l=>l.trimStart().startsWith(prefix));
    let firstDelta=0, totalDelta=0;
    const result=lines.map((line,i)=>{
      let updated=line;
      if(kind==='indent') updated=token+line;
      else if(kind==='outdent') updated=line.replace(new RegExp(`^(?: {1,${spaces}}|\\t)`),'');
      else if(kind==='comment' && line.trim()) {
        const ws=line.match(/^\s*/)[0];
        const rest=line.slice(ws.length);
        updated=ws+(uncomment?rest.slice(prefix.length).replace(/^ /,''):prefix+' '+rest);
      }
      if(i===0) firstDelta=updated.length-line.length;
      totalDelta+=updated.length-line.length;
      return updated;
    }).join('\n');
    const selected=end>start;
    editSelection(el,result,from,to,Math.max(from,selected?start+firstDelta:start+firstDelta),Math.max(from,selected?end+totalDelta:start+firstDelta));
  }
  function insertTab(el, spaces) {
    if(el.selectionStart!==el.selectionEnd) {
      transformLines(el,'indent',spaces);return;
    }
    const at=el.selectionStart;
    const column=at-(el.value.lastIndexOf('\n',at-1)+1);
    const count=spaces-(column%spaces);
    editSelection(el,' '.repeat(count),at,el.selectionEnd,at+count,at+count);
  }
  function autoNewline(el) {
    const start=el.selectionStart;
    const line=el.value.slice(el.value.lastIndexOf('\n',start-1)+1,start);
    const indent=(line.match(/^\s*/)||[''])[0];
    const at=el.selectionEnd;
    editSelection(el,'\n'+indent,start,at,start+1+indent.length,start+1+indent.length);
  }
  function duplicate(el) {
    const {from,to}=lineRange(el.value,el.selectionStart,el.selectionEnd);
    const chunk=el.value.slice(from,to);
    editSelection(el,'\n'+chunk,to,to,to+1,to+1+chunk.length);
  }
  function createButton(name,title,callback) {
    const b=document.createElement('button');b.type='button';b.textContent=name;b.title=title;b.addEventListener('click',callback);return b;
  }
  function attach(el) {
    if(settings.has(el))return;
    el.spellcheck=false;el.setAttribute('autocomplete','off');el.setAttribute('autocapitalize','off');
    const wrap=el.closest('.editor, .editor-card');
    if(!wrap)return;
    const filename=el.dataset.filename || 'design.txt';
    const toolbar=document.createElement('div');toolbar.className='code-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label',filename+' editor tools');
    const left=document.createElement('div');left.className='code-toolbar-left';
    const right=document.createElement('div');right.className='code-toolbar-right';
    const sel=document.createElement('select');sel.setAttribute('aria-label','Indent width');sel.title='Spaces per indentation level';
    [2,4].forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n+' spaces';if(n===4)o.selected=true;sel.append(o)});
    const stored={indent:4,wrap:false,history:[],index:-1,restoring:false};settings.set(el,stored);
    sel.addEventListener('change',()=>{stored.indent=Number(sel.value);el.focus()});
    left.append(createButton('→ Indent','Tab indents selected lines',()=>{transformLines(el,'indent',stored.indent);el.focus()}),createButton('← Outdent','Shift+Tab removes indentation',()=>{transformLines(el,'outdent',stored.indent);el.focus()}),createButton('// Comment','Ctrl+/ toggles comments',()=>{transformLines(el,'comment',stored.indent);el.focus()}),sel);
    const wrapButton=createButton('Wrap: off','Toggle word wrapping',()=>{stored.wrap=!stored.wrap;el.style.whiteSpace=stored.wrap?'pre-wrap':'pre';el.style.overflowWrap=stored.wrap?'anywhere':'normal';wrapButton.textContent=stored.wrap?'Wrap: on':'Wrap: off';el.focus()});
    const copyButton=createButton('Copy','Copy editor contents',async()=>{try{await navigator.clipboard.writeText(el.value);copyButton.textContent='Copied ✓';setTimeout(()=>copyButton.textContent='Copy',1400)}catch{el.focus();el.select();document.execCommand('copy')}});
    const downloadButton=createButton('↓ Save','Download this file to your computer',()=>{const blob=new Blob([el.value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)});
    const cursor=document.createElement('span');cursor.className='code-cursor';cursor.setAttribute('aria-live','off');
    const updateCursor=()=>{const before=el.value.slice(0,el.selectionStart);const ln=before.split('\n');cursor.textContent='Ln '+ln.length+', Col '+(ln[ln.length-1].length+1)+' · '+el.value.split('\n').length+' lines'};
    const pushHistory=()=>{if(stored.restoring)return;const s=textSnapshot(el);const last=stored.history[stored.index];if(last&&last.text===s.text){updateCursor();return;}stored.history.splice(stored.index+1);stored.history.push(s);if(stored.history.length>120)stored.history.shift();stored.index=stored.history.length-1;updateCursor()};
    const restore=direction=>{let next=stored.index+direction;if(next<0||next>=stored.history.length)return;const s=stored.history[next];stored.restoring=true;el.value=s.text;el.setSelectionRange(s.start,s.end);stored.index=next;stored.restoring=false;el.dispatchEvent(new Event('input',{bubbles:true}));updateCursor();el.focus()};
    stored.undo=()=>restore(-1);stored.redo=()=>restore(1);
    right.append(createButton('↶','Undo: Ctrl+Z',()=>restore(-1)),createButton('↷','Redo: Ctrl+Y / Ctrl+Shift+Z',()=>restore(1)),wrapButton,copyButton,downloadButton,cursor);
    toolbar.append(left,right);
    // The cocotb inline workspace is intentionally minimal. Full editor controls
    // remain available in the separate pop-out windows (no expanded-only marker).
    if (el.dataset.editorToolbar !== 'expanded-only') el.before(toolbar);
    el.style.tabSize='4';el.style.whiteSpace='pre';el.style.overflowWrap='normal';el.style.overflowX='auto';
    el.addEventListener('keydown',event=>{
      const mod=event.ctrlKey||event.metaKey;
      if(mod && !event.altKey && event.key.toLowerCase()==='z'){event.preventDefault();restore(event.shiftKey?1:-1);return;}
      if(mod && !event.altKey && event.key.toLowerCase()==='y'){event.preventDefault();restore(1);return;}
      if(mod && !event.altKey && event.key==='/'){event.preventDefault();transformLines(el,'comment',stored.indent);return;}
      if(mod && !event.altKey && event.key.toLowerCase()==='d'){event.preventDefault();duplicate(el);return;}
      if(event.key==='Tab'&&!mod&&!event.altKey){event.preventDefault();if(event.shiftKey)transformLines(el,'outdent',stored.indent);else if(el.selectionStart!==el.selectionEnd)transformLines(el,'indent',stored.indent);else insertTab(el,stored.indent);return;}
      if(event.key==='Enter'&&!mod&&!event.altKey){event.preventDefault();autoNewline(el);}
    });
    el.addEventListener('input',pushHistory);el.addEventListener('keyup',updateCursor);el.addEventListener('click',updateCursor);el.addEventListener('select',updateCursor);el.addEventListener('mouseup',updateCursor);
    pushHistory();
    // External updates to .value (upload/reset) are picked up without replacing user edits.
    el.addEventListener('focus',pushHistory);
  }
  root.ASICCodeEditor={init(scope=document){scope.querySelectorAll('textarea[data-code-editor]').forEach(attach);},attach,
    undo(el){const state=settings.get(el);if(state?.undo)state.undo();},
    redo(el){const state=settings.get(el);if(state?.redo)state.redo();}};
})(window);
