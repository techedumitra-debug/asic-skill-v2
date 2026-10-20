/* ASIC-Skill v37.0.28. SVG logic symbols and bounded reference function tables.
 * Educational symbols/tables are NOT claimed to be synthesized cell data. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg';
function elem(tag,attrs={},value){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(value!==undefined)e.textContent=value;return e;}
function gateKind(type){const t=String(type).replace(/^\\/,'').toUpperCase();
  if(/XNOR/.test(t))return'XNOR';if(/XOR/.test(t))return'XOR';if(/NAND/.test(t))return'NAND';if(/NOR/.test(t))return'NOR';
  if(/NOT|\$_NOT_|\$NOT|INV/.test(t))return'NOT';if(/AND/.test(t))return'AND';if(/OR/.test(t))return'OR';
  if(/MUX/.test(t))return'MUX';if(/DFF|_FF_|FLIP/.test(t))return'DFF';if(/LATCH|DLATCH/.test(t))return'LATCH';return'BLOCK';
}
function cellSymbol(g,type,x,y,w=165,h=49){
  const kind=gateKind(type),stroke='#64eccb',fill='#0c2536',midX=x,midY=y;
  const p=(d)=>g.append(elem('path',{d,fill,stroke,'stroke-width':2.1,'stroke-linejoin':'round'}));
  let bubble=false;
  if(['AND','NAND'].includes(kind)){p(`M ${x-w*.35} ${y-h*.46} L ${x-w*.03} ${y-h*.46} Q ${x+w*.33} ${y-h*.46} ${x+w*.33} ${y} Q ${x+w*.33} ${y+h*.46} ${x-w*.03} ${y+h*.46} L ${x-w*.35} ${y+h*.46} Z`);bubble=kind==='NAND';}
  else if(['OR','NOR','XOR','XNOR'].includes(kind)){
    p(`M ${x-w*.35} ${y-h*.46} Q ${x+w*.06} ${y-h*.43} ${x+w*.36} ${y} Q ${x+w*.06} ${y+h*.43} ${x-w*.35} ${y+h*.46} Q ${x-w*.12} ${y} ${x-w*.35} ${y-h*.46} Z`);
    if(kind==='XOR'||kind==='XNOR')g.append(elem('path',{d:`M ${x-w*.42} ${y-h*.46} Q ${x-w*.19} ${y} ${x-w*.42} ${y+h*.46}`,fill:'none',stroke,'stroke-width':2}));
    bubble=kind==='NOR'||kind==='XNOR';
  }else if(kind==='NOT'){p(`M ${x-w*.32} ${y-h*.44} L ${x+w*.28} ${y} L ${x-w*.32} ${y+h*.44} Z`);bubble=true;}
  else{
    g.append(elem('rect',{x:x-w*.37,y:y-h*.47,width:w*.74,height:h*.94,rx:kind==='MUX'?0:5,fill,stroke,'stroke-width':2}));
    g.append(elem('text',{x:midX,y:midY+4,'text-anchor':'middle',fill:'#d5fff6','font-size':kind==='BLOCK'?10:12,'font-weight':700},kind==='BLOCK'?String(type).slice(0,15):kind));
  }
  if(bubble)g.append(elem('circle',{cx:x+w*.39,cy:y,r:5.2,stroke,fill:'#061522','stroke-width':2}));
  if(kind!=='BLOCK')g.append(elem('title',{},`${type} (${kind} symbol)`));
  return kind;
}
function line(svg,x1,y1,x2,y2,color='#5cdaae'){svg.append(elem('path',{d:`M ${x1} ${y1} L ${x2} ${y2}`,stroke:color,'stroke-width':2.3,fill:'none'}));}
function text(svg,x,y,s,color='#d8faff',anchor='start',size=15){svg.append(elem('text',{x,y,fill:color,'font-size':size,'font-family':'Consolas, monospace','text-anchor':anchor},s));}
function logicDiagram(container,exampleId,designTop){
  container.replaceChildren();const svg=elem('svg',{viewBox:'0 0 1040 500',role:'img','aria-label':'Educational circuit logic diagram'});
  svg.append(elem('rect',{x:8,y:8,width:1024,height:484,fill:'#061422',stroke:'#4b7894','stroke-width':2}));
  text(svg,520,44,`${designTop||exampleId} · FUNCTIONAL LOGIC`, '#5ceabc','middle',20);
  const half=exampleId==='half_adder',full=exampleId==='full_adder',logic=exampleId==='logic';
  const inputs=full?['A','B','Cin']:['A','B'];
  if(!logic)inputs.forEach((name,i)=>{text(svg,48,125+90*i,name);svg.append(elem('circle',{cx:93,cy:119+90*i,r:4,fill:'#d9faff'}));line(svg,93,119+90*i,220,119+90*i);});
  if(half||full){
    // Half adder: XOR + AND. Full adder: two XOR, two AND and one OR.
    const firstXor=elem('g'),firstAnd=elem('g');
    cellSymbol(firstXor,'XOR',385,155,176,76);cellSymbol(firstAnd,'AND',385,337,176,76);
    svg.append(firstXor,firstAnd);
    line(svg,220,119,295,119);line(svg,295,119,295,143);line(svg,295,143,310,143);
    line(svg,220,209,277,209);line(svg,277,209,277,170);line(svg,277,170,310,170);
    line(svg,220,119,270,119);line(svg,270,119,270,325);line(svg,270,325,310,325);
    line(svg,220,209,292,209);line(svg,292,209,292,350);line(svg,292,350,310,350);
    if(!full){
      line(svg,475,155,891,155);text(svg,907,160,'SUM');
      line(svg,475,337,891,337);text(svg,907,342,'CARRY');
    }else{
      const secondXor=elem('g'),secondAnd=elem('g'),orGate=elem('g');
      cellSymbol(secondXor,'XOR',620,140,165,74);
      cellSymbol(secondAnd,'AND',620,300,165,74);
      cellSymbol(orGate,'OR',815,338,145,65);
      svg.append(secondXor,secondAnd,orGate);
      line(svg,470,155,546,155);line(svg,546,155,546,125);
      line(svg,546,125,555,125);line(svg,470,155,530,155);line(svg,530,155,530,287);line(svg,530,287,555,287);
      line(svg,220,299,506,299);line(svg,506,299,506,170);line(svg,506,170,555,170);
      line(svg,506,299,555,318);
      line(svg,471,337,741,337);line(svg,741,337,741,322);
      line(svg,706,300,745,300);line(svg,745,300,745,348);
      line(svg,745,348,748,348);
      line(svg,710,140,915,140);text(svg,924,145,'SUM');
      line(svg,885,338,915,338);text(svg,924,343,'CARRY');
    }
  }else if(logic){
    // Classroom function diagram: one independent two-input row per logic gate.
    // No crossing signal buses. Each A/B wire ends at the gate's input side.
    const aColor='#63edb6',bColor='#8bb8ff',outColor='#72dbbf';
    const gates=[
      ['NOT','NOT A','a'],['NOT','NOT B','b'],
      ['AND','AND','ab'],['OR','OR','ab'],['XOR','XOR','ab'],
      ['NAND','NAND','ab'],['NOR','NOR','ab'],['XNOR','XNOR','ab']
    ];
    text(svg,103,68,'INPUTS','#aac9da','middle',13);
    text(svg,555,68,'LOGIC GATES','#aac9da','middle',13);
    text(svg,863,68,'OUTPUTS','#aac9da','middle',13);
    const svgline=(x1,y1,x2,y2,color)=>svg.append(elem('line',{x1,y1,x2,y2,stroke:color,'stroke-width':2.1}));
    gates.forEach(([type,label,source],i)=>{
      const y=99+i*43;
      const gate=elem('g');cellSymbol(gate,type,560,y,145,34);svg.append(gate);
      if(source==='ab'){
        text(svg,110,y-8,'A',aColor);text(svg,110,y+15,'B',bColor);
        svgline(141,y-12,494,y-12,aColor);
        svgline(141,y+12,494,y+12,bColor);
      }else{
        const color=source==='a'?aColor:bColor;
        text(svg,110,y+5,source.toUpperCase(),color);
        svgline(141,y,508,y,color);
      }
      svgline(633,y,828,y,outColor);
      text(svg,842,y+5,label,'#b9ecff','start',14);
    });
    text(svg,520,459,'Independent gate inputs · no crossing or ambiguous bus connections', '#b9d5e4','middle',12);
  }else{
    const ports={binary_gray:['binary_in / gray_in','gray_out / binary_out'],decoder4x16:['SEL[3:0], EN','Y[15:0]'],bcd7seg:['BCD[3:0]','SEG[a..g]'],traffic_light:['CLK, RESET','RED, YELLOW, GREEN'],uart_tx:['CLK, START, DATA[7:0]','TX, BUSY'],moore101:['CLK, RESET, DIN','DETECTED'],mealy101:['CLK, RESET, DIN','DETECTED']};
    const [p1,p2]=ports[exampleId]||['INPUT PORTS','OUTPUT PORTS'];
    const shape=elem('g');cellSymbol(shape,'BLOCK',550,258,305,160);svg.append(shape);
    text(svg,550,255,designTop,'#fff5ce','middle',21);
    line(svg,110,255,435,255);line(svg,665,255,935,255);
    text(svg,110,230,p1,'#b9edfa');text(svg,900,230,p2,'#b9edfa','end');
  }
  text(svg,520,470,'EDUCATIONAL REFERENCE · verify against simulation waveforms and truth tables','#8cafbf','middle',12);
  container.append(svg);
}
function rowsFor(id){
 const rows=[],add=(input,output)=>rows.push([...(Array.isArray(input)?input:[input]),...(Array.isArray(output)?output:[output])]);
 if(id==='half_adder'){for(let i=0;i<4;i++){const a=i>>1,b=i&1;add([a,b],[a&b,a^b]);}return {head:['A','B','Carry','Sum'],rows};}
 if(id==='full_adder'){for(let i=0;i<8;i++){const a=(i>>2)&1,b=(i>>1)&1,c=i&1;add([a,b,c],[Number(a+b+c>=2),a^b^c]);}return {head:['A','B','Cin','Cout','Sum'],rows};}
 if(id==='logic'){for(let i=0;i<4;i++){const a=i>>1,b=i&1;add([a,b],[1-a,1-b,a&b,1-(a&b),a|b,1-(a|b),a^b,1-(a^b)]);}return {head:['A','B','NOT A','NOT B','AND','NAND','OR','NOR','XOR','XNOR'],rows};}
 if(id==='binary_gray'){for(let i=0;i<16;i++){const gray=i^(i>>1);add(i.toString(2).padStart(4,'0'),gray.toString(2).padStart(4,'0'));}return {head:['Binary','Gray'],rows};}
 if(id==='decoder4x16'){for(let i=0;i<16;i++)add([i.toString(2).padStart(4,'0'),1],(1<<i).toString(16).padStart(4,'0').toUpperCase());return {head:['Select','Enable','Output (hex)'],rows};}
 if(id==='bcd7seg'){const pattern=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];for(let i=0;i<10;i++)add(i,pattern[i]);return {head:['BCD','abcdefg (active high)'],rows};}
 if(id==='moore101')return {head:['State','Input 0 → next','Input 1 → next','Output'],rows:[['IDLE','IDLE','S1',0],['S1','S10','S1',0],['S10','IDLE','S101',0],['S101','S10','S1',1]],state:true};
 if(id==='mealy101')return {head:['State','Input 0 → (next,out)','Input 1 → (next,out)'],rows:[['IDLE','IDLE,0','S1,0'],['S1','S10,0','S1,0'],['S10','IDLE,0','S1,1']],state:true};
 if(id==='traffic_light')return {head:['Present state','Next state','Red','Yellow','Green'],rows:[['RED','GREEN',1,0,0],['GREEN','YELLOW',0,0,1],['YELLOW','RED',0,1,0]],state:true};
 if(id==='uart_tx')return {head:['Step','TX','Meaning'],rows:[['Idle',1,'Mark'],['Start',0,'One bit'],['Data0..7','Data[i]','LSB first'],['Stop',1,'One bit']],state:true};
 return null;
}
function renderTable(container,id,label){container.replaceChildren();const data=rowsFor(id);
 if(!data){const p=document.createElement('p');p.textContent=`${label}: a complete combinational truth table would be very large, or this design depends on clocked state. Use the actual waveform and assertions to inspect its behavior.`;container.append(p);return {count:0,state:true};}
 const table=document.createElement('table');const thead=document.createElement('thead'),tr=document.createElement('tr');for(const col of data.head){const th=document.createElement('th');th.textContent=col;tr.append(th);}thead.append(tr);table.append(thead);
 const body=document.createElement('tbody');for(const row of data.rows){const r=document.createElement('tr');for(const val of row){const td=document.createElement('td');td.textContent=String(val);r.append(td);}body.append(r);}table.append(body);container.append(table);return {count:data.rows.length,state:!!data.state};
}
root.ASICGHDLSymbols={cellSymbol,gateKind,logicDiagram,renderTable};
})(window);
