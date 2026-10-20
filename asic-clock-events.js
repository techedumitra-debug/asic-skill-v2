/* Simulation-derived CLK/RESET/ENABLE event table shared by GHDL waveform data. */
(function(root){'use strict';
function append(host,viewer){
 if(!host||!viewer?.data?.signals)return false;
 const signals=viewer.data.signals;const base=s=>s.name.toLowerCase().split('.').pop().replace(/\[[^\]]*\]$/,'');
 const pick=names=>signals.filter(s=>names.test(base(s))).sort((a,b)=>a.name.length-b.name.length)[0];
 const clk=pick(/^(clk|clock|vclk)$/),reset=pick(/^(rst|rst_n|reset|reset_n|nreset)$/),enable=pick(/^(en|enable|wr_en|write_en)$/);
 const controls=[clk,reset,enable].filter(Boolean);if(!controls.length)return false;
 const outNames=/^(q|qn|qbar|count|state|current_state|y|valid|done|grant|detect|data_out|out)$/;
 const output=signals.filter(s=>outNames.test(base(s))&&!controls.includes(s)).sort((a,b)=>a.name.length-b.name.length).slice(0,4);
 const events=new Map();for(const s of controls){let last=null;for(const [t,val] of s.events||[]){if(last===null){last=val;continue;}let tag='';
   if(s===clk&&last==='0'&&val==='1')tag='CLK ↑';
   else if(s===reset&&val!==last){const activeLow=/_n$|^nreset$/.test(base(s));tag=val===(activeLow?'0':'1')?'RESET asserted':'RESET released';}
   else if(s===enable&&val!==last)tag='ENABLE → '+val;
   if(tag)events.set(t,[...(events.get(t)||[]),tag]);last=val;
 }}
 if(!events.size)return false;
 const section=document.createElement('section');section.className='asic-observed-clock-events';
 const h=document.createElement('h3');h.textContent='Observed clock/reset/enable events · VCD';section.append(h);
 const note=document.createElement('p');note.textContent='Values at each recorded time, after changes at the same timestamp. These are measured testbench events, not an exhaustive characteristic table.';section.append(note);
 const tbl=document.createElement('table'),head=document.createElement('tr');for(const v of ['Time ('+viewer.data.timescale+')','Event',...controls.map(s=>base(s)),...output.map(s=>base(s))]){const th=document.createElement('th');th.textContent=v;head.append(th);}tbl.append(head);
 for(const [t,names] of [...events.entries()].sort((a,b)=>a[0]-b[0]).slice(0,120)){const tr=document.createElement('tr');const cells=[t,names.join(' / '),...controls.map(s=>viewer.valueAt(s,t)),...output.map(s=>viewer.valueAt(s,t))];for(const c of cells){const td=document.createElement('td');td.textContent=c;tr.append(td);}tbl.append(tr);}
 section.append(tbl);host.append(section);return true;
}
root.ASICClockEvents={append};
})(window);
