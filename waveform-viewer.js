/* ASIC-Skill v37.0.11 — minimal VCD waveform viewer (no third-party CDN).
 * Parses bounded server-provided VCD data in the student's browser. */
(function(root){
'use strict';
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const $=id=>document.getElementById(id);
function parseVCD(vcd){
  if(typeof vcd!=='string'||vcd.length>1800000)throw Error('Unsupported waveform size.');
  let t=0, inDefs=true, timescale='1ns', scope=[], total=0;
  const signals=[], ids=new Map(), lines=vcd.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const s=lines[i].trim();
    if(!s)continue;
    if(inDefs){
      if(s.startsWith('$timescale')){
        let combined=s;
        while(!combined.includes('$end') && i+1<lines.length)combined+=' '+lines[++i].trim();
        timescale=(combined.replace(/\$timescale|\$end/g,'').trim().replace(/\s+/g,''))||'1ns';
      }else if(s.startsWith('$scope')){const m=s.match(/^\$scope\s+\S+\s+(\S+)/);if(m)scope.push(m[1]);}
      else if(s.startsWith('$upscope'))scope.pop();
      else if(s.startsWith('$var')){
        const m=s.match(/^\$var\s+\S+\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end/);
        if(m && signals.length<120){
          const sig={id:m[2],width:+m[1],name:[...scope,m[3].trim().replace(/\s+/g,'')].join('.'),events:[]};
          signals.push(sig); if(!ids.has(m[2]))ids.set(m[2],[]);ids.get(m[2]).push(sig);
        }
      }else if(s.startsWith('$enddefinitions'))inDefs=false;
      continue;
    }
    if(s[0]==='#'){const v=Number(s.slice(1));if(Number.isFinite(v))t=v;continue;}
    if(s[0]==='$')continue;
    let id='',value='';
    if(/^[01xXzZ]/.test(s)){value=s[0].toLowerCase();id=s.slice(1).trim();}
    else if(/^[brBR]/.test(s)){const k=s.split(/\s+/);value=k[0].slice(1).toLowerCase();id=k[1]||'';}
    else continue;
    for(const sig of ids.get(id)||[]){
      if(total>160000)break;
      const prev=sig.events[sig.events.length-1];
      if(!prev||prev[1]!==value){sig.events.push([t,value]);total++;}
    }
  }
  if(inDefs||!signals.length)throw Error('This VCD has no readable signal declarations.');
  const latest=Math.max(1,t,...signals.flatMap(sig=>sig.events.length?[sig.events[sig.events.length-1][0]]:[]));
  return {signals,timescale,end:latest};
}
// Only the cocotb VCD viewer enables bus expansion. Bits are derived from actual
// VCD bus transitions, with the rightmost encoded bit representing the LSB.
function busIndices(sig){
  if(sig.width<=1)return [];
  const range=sig.name.match(/\[(-?\d+):(-?\d+)\]$/);
  if(range){const msb=Number(range[1]),lsb=Number(range[2]);
    if(Math.abs(msb-lsb)+1===sig.width)return Array.from({length:sig.width},(_,k)=>lsb+k*(msb>=lsb?1:-1));
  }
  return Array.from({length:sig.width},(_,k)=>k);
}
function bitFromValue(value,width,offset){
  // VCD vectors can omit their leading bits. Extend with the leading unknown
  // or with zero for ordinary binary numbers, then select in LSB-first order.
  const data=String(value||'?').toLowerCase();
  const fill=/^[xz]/.test(data)?data[0]:'0';
  return data.padStart(width,fill).slice(-width).charAt(width-1-offset)||'x';
}
function expandBusSignal(sig,bit,offset){
  const events=[];
  for(const [t,value] of sig.events){const v=bitFromValue(value,sig.width,offset);
    if(!events.length||events[events.length-1][1]!==v)events.push([t,v]);
  }
  return {name:sig.name.replace(/\[[-\d]+:[-\d]+\]$/, '')+'['+bit+']',width:1,events,
    parentName:sig.name,bitIndex:bit};
}
function binLabel(bits,width){
  if(/[^01]/.test(bits))return bits;
  if(width===1)return bits;
  try{return '0x'+BigInt('0b'+bits).toString(16).toUpperCase();}catch{return bits;}
}
class ASICWaveViewer{
  constructor(prefix='wave-'){this.prefix=prefix;this.data=null;this.raw='';this.zoom=1;this.query='';this.selected=new Set();this.canvas=this.el('canvas');this.host=this.el('scroll');this.signalList=this.el('signal-list');
    this.cursorTime=null;this.dragging=false;this.objectValues=[];this.expandedBuses=new Set();this.bitSelections=new Set();this.bitCache=new Map();
    const pointTime=e=>{
      const rect=this.canvas.getBoundingClientRect();
      const canvasX=(e.clientX-rect.left)*(this.canvas.width/Math.max(rect.width,1));
      return clamp((canvasX-this.left)/this.pxPerTick,0,this.data.end);
    };
    this.canvas?.addEventListener('pointerdown',e=>{
      if(!this.data)return;
      this.dragging=true;this.canvas.setPointerCapture?.(e.pointerId);
      this.cursorTime=pointTime(e);this.draw();
    });
    this.canvas?.addEventListener('pointermove',e=>{
      if(!this.data)return;
      if(this.dragging){this.cursorTime=pointTime(e);this.draw();}
      else if(this.cursorTime===null){this.el('cursor').textContent=`Hover time ${pointTime(e).toFixed(2)} ${this.data.timescale}`;}
    });
    this.canvas?.addEventListener('pointerup',()=>{this.dragging=false;});
    this.canvas?.addEventListener('pointercancel',()=>{this.dragging=false;});
    this.canvas?.addEventListener('keydown',e=>{
      if(!this.data||!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();this.cursorTime=clamp((this.cursorTime??0)+(e.key==='ArrowRight'?1:-1)*this.data.end/100,0,this.data.end);this.draw();
    });
    this.el('zoom-in')?.addEventListener('click',()=>this.setZoom(this.zoom*1.65));
    this.el('zoom-out')?.addEventListener('click',()=>this.setZoom(this.zoom/1.65));
    this.el('fit')?.addEventListener('click',()=>this.setZoom(1));
    this.el('search')?.addEventListener('input',e=>{this.query=e.target.value.toLowerCase();this.renderList();});
    this.el('download')?.addEventListener('click',()=>this.download());
    // Keep the pinned signal rows and waveform vertically synchronized when
    // expanding enough vector bits to require vertical scrolling.
    this.host?.addEventListener('scroll',()=>{
      if(this.isCocotb() && this.signalList && this.signalList.scrollTop!==this.host.scrollTop)
        this.signalList.scrollTop=this.host.scrollTop;
    });
    this.signalList?.addEventListener('scroll',()=>{
      if(this.isCocotb() && this.host && this.host.scrollTop!==this.signalList.scrollTop)
        this.host.scrollTop=this.signalList.scrollTop;
    });
  }
  el(id){return $(this.prefix+id)}
  clear(message='Run a test to generate an interactive waveform.'){
    this.raw='';this.data=null;this.cursorTime=null;this.objectValues=[];this.selected.clear();this.expandedBuses.clear();this.bitSelections.clear();this.bitCache.clear();this.signalList.textContent='';const ctx=this.canvas.getContext('2d');ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.el('empty').hidden=false;this.el('empty').textContent=message;this.el('download').disabled=true;this.el('status').textContent='No waveform loaded';
  }
  show(vcd){
    this.data=parseVCD(vcd);this.raw=vcd;this.expandedBuses.clear();this.bitSelections.clear();this.bitCache.clear();this.selected=new Set(this.data.signals.slice(0,16).map(x=>x.name));this.zoom=1;this.cursorTime=0;this.query='';this.el('search').value='';
    this.el('empty').hidden=true;this.el('download').disabled=false;
    this.el('status').textContent=`${this.data.signals.length} signals · ${this.data.timescale} timescale · ${this.data.end} ticks`;
    this.renderList();this.draw();
  }
  isCocotb(){return this.prefix==='wave-';}
  busChildren(sig){
    if(!this.isCocotb()||sig.width<=1||sig.width>64)return [];
    if(!this.bitCache.has(sig.name)){
      this.bitCache.set(sig.name,busIndices(sig).map((bit,offset)=>expandBusSignal(sig,bit,offset)));
    }
    return this.bitCache.get(sig.name);
  }
  activeSignals(){
    if(!this.data)return [];
    const traces=[];
    for(const sig of this.data.signals){
      if(this.selected.has(sig.name))traces.push(sig);
      if(this.expandedBuses.has(sig.name)){
        for(const bit of this.busChildren(sig)){
          if(this.bitSelections.has(bit.name))traces.push(bit);
        }
      }
    }
    return traces.slice(0,100);
  }
  renderOtherSignalList(){
    if(!this.data)return;
    this.signalList.replaceChildren();
    for(const sig of this.data.signals){
      if(!sig.name.toLowerCase().includes(this.query))continue;
      const label=document.createElement('label');label.className='wave-signal';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=this.selected.has(sig.name);
      cb.onchange=()=>{if(cb.checked)this.selected.add(sig.name);else this.selected.delete(sig.name);this.draw();};
      const text=document.createElement('span');text.textContent=sig.name; text.title=sig.name;
      label.append(cb,text);
      if(this.prefix.startsWith('ghdl')){
        const value=document.createElement('strong');value.className='ghdl-signal-value';value.dataset.signal=sig.name;
        value.textContent=this.valueAt(sig,this.cursorTime??0);label.append(value);
        label.addEventListener('click',e=>{if(e.target===cb)return;
          if(e.target===text||e.target===value){this.cursorTime=this.cursorTime??0;this.draw();}});
      }
      this.signalList.append(label);
    }
  }
  renderList(){
    if(!this.isCocotb())return this.renderOtherSignalList();
    if(!this.data)return;
    this.signalList.replaceChildren();
    // Signal row order is identical to the waveform's expanded trace order.
    // The name pane never scrolls horizontally when its divider is dragged.
    const appendSignal=(sig,child=false)=>{
      const row=document.createElement('div');row.className='wave-signal-row'+(child?' wave-bit-row':'');
      if(!child && this.isCocotb() && sig.width>1 && sig.width<=64){
        const toggle=document.createElement('button');toggle.type='button';toggle.className='wave-bus-toggle';
        const expanded=this.expandedBuses.has(sig.name);
        toggle.textContent=expanded?'▾':'▸';toggle.title=(expanded?'Collapse ':'Expand ')+sig.name;
        toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded',String(expanded));
        toggle.addEventListener('click',()=>{
          if(expanded)this.expandedBuses.delete(sig.name);
          else{this.expandedBuses.add(sig.name);for(const bit of this.busChildren(sig))this.bitSelections.add(bit.name);}
          this.renderList();this.draw();
        });row.append(toggle);
      }else if(this.isCocotb()){
        const spacer=document.createElement('span');spacer.className='wave-bus-spacer';row.append(spacer);
      }
      const label=document.createElement('label');label.className='wave-signal';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=child?this.bitSelections.has(sig.name):this.selected.has(sig.name);
      cb.onchange=()=>{const set=child?this.bitSelections:this.selected;
        if(cb.checked)set.add(sig.name);else set.delete(sig.name);this.draw();};
      const text=document.createElement('span');text.textContent=sig.name; text.title=sig.name;
      label.append(cb,text);
      if(this.prefix.startsWith('ghdl')){
        const value=document.createElement('strong');value.className='ghdl-signal-value';value.dataset.signal=sig.name;
        value.textContent=this.valueAt(sig,this.cursorTime??0);label.append(value);
        label.addEventListener('click',e=>{if(e.target===cb)return;
          if(e.target===text||e.target===value){this.cursorTime=this.cursorTime??0;this.draw();}});
      }
      row.append(label);this.signalList.append(row);
    };
    for(const sig of this.data.signals){
      if(!sig.name.toLowerCase().includes(this.query))continue;
      appendSignal(sig);
      if(this.expandedBuses.has(sig.name))for(const bit of this.busChildren(sig))appendSignal(bit,true);
    }
  }
  setZoom(z){this.zoom=clamp(z,0.75,20);this.draw();}
  valueAt(signal,time){
    let value='?';for(const [t,v] of signal.events){if(t>time)break;value=v;}
    return binLabel(value,signal.width);
  }
  draw(){
    if(!this.data)return;
    const active=this.isCocotb()?this.activeSignals():this.data.signals.filter(sig=>this.selected.has(sig.name)).slice(0,50);
    const rowH=38, top=38, height=Math.max(100,top+active.length*rowH+12);
    const available=Math.max(680,this.host.clientWidth-20);
    this.left=16;this.pxPerTick=(available-this.left-20)/this.data.end*this.zoom;
    const width=Math.min(16000,Math.max(available, this.left+this.data.end*this.pxPerTick+20));
    this.pxPerTick=(width-this.left-20)/this.data.end;
    this.canvas.width=Math.ceil(width);this.canvas.height=height;
    this.canvas.style.width=`${width}px`;this.canvas.style.height=`${height}px`;
    const g=this.canvas.getContext('2d');g.clearRect(0,0,width,height);g.fillStyle='#061420';g.fillRect(0,0,width,height);
    const ticks=10;
    g.font='11px Consolas,monospace';g.strokeStyle='#254157';g.fillStyle='#aac4d8';g.lineWidth=1;
    for(let k=0;k<=ticks;k++){const x=this.left+(width-this.left-20)*k/ticks;g.beginPath();g.moveTo(x,top-7);g.lineTo(x,height);g.stroke();g.fillText(`${(this.data.end*k/ticks).toFixed(1)}`,x+3,17);}
    for(let i=0;i<active.length;i++){
      const sig=active[i],y=top+i*rowH,events=sig.events;
      g.fillStyle=i%2?'#0d2234':'#0a1c2b';g.fillRect(0,y,width,rowH);g.fillStyle='#6b8aa0';g.fillText(String(i+1),3,y+23);
      g.strokeStyle='#2b455a';g.beginPath();g.moveTo(0,y+rowH);g.lineTo(width,y+rowH);g.stroke();
      if(!events.length)continue;
      const binary=sig.width===1;g.strokeStyle=binary?'#4fe0b1':'#71bafa';g.lineWidth=1.7;g.beginPath();
      if(binary){
        const yp=val=>val==='1'?y+8:val==='0'?y+29:y+19;
        let prev=events[0][1],cursorX=this.left;
        g.moveTo(this.left,yp(prev));
        for(const [time,value] of events){const x=this.left+time*this.pxPerTick;g.lineTo(x,yp(prev));g.lineTo(x,yp(value));prev=value;cursorX=x;}
        g.lineTo(width-20,yp(prev));g.stroke();
      }else{
        for(let k=0;k<events.length;k++){
          const [time,value]=events[k],x=this.left+time*this.pxPerTick;
          const next=k+1<events.length?this.left+events[k+1][0]*this.pxPerTick:width-20;
          const end=Math.max(x,next);
          g.strokeStyle='#76b8fb';g.strokeRect(x,y+8,Math.max(0,end-x),21);
          if(end-x>28){g.fillStyle='#d5eaff';g.fillText(binLabel(value,sig.width),x+5,y+23,end-x-8);}
        }
      }
    }
    if(!active.length){g.fillStyle='#9bb7d3';g.fillText('Select one or more signals on the left.',28,70);}
    if(this.cursorTime!==null){
      const x=this.left+this.cursorTime*this.pxPerTick;
      g.save();g.strokeStyle='#ffba66';g.lineWidth=2;g.setLineDash([6,3]);g.beginPath();g.moveTo(x,top-10);g.lineTo(x,height);g.stroke();g.setLineDash([]);
      g.fillStyle='#ffba66';g.beginPath();g.moveTo(x-6,top-10);g.lineTo(x+6,top-10);g.lineTo(x,top);g.closePath();g.fill();g.restore();
      const values=active.slice(0,4).map(sig=>sig.name.split('.').pop()+'='+this.valueAt(sig,this.cursorTime));
      this.el('cursor').textContent=`Time: ${this.cursorTime.toFixed(this.cursorTime<100?2:0)} ${this.data.timescale} | ${values.join('  ')}`;
    }else this.el('cursor').textContent='Click/drag waveform to set the time cursor';
    if(this.prefix.startsWith('ghdl')){
      for(const el of this.signalList.querySelectorAll('.ghdl-signal-value')){
        const sig=this.data.signals.find(item=>item.name===el.dataset.signal);
        if(sig)el.textContent=this.valueAt(sig,this.cursorTime??0);
      }
    }
    this.el('zoom-value').textContent=`${this.zoom.toFixed(1)}×`;
  }
  download(){if(!this.raw)return;const blob=new Blob([this.raw],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='asic_skill_waveform.vcd';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
root.ASICWaveViewer=ASICWaveViewer;
root.ASICParseVCD=parseVCD;
})(window);
