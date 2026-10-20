/* ASIC-Skill: render synthesized connectivity as editable ROUTES from the actual Yosys netlist.
 * Dragging a route never changes netlist source/destination or simulation data.
 * This renderer is deliberately isolated to the cocotb schematic content mount.
 */
(function(root){'use strict';
const NS='http://www.w3.org/2000/svg';
const S=(type,attrs={},value)=>{const el=document.createElementNS(NS,type);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));if(value!==undefined)el.textContent=value;return el;};
const ROW=100, FIRST_Y=115, TOP_LANE=55;
function gate(svg,c,x,y){
 const tag=String(c.type).toUpperCase().replace(/^\$_|_$/g,'');
 const g=S('g',{'data-cell':c.name});svg.append(g);
 if(/^(AND|NAND)$/.test(tag))g.append(S('path',{d:`M${x-43} ${y-22} H${x-15} Q${x+45} ${y-22} ${x+45} ${y} Q${x+45} ${y+22} ${x-15} ${y+22} H${x-43} Z`,fill:'#112d40',stroke:'#59e7cc','stroke-width':2}));
 else if(/^(OR|NOR|XOR|XNOR)$/.test(tag)){
  g.append(S('path',{d:`M${x-43} ${y-22} Q${x-14} ${y} ${x-43} ${y+22} Q${x+1} ${y+27} ${x+45} ${y} Q${x+2} ${y-27} ${x-43} ${y-22} Z`,fill:'#112d40',stroke:'#59e7cc','stroke-width':2}));
  if(/XOR|XNOR/.test(tag))g.append(S('path',{d:`M${x-53} ${y-22} Q${x-24} ${y} ${x-53} ${y+22}`,fill:'none',stroke:'#59e7cc','stroke-width':2}));
 }else if(/^(NOT|BUF)$/.test(tag))g.append(S('path',{d:`M${x-41} ${y-22} L${x+33} ${y} L${x-41} ${y+22} Z`,fill:'#112d40',stroke:'#59e7cc','stroke-width':2}));
 else g.append(S('rect',{x:x-50,y:y-27,width:100,height:54,rx:7,fill:'#112d40',stroke:'#59e7cc','stroke-width':2}));
 if(/^(NOT|NAND|NOR|XNOR)$/.test(tag))g.append(S('circle',{cx:x+51,cy:y,r:6,fill:'#061421',stroke:'#59e7cc','stroke-width':2}));
 if(!/^(AND|NAND|OR|NOR|XOR|XNOR|NOT|BUF)$/.test(tag))g.append(S('text',{x,y:y+4,'text-anchor':'middle','font-size':12,fill:'#e7f7ff','font-family':'monospace'},tag.slice(0,16)));
 else g.append(S('text',{x,y:y+46,'text-anchor':'middle','font-size':11,fill:'#b9d4e3'},tag));
 g.append(S('title',{},`${c.name} : ${c.type}`));
}
function makeLayers(cells,drivers){
 const layers=new Map(cells.map(c=>[c.name,1]));
 // Bounded relaxation prevents combinational cycles / feedback from hanging layout.
 for(let k=0;k<Math.min(20,cells.length);k++){
  let changed=false;
  for(const c of cells){let level=1;
   for(const [port,bits] of Object.entries(c.connections||{})){
    if(c.port_directions?.[port]!=='input')continue;
    for(const bit of bits){const src=drivers.get(String(bit));
     if(src?.kind==='cell'&&src.id!==c.name)level=Math.max(level,Math.min(15,(layers.get(src.id)||1)+1));
    }
   }
   if(level>layers.get(c.name)){layers.set(c.name,level);changed=true;}
  }
  if(!changed)break;
 }
 return layers;
}
function render(host,top,module){
 // Only clear the dedicated schematic VIEW container, never its mode toolbar.
 host.replaceChildren();
 const cells=Object.entries(module.cells||{}).map(([name,data])=>({name,...data}));
 const ports=Object.entries(module.ports||{}).map(([name,data])=>({name,...data}));
 const totalPorts=ports.reduce((n,p)=>n+(p.bits||[]).length,0);
 if(cells.length>120||totalPorts>96){
  host.textContent=`Synthesis produced ${cells.length} cells and ${totalPorts} port bits. This connection view is limited to 120 cells / 96 port bits. Use the interactive or automatic-layout view for supported larger schematics.`;return;
 }
 const pIns=[],pOut=[];
 for(const p of ports)(p.bits||[]).forEach((bit,i)=>{
  const signal={bit,name:p.bits.length===1?p.name:`${p.name}[${i+(p.offset||0)}]`};
  if(p.direction==='input')pIns.push(signal);else if(p.direction==='output')pOut.push(signal);
 });
 const drivers=new Map();
 for(const p of pIns)drivers.set(String(p.bit),{kind:'input',id:p.name});
 for(const c of cells)for(const [port,bits] of Object.entries(c.connections||{})){
  if(c.port_directions?.[port]==='output')for(const bit of bits)drivers.set(String(bit),{kind:'cell',id:c.name});
 }
 const layers=makeLayers(cells,drivers);
 const maxLayer=Math.max(1,...layers.values());
 const columns=[pIns.map(p=>({type:'port',kind:'input',...p})),
  ...Array.from({length:maxLayer},(_,i)=>cells.filter(c=>layers.get(c.name)===i+1).map(c=>({kind:'cell',...c}))),
  pOut.map(p=>({type:'port',kind:'output',...p}))];
 const rows=Math.max(2,...columns.map(column=>column.length));
 const height=FIRST_Y+(rows-1)*ROW+130, colWidth=240;
 const width=Math.max(1000,220+(maxLayer+1)*colWidth);
 const points=new Map();
 columns.forEach((group,j)=>group.forEach((item,i)=>{
  const key=item.kind==='cell'?`cell:${item.name}`:`${item.kind}:${item.name}`;
  points.set(key,{x:110+j*colWidth,y:FIRST_Y+i*ROW,j,kind:item.kind});
 }));
 const viewport=document.createElement('div');viewport.className='cocotb-yosys-viewport';
 const toolbar=document.createElement('div');toolbar.className='cocotb-yosys-tools';
 const note=document.createElement('span');note.textContent='Connection View · drag a turquoise wire bend to adjust layout · connections stay unchanged';toolbar.append(note);
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);toolbar.append(b);return b;};
 const svg=S('svg',{viewBox:`0 0 ${width} ${height}`,width,height,role:'img','aria-label':`Generated circuit schematic for ${top}`});
 svg.classList?.add('cocotb-yosys-svg');
 const background=S('rect',{x:2,y:2,width:width-4,height:height-4,rx:9,fill:'#061421',stroke:'#275b74'});svg.append(background);
 svg.append(S('text',{x:width/2,y:27,'text-anchor':'middle','font-size':18,fill:'#a2f2fa','font-family':'monospace'},`${top} · Circuit Connectivity`));
 const edgeLayer=S('g',{'aria-label':'Netlist wires'});svg.append(edgeLayer);
 const gatesLayer=S('g');svg.append(gatesLayer);
 const connections=[],constantPins=[];
 function connect(source,target,bit,id,index=0,amount=1){
  const src=points.get(source.kind==='cell'?`cell:${source.id}`:`input:${source.id}`);
  const dst=points.get(target.kind==='cell'?`cell:${target.id}`:`output:${target.id}`);
  if(!src||!dst)return;
  // The wire touches the graphical edge of the source and destination cells.
  const endOffset=target.kind==='cell'?Math.max(-17,Math.min(17,(index-(amount-1)/2)*7)):0;
  const a={x:src.x+(src.kind==='cell'?51:50),y:src.y};
  const b={x:dst.x-(dst.kind==='cell'?44:48),y:dst.y+endOffset};
  connections.push({id,source,target,bit,a,b,src,dst,route:null});
 }
 for(const c of cells){let index=0;
  const inputBits=Object.entries(c.connections||{}).filter(([pin])=>c.port_directions?.[pin]==='input')
   .flatMap(([pin,bits])=>bits.map((bit,part)=>({pin,bit,part})));
  for(const pin of inputBits){const src=drivers.get(String(pin.bit));
   if(src&&!(src.kind==='cell'&&src.id===c.name))connect(src,{kind:'cell',id:c.name},pin.bit,`${c.name}:${pin.pin}[${pin.part}]`,index,inputBits.length);
   else if(/^[01xz]$/i.test(String(pin.bit))){
    const pt=points.get(`cell:${c.name}`);
    if(pt)constantPins.push({x:pt.x-44,y:pt.y+Math.max(-17,Math.min(17,(index-(inputBits.length-1)/2)*7)),bit:pin.bit});
   }
   ++index;
  }
 }
 for(const p of pOut){const src=drivers.get(String(p.bit));
  if(src)connect(src,{kind:'output',id:p.name},p.bit,`out:${p.name}`);
  else if(/^[01xz]$/i.test(String(p.bit))){const pt=points.get(`output:${p.name}`);if(pt)constantPins.push({x:pt.x-48,y:pt.y,bit:p.bit});}
 }
 // Channels are located BETWEEN rows of gates, never through a gate symbol.
 const lanes=[TOP_LANE];for(let i=0;i<rows;i++)lanes.push(FIRST_Y+ROW*i+ROW/2);
 const nearestLane=y=>lanes.reduce((best,cur)=>Math.abs(y-cur)<Math.abs(y-best)?cur:best,lanes[0]);
 function defaultLane(edge,i){
  if(edge.src.j>=edge.dst.j)return TOP_LANE; // feedback/same-column escapes above all gates
  const midpoint=(edge.a.y+edge.b.y)/2;
  const lane=nearestLane(midpoint);
  // A few independent tracks within each safe inter-row corridor.
  const offset=[0,6,-6,12,-12][i%5];
  return lane+offset;
 }
 function drawPath(edge){
  const x1=edge.src.x+70,x2=edge.dst.x-70,ly=edge.route;
  // Only vertical segments within the free space outside source/target symbols;
  // the long horizontal crossing always follows a between-gates routing lane.
  return `M${edge.a.x} ${edge.a.y} H${x1} V${ly} H${x2} V${edge.b.y} H${edge.b.x}`;
 }
 function setLane(edge,newY,{snap=true}={}){
  edge.route=snap?nearestLane(newY):newY;
  edge.path.setAttribute('d',drawPath(edge));
  edge.hit.setAttribute('d',drawPath(edge));
  edge.handle.setAttribute('cx',(edge.src.x+edge.dst.x)/2);
  edge.handle.setAttribute('cy',edge.route);
 }
 let scaled=1;
 function applyZoom(){svg.style.width=Math.round(width*scaled)+'px';svg.style.height=Math.round(height*scaled)+'px';}
 function fit(){
  const spaceW=Math.max(300,(viewport.clientWidth||host.clientWidth||1100)-28);
  const spaceH=Math.max(250,(viewport.clientHeight||650)-26);
  scaled=Math.max(0.12,Math.min(1,spaceW/width,spaceH/height));
  applyZoom();viewport.scrollLeft=0;viewport.scrollTop=0;
 }
 button('Fit',fit);
 button('− Zoom',()=>{scaled=Math.max(0.12,scaled/1.25);applyZoom();});
 button('+ Zoom',()=>{scaled=Math.min(3,scaled*1.25);applyZoom();});
 button('Reset Routes',()=>connections.forEach((edge,i)=>setLane(edge,defaultLane(edge,i),{snap:false})));
 for(const [i,edge] of connections.entries()){
  edge.route=defaultLane(edge,i);
  const group=S('g',{'class':'cocotb-yosys-route','data-bit':String(edge.bit)});
  edge.path=S('path',{d:drawPath(edge),class:'cocotb-yosys-wire',stroke:'#55d5eb',fill:'none','stroke-width':1.8,'stroke-linejoin':'round'});
  edge.hit=S('path',{d:drawPath(edge),class:'cocotb-yosys-wire-hit',stroke:'transparent',fill:'none','stroke-width':12});
  const title=S('title',{},`${edge.source.id} → ${edge.target.id} (bit ${edge.bit}); drag bend to route`);
  group.append(edge.path,edge.hit,title);edgeLayer.append(group);
  const handle=S('circle',{cx:(edge.src.x+edge.dst.x)/2,cy:edge.route,r:6,
   class:'cocotb-yosys-route-handle','data-wire':edge.id,tabindex:0,role:'slider',
   'aria-label':`Routing lane for ${edge.source.id} to ${edge.target.id}`});
  edge.handle=handle;group.append(handle);
  // Drag either the wire itself or its bend handle, as in Logic Simulation Lab.
  // Only the routing channel moves: no source/target pin is reassigned.
  const bindWireDrag=target=>{
   let dragging=false;
   target.addEventListener('pointerdown',event=>{
    event.preventDefault?.();dragging=true;
    target.setPointerCapture?.(event.pointerId);handle.classList?.add('active');
   });
   target.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const rect=svg.getBoundingClientRect?.();
    if(!rect?.height)return;
    const y=(event.clientY-rect.top)*height/rect.height;
    setLane(edge,y);
   });
   const endDrag=event=>{
    if(!dragging)return;
    dragging=false;
    if(target.hasPointerCapture?.(event.pointerId))target.releasePointerCapture(event.pointerId);
    handle.classList?.remove('active');
   };
   target.addEventListener('pointerup',endDrag);
   target.addEventListener('pointercancel',endDrag);
  };
  bindWireDrag(handle);bindWireDrag(edge.hit);
  handle.addEventListener('keydown',event=>{
   if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
   event.preventDefault?.();const ix=lanes.indexOf(nearestLane(edge.route));
   setLane(edge,lanes[Math.max(0,Math.min(lanes.length-1,ix+(event.key==='ArrowUp'?-1:1)))]);
  });
 }
 for(const pin of constantPins){
  // Yosys constants are actual netlist values, not invented gate inputs.
  gatesLayer.append(S('path',{d:`M${pin.x-33} ${pin.y} H${pin.x}`,fill:'none',stroke:'#edc477','stroke-width':2}));
  gatesLayer.append(S('text',{x:pin.x-37,y:pin.y-4,'text-anchor':'end',fill:'#ffd894','font-size':11},`CONST ${pin.bit}`));
 }
 for(const p of pIns){const point=points.get(`input:${p.name}`);if(!point)continue;
  gatesLayer.append(S('rect',{x:point.x-65,y:point.y-20,width:115,height:40,rx:7,fill:'#12354b',stroke:'#4bbce0'}));
  gatesLayer.append(S('text',{x:point.x-7,y:point.y+4,'text-anchor':'middle','font-size':12,fill:'#e5f6ff','font-family':'monospace'},p.name));
 }
 for(const c of cells){const point=points.get(`cell:${c.name}`);if(point)gate(gatesLayer,c,point.x,point.y);}
 for(const p of pOut){const point=points.get(`output:${p.name}`);if(!point)continue;
  gatesLayer.append(S('rect',{x:point.x-48,y:point.y-20,width:115,height:40,rx:7,fill:'#12354b',stroke:'#4bbce0'}));
  gatesLayer.append(S('text',{x:point.x+9,y:point.y+4,'text-anchor':'middle','font-size':12,fill:'#e5f6ff','font-family':'monospace'},p.name));
 }
 // Hit targets are stacked over gates only at handles, and never change electrical nets.
 svg.append(S('text',{x:width/2,y:height-24,'text-anchor':'middle','font-size':12,fill:'#b1cadb'},`${cells.length} cells · ${pIns.length} input bits · ${pOut.length} output bits · ${connections.length} drawn wires`));
 viewport.append(svg);host.append(toolbar,viewport);
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(fit);else fit();
}
root.ASICNetlistSchematic={render};
})(window);
