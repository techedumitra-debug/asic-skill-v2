/* ASIC-Skill v37.0.33 - native SVG functional circuit viewer.
 * Explicit topology for logic/adders; port-faithful functional block otherwise.
 * Never claim the diagram is a synthesized implementation. */
(function(root){
'use strict';
const ns='http://www.w3.org/2000/svg';
const sv=(tag,attrs={},str)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(str!==undefined)e.textContent=String(str);return e;};
const FONT='Consolas,ui-monospace,monospace';
function label(parent,x,y,value,{color='#c9eaff',anchor='start',size=14,weight=400}={}){
 parent.append(sv('text',{x,y,fill:color,'font-size':size,'font-family':FONT,'text-anchor':anchor,'font-weight':weight},value));
}
function path(svg,points,stroke='#45d6da',width=2){
 const d=points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
 const el=sv('path',{d,fill:'none',stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});svg.append(el);return el;
}
function badgeValue(svg,x,y,value){
 if(value===undefined||value===null)return;
 const fill=String(value)==='1'?'#64f5af':'#ffe08e';label(svg,x,y,String(value),{color:fill,anchor:'middle',size:12,weight:700});
}
function measuredValue(wave,port){
 if(!wave?.data?.signals)return null;
 const name=port.toLowerCase();
 const signals=wave.data.signals;
 const basename=s=>s.name.toLowerCase().replace(/\[[^\]]+\]$/,'');
 const match=signals.find(s=>basename(s).endsWith('.dut.'+name))||signals.find(s=>basename(s).endsWith('.'+name))||signals.find(s=>basename(s)===name);
 return match?wave.valueAt(match,wave.cursorTime??0):null;
}
function valueFor(wave,port,displayValues){
 if(displayValues&&Object.prototype.hasOwnProperty.call(displayValues,port))return displayValues[port];
 return measuredValue(wave,port);
}
function markInputPin(shape,port,onInputClick){
 if(typeof onInputClick!=='function')return;
 shape.setAttribute('data-input-port',port.id);
 shape.setAttribute('tabindex','0');shape.setAttribute('role','button');
 shape.setAttribute('aria-label',`Change input ${port.id}`);
 shape.addEventListener('click',()=>onInputClick(port));
 shape.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onInputClick(port);}});
}
function drawPortRows(svg,ports,x,yStart,gap,side,wave,displayValues,onInputClick){
 return ports.map((p,i)=>{
  const y=yStart+i*gap;
  if(side==='left'){
   label(svg,x+12,y-10,p.label,{size:13});
   path(svg,[[x+22,y+3],[x+230,y+3]]);
   const pin=sv('circle',{cx:x+22,cy:y+3,r:7,fill:'#90f3fa'});markInputPin(pin,p,onInputClick);svg.append(pin);
   badgeValue(svg,x+80,y+21,valueFor(wave,p.id,displayValues));
  }else{
   path(svg,[[x-230,y+3],[x-22,y+3]]);
   svg.append(sv('circle',{cx:x-22,cy:y+3,r:4.5,fill:'#90f3fa'}));
   label(svg,x+5,y-10,p.label,{size:13});
   badgeValue(svg,x-65,y+21,valueFor(wave,p.id,displayValues));
  }
  return y+3;
 });
}
function drawBlock(svg,graph,wave,displayValues,onInputClick){
 const n=Math.max(graph.inputs.length,graph.outputs.length,2),gap=58,height=Math.max(470,n*gap+170),centerX=590,top=104,left=116,right=1065;
 svg.setAttribute('viewBox',`0 0 1250 ${height}`);
 const leftYs=drawPortRows(svg,graph.inputs,left,top+20,gap,'left',wave,displayValues,onInputClick);
 const rightYs=drawPortRows(svg,graph.outputs,right,top+20,gap,'right',wave,displayValues,null);
 const blockH=Math.max(160,n*gap+6);const blockY=top-16,blockX=centerX-175;
 const g=sv('g');svg.append(g);
 g.append(sv('rect',{x:blockX,y:blockY,width:350,height:blockH,rx:11,fill:'#113047',stroke:'#64e8cb','stroke-width':2.7}));
 label(g,centerX,blockY+blockH/2,graph.blockLabel,{color:'#e5f6ff',anchor:'middle',size:22,weight:700});
 // Every declared pin has its own visible connection and position on the function block.
 for(let i=0;i<leftYs.length;i++){
  const y=leftYs[i];path(svg,[[left+230,y],[blockX,y]],'#49ddcd');svg.append(sv('circle',{cx:blockX,cy:y,r:4,fill:'#6ee7bf'}));
 }
 for(let i=0;i<rightYs.length;i++){
  const y=rightYs[i];path(svg,[[blockX+350,y],[right-230,y]],'#79bbff');svg.append(sv('circle',{cx:blockX+350,cy:y,r:4,fill:'#79bbff'}));
 }
 return height;
}
function drawGates(svg,graph,wave,displayValues,onInputClick){
 // Lane-based routed wires. Multiple consumers share a net trunk with named junctions.
 const gates=graph.nodes;
 const gap=88;const rowTop=145;
 const rows=Math.max(gates.length,graph.inputs.length,graph.outputs.length,2);
 const height=Math.max(450,rowTop+rows*gap+100);
 svg.setAttribute('viewBox',`0 0 1250 ${height}`);
 const portYs=new Map();const outYs=new Map();
 graph.inputs.forEach((p,i)=>{
  const y=rowTop+i*gap;
  portYs.set(p.id,y);label(svg,35,y-13,p.label,{size:14});
  const pin=sv('circle',{cx:70,cy:y,r:7,fill:'#9ce8ff'});markInputPin(pin,p,onInputClick);svg.append(pin);
  badgeValue(svg,94,y+21,valueFor(wave,p.id,displayValues));
 });
 graph.outputs.forEach((p,i)=>{
  const y=rowTop+i*gap;
  outYs.set(p.id,y);
  label(svg,1060,y-11,p.label,{size:14});
  svg.append(sv('circle',{cx:1030,cy:y,r:4.4,fill:'#9ce8ff'}));
  badgeValue(svg,1090,y+19,valueFor(wave,p.id,displayValues));
 });
 const nodeY=new Map(gates.map((g,i)=>[g.id,rowTop+i*gap]));
 const producer=new Map(gates.map(g=>[g.out,g.id]));
 const ncols=graph.id==='full_adder'?3:1;
 const colFor=(id)=>graph.id!=='full_adder'?0:(id==='xor_ab'||id==='carry_ab'?0:id==='sum_xor'||id==='carry_x'?1:2);
 const nodeX=id=>470+colFor(id)*190;
 const sourcePos=net=>{
   if(portYs.has(net))return [70,portYs.get(net)];
   const g=producer.get(net);return g?[nodeX(g)+67,nodeY.get(g)]:null;
 };
 const svgGate=root.ASICGHDLSymbols?.cellSymbol;
 gates.forEach((g,i)=>{
  const x=nodeX(g.id),y=nodeY.get(g.id);
  const group=sv('g');svg.append(group);
  if(typeof svgGate==='function')svgGate(group,g.type,x,y,170,60);
  else group.append(sv('rect',{x:x-55,y:y-26,width:110,height:52,rx:8,stroke:'#60eac4',fill:'#10293a'}));
  const title=sv('title',{},`${g.id}: ${g.type}(${g.ins.join(', ')}) → ${g.out}`);group.append(title);
  label(svg,x,y+43,g.id,{anchor:'middle',size:12,color:'#aac9df'});
  // Each input has a distinct pin, routed independently with a horizontal trunk.
  g.ins.forEach((net,k)=>{
    const sy=sourcePos(net);if(!sy)return;
    const iy=y+(k-(g.ins.length-1)/2)*18;
    const targetX=x-73;
    const bend=sy[0]+Math.max(38,Math.min(100,(targetX-sy[0])/2))+k*7;
    path(svg,[[sy[0],sy[1]],[bend,sy[1]],[bend,iy],[targetX,iy]],'#49d5df',2.15);
    svg.append(sv('circle',{cx:targetX,cy:iy,r:3.6,fill:'#b8f4ff'}));
  });
  const dest=outYs.get(g.out);if(dest!==undefined){
   const x0=x+68;const bend=880+i*9;
   path(svg,[[x0,y],[bend,y],[bend,dest],[1030,dest]],'#70c5fa',2.3);
   svg.append(sv('circle',{cx:x0,cy:y,r:4,fill:'#64eaca'}));
  }
 });
 return height;
}
function render(container,graph,{wave=null,style='dataflow',afterRun=false,displayValues=null,onInputClick=null}={}){
 container.replaceChildren();
 if(!graph?.allPortsValid){
  const p=document.createElement('p');p.className='ghdl-schema-warning';p.textContent='Ports could not be parsed from the selected VHDL entity. Check the entity name and port declarations.';container.append(p);return null;
 }
 const svg=sv('svg',{role:'img','aria-label':`${graph.title} connected functional circuit with ${graph.inputs.length} inputs and ${graph.outputs.length} outputs`,tabindex:0});
 svg.classList.add('ghdl-functional-svg');
 svg.append(sv('rect',{x:5,y:5,width:1238,height:1800,fill:'#051522',stroke:'none'}));
 const h=graph.type==='gates'?drawGates(svg,graph,wave,displayValues,onInputClick):drawBlock(svg,graph,wave,displayValues,onInputClick);
 label(svg,625,h-35,graph.detail,{anchor:'middle',size:12,color:'#9fbad6'});
 label(svg,625,46,graph.title+' · FUNCTIONAL SCHEMATIC',{anchor:'middle',size:22,color:'#7bf4cb',weight:700});
 const footer=sv('title',{},afterRun?'Simulation completed; port values reflect the waveform cursor where available.':'Reference schematic. Run simulation to get measured pin values.');svg.append(footer);
 container.append(svg);
 return svg;
}
root.ASICGHDLSchematic={render,measuredValue};
})(window);
