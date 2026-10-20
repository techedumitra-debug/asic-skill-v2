/* Hands-on learning modules: requests always use the existing authenticated EDA session. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const stages = [
    ['Specification','Requirements, PPA targets, interfaces','Measurable design specification','design-roadmap'],
    ['RTL Design','Architecture and block specification','Synthesizable RTL','cocotb'],
    ['Functional Verification','RTL and testbench','Waveform, assertions and pass/fail results','cocotb'],
    ['DFT Planning','Sequential netlist and fault model','Scan plan, coverage target','dft-workshop'],
    ['Logic Synthesis','RTL, libraries, SDC','Gate-level netlist and area summary','yosys'],
    ['Physical Design','Netlist, LEF, Liberty, PDK','Placed and routed layout','pd-workshop'],
    ['Static Timing','Liberty, SDC, parasitics','Setup/hold reports and slack','opensta'],
    ['Physical Verification','GDSII and PDK rule decks','DRC/LVS validation','klayout'],
    ['Tape-out & Fabrication','Signoff-ready mask data','Fabricated die','design-roadmap'],
    ['Packaging & Validation','Fabricated die and board','Tested product','design-roadmap']
  ];
  let currentStage=0;
  const stageRoot=el('vlsi-roadmap');
  const stageButtons=stages.map((stage,index)=>{
    const button=document.createElement('button');button.type='button';
    const label=document.createElement('strong');label.textContent=String(index+1).padStart(2,'0')+'  '+stage[0];
    const subtitle=document.createElement('small');subtitle.textContent=stage[2];
    button.replaceChildren(label,subtitle);
    button.onclick=()=>{
      currentStage=index;stageButtons.forEach((b,i)=>b.classList.toggle('active',i===index));
      el('vlsi-stage-title').textContent=stage[0];
      el('vlsi-stage-note').textContent='Input: '+stage[1]+'.  Output: '+stage[2]+'.';
      el('vlsi-stage-open').textContent=stage[3]==='design-roadmap'?'Review roadmap':'Open '+stage[3].replaceAll('-',' ');
    };
    stageRoot.append(button);return button;
  });
  stageButtons[0].click();
  el('vlsi-stage-open').onclick=()=>selectTool(stages[currentStage][3]);

  const pdStages=[
    ['Floorplan','Choose die/core dimensions and cell utilization.'],
    ['Power network','Generate a connected PDN for placement and routing.'],
    ['Placement','Place cells and optimize critical paths.'],
    ['CTS','Build clock trees and inspect skew/latency.'],
    ['Routing','Connect signals and run repair operations.'],
    ['Signoff','Inspect setup/hold, DRC, IR/EM and extraction results.']
  ];
  const pdRoot=el('pd-stage-list');
  pdStages.forEach(([name,description],i)=>{
    const button=document.createElement('button');button.type='button';
    const title=document.createElement('strong');title.textContent=String(i+1).padStart(2,'0')+' · '+name;
    const small=document.createElement('small');small.textContent=description;
    button.append(title,small);
    button.onclick=()=>{
      [...pdRoot.children].forEach(b=>b.classList.remove('active'));button.classList.add('active');
      el('pd-workshop-output').textContent=name+' — '+description+'\n\nOnly the floorplan action runs a tool from this panel. Open the visual lab for other stages.';
    };
    pdRoot.append(button);
  });
  if(pdRoot.children.length)pdRoot.children[0].click();
  el('pd-run-floorplan').onclick=async()=>{
    if(!sessionId){el('pd-workshop-state').textContent='Start an EDA session first.';return;}
    const button=el('pd-run-floorplan');button.disabled=true;
    el('pd-workshop-state').textContent='Running OpenROAD floorplan…';
    el('pd-workshop-output').textContent='Running the existing OpenROAD preset. Large designs can take several minutes…';
    try{
      const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/presets/openroad_floorplan`,{method:'POST'});
      el('pd-workshop-output').textContent=result.output||'Floorplan completed.';
      el('pd-workshop-state').textContent='Floorplan complete';
    }catch(e){el('pd-workshop-output').textContent=e.message;el('pd-workshop-state').textContent='Floorplan failed';}
    finally{button.disabled=false;}
  };
  el('pd-visual-lab').onclick=()=>location.href='openroad-lab.html';

  const tclExamples={
    timing:el('tcl-code').value,
    loops:'proc add_slack {arrival required} {\n  return [expr {$required-$arrival}]\n}\nforeach arrival {0.62 0.83 0.95} {\n  puts [format "Required 1.00 ns, arrival %.2f ns => slack %.3f ns" $arrival [add_slack $arrival 1.0]]\n}',
    constraints:'set clock_period 0.500\nset input_delay 0.100\nset output_delay 0.150\nset budget [expr {$clock_period-$input_delay-$output_delay}]\nputs [format "Available combinational budget: %.3f ns" $budget]'
  };
  el('tcl-example-load').onclick=()=>{el('tcl-code').value=tclExamples[el('tcl-example').value];el('tcl-code').dispatchEvent(new Event('input',{bubbles:true}));};
  async function runLearning(kind,payload,buttonId,stateId,outputId){
    if(!sessionId){el(stateId).textContent='Start an EDA session first.';return null;}
    const button=el(buttonId);button.disabled=true;el(stateId).textContent='Executing isolated '+kind+' job…';el(outputId).textContent='Working…';
    try{
      const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/learning/${kind}/run`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
      });
      el(outputId).textContent=result.output||'Finished.';el(stateId).textContent='Completed';return result;
    }catch(e){el(outputId).textContent=e.message;el(stateId).textContent='Failed — inspect log';return null;}
    finally{button.disabled=false;}
  }
  el('tcl-run').onclick=()=>runLearning('tcl',{source:el('tcl-code').value},'tcl-run','tcl-state','tcl-output');
  let netlist='';
  el('dft-run').onclick=async()=>{
    netlist='';el('dft-netlist').disabled=true;
    const result=await runLearning('dft',{rtl:el('dft-rtl').value,top:el('dft-top').value.trim()},'dft-run','dft-state','dft-output');
    netlist=result?.netlist||'';
    el('dft-netlist').disabled=!netlist;
  };
  function saveText(filename,text,contentType){
    const a=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type:contentType||'text/plain'}));
    a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  el('dft-netlist').onclick=()=>{if(netlist)saveText('dft_synthesized.v',netlist,'text/x-verilog');};

  function configObject(){
    const design=el('openlane-top').value.trim();
    const period=Number(el('openlane-clock').value);
    if(!/^[a-zA-Z_][a-zA-Z0-9_]{0,79}$/.test(design))throw Error('Top module must be a valid HDL identifier.');
    if(!Number.isFinite(period)||period<0.1||period>1000)throw Error('Clock period must be between 0.1 and 1000 ns.');
    return {DESIGN_NAME:design,VERILOG_FILES:`dir::src/${design}.v`,CLOCK_PORT:'clk',CLOCK_PERIOD:period,PDK:el('openlane-pdk').value};
  }
  function previewConfig(){
    try{
      const cfg=configObject();el('openlane-output').textContent=JSON.stringify(cfg,null,2)+'\n\n# Place RTL in src/'+cfg.DESIGN_NAME+'.v\n# Set CLOCK_PORT to your actual RTL clock input.\n# Requires OpenLane 2 and a matching PDK on the flow host.';
      el('openlane-state').textContent='Config template prepared; not executed.';return cfg;
    }catch(e){el('openlane-output').textContent=e.message;el('openlane-state').textContent='Correct config values';return null;}
  }
  ['openlane-top','openlane-clock','openlane-pdk'].forEach(id=>el(id).addEventListener('input',previewConfig));
  el('openlane-config').onclick=()=>{const cfg=previewConfig();if(cfg)saveText('config.json',JSON.stringify(cfg,null,2)+'\n','application/json');};
  el('openlane-openroad').onclick=()=>selectTool('openroad');previewConfig();

  const defaultCMOS=el('cmos-spice').value;
  el('cmos-load').onclick=()=>{el('cmos-spice').value=defaultCMOS;el('cmos-spice').dispatchEvent(new Event('input',{bubbles:true}));};
  el('cmos-run').onclick=async()=>{
    if(!sessionId){el('cmos-state').textContent='Start an EDA session first.';return;}
    const button=el('cmos-run');button.disabled=true;el('cmos-state').textContent='Running ngspice…';
    el('cmos-output').textContent='Simulating transistor-level circuit…';
    try{
      const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/extra/ngspice/run`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({netlist:el('cmos-spice').value})
      });
      el('cmos-output').textContent=result.output||'Circuit run completed.';el('cmos-state').textContent='Completed';
    }catch(e){el('cmos-output').textContent=e.message;el('cmos-state').textContent='Simulation failed';}
    finally{button.disabled=false;}
  };
})();
