/* ASIC-Skill v37.0.21: Perl and pyuvm exercises in isolated lab sessions. */
(() => {
 const el=id=>document.getElementById(id);
 const perlExamples={
   timing:el('perl-code').value,
   regex:`use strict;
use warnings;
my @lines = ('setup slack -0.025', 'hold slack 0.013', 'setup slack 0.006');
for my $line (@lines) {
    if ($line =~ /^(setup|hold)\\s+slack\\s+(-?[0-9.]+)/) {
        printf "%s: %s ns\\n", uc($1), $2;
    }
}`
 };
 const pyuvmViewer=new ASICWaveViewer('pyuvm-wave-');
 const defaults={rtl:el('pyuvm-rtl').value,test:el('pyuvm-test').value};
 async function runPerl(){
   if(!sessionId){alert('Start an EDA session first.');return;}
   const button=el('perl-run'); button.disabled=true;el('perl-state').textContent='Running…';
   el('perl-output').textContent='Running Perl in an isolated container…';
   try{
     const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/perl/run`,{
       method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:el('perl-code').value})
     });
     el('perl-output').textContent=result.output||'Script completed without output.';
     el('perl-state').textContent='Finished';
   }catch(err){el('perl-output').textContent='RUN FAILED\n'+err.message;el('perl-state').textContent='Failed';}
   finally{button.disabled=false;}
 }
 async function runPyuvm(){
   if(!sessionId){alert('Start an EDA session first.');return;}
   const top=el('pyuvm-top').value.trim();
   if(!/^[A-Za-z_][A-Za-z0-9_$]{0,79}$/.test(top)){el('pyuvm-state').textContent='Invalid top module';return;}
   const button=el('pyuvm-run');button.disabled=true;
   el('pyuvm-state').textContent='Running…';pyuvmViewer.clear('Running simulation…');
   el('pyuvm-output').textContent='Running pyuvm on cocotb + Icarus…';
   try{
     const result=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/cocotb/run`,{
       method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({rtl:el('pyuvm-rtl').value,test:el('pyuvm-test').value,top,capture:el('pyuvm-capture').checked})
     });
     el('pyuvm-output').textContent=result.output||'Completed.';el('pyuvm-state').textContent='PASS';
   }catch(err){el('pyuvm-output').textContent='SIMULATION FAILED\n'+err.message;el('pyuvm-state').textContent='FAIL';}
   finally{
     if(el('pyuvm-capture').checked){
       try{const b=await api(`/api/eda/sessions/${encodeURIComponent(sessionId)}/cocotb/waveform`);
         if(b.vcd){pyuvmViewer.show(b.vcd);}
       }catch(err){el('pyuvm-output').textContent+='\nNo VCD captured: '+err.message;}
     }
     button.disabled=false;
   }
 }
 el('perl-run').addEventListener('click',runPerl);
 el('perl-example-load').addEventListener('click',()=>{
   el('perl-code').value=perlExamples[el('perl-example').value];
   el('perl-code').dispatchEvent(new Event('input',{bubbles:true}));
 });
 el('pyuvm-run').addEventListener('click',runPyuvm);
 el('pyuvm-reset').addEventListener('click',()=>{
   el('pyuvm-rtl').value=defaults.rtl;el('pyuvm-test').value=defaults.test;
   el('pyuvm-top').value='counter';el('pyuvm-capture').checked=true;
   for(const id of ['pyuvm-rtl','pyuvm-test'])el(id).dispatchEvent(new Event('input',{bubbles:true}));
 });
})();
