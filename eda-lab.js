const $ = id => document.getElementById(id);
const materialId = new URLSearchParams(location.search).get('id') || '';
const localHost = ['localhost','127.0.0.1'].includes(location.hostname);
const API = String(window.ASIC_SKILL_EDA_API || (localHost ? 'http://127.0.0.1:8090' : '')).replace(/\/$/,'');
let authSession=null, sessionId=null, terminal=null, fitAddon=null, terminalSocket=null, terminalLine='';
const requestedTool = new URLSearchParams(location.search).get('tool') || '';
const requestedCategory = new URLSearchParams(location.search).get('category') || '';
const COCOTB_DEFAULTS = {};
let waveformViewer = null; 

function authHeaders(extra={}){return {...extra,Authorization:`Bearer ${authSession?.access_token||''}`};}
async function refreshAuthSession(){
  try{
    const {data,error}=await supabaseClient.auth.refreshSession();
    if(!error&&data?.session){authSession=data.session;return true;}
  }catch{}
  try{
    const {data:{session}}=await supabaseClient.auth.getSession();
    authSession=session||null;
    return !!authSession;
  }catch{return false;}
}
function outputFor(tool){return $(tool+'-output') || $('flow-output');}
function append(tool,text){const el=outputFor(tool); if(!el)return; if(el.textContent.startsWith('No ')||el.textContent.startsWith('Start '))el.textContent=''; el.textContent += String(text)+'\n'; el.scrollTop=el.scrollHeight;}
function setToolStatus(id,text,cls=''){const el=$('status-'+id);el.textContent=text;el.className=cls;}
async function api(path,options={},retried=false){
  let r=await fetch(API+path,{...options,headers:authHeaders(options.headers||{})});
  if(r.status===401&&!retried){
    const refreshed=await refreshAuthSession();
    if(refreshed) return api(path,options,true);
  }
  const b=await r.json().catch(()=>({}));
  if(!r.ok){const detail=String(b.output||b.detail||'').trim();const tail=detail?detail.slice(-6000):'';throw new Error((b.error||`EDA API error ${r.status}`)+(tail?'\n\n'+tail:''));}
  return b;
}
const EDA_GROUPS=window.ASIC_EDA_CATEGORIES||{};
const EDA_CATEGORY_OF=window.ASIC_EDA_CATEGORY_OF||{};
let currentCategory='frontend';
const recentToolByCategory={};
function selectCategory(category,chooseTool=false){
  if(!EDA_GROUPS[category])return;
  currentCategory=category;
  document.querySelectorAll('[data-eda-category-tab]').forEach(b=>{
    const selected=b.dataset.edaCategoryTab===category;
    b.classList.toggle('active',selected);
    b.setAttribute('aria-selected',String(selected));
    b.tabIndex=selected?0:-1;
  });
  document.querySelectorAll('.tool-tabs .tool-tab').forEach(b=>{
    b.hidden=!EDA_GROUPS[category].tools.includes(b.dataset.tool);
  });
  document.querySelectorAll('[data-status-category]').forEach(tile=>{
    tile.hidden=tile.dataset.statusCategory!==category && !(category==='fpga'&&tile.querySelector('#status-ghdl'));
  });
  $('eda-nav-description').textContent=EDA_GROUPS[category].description;
  if(chooseTool)selectTool(recentToolByCategory[category]||EDA_GROUPS[category].tools[0]);
}
function selectTool(name){
  if(!document.querySelector('.tool-panel[data-panel="'+name+'"]'))return;
  const category=EDA_GROUPS[currentCategory]?.tools.includes(name)?currentCategory:EDA_CATEGORY_OF[name];
  if(category){selectCategory(category);recentToolByCategory[category]=name;}
  document.querySelectorAll('.tool-tab').forEach(b=>{
    const selected=b.dataset.tool===name;
    b.classList.toggle('active',selected);
    if(b.hasAttribute('aria-selected'))b.setAttribute('aria-selected',String(selected));
  });
  document.querySelectorAll('.tool-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));
  if(name==='terminal'){ensureTerminal();setTimeout(()=>fitAddon?.fit(),50);}
}

async function health(){if(!API){$('api-badge').textContent='PREVIEW';return;}try{const b=await fetch(API+'/health').then(r=>r.json());$('api-badge').textContent='API ONLINE';setToolStatus('openroad',b.tools?.openroad?'Ready':'Image missing',b.tools?.openroad?'ok':'warn');setToolStatus('yosys',b.tools?.yosys?'Ready':'Image missing',b.tools?.yosys?'ok':'warn');setToolStatus('opensta',b.tools?.opensta?'Ready':'Build image',b.tools?.opensta?'ok':'warn');setToolStatus('nextpnr',b.tools?.nextpnr?'Ready':'Build optional image',b.tools?.nextpnr?'ok':'warn');setToolStatus('cocotb',b.tools?.cocotb?'Ready':'Build optional image',b.tools?.cocotb?'ok':'warn');setToolStatus('pyuvm',b.tools?.pyuvm?'Ready':'Rebuild cocotb image',b.tools?.pyuvm?'ok':'warn');setToolStatus('perl-workshop',b.tools?.perl_workshop?'Ready':'Build Perl image',b.tools?.perl_workshop?'ok':'warn');setToolStatus('tcl-workshop',b.tools?.tcl_workshop?'Ready':'Build optional image',b.tools?.tcl_workshop?'ok':'warn');setToolStatus('dft-workshop',b.tools?.dft_workshop?'Ready':'Build RTL image',b.tools?.dft_workshop?'ok':'warn');setToolStatus('riscv-workshop',b.tools?.riscv_workshop?'Ready':'Build RISC-V image',b.tools?.riscv_workshop?'ok':'warn');$('shell-mode').textContent=b.advanced_shell?'Advanced isolated shell':'Guided shell';}catch(e){$('api-badge').textContent='API OFFLINE';['openroad','yosys','opensta','nextpnr','cocotb','pyuvm','perl-workshop','tcl-workshop','dft-workshop','riscv-workshop'].forEach(x=>setToolStatus(x,'API offline','warn'));}}

async function createSession(){if(!API)return alert('EDA Lab API is not configured.');$('start-session').disabled=true;try{const b=await api('/api/eda/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({material_id:materialId})});sessionId=b.session_id;$('session-label').textContent=`${sessionId.slice(0,8)} · isolated container`;$('start-session').hidden=true;$('end-session').hidden=false;append('flow','EDA session created: '+sessionId);append('flow','OpenROAD/Yosys workspace: /workspace');ensureTerminal(true);}catch(e){alert(e.message);$('start-session').disabled=false;}}
async function endSession(){if(!sessionId)return;try{await api('/api/eda/sessions/'+encodeURIComponent(sessionId),{method:'DELETE'});}catch{}sessionId=null;$('session-label').textContent='Not started';$('start-session').hidden=false;$('start-session').disabled=false;$('end-session').hidden=true;disconnectTerminal();disableNextpnrArtifacts();}
async function saveRtl(){if(!sessionId)return alert('Start an EDA session first.');try{const b=await api(`/api/eda/sessions/${sessionId}/rtl`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rtl:$('rtl-editor').value})});append('yosys',b.message||'RTL saved.');}catch(e){append('yosys','ERROR: '+e.message);}}
async function runPreset(name){if(!sessionId)return alert('Start an EDA session first.');const tool=name.startsWith('yosys')?'yosys':name.startsWith('opensta')?'opensta':name.startsWith('openroad')?'openroad':'flow';if(name==='opensta_sample'&&outputFor('opensta'))outputFor('opensta').textContent='';append(tool,`$ ASIC-Skill preset: ${name}`);try{if(name==='yosys_synth')await saveRtl();const b=await api(`/api/eda/sessions/${sessionId}/presets/${encodeURIComponent(name)}`,{method:'POST'});append(tool,b.output||b.message||'Completed.');if(tool!=='flow')append('flow',`${name}: completed`);}catch(e){append(tool,'ERROR: '+e.message);append('flow',`${name}: failed — ${e.message}`);}}
// The expanded cocotb results workspace mirrors GHDL's viewer without moving
// the actual waveform/simulation DOM nodes or clearing the simulator result.
function toggleCocotbResults(force){
  const root=$('cocotb-results'),button=$('cocotb-focus');
  const expanded=typeof force==='boolean'?force:!root.classList.contains('cocotb-maximized');
  root.classList.toggle('cocotb-maximized',expanded);
  document.body.classList.toggle('cocotb-results-expanded',expanded);
  button.textContent=expanded?'Collapse Viewer':'Expand Viewer';
  button.setAttribute('aria-pressed',String(expanded));
  button.setAttribute('aria-label',expanded?'Collapse cocotb results viewer':'Expand cocotb results viewer');
  if(document.querySelector('.sim-result-tab.active')?.dataset.simTab==='wave')
    requestAnimationFrame(()=>waveformViewer?.draw());
}
function setCocotbRunStatus(kind,label){
  const el=$('sim-run-status');
  el.className='sim-status '+kind;
  el.textContent=label;
}
// cocotb prints a verifiable regression summary; do not invent test counts for
// native HDL simulators, which only supply an exit code and their console log.
function cocotbTestSummary(log){
  const summaries=[...String(log||'').matchAll(/\bTESTS\s*=\s*(\d+)\s+PASS\s*=\s*(\d+)\s+FAIL\s*=\s*(\d+)(?:\s+SKIP\s*=\s*(\d+))?/gi)];
  if(!summaries.length)return '';
  const m=summaries[summaries.length-1],tests=Number(m[1]),pass=Number(m[2]),fail=Number(m[3]),skip=Number(m[4]||0);
  return `${pass}/${tests} tests passed${fail?' · '+fail+' failed':''}${skip?' · '+skip+' skipped':''}`;
}
function selectSimTab(tab){
  document.querySelectorAll('.sim-result-tab').forEach(el=>el.classList.toggle('active',el.dataset.simTab===tab));
  $('sim-log-panel').classList.toggle('active',tab==='log');$('sim-wave-panel').classList.toggle('active',tab==='wave');
  $('sim-schematic-panel').classList.toggle('active',tab==='schematic');$('sim-truth-panel').classList.toggle('active',tab==='truth');
  if(tab==='wave')waveformViewer?.draw();
  if(tab==='schematic'||tab==='truth')window.ASICCOCOTBVisuals?.render(tab, currentCocotbExample(), waveformViewer);
}
function setCocotbGTKButtons(ready){
  $('wave-gtkw-open').disabled=!ready;
  $('wave-gtkw-export').disabled=!ready;
}
function exportGTK(vcd,selection,marker){
  if(!vcd)throw new Error('Run a simulation with waveform capture enabled first.');
  ASICGTKWave.exportBundle(vcd,{selected:[...selection],marker:marker??0});
}
async function loadCocotbWave(){
  if(!$('cocotb-capture').checked){waveformViewer.clear('Waveform capture disabled for this run.');$('wave-indicator').textContent='○';setCocotbGTKButtons(false);return false;}
  try{
    const b=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/cocotb/waveform`);
    waveformViewer.show(b.vcd);$('wave-indicator').textContent='●';setCocotbGTKButtons(true);return true;
  }catch(e){waveformViewer.clear('No waveform available: '+e.message);$('wave-indicator').textContent='○';setCocotbGTKButtons(false);return false;}
}
const COCOTB_EXAMPLES=window.ASIC_COCOTB_EXAMPLES||[];
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
  waveformViewer?.clear('Run a simulation to display the waveform.');setCocotbGTKButtons(false);
  setCocotbRunStatus('idle','Not run');
  window.ASICCOCOTBVisuals?.clearNetlist?.();
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
  const btn=$('run-cocotb'),note=$('cocotb-note'),out=$('cocotb-output');
  const top=$('cocotb-top').value.trim(),testTop=$('cocotb-test-top').value.trim();
  if(!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(top)){note.textContent='Invalid RTL top module.';return;}
  if(cocotbMode==='hdl'&&!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(testTop)){note.textContent='Invalid testbench top module.';return;}
  const designRtl=$('cocotb-rtl').value;
  btn.disabled=true;setCocotbRunStatus('running','RUNNING · simulation in progress');
  note.textContent='Compiling and running '+(cocotbMode==='hdl'?'HDL testbench':'Python verification test')+' in an isolated environment…';
  out.textContent='[RUN] '+(cocotbFamily==='systemverilog'?'SystemVerilog':'Verilog')+' · '+(cocotbMode==='hdl'?'native HDL':'Python verification')+'\n[1] Validating source and testbench\n[2] Compiling design in isolated Icarus container\n[3] Executing testbench and assertions\n[4] Capturing VCD when enabled\n[5] Inspecting simulator result\n';
  waveformViewer?.clear('Simulation running.');$('wave-indicator').textContent='○';setCocotbGTKButtons(false);window.ASICCOCOTBVisuals?.clearNetlist?.();
  $('cocotb-summary').textContent='RTL compilation → '+(cocotbMode==='hdl'?'HDL testbench':'Python verification')+' → Waveform';
  selectSimTab('log');
  let passed=false;
  try{
    const native=cocotbMode==='hdl';
    const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/cocotb/${native?'hdl/run':'run'}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({top,test_top:testTop,language:cocotbFamily,rtl:designRtl,test:$('cocotb-test').value,capture:$('cocotb-capture').checked})
    });
    if(result.ok===false)throw new Error(result.error||'Simulator reported a failed run.');
    const testSummary=native?'':cocotbTestSummary(result.output);
    out.textContent='[EXECUTION] '+top+' / '+(native?testTop:'test_dut.py')+'\n'+(result.output||'Simulation completed without console output.')+'\n[FINAL] PASS — simulator exited successfully.';
    $('cocotb-summary').textContent='PASS — '+(native?'Native HDL simulation completed (exit 0)':testSummary||'Python verification completed (exit 0)')+'.';
    passed=true;setCocotbRunStatus('pass','PASS'+(testSummary?' · '+testSummary:''));note.textContent='Simulation passed. Open the waveform to inspect signals.';
    append('flow',(native?'Native HDL':'cocotb')+': PASS');
  }catch(err){out.textContent='SIMULATION FAILED\n'+err.message;
    const testSummary=cocotbMode==='python'?cocotbTestSummary(err.message):'';
    $('cocotb-summary').textContent='FAIL — '+(testSummary||err.message.split('\n')[0]);
    setCocotbRunStatus('fail','FAIL'+(testSummary?' · '+testSummary:''));note.textContent='Simulation failed; inspect the log.';
    append('flow','RTL verification: FAIL');}
  finally{
    const hasWave=await loadCocotbWave();btn.disabled=false;
    if(hasWave){if(!passed)note.textContent+=' Waveform captured.';selectSimTab('wave');}
    // Netlist synthesis is independent of simulation PASS/FAIL. Even a failed
    // testbench may have a syntactically valid, synthesizable DUT.
    await window.ASICCOCOTBVisuals?.fetchNetlist?.({api,sessionId,top,rtl:designRtl,language:cocotbFamily});
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

const NEXTPNR_DEFAULT_RTL = `module blinky(input wire clk, output reg led);
  reg [23:0] counter = 24'd0;
  always @(posedge clk) begin
    counter <= counter + 24'd1;
    led <= counter[23];
  end
endmodule`;
function downloadLocal(name,text,type='text/plain'){
  const blob = new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function disableNextpnrArtifacts(){for(const id of ['nextpnr-asc','nextpnr-bin'])$(id).disabled=true;}
async function runNextpnr(){
  if(!sessionId)return alert('Start an EDA session first.');
  const top=$('nextpnr-top').value.trim(),freq=Number($('nextpnr-freq').value),device=$('nextpnr-device').value;
  if(!/^[a-zA-Z_][a-zA-Z0-9_]{0,79}$/.test(top)){$('nextpnr-state').textContent='Invalid top module';return;}
  if(!Number.isFinite(freq)||freq<1||freq>100){$('nextpnr-state').textContent='Clock frequency must be 1–100 MHz';return;}
  const btn=$('nextpnr-run'); btn.disabled=true;disableNextpnrArtifacts();
  $('nextpnr-state').textContent='Running…';$('nextpnr-output').textContent='Running Yosys and nextpnr in Docker. Please wait…\n';
  try{
    const b=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/nextpnr/run`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({top,rtl:$('nextpnr-rtl').value,device,freq})
    });
    $('nextpnr-output').textContent=b.output||'No execution log received.';
    $('nextpnr-state').textContent='PASS · iCE40 bitstream generated';
    $('nextpnr-asc').disabled=false;$('nextpnr-bin').disabled=false;
    append('flow','nextpnr: placed and routed '+device+'; bitstream generated.');
  }catch(e){$('nextpnr-output').textContent='RUN FAILED\n'+e.message;$('nextpnr-state').textContent='FAIL';append('flow','nextpnr: failed — '+e.message);}
  finally{btn.disabled=false;}
}
async function downloadNextpnrArtifact(kind){
  if(!sessionId)return;
  try{
    let response=await fetch(`${API}/api/eda/sessions/${encodeURIComponent(sessionId)}/nextpnr/artifact/${kind}`,{headers:authHeaders()});
    if(response.status===401&&await refreshAuthSession())response=await fetch(`${API}/api/eda/sessions/${encodeURIComponent(sessionId)}/nextpnr/artifact/${kind}`,{headers:authHeaders()});
    if(!response.ok){const b=await response.json().catch(()=>({}));throw Error(b.error||`Download failed: ${response.status}`);}
    const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=kind==='bin'?'asic-skill-ice40.bin':'asic-skill-ice40.asc';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){$('nextpnr-state').textContent='Download error: '+e.message;}
}
function wsUrl(){const u=new URL(API);return `${u.protocol==='https:'?'wss:':'ws:'}//${u.host}/ws/eda/${encodeURIComponent(sessionId)}/linux`;}
function prompt(){terminal?.write('\x1b[38;5;45mstudent@asic-eda\x1b[0m:\x1b[38;5;111m/workspace\x1b[0m$ ');}
function ensureTerminal(force=false){if(!window.Terminal)return;if(!terminal){terminal=new Terminal({cursorBlink:true,fontSize:13,fontFamily:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',theme:{background:'#02070c',foreground:'#c9fbd8',cursor:'#67e8f9'},scrollback:3000});fitAddon=new FitAddon.FitAddon();terminal.loadAddon(fitAddon);terminal.open($('xterm'));fitAddon.fit();terminal.writeln('ASIC-Skill isolated Linux terminal');terminal.onData(onTerminalData);window.addEventListener('resize',()=>fitAddon?.fit());}if(force)disconnectTerminal(false);if(sessionId&&(!terminalSocket||terminalSocket.readyState>1))connectTerminal();}
function connectTerminal(){terminal.writeln('\r\nConnecting…');terminalSocket=new WebSocket(wsUrl());terminalSocket.onopen=()=>terminalSocket.send(JSON.stringify({type:'auth',token:authSession.access_token}));terminalSocket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='ready'){terminal.writeln(m.message||'Ready');prompt()}else if(m.type==='output')terminal.write(String(m.data||''));else if(m.type==='prompt'){terminalLine='';prompt()}else if(m.type==='clear')terminal.clear();else if(m.type==='error')terminal.writeln('\r\nERROR: '+m.message)};terminalSocket.onclose=()=>terminal?.writeln('\r\n[terminal disconnected]');}
function disconnectTerminal(clear=true){if(terminalSocket){try{terminalSocket.close()}catch{}terminalSocket=null}terminalLine='';if(clear&&terminal){terminal.clear();terminal.writeln('ASIC-Skill isolated Linux terminal');}}
function sendTerminal(cmd){selectTool('terminal');ensureTerminal();if(!terminalSocket||terminalSocket.readyState!==WebSocket.OPEN){terminal?.writeln('\r\nStart a session first.');return;}terminalSocket.send(JSON.stringify({type:'command',command:cmd}));}
function onTerminalData(data){if(!terminalSocket||terminalSocket.readyState!==WebSocket.OPEN)return;if(data==='\r'){terminal.write('\r\n');terminalSocket.send(JSON.stringify({type:'command',command:terminalLine.trim()}));terminalLine='';return}if(data==='\u007f'){if(terminalLine.length){terminalLine=terminalLine.slice(0,-1);terminal.write('\b \b')}return}if(data==='\u0003'){terminalLine='';terminal.write('^C\r\n');prompt();return}if(/^[\x20-\x7e]+$/.test(data)){terminalLine+=data;terminal.write(data)}}

async function init(){({data:{session:authSession}}=await supabaseClient.auth.getSession());if(!authSession){const next='eda-lab.html'+location.search;location.href='signin.html?next='+encodeURIComponent(next);return}await refreshAuthSession();if(!authSession){const next='eda-lab.html'+location.search;location.href='signin.html?next='+encodeURIComponent(next);return}$('signin-link').textContent='Signed In';if(materialId){const {data}=await supabaseClient.from('materials').select('id,course_id,module_name,sub_module_name,topic_name,title,description,material_type,access_level,courses(slug,title)').eq('id',materialId).eq('is_published',true).maybeSingle();if(data){if(!['eda_lab','openroad_lab'].includes(data.material_type))return;$('lab-title').textContent=data.title||'EDA Cloud Lab';$('lab-meta').textContent=[data.module_name,data.sub_module_name,data.topic_name,data.description].filter(Boolean).join(' • ');if(data.courses?.slug){$('back-course').href='course-content.html?course='+encodeURIComponent(data.courses.slug);$('back-course').textContent='← Back to Course';}if(data.access_level==='premium'){const {data:ok}=await supabaseClient.rpc('has_premium_course_access',{target_course_id:data.course_id});if(!ok){document.body.innerHTML='<main class="eda-shell"><section class="eda-hero"><h1>Premium access required</h1></section></main>';return}}}}
await health();selectCategory(currentCategory);if(EDA_GROUPS[requestedCategory])selectCategory(requestedCategory);if([...document.querySelectorAll('.tool-tab')].some(el=>el.dataset.tool===requestedTool))selectTool(requestedTool);else if(EDA_GROUPS[requestedCategory])selectCategory(requestedCategory,true);else selectTool('flow');
// Preserve the query-selected lab and bring it into view after authenticated init.
if(requestedTool&&document.querySelector('.tool-panel[data-panel="'+requestedTool+'"]')){
  const selected=document.querySelector('.tool-panel[data-panel="'+requestedTool+'"]');
  requestAnimationFrame(()=>{selected?.scrollIntoView({behavior:'auto',block:'start'});});
}}


document.querySelectorAll('[data-eda-category-tab]').forEach((button,index,all)=>{
  button.onclick=()=>selectCategory(button.dataset.edaCategoryTab,true);
  button.onkeydown=event=>{
    const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
    if(!delta&&event.key!=='Home'&&event.key!=='End')return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?all.length-1:(index+delta+all.length)%all.length;
    selectCategory(all[next].dataset.edaCategoryTab,true);
    all[next].focus();
  };
});
document.querySelectorAll('.tool-tab').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>selectTool(b.dataset.jump));document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>runPreset(b.dataset.preset));document.querySelectorAll('.clear-output').forEach(b=>b.onclick=()=>{const p=b.closest('.output-card')?.querySelector('pre');if(p)p.textContent=''});document.querySelectorAll('[data-terminal-command]').forEach(b=>b.onclick=()=>sendTerminal(b.dataset.terminalCommand));$('start-session').onclick=createSession;$('end-session').onclick=endSession;$('save-rtl').onclick=saveRtl;COCOTB_DEFAULTS['cocotb-rtl']=$('cocotb-rtl').value;COCOTB_DEFAULTS['cocotb-test']=$('cocotb-test').value;waveformViewer=new ASICWaveViewer();
waveformViewer.canvas?.addEventListener('pointerup',()=>{if($('sim-schematic-panel').classList.contains('active'))window.ASICCOCOTBVisuals?.render('schematic',currentCocotbExample(),waveformViewer);});
$('run-cocotb').onclick=runCocotb;$('reset-cocotb').onclick=resetCocotb;
// Invalidate an old synthesized schematic when the DUT changes.
for(const editorId of ['cocotb-rtl','cocotb-top']){
  $(editorId).addEventListener('input',()=>{
    window.ASICCOCOTBVisuals?.clearNetlist?.();
    if($('sim-schematic-panel').classList.contains('active'))
      window.ASICCOCOTBVisuals?.render('schematic',currentCocotbExample(),waveformViewer);
  });
}
document.querySelectorAll('.sim-result-tab').forEach(b=>b.onclick=()=>selectSimTab(b.dataset.simTab));
$('cocotb-focus').onclick=()=>toggleCocotbResults();
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('cocotb-results').classList.contains('cocotb-maximized')){
    toggleCocotbResults(false);$('cocotb-focus').focus();
  }
});
// The canvas must be redrawn against the NEW waveform viewport when the
// user drags the divider or maximizes the workspace.
if(typeof ResizeObserver!=='undefined'){
  const waveResizeObserver=new ResizeObserver(()=>{
    if($('sim-wave-panel').classList.contains('active')&&waveformViewer?.data)
      requestAnimationFrame(()=>waveformViewer?.draw());
  });
  waveResizeObserver.observe($('wave-scroll'));
}else{
  window.addEventListener('resize',()=>{
    if($('sim-wave-panel').classList.contains('active'))waveformViewer?.draw();
  });
}

