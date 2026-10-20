const $=id=>document.getElementById(id),localHost=['localhost','127.0.0.1'].includes(location.hostname),API=String(window.ASIC_SKILL_EDA_API||(localHost?'http://127.0.0.1:8090':'')).replace(/\/$/,'');let authSession=null,sessionId=null,spefText='',sdfText='';
const DEFAULT_NETLIST=`module top (
    input  wire a,
    output wire y
);

    wire n1;
    wire n2;
    wire n3;

    BUF_X1 U1 (.A(a),  .Y(n1));
    BUF_X1 U2 (.A(n1), .Y(n2));
    BUF_X1 U3 (.A(n2), .Y(n3));
    BUF_X1 U4 (.A(n3), .Y(y));

endmodule
`;
const DEFAULT_LIBERTY=`library (demo_lib) {
    delay_model : table_lookup;
    time_unit : "1ns";
    voltage_unit : "1V";
    current_unit : "1mA";
    capacitive_load_unit (1, pf);
    nom_process : 1;
    nom_voltage : 1.0;
    nom_temperature : 25;

    lu_table_template (delay_template) {
        variable_1 : input_net_transition;
        variable_2 : total_output_net_capacitance;
        index_1 ("0.01, 0.10");
        index_2 ("0.01, 0.10");
    }

    cell (BUF_X1) {
        area : 1.0;
        pin (A) {
            direction : input;
            capacitance : 0.01;
        }
        pin (Y) {
            direction : output;
            function : "A";
            timing () {
                related_pin : "A";
                timing_sense : positive_unate;
                cell_rise (delay_template) {
                    values ("0.05, 0.08", "0.07, 0.10");
                }
                cell_fall (delay_template) {
                    values ("0.05, 0.08", "0.07, 0.10");
                }
                rise_transition (delay_template) {
                    values ("0.02, 0.03", "0.03, 0.04");
                }
                fall_transition (delay_template) {
                    values ("0.02, 0.03", "0.03, 0.04");
                }
            }
        }
    }
}
`;
const DEFAULT_SDC=`create_clock -name VCLK -period 0.500
set_input_delay 0.100 -clock VCLK [get_ports a]
set_output_delay 0.150 -clock VCLK [get_ports y]
set_input_transition 0.125 [get_ports a]
set_load 0.040 [get_ports y]
set_timing_derate -late 1.10
`;
function resetDefaultExample(){
  $('netlist').value=DEFAULT_NETLIST;
  $('liberty').value=DEFAULT_LIBERTY;
  $('sdc').value=DEFAULT_SDC;
  $('top-module').value='top';
  spefText=''; sdfText='';
  $('spef-name').textContent='None'; $('sdf-name').textContent='None';
  $('schematic-status').textContent='Default 4-buffer timing example restored. Generate schematic when ready.';
}
resetDefaultExample();
async function refresh(){try{const {data,error}=await supabaseClient.auth.refreshSession();if(!error&&data?.session){authSession=data.session;return true}}catch{}const {data:{session}}=await supabaseClient.auth.getSession();authSession=session||null;return !!authSession}function hdr(x={}){return {...x,Authorization:`Bearer ${authSession?.access_token||''}`}}async function api(path,opt={},retry=false){let r=await fetch(API+path,{...opt,headers:hdr(opt.headers||{})});if(r.status===401&&!retry&&await refresh())return api(path,opt,true);let b=await r.json().catch(()=>({}));if(!r.ok)throw new Error((b.error||`API ${r.status}`)+(b.output?'\n'+b.output:''));return b}function tab(n){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===n));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===n))}
async function start(){try{let b=await api('/api/eda/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});sessionId=b.session_id;$('session-status').textContent=`${sessionId.slice(0,8)} · isolated workspace`;$('start-session').hidden=true;$('end-session').hidden=false}catch(e){alert(e.message)}}async function end(){if(!sessionId)return;try{await api('/api/eda/sessions/'+sessionId,{method:'DELETE'})}catch{}sessionId=null;$('session-status').textContent='Not started';$('start-session').hidden=false;$('end-session').hidden=true}
function fill(pfx,p){let map={start:'startpoint',end:'endpoint',arrival:'arrival',required:'required',slack:'slack',group:'path_group'};for(let k in map)$(pfx+'-'+k).textContent=p?.[map[k]]||'—';let e=$(pfx+'-status');e.textContent=p?.status||'—';e.className=p?.status==='MET'?'met':p?.status==='VIOLATED'?'violated':''}

function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderNetlistSchematic(data){
  const svg=$('schematic-svg');
  const mod=data?.module||{};
  const cells=Object.entries(mod.cells||{}).map(([name,c])=>({name,type:c.type||'cell',dirs:c.port_directions||{},conns:c.connections||{}}));
  const ports=Object.entries(mod.ports||{}).map(([name,p])=>({name,direction:p.direction,bits:p.bits||[]}));
  const inputs=ports.filter(p=>p.direction==='input'), outputs=ports.filter(p=>p.direction==='output');

  // Yosys can preserve library cells as black boxes. Infer common standard-cell
  // output names so that A/Y-style library cells still get complete connectivity.
  const outputPin=/^(Y|Q|QN|Z|ZN|O|OUT|X|CO|COUT)$/i;
  const pinDir=(c,pin)=>c.dirs?.[pin] || (outputPin.test(pin)?'output':'input');
  const pins=(c,dir)=>Object.keys(c.conns||{}).filter(pin=>pinDir(c,pin)===dir);

  // Keep the originating/sink pin on every net. This lets the SVG draw the
  // wire from the actual pin position instead of the centre of the cell.
  const src=new Map(), sinks=new Map();
  const addSink=(b,n)=>{
    if(typeof b!=='number')return;
    if(!sinks.has(b))sinks.set(b,[]);
    sinks.get(b).push(n);
  };
  inputs.forEach(p=>p.bits.forEach(b=>{
    if(typeof b==='number')src.set(b,{kind:'port',id:'in:'+p.name,name:p.name});
  }));
  cells.forEach(c=>Object.entries(c.conns).forEach(([pin,bits])=>{
    const d=pinDir(c,pin);
    (bits||[]).forEach(b=>{
      if(d==='output'&&typeof b==='number')src.set(b,{kind:'cell',id:'cell:'+c.name,cell:c.name,pin});
      else if(d==='input')addSink(b,{kind:'cell',id:'cell:'+c.name,cell:c.name,pin});
    });
  }));
  outputs.forEach(p=>p.bits.forEach(b=>addSink(b,{kind:'port',id:'out:'+p.name,name:p.name})));

  const preds=new Map(cells.map(c=>[c.name,new Set()]));
  cells.forEach(c=>Object.entries(c.conns).forEach(([pin,bits])=>{
    if(pinDir(c,pin)!=='input')return;
    (bits||[]).forEach(b=>{
      const q=src.get(b);
      if(q?.kind==='cell')preds.get(c.name).add(q.cell);
    });
  }));

  const depth=new Map();
  let changed=true, guard=0;
  while(changed&&guard++<cells.length+5){
    changed=false;
    for(const c of cells){
      let d=1;
      for(const p of preds.get(c.name)||[])d=Math.max(d,(depth.get(p)||1)+1);
      if(depth.get(c.name)!==d){depth.set(c.name,d);changed=true}
    }
  }

  const maxD=Math.max(1,...[...depth.values()]);
  const W=Math.max(1250,380+(maxD+1)*230);
  const H=Math.max(520,Math.max(inputs.length,outputs.length,Math.ceil(cells.length/Math.max(maxD,1)))*125+140);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);

  const pos=new Map();
  const cellByName=new Map(cells.map(c=>[c.name,c]));
  const spread=(arr,x,prefix)=>{
    const gap=H/(arr.length+1);
    arr.forEach((o,i)=>pos.set(prefix+o.name,{x,y:(i+1)*gap}));
  };
  spread(inputs,70,'in:');
  spread(outputs,W-70,'out:');

  for(let d=1;d<=maxD;d++){
    const arr=cells.filter(c=>(depth.get(c.name)||1)===d);
    const x=205+d*((W-410)/(maxD+1));
    const gap=H/(arr.length+1);
    arr.forEach((c,i)=>pos.set('cell:'+c.name,{x,y:(i+1)*gap}));
  }

  const cellGeom=c=>{
    const count=Math.max(pins(c,'input').length,pins(c,'output').length,1);
    return {w:168,h:Math.max(92,66+count*18)};
  };
  const pinPoint=(cellName,pin,dir)=>{
    const c=cellByName.get(cellName),q=pos.get('cell:'+cellName);
    if(!c||!q)return null;
    const list=pins(c,dir),g=cellGeom(c);
    const idx=Math.max(0,list.indexOf(pin));
    const n=Math.max(list.length,1);
    // pin rows live below the type/instance labels and are evenly distributed.
    const y0=q.y-g.h/2+61;
    const usable=Math.max(0,g.h-70);
    const y=n===1?q.y+24:y0+(usable*Math.min(idx,n-1)/Math.max(1,n-1));
    return {x:q.x+(dir==='output'?g.w/2:-g.w/2),y};
  };
  const endpointPoint=o=>{
    if(o.kind==='cell')return pinPoint(o.cell,o.pin,o.pin?pinDir(cellByName.get(o.cell),o.pin):'input');
    const q=pos.get(o.id);
    if(!q)return null;
    return {x:q.x+(o.id.startsWith('in:')?45:-45),y:q.y};
  };

  let lines='';
  for(const [bit,ss] of sinks){
    const a=src.get(bit);
    if(!a)continue;
    const pa=endpointPoint(a);
    if(!pa)continue;
    for(const sk of ss){
      if(sk.id===a.id)continue;
      const pb=endpointPoint(sk);
      if(!pb)continue;
      const mid=(pa.x+pb.x)/2;
      lines+=`<path d="M${pa.x} ${pa.y} C${mid} ${pa.y},${mid} ${pb.y},${pb.x} ${pb.y}" fill="none" stroke="#38bdf8" stroke-width="3" opacity=".95" marker-end="url(#netArrow)"/>`;
    }
  }

  let nodes='';
  for(const p of inputs){
    const q=pos.get('in:'+p.name);
    nodes+=`<g><rect x="${q.x-45}" y="${q.y-22}" width="90" height="44" rx="12" fill="#0e3854" stroke="#34d4f4"/><text x="${q.x}" y="${q.y+5}" text-anchor="middle" fill="#eaf8ff" font-size="16" font-weight="700">${esc(p.name)}</text></g>`;
  }
  for(const c of cells){
    const q=pos.get('cell:'+c.name),g=cellGeom(c),left=q.x-g.w/2,right=q.x+g.w/2,top=q.y-g.h/2;
    nodes+=`<g><rect x="${left}" y="${top}" width="${g.w}" height="${g.h}" rx="11" fill="#10283c" stroke="#6ae6ff"/>`;
    nodes+=`<text x="${q.x}" y="${top+23}" text-anchor="middle" fill="#67e8f9" font-size="15" font-weight="800">${esc(c.type)}</text>`;
    nodes+=`<text x="${q.x}" y="${top+43}" text-anchor="middle" fill="#b7d4e8" font-size="12">${esc(c.name)}</text>`;
    for(const pin of pins(c,'input')){
      const pp=pinPoint(c.name,pin,'input');
      nodes+=`<circle cx="${left}" cy="${pp.y}" r="3.5" fill="#38bdf8"/><text x="${left+10}" y="${pp.y+4}" text-anchor="start" fill="#d7f5ff" font-size="11" font-weight="700">${esc(pin)}</text>`;
    }
    for(const pin of pins(c,'output')){
      const pp=pinPoint(c.name,pin,'output');
      nodes+=`<circle cx="${right}" cy="${pp.y}" r="3.5" fill="#38bdf8"/><text x="${right-10}" y="${pp.y+4}" text-anchor="end" fill="#d7f5ff" font-size="11" font-weight="700">${esc(pin)}</text>`;
    }
    nodes+='</g>';
  }
  for(const p of outputs){
    const q=pos.get('out:'+p.name);
    nodes+=`<g><rect x="${q.x-45}" y="${q.y-22}" width="90" height="44" rx="12" fill="#16412f" stroke="#62ef9c"/><text x="${q.x}" y="${q.y+5}" text-anchor="middle" fill="#eafff0" font-size="16" font-weight="700">${esc(p.name)}</text></g>`;
  }

  svg.innerHTML=`<defs><marker id="netArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker></defs><rect width="100%" height="100%" fill="#020b12"/>${lines}${nodes}`;
  const connected=[...sinks.entries()].reduce((n,[bit,ss])=>n+(src.has(bit)?ss.length:0),0);
  $('schematic-status').textContent=`${cells.length} cell${cells.length===1?'':'s'} · ${inputs.length} input${inputs.length===1?'':'s'} · ${outputs.length} output${outputs.length===1?'':'s'} · ${connected} connection${connected===1?'':'s'} · cell pins labelled`;
}
async function generateSchematic(){
  if(!sessionId)return alert('Start an OpenSTA session first.');
  $('generate-schematic').disabled=true;$('schematic-status').textContent='Generating schematic with Yosys…';
  try{const body={top:$('top-module').value.trim(),netlist:$('netlist').value};const b=await api(`/api/eda/sessions/${sessionId}/opensta/schematic`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});renderNetlistSchematic(b.netlist);tab('schematic')}catch(e){$('schematic-status').textContent='ERROR: '+e.message;$('console').textContent=e.message;tab('console')}finally{$('generate-schematic').disabled=false}}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function showStaProgress(stage,percent,log,status='running'){
  $('run-progress-area').hidden=false;
  $('run-stage').textContent=stage||'Starting OpenSTA...';
  percent=Math.max(0,Math.min(100,Number(percent)||0));
  $('run-progress-percent').textContent=percent+'%';
  $('run-progress-track').setAttribute('aria-valuenow',String(percent));
  $('run-progress-track').classList.toggle('running',status==='running'||status==='queued');
  $('run-progress-bar').style.width=percent+'%';
  if(log!==undefined&&$('run-log').textContent!==log){
    const el=$('run-log');
    const nearEnd=el.scrollHeight-el.scrollTop-el.clientHeight<100;
    el.textContent=log||'Waiting for OpenSTA output...';
    if(nearEnd)el.scrollTop=el.scrollHeight;
  }
}
function fillStaResults(result){
  fill('setup',result.setup);fill('hold',result.hold);
  $('setup-report').textContent=result.setup_report||'No setup path reported.';
  $('hold-report').textContent=result.hold_report||'No hold path reported.';
  $('endpoint-report').textContent=result.endpoint_report||'No endpoint summary reported.';
  const summary=result.constraints_summary||'No transition/derate settings returned.';
  $('run-constraints').textContent=summary;
  $('constraint-report').textContent=summary;
  $('console').textContent=summary+'\n'+(result.console||'Timing analysis completed; no extra stdout was produced.');
  $('run-results').hidden=false;
}
async function run(){
  if(!sessionId)return alert('Start an OpenSTA session first.');
  const currentSession=sessionId;
  $('run-analysis').disabled=true;
  $('run-results').hidden=true;
  $('run-status').classList.remove('error');
  $('run-status').textContent='Starting detailed timing analysis...';
  showStaProgress('Submitting analysis',0,'Submitting Verilog, Liberty and SDC to the lab...');
  // Keep the execution visible in Run STA. Timing Paths is an explicit next step.
  tab('run');
  try{
    const body={top:$('top-module').value.trim(),paths:+$('path-count').value,
      netlist:$('netlist').value,liberty:$('liberty').value,sdc:$('sdc').value,
      spef:spefText,sdf:sdfText};
    const created=await api(`/api/eda/sessions/${currentSession}/opensta/run/start`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
    });
    let state;
    do{
      await sleep(1100);
      state=await api(`/api/eda/sessions/${currentSession}/opensta/run/jobs/${created.job_id}`);
      showStaProgress(state.stage,state.progress,state.log,state.status);
      $('run-status').textContent=state.status==='failed'?'Timing analysis failed.':
        state.status==='completed'?'Timing reports ready.':state.stage+'...';
      if(currentSession!==sessionId)throw new Error('The lab session changed during this analysis.');
    }while(state.status==='queued'||state.status==='running');
    if(state.status!=='completed')throw new Error(state.error||'STA analysis failed.');
    fillStaResults(state.result);
    $('run-status').textContent='Timing analysis complete. Review the actual run log below or open Timing Paths.';
    // Schematic is a separate optional operation; do not hide or delay STA results.
    try{
      const sb=await api(`/api/eda/sessions/${currentSession}/opensta/schematic`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({top:body.top,netlist:body.netlist})
      });
      renderNetlistSchematic(sb.netlist);
    }catch(e){
      $('schematic-status').textContent='Schematic unavailable: '+e.message;
    }
  }catch(e){
    $('run-status').textContent='ERROR: '+e.message;
    $('run-status').classList.add('error');
    showStaProgress('Analysis failed',Number($('run-progress-track').getAttribute('aria-valuenow'))||0,$('run-log').textContent+'\nERROR: '+e.message,'failed');
  }finally{$('run-analysis').disabled=false;}
}

