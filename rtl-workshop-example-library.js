/* Native Verilog testbenches for the 30-day RTL Workshop exercises.
 * Assertions are directed examples, not exhaustive formal proof. */
window.ASICRTL_WORKSHOP_TESTS={
  "counter": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_counter;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg en = 0;\n  wire [3:0] q;\n  counter dut(.clk(clk), .rst_n(rst_n), .en(en), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_counter);\n    #12 rst_n=1;en=1;repeat(5) @(negedge clk);#1;if(q!==4'd5)$fatal(1,\"count mismatch\");\n    $display(\"PASS: directed assertions passed for counter\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_counter"
  },
  "adder": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_adder;\n  reg [7:0] a = 0;\n  reg [7:0] b = 0;\n  wire [8:0] sum;\n  adder dut(.a(a), .b(b), .sum(sum));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_adder);\n    a=8'd3;b=8'd5;#2;if(sum!==9'd8)$fatal(1,\"adder mismatch\");a=8'd255;b=1;#2;if(sum!==9'd256)$fatal(1,\"carry mismatch\");\n    $display(\"PASS: directed assertions passed for adder\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_adder"
  },
  "day01": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_full_adder;\n  reg a = 0;\n  reg b = 0;\n  reg cin = 0;\n  wire sum;\n  wire cout;\n  full_adder dut(.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_full_adder);\n    a=0;b=0;cin=0;#2;if({cout,sum}!==2'd0)$fatal(1,\"adder at zero\");a=1;b=1;cin=1;#2;if({cout,sum}!==2'd3)$fatal(1,\"adder at ones\");\n    $display(\"PASS: directed assertions passed for Half Adder & Full Adder\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_full_adder"
  },
  "day02": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_ripple_adder;\n  reg [3:0] a = 0;\n  reg [3:0] b = 0;\n  reg cin = 0;\n  wire [3:0] sum;\n  wire cout;\n  ripple_adder dut(.a(a), .b(b), .cin(cin), .sum(sum), .cout(cout));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_ripple_adder);\n    a=4'd15;b=4'd1;cin=0;#2;if({cout,sum}!==5'd16)$fatal(1,\"carry chain mismatch\");\n    $display(\"PASS: directed assertions passed for Ripple Carry Adder\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_ripple_adder"
  },
  "day03": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_gray_converter;\n  reg [3:0] x = 0;\n  reg mode = 0;\n  wire [3:0] y;\n  gray_converter dut(.x(x), .mode(mode), .y(y));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_gray_converter);\n    mode=0;x=4'd7;#2;if(y!==(x^(x>>1)))$fatal(1,\"gray conversion\");mode=1;x=4'b0100;#2;if(y!==4'b0111)$fatal(1,\"binary conversion\");\n    $display(\"PASS: directed assertions passed for Binary / Gray Code Conversion\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_gray_converter"
  },
  "day04": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_mux4;\n  reg [3:0] d = 0;\n  reg [1:0] sel = 0;\n  wire y;\n  mux4 dut(.d(d), .sel(sel), .y(y));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_mux4);\n    d=4'b1010;sel=2'd1;#2;if(y!==1'b1)$fatal(1,\"mux selection 1\");sel=2'd0;#2;if(y!==1'b0)$fatal(1,\"mux selection 0\");\n    $display(\"PASS: directed assertions passed for Multiplexers\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_mux4"
  },
  "day05": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_demux4;\n  reg din = 0;\n  reg [1:0] sel = 0;\n  wire [3:0] y;\n  demux4 dut(.din(din), .sel(sel), .y(y));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_demux4);\n    din=1;sel=2'd2;#2;if(y!==4'b0100)$fatal(1,\"demux selection\");\n    $display(\"PASS: directed assertions passed for Demultiplexers\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_demux4"
  },
  "day06": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_priority_encoder;\n  reg [7:0] req = 0;\n  wire [2:0] code;\n  wire valid;\n  priority_encoder dut(.req(req), .code(code), .valid(valid));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_priority_encoder);\n    req=8'b00001000;#2;if(code!==3'd3||valid!==1'b1)$fatal(1,\"priority encoder\");\n    $display(\"PASS: directed assertions passed for Encoders\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_priority_encoder"
  },
  "day07": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_decoder3x8;\n  reg [2:0] sel = 0;\n  reg en = 0;\n  wire [7:0] y;\n  decoder3x8 dut(.sel(sel), .en(en), .y(y));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_decoder3x8);\n    en=1;sel=3'd5;#2;if(y!==8'b00100000)$fatal(1,\"decoder enabled\");en=0;#2;if(y!==0)$fatal(1,\"decoder disabled\");\n    $display(\"PASS: directed assertions passed for Decoders\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_decoder3x8"
  },
  "day08": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_d_latch;\n  reg d = 0;\n  reg en = 0;\n  wire q;\n  d_latch dut(.d(d), .en(en), .q(q));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_d_latch);\n    d=1;en=1;#2;if(q!==1'b1)$fatal(1,\"latch transparent\");en=0;d=0;#2;if(q!==1'b1)$fatal(1,\"latch hold\");\n    $display(\"PASS: directed assertions passed for D Latch\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_d_latch"
  },
  "day09": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_d_flipflop;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg d = 0;\n  wire q;\n  d_flipflop dut(.clk(clk), .rst_n(rst_n), .d(d), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_d_flipflop);\n    rst_n=0;#2;rst_n=1;d=1;@(negedge clk);#1;if(q!==1'b1)$fatal(1,\"flipflop capture\");\n    $display(\"PASS: directed assertions passed for D Flip-Flop\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_d_flipflop"
  },
  "day10": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_comparator4;\n  reg [3:0] a = 0;\n  reg [3:0] b = 0;\n  wire gt;\n  wire eq;\n  wire lt;\n  comparator4 dut(.a(a), .b(b), .gt(gt), .eq(eq), .lt(lt));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_comparator4);\n    a=4'd9;b=4'd3;#2;if({gt,eq,lt}!==3'b100)$fatal(1,\"compare greater\");a=4'd3;#2;if({gt,eq,lt}!==3'b010)$fatal(1,\"compare equal\");\n    $display(\"PASS: directed assertions passed for Magnitude Comparators\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_comparator4"
  },
  "day11": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_shift_serial;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg shift_en = 0;\n  reg din = 0;\n  wire [3:0] q;\n  shift_serial dut(.clk(clk), .rst_n(rst_n), .shift_en(shift_en), .din(din), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_shift_serial);\n    rst_n=0;#2;rst_n=1;shift_en=1;din=1;@(negedge clk);#1;if(q[0]!==1'b1)$fatal(1,\"serial shift\");\n    $display(\"PASS: directed assertions passed for Shift Register — Serial\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_shift_serial"
  },
  "day12": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_shift_parallel;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg load = 0;\n  reg [3:0] d = 0;\n  wire [3:0] q;\n  shift_parallel dut(.clk(clk), .rst_n(rst_n), .load(load), .d(d), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_shift_parallel);\n    rst_n=0;#2;rst_n=1;load=1;d=4'b1011;@(negedge clk);#1;if(q!==4'b1011)$fatal(1,\"parallel load\");\n    $display(\"PASS: directed assertions passed for Shift Register — Parallel Load\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_shift_parallel"
  },
  "day13": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_updown_counter;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg en = 0;\n  reg up = 0;\n  wire [3:0] q;\n  updown_counter dut(.clk(clk), .rst_n(rst_n), .en(en), .up(up), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_updown_counter);\n    rst_n=0;en=0;up=1;#2;rst_n=1;en=1;@(negedge clk);#1;if(q!==4'd1)$fatal(1,\"up count\");up=0;@(negedge clk);#1;if(q!==4'd0)$fatal(1,\"down count\");\n    $display(\"PASS: directed assertions passed for Up / Down Counter\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_updown_counter"
  },
  "day14": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_mod10_counter;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg en = 0;\n  wire [3:0] q;\n  mod10_counter dut(.clk(clk), .rst_n(rst_n), .en(en), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_mod10_counter);\n    rst_n=0;en=0;#2;rst_n=1;en=1;repeat(10) @(negedge clk);#1;if(q!==0)$fatal(1,\"mod-10 wrap\");\n    $display(\"PASS: directed assertions passed for MOD-N Counter\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_mod10_counter"
  },
  "day15": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_gray_counter;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg en = 0;\n  wire [3:0] gray;\n  gray_counter dut(.clk(clk), .rst_n(rst_n), .en(en), .gray(gray));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_gray_counter);\n    rst_n=0;en=0;#2;rst_n=1;en=1;@(negedge clk);#1;if(gray!==4'd1)$fatal(1,\"gray count\");\n    $display(\"PASS: directed assertions passed for Gray Counter\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_gray_counter"
  },
  "day16": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_booth_multiplier;\n  reg signed [3:0] a = 0;\n  reg signed [3:0] b = 0;\n  wire signed [7:0] product;\n  booth_multiplier dut(.a(a), .b(b), .product(product));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_booth_multiplier);\n    a=3;b=-2;#2;if(product!==-6)$fatal(1,\"signed booth multiplication\");\n    $display(\"PASS: directed assertions passed for Signed Booth Multiplier\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_booth_multiplier"
  },
  "day17": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_ram1;\n  reg clk = 0;\n  reg we = 0;\n  reg d = 0;\n  wire q;\n  ram1 dut(.clk(clk), .we(we), .d(d), .q(q));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_ram1);\n    we=1;d=1;@(negedge clk);#1;if(q!==1'b1)$fatal(1,\"RAM cell write\");\n    $display(\"PASS: directed assertions passed for 1-bit RAM Cell\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_ram1"
  },
  "day18": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_ram8;\n  reg clk = 0;\n  reg we = 0;\n  reg [2:0] addr = 0;\n  reg [8-1:0] din = 0;\n  wire [8-1:0] dout;\n  ram8 dut(.clk(clk), .we(we), .addr(addr), .din(din), .dout(dout));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_ram8);\n    we=1;addr=3'd2;din=8'hA5;@(negedge clk);#1;if(dout!==8'hA5)$fatal(1,\"RAM write/read\");\n    $display(\"PASS: directed assertions passed for 4/8-bit RAM\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_ram8"
  },
  "day19": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_rom8;\n  reg [2:0] addr = 0;\n  wire [8-1:0] data;\n  rom8 dut(.addr(addr), .data(data));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_rom8);\n    addr=0;#2;if(data!==8'h01)$fatal(1,\"ROM entry zero\");addr=1;#2;if(data!==8'h11)$fatal(1,\"ROM entry one\");\n    $display(\"PASS: directed assertions passed for 1/4/8-bit ROM\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_rom8"
  },
  "day20": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_alu8;\n  reg [7:0] a = 0;\n  reg [7:0] b = 0;\n  reg [2:0] op = 0;\n  wire [7:0] y;\n  alu8 dut(.a(a), .b(b), .op(op), .y(y));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_alu8);\n    a=8'd5;b=8'd3;op=0;#2;if(y!==8'd8)$fatal(1,\"ALU add\");op=2;#2;if(y!==(a&b))$fatal(1,\"ALU AND\");\n    $display(\"PASS: directed assertions passed for 8-bit ALU\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_alu8"
  },
  "day21": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_moore1101;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg din = 0;\n  wire detect;\n  moore1101 dut(.clk(clk), .rst_n(rst_n), .din(din), .detect(detect));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_moore1101);\n    rst_n=0;din=0;#2;rst_n=1;din=1;@(negedge clk);din=1;@(negedge clk);din=0;@(negedge clk);din=1;@(negedge clk);#1;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day21\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_moore1101"
  },
  "day22": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_mealy1010;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg din = 0;\n  wire detect;\n  mealy1010 dut(.clk(clk), .rst_n(rst_n), .din(din), .detect(detect));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_mealy1010);\n    rst_n=0;din=0;#2;rst_n=1;din=1;@(negedge clk);din=0;@(negedge clk);din=1;@(negedge clk);din=0;#2;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day22\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_mealy1010"
  },
  "day23": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_pwm4;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg [3:0] duty = 0;\n  wire pwm;\n  pwm4 dut(.clk(clk), .rst_n(rst_n), .duty(duty), .pwm(pwm));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_pwm4);\n    rst_n=0;duty=4'd8;#2;rst_n=1;repeat(20) @(negedge clk);#1;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day23\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_pwm4"
  },
  "day24": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_fixed_arbiter;\n  reg [3:0] req = 0;\n  wire [3:0] grant;\n  fixed_arbiter dut(.req(req), .grant(grant));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_fixed_arbiter);\n    req=4'b0100;#2;if(grant!==4'b0100)$fatal(1,\"fixed arbiter\");req=4'b1110;#2;if(grant!==4'b0010)$fatal(1,\"arbiter priority\");\n    $display(\"PASS: directed assertions passed for Fixed Priority Arbiter\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_fixed_arbiter"
  },
  "day25": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_rr_arbiter;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg [3:0] req = 0;\n  wire [3:0] grant;\n  rr_arbiter dut(.clk(clk), .rst_n(rst_n), .req(req), .grant(grant));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_rr_arbiter);\n    rst_n=0;req=4'b0011;#2;rst_n=1;repeat(5) @(negedge clk);#1;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day25\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_rr_arbiter"
  },
  "day26": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_lfsr8;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg en = 0;\n  wire [7:0] rnd;\n  lfsr8 dut(.clk(clk), .rst_n(rst_n), .en(en), .rnd(rnd));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_lfsr8);\n    rst_n=0;en=0;#2;rst_n=1;en=1;repeat(4) @(negedge clk);#1;if(rnd===8'bxxxxxxxx)$fatal(1,\"LFSR undefined\");\n    $display(\"PASS: directed assertions passed for Pseudorandom Number Generator (LFSR)\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_lfsr8"
  },
  "day27": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_freq_div4;\n  reg clk = 0;\n  reg rst_n = 0;\n  wire out_clk;\n  freq_div4 dut(.clk(clk), .rst_n(rst_n), .out_clk(out_clk));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_freq_div4);\n    rst_n=0;#2;rst_n=1;repeat(8) @(negedge clk);#1;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day27\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_freq_div4"
  },
  "day28": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_traffic_light;\n  reg clk = 0;\n  reg rst_n = 0;\n  wire [2:0] lights;\n  traffic_light dut(.clk(clk), .rst_n(rst_n), .lights(lights));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_traffic_light);\n    rst_n=0;#2;rst_n=1;repeat(6) @(negedge clk);#1;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day28\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_traffic_light"
  },
  "day29": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_elevator2;\n  reg clk = 0;\n  reg rst_n = 0;\n  reg request_up = 0;\n  reg request_down = 0;\n  wire floor;\n  wire moving;\n  elevator2 dut(.clk(clk), .rst_n(rst_n), .request_up(request_up), .request_down(request_down), .floor(floor), .moving(moving));\n  always #5 clk = ~clk;\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_elevator2);\n    rst_n=0;request_up=0;request_down=0;#2;rst_n=1;request_up=1;repeat(4) @(negedge clk);#1;\n    $display(\"INFO: smoke stimuli completed; inspect the waveform (no assertions in this template) for day29\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_elevator2"
  },
  "day30": {
    "testbench": "`timescale 1ns/1ps\nmodule tb_factorial4;\n  reg [3:0] n = 0;\n  wire [15:0] result;\n  factorial4 dut(.n(n), .result(result));\n  initial begin\n    $dumpfile(\"rtl_wave.vcd\");\n    $dumpvars(0, tb_factorial4);\n    n=4'd5;#2;if(result!==16'd120)$fatal(1,\"factorial of five\");\n    $display(\"PASS: directed assertions passed for Factorial Calculator\");\n    $finish;\n  end\nendmodule\n",
    "test_top": "tb_factorial4"
  }
};
