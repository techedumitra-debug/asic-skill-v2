/* ASIC-Skill v37.0.26: independent modeling editors, draggable VCD viewer,
 * and synthesized net connectivity viewer. No external scripts or CDNs. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const designHeader=`library ieee;
use ieee.std_logic_1164.all;
entity logic_gates is
  port (a, b: in std_logic;
        not_a, not_b, and_out, nand_out, or_out, nor_out, xor_out, xnor_out: out std_logic);
end logic_gates;
`;
const examples={
  logic:{design:'logic_gates',top:'tb_logic_gates',
    dataflow:designHeader+`architecture dataflow of logic_gates is
begin
  not_a <= not a; not_b <= not b;
  and_out <= a and b; nand_out <= a nand b;
  or_out <= a or b; nor_out <= a nor b;
  xor_out <= a xor b; xnor_out <= a xnor b;
end dataflow;`,
    behavioral:designHeader+`architecture behavioral of logic_gates is
begin
  process(a,b)
  begin
    not_a <= not a; not_b <= not b;
    if a='1' and b='1' then and_out <= '1'; else and_out <= '0'; end if;
    if a='1' and b='1' then nand_out <= '0'; else nand_out <= '1'; end if;
    if a='1' or b='1' then or_out <= '1'; else or_out <= '0'; end if;
    if a='1' or b='1' then nor_out <= '0'; else nor_out <= '1'; end if;
    if a/=b then xor_out <= '1'; else xor_out <= '0'; end if;
    if a=b then xnor_out <= '1'; else xnor_out <= '0'; end if;
  end process;
end behavioral;`,
    structural:`library ieee;
use ieee.std_logic_1164.all;
entity inv_gate is port (i: in std_logic; o: out std_logic); end inv_gate;
architecture rtl of inv_gate is begin o <= not i; end rtl;
library ieee;
use ieee.std_logic_1164.all;
entity and_gate is port (a,b: in std_logic; y: out std_logic); end and_gate;
architecture rtl of and_gate is begin y <= a and b; end rtl;
library ieee;
use ieee.std_logic_1164.all;
entity or_gate is port (a,b: in std_logic; y: out std_logic); end or_gate;
architecture rtl of or_gate is begin y <= a or b; end rtl;
library ieee;
use ieee.std_logic_1164.all;
entity xor_gate is port (a,b: in std_logic; y: out std_logic); end xor_gate;
architecture rtl of xor_gate is begin y <= a xor b; end rtl;
`+designHeader+`architecture structural of logic_gates is
  signal w_and, w_or, w_xor: std_logic;
begin
  u_na: entity work.inv_gate port map(a,not_a);
  u_nb: entity work.inv_gate port map(b,not_b);
  u_and: entity work.and_gate port map(a,b,w_and);
  u_nand: entity work.inv_gate port map(w_and,nand_out);
  u_or: entity work.or_gate port map(a,b,w_or);
  u_nor: entity work.inv_gate port map(w_or,nor_out);
  u_xor: entity work.xor_gate port map(a,b,w_xor);
  u_xnor: entity work.inv_gate port map(w_xor,xnor_out);
  and_out <= w_and; or_out <= w_or; xor_out <= w_xor;
end structural;`,
    test:`library ieee;
use ieee.std_logic_1164.all;
entity tb_logic_gates is end tb_logic_gates;
architecture test of tb_logic_gates is
  signal a,b: std_logic := '0';
  signal not_a,not_b,and_out,nand_out,or_out,nor_out,xor_out,xnor_out: std_logic;
begin
  dut: entity work.logic_gates port map(a,b,not_a,not_b,and_out,nand_out,or_out,nor_out,xor_out,xnor_out);
  process
  begin
    for i in 0 to 3 loop
      if i < 2 then a <= '0'; else a <= '1'; end if;
      if (i mod 2) = 0 then b <= '0'; else b <= '1'; end if;
      wait for 10 ns;
      assert and_out = (a and b) and nand_out = (a nand b)
        and or_out = (a or b) and nor_out = (a nor b)
        and xor_out = (a xor b) and xnor_out = (a xnor b)
        and not_a = (not a) and not_b = (not b)
        report "Gate comparison failed" severity error;
    end loop;
    report "All logic gate tests PASSED" severity note;
    wait;
  end process;
end test;`
  },
  counter:{design:'counter',top:'tb_counter',
    dataflow:`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity counter is port(clk,rst:in std_logic;q:out unsigned(3 downto 0));end counter;
architecture dataflow of counter is
 signal count: unsigned(3 downto 0):=(others=>'0');
begin
 process(clk,rst) begin
  if rst='1' then count<=(others=>'0');
  elsif rising_edge(clk) then count<=count+1; end if;
 end process;
 q<=count;
end dataflow;`,
    behavioral:`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity counter is port(clk,rst:in std_logic;q:out unsigned(3 downto 0));end counter;
architecture behavioral of counter is
 signal count:unsigned(3 downto 0):=(others=>'0');
begin
 process(clk,rst) begin
  if rst='1' then count<=(others=>'0');
  elsif rising_edge(clk) then
   if count=15 then count<=(others=>'0');
   else count<=count+1;end if;
  end if;
 end process;
 q<=count;
end behavioral;`,
    structural:`library ieee;
use ieee.std_logic_1164.all;
entity toggle_bit is port(clk,rst,en:in std_logic;q:out std_logic);end toggle_bit;
architecture rtl of toggle_bit is
 signal r:std_logic:='0';
begin
 process(clk,rst) begin
  if rst='1' then r<='0';
  elsif rising_edge(clk) then if en='1' then r<=not r;end if;end if;
 end process;
 q<=r;
end rtl;
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity counter is port(clk,rst:in std_logic;q:out unsigned(3 downto 0));end counter;
architecture structural of counter is
 signal v:std_logic_vector(3 downto 0);
begin
 b0:entity work.toggle_bit port map(clk,rst,'1',v(0));
 b1:entity work.toggle_bit port map(clk,rst,v(0),v(1));
 b2:entity work.toggle_bit port map(clk,rst,v(0) and v(1),v(2));
 b3:entity work.toggle_bit port map(clk,rst,v(0) and v(1) and v(2),v(3));
 q<=unsigned(v);
end structural;`,
    test:`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity tb_counter is end tb_counter;
architecture test of tb_counter is
 signal clk:std_logic:='0';signal rst:std_logic:='1';
 signal q:unsigned(3 downto 0);
begin
 dut:entity work.counter port map(clk,rst,q);
 clk<=not clk after 5 ns;
 process begin
  wait for 12 ns;rst<='0';wait for 40 ns;
  assert q=to_unsigned(4,4) report "Incorrect count" severity error;
  report "Counter test passed" severity note;
  wait;
 end process;
end test;`
  }
};
// Import the additional educational examples without fetching external assets.
for(const [id,ex] of Object.entries(window.ASICGHDLExampleLibrary||{}))examples[id]=ex;
// Convert legacy examples to the same implementation-variant format.
for(const id of ['logic','counter']){
  const ex=examples[id];ex.label=id==='logic'?'All Logic Gates':'4-bit Up Counter';
  ex.group=id==='logic'?'Combinational':'Sequential';ex.description='Three independent modeling styles';
  ex.variants=Object.fromEntries(['dataflow','behavioral','structural'].map(s=>[s,{style:s,label:s[0].toUpperCase()+s.slice(1),rtl:ex[s]}]));
}
// Student-owned VHDL practice: source is editable; restoring examples is explicit.
const studentEntity=`library ieee;
use ieee.std_logic_1164.all;
entity student_design is
  port (a,b : in std_logic; y : out std_logic);
end student_design;`;
examples.custom={label:'My VHDL Project',group:'Combinational',description:'Edit your own VHDL and a self-checking testbench. The selected modeling style is the actual design submitted to GHDL.',design:'student_design',top:'tb_student_design',
 variants:{
  dataflow:{style:'dataflow',label:'Dataflow',rtl:studentEntity+`\narchitecture dataflow of student_design is begin y <= a xor b; end dataflow;`},
  behavioral:{style:'behavioral',label:'Behavioral',rtl:studentEntity+`\narchitecture behavioral of student_design is begin process(a,b) begin if a /= b then y <= '1'; else y <= '0'; end if; end process; end behavioral;`},
  structural:{style:'structural',label:'Structural',rtl:`library ieee;
use ieee.std_logic_1164.all;
entity student_xor is port(a,b:in std_logic; y:out std_logic); end student_xor;
architecture rtl of student_xor is begin y <= (a and (not b)) or ((not a) and b); end rtl;
`+studentEntity+`\narchitecture structural of student_design is begin u1:entity work.student_xor port map(a=>a,b=>b,y=>y); end structural;`}
 },
 test:`library ieee;
use ieee.std_logic_1164.all;
entity tb_student_design is end tb_student_design;
architecture test of tb_student_design is
 signal a,b,y:std_logic:='0';
begin
 dut:entity work.student_design port map(a,b,y);
 process begin
  a<='0'; b<='0';wait for 10 ns;assert y='0' report "00 incorrect" severity error;
  a<='0'; b<='1';wait for 10 ns;assert y='1' report "01 incorrect" severity error;
  a<='1'; b<='0';wait for 10 ns;assert y='1' report "10 incorrect" severity error;
  a<='1'; b<='1';wait for 10 ns;assert y='0' report "11 incorrect" severity error;
  report "Custom VHDL test PASSED" severity note;wait;
 end process;
end test;`
};
let style='dataflow',panel='log',schematic=null,schemZoom=1,lastSize=null;
let currentExample='',currentVariant='';
const drafts=new Map();
const styles={dataflow:'ghdl-rtl',behavioral:'ghdl-rtl-behavioral',structural:'ghdl-rtl-structural'};
const wave=new ASICWaveViewer('ghdl-wave-');
let lastGhdlRunSucceeded=false;
let schematicGraph=null, schematicInputs={}, schematicHistory=[], schematicInputDirty=false, schematicInputVerified=false, schematicBusy=false;
const STIM=window.ASICGHDLStimulus;
function inputStatus(message){$('ghdl-interaction-status').textContent=message;}
function updateHistory(){ $('ghdl-history-count').textContent=schematicHistory.length+' / 20 steps'; }
function snapshotInput(){
  const values={};
  for(const p of STIM.inputPorts(schematicGraph)){
    try{values[p.id]=STIM.parseNumber(schematicInputs[p.id]??'0',p);}
    catch(err){throw Error('Invalid input '+p.id+': '+err.message);}
  }
  return values;
}
function previewInputs(){
  schematicInputDirty=true;schematicInputVerified=false;
  const reference=STIM.referenceOutputs(schematicGraph,schematicInputs);
  inputStatus(reference?'Educational gate preview — Run Inputs in GHDL to verify edited VHDL.':'Inputs modified — Run Inputs in GHDL for actual outputs.');
  renderLogicReference();
}
function handlePinClick(p){
  if(schematicBusy)return;
  const editor=$('ghdl-input-'+p.id);if(!editor)return;
  if(p.width===1&&!STIM.isClock(p)){
    editor.checked=!editor.checked;schematicInputs[p.id]=editor.checked?'1':'0';previewInputs();
  }else{editor.focus();editor.select?.();}
}
function buildSchematicControls(){
  schematicGraph=ASICGHDLCircuitDefinitions.graphFor($('ghdl-example').value,$('ghdl-design-top').value.trim(),activeRTL());
  schematicInputs=STIM.initialInputs(schematicGraph);
  schematicHistory=[];schematicInputDirty=false;schematicInputVerified=false;schematicBusy=false;
  updateHistory();
  const controls=$('ghdl-input-controls');controls.replaceChildren();
  for(const p of STIM.inputPorts(schematicGraph)){
    const field=document.createElement('div');field.className='ghdl-pin-editor';field.id='ghdl-field-'+p.id;
    const title=document.createElement('label');title.htmlFor='ghdl-input-'+p.id;title.textContent=p.id+' · '+p.width+' bit'+(p.width===1?'':'s');field.append(title);
    const editor=document.createElement('input');editor.id='ghdl-input-'+p.id;
    if(STIM.isClock(p)){
      editor.type='checkbox';editor.disabled=true;editor.title='Clock is driven by the Clock Step button';
    }else if(p.width===1){
      editor.type='checkbox';editor.checked=schematicInputs[p.id]==='1';
      editor.addEventListener('change',()=>{schematicInputs[p.id]=editor.checked?'1':'0';previewInputs();});
    }else{
      editor.type='text';editor.inputMode='text';editor.value=schematicInputs[p.id];editor.placeholder='Decimal / 0b / 0x';
      editor.maxLength=45;
      editor.addEventListener('change',()=>{
        try{schematicInputs[p.id]=STIM.parseNumber(editor.value,p);field.classList.remove('invalid');previewInputs();}
        catch(err){field.classList.add('invalid');inputStatus(err.message);}
      });
    }
    field.append(editor);
    const hint=document.createElement('small');hint.textContent=STIM.isClock(p)?'Clock pulses generated on Run':p.width>1?'Decimal, 0b binary, or 0x hex':'Checked = 1 / Unchecked = 0';field.append(hint);
    controls.append(field);
  }
  $('ghdl-clock-step').hidden=!STIM.inputPorts(schematicGraph).some(STIM.isClock);
  inputStatus('Select or toggle inputs. Use Run Inputs in GHDL for measured outputs.');
}
async function runSchematicInputs(){
  if(schematicBusy)return;
  if(!sessionId){inputStatus('Start an EDA session before running custom inputs.');return;}
  const button=$('ghdl-input-run'),clock=$('ghdl-clock-step');
  let values,experiment;
  try{
    values=snapshotInput();
    if(schematicHistory.length>=20)throw Error('20 steps reached; choose Reset Inputs / History to begin again.');
    experiment=STIM.generateTestbench(schematicGraph,$('ghdl-design-top').value.trim(),[...schematicHistory,values]);
  }catch(err){inputStatus(err.message);return;}
  schematicBusy=true;button.disabled=true;clock.disabled=true;
  inputStatus('Running your inputs through GHDL in the isolated EDA container…');
  try{
    const endpoint=`/api/eda/sessions/${encodeURIComponent(sessionId)}/extra/ghdl/run`;
    const payload={rtl:activeRTL(),testbench:experiment.testbench,design_top:$('ghdl-design-top').value.trim(),top:experiment.top};
    const request=()=>fetch(API+endpoint,{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let response=await request();
    if(response.status===401&&await refreshAuthSession())response=await request();
    const result=await response.json().catch(()=>({error:'Invalid GHDL response'}));
    if(!response.ok||!result.has_wave)throw Error((result.output||result.error||'GHDL produced no VCD').slice(-900));
    const vcd=await(await getAuthorized(`/api/eda/sessions/${encodeURIComponent(sessionId)}/ghdl/waveform`)).text();
    wave.show(vcd);
    wave.cursorTime=wave.data.end;
    wave.draw();
    schematicHistory.push(values);
    schematicInputVerified=true;schematicInputDirty=false;lastGhdlRunSucceeded=true;
    $('ghdl-output').textContent='INTERACTIVE GHDL INPUT EXPERIMENT\n'+result.output;
    $('ghdl-result-summary').textContent='PASS · Custom input GHDL simulation · VCD verified';
    $('ghdl-state').textContent='Input experiment complete';
    inputStatus('GHDL VERIFIED · Values and outputs reflect the new VCD at its final cursor time.');
    updateHistory();renderLogicReference();
    showPanel('logic');
  }catch(err){
    schematicInputDirty=true;schematicInputVerified=false;
    inputStatus('Input simulation failed; outputs are NOT verified. '+err.message.slice(0,300));
    $('ghdl-output').textContent='INPUT EXPERIMENT FAILED\n'+err.message;
    $('ghdl-result-summary').textContent='FAIL · Interactive input simulation';
    renderLogicReference();
  }finally{schematicBusy=false;button.disabled=false;clock.disabled=false;}
}

const originalWaveDraw=wave.draw.bind(wave);
wave.draw=function(){const result=originalWaveDraw();if(panel==='logic')renderLogicReference();return result;};
function fire(id){$(id).dispatchEvent(new Event('input',{bubbles:true}));}
function activeRTL(){return $(styles[style]).value;}
function populateExampleSelect(){
  const select=$('ghdl-example');select.replaceChildren();
  const groups=['Combinational','Sequential','Arithmetic','Advanced'];
  // Introductory gates, adders and code conversion first, followed by state-based systems.
  const priority=['custom','logic','half_adder','full_adder','binary_gray','decoder4x16','decoder3x8','encoder16x4','comparator','magnitude_comparator','alu','bcd7seg','mux16x1','mux16x4','demux1x8','even_parity','odd_parity','d_latch','jk_latch','sr_latch','t_latch','d_ff','jk_ff','sr_ff','t_ff','counter','up_down_counter','shift_register','moore101','mealy101','seq1101','traffic_light','uart_tx','fifo','fir'];
  const index=id=>{const i=priority.indexOf(id);return i<0?999:i;};
  let number=0;
  for(const groupName of groups){
    const group=document.createElement('optgroup');group.label=groupName;
    Object.entries(examples).filter(([,ex])=>ex.group===groupName).sort((a,b)=>index(a[0])-index(b[0])||a[1].label.localeCompare(b[1].label)).forEach(([id,ex])=>{
      const option=document.createElement('option');option.value=id;option.textContent=`${String(++number).padStart(2,'0')}. ${ex.label}`;group.append(option);
    });
    if(group.children.length)select.append(group);
  }
  select.value='logic';
}
function saveCurrentVariant(){
  if(!currentVariant||!currentExample)return;
  const ex=examples[currentExample],variant=ex.variants[currentVariant];
  if(variant&&styles[variant.style])drafts.set(currentExample+'/'+currentVariant,$(styles[variant.style]).value);
}
function chooseStyle(next){
  const ex=examples[currentExample];if(!styles[next]||!ex)return;
  const match=Object.keys(ex.variants).find(k=>ex.variants[k].style===next);
  if(next!==style&&match&&match!==currentVariant){selectVariant(match);return;}
  if(!match)return;
  style=next;
  for(const b of document.querySelectorAll('[data-ghdl-style]')){
    const available=Object.values(ex.variants).some(v=>v.style===b.dataset.ghdlStyle);
    b.disabled=!available;
    b.title=available?'Edit '+b.dataset.ghdlStyle+' model':'This exercise has no '+b.dataset.ghdlStyle+' model';
    const on=b.dataset.ghdlStyle===style;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));
  }
  for(const p of document.querySelectorAll('[data-ghdl-model]')){
    const on=p.dataset.ghdlModel===style;p.hidden=!on;p.classList.toggle('active',on);
  }
  $('ghdl-style-info').textContent={
    dataflow:'Concurrent assignments describe combinational logic. The selected variant is the one simulated.',
    behavioral:'Processes, conditions and state machines describe behavior. The selected variant is the one simulated.',
    structural:'Instances of smaller building blocks describe connectivity. The selected variant is the one simulated.'
  }[style];
}
function selectVariant(key){
  const ex=examples[currentExample],v=ex?.variants[key];if(!v)return;
  saveCurrentVariant();currentVariant=key;
  const textarea=$(styles[v.style]);textarea.value=drafts.get(currentExample+'/'+key)??v.rtl;
  fire(styles[v.style]);
  $('ghdl-variant').value=key;
  style=v.style;
  chooseStyle(style);
  $('ghdl-state').textContent=ex.label+' · '+v.label+' ready';
}
function showPanel(which){
  if(which==='schematic')which='logic';
  panel=which;
  for(const b of document.querySelectorAll('[data-ghdl-result]')){
    const on=b.dataset.ghdlResult===which;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));
  }
  for(const el of document.querySelectorAll('[data-ghdl-view]')){
    const on=el.dataset.ghdlView===which;el.hidden=!on;el.classList.toggle('active',on);
  }
  if(which==='wave'&&wave.data)wave.draw();
  if(which==='logic')renderLogicReference();
  if(which==='truth')renderTruthReference();
}
function renderLogicReference(){
  const id=$('ghdl-example').value;
  const graph=ASICGHDLCircuitDefinitions.graphFor(id,$('ghdl-design-top').value.trim(),activeRTL());
  // Pending input edits must not display STALE output values from an earlier run.
  let displayValues=null;
  if(!lastGhdlRunSucceeded||schematicInputDirty){
    displayValues={...schematicInputs};
    const preview=STIM.referenceOutputs(graph,schematicInputs);
    for(const p of graph.outputs)displayValues[p.id]=preview?.[p.id]??'–';
  }
  ASICGHDLSchematic.render($('ghdl-logic-symbol'),graph,{wave,style,afterRun:lastGhdlRunSucceeded&&!schematicInputDirty,displayValues,onInputClick:handlePinClick});
  $('ghdl-logic-description').textContent=graph.detail+(schematicInputDirty?' · Preview, not simulator-verified':lastGhdlRunSucceeded?' · Verified VCD values':' · Reference values');
}
function renderTruthReference(){
  const id=$('ghdl-example').value,ex=examples[id];
  const result=ASICGHDLSymbols.renderTable($('ghdl-truth-table'),id,ex?.label||'VHDL design');
  $('ghdl-table-heading').textContent=result.state?'State / Reference Table':'Truth Table / Reference';
  window.ASICClockEvents?.append($('ghdl-truth-table'),wave);
  $('ghdl-table-status').textContent=result.count?`${result.count} rows`:'Use waveform to inspect actual behavior';
}
function loadExample(){
  const name=$('ghdl-example').value,ex=examples[name];if(!ex)return;
  currentExample='';currentVariant='';drafts.clear();
  // Prepare one independent source editor per available modeling style.
  for(const [s,id] of Object.entries(styles)){
    const variant=Object.values(ex.variants).find(v=>v.style===s);
    $(id).value=variant?.rtl||'-- No '+s+' model is provided for this exercise.\n';fire(id);
  }
  $('ghdl-testbench').value=ex.test;fire('ghdl-testbench');
  $('ghdl-design-top').value=ex.design;$('ghdl-top').value=ex.top;
  $('ghdl-example-description').textContent=ex.description||'All examples include a self-checking VHDL testbench.';
  const sel=$('ghdl-variant');sel.replaceChildren();
  for(const [key,v] of Object.entries(ex.variants)){
    const o=document.createElement('option');o.value=key;o.textContent=v.label+' ('+v.style+')';sel.append(o);
  }
  currentExample=name;
  const first=Object.keys(ex.variants)[0];selectVariant(first);
  lastGhdlRunSucceeded=false;wave.clear('Run simulation to see a waveform.');setGhdlGTKButtons(false);setSchematic(null);buildSchematicControls();renderLogicReference();renderTruthReference();showPanel('log');
}
async function getAuthorized(path){
  let r=await fetch(API+path,{headers:authHeaders()});
  if(r.status===401&&await refreshAuthSession())r=await fetch(API+path,{headers:authHeaders()});
  if(!r.ok){const body=await r.json().catch(()=>({}));throw Error(body.error||`HTTP ${r.status}`);}return r;
}
function setGhdlGTKButtons(ready){
  $('ghdl-gtkw-open').disabled=!ready;
  $('ghdl-gtkw-export').disabled=!ready;
}
async function run(){
  if(!sessionId){alert('Start an EDA session first.');return;}
  $('ghdl-run').disabled=true;$('ghdl-state').textContent='Compiling and simulating '+style+'…';
  schematicHistory=[];schematicInputDirty=false;schematicInputVerified=false;updateHistory();inputStatus('Running original exercise testbench; change inputs afterward to start an experiment.');
  $('ghdl-output').textContent='GHDL is running in an isolated Docker container…';
  $('ghdl-result-summary').textContent='Processing…';$('ghdl-wave-download').disabled=true;
  wave.clear('Waiting for a VCD trace…');setGhdlGTKButtons(false);setSchematic(null);showPanel('log');
  try{
    const path=`/api/eda/sessions/${encodeURIComponent(sessionId)}/extra/ghdl/run`;
    let r=await fetch(API+path,{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({rtl:activeRTL(),testbench:$('ghdl-testbench').value,design_top:$('ghdl-design-top').value.trim(),top:$('ghdl-top').value.trim()})});
    if(r.status===401&&await refreshAuthSession())r=await fetch(API+path,{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({rtl:activeRTL(),testbench:$('ghdl-testbench').value,design_top:$('ghdl-design-top').value.trim(),top:$('ghdl-top').value.trim()})});
    const result=await r.json().catch(()=>({error:'Server returned an invalid response.'}));
    $('ghdl-output').textContent=result.output||result.error||'No log returned';
    if(result.error&& !result.output)$('ghdl-output').textContent+='\n'+result.error;
    $('ghdl-state').textContent=r.ok?'Simulation complete':'Simulation failed';lastGhdlRunSucceeded=r.ok;
    let gotWave=false,gotSchematic=false;
    if(result.has_wave){
      try{const v=await(await getAuthorized(`/api/eda/sessions/${encodeURIComponent(sessionId)}/ghdl/waveform`)).text();wave.show(v);$('ghdl-wave-download').disabled=false;setGhdlGTKButtons(true);gotWave=true;}
      catch(e){wave.clear('Waveform unavailable: '+e.message);}
    }
    if(result.has_schematic){
      try{const net=await(await getAuthorized(`/api/eda/sessions/${encodeURIComponent(sessionId)}/ghdl/schematic`)).json();if(!net?.modules||!Object.keys(net.modules).length)throw Error('Synthesized netlist contained no modules.');setSchematic(net);gotSchematic=true;}
      catch(e){setSchematic(null,'Schematic could not be read: '+e.message);}
    }else setSchematic(null,'Synthesis netlist not generated. The waveform can still be viewed after a successful GHDL simulation.');
    $('ghdl-result-summary').textContent=`${r.ok?'PASS':'FAIL'} · ${style} · ${gotWave?'VCD ready':'No VCD'} · Logic and truth reference available`;
    if(gotWave){wave.cursorTime=wave.data.end;wave.draw();}renderLogicReference();showPanel(gotWave?'wave':'log');
  }catch(e){lastGhdlRunSucceeded=false;$('ghdl-output').textContent='RUN FAILED\n'+e.message;$('ghdl-state').textContent='Failed';$('ghdl-result-summary').textContent='Run failed';showPanel('log');}
  finally{$('ghdl-run').disabled=false;}
}
function svgEl(name,attrs={},text){const e=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
function setSchematic(data,warning){
  schematic=data;schemZoom=1;
  const svg=$('ghdl-schematic-svg');svg.replaceChildren();lastSize=null;
  $('ghdl-schematic-details').textContent='Select a cell to inspect its type and connected nets.';
  const empty=$('ghdl-schematic-empty');empty.hidden=!!data;
  empty.textContent=warning||'A synthesized netlist is not available. Check the GHDL log and ensure the Docker image includes Yosys.';
  $('ghdl-schematic-status').textContent=data?'Synthesized connectivity ready':'No synthesized netlist';
  if(data)drawSchematic();
}
function drawSchematic(){
  if(!schematic)return;
  const svg=$('ghdl-schematic-svg');svg.replaceChildren();
  const modules=schematic.modules||{};const name=$('ghdl-design-top').value.trim();
  const m=modules[name]||modules['\\'+name]||Object.values(modules)[0];
  if(!m){setSchematic(null,'No top-level module in synthesis data.');return;}
  const ports=Object.entries(m.ports||{}),allCells=Object.entries(m.cells||{});
  const cells=allCells.slice(0,65), inputs=ports.filter(([,p])=>p.direction==='input'),outputs=ports.filter(([,p])=>p.direction==='output');
  const cols=[inputs.map(([n,p])=>({id:'in:'+n,label:n+(p.bits.length>1?` [${p.bits.length}]`:''),bits:p.bits})),[],outputs.map(([n,p])=>({id:'out:'+n,label:n+(p.bits.length>1?` [${p.bits.length}]`:''),bits:p.bits}))];
  const signalSource=new Map();for(const n of cols[0])for(const bit of n.bits)if(typeof bit==='number')signalSource.set(bit,n.id);
  for(const [name,c] of cells){
    const node={id:'cell:'+name,label:(c.type||'logic').replace(/^\\$/,''),detail:name,connections:c.connections||{},dirs:c.port_directions||{}};
    cols[1].push(node);
    for(const [p,bits] of Object.entries(node.connections))if(node.dirs[p]==='output')for(const bit of bits)if(typeof bit==='number')signalSource.set(bit,node.id);
  }
  const maxRows=Math.max(...cols.map(x=>x.length),1),rowH=70,width=1030,height=Math.max(230,maxRows*rowH+85);
  const positions=new Map(),xCols=[110,500,890];
  for(let j=0;j<cols.length;j++)for(let k=0;k<cols[j].length;k++){
    const n=cols[j][k];positions.set(n.id,{x:xCols[j],y:55+k*rowH+20,n});
  }
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);lastSize={width,height};
  svg.append(svgEl('rect',{x:0,y:0,width,height,fill:'#020808'}));
  const headings=['INPUT PORTS',`SYNTHESIZED CELLS (${allCells.length})`,'OUTPUT PORTS'];
  for(let i=0;i<3;i++)svg.append(svgEl('text',{x:xCols[i]-75,y:25,fill:'#8dbcd4','font-size':14,'font-weight':700},headings[i]));
  const wire=svgEl('g',{'stroke':'#d2565a','stroke-width':1.7,fill:'none',opacity:.7});svg.append(wire);
  // Yosys bit identifiers are the connection source of truth, not VHDL text guesses.
  let edgeCount=0;
  for(const [cellName,c] of cells){
    const dst=positions.get('cell:'+cellName);if(!dst)continue;
    for(const [port,bits] of Object.entries(c.connections||{})){
      if((c.port_directions||{})[port]!=='input')continue;
      for(const bit of new Set(bits)){
        const src=positions.get(signalSource.get(bit));if(!src||src.id===dst.id||edgeCount++>220)continue;
        const sx=src.x+91,dx=dst.x-91,sy=src.y,dy=dst.y;
        wire.append(svgEl('path',{d:`M ${sx} ${sy} C ${(sx+dx)/2} ${sy}, ${(sx+dx)/2} ${dy}, ${dx} ${dy}`}));
      }
    }
  }
  for(const out of cols[2]){
    const dst=positions.get(out.id);
    for(const bit of new Set(out.bits)){
      const src=positions.get(signalSource.get(bit));if(!src||edgeCount++>260)continue;
      const sx=src.x+91,dx=dst.x-91,sy=src.y,dy=dst.y;
      wire.append(svgEl('path',{d:`M ${sx} ${sy} C ${(sx+dx)/2} ${sy}, ${(sx+dx)/2} ${dy}, ${dx} ${dy}`}));
    }
  }
  for(let j=0;j<cols.length;j++)for(const n of cols[j]){
    const {x,y}=positions.get(n.id),isCell=j===1,g=svgEl('g',{tabindex:0,role:'button','aria-label':`${isCell?'Cell':'Port'} ${n.label}`});
    if(isCell){
      ASICGHDLSymbols.cellSymbol(g,n.label,x,y,165,49);
      g.append(svgEl('text',{x,y:y+40,'text-anchor':'middle',fill:'#7cf4a4','font-size':11,'font-family':'monospace'},(n.detail||'').slice(0,26)));
    }else{
      g.append(svgEl('rect',{x:x-90,y:y-24,width:180,height:49,rx:5,fill:'#0d3041',stroke:'#67d6b6','stroke-width':1.2}));
      g.append(svgEl('text',{x,y:y+5,'text-anchor':'middle',fill:'#f1fcff','font-size':12,'font-family':'monospace'},n.label.length>24?n.label.slice(0,21)+'…':n.label));
    }
    const describe=()=>{$('ghdl-schematic-details').textContent=isCell?`Cell: ${n.detail}\nType: ${n.label}\nConnections: ${JSON.stringify(n.connections,null,2)}`:`Port: ${n.label}\nBits: ${JSON.stringify(n.bits)}`;};
    g.addEventListener('click',describe);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();describe();}});
    svg.append(g);
  }
  if(allCells.length>cells.length)svg.append(svgEl('text',{x:380,y:height-14,fill:'#ffd18a','font-size':13},`Showing first ${cells.length} of ${allCells.length} synthesized cells`));
  $('ghdl-schematic-status').textContent=`${allCells.length} cells · ${inputs.length} input ports · ${outputs.length} output ports`;
  updateZoom();
}
function updateZoom(){if(!lastSize)return;const svg=$('ghdl-schematic-svg');svg.style.width=`${lastSize.width*schemZoom}px`;svg.style.height=`${lastSize.height*schemZoom}px`;$('ghdl-schem-zoom').textContent=Math.round(schemZoom*100)+'%';}
function focusToggle(){const root=$('ghdl-results');root.classList.toggle('ghdl-maximized');$('ghdl-focus').textContent=root.classList.contains('ghdl-maximized')?'Close Expanded View':'Expand Viewer';if(panel==='wave'&&wave.data)wave.draw();}
for(const b of document.querySelectorAll('[data-ghdl-style]'))b.addEventListener('click',()=>chooseStyle(b.dataset.ghdlStyle));
for(const b of document.querySelectorAll('[data-ghdl-result]'))b.addEventListener('click',()=>showPanel(b.dataset.ghdlResult));
$('ghdl-run').onclick=run;
$('ghdl-custom-project').onclick=()=>{$('ghdl-example').value='custom';loadExample();document.querySelector('[data-panel="ghdl"] .ghdl-editor-columns')?.scrollIntoView({block:'center',behavior:'smooth'});};
$('ghdl-jump-editors').onclick=()=>document.querySelector('[data-panel="ghdl"] .ghdl-editor-columns')?.scrollIntoView({block:'center',behavior:'smooth'});
$('ghdl-input-run').addEventListener('click',runSchematicInputs);
$('ghdl-clock-step').addEventListener('click',runSchematicInputs);
$('ghdl-input-reset').addEventListener('click',()=>{buildSchematicControls();schematicInputDirty=true;inputStatus('Inputs reset. Run GHDL to verify new outputs.');renderLogicReference();});
// Project export/import is independent of the exercise library and never changes the server.
const GHDL_PROJECT_FORMAT='ASIC-Skill GHDL project';
function downloadProjectDocument(name,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function saveGhdlProject(){
  saveCurrentVariant();
  const sources=Object.fromEntries(Object.entries(styles).map(([name,id])=>[name,$(id).value]));
  const doc={format:GHDL_PROJECT_FORMAT,version:1,example:currentExample,variant:currentVariant,
    design_top:$('ghdl-design-top').value,top:$('ghdl-top').value,
    sources,testbench:$('ghdl-testbench').value,drafts:Object.fromEntries(drafts)};
  downloadProjectDocument('asic-skill-ghdl-project.json',doc);
  $('ghdl-state').textContent='GHDL project saved: all modeling editors and testbench.';
}
async function openGhdlProject(file){
  if(!file)return;
  try{
    if(file.size>1500000)throw Error('Project exceeds the 1.5 MB limit.');
    const doc=JSON.parse(await file.text());
    if(doc.format!==GHDL_PROJECT_FORMAT||doc.version!==1||!doc.sources||typeof doc.sources!=='object'||typeof doc.testbench!=='string')throw Error('Not a supported GHDL project.');
    for(const model of Object.keys(styles))if(typeof doc.sources[model]!=='string'||doc.sources[model].length>350000)throw Error('Invalid '+model+' source.');
    if(doc.testbench.length>350000)throw Error('Testbench is too large.');
    if(!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(doc.design_top||'')||!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(doc.top||''))throw Error('Invalid design/testbench entity name.');
    const chosen=Object.hasOwn(examples,doc.example)?doc.example:'custom';
    $('ghdl-example').value=chosen;loadExample();
    if(doc.drafts&&typeof doc.drafts==='object'&&!Array.isArray(doc.drafts)){
      for(const [key,value] of Object.entries(doc.drafts))if(typeof value==='string'&&value.length<=350000)drafts.set(key,value);
    }
    const selected=Object.hasOwn(examples[chosen].variants,doc.variant)?doc.variant:Object.keys(examples[chosen].variants)[0];
    // Do not save the newly loaded default editor over the imported variant draft.
    currentVariant='';selectVariant(selected);
    for(const [model,id] of Object.entries(styles)){$(id).value=doc.sources[model];fire(id);}
    $('ghdl-testbench').value=doc.testbench;fire('ghdl-testbench');
    $('ghdl-design-top').value=doc.design_top;$('ghdl-top').value=doc.top;
    saveCurrentVariant();
    lastGhdlRunSucceeded=false;wave.clear('Project opened. Run GHDL to generate a new waveform.');setGhdlGTKButtons(false);
    setSchematic(null);buildSchematicControls();renderLogicReference();renderTruthReference();showPanel('log');
    $('ghdl-state').textContent='GHDL project opened. Your saved editors are ready.';
  }catch(e){$('ghdl-state').textContent='Could not open GHDL project: '+e.message;}
  finally{$('ghdl-project-file').value='';}
}
$('ghdl-save-project').onclick=saveGhdlProject;
$('ghdl-open-project').onclick=()=>$('ghdl-project-file').click();
$('ghdl-project-file').addEventListener('change',e=>openGhdlProject(e.target.files?.[0]));
$('ghdl-reset').onclick=loadExample;
$('ghdl-example').addEventListener('change',loadExample);
$('ghdl-variant').addEventListener('change',e=>selectVariant(e.target.value));
for(const [model,id] of Object.entries(styles))$(id).addEventListener('input',()=>{if(style===model&&currentExample&&currentVariant)drafts.set(currentExample+'/'+currentVariant,$(id).value);});
$('ghdl-focus').onclick=focusToggle;
$('ghdl-model-popout').onclick=()=>{const w=window.open('ghdl-model-window.html?style='+encodeURIComponent(style),'_blank');if(!w)alert('Allow pop-ups for this site to open the editor in a separate tab.');};
$('ghdl-gtkw-open').onclick=()=>{try{ASICGTKWave.openWorkspace('ghdl');}catch(e){$('ghdl-state').textContent=e.message;}};
$('ghdl-gtkw-export').onclick=()=>{try{ASICGTKWave.exportBundle(wave.raw,{selected:[...wave.selected],marker:wave.cursorTime||0});}catch(e){$('ghdl-state').textContent=e.message;}};
$('ghdl-popup-wave').onclick=()=>window.open('ghdl-viewer.html?view=wave','_blank','noopener=false');
$('ghdl-popup-schematic').onclick=()=>window.open('ghdl-viewer.html?view=schematic','_blank','noopener=false');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('ghdl-results').classList.contains('ghdl-maximized'))focusToggle();});
for(const [id,mult] of [['ghdl-schem-zoom-in',1.3],['ghdl-schem-zoom-out',1/1.3]])$(id).onclick=()=>{schemZoom=Math.max(.35,Math.min(3,schemZoom*mult));updateZoom();};
$('ghdl-schem-fit').onclick=()=>{if(!lastSize)return;schemZoom=Math.max(.35,Math.min(1,$('ghdl-schematic-scroll').clientWidth/lastSize.width));updateZoom();};
populateExampleSelect();loadExample();
// Deep links: eda-lab.html?tool=ghdl&example=half_adder&style=behavioral&view=logic
const ghdlParams=new URLSearchParams(location.search);
const linkedExample=ghdlParams.get('example');
if(linkedExample&&Object.prototype.hasOwnProperty.call(examples,linkedExample)){
  $('ghdl-example').value=linkedExample;loadExample();
  const requestedStyle=ghdlParams.get('style');
  if(requestedStyle&&styles[requestedStyle])chooseStyle(requestedStyle);
}

function focusEditor(which){
  if(which!=='testbench' && styles[which])chooseStyle(which);
  const id=which==='testbench'?'ghdl-testbench':styles[which];
  if(!id)return;
  // Keep the main EDA Lab in the same tab and preserve source, results and session.
  document.querySelector('[data-panel="ghdl"] .ghdl-editor-columns')?.scrollIntoView({block:'start',behavior:'smooth'});
  requestAnimationFrame(()=>$(id)?.focus({preventScroll:true}));
}
window.ASICGHDL={chooseStyle,focusEditor,showPanel,loadExample,examples,getViewData:()=>({vcd:wave.raw,net:schematic,designTop:$('ghdl-design-top').value}),getModelSource:s=>styles[s]?$(styles[s]).value:null,setModelSource:(s,source)=>{if(styles[s]&&typeof source==='string'){$(styles[s]).value=source;fire(styles[s]);}},getTestbenchSource:()=> $('ghdl-testbench').value,setTestbenchSource:source=>{if(typeof source==='string'){$('ghdl-testbench').value=source;fire('ghdl-testbench');}}};
})();
