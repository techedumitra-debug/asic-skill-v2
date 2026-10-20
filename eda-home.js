/* Public homepage tool explorer: illustrative information, not simulated API status. */
(() => {
  const tools={
    'logic-simulation':{stage:'DIGITAL LOGIC · INTERACTIVE',title:'Build and simulate digital logic circuits.',description:'Place logic gates, connect inputs to outputs, toggle switches, and check live signal values and truth tables in the browser.',tags:['Logic gates','Circuit wiring','Truth tables'],terminal:'Logic Simulation',snippet:'Input A, B → XOR → SUM\nInput A, B → AND → CARRY\n# Try the Half Adder example and toggle A or B',link:'eda-lab.html?tool=logic-simulation',button:'Launch Logic Simulation',secondary:'eda-lab.html?tool=ghdl',other:'Open VHDL lab ↗'},
    pyuvm:{stage:'PYTHON UVM VERIFICATION',title:'Verify RTL with reusable Python UVM tests.',description:'Run Python UVM-style test classes with cocotb and Icarus, view UVM logs and capture VCD waveforms.',tags:['pyuvm','cocotb','Python UVM'],terminal:'pyuvm + cocotb + Icarus',snippet:'@pyuvm.test()\nclass CounterTest(uvm_test):\n    async def run_phase(self):\n        self.raise_objection()\n        # Drive the DUT and check results\n        self.drop_objection()',link:'eda-lab.html?tool=pyuvm',button:'Launch pyuvm lab',secondary:'eda-lab.html?tool=cocotb',other:'Open RTL Verification Studio ↗'},
    terminal:{stage:'LINUX / SCRIPTING',title:'Explore safe Linux commands in the EDA workspace.',description:'Practice file inspection and tool version commands in an isolated Linux container, not on your Windows host.',tags:['Linux','Guided shell','Isolation'],terminal:'Isolated EDA Linux shell',snippet:'$ pwd\n/workspace\n$ ls -la\n$ yosys -V',link:'eda-lab.html?tool=terminal',button:'Open Linux Terminal',secondary:'eda-lab.html?tool=tcl-workshop',other:'Open Tcl Workshop ↗'},
    'perl-workshop':{stage:'LINUX / SCRIPTING',title:'Automate report processing with Perl.',description:'Edit and run Perl scripts in a network-disabled container; practice parsing logs, regex and timing summaries.',tags:['Perl 5','Regex','Report automation'],terminal:'Perl interpreter',snippet:'$ perl lesson.pl\nclk_cpu -0.032 ns VIOLATION\nclk_bus  0.011 ns PASS',link:'eda-lab.html?tool=perl-workshop',button:'Open Perl Workshop',secondary:'eda-lab.html?tool=tcl-workshop',other:'Open Tcl Workshop ↗'},
    cocotb:{stage:'01 / RTL VERIFICATION',title:'Verify Verilog and SystemVerilog RTL.',description:'Write and simulate .v or .sv designs with Python cocotb or native Verilog/SystemVerilog testbenches.',tags:['.v Examples','.sv Examples','Python + HDL testbenches'],terminal:'RTL Verification Studio',snippet:'$ make SIM=icarus TOPLEVEL=counter MODULE=test_counter\n# Drive clock, reset and enable\n# Check each expected count with Python assertions',link:'eda-lab.html?tool=cocotb',button:'Launch RTL Verification Studio',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'},
    yosys:{stage:'02 / RTL SYNTHESIS',title:'From Verilog to a gate-level netlist.',description:'Inspect and edit an RTL design, run Yosys synthesis and review mapping and cell statistics.',tags:['Verilog RTL','Logic optimization','Netlist'],terminal:'yosys',snippet:'$ yosys -p "read_verilog design.v; synth; stat"\n# Technology-independent synthesis\n# See mapped cells and hierarchy',link:'eda-lab.html?tool=yosys',button:'Launch Yosys lab',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'},
    opensta:{stage:'03 / STATIC TIMING',title:'Trace setup and hold paths.',description:'Edit the Liberty library and SDC, run OpenSTA, and inspect slew, delays, derates, WNS, TNS and path reports.',tags:['SDC','Liberty','Setup / hold'],terminal:'OpenSTA',snippet:'sta> report_checks -path_delay max -format full\nsta> report_wns\nsta> report_tns\n# Inspect real timing reports after running STA',link:'opensta-lab.html',button:'Open detailed OpenSTA lab',secondary:'eda-lab.html?tool=opensta',other:'Quick tools in EDA workspace ↗'},
    openroad:{stage:'04 / PHYSICAL DESIGN',title:'Explore floorplanning and P&R.',description:'Use OpenROAD and ORFS to explore the implementation flow and inspect floorplanning results in the visual lab.',tags:['Floorplan','Placement','Routing'],terminal:'OpenROAD / ORFS',snippet:'$ make floorplan DESIGN_CONFIG=./designs/sky130hd/gcd/config.mk\n# Review floorplan output\n# Explore placement and routing stages',link:'openroad-lab.html',button:'Open visual OpenROAD lab',secondary:'eda-lab.html?tool=openroad',other:'Open EDA workspace ↗'},
    'microcontroller-studio':{stage:'FPGA / MICROCONTROLLER',title:'Explore embedded-board emulation.',description:'Connect a locally self-hosted microcontroller emulator for Arduino-style programming, virtual boards and simulated components.',tags:['Arduino','ESP32','Board emulation'],terminal:'Optional standalone microcontroller emulator',snippet:'# Start your optional emulator on port 3080\n# Open the Microcontroller Studio tab\n# Connect to the local emulator',link:'eda-lab.html?tool=microcontroller-studio&category=fpga',button:'Open Microcontroller Studio',secondary:'eda-lab.html?tool=ghdl&category=fpga',other:'Open FPGA VHDL lab ↗'},
    'analog-circuit-studio':{stage:'ANALOG / CMOS',title:'Edit analog circuit schematics visually.',description:'Connect a self-hosted visual SPICE schematic workspace, or use ASIC-Skill’s existing ngspice runner for direct circuit simulation.',tags:['Schematic editor','SPICE','Analog'],terminal:'Visual circuit editor (separate deployment)',snippet:'# Connect the self-hosted circuit editor on port 3081\n# Alternatively, open ngspice to simulate a SPICE netlist',link:'eda-lab.html?tool=analog-circuit-studio',button:'Open Analog Circuit Studio',secondary:'eda-lab.html?tool=ngspice',other:'Use ngspice ↗'},
    nextpnr:{stage:'05 / FPGA IMPLEMENTATION',title:'FPGA synthesis, place & route.',description:'Use Yosys synth_ice40 and nextpnr to create an iCE40 configuration bitstream. Supports HX1K/HX8K demonstrations.',tags:['FPGA iCE40','Yosys','Bitstream'],terminal:'Yosys → nextpnr-ice40 → icepack',snippet:'$ yosys -p "read_verilog fpga_design.v; synth_ice40 -top blinky -json design.json"\n$ nextpnr-ice40 --hx1k --package tq144 --json design.json --asc design.asc\n$ icepack design.asc design.bin',link:'eda-lab.html?tool=nextpnr',button:'Launch nextpnr FPGA lab',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'},
    klayout:{stage:'06 / IC LAYOUT',title:'Inspect and edit GDSII layouts.',description:'Open a streamed KLayout desktop, inspect physical layers and create or import cell layouts.',tags:['GDSII','OASIS','Layout editor'],terminal:'KLayout geometry viewer',snippet:'# Open sample cell in KLayout\n# Toggle metal / poly layers and zoom to shapes\n# Import your own GDSII layout',link:'eda-lab.html?tool=klayout',button:'Launch KLayout lab',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'},
    ngspice:{stage:'07 / CIRCUIT SIMULATION',title:'Explore analog circuit behavior.',description:'Write SPICE netlists and run real ngspice transient or DC simulations in a restricted Docker container.',tags:['SPICE','Transient','Analog'],terminal:'ngspice',snippet:'$ ngspice -b circuit.cir\n# R/C network and transient voltage response',link:'eda-lab.html?tool=ngspice',button:'Launch ngspice lab',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'},
    verilator:{stage:'08 / RTL VERIFICATION',title:'Check RTL and measure test coverage.',description:'Run coding checks, fast testbench simulation, waveforms, and measurable line coverage.',tags:['SystemVerilog','Simulation','Coverage'],terminal:'RTL verification',snippet:'// Edit design.sv and testbench.sv in the studio\n// Check RTL, run simulation and review measured coverage',link:'eda-lab.html?tool=verilator',button:'Open RTL Performance',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'},

    'design-roadmap':{stage:'LEARNING ROADMAP',title:'Follow the complete VLSI design flow.',description:'Learn what each stage requires and produces, from specification to RTL, implementation, signoff and testing.',tags:['Spec to silicon','Learning roadmap','Lab handoffs'],terminal:'VLSI design flow',snippet:'# Specification → RTL → DFT → synthesis\n# Floorplan → CTS → route → signoff\n# GDSII → package → silicon validation',link:'eda-lab.html?tool=design-roadmap',button:'Explore VLSI Design Flow',secondary:'eda-lab.html',other:'View EDA workspace ↗'},
    'pd-workshop':{stage:'PHYSICAL DESIGN',title:'Explore a real floorplanning exercise.',description:'Use the existing OpenROAD flow to practice physical implementation and inspect stage output.',tags:['Floorplan','OpenROAD','ORFS'],terminal:'OpenROAD',snippet:'$ make floorplan DESIGN_CONFIG=...\n# Review utilization, core area and cell placement',link:'eda-lab.html?tool=pd-workshop',button:'Open PD Workshop',secondary:'openroad-lab.html',other:'Open visual lab ↗'},
    'dft-workshop':{stage:'DFT READINESS',title:'Synthesize an FSM and review DFT readiness.',description:'Use Yosys to examine sequential cells. Full Fault scan insertion and ATPG are separate future integrations.',tags:['Yosys','Flip-flops','Testability'],terminal:'Yosys',snippet:'yosys> read_verilog -sv design.v\nyosys> synth -top fsm_controller\nyosys> check; stat',link:'eda-lab.html?tool=dft-workshop',button:'Open DFT Workshop',secondary:'eda-lab.html',other:'View EDA workspace ↗'},
    'tcl-workshop':{stage:'EDA SCRIPTING',title:'Learn Tcl with safe interactive examples.',description:'Run Tcl loops, procedures and QoR-style reports in a sandboxed interpreter.',tags:['Tcl','Procedures','Automation'],terminal:'Tcl interpreter',snippet:'tcl> foreach item $paths { puts $item }\n# Safe scripting exercises (no host shell access)',link:'eda-lab.html?tool=tcl-workshop',button:'Open Tcl Workshop',secondary:'eda-lab.html',other:'View EDA workspace ↗'},
    'openlane-workshop':{stage:'RTL TO GDSII',title:'Prepare an OpenLane design configuration.',description:'Create an OpenLane 2 JSON config; a real full flow requires PDK files and a separately provisioned runtime.',tags:['OpenLane 2','Sky130','Config JSON'],terminal:'OpenLane 2',snippet:'$ openlane --dockerized --pdk-root <PDK_ROOT> config.json\n# Requires installed PDK and flow image',link:'eda-lab.html?tool=openlane-workshop',button:'Open OpenLane Workshop',secondary:'eda-lab.html',other:'View EDA workspace ↗'},
    'cmos-workshop':{stage:'CMOS CIRCUITS',title:'Simulate a transistor-level inverter.',description:'Run a generic educational MOS device model using ngspice, without pretending it is a qualified SKY130 model.',tags:['CMOS','SPICE','Transient'],terminal:'ngspice',snippet:'$ ngspice -b cmos_inverter.cir\n# Simulate inverter rise/fall behavior',link:'eda-lab.html?tool=cmos-workshop',button:'Open CMOS Workshop',secondary:'eda-lab.html',other:'View EDA workspace ↗'},
    'sta-workshop':{stage:'STA EXPERIMENTS',title:'Compare timing, slew and derate.',description:'Experiment with OpenSTA setup and hold paths using different input transitions and delay derates; inspect the results side by side.',tags:['Setup / Hold','SDC','WNS / TNS'],terminal:'OpenSTA teaching lab',snippet:'sta> report_checks -path_delay max -fields {slew capacitance fanout}\n# Run A: baseline transition / derate\n# Run B: changed SDC; compare actual path slack',link:'eda-lab.html?tool=sta-workshop',button:'Open Timing Workshop',secondary:'opensta-lab.html',other:'Full OpenSTA timing lab ↗'},
    'riscv-workshop':{stage:'RISC-V PROGRAMMING',title:'Compile C to RV64 and run it.',description:'Use a RISC-V cross-compiler, execute a Linux ELF under QEMU and study the main() function disassembly.',tags:['RV64GC','QEMU','Disassembly'],terminal:'RISC-V cross-GCC + QEMU',snippet:'$ riscv64-linux-gnu-gcc -static -o program.elf main.c\n$ qemu-riscv64 program.elf\nSum from 1 to 9 is 45',link:'eda-lab.html?tool=riscv-workshop',button:'Launch RISC-V Workshop',secondary:'eda-lab.html?tool=cocotb',other:'Open RTL testbench lab ↗'},
    ghdl:{stage:'09 / VHDL SIMULATION',title:'Analyze and simulate VHDL designs.',description:'Compile VHDL-2008 testbenches with GHDL and export VCD timing traces.',tags:['VHDL','Assertions','VCD'],terminal:'GHDL',snippet:'$ ghdl -a --std=08 design.vhd testbench.vhd\n$ ghdl -e --std=08 tb_counter\n$ ghdl -r --std=08 tb_counter --vcd=wave.vcd',link:'eda-lab.html?tool=ghdl',button:'Launch GHDL lab',secondary:'eda-lab.html?tool=flow',other:'View integrated workflow ↗'}
  };
  const groups=window.ASIC_EDA_CATEGORIES;
  const groupOf=window.ASIC_EDA_CATEGORY_OF;
  const buttons=[...document.querySelectorAll('[data-home-tool]')];
  const categoryButtons=[...document.querySelectorAll('[data-home-category]')];
  if(!buttons.length||!groups)return;
  const byId=id=>document.getElementById(id);
  let activeCategory='frontend';
  let activeTool='cocotb';
  const lastTool={};
  function showCategory(category){
    if(!groups[category])return;
    activeCategory=category;
    buttons.forEach(b=>{b.hidden=b.dataset.edaCategory!==category;});
    categoryButtons.forEach(b=>{
      const selected=b.dataset.homeCategory===category;
      b.classList.toggle('active',selected);
      b.setAttribute('aria-selected',String(selected));
      b.tabIndex=selected?0:-1;
    });
    byId('eda-category-description').textContent=groups[category].description;
    byId('eda-category-count').textContent=groups[category].tools.length+' tools';
  }
  function choose(name,moveFocus=false,categoryOverride=null){
    const t=tools[name];
    if(!t||!groupOf[name])return;
    const chosenCategory=categoryOverride&&groups[categoryOverride]?.tools.includes(name)?categoryOverride:groupOf[name];
    showCategory(chosenCategory);
    activeTool=name;
    lastTool[activeCategory]=name;
    buttons.forEach(b=>{
      const selected=b.dataset.homeTool===name;
      b.classList.toggle('active',selected&&b.dataset.edaCategory===activeCategory);
      b.setAttribute('aria-selected',String(selected&&b.dataset.edaCategory===activeCategory));
      b.tabIndex=selected?0:-1;
      if(selected&&moveFocus&&b.dataset.edaCategory===activeCategory)b.focus();
    });
    byId('eda-tool-detail').setAttribute('aria-labelledby',activeCategory==='fpga'&&name==='ghdl'?'eda-tool-ghdl-fpga':'eda-tool-'+name);
    byId('eda-home-stage').textContent=t.stage;
    byId('eda-home-title').textContent=t.title;
    byId('eda-home-description').textContent=t.description;
    byId('eda-home-tags').replaceChildren(...t.tags.map(label=>{const span=document.createElement('span');span.textContent=label;return span;}));
    byId('eda-terminal-name').textContent=t.terminal;
    byId('eda-home-snippet').textContent=t.snippet;
    const primary=byId('eda-home-launch'),secondary=byId('eda-home-secondary');
    primary.href=(name==='ghdl'&&activeCategory==='fpga')?'eda-lab.html?tool=ghdl&category=fpga':t.link;primary.firstChild.textContent=t.button+' ';
    secondary.href=t.secondary;secondary.textContent=t.other;
  }
  function switchCategory(category,focus=false){
    if(!groups[category])return;
    const target=lastTool[category]||groups[category].tools[0];
    choose(target,false,category);
    if(focus)byId('eda-tool-'+target)?.focus();
  }
  categoryButtons.forEach((btn,index)=>{
    btn.addEventListener('click',()=>switchCategory(btn.dataset.homeCategory));
    btn.addEventListener('keydown',event=>{
      const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
      if(!delta&&event.key!=='Home'&&event.key!=='End')return;
      event.preventDefault();
      const i=event.key==='Home'?0:event.key==='End'?categoryButtons.length-1:(index+delta+categoryButtons.length)%categoryButtons.length;
      switchCategory(categoryButtons[i].dataset.homeCategory);
      categoryButtons[i].focus();
    });
  });
  buttons.forEach(btn=>{
    btn.addEventListener('click',()=>choose(btn.dataset.homeTool,false,btn.dataset.edaCategory));
    btn.addEventListener('keydown',event=>{
      const list=groups[activeCategory].tools;
      const index=list.indexOf(btn.dataset.homeTool);
      const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
      if(!delta&&event.key!=='Home'&&event.key!=='End')return;
      event.preventDefault();
      const i=event.key==='Home'?0:event.key==='End'?list.length-1:(index+delta+list.length)%list.length;
      choose(list[i],true,activeCategory);
    });
  });
  const requested=new URLSearchParams(location.search).get('eda_tool');
  choose(tools[requested]&&groupOf[requested]?requested:'cocotb');
})();
