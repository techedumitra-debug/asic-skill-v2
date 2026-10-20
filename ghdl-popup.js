/* Standalone, same-origin result popout. Reads already-generated data from its
 * opener; never receives or stores Supabase credentials or Docker access. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const kind=new URLSearchParams(location.search).get('view')==='schematic'?'schematic':'wave';
$('pop-title').textContent=kind==='wave'?'Waveform Viewer':'Schematic Viewer';
$('pop-wave-pane').hidden=kind!=='wave';$('pop-schem-pane').hidden=kind!=='schematic';
const viewer=kind==='wave'?new ASICWaveViewer('ghdl-pop-wave-'):null;
let scale=1,dimensions={width:980,height:240};
function el(tag,attrs={},label){const a=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))a.setAttribute(k,String(v));if(label!==undefined)a.textContent=label;return a;}
function zoom(){const e=$('pop-schem-svg');e.style.width=`${dimensions.width*scale}px`;e.style.height=`${dimensions.height*scale}px`;$('pop-schem-zoom').textContent=Math.round(scale*100)+'%';}
function renderNet(net,designTop){
  const svg=$('pop-schem-svg');svg.replaceChildren();
  const mods=net?.modules||{},mod=mods[designTop]||mods['\\'+designTop]||Object.values(mods)[0];
  if(!mod)throw Error('No synthesized top module.');
  const ports=Object.entries(mod.ports||{}),cells=Object.entries(mod.cells||{}).slice(0,65);
  const inputs=ports.filter(([,v])=>v.direction==='input'),outputs=ports.filter(([,v])=>v.direction==='output');
  const length=Math.max(inputs.length,cells.length,outputs.length,3),height=length*68+75,width=1000;
  dimensions={height,width};svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.append(el('rect',{width,height,fill:'#061522'}));
  for(const [x,text] of [[115,'INPUTS'],[495,'SYNTHESIZED CELLS'],[880,'OUTPUTS']])svg.append(el('text',{x,y:25,fill:'#9ccbe7','font-size':14,'font-weight':700},text));
  const loc=new Map(),drivers=new Map();
  const put=(id,x,row,bits)=>{const y=70+row*68;loc.set(id,{x,y});return {x,y}};
  const drawNode=(label,x,y,type,inspect)=>{
    const g=el('g',{tabindex:0,role:'button'});
    if(type==='cell'){
      ASICGHDLSymbols.cellSymbol(g,label,x,y,174,44);
    }else{
      g.append(el('rect',{x:x-94,y:y-23,width:188,height:45,rx:7,fill:'#104057',stroke:'#5bafdc'}));
      g.append(el('text',{x,y:y+4,'font-size':12,'text-anchor':'middle',fill:'#f2fcff'},label.length>25?label.slice(0,22)+'…':label));
    }
    g.addEventListener('click',inspect);g.addEventListener('keydown',e=>{if(e.key==='Enter'){inspect();}});svg.append(g);
  };
  for(let i=0;i<inputs.length;i++){const [n,p]=inputs[i],id='in:'+n,{x,y}=put(id,110,i,p.bits);for(const bit of p.bits||[])if(typeof bit==='number')drivers.set(bit,id);drawNode(n,x,y,'port',()=>{$('pop-schem-details').textContent=`Input ${n}: ${JSON.stringify(p.bits)}`;});}
  for(let i=0;i<cells.length;i++){const [n,c]=cells[i],id='c:'+n,{x,y}=put(id,495,i);for(const [pin,bits] of Object.entries(c.connections||{}))if((c.port_directions||{})[pin]==='output')for(const bit of bits)if(typeof bit==='number')drivers.set(bit,id);drawNode(c.type,x,y,'cell',()=>{$('pop-schem-details').textContent=`Cell: ${n}\nType: ${c.type}\nConnections: ${JSON.stringify(c.connections,null,2)}`;});}
  for(let i=0;i<outputs.length;i++){const [n,p]=outputs[i],id='out:'+n,{x,y}=put(id,880,i);drawNode(n,x,y,'port',()=>{$('pop-schem-details').textContent=`Output ${n}: ${JSON.stringify(p.bits)}`;});}
  const wires=el('g',{stroke:'#57aacf','stroke-width':1.6,opacity:.72,fill:'none'});svg.insertBefore(wires,svg.children[4]||null);
  let edge=0;function connect(source,dest){if(!source||!dest||source===dest||edge++>250)return;const s=loc.get(source),d=loc.get(dest);if(!s||!d)return;const sx=s.x+95,dx=d.x-95;wires.append(el('path',{d:`M ${sx} ${s.y} C ${(sx+dx)/2} ${s.y}, ${(sx+dx)/2} ${d.y}, ${dx} ${d.y}`}));}
  for(const [n,c] of cells)for(const [pin,bits] of Object.entries(c.connections||{}))if((c.port_directions||{})[pin]==='input')for(const bit of new Set(bits))connect(drivers.get(bit),'c:'+n);
  for(const [n,p] of outputs)for(const bit of new Set(p.bits||[]))connect(drivers.get(bit),'out:'+n);
  $('pop-schem-status').textContent=`${Object.keys(mod.cells||{}).length} cells · ${inputs.length} input ports · ${outputs.length} output ports`;
  $('pop-schem-empty').hidden=true;scale=1;zoom();
}
function refresh(){
  try{
    if(!window.opener||window.opener.closed||window.opener.location.origin!==location.origin)throw Error('This result window must be opened from the ASIC-Skill GHDL Lab.');
    const data=window.opener.ASICGHDL?.getViewData();if(!data)throw Error('No active GHDL lab.');
    if(kind==='wave'){
      if(!data.vcd)throw Error('No waveform yet. Run a GHDL simulation first.');
      viewer.show(data.vcd);
    }else{
      if(!data.net)throw Error('Synthesis diagram is not yet available. Run a supported synthesizable VHDL design first.');
      renderNet(data.net,data.designTop);
    }
    $('pop-status').textContent='Result loaded from the active GHDL Lab. Refresh after another simulation to load its latest results.';
  }catch(e){$('pop-status').textContent=e.message;}
}
$('pop-refresh').onclick=refresh;
$('pop-backup-link').href='eda-lab.html?tool=ghdl&view='+encodeURIComponent(kind==='wave'?'wave':'logic');
$('pop-return').addEventListener('click',()=>{
  try{
    const original=window.opener;
    if(original && !original.closed && original.location.origin===location.origin){
      original.ASICGHDL?.showPanel(kind==='wave'?'wave':'logic');
      original.focus();window.close();
      $('pop-status').textContent='Select the original GHDL Lab tab to continue.';
      return;
    }
  }catch(e){}
  location.assign($('pop-backup-link').href);
});
for(const grip of document.querySelectorAll('.ghdl-pane-grip')){
  const side=grip.previousElementSibling,body=grip.closest('.wave-body');let x=0,w=0;
  grip.addEventListener('pointerdown',e=>{x=e.clientX;w=side.getBoundingClientRect().width;grip.setPointerCapture(e.pointerId);e.preventDefault();});
  grip.addEventListener('pointermove',e=>{if(!grip.hasPointerCapture(e.pointerId))return;side.style.width=Math.max(155,Math.min(body.clientWidth*.7,w+e.clientX-x))+'px';});
  grip.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();side.style.width=Math.max(155,side.getBoundingClientRect().width+(e.key==='ArrowRight'?30:-30))+'px';}});
}

if(kind==='schematic'){
  $('pop-schem-zoom-in').onclick=()=>{scale=Math.min(3,scale*1.3);zoom()};
  $('pop-schem-zoom-out').onclick=()=>{scale=Math.max(.3,scale/1.3);zoom()};
  $('pop-schem-fit').onclick=()=>{scale=Math.max(.3,Math.min(1,$('pop-schem-scroll').clientWidth/dimensions.width));zoom()};
}
refresh();
})();