$('playground-save').onclick=savePlaygroundProject;
$('playground-import').onclick=()=>$('playground-file').click();
$('playground-file').onchange=e=>importPlaygroundProject(e.target.files?.[0]);
// Preserve one independent editable workspace; popup stays linked through its opener.
window.ASICCOCOTB={getWaveData:()=>waveformViewer?.raw||'',getEditorInfo:kind=>({title:kind==='test'?(cocotbMode==='python'?'Python Testbench':(cocotbFamily==='systemverilog'?'SystemVerilog':'Verilog')+' Testbench'):(cocotbFamily==='systemverilog'?'SystemVerilog':'Verilog')+' RTL Design',language:kind==='test'?(cocotbMode==='python'?'python':cocotbFamily):cocotbFamily,filename:kind==='test'?(cocotbMode==='python'?'test_dut.py':'testbench.'+cocotbExtension()):'design.'+cocotbExtension()}),getSource:kind=>$(kind==='test'?'cocotb-test':'cocotb-rtl').value,
 setSource:(kind,source)=>{const target=$(kind==='test'?'cocotb-test':'cocotb-rtl');target.value=source;target.dispatchEvent(new Event('input',{bubbles:true}));},
 focus:kind=>{selectTool('cocotb');$(kind==='test'?'cocotb-test':'cocotb-rtl').focus();}};
