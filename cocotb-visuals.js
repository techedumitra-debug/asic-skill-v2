/* ASIC-Skill cocotb: example-aware educational diagrams and reference tables.
 * VCD values come from the real simulator; reference functions DO NOT represent netlist synthesis. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
function svgEl(name,attrs={},text){const e=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=text;return e;}
function summarize(out){const pass=(out.match(/PASS=\d+/)||[])[0]||'',failed=(out.match(/FAIL=\d+/)||[])[0]||'';
  const lines=[];if(/iverilog/.test(out))lines.push('1 · RTL compilation');
  if(/\bvvp\b/.test(out))lines.push('2 · Simulator execution');
  if(/cocotb\.regression/.test(out))lines.push('3 · Python verification tests');
  if(pass)lines.push('Tests '+pass+(failed?', '+failed:''));
  if(!lines.length)lines.push('Check complete stdout/stderr for compilation and test diagnostics');
  const warning=(out.match(/\bwarning\b/gi)||[]).length;if(warning)lines.push(warning+' warning(s)');
  return lines.join('   |   ');
}
function modulePorts(source,top){
 const safe=top.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=source.match(new RegExp('\\bmodule\\s+'+safe+'\\s*\\(([\\s\\S]*?)\\)\\s*;'));
 if(!match)return {inputs:[],outputs:[]};
 let mode='',width=1;const inputs=[],outputs=[];
 for(let raw of match[1].split(',')){
  let s=raw.trim().replace(/\b(?:wire|reg|logic|signed|unsigned)\b/g,' ').replace(/\s+/g,' ').trim();
  const direction=s.match(/\b(input|output|inout)\b/);if(direction){mode=direction[1];s=s.replace(/\b(input|output|inout)\b/,'').trim();width=1;}
  const range=s.match(/\[(\d+)\s*:\s*(\d+)\]/);if(range){width=Math.abs(+range[1]-(+range[2]))+1;s=s.replace(range[0],'').trim();}
  const name=(s.match(/[A-Za-z_]\w*$/)||[])[0];if(!name)continue;
  if(mode==='input')inputs.push({name,width});else if(mode==='output')outputs.push({name,width});
 }
 return {inputs,outputs};
}
function latestValue(port,viewer){const data=viewer?.data;if(!data)return null;
 const sigs=data.signals.filter(s=>s.name.toLowerCase().split('.').pop().replace(/\[[^\]]+\]$/,'')===port.toLowerCase());
 const signal=sigs.find(s=>/dut\.|\.dut\./i.test(s.name))||sigs[0];if(!signal)return null;
 const t=viewer.cursorTime??data.end;let val=null;
 for(const [time,value] of signal.events){if(time>t)break;val=value;}
 if(val===null)return null;if(val.length>1&&/^[01]+$/.test(val))return '0x'+parseInt(val,2).toString(16).toUpperCase();return val;
}
const REF={
 day01:{inputs:['a','b','cin'],outputs:['sum','cout'],fn:(a,b,c)=>{const s=a+b+c;return [s&1,s>>1]}},
 day02:{inputs:['a','b','cin'],outputs:['sum','cout'],fn:(a,b,c)=>{const s=a+b+c;return [s&15,s>>4]},vectors:[[0,0,0],[3,5,0],[15,1,0],[7,8,1],[15,15,1]]},
 day03:{inputs:['x','mode'],outputs:['y'],fn:(x,mode)=>[mode?(()=>{let b=(x>>3)&1;for(let k=2;k>=0;k--)b=(b<<1)|(((b&1)^((x>>k)&1)));return b;})():x^(x>>1)],vectors:[[0,0],[3,0],[8,0],[11,0],[3,1],[7,1]]},
 day04:{inputs:['d','sel'],outputs:['y'],fn:(d,s)=>[(d>>s)&1],vectors:[[5,0],[5,1],[5,2],[5,3],[10,2],[15,3]]},
 day05:{inputs:['din','sel'],outputs:['y'],fn:(a,s)=>[a<<s],vectors:[[0,0],[1,0],[1,1],[1,2],[1,3]]},
 day06:{inputs:['req'],outputs:['code','valid'],fn:r=>[r?Math.floor(Math.log2(r)):0,r?1:0],vectors:[[0],[1],[2],[4],[8],[129],[255]]},
 day07:{inputs:['sel','en'],outputs:['y'],fn:(s,e)=>[e?(1<<s):0],vectors:[[0,1],[1,1],[2,1],[3,1],[7,1],[7,0]]},
 day10:{inputs:['a','b'],outputs:['gt','eq','lt'],fn:(a,b)=>[+(a>b),+(a===b),+(a<b)],vectors:[[0,0],[1,2],[15,3],[7,7],[0,15]]},
 day16:{inputs:['a','b'],outputs:['product'],fn:(a,b)=>[((a&8?a-16:a)*(b&8?b-16:b))&255],vectors:[[0,0],[2,3],[7,7],[15,4],[8,8]]},
 day20:{inputs:['a','b','op'],outputs:['y'],fn:(a,b,op)=>[[a+b,a-b,a&b,a|b,a^b,a<<1,a>>1,~a][op]&255],vectors:[[85,51,0],[85,51,1],[85,51,2],[85,51,3],[85,51,4],[85,51,7]]},
 day24:{inputs:['req'],outputs:['grant'],fn:r=>[r?(r&-r):0],vectors:[[0],[1],[2],[3],[8],[15]]},
 day30:{inputs:['n'],outputs:['result'],fn:n=>{let out=1;for(let i=1;i<=Math.min(n,6);i++)out*=i;return [out];},vectors:[[0],[1],[2],[3],[4],[5],[6]]}
};
const CLOCKED={day08:'When enable = 1, Q follows D; otherwise Q retains its previous value.',day09:'On a rising clock edge, Q captures D; active-low reset clears Q.',day11:'At each enabled rising edge the register shifts serial input into the low bit.',day12:'A rising clock loads parallel D or shifts left when Load is low.',day13:'On enabled clock edges the count increments or decrements based on Up.',day14:'Enabled rising edges increment modulo 10; active-low reset initializes zero.',day15:'Gray output = binary count XOR shifted binary count after each rising edge.',day17:'On a write-enabled rising clock edge RAM stores input D.',day18:'Synchronous writes update memory[addr], asynchronous reads expose memory[addr].',day21:'Registered Moore detect asserts after receiving the final bit of 1101.',day22:'Mealy detect depends on shift-register history and the current input bit.',day23:'PWM duty is the count of cycles for which counter < duty in each 16-cycle period.',day25:'Grant chooses the next requesting client round-robin after a clock.',day26:'An 8-bit LFSR updates on enabled rising clock edges.',day27:'Output clock toggles every two input clock edges.',day28:'Traffic light sequence repeats red → yellow → green.',day29:'Clocked elevator controller tracks requested floor and movement.'};
let latestSynthesis=null;
let synthesisSequence=0;
let schematicNote='Run a simulation to request a synthesized schematic.';
let schematicMode='digitaljs';
let digitalCircuit=null;
let digitalPanel=null;
let digitalLoad=null;
let digitalResizeObserver=null;
let drawingVersion=0;
function stopDigitalJS(){
 try{digitalResizeObserver?.disconnect?.();}catch(_error){}
 digitalResizeObserver=null;
 try{digitalPanel?.shutdown?.();}catch(_error){}
 try{digitalCircuit?.stop?.();}catch(_error){}
 digitalPanel=null;digitalCircuit=null;
}

function setNote(message){schematicNote=message;const status=$('cocotb-schematic-status');if(status)status.textContent=message;}
function clearNetlist(){synthesisSequence++;drawingVersion++;stopDigitalJS();latestSynthesis=null;setNote('Simulation not yet synthesized.');}
async function fetchNetlist({api,sessionId,top,rtl,language}){
  const sequence=++synthesisSequence;
  latestSynthesis=null;
  setNote('Generating circuit diagrams from RTL. Schematic generation is independent of testbench PASS/FAIL.');
  try{
    const data=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/cocotb/netlist`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({top,rtl,language})});
    if(sequence!==synthesisSequence || $('cocotb-rtl')?.value!==rtl || $('cocotb-top')?.value.trim()!==top)return;
    if(data.available && (data.digitaljs || data.svg_base64 || data.module)){
      latestSynthesis={top:data.top,renderer:data.renderer||'basic',digitaljs:data.digitaljs,
        svg_base64:data.svg_base64,module:data.module,stats:data.stats,digitaljs_reason:data.digitaljs_reason,
        svg_reason:data.svg_reason};
      if(data.digitaljs){schematicMode='digitaljs';setNote('Interactive circuit diagram ready. Circuit exploration is separate from testbench verification.');}
      else if(data.svg_base64){schematicMode='svg';setNote('Interactive view unavailable; showing automatically arranged circuit diagram.');}
      else {schematicMode='basic';setNote('Showing connection view for the generated circuit.');}
    }else setNote('No synthesized gate diagram: '+(data.reason||'unsupported source')+' Port connections are shown as a reference.');
  }catch(error){
    if(sequence!==synthesisSequence)return;
    setNote('Synthesis unavailable: '+error.message.split('\n')[0]+'. Showing declared design ports only.');
  }
}
function renderNetlistsvg(host,netlist){
 const toolbar=document.createElement('div');toolbar.className='cocotb-netlistsvg-tools';
 const caption=document.createElement('span');caption.textContent='Automatic Layout · '+(netlist.stats?.cells??'?')+' cells · '+(netlist.stats?.connections??'?')+' connections';
 toolbar.append(caption);
 const viewport=document.createElement('div');viewport.className='cocotb-netlistsvg-viewport';
 const img=document.createElement('img');img.alt='Generated circuit diagram for '+netlist.top;
 // SVG is untrusted student-derived data. Display as an image, never with innerHTML,
 // DOMParser or <object>/<iframe> (which could run active SVG content).
 img.src='data:image/svg+xml;base64,'+netlist.svg_base64;
 img.decoding='async';img.loading='eager';
 viewport.append(img);
 let scale=100;
 const applyScale=()=>{img.style.width=scale+'%';};
 const button=(label,handler)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',handler);toolbar.append(b);return b;};
 button('− Zoom',()=>{scale=Math.max(50,scale-25);applyScale();});
 button('+ Zoom',()=>{scale=Math.min(400,scale+25);applyScale();});
 button('Fit',()=>{scale=100;applyScale();viewport.scrollLeft=0;});
 button('Export SVG',()=>{
   const a=document.createElement('a');a.href=img.src;a.download=(netlist.top||'design')+'-netlistsvg.svg';
   document.body.append(a);a.click();a.remove();
 });
 host.append(toolbar,viewport);applyScale();
 img.addEventListener('error',()=>setNote('The circuit diagram could not be displayed. Check your browser SVG image support.'));
}
// Load the locally installed, versioned DigitalJS browser bundle once. No CDN dependency.
function loadDigitalJS(){
 if(root.digitaljs?.Circuit && (root.$||root.jQuery))return Promise.resolve(root.digitaljs);
 if(digitalLoad)return digitalLoad;
 digitalLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='vendor/digitaljs/main.js?v=0.14.2';script.async=true;
  script.onload=()=>root.digitaljs?.Circuit ? resolve(root.digitaljs) : reject(new Error('DigitalJS bundle did not expose Circuit'));
  script.onerror=()=>reject(new Error('Local DigitalJS bundle missing: run eda-lab-server/install-digitaljs.sh'));
  document.head.append(script);
 }).catch(error=>{digitalLoad=null;throw error;});
 return digitalLoad;
}
function renderDigitalJS(host,netlist){
 const version=++drawingVersion;
 const tools=document.createElement('div');tools.className='cocotb-netlistsvg-tools';
 const summary=document.createElement('span');summary.textContent='Interactive Schematic · '+(netlist.stats?.cells??'?')+' synthesized cells · exploratory simulation';
 tools.append(summary);
 const button=(label,handler)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',handler);tools.append(b);return b;};
 const viewport=document.createElement('div');viewport.className='cocotb-digitaljs-viewport';
 const stage=document.createElement('div');stage.className='cocotb-digitaljs-stage';
 const sheet=document.createElement('div');sheet.className='cocotb-digitaljs-paper';stage.append(sheet);viewport.append(stage);
 const loading=document.createElement('p');loading.className='cocotb-digitaljs-loading';loading.textContent='Loading interactive schematic…';
 host.append(tools,loading,viewport);
 const state={scale:1,baseWidth:680,baseHeight:420,hasRendered:false,manualZoom:false};
 const applyScale=({resetScroll=false}={})=>{
  const width=Math.round(state.baseWidth*state.scale);
  const height=Math.round(state.baseHeight*state.scale);
  stage.style.width=width+'px';stage.style.height=height+'px';
  sheet.style.width=state.baseWidth+'px';sheet.style.height=state.baseHeight+'px';
  sheet.style.transform='scale('+state.scale+')';
  if(resetScroll){viewport.scrollLeft=0;viewport.scrollTop=0;}
 };
 const viewMetric=node=>{
  if(!node)return null;
  const vb=node.viewBox?.baseVal;
  let w=vb?.width||0,h=vb?.height||0;
  if(typeof node.getBBox==='function')try{
   const bbox=node.getBBox();w=Math.max(w,bbox.x+bbox.width);h=Math.max(h,bbox.y+bbox.height);
  }catch(_error){}
  w=Math.max(w,node.scrollWidth||0,node.clientWidth||0,node.offsetWidth||0);
  h=Math.max(h,node.scrollHeight||0,node.clientHeight||0,node.offsetHeight||0);
  return w>0&&h>0?{width:w,height:h}:null;
 };
 const fitWindow=()=>{
  const freeW=Math.max(320,(viewport.clientWidth||host.clientWidth||1100)-34);
  const freeH=Math.max(250,(viewport.clientHeight||640)-34);
  state.scale=Math.max(0.12,Math.min(1,freeW/state.baseWidth,freeH/state.baseHeight));
  applyScale({resetScroll:true});
 };
 const refreshBounds=()=>{
  if(version!==drawingVersion || !sheet.isConnected)return;
  const svg=sheet.querySelector?.('svg');
  const first=svg||sheet.firstElementChild||(sheet.children?sheet.children[0]:null);
  const metric=viewMetric(first);
  const priorWidth=state.baseWidth,priorHeight=state.baseHeight;
  if(metric){
   state.baseWidth=Math.max(680,Math.ceil(metric.width)+64);
   state.baseHeight=Math.max(420,Math.ceil(metric.height)+64);
  }
  const changed=Math.abs(state.baseWidth-priorWidth)>10||Math.abs(state.baseHeight-priorHeight)>10;
  if(!state.hasRendered){state.hasRendered=true;fitWindow();}
  else if(changed&&!state.manualZoom)fitWindow();
  else applyScale();
 };
 const queueRefresh=()=>{
  refreshBounds();
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(refreshBounds);
  if(typeof setTimeout==='function')setTimeout(refreshBounds,80);
 };
 const run=button('▶ Run',()=>digitalCircuit?.start?.());
 const pause=button('Ⅱ Pause',()=>digitalCircuit?.stop?.());
 button('Fit',()=>{state.manualZoom=false;refreshBounds();fitWindow();});
 button('− Zoom',()=>{state.manualZoom=true;state.scale=Math.max(0.12,state.scale/1.25);applyScale();});
 button('+ Zoom',()=>{state.manualZoom=true;state.scale=Math.min(3,state.scale*1.25);applyScale();});
 button('Export JSON',()=>{
  const blob=new Blob([JSON.stringify(netlist.digitaljs,null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);
  link.download=(netlist.top||'design')+'-digitaljs.json';document.body.append(link);link.click();link.remove();
  URL.revokeObjectURL(link.href);
 });
 applyScale({resetScroll:true});
 // The actual Circuit instance is created only after loading the pinned local bundle.
 loadDigitalJS().then(lib=>{
  if(version!==drawingVersion || !sheet.isConnected)return;
  try{
   const jq=root.jQuery||root.$;
   digitalCircuit=new lib.Circuit(netlist.digitaljs);
   digitalCircuit.displayOn(jq(sheet));
   loading.remove();
   queueRefresh();
   if(typeof ResizeObserver!=='undefined'){
    digitalResizeObserver=new ResizeObserver(()=>{
     if(version===drawingVersion&&state.hasRendered)fitWindow();
    });digitalResizeObserver.observe(viewport);
   }
   digitalCircuit.start();
   run.disabled=true;pause.disabled=false;
   digitalCircuit.on?.('changeRunning',()=>{run.disabled=!!digitalCircuit?.running;pause.disabled=!digitalCircuit?.running;});
  }catch(error){
   stopDigitalJS();loading.textContent='Interactive schematic could not display this design. See verification log for technical details.';
   if(netlist.svg_base64)renderNetlistsvg(host,netlist);
   else if(netlist.module&&root.ASICNetlistSchematic)root.ASICNetlistSchematic.render(host,netlist.top,netlist.module);
  }
 }).catch(error=>{
  if(version!==drawingVersion)return;
  loading.textContent=error.message+'. Showing the available static synthesis view.';
  if(netlist.svg_base64)renderNetlistsvg(host,netlist);
  else if(netlist.module&&root.ASICNetlistSchematic)root.ASICNetlistSchematic.render(host,netlist.top,netlist.module);
 });
}
function renderModeToolbar(host,netlist){
 const options=[];
 if(netlist.digitaljs)options.push(['digitaljs','Interactive Schematic']);
 if(netlist.svg_base64)options.push(['svg','Automatic Layout']);
 if(netlist.module)options.push(['basic','Connection View']);
 if(!options.some(([id])=>id===schematicMode))schematicMode=options[0]?.[0]||'basic';
 if(options.length < 2)return;
 const modes=document.createElement('div');modes.className='cocotb-schematic-modes';
 modes.setAttribute('aria-label','Circuit schematic rendering mode');
 for(const [id,label] of options){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.className=id===schematicMode?'active':'';button.setAttribute('aria-pressed',String(id===schematicMode));
  button.addEventListener('click',()=>{schematicMode=id;renderSchematic(null,null);});modes.append(button);
 }
 host.append(modes);
}
function observedClockTable(example,viewer,host){
 const data=viewer?.data;if(!data?.signals)return false;
 const ports=modulePorts($('cocotb-rtl')?.value||'', $('cocotb-top')?.value||'');
 const find=(name)=>data.signals.find(s=>s.name.toLowerCase().endsWith('.dut.'+name.toLowerCase()))||
  data.signals.find(s=>s.name.toLowerCase().endsWith('.'+name.toLowerCase()));
 const ctrl=ports.inputs.filter(p=>/^(clk|clock|rst|reset|rst_n|reset_n|en|enable|write_en|wr_en|load)$/i.test(p.name));
 const clk=ctrl.find(p=>/^(clk|clock)$/i.test(p.name));const resets=ctrl.filter(p=>/rst|reset/i.test(p.name));
 const enables=ctrl.filter(p=>/^(en|enable|write_en|wr_en|load)$/i.test(p.name));
 if(!clk&&!resets.length&&!enables.length)return false;
 const signalEntries=ctrl.map(p=>({p,sig:find(p.name)})).filter(x=>x.sig);
 if(!signalEntries.length)return false;
 const outputs=ports.outputs.map(p=>({p,sig:find(p.name)})).filter(x=>x.sig);
 const sample=(sig,t)=>sig?viewer.valueAt(sig,t):'—';
 const times=new Map();for(const entry of signalEntries){let prev=null;for(const [t,v] of entry.sig.events){
  if(prev===null){prev=v;continue;}
  let event='';if(entry.p===clk&&v==='1'&&prev==='0')event='CLK ↑';
  else if(resets.includes(entry.p)&&v!==prev){const activeLow=/(?:_n$|^nreset$)/i.test(entry.p.name);event=(v===(activeLow?'0':'1'))?'RESET asserted':'RESET released';}
  else if(enables.includes(entry.p)&&v!==prev)event='ENABLE '+v;
  if(event){times.set(t,[...(times.get(t)||[]),event]);}
  prev=v;
 }}
 if(!times.size)return false;
 const title=document.createElement('h3');title.textContent='Observed clock/reset/enable events (simulation VCD)';host.append(title);
 const summary=document.createElement('p');summary.textContent='Values sampled at end of each VCD timestamp, after same-time changes. Rising clock, reset assertion/release and enable transitions are shown; the testbench determines which cases were exercised.';host.append(summary);
 const table=document.createElement('table'),header=document.createElement('tr');
 const labels=['Time ('+data.timescale+')','Event',...signalEntries.map(x=>x.p.name),...outputs.map(x=>x.p.name)];
 for(const name of labels){const th=document.createElement('th');th.textContent=name;header.append(th);}table.append(header);
 let count=0;for(const [t,events] of [...times.entries()].sort((a,b)=>a[0]-b[0])){
  if(count++>=100)break;const tr=document.createElement('tr');const vals=[t,events.join(' / '),...signalEntries.map(x=>sample(x.sig,t)),...outputs.map(x=>sample(x.sig,t))];
  for(const value of vals){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}table.append(tr);
 }
 host.append(table);return true;
}
function referenceSequential(example,host,viewer){
 const ports=modulePorts($('cocotb-rtl')?.value||'', $('cocotb-top')?.value||'');
 const clock=ports.inputs.find(p=>/^(clk|clock)$/i.test(p.name));const reset=ports.inputs.find(p=>/rst|reset/i.test(p.name));
 const enable=ports.inputs.find(p=>/^(en|enable|wr_en|write_en)$/i.test(p.name));
 const desc=document.createElement('p');desc.textContent=(CLOCKED[example?.id]||'Next-state behavior depends on this design’s RTL and current state.')+(clock?' Active edge: rising CLK.':'');host.append(desc);
 const p=document.createElement('p');p.textContent='Controls present in selected RTL: '+ports.inputs.map(x=>x.name).join(', ');host.append(p);
 if(!clock&&!reset&&!enable)return;
 const table=document.createElement('table'),h=document.createElement('tr');
 const labels=['Event',clock?.name||'CLK',reset?.name||'RESET',enable?.name||'EN','Reference next-state behavior'];
 labels.forEach(x=>{const th=document.createElement('th');th.textContent=x;h.append(th);});table.append(h);
 const resetLow=reset?/(?:_n$|^nreset$)/i.test(reset.name):false;
 const rowList=[];
 if(reset)rowList.push(['Reset asserted','—',resetLow?'0':'1','X','Reset behavior defined by the selected RTL']);
 if(clock)rowList.push(['Rising clock edge','↑',reset?(resetLow?'1':'0'):'—',enable?'1':'—','Evaluate next-state RTL']);
 if(clock&&enable)rowList.push(['Rising edge, disabled','↑',reset?(resetLow?'1':'0'):'—','0','Often hold state; verify the selected RTL']);
 if(clock)rowList.push(['No active clock edge','0 / 1',reset?(resetLow?'1':'0'):'—','X','Sequential state held unless asynchronous controls act']);
 for(const vals of rowList){const tr=document.createElement('tr');for(const v of vals){const td=document.createElement('td');td.textContent=v;tr.append(td);}table.append(tr);}host.append(table);
}
function renderTruth(example,viewer){const el=$('cocotb-truth');if(!el)return;el.replaceChildren();
 if(!example){el.textContent='Custom design: no predefined reference truth table. Clock/reset event observations appear after running the VCD simulation.';observedClockTable(example,viewer,el);return;}
 const ref=REF[example.id];
 if(ref){const table=document.createElement('table'),tr=document.createElement('tr');for(const x of [...ref.inputs,...ref.outputs]){const th=document.createElement('th');th.textContent=x;tr.append(th);}table.append(tr);
 let vectors=ref.vectors;if(!vectors)vectors=ref.inputs.length===3?[[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]]:[[0],[1]];
 for(const vector of vectors){const row=document.createElement('tr');for(const n of [...vector,...ref.fn(...vector)]){const td=document.createElement('td');td.textContent=String(n);row.append(td);}table.append(row);}el.append(table);
 const note=document.createElement('p');note.textContent='Educational reference vectors for the original example; edited RTL may differ.';el.append(note);
 }else referenceSequential(example,el,viewer);
 observedClockTable(example,viewer,el);
}
function renderSchematic(example,viewer){const host=$('cocotb-schematic');if(!host)return;
 drawingVersion++;stopDigitalJS();host.replaceChildren();setNote(schematicNote);
 const drawing=document.createElement('div');drawing.className='cocotb-schematic-drawing';
 if(latestSynthesis){
   renderModeToolbar(host,latestSynthesis);
   host.append(drawing); // all renderers may clear only this dedicated content node
   if(schematicMode==='digitaljs'&&latestSynthesis.digitaljs){renderDigitalJS(drawing,latestSynthesis);return;}
   if(schematicMode==='svg'&&latestSynthesis.svg_base64){renderNetlistsvg(drawing,latestSynthesis);return;}
   if(schematicMode==='basic'&&latestSynthesis.module&&root.ASICNetlistSchematic){root.ASICNetlistSchematic.render(drawing,latestSynthesis.top,latestSynthesis.module);return;}
   if(latestSynthesis.svg_base64){renderNetlistsvg(drawing,latestSynthesis);return;}
   if(latestSynthesis.module&&root.ASICNetlistSchematic){root.ASICNetlistSchematic.render(drawing,latestSynthesis.top,latestSynthesis.module);return;}
 }
 host.append(drawing);
 const source=$('cocotb-rtl')?.value||'',top=$('cocotb-top')?.value||'';
 const {inputs,outputs}=modulePorts(source,top);
 if(!inputs.length&&!outputs.length){drawing.textContent='Unable to extract module ports. Run a supported synthesizable module or use ANSI-style port declarations.';return;}
 // Reference fallback: actual declared ports, with wires ending at the corresponding module pins.
 const rows=Math.max(inputs.length,outputs.length,2),height=Math.max(320,110+rows*56);
 const svg=svgEl('svg',{viewBox:`0 0 960 ${height}`,'aria-label':`RTL interface diagram for ${top}`,role:'img'});drawing.append(svg);
 svg.append(svgEl('rect',{x:5,y:5,width:950,height:height-10,rx:8,fill:'#061421',stroke:'#315a73'}));
 svg.append(svgEl('text',{x:480,y:30,fill:'#b3f0f9','font-size':19,'text-anchor':'middle'},top+' · PORT-ONLY REFERENCE'));
 const x0=350,x1=610,yy=55,step=56;svg.append(svgEl('rect',{x:x0,y:yy,width:x1-x0,height:rows*step+22,rx:10,fill:'#143448',stroke:'#66e6cb','stroke-width':2}));
 const rowsFn=(arr,side)=>arr.forEach((p,i)=>{const y=yy+44+i*step,from=side==='left'?175:x1,to=side==='left'?x0:780;
 svg.append(svgEl('path',{d:`M ${from} ${y} H ${to}`,stroke:'#54cfea','stroke-width':2,fill:'none'}));
 svg.append(svgEl('circle',{cx:side==='left'?x0:x1,cy:y,r:4,fill:'#a7f5da'}));
 const name=p.name+(p.width>1?` [${p.width-1}:0]`:'');svg.append(svgEl('text',{x:side==='left'?18:790,y:y-7,fill:'#d8f2ff','font-size':13,'font-family':'monospace'},name));
 const v=latestValue(p.name,viewer);if(v!==null)svg.append(svgEl('text',{x:side==='left'?170:785,y:y+19,fill:'#ffdb88','text-anchor':'end','font-size':11},String(v)));
 });rowsFn(inputs,'left');rowsFn(outputs,'right');
 svg.append(svgEl('text',{x:480,y:height-22,fill:'#d1e8f1','text-anchor':'middle','font-size':12},'No internal gates drawn: synthesis was unavailable or not supported for this source.'));
}
function render(tab,example,viewer){if(tab==='schematic')renderSchematic(example,viewer);else if(tab==='truth')renderTruth(example,viewer);}
root.ASICCOCOTBVisuals={render,summarize,modulePorts,reference:REF,clocked:CLOCKED,clearNetlist,fetchNetlist};
})(window);
