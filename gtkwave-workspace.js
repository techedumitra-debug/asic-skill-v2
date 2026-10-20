(()=>{
'use strict';
const $=id=>document.getElementById(id);
const query=new URLSearchParams(location.search),source=query.get('source')==='ghdl'?'ghdl':'cocotb';
const viewer=new ASICWaveViewer('ghdl-gtkw-');
function getLiveVCD(){
  if(!window.opener||window.opener.closed||window.opener.location.origin!==location.origin)return '';
  return source==='ghdl'?(window.opener.ASICGHDL?.getViewData()?.vcd||''):(window.opener.ASICCOCOTB?.getWaveData?.()||'');
}
function load(vcd,origin){
  try{viewer.show(vcd);$('wave-origin').textContent=origin;$('gtkw-status').textContent='Loaded '+viewer.data.signals.length+' signals';$('gtkw-export').disabled=false;}
  catch(e){viewer.clear();$('gtkw-export').disabled=true;$('gtkw-status').textContent='Could not read VCD: '+e.message;}
}
function refresh(){const vcd=getLiveVCD();if(vcd)load(vcd,'Live '+(source==='ghdl'?'GHDL':'cocotb')+' result');else $('gtkw-status').textContent='No live waveform. Run a simulation in the original lab or open a VCD.';}
$('refresh-wave').onclick=refresh;
$('open-vcd').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>1_800_000){$('gtkw-status').textContent='Maximum browser VCD size is 1.8 MB.';return;}
  try{load(await file.text(),file.name);}catch(error){$('gtkw-status').textContent=error.message;}
};
$('gtkw-export').onclick=()=>{try{ASICGTKWave.exportBundle(viewer.raw,{selected:[...viewer.selected],marker:viewer.cursorTime||0});$('gtkw-status').textContent='GTKWave ZIP is ready. Extract it and run: gtkwave wave.vcd wave.gtkw';}catch(e){$('gtkw-status').textContent=e.message;}};
$('return-lab').onclick=()=>{
  try{if(window.opener&&!window.opener.closed&&window.opener.location.origin===location.origin){window.opener.focus();window.close();return;}}catch{}
  location.assign('eda-lab.html?tool='+encodeURIComponent(source));
};
refresh();
})();
