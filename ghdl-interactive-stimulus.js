/* ASIC-Skill v37.0.34 — bounded, browser-generated GHDL input experiments.
 * Any changed input is VERIFIED only after the existing isolated GHDL service executes it.
 * In-browser Boolean preview is labeled as an educational preview, not as simulation. */
(function (root) {
'use strict';
const IDENT=/^[A-Za-z][A-Za-z0-9_]*$/;
const inputPorts=graph=>(graph?.inputs||[]).filter(p=>p.direction==='in'||p.direction==='inout');
const isClock=p=>/^(clk|clock|clk_i|i_clk)$/i.test(p.id)&&p.width===1;
const isReset=p=>/^(rst|reset|rst_n|reset_n|reset_i)$/i.test(p.id)&&p.width===1;
const isVector=p=>Number(p.width)>1;
const mask=p=>(1n<<BigInt(p.width))-1n;
function parseNumber(raw,p){
 if(!Number.isInteger(p.width)||p.width<1||p.width>128)throw Error('Unsupported input width');
 let v;
 const s=String(raw).trim().replace(/_/g,'');
 if(!s)throw Error(`${p.id}: specify a value`);
 if(/^0[bB][01]+$/.test(s))v=BigInt(s);
 else if(/^0[xX][0-9a-fA-F]+$/.test(s))v=BigInt(s);
 else if(/^[+-]?\d+$/.test(s))v=BigInt(s);
 else throw Error(`${p.id}: use decimal, 0b binary or 0x hexadecimal`);
 const signed=/\bsigned\b/i.test(p.type)&&!/\bunsigned\b/i.test(p.type);
 const lo=signed?-(1n<<BigInt(p.width-1)):0n;
 const hi=signed?(1n<<BigInt(p.width-1))-1n:mask(p);
 if(v<lo||v>hi)throw Error(`${p.id}: valid range ${lo} to ${hi}`);
 return v.toString();
}
function bits(raw,p){
 const parsed=BigInt(parseNumber(raw,p));
 return (parsed & mask(p)).toString(2).padStart(p.width,'0');
}
function initialInputs(graph){const values={};for(const p of inputPorts(graph))values[p.id]=isReset(p)?(/_n$/i.test(p.id)?'1':'0'):(p.id==='en'||p.id==='enable'?'1':'0');return values;}
function vhdlLiteral(raw,p){const b=bits(raw,p);if(!isVector(p))return `'${b}'`;
 if(/^unsigned\b/i.test(p.type))return `unsigned'("${b}")`;
 if(/^signed\b/i.test(p.type))return `signed'("${b}")`;
 return `"${b}"`;
}
function generateTestbench(graph,designTop,history){
 if(!IDENT.test(designTop)||!graph?.allPortsValid||graph.ports.length>100)throw Error('Invalid VHDL entity/ports');
 const ins=inputPorts(graph),outs=graph.outputs||[],all=[...ins,...outs];
 if(!ins.length||!outs.length||!all.every(p=>IDENT.test(p.id)&&/^(?:std_logic|std_logic_vector\s*\(|unsigned\s*\(|signed\s*\()/i.test(p.type)))throw Error('This entity has unsupported port types for automatic simulation.');
 if(!Array.isArray(history)||!history.length||history.length>20)throw Error('Choose 1–20 input steps');
 const clock=ins.find(isClock),reset=ins.find(isReset);
 const decl=all.map(p=>`  signal ${p.id}: ${p.type}${p.direction==='in'?(isVector(p)?" := (others=>'0')":" := '0'"):''};`).join('\n');
 const assoc=all.map(p=>`${p.id} => ${p.id}`).join(', ');
 const lines=[];
 if(reset){lines.push(`    ${reset.id} <= '${/_n$/i.test(reset.id)?'0':'1'}';`);lines.push('    wait for 3 ns;');lines.push(`    ${reset.id} <= '${/_n$/i.test(reset.id)?'1':'0'}';`);lines.push('    wait for 2 ns;');}
 for(let i=0;i<history.length;i++){
  const values=history[i];
  for(const p of ins){if(clock&&p.id===clock.id)continue;if(values[p.id]===undefined)throw Error('Incomplete input step: '+p.id);
   lines.push(`    ${p.id} <= ${vhdlLiteral(values[p.id],p)};`);
  }
  lines.push('    wait for 3 ns;');
  if(clock){lines.push(`    ${clock.id} <= '1';`);lines.push('    wait for 3 ns;');lines.push(`    ${clock.id} <= '0';`);lines.push('    wait for 2 ns;');}
  else lines.push('    wait for 3 ns;');
  lines.push(`    report "ASIC_INPUT_STEP_${i+1}_COMPLETE" severity note;`);
 }
 lines.push('    report "ASIC_INPUT_EXPERIMENT_PASS" severity note;','    wait;');
 const tb=`library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity asic_interactive_tb is end entity;\narchitecture test of asic_interactive_tb is\n${decl}\nbegin\n  dut: entity work.${designTop} port map (${assoc});\n  stimulus: process\n  begin\n${lines.join('\n')}\n  end process;\nend architecture;\n`;
 if(tb.length>32000)throw Error('Experiment testbench exceeds safety limit');
 return {top:'asic_interactive_tb',testbench:tb,steps:history.length};
}
function referenceOutputs(graph,inputs){
 if(graph?.type!=='gates')return null;
 const wires={};
 for(const p of graph.inputs){if(p.width!==1)return null;wires[p.id]=String(inputs[p.id]??'0')==='1'?1:0;}
 for(const gate of graph.nodes){const data=gate.ins.map(id=>wires[id]);if(data.some(v=>v===undefined))return null;
  const sum=data.reduce((a,b)=>a+b,0);
  const values={NOT:data[0]?0:1,AND:sum===data.length?1:0,NAND:sum===data.length?0:1,OR:sum>0?1:0,NOR:sum>0?0:1,XOR:sum%2,XNOR:1-(sum%2)};
  if(!(gate.type in values))return null;wires[gate.out]=values[gate.type];
 }
 return Object.fromEntries(graph.outputs.map(p=>[p.id,String(wires[p.id]??'?')]));
}
root.ASICGHDLStimulus={inputPorts,isClock,isReset,parseNumber,bits,initialInputs,generateTestbench,referenceOutputs};
})(window);
