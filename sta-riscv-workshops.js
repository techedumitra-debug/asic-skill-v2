/* Educational OpenSTA comparison and RISC-V Linux-ABI labs; no repository URLs exposed. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const STA_EXAMPLES = {"rtl": "module top (\n    input  wire a,\n    output wire y\n);\n\n    wire n1;\n    wire n2;\n    wire n3;\n\n    BUF_X1 U1 (.A(a),  .Y(n1));\n    BUF_X1 U2 (.A(n1), .Y(n2));\n    BUF_X1 U3 (.A(n2), .Y(n3));\n    BUF_X1 U4 (.A(n3), .Y(y));\n\nendmodule\n", "lib": "library (demo_lib) {\n    delay_model : table_lookup;\n    time_unit : \"1ns\";\n    voltage_unit : \"1V\";\n    current_unit : \"1mA\";\n    capacitive_load_unit (1, pf);\n    nom_process : 1;\n    nom_voltage : 1.0;\n    nom_temperature : 25;\n\n    lu_table_template (delay_template) {\n        variable_1 : input_net_transition;\n        variable_2 : total_output_net_capacitance;\n        index_1 (\"0.01, 0.10\");\n        index_2 (\"0.01, 0.10\");\n    }\n\n    cell (BUF_X1) {\n        area : 1.0;\n        pin (A) {\n            direction : input;\n            capacitance : 0.01;\n        }\n        pin (Y) {\n            direction : output;\n            function : \"A\";\n            timing () {\n                related_pin : \"A\";\n                timing_sense : positive_unate;\n                cell_rise (delay_template) {\n                    values (\"0.05, 0.08\", \"0.07, 0.10\");\n                }\n                cell_fall (delay_template) {\n                    values (\"0.05, 0.08\", \"0.07, 0.10\");\n                }\n                rise_transition (delay_template) {\n                    values (\"0.02, 0.03\", \"0.03, 0.04\");\n                }\n                fall_transition (delay_template) {\n                    values (\"0.02, 0.03\", \"0.03, 0.04\");\n                }\n            }\n        }\n    }\n}\n", "sdc": "create_clock -name VCLK -period 0.500\nset_input_delay 0.100 -clock VCLK [get_ports a]\nset_output_delay 0.150 -clock VCLK [get_ports y]\nset_input_transition 0.125 [get_ports a]\nset_load 0.040 [get_ports y]\nset_timing_derate -late 1.10\n"};
  const RISC_EXAMPLES = {
    sum: `#include <stdio.h>

int main(void) {
    int sum = 0;
    for (int i = 1; i <= 9; ++i) sum += i;
    printf("Sum from 1 to 9 is %d\n", sum);
    return 0;
}
`,
    fib: `#include <stdio.h>

int main(void) {
    int a = 0, b = 1;
    for (int i = 0; i < 10; ++i) {
        printf("%d ", a);
        int next = a + b;
        a = b; b = next;
    }
    puts("");
    return 0;
}
`,
    bit: `#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint32_t status = 0x15u;
    status |= 1u << 5;
    status &= ~(1u << 2);
    printf("Status = 0x%X\n", status);
    return 0;
}
`
  };
  const records = {baseline: null, derated: null, custom: null};
  let latestSta = null;
  let riscvAsm = '';

  function trigger(id, value) {
    const node=el(id); node.value=value;
    node.dispatchEvent(new Event('input', {bubbles:true}));
  }
  function updateSettings(transition, derate) {
    let s = el('sta-workshop-sdc').value;
    s = s.replace(/^\s*set_input_transition[^\n]*$/gm, '').replace(/^\s*set_timing_derate[^\n]*$/gm, '').trim();
    s += `\nset_input_transition ${transition.toFixed(3)} [get_ports a]\nset_timing_derate -late ${derate.toFixed(2)}\n`;
    trigger('sta-workshop-sdc', s);
  }
  function resetSta() {
    trigger('sta-workshop-netlist',STA_EXAMPLES.rtl);
    trigger('sta-workshop-liberty',STA_EXAMPLES.lib);
    trigger('sta-workshop-sdc',STA_EXAMPLES.sdc);
    el('sta-workshop-top').value='top';
    el('sta-workshop-state').textContent='Default teaching example restored';
  }
  function compareText() {
    const summary = r => {
      if (!r) return 'Not run';
      const p=r.result.setup||{};
      return `setup slack: ${p.slack||'see path report'} ns | arrival: ${p.arrival||'—'} | required: ${p.required||'—'} | hold slack: ${r.result.hold?.slack||'see hold report'} ns`;
    };
    el('sta-workshop-comparison').textContent=
      'Experiment A · transition 0.050 ns / late derate 1.00\n' + summary(records.baseline) +
      '\n\nExperiment B · transition 0.125 ns / late derate 1.10\n' + summary(records.derated) +
      '\n\nCompare the reported delays, slew and slack; changes depend on timing arcs.';
  }
  const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
  async function runSta(mode) {
    if(!sessionId) { el('sta-workshop-state').textContent='Start an EDA session first.';return; }
    const top=el('sta-workshop-top').value.trim();
    if(!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(top)) {
      el('sta-workshop-state').textContent='Invalid top module name.';return;
    }
    if(mode==='baseline') updateSettings(0.050,1.00);
    if(mode==='derated') updateSettings(0.125,1.10);
    const buttons=['sta-workshop-run','sta-workshop-baseline','sta-workshop-derated'];
    buttons.forEach(id=>el(id).disabled=true);
    el('sta-workshop-output').textContent='Submitting STA analysis…';
    el('sta-workshop-state').textContent='Starting OpenSTA';
    try {
      const body={netlist:el('sta-workshop-netlist').value,liberty:el('sta-workshop-liberty').value,
                  sdc:el('sta-workshop-sdc').value,top,paths:5};
      const started=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/opensta/run/start`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      });
      let completed=null;
      for(let i=0;i<330;i++) {
        await sleep(1100);
        const job=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/opensta/run/jobs/${encodeURIComponent(started.job_id)}`);
        el('sta-workshop-state').textContent=`${job.stage} (${job.progress}%)`;
        el('sta-workshop-output').textContent=job.log||'Working…';
        if(job.status==='failed')throw new Error(job.error||'OpenSTA run failed.');
        if(job.status==='completed'){completed=job.result;break;}
      }
      if(!completed)throw new Error('Analysis polling timed out; inspect backend jobs and Docker logs.');
      latestSta={result:completed,sdc:body.sdc,netlist:body.netlist,liberty:body.liberty};
      records[mode]=latestSta;
      el('sta-workshop-output').textContent=(completed.console||'')+ '\n\n=== SETUP ===\n' +
        (completed.setup_report_raw||'') + '\n=== HOLD ===\n'+(completed.hold_report_raw||'');
      el('sta-workshop-download').disabled=false;
      el('sta-workshop-state').textContent='Completed: '+mode;
      compareText();
    }catch(e){el('sta-workshop-state').textContent='Failed';el('sta-workshop-output').textContent+='\nERROR: '+e.message;}
    finally{buttons.forEach(id=>el(id).disabled=false);}
  }
  function save(name,text,type='text/plain') {
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function downloadSta() {
    if(!latestSta)return;
    const r=latestSta.result;
    save('asic-skill-sta-reports.txt',
      '=== APPLIED SDC ===\n'+latestSta.sdc+'\n=== CONSOLE ===\n'+r.console+
      '\n=== SETUP ===\n'+r.setup_report_raw+'\n=== HOLD ===\n'+r.hold_report_raw+
      '\n=== ENDPOINTS ===\n'+r.endpoint_report);
  }

  el('sta-workshop-reset').onclick=resetSta;
  el('sta-workshop-run').onclick=()=>runSta('custom');
  el('sta-workshop-baseline').onclick=()=>runSta('baseline');
  el('sta-workshop-derated').onclick=()=>runSta('derated');
  el('sta-workshop-download').onclick=downloadSta;
  el('sta-workshop-advanced').onclick=()=>{location.href='opensta-lab.html';};
  resetSta();compareText();

  function loadRisc() {
    trigger('riscv-source', RISC_EXAMPLES[el('riscv-example').value]);
    el('riscv-state').textContent='Example loaded';
    el('riscv-assembly').textContent='Run to inspect assembly.';
    el('riscv-download-asm').disabled=true;
    riscvAsm='';
  }
  async function runRiscv() {
    if(!sessionId) {el('riscv-state').textContent='Start an EDA session first.';return;}
    const button=el('riscv-run');button.disabled=true;
    el('riscv-state').textContent='Compiling and executing in Docker…';
    el('riscv-output').textContent='Running RV64 cross-toolchain and QEMU…';
    el('riscv-assembly').textContent='Waiting for successful build…';
    el('riscv-download-asm').disabled=true;
    riscvAsm='';
    try {
      const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/riscv/run`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({source:el('riscv-source').value})
      });
      el('riscv-output').textContent=result.output||'Completed.';
      riscvAsm=result.assembly||'';
      el('riscv-assembly').textContent=riscvAsm||'No disassembly captured.';
      el('riscv-download-asm').disabled=!riscvAsm;
      el('riscv-state').textContent='PASS · RV64 program completed';
    }catch(e){el('riscv-output').textContent='RUN FAILED\n'+e.message;el('riscv-state').textContent='Failed';el('riscv-assembly').textContent='No successful disassembly.';}
    finally{button.disabled=false;}
  }
  el('riscv-load').onclick=loadRisc;
  el('riscv-run').onclick=runRiscv;
  el('riscv-download-src').onclick=()=>save('main.c',el('riscv-source').value,'text/x-c');
  el('riscv-download-asm').onclick=()=>{if(riscvAsm)save('riscv-main.asm',riscvAsm,'text/plain');};
  loadRisc();
})();
