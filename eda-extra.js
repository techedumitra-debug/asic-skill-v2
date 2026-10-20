/* Additional EDA workflows; reuse the authenticated EDA session and API helper. */
(() => {
  const defaultValues={};
  for(const id of ['ngspice-netlist','verilator-rtl','verilator-testbench','ghdl-rtl','ghdl-testbench']){
    defaultValues[id]=$(id).value;
  }
  function state(tool,msg){$(tool+'-state').textContent=msg;}
  function guard(){if(sessionId)return true;alert('Start an EDA session first.');return false;}
  async function runTool(tool,payload){
    if(!guard())return;
    const button=$(tool+'-run');button.disabled=true;state(tool,'Running…');
    $(tool+'-output').textContent='Executing inside an isolated Docker container…\n';
    if(tool==='ghdl')$('ghdl-wave-download').disabled=true;
    try{
      const b=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/extra/${tool}/run`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
      });
      $(tool+'-output').textContent=b.output||'Command completed without output.';
      state(tool,tool==='verilator'?'Lint completed':'Simulation complete');
      if(tool==='ghdl')$('ghdl-wave-download').disabled=!b.has_wave;
      append('flow',tool+': completed');
    }catch(e){$(tool+'-output').textContent='RUN FAILED\n'+e.message;state(tool,'Failed');append('flow',tool+': failed');}
    finally{button.disabled=false;}
  }
  let verilatorViewer=null;
  const verilatorButtons=['verilator-run','verilator-sim-run','verilator-coverage-run'];
  function resetVerilatorArtifacts(){
    $('verilator-wave-panel').hidden=true;
    $('verilator-coverage-summary').hidden=true;
    $('verilator-coverage-summary').textContent='';
    $('verilator-coverage-export').disabled=true;
    $('verilator-wave-export').disabled=true;
    $('verilator-result-count').textContent='';
  }
  async function getVerilatorAsset(kind){
    const endpoint=`/api/eda/sessions/${encodeURIComponent(sessionId)}/verilator/artifact/${kind}`;
    let r=await fetch(API+endpoint,{headers:authHeaders()});
    if(r.status===401&&await refreshAuthSession())r=await fetch(API+endpoint,{headers:authHeaders()});
    if(!r.ok)throw Error('Result file is not available.');
    return r;
  }
  async function runVerilator(mode){
    if(!guard())return;
    verilatorButtons.forEach(id=>$(id).disabled=true);
    state('verilator','Running…');resetVerilatorArtifacts();
    $('verilator-output').textContent=mode==='lint'?'Checking RTL…':'Compiling and running testbench…';
    const payload={mode,rtl:$('verilator-rtl').value,top:$('verilator-top').value.trim()};
    if(mode!=='lint'){
      payload.testbench=$('verilator-testbench').value;
      payload.test_top=$('verilator-test-top').value.trim();
    }
    try{
      const path=`/api/eda/sessions/${encodeURIComponent(sessionId)}/extra/verilator/run`;
      let r=await fetch(API+path,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});
      if(r.status===401&&await refreshAuthSession())r=await fetch(API+path,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});
      const data=await r.json().catch(()=>({}));
      $('verilator-output').textContent=(data.output||data.error||'No output was returned.').slice(-80000);
      const ok=r.ok&&data.ok===true;
      state('verilator',ok?(mode==='lint'?'CHECK COMPLETE':'PASS'):'FAIL');
      $('verilator-result-count').textContent=ok?(mode==='lint'?'RTL checks completed':'Testbench exited successfully'):(data.error||'Review errors in the log');
      append('flow','RTL Performance: '+(ok?'completed':'failed'));
      if(data.coverage){
        const cov=data.coverage;
        const text=cov.line_percent===null?'Line coverage: unavailable':`RTL line coverage: ${cov.line_percent}% (${cov.line_covered}/${cov.line_total} lines)`;
        $('verilator-coverage-summary').textContent=text+'\n'+(cov.note||'');
        $('verilator-coverage-summary').hidden=false;
        $('verilator-coverage-export').disabled=!data.has_coverage;
      }
      if(data.has_wave){
        $('verilator-wave-export').disabled=false;
        try{
          const resp=await getVerilatorAsset('waveform');
          const vcd=await resp.text();
          $('verilator-wave-panel').hidden=false;
          if(!verilatorViewer)verilatorViewer=new ASICWaveViewer('verilator-wave-');
          verilatorViewer.show(vcd);
        }catch(err){$('verilator-result-count').textContent+=' · Waveform unavailable: '+err.message;$('verilator-wave-panel').hidden=true;}
      }
    }catch(err){state('verilator','ERROR');$('verilator-output').textContent='Execution error: '+err.message;}
    finally{verilatorButtons.forEach(id=>$(id).disabled=false);}
  }
  $('verilator-wave-export').onclick=async()=>{
    try{const r=await getVerilatorAsset('waveform');const u=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=u;a.download='rtl-waveform.vcd';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}
    catch(err){state('verilator',err.message);}
  };
  $('verilator-coverage-export').onclick=async()=>{
    try{const r=await getVerilatorAsset('coverage');const u=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=u;a.download='rtl-coverage.info';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}
    catch(err){state('verilator',err.message);}
  };
  $('ngspice-run').onclick=()=>runTool('ngspice',{netlist:$('ngspice-netlist').value});
  $('verilator-run').onclick=()=>runVerilator('lint');
  $('verilator-sim-run').onclick=()=>runVerilator('simulate');
  $('verilator-coverage-run').onclick=()=>runVerilator('coverage');
  $('ghdl-run').onclick=()=>runTool('ghdl',{rtl:$('ghdl-rtl').value,testbench:$('ghdl-testbench').value,top:$('ghdl-top').value.trim()});
  $('ngspice-reset').onclick=()=>{ $('ngspice-netlist').value=defaultValues['ngspice-netlist'];$('ngspice-netlist').dispatchEvent(new Event('input',{bubbles:true}));};
  $('verilator-reset').onclick=()=>{for(const id of ['verilator-rtl','verilator-testbench']){$(id).value=defaultValues[id];$(id).dispatchEvent(new Event('input',{bubbles:true}));}$('verilator-top').value='alu';$('verilator-test-top').value='tb_alu';};
  $('ghdl-reset').onclick=()=>{for(const id of ['ghdl-rtl','ghdl-testbench']){$(id).value=defaultValues[id];$(id).dispatchEvent(new Event('input',{bubbles:true}));}$('ghdl-top').value='tb_counter';};
  async function authenticatedDownload(path,filename){
    let response=await fetch(API+path,{headers:authHeaders()});
    if(response.status===401&&await refreshAuthSession())response=await fetch(API+path,{headers:authHeaders()});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error||'Download failed');}
    const url=URL.createObjectURL(await response.blob()),a=document.createElement('a');
    a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  $('klayout-start').onclick=async()=>{
    if(!guard())return;
    const button=$('klayout-start');button.disabled=true;
    $('klayout-state').textContent='Starting GUI…';
    const popup=window.open('about:blank','_blank');
    try{
      const b=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/klayout/start`,{method:'POST'});
      $('klayout-output').textContent='KLayout desktop ready.\nOpen local desktop: '+b.url+'\nUse File → Open to inspect /workspace/asic_skill_demo.gds.\n';
      $('klayout-state').textContent='Desktop ready';
      // Local URL comes from authenticated backend and is bound to loopback.
      if(popup){popup.opener=null;popup.location.replace(b.url);}
      else $('klayout-output').textContent+='\nPopup blocked: allow popups for this page or copy the desktop URL above.';
    }catch(e){if(popup)popup.close();$('klayout-state').textContent='Startup failed';$('klayout-output').textContent=e.message;}
    finally{button.disabled=false;}
  };
  $('klayout-file').onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!guard()){e.target.value='';return;}
    if(file.size>10_000_000){$('klayout-state').textContent='Layout exceeds 10 MB';return;}
    try{
      const form=new FormData();form.append('layout',file);
      const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/klayout/upload`,{method:'POST',body:form});
      $('klayout-state').textContent='Layout uploaded';
      $('klayout-output').textContent=result.message+'\n'+result.file+'\nOpen with File → Open in the KLayout desktop.';
    }catch(err){$('klayout-state').textContent='Upload error';$('klayout-output').textContent=err.message;}
    finally{e.target.value='';}
  };
  $('klayout-demo').onclick=async()=>{
    if(!guard())return;
    try{await authenticatedDownload(`/api/eda/sessions/${encodeURIComponent(sessionId)}/klayout/layout/demo`,'asic_skill_demo.gds');}
    catch(err){$('klayout-state').textContent=err.message;}
  };
  async function refreshExtraHealth(){
    try{
      const b=await fetch(API+'/health').then(r=>r.json());
      for(const tool of ['klayout','ngspice','verilator','ghdl']){
        const el=$('status-'+tool);if(!el)continue;
        const ready=Boolean(b.tools?.[tool]);
        el.textContent=ready?'Ready':'Build optional image';el.className=ready?'ok':'warn';
      }
    }catch{
      for(const tool of ['klayout','ngspice','verilator','ghdl']){
        const el=$('status-'+tool);if(el){el.textContent='API offline';el.className='warn';}
      }
    }
  }
  refreshExtraHealth();
})();