$('wave-gtkw-open').onclick=()=>{try{ASICGTKWave.openWorkspace('cocotb');}catch(e){$('cocotb-note').textContent=e.message;}};
$('wave-gtkw-export').onclick=()=>{try{exportGTK(waveformViewer?.raw,waveformViewer?.selected||[],waveformViewer?.cursorTime);}catch(e){$('cocotb-note').textContent=e.message;}};
$('cocotb-pop-rtl').onclick=()=>window.open('cocotb-editor-window.html?kind=rtl','_blank');
$('cocotb-pop-test').onclick=()=>window.open('cocotb-editor-window.html?kind=test','_blank');
$('cocotb-custom').onclick=makeCustomCocotb;
const cocotbTheme=$('cocotb-main-theme'),cocotbPanel=document.querySelector('[data-panel="cocotb"]');
try{cocotbTheme.value=localStorage.getItem('asic-cocotb-editor-theme')||'desert';}catch{}
function applyCocotbTheme(){cocotbPanel.classList.toggle('cocotb-gray',cocotbTheme.value==='gray');try{localStorage.setItem('asic-cocotb-editor-theme',cocotbTheme.value);}catch{}}
cocotbTheme.onchange=applyCocotbTheme;applyCocotbTheme();
const options=$('playground-example'),svOptions=$('cocotb-sv-example');
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
$('nextpnr-run').onclick=runNextpnr;$('nextpnr-example').onclick=()=>{$('nextpnr-rtl').value=NEXTPNR_DEFAULT_RTL;$('nextpnr-top').value='blinky';$('nextpnr-rtl').dispatchEvent(new Event('input',{bubbles:true}));};$('nextpnr-asc').onclick=()=>downloadNextpnrArtifact('asc');$('nextpnr-bin').onclick=()=>downloadNextpnrArtifact('bin');$('open-guided-lab').onclick=()=>location.href='openroad-lab.html'+(materialId?'?id='+encodeURIComponent(materialId):'');window.addEventListener('beforeunload',()=>disconnectTerminal(false));init();
