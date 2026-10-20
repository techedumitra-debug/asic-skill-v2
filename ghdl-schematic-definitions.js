/* ASIC-Skill v37.0.33 | functional GHDL schematic definitions.
 * Explicit educational gate networks only where Boolean function is established.
 * All other included exercises use a correctly connected entity-port block,
 * never fabricated gate-level internals. */
(function(root){
'use strict';
const gates={
 logic:[
  {id:'inv_a',type:'NOT',ins:['a'],out:'not_a'},
  {id:'inv_b',type:'NOT',ins:['b'],out:'not_b'},
  {id:'and_1',type:'AND',ins:['a','b'],out:'and_out'},
  {id:'nand_1',type:'NAND',ins:['a','b'],out:'nand_out'},
  {id:'or_1',type:'OR',ins:['a','b'],out:'or_out'},
  {id:'nor_1',type:'NOR',ins:['a','b'],out:'nor_out'},
  {id:'xor_1',type:'XOR',ins:['a','b'],out:'xor_out'},
  {id:'xnor_1',type:'XNOR',ins:['a','b'],out:'xnor_out'}],
 half_adder:[
  {id:'sum_xor',type:'XOR',ins:['a','b'],out:'sum'},
  {id:'carry_and',type:'AND',ins:['a','b'],out:'carry'}],
 full_adder:[
  {id:'xor_ab',type:'XOR',ins:['a','b'],out:'_xor_ab'},
  {id:'sum_xor',type:'XOR',ins:['_xor_ab','cin'],out:'sum'},
  {id:'carry_ab',type:'AND',ins:['a','b'],out:'_carry_ab'},
  {id:'carry_x',type:'AND',ins:['_xor_ab','cin'],out:'_carry_x'},
  {id:'carry_or',type:'OR',ins:['_carry_ab','_carry_x'],out:'cout'}]
};
const blockKinds={
 mux16x1:'MUX 16:1',mux16x4:'MUX 16×4',demux1x8:'DEMUX 1:8',decoder3x8:'DECODER 3:8',decoder4x16:'DECODER 4:16',encoder16x4:'ENCODER 16:4',
 binary_gray:'BINARY / GRAY',bcd7seg:'BCD / 7-SEG',even_parity4:'PARITY',odd_parity_checker:'PARITY CHECK',
 magnitude_comparator4:'COMPARATOR',adder4:'4-BIT ADDER',alu4:'ALU',unsigned_multiplier4:'MULTIPLIER',
 d_latch:'D LATCH',jk_latch:'JK LATCH',sr_latch:'SR LATCH',t_latch:'T LATCH',
 d_ff:'D FLIP-FLOP',jk_ff:'JK FLIP-FLOP',sr_ff:'SR FLIP-FLOP',t_ff:'T FLIP-FLOP',
 jk_master_slave:'JK MASTER/SLAVE',sr_master_slave:'SR MASTER/SLAVE',
 counter:'COUNTER',up_down_counter:'UP/DOWN COUNTER',shift_register:'SHIFT REGISTER',detector1101:'1101 SEQUENCE',moore101:'MOORE FSM',mealy101:'MEALY FSM',
 traffic_light:'TRAFFIC FSM',uart_tx:'UART TX',fifo4x8:'FIFO',fir4:'FIR FILTER',
};
// This reader is deliberately bounded to the entity port clause, not a VHDL elaborator.
function parsePorts(source,entity){
 if(typeof source!=='string'||source.length>200000||!/^[A-Za-z][A-Za-z0-9_]*$/.test(String(entity)))return [];
 const clean=source.replace(/--[^\r\n]*/g,'');
 const re=new RegExp('\\bentity\\s+'+entity+'\\s+is\\b','i');const m=re.exec(clean);if(!m)return [];
 const rest=clean.slice(m.index+m[0].length);const match=/\bport\s*\(/i.exec(rest);if(!match||match.index>4000)return [];
 let pos=match.index+match[0].length,depth=1,raw='';
 for(;pos<rest.length&&raw.length<12000;pos++){const c=rest[pos];if(c==='(')depth++;if(c===')'&&--depth===0)break;if(c===')'&&depth<0)break;raw+=c;}
 if(depth!==0)return [];
 const result=[];
 // Each port group uses a semicolon; subtypes may include vector bounds in parentheses.
 for(const part of raw.split(';')){
  const v=part.trim().match(/^([A-Za-z][\w]*(?:\s*,\s*[A-Za-z][\w]*)*)\s*:\s*(inout|buffer|in|out)\s+([\s\S]+)$/i);
  if(!v)continue;
  const dir=v[2].toLowerCase();const t=v[3].trim();
  const widthMatch=t.match(/\(\s*(\d+)\s+(?:down)?to\s+(\d+)\s*\)/i)||t.match(/\(\s*(\d+)\s+downto\s+(\d+)\s*\)/i);
  const width=widthMatch?Math.abs(Number(widthMatch[1])-Number(widthMatch[2]))+1:1;
  for(const name of v[1].split(',')){
   const id=name.trim().toLowerCase();if(result.length>=100)break;
   result.push({id,label:name.trim()+(width>1?' ['+width+'b]':''),direction:dir,width,type:t});
  }
 }
 return result;
}
function graphFor(id,designTop,rtl){
 const ports=parsePorts(rtl,designTop),inputs=ports.filter(x=>x.direction==='in'||x.direction==='inout'),outputs=ports.filter(x=>x.direction==='out'||x.direction==='buffer');
 const gateTemplate=gates[id]||[];
 const symbols=new Set([...inputs,...outputs].map(p=>p.id));
 let type='block',nodes=[],valid=false;
 if(gateTemplate.length){
  const produced=new Set(gateTemplate.map(g=>g.out));
  valid=gateTemplate.every(g=>g.ins.every(x=>symbols.has(x)||produced.has(x))&&(symbols.has(g.out)||g.out.startsWith('_')));
  if(valid){type='gates';nodes=gateTemplate.map(g=>({...g}));}
 }
 return {id,title:designTop,ports,inputs,outputs,type,nodes,
   blockLabel:blockKinds[id]||String(designTop).replace(/_/g,' ').toUpperCase(),
   detail:type==='gates'?'Educational Boolean network · based on the selected example function':'Port-accurate functional block · internal gates not inferred from VHDL',
   allPortsValid:ports.length>0&&inputs.length>0&&outputs.length>0};
}
root.ASICGHDLCircuitDefinitions={parsePorts,graphFor,gateTemplates:gates,blockKinds};
})(window);
