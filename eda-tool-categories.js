/* ASIC-Skill v37.0.21: one shared six-category tool registry. */
(function(){
 const groups = {"frontend": {"label": "Front-End", "description": "RTL design, verification and processor programming", "tools": ["logic-simulation", "cocotb", "pyuvm", "verilator", "ghdl", "riscv-workshop", "design-roadmap"]}, "synthesis": {"label": "Synthesis", "description": "Logic synthesis, cell statistics and DFT readiness", "tools": ["yosys", "dft-workshop"]}, "physical": {"label": "Physical Design / STA", "description": "Timing, ASIC implementation and GDSII layout", "tools": ["opensta", "sta-workshop", "openroad", "pd-workshop", "openlane-workshop", "klayout"]}, "fpga": {"label": "FPGA / Microcontroller", "description": "VHDL simulation, FPGA bitstreams and embedded-board emulation", "tools": ["nextpnr", "ghdl", "microcontroller-studio"]}, "linux": {"label": "Linux / Scripting", "description": "Linux terminal, Tcl automation and Perl scripting", "tools": ["terminal", "tcl-workshop", "perl-workshop"]}, "analog": {"label": "Analog / CMOS", "description": "SPICE circuit simulation, analog schematic work and transistor-level design", "tools": ["ngspice", "cmos-workshop", "analog-circuit-studio"]}};
 const toolCategory=Object.create(null);
 Object.entries(groups).forEach(([category,definition])=>definition.tools.forEach(tool=>{toolCategory[tool]=category;}));
 window.ASIC_EDA_CATEGORIES=Object.freeze(groups);
 window.ASIC_EDA_CATEGORY_OF=Object.freeze(toolCategory);
})();
