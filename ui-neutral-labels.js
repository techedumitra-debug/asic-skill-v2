/* ASIC-Skill 37.0.52 - functional names throughout public-facing UI.
 * Existing internal tool IDs, REST routes, files, code editors and raw logs remain unchanged. */
(function(){'use strict';
const terms=[
 [/\b(?:Icarus\s*\/\s*cocotb|cocotb\s*\/\s*Icarus|cocotb\s*\+\s*Icarus(?:\s+Verilog)?|Icarus\s+Verilog\s*\/\s*cocotb)\b/gi,'RTL Verification Studio'],
 [/\bRTL Verification Studio(?:\s*[·/–-]\s*RTL Verification Studio)+\b/gi,'RTL Verification Studio'],
 [/\bPython\s+cocotb(?:\s+test(?:bench)?s?)?\b/gi,'Python verification testbench'],
 [/\b(?:cocotb|Icarus)\s+(?:tests?|regression|verification)\b/gi,'RTL verification'],
 [/\bDigitalJS\s+interactive\s+gate(?:s|\s+view)?\b/gi,'interactive circuit diagram'],
 [/\bYosys\s+(?:wiring|connectivity)\b/gi,'Connection View'],
 [/\b(?:Yosys\s*→\s*netlistsvg|netlistsvg\s+SVG)\b/gi,'automatic circuit layout'],
 [/\bGTKWave\s+(?:View|Viewer)\b/gi,'Detailed Waveform Viewer'],
 [/\bRTL\s+Verification\s+Studio\s*[·/–-]\s*(?:Icarus|cocotb)(?:\s*[·/]\s*(?:Icarus|cocotb))?\b/gi,'RTL Verification Studio'],
 [/\bcocotb\b/gi,'RTL Verification Studio'],
 [/\bIcarus\b/gi,'RTL simulator'],
 [/\bDigitalJS\b/gi,'Interactive Schematic'],
 [/\bnetlistsvg\b/gi,'Automatic Layout'],
 [/\bYosys\b/gi,'RTL Synthesis'],
 [/\bGTKWave\b/gi,'Waveform Viewer'],
 [/\bGHDL\b/gi,'VHDL Simulation'],
 [/\bVerilator\b/gi,'RTL Linting'],
 [/\bpyuvm\b/gi,'Python UVM Verification'],
 [/\bOpenSTA\b/gi,'Timing Analysis'],
 [/\bOpenROAD\b/gi,'Physical Design'],
 [/\bnextpnr\b/gi,'FPGA Implementation'],
 [/\bKLayout\b/gi,'Layout Viewer'],
 [/\bngspice\b/gi,'Analog Simulation'],
 [/\bOpenLane\b/gi,'Implementation Flow'],
 [/\bQEMU\b/gi,'Processor Emulation'],
 [/\bORFS\b/gi,'implementation flow'],
 [/\bCIRCT\b/gi,'RTL lowering'],
];
const blocked='script,style,noscript,textarea,pre,code,svg,option[value^="--"],.xterm,.CodeMirror,.monaco-editor,[contenteditable],[data-code-editor],.ace_editor';
const tech=/\b(cocotb|Icarus|DigitalJS|netlistsvg|Yosys|GTKWave|GHDL|Verilator|pyuvm|OpenSTA|OpenROAD|nextpnr|KLayout|ngspice|OpenLane|QEMU|ORFS|CIRCT)\b/i;
function safe(node){
 const e=node.nodeType===1?node:node.parentElement;
 if(!e||e.closest(blocked))return false;
 // Schematic signal identifiers and wire labels are part of the design.
 if(e.closest('.cocotb-digitaljs-paper,.wave-body,#ghdl-wave-scroll,[data-raw-output]'))return false;
 return true;
}
function neutralize(value){
 let after=value;for(const [pattern,replacement] of terms)after=after.replace(pattern,replacement);
 return after.replace(/\bRTL Verification Studio(?:\s*[·/–-]\s*RTL Verification Studio)+\b/gi,'RTL Verification Studio');
}
function rewrite(node){
 if(node.nodeType!==3||!tech.test(node.nodeValue||'')||!safe(node))return;
 const after=neutralize(node.nodeValue);
 if(node.nodeValue!==after)node.nodeValue=after;
}
function rewriteAttrs(element){
 if(!safe(element))return;
 for(const name of ['aria-label','title','placeholder','alt']){
  const before=element.getAttribute?.(name);
  if(!before||!tech.test(before))continue;
  const after=neutralize(before);if(before!==after)element.setAttribute(name,after);
 }
}
function scan(node){
 if(!node)return;
 if(node.nodeType===3){rewrite(node);return;}
 if(node.nodeType!==1||!safe(node))return;
 rewriteAttrs(node);
 for(const child of node.querySelectorAll?.('[aria-label],[title],[placeholder],[alt]')||[])rewriteAttrs(child);
 const walk=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
 while(walk.nextNode())rewrite(walk.currentNode);
}
function start(){
 scan(document.body);
 const observer=new MutationObserver(records=>{for(const r of records){
  if(r.type==='characterData')rewrite(r.target);
  else if(r.type==='attributes')rewriteAttrs(r.target);
  else for(const node of r.addedNodes)scan(node);
 }});
 observer.observe(document.body,{childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt'],subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
