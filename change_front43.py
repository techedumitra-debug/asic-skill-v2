from pathlib import Path
p=Path('/mnt/data/work_v43/eda-lab.js')
s=p.read_text()
start=s.index('async function runCocotb(){')
end=s.index('\nconst NEXTPNR_DEFAULT_RTL',start)
replacement=r'''const COCOTB_EXAMPLES=window.ASIC_COCOTB_EXAMPLES||[];
const COCOTB_LIBRARY=window.ASIC_COCOTB_HDL_LIBRARY||{verilog:[],systemverilog:[]};
let cocotbCurrentId='counter';
let cocotbIsCustom=false;
let cocotbFamily='verilog';
let cocotbMode='python';
const cocotbDrafts=new Map();
const editorValue=id=>$(id).value;
function cocotbDraftKey(){return `${cocotbFamily}:${cocotbIsCustom?'custom':cocotbCurrentId}:${cocotbMode}`;}
function rememberCocotbEditors(){const key=cocotbDraftKey();cocotbDrafts.set(key,{rtl:editorValue('cocotb-rtl'),test:editorValue('cocotb-test'),top:editorValue('cocotb-top'),testTop:editorValue('cocotb-test-top')});}
function cocotbExtension(){return cocotbFamily==='systemverilog'?'sv':'v';}
function currentCocotbExample(){return cocotbIsCustom?null:(COCOTB_LIBRARY[cocotbFamily]||[]).find(x=>x.id===cocotbCurrentId)||null;}
function cocotbDefaultCustom(){return {id:'custom',top:'my_design',test_top:'tb_my_design',rtl:cocotbFamily==='systemverilog'?`module my_design(input logic a, b, output logic y);
  assign y = a ^ b;
endmodule
`:`module my_design(input wire a, b, output wire y);
  assign y = a ^ b;
endmodule
`,test:`import cocotb
from cocotb.triggers import Timer
@cocotb.test()
async def check_my_design(dut):
    for a, b in ((0,0),(0,1),(1,0),(1,1)):
        dut.a.value=a
        dut.b.value=b
        await Timer(2, units="ns")
        assert int(dut.y.value)==(a^b)
`,native_test:`\`timescale 1ns/1ps
module tb_my_design;
  logic a=0, b=0;
  wire y;
  my_design dut(.a(a),.b(b),.y(y));
  initial begin
    $dumpfile("rtl_wave.vcd");
    $dumpvars(0,tb_my_design);
    for(integer n=0;n<4;n=n+1) begin
      {a,b}=n; #2;
      if(y !== (a ^ b)) $fatal(1,"XOR mismatch");
    end
    $display("PASS: native RTL testbench");
    $finish;
  end
endmodule
`};}
function refreshCocotbEditors(source){
  const ext=cocotbExtension(),native=cocotbMode==='hdl',testExt=native?ext:'py';
  $('cocotb-rtl').value=source.rtl;
  $('cocotb-test').value=source.test;
  $('cocotb-top').value=source.top;
  $('cocotb-test-top').value=source.testTop||('tb_'+source.top);
  $('cocotb-design-name').textContent=source.top+'.'+ext;
  $('cocotb-design-label').textContent=ext==='sv'?'SYSTEMVERILOG DESIGN':'VERILOG DESIGN';
  $('cocotb-test-name').textContent=native?'testbench.'+testExt:'test_dut.py';
  $('cocotb-test-label').textContent=native?(ext==='sv'?'SYSTEMVERILOG TESTBENCH':'VERILOG TESTBENCH'):'PYTHON COCOTB TESTBENCH';
  $('cocotb-test-top-field').hidden=!native;
  $('run-cocotb').textContent=native?'▶ Run Native '+(ext==='sv'?'SystemVerilog':'Verilog'):'▶ Run Python cocotb';
  $('cocotb-rtl').dataset.language=ext==='sv'?'systemverilog':'verilog';
  $('cocotb-test').dataset.language=native?(ext==='sv'?'systemverilog':'verilog'):'python';
  $('cocotb-rtl').dataset.filename=source.top+'.'+ext;
  $('cocotb-test').dataset.filename=native?'testbench.'+testExt:'test_dut.py';
  for(const id of ['cocotb-rtl','cocotb-test']) $(id).dispatchEvent(new Event('input',{bubbles:true}));
  waveformViewer?.clear('Run a simulation to display the waveform.');
  $('sim-run-status').textContent='Not run';
  $('cocotb-summary').textContent='Source loaded. Run simulation to verify this implementation.';
  $('cocotb-note').textContent=(cocotbIsCustom?'Independent practice project':currentCocotbExample()?.name||'Exercise')+' · '+(native?'native HDL testbench':'Python cocotb testbench')+' loaded.';
  window.ASICCOCOTBVisuals?.render('schematic',currentCocotbExample(),waveformViewer);
  window.ASICCOCOTBVisuals?.render('truth',currentCocotbExample(),waveformViewer);
}
function loadCocotbSelection(id,{remember=true}={}){
  if(remember)rememberCocotbEditors();
  cocotbIsCustom=id==='custom';
  cocotbCurrentId=cocotbIsCustom?'custom':id;
  const example=cocotbIsCustom?cocotbDefaultCustom():currentCocotbExample();
  if(!example)return;
  const cache=cocotbDrafts.get(cocotbDraftKey());
  refreshCocotbEditors(cache||{rtl:example.rtl,test:cocotbMode==='hdl'?example.native_test:example.test,top:example.top,testTop:example.test_top});
  const select=$(cocotbFamily==='verilog'?'playground-example':'cocotb-sv-example');
  if(select)select.value=cocotbCurrentId;
}
function makeCustomCocotb(){loadCocotbSelection('custom');$('cocotb-rtl').focus();}
function resetCocotb(){cocotbDrafts.delete(cocotbDraftKey());loadCocotbSelection(cocotbIsCustom?'custom':cocotbCurrentId,{remember:false});$('cocotb-capture').checked=true;}
async function runCocotb(){
  if(!sessionId)return alert('Start an EDA session first.');
  const btn=$('run-cocotb'),note=$('cocotb-note'),out=$('cocotb-output'),status=$('sim-run-status');
  const top=$('cocotb-top').value.trim(),testTop=$('cocotb-test-top').value.trim();
  if(!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(top)){note.textContent='Invalid RTL top module.';return;}
  if(cocotbMode==='hdl'&&!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(testTop)){note.textContent='Invalid testbench top module.';return;}
  btn.disabled=true;status.textContent='Running…';
  note.textContent='Compiling and running '+(cocotbMode==='hdl'?'native HDL testbench':'Python cocotb test')+' in Docker…';
  out.textContent='Preparing RTL simulation...\n';
  waveformViewer?.clear('Simulation running.');$('wave-indicator').textContent='○';
  $('cocotb-summary').textContent='Icarus compilation → '+(cocotbMode==='hdl'?'vvp native testbench':'cocotb regression')+' → VCD';
  selectSimTab('log');
  let passed=false;
  try{
    const native=cocotbMode==='hdl';
    const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/cocotb/${native?'hdl/run':'run'}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({top,test_top:testTop,language:cocotbFamily,rtl:$('cocotb-rtl').value,test:$('cocotb-test').value,capture:$('cocotb-capture').checked})
    });
    out.textContent=result.output||'Simulation completed without console output.';
    $('cocotb-summary').textContent=native?'Icarus compile → vvp execution → testbench assertions / VCD':'Icarus compile → Python cocotb regression → VCD';
    passed=true;status.textContent='PASS';note.textContent='Simulation passed. Open the waveform to inspect signals.';
    append('flow',(native?'Native HDL':'cocotb')+': PASS');
  }catch(err){out.textContent='SIMULATION FAILED\n'+err.message;
    $('cocotb-summary').textContent='FAIL — '+err.message.split('\n')[0];status.textContent='FAIL';note.textContent='Simulation failed; inspect the log.';
    append('flow','RTL verification: FAIL');}
  finally{
    const hasWave=await loadCocotbWave();btn.disabled=false;
    if(hasWave){if(!passed)note.textContent+=' Waveform captured.';selectSimTab('wave');}
    window.ASICCOCOTBVisuals?.render('schematic',currentCocotbExample(),waveformViewer);
    window.ASICCOCOTBVisuals?.render('truth',currentCocotbExample(),waveformViewer);
  }
}
function savePlaygroundProject(){
  const doc={format:'ASIC-Skill cocotb playground',version:2,top:$('cocotb-top').value,test_top:$('cocotb-test-top').value,
    language:cocotbFamily,test_mode:cocotbMode,rtl:$('cocotb-rtl').value,test:$('cocotb-test').value};
  const blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='asic-skill-rtl-verification-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('cocotb-note').textContent='Project saved with its RTL/testbench languages.';
}
async function importPlaygroundProject(file){
  if(!file)return;
  try{
    if(file.size>400000)throw Error('Project file exceeds 400 KB.');
    const doc=JSON.parse(await file.text());
    if(doc.format!=='ASIC-Skill cocotb playground'||typeof doc.rtl!=='string'||typeof doc.test!=='string'||typeof doc.top!=='string')throw Error('Invalid project JSON.');
    if(!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(doc.top))throw Error('Invalid top module.');
    rememberCocotbEditors();cocotbFamily=doc.language==='systemverilog'?'systemverilog':'verilog';
    cocotbMode=doc.test_mode==='hdl'?'hdl':'python';cocotbIsCustom=true;cocotbCurrentId='custom';
    $('cocotb-example-set').value=cocotbFamily;$('cocotb-test-mode').value=cocotbMode;
    $('cocotb-v-examples').hidden=cocotbFamily!=='verilog';$('cocotb-sv-examples').hidden=cocotbFamily!=='systemverilog';
    cocotbDrafts.set(cocotbDraftKey(),{rtl:doc.rtl,test:doc.test,top:doc.top,testTop:doc.test_top||'tb_'+doc.top});
    loadCocotbSelection('custom',{remember:false});
    $('cocotb-note').textContent='Saved project loaded. Start a session and simulate.';
  }catch(e){$('cocotb-note').textContent='Could not open project: '+e.message;}
  finally{$('playground-file').value='';}
}
'''
s=s[:start]+replacement+s[end:]
# replace init select setup
needle="window.ASICCOCOTB={getSource:kind=>$(kind==='test'?'cocotb-test':'cocotb-rtl').value,"
s=s.replace(needle,"window.ASICCOCOTB={getEditorInfo:kind=>({title:kind==='test'?(cocotbMode==='python'?'Python cocotb Testbench':(cocotbFamily==='systemverilog'?'SystemVerilog':'Verilog')+' Testbench'):(cocotbFamily==='systemverilog'?'SystemVerilog':'Verilog')+' RTL Design',language:kind==='test'?(cocotbMode==='python'?'python':cocotbFamily):cocotbFamily,filename:kind==='test'?(cocotbMode==='python'?'test_dut.py':'testbench.'+cocotbExtension()):'design.'+cocotbExtension()}),getSource:kind=>$(kind==='test'?'cocotb-test':'cocotb-rtl').value,")
start=s.index("const options=$('playground-example');")
end=s.index("$('nextpnr-run').onclick",start)
s=s[:start]+r'''const options=$('playground-example'),svOptions=$('cocotb-sv-example');
function fillCocotbOptions(sel,lib){sel.innerHTML='';
  lib.forEach(ex=>{const option=document.createElement('option');option.value=ex.id;
    option.textContent=ex.day?String(ex.day).padStart(2,'0')+' · '+ex.name:'Starter · '+ex.name;sel.add(option);});
  sel.add(new Option('My Project · Independent','custom'));
}
fillCocotbOptions(options,COCOTB_LIBRARY.verilog);
fillCocotbOptions(svOptions,COCOTB_LIBRARY.systemverilog);
options.onchange=()=>loadCocotbSelection(options.value);
svOptions.onchange=()=>loadCocotbSelection(svOptions.value);
$('cocotb-example-set').onchange=()=>{
  rememberCocotbEditors();cocotbFamily=$('cocotb-example-set').value;
  $('cocotb-v-examples').hidden=cocotbFamily!=='verilog';
  $('cocotb-sv-examples').hidden=cocotbFamily!=='systemverilog';
  if(cocotbFamily==='systemverilog'){$('cocotb-test-mode').value='hdl';cocotbMode='hdl';}
  loadCocotbSelection(cocotbIsCustom?'custom':cocotbCurrentId,{remember:false});
};
$('cocotb-test-mode').onchange=()=>{rememberCocotbEditors();cocotbMode=$('cocotb-test-mode').value;
  loadCocotbSelection(cocotbIsCustom?'custom':cocotbCurrentId,{remember:false});};
loadCocotbSelection('counter',{remember:false});
''' + s[end:]
# handle py cocotb SV: make call to cocotb /run with COMPILE_ARGS change backend later
p.write_text(s)
print('done eda-lab', s.count('let cocotbCurrentId'),s.count('COCOTB_EXAMPLES=window'))