function appendConsole(text){
  const el=$('console');
  const current=el.textContent==='OpenSTA console ready. Start a lab session, then enter a command below.'?'':el.textContent;
  el.textContent=(current?current.replace(/\s+$/,'')+'\n\n':'')+String(text??'');
  el.scrollTop=el.scrollHeight;
}
async function runConsoleCommand(command){
  command=String(command??$('console-command').value??'').trim();
  if(!command)return;
  if(!sessionId)return alert('Start an OpenSTA session first.');
  $('run-console').disabled=true;
  $('console-status').textContent='Running OpenSTA command…';
  appendConsole(`sta> ${command}`);
  try{
    const body={
      top:$('top-module').value.trim(),
      netlist:$('netlist').value,
      liberty:$('liberty').value,
      sdc:$('sdc').value,
      spef:spefText,
      sdf:sdfText,
      command
    };
    const b=await api(`/api/eda/sessions/${sessionId}/opensta/console`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    appendConsole(b.output||'(command completed with no output)');
    $('console-status').textContent='Command completed.';
  }catch(e){
    appendConsole('ERROR: '+e.message);
    $('console-status').textContent='Command failed.';
  }finally{
    $('run-console').disabled=false;
  }
}
async function file(inp,target,kind){let f=inp.files?.[0];if(!f)return;let t=await f.text();if(kind==='spef'){spefText=t;$('spef-name').textContent=f.name}else if(kind==='sdf'){sdfText=t;$('sdf-name').textContent=f.name}else $(target).value=t}
async function init(){const {data:{session}}=await supabaseClient.auth.getSession();authSession=session||null;if(!authSession){location.href='signin.html?next='+encodeURIComponent('opensta-lab.html');return}await refresh();$('auth-state').textContent='Signed In'}document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$('start-session').onclick=start;$('end-session').onclick=end;$('run-analysis').onclick=run;$('view-paths').onclick=()=>tab('paths');$('reset-default').onclick=resetDefaultExample;$('generate-schematic').onclick=generateSchematic;$('fit-schematic').onclick=()=>{$('schematic-svg').setAttribute('preserveAspectRatio','xMidYMid meet')};
$('run-console').onclick=()=>runConsoleCommand();
$('clear-console').onclick=()=>{$('console').textContent='';$('console-status').textContent='Console cleared.'};
$('console-command').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runConsoleCommand()}});
document.querySelectorAll('[data-console-command]').forEach(b=>b.onclick=()=>{$('console-command').value=b.dataset.consoleCommand;runConsoleCommand(b.dataset.consoleCommand)});
$('file-netlist').onchange=e=>file(e.target,'netlist');$('file-liberty').onchange=e=>file(e.target,'liberty');$('file-sdc').onchange=e=>file(e.target,'sdc');$('file-spef').onchange=e=>file(e.target,null,'spef');$('file-sdf').onchange=e=>file(e.target,null,'sdf');init();
