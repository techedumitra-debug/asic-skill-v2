/* ASIC-Skill cocotb examples: Verilog + self-checking Python tests. */
(function(root){
'use strict';
const examples=[
 {
  "id": "counter",
  "day": 0,
  "name": "Starter: 4-bit Counter",
  "top": "counter",
  "rtl": "module counter(input wire clk, input wire rst_n, input wire en, output reg [3:0] q);\n always @(posedge clk or negedge rst_n) begin\n  if (!rst_n) q <= 4'b0000;\n  else if (en) q <= q + 1'b1;\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.en.value=1;await settle();dut.rst_n.value=1\n for n in range(1,6):\n  await tick(dut);assert int(dut.q.value)==n\n",
  "category": "Starter",
  "description": "Editable counter and cocotb self-check"
 },
 {
  "id": "adder",
  "day": 0,
  "name": "Starter: 8-bit Adder",
  "top": "adder",
  "rtl": "module adder(input [7:0] a,b,output [8:0] sum); assign sum={1'b0,a}+{1'b0,b}; endmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for a,b in [(0,0),(3,5),(255,1),(127,128)]:\n  dut.a.value=a;dut.b.value=b;await settle();assert int(dut.sum.value)==a+b\n",
  "category": "Starter",
  "description": "8-bit adder test"
 },
 {
  "id": "day01",
  "day": 1,
  "name": "Half Adder & Full Adder",
  "top": "full_adder",
  "rtl": "module half_adder(input a,b,output sum,carry);\n  assign sum=a^b;\n  assign carry=a&b;\nendmodule\nmodule full_adder(input a,b,cin,output sum,cout);\n  wire s1,c1,c2;\n  half_adder h0(a,b,s1,c1);\n  half_adder h1(s1,cin,sum,c2);\n  assign cout=c1|c2;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n    for a in (0,1):\n      for b in (0,1):\n       for c in (0,1):\n        dut.a.value=a;dut.b.value=b;dut.cin.value=c\n        await settle()\n        assert int(dut.sum.value)==((a+b+c)&1)\n        assert int(dut.cout.value)==((a+b+c)>>1)\n",
  "category": "Combinational",
  "description": "Half Adder & Full Adder"
 },
 {
  "id": "day02",
  "day": 2,
  "name": "Ripple Carry Adder",
  "top": "ripple_adder",
  "rtl": "module ripple_adder(input [3:0] a,b,input cin,output [3:0] sum,output cout);\n wire [4:0] c;\n assign c[0]=cin;\n genvar i;\n generate for(i=0;i<4;i=i+1) begin:stage\n   assign sum[i]=a[i]^b[i]^c[i];\n   assign c[i+1]=(a[i]&b[i])|(a[i]&c[i])|(b[i]&c[i]);\n end endgenerate\n assign cout=c[4];\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n  for a,b,c in [(0,0,0),(15,1,0),(7,8,1),(9,6,0),(15,15,1)]:\n    dut.a.value=a;dut.b.value=b;dut.cin.value=c;await settle()\n    assert int(dut.sum.value)==((a+b+c)&15)\n    assert int(dut.cout.value)==((a+b+c)>>4)\n",
  "category": "Combinational",
  "description": "Ripple Carry Adder"
 },
 {
  "id": "day03",
  "day": 3,
  "name": "Binary / Gray Code Conversion",
  "top": "gray_converter",
  "rtl": "module gray_converter(input [3:0] x,input mode,output [3:0] y);\n  wire [3:0] bin;\n  assign bin[3]=x[3];\n  assign bin[2]=bin[3]^x[2];\n  assign bin[1]=bin[2]^x[1];\n  assign bin[0]=bin[1]^x[0];\n  assign y=mode?bin:(x^(x>>1)); // 0: binary->Gray, 1: Gray->binary\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n  for x in range(16):\n    g=x^(x>>1)\n    dut.mode.value=0;dut.x.value=x;await settle();assert int(dut.y.value)==g\n    dut.mode.value=1;dut.x.value=g;await settle();assert int(dut.y.value)==x\n",
  "category": "Combinational",
  "description": "Binary / Gray Code Conversion"
 },
 {
  "id": "day04",
  "day": 4,
  "name": "Multiplexers",
  "top": "mux4",
  "rtl": "module mux4(input [3:0] d,input [1:0] sel,output y);\n assign y=d[sel];\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n  for d in (0,5,10,15):\n    for s in range(4):\n      dut.d.value=d;dut.sel.value=s;await settle()\n      assert int(dut.y.value)==((d>>s)&1)\n",
  "category": "Combinational",
  "description": "Multiplexers"
 },
 {
  "id": "day05",
  "day": 5,
  "name": "Demultiplexers",
  "top": "demux4",
  "rtl": "module demux4(input din,input [1:0] sel,output [3:0] y);\n assign y=din?(4'b0001<<sel):4'b0;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for x in (0,1):\n  for s in range(4):\n    dut.din.value=x;dut.sel.value=s;await settle()\n    assert int(dut.y.value)==(x<<s)\n",
  "category": "Combinational",
  "description": "Demultiplexers"
 },
 {
  "id": "day06",
  "day": 6,
  "name": "Encoders",
  "top": "priority_encoder",
  "rtl": "module priority_encoder(input [7:0] req,output reg [2:0] code,output reg valid);\n integer i;\n always @* begin\n  code=0;valid=0;\n  for(i=0;i<8;i=i+1)if(req[i])begin code=i;valid=1;end\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for mask in (0,1,4,8,16,255,129,3):\n  dut.req.value=mask;await settle()\n  assert int(dut.valid.value)==int(mask!=0)\n  assert int(dut.code.value)==(mask.bit_length()-1 if mask else 0)\n",
  "category": "Combinational",
  "description": "Encoders"
 },
 {
  "id": "day07",
  "day": 7,
  "name": "Decoders",
  "top": "decoder3x8",
  "rtl": "module decoder3x8(input [2:0] sel,input en,output [7:0] y);\n assign y=en?(8'b1<<sel):8'b0;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for en in (0,1):\n  for s in range(8):\n   dut.en.value=en;dut.sel.value=s;await settle()\n   assert int(dut.y.value)==((1<<s) if en else 0)\n",
  "category": "Combinational",
  "description": "Decoders"
 },
 {
  "id": "day08",
  "day": 8,
  "name": "D Latch",
  "top": "d_latch",
  "rtl": "module d_latch(input d,en,output reg q);\n always @* if(en)q=d;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.en.value=1;dut.d.value=0;await settle();assert int(dut.q.value)==0\n dut.d.value=1;await settle();assert int(dut.q.value)==1\n dut.en.value=0;dut.d.value=0;await settle();assert int(dut.q.value)==1\n",
  "category": "Sequential",
  "description": "D Latch"
 },
 {
  "id": "day09",
  "day": 9,
  "name": "D Flip-Flop",
  "top": "d_flipflop",
  "rtl": "module d_flipflop(input clk,rst_n,d,output reg q);\n always @(posedge clk or negedge rst_n)if(!rst_n)q<=0;else q<=d;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.d.value=0;await settle()\n dut.rst_n.value=1\n for v in (1,0,1):\n  dut.d.value=v;await tick(dut);assert int(dut.q.value)==v\n",
  "category": "Sequential",
  "description": "D Flip-Flop"
 },
 {
  "id": "day10",
  "day": 10,
  "name": "Magnitude Comparators",
  "top": "comparator4",
  "rtl": "module comparator4(input [3:0] a,b,output gt,eq,lt);\n assign gt=a>b,eq=a==b,lt=a<b;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for a,b in [(0,0),(1,2),(15,3),(7,7),(0,15)]:\n  dut.a.value=a;dut.b.value=b;await settle()\n  assert int(dut.gt.value)==int(a>b)\n  assert int(dut.eq.value)==int(a==b)\n  assert int(dut.lt.value)==int(a<b)\n",
  "category": "Combinational",
  "description": "Magnitude Comparators"
 },
 {
  "id": "day11",
  "day": 11,
  "name": "Shift Register — Serial",
  "top": "shift_serial",
  "rtl": "module shift_serial(input clk,rst_n,shift_en,din,output reg [3:0] q);\n always @(posedge clk or negedge rst_n)if(!rst_n)q<=0;else if(shift_en)q<={q[2:0],din};\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.shift_en.value=1;dut.din.value=0;await settle();dut.rst_n.value=1\n q=0\n for bit in (1,0,1,1,0):\n  dut.din.value=bit;await tick(dut);q=((q<<1)|bit)&15;assert int(dut.q.value)==q\n",
  "category": "Sequential",
  "description": "Shift Register — Serial"
 },
 {
  "id": "day12",
  "day": 12,
  "name": "Shift Register — Parallel Load",
  "top": "shift_parallel",
  "rtl": "module shift_parallel(input clk,rst_n,load,input [3:0] d,output reg [3:0] q);\n always @(posedge clk or negedge rst_n)if(!rst_n)q<=0;else if(load)q<=d;else q<={q[2:0],1'b0};\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.load.value=0;dut.d.value=0;await settle();dut.rst_n.value=1\n dut.load.value=1;dut.d.value=5;await tick(dut);assert int(dut.q.value)==5\n dut.load.value=0;await tick(dut);assert int(dut.q.value)==10\n",
  "category": "Sequential",
  "description": "Shift Register — Parallel Load"
 },
 {
  "id": "day13",
  "day": 13,
  "name": "Up / Down Counter",
  "top": "updown_counter",
  "rtl": "module updown_counter(input clk,rst_n,en,up,output reg [3:0] q);\n always @(posedge clk or negedge rst_n)if(!rst_n)q<=0;else if(en)q<=up?q+1'b1:q-1'b1;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.en.value=1;dut.up.value=1;await settle();dut.rst_n.value=1\n for expect in (1,2,3):\n  await tick(dut);assert int(dut.q.value)==expect\n dut.up.value=0;await tick(dut);assert int(dut.q.value)==2\n",
  "category": "Sequential",
  "description": "Up / Down Counter"
 },
 {
  "id": "day14",
  "day": 14,
  "name": "MOD-N Counter",
  "top": "mod10_counter",
  "rtl": "module mod10_counter(input clk,rst_n,en,output reg [3:0] q);\n always @(posedge clk or negedge rst_n)if(!rst_n)q<=0;else if(en)q<=q==9?0:q+1'b1;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.en.value=1;await settle();dut.rst_n.value=1\n for i in range(15):\n  await tick(dut);assert int(dut.q.value)==((i+1)%10)\n",
  "category": "Sequential",
  "description": "MOD-N Counter"
 },
 {
  "id": "day15",
  "day": 15,
  "name": "Gray Counter",
  "top": "gray_counter",
  "rtl": "module gray_counter(input clk,rst_n,en,output [3:0] gray);\n reg [3:0] bin;\n always @(posedge clk or negedge rst_n)if(!rst_n)bin<=0;else if(en)bin<=bin+1'b1;\n assign gray=bin^(bin>>1);\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.en.value=1;await settle();dut.rst_n.value=1\n for i in range(1,9):\n  await tick(dut);assert int(dut.gray.value)==(i^(i>>1))\n",
  "category": "Sequential",
  "description": "Gray Counter"
 },
 {
  "id": "day16",
  "day": 16,
  "name": "Signed Booth Multiplier",
  "top": "booth_multiplier",
  "rtl": "module booth_multiplier(input signed [3:0] a,b,output reg signed [7:0] product);\n integer i;\n reg signed [7:0] acc,m;\n reg [4:0] bits;\n always @* begin\n  acc=0; m={{4{a[3]}},a};bits={b,1'b0};\n  for(i=0;i<4;i=i+1)begin\n   case(bits[i+:2])\n    2'b01:acc=acc+(m<<<i);\n    2'b10:acc=acc-(m<<<i);\n    default:acc=acc;\n   endcase\n  end\n  product=acc;\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for a in (-8,-4,-1,0,1,3,7):\n  for b in (-8,-3,0,2,7):\n   dut.a.value=a&15;dut.b.value=b&15;await settle()\n   assert int(dut.product.value.binstr,2)==((a*b)&255),(a,b,dut.product.value.binstr)\n",
  "category": "Combinational",
  "description": "Signed Booth Multiplier"
 },
 {
  "id": "day17",
  "day": 17,
  "name": "1-bit RAM Cell",
  "top": "ram1",
  "rtl": "module ram1(input clk,we,d,output reg q);\n initial q=0;\n always @(posedge clk)if(we)q<=d;\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.we.value=1;dut.d.value=1;await tick(dut);assert int(dut.q.value)==1\n dut.we.value=0;dut.d.value=0;await tick(dut);assert int(dut.q.value)==1\n",
  "category": "Memory",
  "description": "1-bit RAM Cell"
 },
 {
  "id": "day18",
  "day": 18,
  "name": "4/8-bit RAM",
  "top": "ram8",
  "rtl": "module ram8 #(parameter WIDTH=8)(input clk,we,input [2:0] addr,input [WIDTH-1:0] din,output [WIDTH-1:0] dout);\n reg [WIDTH-1:0] mem[0:7];\n always @(posedge clk)if(we)mem[addr]<=din;\n assign dout=mem[addr];\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.we.value=1\n for addr,val in ((0,17),(1,165),(7,255)):\n  dut.addr.value=addr;dut.din.value=val;await tick(dut)\n dut.we.value=0\n for addr,val in ((0,17),(1,165),(7,255)):\n  dut.addr.value=addr;await settle();assert int(dut.dout.value)==val\n",
  "category": "Memory",
  "description": "Parameterized 4- or 8-bit 8-entry RAM (default WIDTH=8). Default test uses 8-bit mode."
 },
 {
  "id": "day19",
  "day": 19,
  "name": "1/4/8-bit ROM",
  "top": "rom8",
  "rtl": "module rom8 #(parameter WIDTH=8)(input [2:0] addr,output reg [WIDTH-1:0] data);\n always @* begin\n  case(addr)\n    0:data=8'h01;1:data=8'h11;2:data=8'h22;3:data=8'h33;\n    4:data=8'h44;5:data=8'h55;6:data=8'h66;default:data=8'h77;\n  endcase\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for addr,val in enumerate((1,17,34,51,68,85,102,119)):\n  dut.addr.value=addr;await settle();assert int(dut.data.value)==val\n",
  "category": "Memory",
  "description": "Parameterized 1/4/8-bit ROM output (default WIDTH=8). Default test uses 8-bit mode."
 },
 {
  "id": "day20",
  "day": 20,
  "name": "8-bit ALU",
  "top": "alu8",
  "rtl": "module alu8(input [7:0] a,b,input [2:0] op,output reg [7:0] y);\n always @* begin\n  case(op)\n  0:y=a+b;1:y=a-b;2:y=a&b;3:y=a|b;\n  4:y=a^b;5:y=a<<1;6:y=a>>1;default:y=~a;\n  endcase\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n a=0x55;b=0x33\n exp=[a+b,a-b,a&b,a|b,a^b,a<<1,a>>1,~a]\n for op,val in enumerate(exp):\n  dut.a.value=a;dut.b.value=b;dut.op.value=op;await settle()\n  assert int(dut.y.value)==(val&255)\n",
  "category": "Combinational",
  "description": "8-bit ALU"
 },
 {
  "id": "day21",
  "day": 21,
  "name": "1101 Moore Sequence Detector",
  "top": "moore1101",
  "rtl": "module moore1101(input clk,rst_n,din,output reg detect);\n reg [3:0] shift;\n always @(posedge clk or negedge rst_n)begin\n  if(!rst_n)begin shift<=0;detect<=0;end\n  else begin shift<={shift[2:0],din};detect<=({shift[2:0],din}==4'b1101);end\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.din.value=0;await settle();dut.rst_n.value=1\n bits=[1,1,0,1,1,0,1];seq=[]\n for bit in bits:\n  dut.din.value=bit;await tick(dut);seq.append(bit)\n  assert int(dut.detect.value)==int(len(seq)>=4 and seq[-4:]==[1,1,0,1])\n",
  "category": "Sequential",
  "description": "1101 Moore Sequence Detector"
 },
 {
  "id": "day22",
  "day": 22,
  "name": "1010 Mealy Sequence Detector",
  "top": "mealy1010",
  "rtl": "module mealy1010(input clk,rst_n,din,output detect);\n reg [2:0] shift;\n assign detect=({shift,din}==4'b1010);\n always @(posedge clk or negedge rst_n)if(!rst_n)shift<=0;else shift<={shift[1:0],din};\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.din.value=0;await settle();dut.rst_n.value=1\n bits=[1,0,1,0,1,0];seen=[]\n for bit in bits:\n  dut.din.value=bit;await settle();seen.append(bit)\n  assert int(dut.detect.value)==int(len(seen)>=4 and seen[-4:]==[1,0,1,0])\n  await tick(dut)\n",
  "category": "Sequential",
  "description": "1010 Mealy Sequence Detector"
 },
 {
  "id": "day23",
  "day": 23,
  "name": "PWM Generator",
  "top": "pwm4",
  "rtl": "module pwm4(input clk,rst_n,input [3:0] duty,output pwm);\n reg [3:0] ctr;\n always @(posedge clk or negedge rst_n)if(!rst_n)ctr<=0;else ctr<=ctr+1'b1;\n assign pwm=(ctr<duty);\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.duty.value=4;await settle();dut.rst_n.value=1\n for i in range(16):\n  assert int(dut.pwm.value)==int(i<4)\n  await tick(dut)\n",
  "category": "Sequential",
  "description": "PWM Generator"
 },
 {
  "id": "day24",
  "day": 24,
  "name": "Fixed Priority Arbiter",
  "top": "fixed_arbiter",
  "rtl": "module fixed_arbiter(input [3:0] req,output reg [3:0] grant);\n always @* begin\n  grant=0;\n  if(req[0])grant=4'b0001;\n  else if(req[1])grant=4'b0010;\n  else if(req[2])grant=4'b0100;\n  else if(req[3])grant=4'b1000;\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n for r in (0,1,2,3,8,12,15):\n  dut.req.value=r;await settle()\n  assert int(dut.grant.value)==((r&-r) if r else 0)\n",
  "category": "Combinational",
  "description": "Fixed Priority Arbiter"
 },
 {
  "id": "day25",
  "day": 25,
  "name": "Round Robin Arbiter",
  "top": "rr_arbiter",
  "rtl": "module rr_arbiter(input clk,rst_n,input [3:0] req,output reg [3:0] grant);\n reg [1:0] next_prio;\n integer i,idx;\n always @* begin\n  grant=0;\n  for(i=0;i<4;i=i+1)begin\n   idx=(next_prio+i)%4;\n   if(req[idx] && grant==0)grant=(4'b0001<<idx);\n  end\n end\n always @(posedge clk or negedge rst_n)begin\n  if(!rst_n)next_prio<=0;\n  else if(grant[0])next_prio<=1;\n  else if(grant[1])next_prio<=2;\n  else if(grant[2])next_prio<=3;\n  else if(grant[3])next_prio<=0;\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.req.value=15;await settle();dut.rst_n.value=1\n for i in range(8):\n  await settle();assert int(dut.grant.value)==1<<(i%4)\n  await tick(dut)\n",
  "category": "Sequential",
  "description": "Round Robin Arbiter"
 },
 {
  "id": "day26",
  "day": 26,
  "name": "Pseudorandom Number Generator (LFSR)",
  "top": "lfsr8",
  "rtl": "module lfsr8(input clk,rst_n,en,output reg [7:0] rnd);\n wire feedback=rnd[7]^rnd[5]^rnd[4]^rnd[3];\n always @(posedge clk or negedge rst_n)if(!rst_n)rnd<=8'h01;else if(en)rnd<={rnd[6:0],feedback};\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.en.value=1;await settle();dut.rst_n.value=1\n prev=int(dut.rnd.value)\n for i in range(12):\n  bit=((prev>>7)^(prev>>5)^(prev>>4)^(prev>>3))&1\n  prev=((prev<<1)|bit)&255\n  await tick(dut);assert int(dut.rnd.value)==prev\n",
  "category": "Sequential",
  "description": "Pseudorandom Number Generator (LFSR)"
 },
 {
  "id": "day27",
  "day": 27,
  "name": "Even Frequency Divider",
  "top": "freq_div4",
  "rtl": "module freq_div4(input clk,rst_n,output reg out_clk);\n reg phase;\n always @(posedge clk or negedge rst_n)if(!rst_n)begin phase<=0;out_clk<=0;end\n else begin phase<=~phase;if(phase)out_clk<=~out_clk;end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;await settle();dut.rst_n.value=1\n for n in range(1,9):\n  await tick(dut);assert int(dut.out_clk.value)==((n//2)%2)\n",
  "category": "Sequential",
  "description": "Even Frequency Divider"
 },
 {
  "id": "day28",
  "day": 28,
  "name": "Traffic Light Controller",
  "top": "traffic_light",
  "rtl": "module traffic_light(input clk,rst_n,output reg [2:0] lights);\n reg [1:0] state;\n always @(posedge clk or negedge rst_n)if(!rst_n)state<=0;else state<=state==2?0:state+1'b1;\n always @* begin\n  case(state)\n   0:lights=3'b100;1:lights=3'b010;default:lights=3'b001;\n  endcase\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;await settle();dut.rst_n.value=1\n for expect in (4,2,1,4,2,1):\n  assert int(dut.lights.value)==expect\n  await tick(dut)\n",
  "category": "Sequential",
  "description": "Traffic Light Controller"
 },
 {
  "id": "day29",
  "day": 29,
  "name": "Elevator Controller",
  "top": "elevator2",
  "rtl": "module elevator2(input clk,rst_n,request_up,request_down,output reg floor,output reg moving);\n always @(posedge clk or negedge rst_n)if(!rst_n)begin floor<=0;moving<=0;end\n else begin\n  moving<=0;\n  if(request_up && !floor)begin floor<=1;moving<=1;end\n  else if(request_down && floor)begin floor<=0;moving<=1;end\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n dut.clk.value=0;dut.rst_n.value=0;dut.request_up.value=0;dut.request_down.value=0;await settle();dut.rst_n.value=1\n dut.request_up.value=1;await tick(dut);assert int(dut.floor.value)==1 and int(dut.moving.value)==1\n dut.request_up.value=0;dut.request_down.value=1;await tick(dut);assert int(dut.floor.value)==0 and int(dut.moving.value)==1\n",
  "category": "Sequential",
  "description": "Elevator Controller"
 },
 {
  "id": "day30",
  "day": 30,
  "name": "Factorial Calculator",
  "top": "factorial4",
  "rtl": "module factorial4(input [3:0] n,output reg [15:0] result);\n integer i;\n always @* begin\n result=1;\n for(i=1;i<=6;i=i+1)if(i<=n)result=result*i;\n end\nendmodule\n",
  "test": "import cocotb\nfrom cocotb.triggers import Timer\n\nasync def settle():\n    await Timer(2, units=\"ns\")\n\nasync def tick(dut):\n    dut.clk.value = 0\n    await settle()\n    dut.clk.value = 1\n    await settle()\n    dut.clk.value = 0\n    await settle()\n\n@cocotb.test()\nasync def check(dut):\n import math\n for n in range(7):\n  dut.n.value=n;await settle();assert int(dut.result.value)==math.factorial(n)\n",
  "category": "Combinational",
  "description": "Factorial Calculator"
 }
];
root.ASIC_COCOTB_EXAMPLES=Object.freeze(examples);
})(window);
