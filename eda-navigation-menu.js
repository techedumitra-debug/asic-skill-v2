/* ASIC-Skill public navigation: direct lab/category links using shared registry. */
(()=>{'use strict';
const host=document.getElementById('eda-nav-menu'),btn=document.getElementById('eda-nav-trigger'),wrap=document.querySelector('.eda-nav-wrap'),container=document.getElementById('eda-nav-groups');if(!host||!btn||!container)return;
const groups=window.ASIC_EDA_CATEGORIES||{};
const labels={'logic-simulation':'Logic Simulation','design-roadmap':'VLSI Design Flow','riscv-workshop':'RISC-V','sta-workshop':'STA Workshop','pd-workshop':'PD Workshop','dft-workshop':'DFT Workshop','openlane-workshop':'OpenLane','tcl-workshop':'Tcl','perl-workshop':'Perl','cmos-workshop':'CMOS Workshop','terminal':'Linux Terminal','nextpnr':'nextpnr FPGA','pyuvm':'pyuvm','ghdl':'VHDL Simulation','cocotb':'RTL Verification Studio','verilator':'RTL Linting','yosys':'RTL Synthesis','pyuvm':'Python UVM Verification','openroad':'Physical Design','opensta':'Timing Analysis','nextpnr':'FPGA Implementation','klayout':'Layout Viewer','ngspice':'Analog Simulation','openlane-workshop':'Implementation Flow','openlane':'Implementation Flow'};
for(const [id,g] of Object.entries(groups)){
 const section=document.createElement('section');section.className='eda-nav-category';const h=document.createElement('a');h.className='eda-nav-heading';h.href='eda-lab.html?category='+encodeURIComponent(id);h.textContent=g.label;section.append(h);
 const ul=document.createElement('div');ul.className='eda-nav-items';for(const tool of g.tools){const a=document.createElement('a');a.href='eda-lab.html?tool='+encodeURIComponent(tool)+'&category='+encodeURIComponent(id);a.textContent=labels[tool]||tool.charAt(0).toUpperCase()+tool.slice(1);ul.append(a);}section.append(ul);container.append(section);
}
function show(value){host.hidden=!value;btn.setAttribute('aria-expanded',String(value));wrap.classList.toggle('open',value);}
btn.addEventListener('click',()=>show(host.hidden));document.addEventListener('click',e=>{if(!wrap.contains(e.target))show(false)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!host.hidden){show(false);btn.focus();}});
})();
