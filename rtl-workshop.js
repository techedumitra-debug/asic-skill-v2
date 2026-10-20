/* RTL Workshop: hands-on Icarus + Yosys, using existing authenticated session. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const code = [byId('rtl-workshop-rtl'), byId('rtl-workshop-test')];
  if (!code.every(Boolean)) return;
  const samples = {
    counter: {
      top: 'counter', test_top: 'tb_counter',
      rtl: `module counter(input wire clk, input wire rst_n, input wire en, output reg [3:0] q);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 4'd0;
    else if (en) q <= q + 1'b1;
  end
endmodule
`,
      testbench: '`timescale 1ns/1ps\n' + `module tb_counter;
  reg clk = 0, rst_n = 0, en = 0;
  wire [3:0] q;
  counter dut(.clk(clk), .rst_n(rst_n), .en(en), .q(q));
  always #5 clk = ~clk;
  initial begin
    $dumpfile("rtl_wave.vcd");
    $dumpvars(0, tb_counter);
    #12 rst_n = 1; en = 1;
    #50 en = 0;
    if (q !== 4'd5) $fatal(1, "Expected 5, got %0d", q);
    $display("PASS: counter reached %0d", q);
    $finish;
  end
endmodule
`
    },
    adder: {
      top: 'adder', test_top: 'tb_adder',
      rtl: `module adder(input wire [7:0] a, input wire [7:0] b, output wire [8:0] sum);
  assign sum = {1'b0, a} + {1'b0, b};
endmodule
`,
      testbench: '`timescale 1ns/1ps\n' + `module tb_adder;
  reg [7:0] a = 0, b = 0;
  wire [8:0] sum;
  adder dut(.a(a), .b(b), .sum(sum));
  initial begin
    $dumpfile("rtl_wave.vcd");
    $dumpvars(0, tb_adder);
    #5 a = 3; b = 5;
    #5 if (sum !== 9'd8) $fatal(1, "3+5 mismatch");
    a = 255; b = 1;
    #5 if (sum !== 9'd256) $fatal(1, "255+1 mismatch");
    $display("PASS: adder corner cases verified");
    $finish;
  end
endmodule
`
    }
  };
  const state=byId('rtl-workshop-state'), output=byId('rtl-workshop-output');
  let selectedExample='counter',customCache=null;
  const library=()=>window.ASIC_COCOTB_EXAMPLES||[];
  function getExample(){return samples[byId('rtl-workshop-example').value]||samples.counter;}
  function registerExamples(){
    const selector=byId('rtl-workshop-example');
    library().filter(x=>x.day>0).forEach(ex=>{
      samples[ex.id]={top:ex.top,test_top:window.ASICRTL_WORKSHOP_TESTS?.[ex.id]?.test_top||'tb_'+ex.top,rtl:ex.rtl,
        testbench:window.ASICRTL_WORKSHOP_TESTS?.[ex.id]?.testbench||'',label:ex.name,category:ex.category,description:ex.description};
      const opt=document.createElement('option');opt.value=ex.id;opt.textContent=String(ex.day).padStart(2,'0')+' · '+ex.name;selector.add(opt);
    });
    const custom=document.createElement('option');custom.value='custom';custom.textContent='My Verilog Project · Independent';selector.add(custom);
  }
  function editorProject(kind,text){const id=kind==='test'?'rtl-workshop-test':'rtl-workshop-rtl';if(typeof text==='string')editorSet(id,text);return byId(id).value;}
  window.ASICRTLWORKSHOP={getSource:kind=>editorProject(kind),setSource:(kind,value)=>editorProject(kind,value),
    focus:kind=>{document.querySelector('[data-tool="rtl-workshop"]')?.click();byId(kind==='test'?'rtl-workshop-test':'rtl-workshop-rtl').focus();}};

  const viewer = new ASICWaveViewer('rtl-wave-');
  let hasWave=false;
  function editorSet(id,text){const el=byId(id);el.value=text;el.dispatchEvent(new Event('input',{bubbles:true}));}
  function setView(view){
    document.querySelectorAll('[data-rtl-view]').forEach(b=>b.classList.toggle('active',b.dataset.rtlView===view));
    byId('rtl-result-log').classList.toggle('active',view==='log');
    byId('rtl-result-wave').classList.toggle('active',view==='wave');
    byId('rtl-result-schematic').classList.toggle('active',view==='schematic');
    byId('rtl-result-truth').classList.toggle('active',view==='truth');
    if(view==='schematic'||view==='truth')renderReference(view);
    if(view==='wave')viewer.draw();
  }
  document.querySelectorAll('[data-rtl-view]').forEach(b=>b.onclick=()=>setView(b.dataset.rtlView));
  function loadExample(){
    const id=byId('rtl-workshop-example').value;
    if(id==='custom'){
      const user=customCache||{rtl:'module my_design(input wire a, input wire b, output wire y);\n  assign y = a & b;\nendmodule\n',testbench:'`timescale 1ns/1ps\nmodule tb_my_design;\n  reg a=0,b=0; wire y;\n  my_design dut(.a(a),.b(b),.y(y));\n  initial begin\n    $dumpfile("rtl_wave.vcd"); $dumpvars(0,tb_my_design);\n    a=1; b=1; #5;\n    if(y!==1) $fatal(1,"logic mismatch");\n    $display("PASS: custom Verilog"); $finish;\n  end\nendmodule\n',top:'my_design',test_top:'tb_my_design'};
      editorSet('rtl-workshop-rtl',user.rtl);editorSet('rtl-workshop-test',user.testbench);byId('rtl-workshop-top').value=user.top;byId('rtl-workshop-test-top').value=user.test_top;
      selectedExample='custom';state.textContent='Independent Verilog project. Your source is editable.';renderReference('schematic');return;
    }
    const example=getExample();selectedExample=id;
    editorSet('rtl-workshop-rtl',example.rtl);editorSet('rtl-workshop-test',example.testbench);
    byId('rtl-workshop-top').value=example.top;byId('rtl-workshop-test-top').value=example.test_top;
    selectedExample=id;state.textContent='Exercise loaded. Run the workshop to check it.';renderReference('schematic');
  }
  byId('rtl-workshop-example-load').onclick=loadExample;
  byId('rtl-workshop-example').addEventListener('change',loadExample);
  byId('rtl-workshop-custom').onclick=()=>{byId('rtl-workshop-example').value='custom';loadExample();};
  code.forEach(el=>el.addEventListener('input',()=>{
    if(selectedExample==='custom')customCache={rtl:code[0].value,testbench:code[1].value,top:byId('rtl-workshop-top').value,test_top:byId('rtl-workshop-test-top').value};
  }));
  byId('rtl-workshop-pop-rtl').onclick=()=>window.open('rtl-editor-window.html?kind=rtl','_blank');
  byId('rtl-workshop-pop-test').onclick=()=>window.open('rtl-editor-window.html?kind=test','_blank');
  function exportProject(){
    const project={format:'ASIC-Skill RTL Workshop',version:1,top:byId('rtl-workshop-top').value,
      test_top:byId('rtl-workshop-test-top').value,mode:byId('rtl-workshop-mode').value,
      rtl:code[0].value,testbench:code[1].value};
    const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='asic-skill-rtl-workshop.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    state.textContent='Project saved locally.';
  }
  byId('rtl-workshop-save').onclick=exportProject;
  byId('rtl-workshop-open').onclick=()=>byId('rtl-workshop-import').click();
  byId('rtl-workshop-import').onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>400000)throw Error('Project exceeds 400 KB.');
      const data=JSON.parse(await file.text());
      if(data.format!=='ASIC-Skill RTL Workshop'||typeof data.rtl!=='string'||typeof data.testbench!=='string'||
         !/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(data.top)||!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(data.test_top))
        throw Error('Invalid RTL Workshop project.');
      if(data.rtl.length>180000||data.testbench.length>180000)throw Error('Source text too large.');
      byId('rtl-workshop-example').value='custom';selectedExample='custom';
      editorSet('rtl-workshop-rtl',data.rtl);editorSet('rtl-workshop-test',data.testbench);
      byId('rtl-workshop-top').value=data.top;byId('rtl-workshop-test-top').value=data.test_top;
      if(['both','simulate','synthesize'].includes(data.mode))byId('rtl-workshop-mode').value=data.mode;
      customCache={rtl:data.rtl,testbench:data.testbench,top:data.top,test_top:data.test_top};
      state.textContent='Project loaded locally.';
    }catch(err){state.textContent='Open failed: '+err.message;}
    finally{e.target.value='';}
  };
  async function loadWave(){
    try{
      const data=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/rtl-workshop/waveform`);
      viewer.show(data.vcd);hasWave=true;byId('rtl-workshop-wave-note').textContent='VCD ready';return true;
    }catch(e){
      viewer.clear('No waveform generated. Confirm the testbench contains $dumpfile("rtl_wave.vcd") and $dumpvars.');
      hasWave=false;byId('rtl-workshop-wave-note').textContent='No VCD';return false;
    }
  }
  function renderReference(view){
    const host=byId(view==='truth'?'rtl-workshop-truth':'rtl-workshop-schematic');
    if(!host)return;host.replaceChildren();
    const ex=selectedExample==='custom'?null:library().find(e=>e.id===selectedExample);
    const rtl=code[0].value,top=byId('rtl-workshop-top').value.trim();
    const ports=window.ASICCOCOTBVisuals?.modulePorts(rtl,top)||{inputs:[],outputs:[]};
    if(view==='truth'){
      const p=document.createElement('p');p.textContent=ex?.category==='Combinational'
        ?'Reference design: '+(ex.description||ex.name)+'. Read the provided directed testbench and verify all cases with real Icarus simulation and the VCD.'
        :ex?'Sequential exercise: '+ex.name+'. Clock, reset, enable and next-state behavior should be checked using the waveforms and testbench assertions.'
        :'Independent project: no reference table is invented for user-edited RTL. Create assertions in testbench.v and inspect the waveform.';
      host.append(p);const list=document.createElement('p');list.textContent='Inputs: '+ports.inputs.map(x=>x.name).join(', ')+ '  | Outputs: '+ports.outputs.map(x=>x.name).join(', ');host.append(list);
      const ref=ex&&window.ASICCOCOTBVisuals?.reference?.[ex.id];
      if(ref){const table=document.createElement('table'),heading=document.createElement('tr');
        for(const name of [...ref.inputs,...ref.outputs]){const th=document.createElement('th');th.textContent=name;heading.append(th);}table.append(heading);
        const vectors=ref.vectors||(ref.inputs.length===3?[[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]]:[[0],[1]]);
        for(const vector of vectors.slice(0,32)){const row=document.createElement('tr');for(const value of [...vector,...ref.fn(...vector)]){const td=document.createElement('td');td.textContent=String(value);row.append(td);}table.append(row);}host.append(table);
        const note=document.createElement('p');note.textContent='Educational reference vectors. Verify your edited RTL using the testbench and VCD.';host.append(note);
      }
      return;
    }
    if(!ports.inputs.length&&!ports.outputs.length){host.textContent='Unable to identify the selected Verilog module ports.';return;}
    const count=Math.max(ports.inputs.length,ports.outputs.length,2),height=Math.max(280,count*50+110);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 900 ${height}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','Educational interface for '+top);
    const mk=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!=null)e.textContent=text;svg.append(e);};
    mk('rect',{x:10,y:10,width:880,height:height-20,fill:'#071929',rx:12,stroke:'#376a87'});
    mk('text',{x:450,y:35,fill:'#d3eff9','text-anchor':'middle','font-size':17},top+' · Educational port interface');
    const blockY=55,blockHeight=count*50+5;
    mk('rect',{x:320,y:blockY,width:255,height:blockHeight,rx:9,fill:'#153650',stroke:'#65e2c8','stroke-width':2});
    mk('text',{x:448,y:blockY+52,'text-anchor':'middle',fill:'white','font-size':17},top);
    mk('text',{x:448,y:blockY+77,'text-anchor':'middle',fill:'#abd7e8','font-size':12},'Functional block');
    function line(y,start,end){mk('path',{d:`M${start} ${y} H${end}`,stroke:'#4fd6e4','stroke-width':2,fill:'none'});}
    ports.inputs.forEach((p,i)=>{const y=75+i*50;mk('text',{x:23,y:y+4,fill:'#bceaff','font-size':13},p.name+(p.width>1?' ['+p.width+'b]':''));line(y,166,320);});
    ports.outputs.forEach((p,i)=>{const y=75+i*50;line(y,575,735);mk('text',{x:747,y:y+4,fill:'#bceaff','font-size':13},p.name+(p.width>1?' ['+p.width+'b]':''));});
    mk('text',{x:450,y:height-24,'text-anchor':'middle',fill:'#9dc3d7','font-size':12},'Reference interface · internal gate mapping not inferred from RTL');
    host.append(svg);
  }
  // Called after all scripts load, including the native Verilog testbench library.
  window.ASICRTLWorkshopInit=()=>{registerExamples();loadExample();};
  byId('rtl-workshop-run').onclick=async()=>{
    if(!sessionId){state.textContent='Start an EDA session first.';return;}
    const button=byId('rtl-workshop-run');button.disabled=true;
    state.textContent='Running Verilog and Yosys in an isolated container…';
    output.textContent='Compiling or synthesizing…';setView('log');
    viewer.clear('RTL run in progress.');hasWave=false;byId('rtl-workshop-wave-note').textContent='Waiting…';
    let passed=false;
    try{
      const data=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/rtl-workshop/run`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({rtl:code[0].value,testbench:code[1].value,
          top:byId('rtl-workshop-top').value.trim(),test_top:byId('rtl-workshop-test-top').value.trim(),
          mode:byId('rtl-workshop-mode').value})
      });
      output.textContent=data.output||'RTL workshop completed.';renderReference('schematic');
      state.textContent='Completed successfully';passed=true;
      append('flow','RTL Workshop: completed');
    }catch(err){output.textContent='RUN FAILED\n'+err.message;state.textContent='Failed — see log';append('flow','RTL Workshop: failed');}
    finally{
      // Capture waveforms even after failed assertions, when the simulator emitted VCD.
      if(byId('rtl-workshop-mode').value!=='synthesize' && await loadWave()){
        if(!passed)state.textContent='Run failed; captured waveform is available';
        setView('wave');
      }
      button.disabled=false;
    }
  };
})();
