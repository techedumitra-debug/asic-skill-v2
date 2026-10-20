/* Shared cocotb / RTL Workshop code highlighting with one consistent GHDL-style theme. */
(function(){'use strict';
  const escapeHtml=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const verilog=new Set(('module endmodule input output wire reg logic signed unsigned assign always always_ff always_comb initial begin end if else case endcase for generate endgenerate parameter localparam function endfunction task endtask posedge negedge integer genvar repeat wait').split(' '));
  const python=new Set(('import from as async await def class return assert for in if else elif while try except finally with pass break continue True False None not and or yield').split(' '));
  function install(textarea){if(!textarea||textarea.parentElement?.classList.contains('rtl-code-surface'))return;
    const surface=document.createElement('div');surface.className='rtl-code-surface';const pre=document.createElement('pre');pre.setAttribute('aria-hidden','true');
    textarea.parentElement.insertBefore(surface,textarea);surface.append(pre,textarea);
    function highlight(){const lang=textarea.dataset.language,keywords=lang==='python'?python:verilog;const str=textarea.value;const matcher=lang==='python'?/(?:#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+\b|\b[A-Za-z_]\w*\b|[\s\S])/g:/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|\b\d+(?:'[bhd][0-9a-f_xz]+)?\b|\b[A-Za-z_]\w*\b|[\s\S])/gi;
      const tokens=str.match(matcher)||[];pre.innerHTML=tokens.map(v=>{const type=(lang==='python'?v.startsWith('#'):v.startsWith('//')||v.startsWith('/*'))?'comment':/^['"]/.test(v)?'string':/^\d/.test(v)?'num':keywords.has(v)?'kw':/^(?:Timer|Clock|RisingEdge|FallingEdge|int|bool|range)$/.test(v)?'type':'';return type?'<span class="hl-'+type+'">'+escapeHtml(v)+'</span>':escapeHtml(v)}).join('')+'\n';pre.scrollTop=textarea.scrollTop;pre.scrollLeft=textarea.scrollLeft;
    }
    textarea.addEventListener('input',highlight);textarea.addEventListener('scroll',()=>{pre.scrollTop=textarea.scrollTop;pre.scrollLeft=textarea.scrollLeft;});
    highlight();return {surface,highlight};
  }
  const panels=[{panel:'cocotb',theme:'cocotb-main-theme',ids:['cocotb-rtl','cocotb-test'],storage:'asic-cocotb-editor-theme'},{panel:'rtl-workshop',theme:'rtl-workshop-theme',ids:['rtl-workshop-rtl','rtl-workshop-test'],storage:'asic-rtl-workshop-editor-theme'}];
  panels.forEach(group=>{const select=document.getElementById(group.theme);if(!select)return;const installs=group.ids.map(id=>install(document.getElementById(id)));
    try{select.value=localStorage.getItem(group.storage)||select.value||'desert';}catch{}
    function apply(){installs.forEach(x=>x?.surface.classList.toggle('rtl-gray',select.value==='gray'));try{localStorage.setItem(group.storage,select.value);}catch{}}
    select.addEventListener('change',apply);apply();
  });
  if(typeof window.ASICRTLWorkshopInit==='function')window.ASICRTLWorkshopInit();
})();
