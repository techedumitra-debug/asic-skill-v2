// ASIC-Skill v37.0.28 additional VHDL exercises.
Object.assign(window.ASICGHDLExampleLibrary, {
  "half_adder": {
    "label": "Half Adder",
    "group": "Combinational",
    "design": "half_adder",
    "top": "tb_half_adder",
    "description": "Sum=A XOR B; Carry=A AND B.",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_half_adder is end;\narchitecture test of tb_half_adder is\n signal a,b:std_logic:='0';signal sum,carry:std_logic;\n begin\n dut:entity work.half_adder port map(a,b,sum,carry);\n process begin\n for i in 0 to 3 loop\n a<=std_logic'val(2+(i/2)); b<=std_logic'val(2+(i mod 2)); wait for 10 ns;\n assert sum=(a xor b) and carry=(a and b) report \"Half adder mismatch\" severity error;\n end loop;\n report \"Half Adder tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "dataflow": {
        "style": "dataflow",
        "label": "XOR / AND",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity half_adder is\n port(\n  a,b:in std_logic; sum,carry:out std_logic\n );\nend half_adder;\narchitecture rtl of half_adder is begin sum<=a xor b; carry<=a and b; end rtl;"
      },
      "behavioral": {
        "style": "behavioral",
        "label": "Process / If",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity half_adder is\n port(\n  a,b:in std_logic; sum,carry:out std_logic\n );\nend half_adder;\narchitecture rtl of half_adder is begin process(all) begin if a=b then sum<='0'; else sum<='1'; end if; if a='1' and b='1' then carry<='1'; else carry<='0'; end if; end process; end rtl;"
      }
    },
    "pass_marker": "Half Adder tests PASSED"
  },
  "full_adder": {
    "label": "Full Adder",
    "group": "Combinational",
    "design": "full_adder",
    "top": "tb_full_adder",
    "description": "Full Adder: self-checking VHDL example",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_full_adder is end;\narchitecture test of tb_full_adder is\n signal a,b,cin:std_logic:='0';signal sum,cout:std_logic;\n begin dut:entity work.full_adder port map(a,b,cin,sum,cout);\n process begin for i in 0 to 7 loop\n a<=std_logic'val(2+i/4);b<=std_logic'val(2+(i/2) mod 2);cin<=std_logic'val(2+i mod 2);\n wait for 10 ns;\n assert sum=(a xor b xor cin) and cout=((a and b) or (a and cin) or (b and cin)) report \"Full adder mismatch\" severity error;\n end loop;report \"Full Adder tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "dataflow": {
        "style": "dataflow",
        "label": "Boolean equations",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity full_adder is\n port(\n  a,b,cin:in std_logic; sum,cout:out std_logic\n );\nend full_adder;\narchitecture rtl of full_adder is begin sum<=a xor b xor cin; cout<=(a and b) or (a and cin) or (b and cin); end rtl;"
      },
      "behavioral": {
        "style": "behavioral",
        "label": "Case statement",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity full_adder is\n port(\n  a,b,cin:in std_logic; sum,cout:out std_logic\n );\nend full_adder;\narchitecture rtl of full_adder is begin\n process(all) begin\n case (a & b & cin) is\n when \"000\"=>sum<='0';cout<='0';when \"001\"|\"010\"|\"100\"=>sum<='1';cout<='0';\n when \"011\"|\"101\"|\"110\"=>sum<='0';cout<='1';when \"111\"=>sum<='1';cout<='1';\n when others=>sum<='X';cout<='X';end case;end process;end rtl;"
      }
    },
    "pass_marker": "Full Adder tests PASSED"
  },
  "binary_gray": {
    "label": "Binary \u2194 Gray Code Converter",
    "group": "Combinational",
    "design": "binary_gray",
    "top": "tb_binary_gray",
    "description": "Binary \u2194 Gray Code Converter: self-checking VHDL example",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_binary_gray is end;\narchitecture test of tb_binary_gray is\n signal binary_in,gray_in:std_logic_vector(3 downto 0):=(others=>'0');signal gray_out,binary_out:std_logic_vector(3 downto 0);\n begin dut:entity work.binary_gray port map(binary_in,gray_in,gray_out,binary_out);\n process variable b:std_logic_vector(3 downto 0);variable g:std_logic_vector(3 downto 0);\n begin for i in 0 to 15 loop\n b:=std_logic_vector(to_unsigned(i,4));g:=b xor ('0' & b(3 downto 1));\n binary_in<=b;gray_in<=g;wait for 5 ns;\n assert gray_out=g and binary_out=b report \"Binary/Gray mismatch\" severity error;\n end loop;report \"Binary/Gray tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "dataflow": {
        "style": "dataflow",
        "label": "Concurrent assignments",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity binary_gray is\n port(\n  binary_in,gray_in:in std_logic_vector(3 downto 0); gray_out,binary_out:out std_logic_vector(3 downto 0)\n );\nend binary_gray;\narchitecture rtl of binary_gray is begin\n gray_out<=binary_in xor ('0' & binary_in(3 downto 1));\n binary_out(3)<=gray_in(3);\n binary_out(2)<=gray_in(3) xor gray_in(2);\n binary_out(1)<=gray_in(3) xor gray_in(2) xor gray_in(1);\n binary_out(0)<=gray_in(3) xor gray_in(2) xor gray_in(1) xor gray_in(0);\n end rtl;"
      },
      "behavioral": {
        "style": "behavioral",
        "label": "For loop",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity binary_gray is\n port(\n  binary_in,gray_in:in std_logic_vector(3 downto 0); gray_out,binary_out:out std_logic_vector(3 downto 0)\n );\nend binary_gray;\narchitecture rtl of binary_gray is begin\n process(all) variable b:std_logic_vector(3 downto 0);variable g:std_logic_vector(3 downto 0);\n begin g(3):=binary_in(3);for i in 2 downto 0 loop g(i):=binary_in(i+1) xor binary_in(i); end loop;\n b(3):=gray_in(3);for i in 2 downto 0 loop b(i):=b(i+1) xor gray_in(i);end loop;\n gray_out<=g;binary_out<=b;end process;end rtl;"
      }
    },
    "pass_marker": "Binary/Gray tests PASSED"
  },
  "decoder4x16": {
    "label": "4:16 Decoder",
    "group": "Combinational",
    "design": "decoder4x16",
    "top": "tb_decoder4x16",
    "description": "4:16 Decoder: self-checking VHDL example",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_decoder4x16 is end;\narchitecture test of tb_decoder4x16 is\n signal sel:unsigned(3 downto 0):=(others=>'0');signal enable:std_logic:='0';signal y:std_logic_vector(15 downto 0);\n begin dut:entity work.decoder4x16 port map(sel,enable,y);\n process begin enable<='0';wait for 5 ns;assert y=x\"0000\" report \"Disable mismatch\" severity error;\n enable<='1';for i in 0 to 15 loop sel<=to_unsigned(i,4);wait for 5 ns;\n assert unsigned(y)=shift_left(to_unsigned(1,16),i) report \"Decoder mismatch\" severity error;\n end loop;report \"4:16 Decoder tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "dataflow": {
        "style": "dataflow",
        "label": "Selected output",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder4x16 is\n port(\n  sel:in unsigned(3 downto 0); enable:in std_logic; y:out std_logic_vector(15 downto 0)\n );\nend decoder4x16;\narchitecture rtl of decoder4x16 is begin y<=std_logic_vector(shift_left(to_unsigned(1,16),to_integer(sel))) when enable='1' else (others=>'0');end rtl;"
      },
      "behavioral": {
        "style": "behavioral",
        "label": "Process / Loop",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder4x16 is\n port(\n  sel:in unsigned(3 downto 0); enable:in std_logic; y:out std_logic_vector(15 downto 0)\n );\nend decoder4x16;\narchitecture rtl of decoder4x16 is begin\n process(all) variable tmp:std_logic_vector(15 downto 0);\n begin tmp:=(others=>'0');if enable='1' then tmp(to_integer(sel)):='1';end if; y<=tmp;end process;end rtl;"
      }
    },
    "pass_marker": "4:16 Decoder tests PASSED"
  },
  "bcd7seg": {
    "label": "BCD to 7-Segment Display",
    "group": "Combinational",
    "design": "bcd7seg",
    "top": "tb_bcd7seg",
    "description": "Common cathode, active-high segments abcdefg.",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_bcd7seg is end;\narchitecture test of tb_bcd7seg is\n signal bcd:unsigned(3 downto 0):=(others=>'0');signal seg:std_logic_vector(6 downto 0);\n begin dut:entity work.bcd7seg port map(bcd,seg);\n process begin bcd<=to_unsigned(0,4);wait for 5 ns;\n assert seg=\"1111110\" report \"0 display error\" severity error;\n bcd<=to_unsigned(1,4);wait for 5 ns;\n assert seg=\"0110000\" report \"1 display error\" severity error;\n bcd<=to_unsigned(9,4);wait for 5 ns;\n assert seg=\"1111011\" report \"9 display error\" severity error;\n bcd<=to_unsigned(12,4);wait for 5 ns;\n assert seg=\"0000000\" report \"Invalid BCD display error\" severity error;\n report \"BCD 7-Segment tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "behavioral": {
        "style": "behavioral",
        "label": "Case table (abcdefg)",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity bcd7seg is\n port(\n  bcd:in unsigned(3 downto 0);seg:out std_logic_vector(6 downto 0)\n );\nend bcd7seg;\narchitecture rtl of bcd7seg is begin process(all) begin\n -- active-high a,b,c,d,e,f,g segments\n case to_integer(bcd) is\n when 0=>seg<=\"1111110\";when 1=>seg<=\"0110000\";when 2=>seg<=\"1101101\";\n when 3=>seg<=\"1111001\";when 4=>seg<=\"0110011\";when 5=>seg<=\"1011011\";\n when 6=>seg<=\"1011111\";when 7=>seg<=\"1110000\";when 8=>seg<=\"1111111\";\n when 9=>seg<=\"1111011\";when others=>seg<=\"0000000\";end case;\n end process;end rtl;"
      },
      "dataflow": {
        "style": "dataflow",
        "label": "With / Select",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity bcd7seg is\n port(\n  bcd:in unsigned(3 downto 0);seg:out std_logic_vector(6 downto 0)\n );\nend bcd7seg;\narchitecture rtl of bcd7seg is begin\n with to_integer(bcd) select seg<=\n \"1111110\" when 0,\"0110000\" when 1,\"1101101\" when 2,\"1111001\" when 3,\n \"0110011\" when 4,\"1011011\" when 5,\"1011111\" when 6,\"1110000\" when 7,\n \"1111111\" when 8,\"1111011\" when 9,\"0000000\" when others;\n end rtl;"
      }
    },
    "pass_marker": "BCD 7-Segment tests PASSED"
  },
  "moore101": {
    "label": "Moore 101 Sequence Detector",
    "group": "Sequential",
    "design": "moore101",
    "top": "tb_moore101",
    "description": "Moore 101 Sequence Detector: self-checking VHDL example",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_moore101 is end;\narchitecture test of tb_moore101 is\n signal clk:std_logic:='0';signal rst:std_logic:='1';signal din:std_logic:='0';signal detected:std_logic;\n begin dut:entity work.moore101 port map(clk,rst,din,detected);\n clk<=not clk after 5 ns;\n process begin wait for 12 ns;rst<='0';\n din<='1';wait until rising_edge(clk);wait for 1 ns;\n din<='0';wait until rising_edge(clk);wait for 1 ns;\n din<='1';wait until rising_edge(clk);wait for 1 ns;\n assert detected='1' report \"Moore detector failed\" severity error;\n din<='0';wait until rising_edge(clk);wait for 1 ns;\n assert detected='0' report \"Moore detector stuck\" severity error;\n report \"Moore FSM tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "behavioral": {
        "style": "behavioral",
        "label": "State machine",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity moore101 is\n port(\n  clk,rst,din:in std_logic;detected:out std_logic\n );\nend moore101;\narchitecture rtl of moore101 is type state_t is (idle,s1,s10,s101);signal state:state_t:=idle;\n begin process(clk,rst) begin\n if rst='1' then state<=idle;\n elsif rising_edge(clk) then\n case state is\n when idle=>if din='1' then state<=s1; else state<=idle; end if;\n when s1=>if din='0' then state<=s10;else state<=s1;end if;\n when s10=>if din='1' then state<=s101;else state<=idle;end if;\n when s101=>if din='0' then state<=s10;else state<=s1;end if;\n end case;end if;end process;\n detected<='1' when state=s101 else '0';end rtl;"
      }
    },
    "pass_marker": "Moore FSM tests PASSED"
  },
  "mealy101": {
    "label": "Mealy 101 Sequence Detector",
    "group": "Sequential",
    "design": "mealy101",
    "top": "tb_mealy101",
    "description": "Mealy 101 Sequence Detector: self-checking VHDL example",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_mealy101 is end;\narchitecture test of tb_mealy101 is\n signal clk:std_logic:='0';signal rst:std_logic:='1';signal din:std_logic:='0';signal detected:std_logic;\n begin dut:entity work.mealy101 port map(clk,rst,din,detected);\n clk<=not clk after 5 ns;\n process begin wait for 12 ns;rst<='0';\n din<='1';wait until rising_edge(clk);wait for 1 ns;\n din<='0';wait until rising_edge(clk);wait for 1 ns;\n din<='1';wait for 1 ns;\n assert detected='1' report \"Mealy detector failed\" severity error;\n wait until rising_edge(clk);wait for 1 ns;\n din<='0';wait for 1 ns;assert detected='0' report \"Mealy output held\" severity error;\n report \"Mealy FSM tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "behavioral": {
        "style": "behavioral",
        "label": "State machine",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mealy101 is\n port(\n  clk,rst,din:in std_logic;detected:out std_logic\n );\nend mealy101;\narchitecture rtl of mealy101 is type state_t is (idle,s1,s10);signal state:state_t:=idle;\n begin process(clk,rst) begin\n if rst='1' then state<=idle;\n elsif rising_edge(clk) then\n case state is\n when idle=>if din='1' then state<=s1;else state<=idle;end if;\n when s1=>if din='0' then state<=s10;else state<=s1;end if;\n when s10=>if din='1' then state<=s1;else state<=idle;end if;\n end case;end if;end process;\n detected<='1' when state=s10 and din='1' else '0';end rtl;"
      }
    },
    "pass_marker": "Mealy FSM tests PASSED"
  },
  "traffic_light": {
    "label": "Traffic Light Controller",
    "group": "Sequential",
    "design": "traffic_light",
    "top": "tb_traffic_light",
    "description": "Traffic Light Controller: self-checking VHDL example",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_traffic_light is end;\narchitecture test of tb_traffic_light is\n signal clk:std_logic:='0';signal rst:std_logic:='1';signal red,yellow,green:std_logic;\n begin dut:entity work.traffic_light port map(clk,rst,red,yellow,green);\n clk<=not clk after 5 ns;\n process begin wait for 2 ns;assert red='1' report \"Reset red missing\" severity error;\n wait for 10 ns;rst<='0';wait until rising_edge(clk);wait for 1 ns;\n assert green='1' report \"Green stage missing\" severity error;\n wait until rising_edge(clk);wait for 1 ns;assert yellow='1' report \"Yellow stage missing\" severity error;\n wait until rising_edge(clk);wait for 1 ns;assert red='1' report \"Red stage missing\" severity error;\n report \"Traffic light tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "behavioral": {
        "style": "behavioral",
        "label": "3-state controller",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity traffic_light is\n port(\n  clk,rst:in std_logic;red,yellow,green:out std_logic\n );\nend traffic_light;\narchitecture rtl of traffic_light is type state_t is (red_s,green_s,yellow_s);signal state:state_t:=red_s;\n begin process(clk,rst) begin if rst='1' then state<=red_s;elsif rising_edge(clk) then\n case state is when red_s=>state<=green_s;when green_s=>state<=yellow_s;when yellow_s=>state<=red_s;end case;\n end if;end process;\n red<='1' when state=red_s else '0';green<='1' when state=green_s else '0';yellow<='1' when state=yellow_s else '0';end rtl;"
      }
    },
    "pass_marker": "Traffic light tests PASSED"
  },
  "uart_tx": {
    "label": "UART Transmitter (8N1)",
    "group": "Sequential",
    "design": "uart_tx",
    "top": "tb_uart_tx",
    "description": "One clock per bit for education (no baud-rate divider or receiver).",
    "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_uart_tx is end;\narchitecture test of tb_uart_tx is\n signal clk:std_logic:='0';signal rst:std_logic:='1';signal start:std_logic:='0';signal data_in:std_logic_vector(7 downto 0):=x\"A5\";signal tx,busy:std_logic;\n begin dut:entity work.uart_tx port map(clk,rst,start,data_in,tx,busy);\n clk<=not clk after 5 ns;\n process begin wait for 12 ns;rst<='0';start<='1';wait until rising_edge(clk);wait for 1 ns;start<='0';\n assert busy='1' report \"UART did not start\" severity error;\n wait until rising_edge(clk);wait for 1 ns;assert tx='0' report \"Missing UART start bit\" severity error;\n for i in 0 to 7 loop wait until rising_edge(clk);wait for 1 ns;\n assert tx=data_in(i) report \"UART serial data mismatch\" severity error;end loop;\n wait until rising_edge(clk);wait for 1 ns;assert tx='1' report \"Missing stop bit\" severity error;\n report \"UART transmitter tests PASSED\" severity note;wait;end process;end test;",
    "variants": {
      "behavioral": {
        "style": "behavioral",
        "label": "8N1 behavioral transmitter",
        "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity uart_tx is\n port(\n  clk,rst,start:in std_logic;data_in:in std_logic_vector(7 downto 0);tx,busy:out std_logic\n );\nend uart_tx;\narchitecture rtl of uart_tx is\n signal shift:std_logic_vector(9 downto 0):=(others=>'1');signal bits_left:integer range 0 to 10:=0;signal tx_reg:std_logic:='1';\n begin process(clk,rst)begin if rst='1' then shift<=(others=>'1');bits_left<=0;tx_reg<='1';\n elsif rising_edge(clk) then\n if bits_left=0 then tx_reg<='1';if start='1' then shift<='1' & data_in & '0';bits_left<=10;end if;\n else tx_reg<=shift(0);shift<='1' & shift(9 downto 1);bits_left<=bits_left-1;end if;\n end if;end process;tx<=tx_reg;busy<='1' when bits_left>0 else '0';end rtl;"
      }
    },
    "pass_marker": "UART transmitter tests PASSED"
  }
});
