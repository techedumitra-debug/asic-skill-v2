/* ASIC-Skill Logic Simulation — isolated, client-side, single-bit gate simulator.
   Educational combinational presets are real connected networks, not mocked outputs. */
(()=>{'use strict';
const $=id=>document.getElementById(id), root=$('logic-simulation-root'); if(!root)return;
const types=Object.freeze({INPUT:0,OUTPUT:1,NOT:1,AND:2,OR:2,XOR:2,NAND:2,NOR:2,XNOR:2});
const STORAGE='asic_skill_logic_simulator_v2';
const oldStorage='asic_logic_simulation_v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let nodes=[],wires=[],selected=null,pending=null,seq=1,drag=null,values={},currentExample='half-adder';
let memorySave=null,customDraft=null,projectName='My Logic Project';
const uid=()=>`lg${seq++}`;
function node(type,x,y,label){const n={id:uid(),type,x,y,label:label||type,value:0};nodes.push(n);return n;}
function join(src,out,dst,pin){wires.push({id:uid(),src:typeof src==='string'?src:src.id,out:out||0,dst:typeof dst==='string'?dst:dst.id,pin});}
const find=id=>nodes.find(n=>n.id===id),incoming=(n,p)=>wires.find(w=>w.dst===n.id&&w.pin===p);
const I=(label,y,x=50)=>node('INPUT',x,y,label),O=(label,y,x=1030)=>node('OUTPUT',x,y,label),G=(type,x,y,label)=>node(type,x,y,label||type);
const connect=(src,dst,p=0)=>join(src,0,dst,p);
const gate=(type,x,y,label,a,b)=>{const g=G(type,x,y,label);if(a)connect(a,g,0);if(b)connect(b,g,1);return g;};
const output=(label,y,src,x=1030)=>{const o=O(label,y,x);connect(src,o);return o;};
function oneGate(type){const a=I('A',170),b=type==='NOT'?null:I('B',390);const g=gate(type,470,275,type.toLowerCase()+'_1',a,b);output('Y',275,g);}
function allGates(){const a=I('A',165),b=I('B',450);['NOT A','NOT B','AND','OR','XOR','NAND','NOR','XNOR'].forEach((kind,i)=>{const y=25+i*80;const name=kind.replace(' ','_');const g=gate(kind.startsWith('NOT')?'NOT':kind,455,y,name,kind==='NOT B'?b:a,kind.startsWith('NOT')?null:b);output(name,y,g);});}
function halfAdder(){const a=I('A',155),b=I('B',425);const x=gate('XOR',445,145,'xor_sum',a,b),c=gate('AND',445,390,'and_carry',a,b);output('SUM',145,x);output('CARRY',390,c);}
function fullAdder(){const a=I('A',100),b=I('B',305),ci=I('CIN',540);const ab=gate('XOR',315,115,'a_xor_b',a,b),sum=gate('XOR',665,145,'xor_cin',ab,ci);const ac=gate('AND',315,345,'a_and_b',a,b),bc=gate('AND',670,375,'carry_terms',ab,ci),carry=gate('OR',850,480,'carry_or',ac,bc);output('SUM',145,sum);output('COUT',480,carry);}
function binaryGray(){const b1=I('B1',170),b0=I('B0',430);output('G1',170,b1);output('G0',430,gate('XOR',500,430,'gray_xor',b1,b0));}
function grayBinary(){const g1=I('G1',170),g0=I('G0',430);output('B1',170,g1);output('B0',430,gate('XOR',500,430,'binary_xor',g1,g0));}
function mux2(){const d0=I('D0',90),d1=I('D1',290),s=I('SEL',525);const ns=gate('NOT',275,500,'not_sel',s);const a=gate('AND',515,115,'d0_enabled',d0,ns),b=gate('AND',515,325,'d1_enabled',d1,s);output('Y',230,gate('OR',780,230,'mux_or',a,b));}
function mux4(){const d=[60,165,270,375].map((y,i)=>I('D'+i,y)),s0=I('S0',500),s1=I('S1',605);const n0=gate('NOT',245,490,'not_s0',s0),n1=gate('NOT',245,600,'not_s1',s1);const cond=[[n1,n0],[n1,s0],[s1,n0],[s1,s0]].map(([a,b],i)=>gate('AND',380,65+145*i,'sel_'+i,a,b));const terms=d.map((v,i)=>gate('AND',590,65+145*i,'data_'+i,v,cond[i]));const or0=gate('OR',755,145,'or_low',terms[0],terms[1]),or1=gate('OR',755,420,'or_high',terms[2],terms[3]);output('Y',280,gate('OR',910,280,'mux_result',or0,or1));}
function demux4(){const d=I('D',145),s0=I('S0',385),s1=I('S1',575);const n0=gate('NOT',260,425,'not_s0',s0),n1=gate('NOT',260,555,'not_s1',s1);const choices=[[n1,n0],[n1,s0],[s1,n0],[s1,s0]];choices.forEach(([a,b],i)=>{const y=80+145*i;const decode=gate('AND',520,y,'select_'+i,a,b),g=gate('AND',750,y,'data_'+i,d,decode);output('Y'+i,y,g);});}
function decoder4(){const a=I('A1',140),b=I('A0',350),en=I('EN',575);const na=gate('NOT',265,130,'not_a1',a),nb=gate('NOT',265,370,'not_a0',b);[[na,nb],[na,b],[a,nb],[a,b]].forEach(([u,v],i)=>{const y=75+155*i;const g=gate('AND',515,y,'addr_'+i,u,v);output('Y'+i,y,gate('AND',765,y,'enable_'+i,g,en));});}
function encoder4(){const d=[55,200,360,515].map((y,i)=>I('D'+i,y));const y0=gate('OR',540,180,'y0_or',d[1],d[3]),y1=gate('OR',540,390,'y1_or',d[2],d[3]);output('Y0',180,y0);output('Y1',390,y1);const v0=gate('OR',345,540,'valid_a',d[0],d[1]),v1=gate('OR',580,560,'valid_b',d[2],d[3]);output('VALID',575,gate('OR',830,565,'valid',v0,v1));}
function parity(odd){const ins=[70,190,380,530].map((y,i)=>I('D'+i,y));const x0=gate('XOR',330,145,'xor01',ins[0],ins[1]),x1=gate('XOR',330,455,'xor23',ins[2],ins[3]);const x2=gate('XOR',685,295,'parity_xor',x0,x1);const last=odd?gate('NOT',855,295,'odd_parity',x2):x2;output(odd?'ODD_PARITY':'EVEN_PARITY',295,last);}
function comparator1(){const a=I('A',175),b=I('B',460);const nb=gate('NOT',240,470,'not_b',b),na=gate('NOT',240,170,'not_a',a);output('GT',110,gate('AND',550,110,'greater',a,nb));output('EQ',325,gate('XNOR',550,325,'equal',a,b));output('LT',535,gate('AND',550,535,'less',na,b));}
function majority3(){const a=I('A',100),b=I('B',325),c=I('C',540);const ab=gate('AND',385,125,'ab',a,b),ac=gate('AND',385,315,'ac',a,c),bc=gate('AND',385,505,'bc',b,c);const t=gate('OR',650,250,'ab_or_ac',ab,ac);output('MAJORITY',370,gate('OR',875,370,'majority',t,bc));}
function alu1(){const a=I('A',100),b=I('B',295),s=I('MODE',525);const and=gate('AND',335,130,'and_mode',a,b),xor=gate('XOR',335,340,'xor_mode',a,b),ns=gate('NOT',340,545,'not_mode',s);const x=gate('AND',650,150,'select_and',and,ns),y=gate('AND',650,415,'select_xor',xor,s);output('Y',275,gate('OR',890,275,'alu_or',x,y));}
const defaults={
 'and':()=>oneGate('AND'),'or':()=>oneGate('OR'),'not':()=>oneGate('NOT'),
 'nand':()=>oneGate('NAND'),'nor':()=>oneGate('NOR'),'xor':()=>oneGate('XOR'),
 'xnor':()=>oneGate('XNOR'),'all-gates':allGates,
 'half-adder':halfAdder,'full-adder':fullAdder,
 'binary-gray':binaryGray,'gray-binary':grayBinary,
 'mux':mux2,'mux4':mux4,'demux1x4':demux4,'decoder2x4':decoder4,
 'encoder4x2':encoder4,'even-parity4':()=>parity(false),'odd-parity4':()=>parity(true),
 'comparator1':comparator1,'majority3':majority3,'alu1':alu1
};
const descriptions={
 'all-gates':'Eight gate functions with shared A/B inputs.',
 'half-adder':'Two-input half adder: SUM = A XOR B, CARRY = A AND B.',
 'full-adder':'Full adder: SUM = A XOR B XOR CIN; COUT = AB + CIN(A XOR B).',
 'binary-gray':'2-bit binary to Gray: G1=B1; G0=B1 XOR B0.',
 'gray-binary':'2-bit Gray to binary: B1=G1; B0=G1 XOR G0.',
 'mux':'Two-input multiplexer selected by SEL.','mux4':'Four-input multiplexer with S1/S0 select.',
 'demux1x4':'One input routed to four outputs by S1/S0.','decoder2x4':'Enabled 2-to-4 one-hot decoder.',
 'encoder4x2':'Simple 4:2 OR encoder; requires one-hot inputs; VALID indicates activity.',
 'even-parity4':'XOR reduction for four data bits.','odd-parity4':'Inverted XOR reduction for four data bits.',
 'comparator1':'One-bit A > B, A = B, A < B comparator.',
 'majority3':'Output is 1 when at least two of three inputs are 1.',
 'alu1':'One-bit ALU: MODE=0 AND; MODE=1 XOR.'
};
function evaluate(n,overrides={},stack=new Set(),cache=new Map()){
 if(cache.has(n.id))return cache.get(n.id);
 if(stack.has(n.id))return 'X';
 if(n.type==='INPUT'){const v=overrides[n.id]??n.value;cache.set(n.id,v);return v;}
 stack.add(n.id);
 const arg=p=>{const w=incoming(n,p),src=w&&find(w.src);return src?evaluate(src,overrides,stack,cache):'X';};
 const a=arg(0),b=types[n.type]===2?arg(1):null;let v='X';
 if(n.type==='OUTPUT')v=a;
 else if(n.type==='NOT')v=a==='X'?'X':1-a;
 else if(a!=='X'&&b!=='X'){
  const and=a&b,or=a|b,xor=a^b;
  v=({AND:and,OR:or,XOR:xor,NAND:1-and,NOR:1-or,XNOR:1-xor})[n.type]??'X';
 }
 stack.delete(n.id);cache.set(n.id,v);return v;
}
function evalAll(overrides){const cache=new Map();return Object.fromEntries(nodes.map(n=>[n.id,evaluate(n,overrides,new Set(),cache)]));}
function connector(n,kind,p=0){return kind==='out'?[n.x+100,n.y+27]:[n.x,n.y+(types[n.type]===2?(p===0?17:39):27)];}
function shape(n){
 const label=esc(n.label),sel=selected?.kind==='node'&&selected.id===n.id;
 let figure=`<rect x="0" y="0" width="100" height="54" rx="12" class="logic-gate-body ${sel?'logic-selected':''}"/>`;
 if(['AND','NAND'].includes(n.type))figure=`<path class="logic-gate-body ${sel?'logic-selected':''}" d="M8 4 H49 A46 23 0 0 1 49 50 H8 Z"/>`;
 if(['OR','NOR','XOR','XNOR'].includes(n.type))figure=`<path class="logic-gate-body ${sel?'logic-selected':''}" d="M8 4 Q32 27 8 50 Q60 56 92 27 Q60 -2 8 4 Z"/>`;
 if(n.type==='NOT')figure=`<path class="logic-gate-body ${sel?'logic-selected':''}" d="M13 4 L85 27 L13 50 Z"/>`;
 const ports=[...Array(types[n.type]||0)].map((_,p)=>`<circle class="logic-port logic-input" data-port="input" data-node="${n.id}" data-pin="${p}" cx="0" cy="${types[n.type]===2?(p===0?17:39):27}" r="6" fill="#6edcf7"/>`).join('');
 const out=n.type==='OUTPUT'?'':`<circle class="logic-port" data-port="output" data-node="${n.id}" cx="100" cy="27" r="6" fill="#5beab0"/>`;
 const v=values[n.id];
 return `<g class="logic-node" data-node="${n.id}" transform="translate(${n.x},${n.y})">${figure}${ports}${out}<text x="50" y="29" font-size="13" text-anchor="middle">${n.type==='INPUT'||n.type==='OUTPUT'?label:n.type}</text><text x="50" y="72" font-size="12" text-anchor="middle">${n.type==='INPUT'||n.type==='OUTPUT'?String(v):label+' · '+v}</text></g>`;
}
function feedback(message,kind='info'){
 const el=$('logic-action-feedback');if(!el)return;
 el.textContent=message;el.dataset.kind=kind;
}
function render(){
 values=evalAll({});const svg=$('logic-canvas');
 const gr=`<defs><pattern id="lg-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#25435b"/></pattern></defs><rect width="1200" height="700" fill="url(#lg-grid)"/>`;
 let paths='';for(const w of wires){const from=find(w.src),to=find(w.dst);if(!from||!to)continue;const [x1,y1]=connector(from,'out'),[x2,y2]=connector(to,'in',w.pin),mid=(x1+x2)/2;paths+=`<path data-wire="${w.id}" class="logic-wire ${selected?.kind==='wire'&&selected.id===w.id?'selected':''}" d="M${x1} ${y1} C${mid} ${y1},${mid} ${y2},${x2} ${y2}"/>`;}
 svg.innerHTML=gr+paths+nodes.map(shape).join('');
 $('logic-count').textContent=`${nodes.length} components · ${wires.length} wires`;
 const ins=nodes.filter(n=>n.type==='INPUT');$('logic-input-controls').innerHTML=ins.length?ins.map(n=>`<button type="button" data-toggle="${n.id}" aria-label="Toggle ${esc(n.label)}">${esc(n.label)} = ${n.value}</button>`).join(''):'No input switches';
 const outs=nodes.filter(n=>n.type==='OUTPUT');$('logic-output-values').textContent=outs.length?outs.map(n=>`${n.label}: ${values[n.id]}`).join(' · '):'No output probes';
 $('logic-status').textContent=pending?`Connecting from ${find(pending)?.label||'output'} — click an input pin (or press Escape to cancel)`:'Click a gate to select; click a green output port then a cyan input port to connect.';
 renderProperties();renderTruth();
}
function renderProperties(){const box=$('logic-selection');
 if(!selected){box.innerHTML='<p class="logic-hint">Select a component or wire to edit/delete it.</p>';return;}
 if(selected.kind==='wire'){box.innerHTML='<p class="logic-hint">Selected wire</p><button type="button" id="logic-delete-selected">Delete wire</button>';return;}
 const n=find(selected.id);if(!n){selected=null;box.innerHTML='';return;}
 box.innerHTML=`<div class="logic-property"><label for="logic-name">Label</label><input id="logic-name" value="${esc(n.label)}" maxlength="36"/><div>${esc(n.type)} · Value: ${values[n.id]}</div><button type="button" id="logic-delete-selected">Remove component</button></div>`;
 $('logic-name').addEventListener('change',e=>{n.label=e.target.value.trim()||n.type;render();});
}
function renderTruth(){const el=$('logic-truth'),ins=nodes.filter(n=>n.type==='INPUT'),outs=nodes.filter(n=>n.type==='OUTPUT');
 if(!ins.length||!outs.length){el.innerHTML='<p class="logic-meta">Add at least one input switch and one output probe.</p>';return;}
 if(ins.length>8){el.innerHTML='<p class="logic-meta">Truth-table preview supports up to eight one-bit inputs (256 rows). Reduce input count to enumerate more combinations.</p>';return;}
 let s='<table><thead><tr>'+ins.map(n=>`<th>${esc(n.label)}</th>`).join('')+outs.map(n=>`<th>${esc(n.label)}</th>`).join('')+'</tr></thead><tbody>';
 const current=ins.reduce((acc,n)=>acc*2+(n.value===1?1:0),0);
 for(let bits=0;bits<(1<<ins.length);bits++){
  const vars={};ins.forEach((n,i)=>{vars[n.id]=(bits>>(ins.length-1-i))&1;});const val=evalAll(vars);
  s+=`<tr${bits===current?' class="logic-current-row"':''}>`+ins.map(n=>`<td>${vars[n.id]}</td>`).join('')+outs.map(n=>`<td${val[n.id]==='X'?' class="error"':''}>${val[n.id]}</td>`).join('')+'</tr>';
 }el.innerHTML=s+'</tbody></table><p class="logic-meta">Highlighted row = current switches. X = floating input or cyclic dependency. All results follow the visible wiring.</p>';
}
function captureCustom(){if(currentExample==='custom')customDraft={nodes:structuredClone(nodes),wires:structuredClone(wires),seq,projectName};}
function restoreCustom(){
  if(customDraft){nodes=structuredClone(customDraft.nodes);wires=structuredClone(customDraft.wires);seq=customDraft.seq;projectName=customDraft.projectName||'My Logic Project';}
  else{nodes=[];wires=[];seq=1;projectName='My Logic Project';}
  selected=null;pending=null;drag=null;currentExample='custom';
  $('logic-example').value='custom';$('logic-project-name').disabled=false;$('logic-project-name').value=projectName;
  $('logic-example-description').textContent='Your independent project · drag INPUT, OUTPUT and gates from the palette; then connect pins and toggle inputs.';
  render();
}
function newProject(){
 captureCustom();customDraft=null;nodes=[];wires=[];seq=1;projectName='My Logic Project';
 restoreCustom();feedback('Blank project ready. Drag INPUT, OUTPUT and gates from the palette to begin.', 'success');
}
function setExample(which){
 if(which==='custom'){if(currentExample==='custom')captureCustom();restoreCustom();return which;}
 if(!Object.hasOwn(defaults,which))which='half-adder';
 captureCustom();
 nodes=[];wires=[];selected=null;pending=null;drag=null;seq=1;currentExample=which;defaults[which]();$('logic-example').value=which;$('logic-project-name').disabled=true;$('logic-project-name').value=projectName;
 $('logic-example-description').textContent=descriptions[which]||'Edit the gate network and inspect its actual truth table.';
 render();return which;
}
function addGate(type,position){
 if(!Object.hasOwn(types,type)||nodes.length>=120)return;
 const off=nodes.length,x=270+(off%5)*115,y=80+Math.floor(off/5)*110;
 const nx=position?Math.max(0,Math.min(1090,Math.round(position.x-50))):Math.min(x,1090);
 const ny=position?Math.max(0,Math.min(620,Math.round(position.y-27))):Math.min(y,620);
 const label=type==='INPUT'?'IN'+(nodes.filter(n=>n.type==='INPUT').length+1):type==='OUTPUT'?'OUT'+(nodes.filter(n=>n.type==='OUTPUT').length+1):type;
 const n=node(type,nx,ny,label);selected={kind:'node',id:n.id};render();
}
function del(){if(!selected)return;if(selected.kind==='wire')wires=wires.filter(w=>w.id!==selected.id);else{nodes=nodes.filter(n=>n.id!==selected.id);wires=wires.filter(w=>w.src!==selected.id&&w.dst!==selected.id);}selected=null;render();}
function pointerPosition(event){const svg=$('logic-canvas'),pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;const matrix=svg.getScreenCTM();return matrix?pt.matrixTransform(matrix.inverse()):{x:0,y:0};}
function validateStored(obj){
 if(!obj||!Array.isArray(obj.nodes)||!Array.isArray(obj.wires)||obj.nodes.length>120||obj.wires.length>300)throw Error('Invalid circuit data');
 const unique=new Set();const cleanNodes=obj.nodes.map(n=>{
  if(!n||!Object.hasOwn(types,n.type)||!/^lg\d+$/.test(String(n.id))||unique.has(n.id))throw Error('Invalid component');
  unique.add(n.id);
  return {id:n.id,type:n.type,x:Math.max(0,Math.min(1090,Number(n.x)||0)),y:Math.max(0,Math.min(620,Number(n.y)||0)),label:String(n.label??n.type).slice(0,36),value:n.value===1?1:0};
 });
 const byId=new Map(cleanNodes.map(n=>[n.id,n]));const occupied=new Set();
 const cleanWires=obj.wires.map(w=>{
  const src=byId.get(w.src),dst=byId.get(w.dst);if(!src||!dst||src.type==='OUTPUT'||dst.type==='INPUT'||!Number.isInteger(w.pin)||w.pin<0||w.pin>=types[dst.type])throw Error('Invalid wire');
  const key=w.dst+':'+w.pin;if(occupied.has(key))throw Error('Duplicate input wiring');occupied.add(key);
  return {id:/^lg\d+$/.test(String(w.id))?w.id:uid(),src:w.src,out:0,dst:w.dst,pin:w.pin};
 });
 return {nodes:cleanNodes,wires:cleanWires,preset:obj.preset==='custom'?'custom':Object.hasOwn(defaults,obj.preset)?obj.preset:'half-adder',next:Math.max(Number(obj.seq)||1,1,...[...unique,...cleanWires.map(w=>w.id)].map(v=>Number(String(v).slice(2))+1).filter(Number.isFinite))};
}
function saveCircuit(){
 const data={version:2,preset:currentExample,seq,nodes,wires,projectName,savedAt:new Date().toISOString()};
 try{localStorage.setItem(STORAGE,JSON.stringify(data));memorySave=data;feedback(`Saved ${nodes.length} components and ${wires.length} wires in this browser.`, 'success');}
 catch(e){memorySave=data;feedback('Browser storage unavailable: saved for this tab only (not after refresh).','warning');}
 updateSavedState();
}
function restoreCircuit(){
 try{
  let obj=memorySave;
  if(!obj){try{obj=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem(oldStorage)||'null');}catch(e){throw Error('Browser storage is unavailable');}}
  if(!obj)throw Error('No saved circuit yet. Click Save in browser first.');
  const restored=validateStored(obj);nodes=restored.nodes;wires=restored.wires;seq=restored.next;currentExample=restored.preset;
  selected=null;pending=null;drag=null;projectName=String(obj.projectName||'My Logic Project').slice(0,60);$('logic-example').value=currentExample;
  $('logic-project-name').value=projectName;$('logic-project-name').disabled=currentExample!=='custom';
  if(currentExample==='custom')captureCustom();
  $('logic-example-description').textContent=currentExample==='custom'?'Restored your independent student project.':descriptions[currentExample]||'Restored gate network.';
  render();feedback(`Restored ${nodes.length} components and ${wires.length} connections.`, 'success');updateSavedState();
 }catch(e){feedback(`Restore failed: ${e.message}`,'error');}
}
function updateSavedState(){let data=memorySave;try{data=data||JSON.parse(localStorage.getItem(STORAGE)||'null');}catch(e){}const el=$('logic-saved-state');
 if(el)el.textContent=data?.savedAt?`Saved ${new Date(data.savedAt).toLocaleString()}`:(data?'Saved in this tab':'No saved circuit');
}
const canvas=$('logic-canvas'),board=root.querySelector('.logic-board');
const dragType='application/x-asic-skill-gate';
root.addEventListener('dragstart',e=>{
 const btn=e.target.closest('[data-add-gate]');if(!btn)return;
 e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData(dragType,btn.dataset.addGate);
 e.dataTransfer.setData('text/plain',btn.dataset.addGate);
});
board.addEventListener('dragover',e=>{
 if(!Array.from(e.dataTransfer?.types||[]).includes(dragType))return;
 e.preventDefault();e.dataTransfer.dropEffect='copy';board.classList.add('logic-drop-target');
});
board.addEventListener('dragleave',e=>{if(!board.contains(e.relatedTarget))board.classList.remove('logic-drop-target');});
board.addEventListener('drop',e=>{
 board.classList.remove('logic-drop-target');
 if(!Array.from(e.dataTransfer?.types||[]).includes(dragType))return;
 e.preventDefault();const type=e.dataTransfer.getData(dragType);
 if(!Object.hasOwn(types,type))return;
 addGate(type,pointerPosition(e));
 feedback(`Placed ${type}. Connect its ports to complete your circuit.`,'success');
});
$('logic-project-name').addEventListener('input',e=>{projectName=e.target.value.slice(0,60);captureCustom();});

canvas.addEventListener('pointerdown',e=>{
 const port=e.target.closest('[data-port]');if(port){const nid=port.dataset.node;if(port.dataset.port==='output'){pending=nid;render();return;}if(pending&&pending!==nid){const pin=Number(port.dataset.pin);wires=wires.filter(w=>!(w.dst===nid&&w.pin===pin));join(pending,0,nid,pin);pending=null;selected=null;render();}return;}
 const item=e.target.closest('[data-node]'),wire=e.target.closest('[data-wire]');
 if(item){const n=find(item.dataset.node);if(!n)return;selected={kind:'node',id:n.id};const p=pointerPosition(e);drag={id:n.id,dx:p.x-n.x,dy:p.y-n.y,moved:false};canvas.setPointerCapture(e.pointerId);}
 else{selected=wire?{kind:'wire',id:wire.dataset.wire}:null;pending=null;render();}
});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const n=find(drag.id),p=pointerPosition(e);if(!n)return;const nx=Math.min(1090,Math.max(10,p.x-drag.dx)),ny=Math.min(620,Math.max(8,p.y-drag.dy));if(Math.abs(nx-n.x)+Math.abs(ny-n.y)>1)drag.moved=true;n.x=Math.round(nx);n.y=Math.round(ny);render();});
canvas.addEventListener('pointerup',e=>{if(drag){const n=find(drag.id);if(n?.type==='INPUT'&&!drag.moved)n.value=1-n.value;drag=null;render();}if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('click',e=>{const w=e.target.closest('[data-wire]');if(w){selected={kind:'wire',id:w.dataset.wire};render();}});
root.addEventListener('click',e=>{
 const type=e.target.closest('[data-add-gate]')?.dataset.addGate;if(type){addGate(type);return;}
 const nid=e.target.closest('[data-toggle]')?.dataset.toggle;if(nid){const n=find(nid);if(n){n.value=1-n.value;render();}return;}
 if(e.target.closest('#logic-delete-selected')){del();return;}
 if(e.target.closest('#logic-new-project')){newProject();return;}
 if(e.target.closest('#logic-reset')){const chosen=$('logic-example').value;
   if(chosen==='custom'){nodes=[];wires=[];seq=1;customDraft=null;restoreCustom();feedback('Cleared the student canvas. Browser save is unchanged.','success');}
   else{setExample(chosen);feedback(`Reset ${$('logic-example').selectedOptions[0]?.textContent?.trim()||chosen}. Your browser save was not changed.`,'success');}return;}
 if(e.target.closest('#logic-save')){saveCircuit();return;}
 if(e.target.closest('#logic-load')){restoreCircuit();return;}
});
$('logic-example').addEventListener('change',e=>{setExample(e.target.value);feedback(`Loaded ${e.target.selectedOptions[0]?.textContent||'example'} · edit and save anytime.`);});
document.addEventListener('keydown',e=>{if(!root.closest('.tool-panel.active'))return;if(e.key==='Escape'&&pending){pending=null;render();}if((e.key==='Delete'||e.key==='Backspace')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){del();}});
setExample('half-adder');updateSavedState();feedback('Choose an example or edit the diagram. Save stores your current connections in this browser.');
window.ASICLogicSimulation={setExample,getState:()=>({nodes:structuredClone(nodes),wires:structuredClone(wires)}),truth:()=>nodes.filter(n=>n.type==='OUTPUT').map(n=>({name:n.label,value:values[n.id]})),setInputs(obj){for(const n of nodes.filter(v=>v.type==='INPUT'))if(Object.hasOwn(obj,n.label))n.value=obj[n.label]===1?1:0;render();},saveCircuit,restoreCircuit,newProject,addGate,selectExample:setExample};
})();
