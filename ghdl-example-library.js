/* ASIC-Skill educational VHDL library v37.0.27: design variants + self-checking testbenches. */
window.ASICGHDLExampleLibrary = {
 "mux16x1": {
  "label": "16:1 MUX",
  "group": "Combinational",
  "design": "mux16x1",
  "top": "tb_mux16x1",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_mux16x1 is end;\narchitecture test of tb_mux16x1 is\n  signal d:std_logic_vector(15 downto 0):=x\"A596\";\n  signal sel:unsigned(3 downto 0):=(others=>'0');\n  signal y:std_logic;\nbegin\n  dut: entity work.mux16x1 port map(d,sel,y);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      sel<=to_unsigned(i,4); wait for 5 ns;\n      assert y=d(i) report \"MUX16x1 wrong select\" severity error;\n    end loop;\n    report \"mux16x1 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "case": {
    "style": "behavioral",
    "label": "Case",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mux16x1 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    sel: in unsigned(3 downto 0);\n    y: out std_logic\n  );\nend mux16x1;\narchitecture behavioral of mux16x1 is\nbegin\n  process(all) begin\n    case to_integer(sel) is\n      when 0 => y <= d(0);\n      when 1 => y <= d(1);\n      when 2 => y <= d(2);\n      when 3 => y <= d(3);\n      when 4 => y <= d(4);\n      when 5 => y <= d(5);\n      when 6 => y <= d(6);\n      when 7 => y <= d(7);\n      when 8 => y <= d(8);\n      when 9 => y <= d(9);\n      when 10 => y <= d(10);\n      when 11 => y <= d(11);\n      when 12 => y <= d(12);\n      when 13 => y <= d(13);\n      when 14 => y <= d(14);\n      when 15 => y <= d(15);\n      when others => y <= '0';\n    end case;\n  end process;\nend behavioral;\n"
   },
   "if_else": {
    "style": "behavioral",
    "label": "If / Else",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mux16x1 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    sel: in unsigned(3 downto 0);\n    y: out std_logic\n  );\nend mux16x1;\narchitecture behavioral of mux16x1 is\nbegin\n  process(all) begin\n    if sel=to_unsigned(0,4) then y <= d(0);\n    elsif sel=to_unsigned(1,4) then y <= d(1);\n    elsif sel=to_unsigned(2,4) then y <= d(2);\n    elsif sel=to_unsigned(3,4) then y <= d(3);\n    elsif sel=to_unsigned(4,4) then y <= d(4);\n    elsif sel=to_unsigned(5,4) then y <= d(5);\n    elsif sel=to_unsigned(6,4) then y <= d(6);\n    elsif sel=to_unsigned(7,4) then y <= d(7);\n    elsif sel=to_unsigned(8,4) then y <= d(8);\n    elsif sel=to_unsigned(9,4) then y <= d(9);\n    elsif sel=to_unsigned(10,4) then y <= d(10);\n    elsif sel=to_unsigned(11,4) then y <= d(11);\n    elsif sel=to_unsigned(12,4) then y <= d(12);\n    elsif sel=to_unsigned(13,4) then y <= d(13);\n    elsif sel=to_unsigned(14,4) then y <= d(14);\n    elsif sel=to_unsigned(15,4) then y <= d(15);\n    else y <= '0'; end if;\n  end process;\nend behavioral;\n"
   },
   "when_else": {
    "style": "dataflow",
    "label": "When / Else",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mux16x1 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    sel: in unsigned(3 downto 0);\n    y: out std_logic\n  );\nend mux16x1;\narchitecture dataflow of mux16x1 is\nbegin\n  y <= d(0) when sel=to_unsigned(0,4) else\n       d(1) when sel=to_unsigned(1,4) else\n       d(2) when sel=to_unsigned(2,4) else\n       d(3) when sel=to_unsigned(3,4) else\n       d(4) when sel=to_unsigned(4,4) else\n       d(5) when sel=to_unsigned(5,4) else\n       d(6) when sel=to_unsigned(6,4) else\n       d(7) when sel=to_unsigned(7,4) else\n       d(8) when sel=to_unsigned(8,4) else\n       d(9) when sel=to_unsigned(9,4) else\n       d(10) when sel=to_unsigned(10,4) else\n       d(11) when sel=to_unsigned(11,4) else\n       d(12) when sel=to_unsigned(12,4) else\n       d(13) when sel=to_unsigned(13,4) else\n       d(14) when sel=to_unsigned(14,4) else d(15);\nend dataflow;\n"
   }
  }
 },
 "mux16x4": {
  "label": "16:4 MUX (16 inputs × 4 bits)",
  "group": "Combinational",
  "design": "mux16x4",
  "top": "tb_mux16x4",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_mux16x4 is end;\narchitecture test of tb_mux16x4 is\n  signal d:std_logic_vector(63 downto 0):=x\"0123456789ABCDEF\";\n  signal sel:unsigned(3 downto 0):=(others=>'0');\n  signal y:std_logic_vector(3 downto 0);\nbegin\n  dut: entity work.mux16x4 port map(d,sel,y);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      sel<=to_unsigned(i,4); wait for 5 ns;\n      assert y=d(4*i+3 downto 4*i) report \"MUX16x4 mismatch\" severity error;\n    end loop;\n    report \"mux16x4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "case": {
    "style": "behavioral",
    "label": "Case",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mux16x4 is\n  port (\n    d: in std_logic_vector(63 downto 0);\n    sel: in unsigned(3 downto 0);\n    y: out std_logic_vector(3 downto 0)\n  );\nend mux16x4;\narchitecture behavioral of mux16x4 is\nbegin\n  process(all) begin\n    case to_integer(sel) is\n      when 0 => y <= d(3 downto 0);\n      when 1 => y <= d(7 downto 4);\n      when 2 => y <= d(11 downto 8);\n      when 3 => y <= d(15 downto 12);\n      when 4 => y <= d(19 downto 16);\n      when 5 => y <= d(23 downto 20);\n      when 6 => y <= d(27 downto 24);\n      when 7 => y <= d(31 downto 28);\n      when 8 => y <= d(35 downto 32);\n      when 9 => y <= d(39 downto 36);\n      when 10 => y <= d(43 downto 40);\n      when 11 => y <= d(47 downto 44);\n      when 12 => y <= d(51 downto 48);\n      when 13 => y <= d(55 downto 52);\n      when 14 => y <= d(59 downto 56);\n      when 15 => y <= d(63 downto 60);\n      when others => y <= (others=>'0');\n    end case;\n  end process;\nend behavioral;\n"
   },
   "if_else": {
    "style": "behavioral",
    "label": "If / Else",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mux16x4 is\n  port (\n    d: in std_logic_vector(63 downto 0);\n    sel: in unsigned(3 downto 0);\n    y: out std_logic_vector(3 downto 0)\n  );\nend mux16x4;\narchitecture behavioral of mux16x4 is\nbegin\n  process(all) begin\n    if sel=to_unsigned(0,4) then y <= d(3 downto 0);\n    elsif sel=to_unsigned(1,4) then y <= d(7 downto 4);\n    elsif sel=to_unsigned(2,4) then y <= d(11 downto 8);\n    elsif sel=to_unsigned(3,4) then y <= d(15 downto 12);\n    elsif sel=to_unsigned(4,4) then y <= d(19 downto 16);\n    elsif sel=to_unsigned(5,4) then y <= d(23 downto 20);\n    elsif sel=to_unsigned(6,4) then y <= d(27 downto 24);\n    elsif sel=to_unsigned(7,4) then y <= d(31 downto 28);\n    elsif sel=to_unsigned(8,4) then y <= d(35 downto 32);\n    elsif sel=to_unsigned(9,4) then y <= d(39 downto 36);\n    elsif sel=to_unsigned(10,4) then y <= d(43 downto 40);\n    elsif sel=to_unsigned(11,4) then y <= d(47 downto 44);\n    elsif sel=to_unsigned(12,4) then y <= d(51 downto 48);\n    elsif sel=to_unsigned(13,4) then y <= d(55 downto 52);\n    elsif sel=to_unsigned(14,4) then y <= d(59 downto 56);\n    elsif sel=to_unsigned(15,4) then y <= d(63 downto 60);\n    else y <= (others=>'0'); end if;\n  end process;\nend behavioral;\n"
   },
   "when_else": {
    "style": "dataflow",
    "label": "When / Else",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity mux16x4 is\n  port (\n    d: in std_logic_vector(63 downto 0);\n    sel: in unsigned(3 downto 0);\n    y: out std_logic_vector(3 downto 0)\n  );\nend mux16x4;\narchitecture dataflow of mux16x4 is\nbegin\n  y <= d(3 downto 0) when sel=to_unsigned(0,4) else\n       d(7 downto 4) when sel=to_unsigned(1,4) else\n       d(11 downto 8) when sel=to_unsigned(2,4) else\n       d(15 downto 12) when sel=to_unsigned(3,4) else\n       d(19 downto 16) when sel=to_unsigned(4,4) else\n       d(23 downto 20) when sel=to_unsigned(5,4) else\n       d(27 downto 24) when sel=to_unsigned(6,4) else\n       d(31 downto 28) when sel=to_unsigned(7,4) else\n       d(35 downto 32) when sel=to_unsigned(8,4) else\n       d(39 downto 36) when sel=to_unsigned(9,4) else\n       d(43 downto 40) when sel=to_unsigned(10,4) else\n       d(47 downto 44) when sel=to_unsigned(11,4) else\n       d(51 downto 48) when sel=to_unsigned(12,4) else\n       d(55 downto 52) when sel=to_unsigned(13,4) else\n       d(59 downto 56) when sel=to_unsigned(14,4) else d(63 downto 60);\nend dataflow;\n"
   }
  }
 },
 "demux1x8": {
  "label": "1:8 DEMUX",
  "group": "Combinational",
  "design": "demux1x8",
  "top": "tb_demux1x8",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_demux1x8 is end;\narchitecture test of tb_demux1x8 is\n  signal d:std_logic:='0';\n  signal sel:unsigned(2 downto 0):=(others=>'0');\n  signal y:std_logic_vector(7 downto 0);\nbegin\n  dut: entity work.demux1x8 port map(d,sel,y);\n  stimulus: process\n  begin\n    d<='1';\n    for i in 0 to 7 loop\n      sel<=to_unsigned(i,3); wait for 8 ns;\n      assert y=std_logic_vector(shift_left(to_unsigned(1,8),i)) report \"DEMUX output mismatch\" severity error;\n    end loop;\n    d<='0'; wait for 5 ns;\n    assert y=x\"00\" report \"DEMUX inactive mismatch\" severity error;\n    report \"demux1x8 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "case": {
    "style": "behavioral",
    "label": "Case",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity demux1x8 is\n  port (\n    d: in std_logic;\n    sel: in unsigned(2 downto 0);\n    y: out std_logic_vector(7 downto 0)\n  );\nend demux1x8;\narchitecture behavioral of demux1x8 is\nbegin\n  process(all) begin\n    y <= (others=>'0');\n    case to_integer(sel) is\n      when 0 => y(0) <= d;\n      when 1 => y(1) <= d;\n      when 2 => y(2) <= d;\n      when 3 => y(3) <= d;\n      when 4 => y(4) <= d;\n      when 5 => y(5) <= d;\n      when 6 => y(6) <= d;\n      when 7 => y(7) <= d;\n      when others => null;\n    end case;\n  end process;\nend behavioral;\n"
   },
   "else_if": {
    "style": "behavioral",
    "label": "Else / If",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity demux1x8 is\n  port (\n    d: in std_logic;\n    sel: in unsigned(2 downto 0);\n    y: out std_logic_vector(7 downto 0)\n  );\nend demux1x8;\narchitecture behavioral of demux1x8 is\nbegin\n  process(all) begin\n    y<=(others=>'0');\n    if sel=to_unsigned(0,3) then y(0)<=d;\n    elsif sel=to_unsigned(1,3) then y(1)<=d;\n    elsif sel=to_unsigned(2,3) then y(2)<=d;\n    elsif sel=to_unsigned(3,3) then y(3)<=d;\n    elsif sel=to_unsigned(4,3) then y(4)<=d;\n    elsif sel=to_unsigned(5,3) then y(5)<=d;\n    elsif sel=to_unsigned(6,3) then y(6)<=d;\n    elsif sel=to_unsigned(7,3) then y(7)<=d;\n    end if;\n  end process;\nend behavioral;\n"
   }
  }
 },
 "decoder3x8": {
  "label": "3:8 Decoder",
  "group": "Combinational",
  "design": "decoder3x8",
  "top": "tb_decoder3x8",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_decoder3x8 is end;\narchitecture test of tb_decoder3x8 is\n  signal a:unsigned(2 downto 0):=(others=>'0');\n  signal en:std_logic:='0';\n  signal y:std_logic_vector(7 downto 0);\nbegin\n  dut: entity work.decoder3x8 port map(a,en,y);\n  stimulus: process\n  begin\n    en<='1';\n    for i in 0 to 7 loop\n      a<=to_unsigned(i,3); wait for 8 ns;\n      assert y=std_logic_vector(shift_left(to_unsigned(1,8),i)) report \"Decoder mismatch\" severity error;\n    end loop;\n    en<='0'; wait for 5 ns;\n    assert y=x\"00\" report \"Decoder enable mismatch\" severity error;\n    report \"decoder3x8 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "case_if": {
    "style": "behavioral",
    "label": "Case / If",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder3x8 is\n  port (\n    a: in unsigned(2 downto 0);\n    en: in std_logic;\n    y: out std_logic_vector(7 downto 0)\n  );\nend decoder3x8;\narchitecture behavioral of decoder3x8 is\nbegin\n  process(all) begin\n    y<=(others=>'0');\n    if en='1' then\n      case to_integer(a) is\n        when 0 => y(0)<='1';\n        when 1 => y(1)<='1';\n        when 2 => y(2)<='1';\n        when 3 => y(3)<='1';\n        when 4 => y(4)<='1';\n        when 5 => y(5)<='1';\n        when 6 => y(6)<='1';\n        when 7 => y(7)<='1';\n        when others => null;\n      end case;\n    end if;\n  end process;\nend behavioral;\n"
   },
   "case_signal": {
    "style": "behavioral",
    "label": "Case / Signal",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder3x8 is\n  port (\n    a: in unsigned(2 downto 0);\n    en: in std_logic;\n    y: out std_logic_vector(7 downto 0)\n  );\nend decoder3x8;\narchitecture behavioral of decoder3x8 is\n  signal decoded:std_logic_vector(7 downto 0);\nbegin\n  process(all) begin\n    decoded<=(others=>'0');\n    if en='1' then\n      case to_integer(a) is\n        when 0 => decoded(0)<='1';\n        when 1 => decoded(1)<='1';\n        when 2 => decoded(2)<='1';\n        when 3 => decoded(3)<='1';\n        when 4 => decoded(4)<='1';\n        when 5 => decoded(5)<='1';\n        when 6 => decoded(6)<='1';\n        when 7 => decoded(7)<='1';\n        when others => null;\n      end case;\n    end if;\n  end process;\n  y<=decoded;\nend behavioral;\n"
   },
   "else_if": {
    "style": "behavioral",
    "label": "Else / If",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder3x8 is\n  port (\n    a: in unsigned(2 downto 0);\n    en: in std_logic;\n    y: out std_logic_vector(7 downto 0)\n  );\nend decoder3x8;\narchitecture behavioral of decoder3x8 is\nbegin\n  process(all) begin\n    y<=(others=>'0');\n    if en='1' then\n      if a=to_unsigned(0,3) then y(0)<='1';\n      elsif a=to_unsigned(1,3) then y(1)<='1';\n      elsif a=to_unsigned(2,3) then y(2)<='1';\n      elsif a=to_unsigned(3,3) then y(3)<='1';\n      elsif a=to_unsigned(4,3) then y(4)<='1';\n      elsif a=to_unsigned(5,3) then y(5)<='1';\n      elsif a=to_unsigned(6,3) then y(6)<='1';\n      elsif a=to_unsigned(7,3) then y(7)<='1';\n      end if;\n    end if;\n  end process;\nend behavioral;\n"
   },
   "else_if_signal": {
    "style": "behavioral",
    "label": "Else / If / Signal",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder3x8 is\n  port (\n    a: in unsigned(2 downto 0);\n    en: in std_logic;\n    y: out std_logic_vector(7 downto 0)\n  );\nend decoder3x8;\narchitecture behavioral of decoder3x8 is\n  signal decoded:std_logic_vector(7 downto 0);\nbegin\n  process(all) begin\n    decoded<=(others=>'0');\n    if en='1' then\n      if a=to_unsigned(0,3) then decoded(0)<='1';\n      elsif a=to_unsigned(1,3) then decoded(1)<='1';\n      elsif a=to_unsigned(2,3) then decoded(2)<='1';\n      elsif a=to_unsigned(3,3) then decoded(3)<='1';\n      elsif a=to_unsigned(4,3) then decoded(4)<='1';\n      elsif a=to_unsigned(5,3) then decoded(5)<='1';\n      elsif a=to_unsigned(6,3) then decoded(6)<='1';\n      elsif a=to_unsigned(7,3) then decoded(7)<='1';\n      end if;\n    end if;\n  end process;\n  y<=decoded;\nend behavioral;\n"
   },
   "when_else_signal": {
    "style": "dataflow",
    "label": "When / Else / Signal",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity decoder3x8 is\n  port (\n    a: in unsigned(2 downto 0);\n    en: in std_logic;\n    y: out std_logic_vector(7 downto 0)\n  );\nend decoder3x8;\narchitecture dataflow of decoder3x8 is\n  signal decoded:std_logic_vector(7 downto 0);\nbegin\n  decoded <= \"00000001\" when en='1' and a=to_unsigned(0,3) else\n             \"00000010\" when en='1' and a=to_unsigned(1,3) else\n             \"00000100\" when en='1' and a=to_unsigned(2,3) else\n             \"00001000\" when en='1' and a=to_unsigned(3,3) else\n             \"00010000\" when en='1' and a=to_unsigned(4,3) else\n             \"00100000\" when en='1' and a=to_unsigned(5,3) else\n             \"01000000\" when en='1' and a=to_unsigned(6,3) else\n             \"10000000\" when en='1' and a=to_unsigned(7,3) else x\"00\";\n  y<=decoded;\nend dataflow;\n"
   }
  }
 },
 "encoder16x4": {
  "label": "16:4 One-Hot Encoder",
  "group": "Combinational",
  "design": "encoder16x4",
  "top": "tb_encoder16x4",
  "description": "Input must be one-hot; valid=0 for zero or multi-hot inputs.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_encoder16x4 is end;\narchitecture test of tb_encoder16x4 is\n  signal d:std_logic_vector(15 downto 0):=(others=>'0');\n  signal code:unsigned(3 downto 0);\n  signal valid:std_logic;\nbegin\n  dut: entity work.encoder16x4 port map(d,code,valid);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      d<=std_logic_vector(shift_left(to_unsigned(1,16),i)); wait for 6 ns;\n      assert valid='1' and code=to_unsigned(i,4) report \"Encoder mismatch\" severity error;\n    end loop;\n    d<=(others=>'0'); wait for 5 ns;\n    assert valid='0' report \"Encoder invalid input mismatch\" severity error;\n    report \"encoder16x4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "case_if": {
    "style": "behavioral",
    "label": "Case / If",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity encoder16x4 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    code: out unsigned(3 downto 0);\n    valid: out std_logic\n  );\nend encoder16x4;\narchitecture behavioral of encoder16x4 is\nbegin\n  process(all) begin\n    code<=(others=>'0'); valid<='1';\n    case d is\n      when \"0000000000000001\" => code<=to_unsigned(0,4);\n      when \"0000000000000010\" => code<=to_unsigned(1,4);\n      when \"0000000000000100\" => code<=to_unsigned(2,4);\n      when \"0000000000001000\" => code<=to_unsigned(3,4);\n      when \"0000000000010000\" => code<=to_unsigned(4,4);\n      when \"0000000000100000\" => code<=to_unsigned(5,4);\n      when \"0000000001000000\" => code<=to_unsigned(6,4);\n      when \"0000000010000000\" => code<=to_unsigned(7,4);\n      when \"0000000100000000\" => code<=to_unsigned(8,4);\n      when \"0000001000000000\" => code<=to_unsigned(9,4);\n      when \"0000010000000000\" => code<=to_unsigned(10,4);\n      when \"0000100000000000\" => code<=to_unsigned(11,4);\n      when \"0001000000000000\" => code<=to_unsigned(12,4);\n      when \"0010000000000000\" => code<=to_unsigned(13,4);\n      when \"0100000000000000\" => code<=to_unsigned(14,4);\n      when \"1000000000000000\" => code<=to_unsigned(15,4);\n      when others => valid<='0';\n    end case;\n  end process;\nend behavioral;\n"
   },
   "case_signal": {
    "style": "behavioral",
    "label": "Case / Signal",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity encoder16x4 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    code: out unsigned(3 downto 0);\n    valid: out std_logic\n  );\nend encoder16x4;\narchitecture behavioral of encoder16x4 is\n  signal enc:unsigned(3 downto 0);\nbegin\n  process(all) begin\n    enc<=(others=>'0'); valid<='1';\n    case d is\n      when \"0000000000000001\" => enc<=to_unsigned(0,4);\n      when \"0000000000000010\" => enc<=to_unsigned(1,4);\n      when \"0000000000000100\" => enc<=to_unsigned(2,4);\n      when \"0000000000001000\" => enc<=to_unsigned(3,4);\n      when \"0000000000010000\" => enc<=to_unsigned(4,4);\n      when \"0000000000100000\" => enc<=to_unsigned(5,4);\n      when \"0000000001000000\" => enc<=to_unsigned(6,4);\n      when \"0000000010000000\" => enc<=to_unsigned(7,4);\n      when \"0000000100000000\" => enc<=to_unsigned(8,4);\n      when \"0000001000000000\" => enc<=to_unsigned(9,4);\n      when \"0000010000000000\" => enc<=to_unsigned(10,4);\n      when \"0000100000000000\" => enc<=to_unsigned(11,4);\n      when \"0001000000000000\" => enc<=to_unsigned(12,4);\n      when \"0010000000000000\" => enc<=to_unsigned(13,4);\n      when \"0100000000000000\" => enc<=to_unsigned(14,4);\n      when \"1000000000000000\" => enc<=to_unsigned(15,4);\n      when others => valid<='0';\n    end case;\n  end process;\n  code<=enc;\nend behavioral;\n"
   },
   "else_if": {
    "style": "behavioral",
    "label": "Else / If",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity encoder16x4 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    code: out unsigned(3 downto 0);\n    valid: out std_logic\n  );\nend encoder16x4;\narchitecture behavioral of encoder16x4 is\nbegin\n  process(all) begin\n    code<=(others=>'0'); valid<='1';\n    if d=\"0000000000000001\" then code<=to_unsigned(0,4);\n    elsif d=\"0000000000000010\" then code<=to_unsigned(1,4);\n    elsif d=\"0000000000000100\" then code<=to_unsigned(2,4);\n    elsif d=\"0000000000001000\" then code<=to_unsigned(3,4);\n    elsif d=\"0000000000010000\" then code<=to_unsigned(4,4);\n    elsif d=\"0000000000100000\" then code<=to_unsigned(5,4);\n    elsif d=\"0000000001000000\" then code<=to_unsigned(6,4);\n    elsif d=\"0000000010000000\" then code<=to_unsigned(7,4);\n    elsif d=\"0000000100000000\" then code<=to_unsigned(8,4);\n    elsif d=\"0000001000000000\" then code<=to_unsigned(9,4);\n    elsif d=\"0000010000000000\" then code<=to_unsigned(10,4);\n    elsif d=\"0000100000000000\" then code<=to_unsigned(11,4);\n    elsif d=\"0001000000000000\" then code<=to_unsigned(12,4);\n    elsif d=\"0010000000000000\" then code<=to_unsigned(13,4);\n    elsif d=\"0100000000000000\" then code<=to_unsigned(14,4);\n    elsif d=\"1000000000000000\" then code<=to_unsigned(15,4);\n    else valid<='0'; end if;\n  end process;\nend behavioral;\n"
   },
   "else_if_signal": {
    "style": "behavioral",
    "label": "Else / If / Signal",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity encoder16x4 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    code: out unsigned(3 downto 0);\n    valid: out std_logic\n  );\nend encoder16x4;\narchitecture behavioral of encoder16x4 is\n  signal enc:unsigned(3 downto 0);\nbegin\n  process(all) begin\n    enc<=(others=>'0'); valid<='1';\n    if d=\"0000000000000001\" then enc<=to_unsigned(0,4);\n    elsif d=\"0000000000000010\" then enc<=to_unsigned(1,4);\n    elsif d=\"0000000000000100\" then enc<=to_unsigned(2,4);\n    elsif d=\"0000000000001000\" then enc<=to_unsigned(3,4);\n    elsif d=\"0000000000010000\" then enc<=to_unsigned(4,4);\n    elsif d=\"0000000000100000\" then enc<=to_unsigned(5,4);\n    elsif d=\"0000000001000000\" then enc<=to_unsigned(6,4);\n    elsif d=\"0000000010000000\" then enc<=to_unsigned(7,4);\n    elsif d=\"0000000100000000\" then enc<=to_unsigned(8,4);\n    elsif d=\"0000001000000000\" then enc<=to_unsigned(9,4);\n    elsif d=\"0000010000000000\" then enc<=to_unsigned(10,4);\n    elsif d=\"0000100000000000\" then enc<=to_unsigned(11,4);\n    elsif d=\"0001000000000000\" then enc<=to_unsigned(12,4);\n    elsif d=\"0010000000000000\" then enc<=to_unsigned(13,4);\n    elsif d=\"0100000000000000\" then enc<=to_unsigned(14,4);\n    elsif d=\"1000000000000000\" then enc<=to_unsigned(15,4);\n    else valid<='0'; end if;\n  end process;\n  code<=enc;\nend behavioral;\n"
   },
   "when_else_signal": {
    "style": "dataflow",
    "label": "When / Else / Signal",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity encoder16x4 is\n  port (\n    d: in std_logic_vector(15 downto 0);\n    code: out unsigned(3 downto 0);\n    valid: out std_logic\n  );\nend encoder16x4;\narchitecture dataflow of encoder16x4 is\n  signal enc:unsigned(3 downto 0);\nbegin\n  enc <= to_unsigned(0,4) when d=\"0000000000000001\" else\n        to_unsigned(1,4) when d=\"0000000000000010\" else\n        to_unsigned(2,4) when d=\"0000000000000100\" else\n        to_unsigned(3,4) when d=\"0000000000001000\" else\n        to_unsigned(4,4) when d=\"0000000000010000\" else\n        to_unsigned(5,4) when d=\"0000000000100000\" else\n        to_unsigned(6,4) when d=\"0000000001000000\" else\n        to_unsigned(7,4) when d=\"0000000010000000\" else\n        to_unsigned(8,4) when d=\"0000000100000000\" else\n        to_unsigned(9,4) when d=\"0000001000000000\" else\n        to_unsigned(10,4) when d=\"0000010000000000\" else\n        to_unsigned(11,4) when d=\"0000100000000000\" else\n        to_unsigned(12,4) when d=\"0001000000000000\" else\n        to_unsigned(13,4) when d=\"0010000000000000\" else\n        to_unsigned(14,4) when d=\"0100000000000000\" else\n        to_unsigned(15,4) when d=\"1000000000000000\" else to_unsigned(0,4);\n  code<=enc;\n  valid<= '1' when d=\"0000000000000001\" else\n          '1' when d=\"0000000000000010\" else\n          '1' when d=\"0000000000000100\" else\n          '1' when d=\"0000000000001000\" else\n          '1' when d=\"0000000000010000\" else\n          '1' when d=\"0000000000100000\" else\n          '1' when d=\"0000000001000000\" else\n          '1' when d=\"0000000010000000\" else\n          '1' when d=\"0000000100000000\" else\n          '1' when d=\"0000001000000000\" else\n          '1' when d=\"0000010000000000\" else\n          '1' when d=\"0000100000000000\" else\n          '1' when d=\"0001000000000000\" else\n          '1' when d=\"0010000000000000\" else\n          '1' when d=\"0100000000000000\" else\n          '1' when d=\"1000000000000000\" else '0';\nend dataflow;\n"
   }
  }
 },
 "even_parity4": {
  "label": "4-bit Even Parity Generator",
  "group": "Combinational",
  "design": "even_parity4",
  "top": "tb_even_parity4",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_even_parity4 is end;\narchitecture test of tb_even_parity4 is\n  signal d:std_logic_vector(3 downto 0):=(others=>'0');\n  signal parity:std_logic;\nbegin\n  dut: entity work.even_parity4 port map(d,parity);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      d<=std_logic_vector(to_unsigned(i,4)); wait for 5 ns;\n      assert parity=(d(3) xor d(2) xor d(1) xor d(0)) report \"Even parity mismatch\" severity error;\n    end loop;\n    report \"even_parity4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "dataflow": {
    "style": "dataflow",
    "label": "Dataflow",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity even_parity4 is\n  port (\n    d: in std_logic_vector(3 downto 0);\n    parity: out std_logic\n  );\nend even_parity4;\narchitecture dataflow of even_parity4 is\nbegin\n  parity <= d(3) xor d(2) xor d(1) xor d(0);\nend dataflow;\n"
   },
   "for_loop_elseif": {
    "style": "behavioral",
    "label": "For / Loop / Elseif",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity even_parity4 is\n  port (\n    d: in std_logic_vector(3 downto 0);\n    parity: out std_logic\n  );\nend even_parity4;\narchitecture behavioral of even_parity4 is\nbegin\n  process(all)\n    variable p:std_logic;\n  begin\n    p:='0';\n    for i in d'range loop\n      if d(i)='1' then p:=not p;\n      elsif d(i)='0' then null;\n      else p:='X'; end if;\n    end loop;\n    parity<=p;\n  end process;\nend behavioral;\n"
   }
  }
 },
 "odd_parity_checker": {
  "label": "Odd-Parity Checker",
  "group": "Combinational",
  "design": "odd_parity_checker",
  "top": "tb_odd_parity_checker",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_odd_parity_checker is end;\narchitecture test of tb_odd_parity_checker is\n  signal d:std_logic_vector(3 downto 0):=(others=>'0');\n  signal parity_bit:std_logic:='0';\n  signal error:std_logic;\nbegin\n  dut: entity work.odd_parity_checker port map(d,parity_bit,error);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      d<=std_logic_vector(to_unsigned(i,4));\n      parity_bit<=not (d(3) xor d(2) xor d(1) xor d(0));\n      wait for 5 ns;\n      -- Parity bit is recomputed after d has settled below.\n      parity_bit<=not (d(3) xor d(2) xor d(1) xor d(0)); wait for 2 ns;\n      assert error='0' report \"Odd parity expected valid\" severity error;\n      parity_bit<=not parity_bit; wait for 2 ns;\n      assert error='1' report \"Odd parity error not detected\" severity error;\n    end loop;\n    report \"odd_parity_checker tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "dataflow": {
    "style": "dataflow",
    "label": "Dataflow",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity odd_parity_checker is\n  port (\n    d: in std_logic_vector(3 downto 0);\n    parity_bit: in std_logic;\n    error: out std_logic\n  );\nend odd_parity_checker;\narchitecture dataflow of odd_parity_checker is\nbegin\n  error <= not (d(3) xor d(2) xor d(1) xor d(0) xor parity_bit);\nend dataflow;\n"
   },
   "for_loop": {
    "style": "behavioral",
    "label": "For / Loop",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity odd_parity_checker is\n  port (\n    d: in std_logic_vector(3 downto 0);\n    parity_bit: in std_logic;\n    error: out std_logic\n  );\nend odd_parity_checker;\narchitecture behavioral of odd_parity_checker is\nbegin\n  process(all)\n    variable p:std_logic;\n  begin\n    p:=parity_bit;\n    for i in d'range loop p:=p xor d(i); end loop;\n    error<=not p;\n  end process;\nend behavioral;\n"
   }
  }
 },
 "d_latch": {
  "label": "D Latch",
  "group": "Sequential",
  "design": "d_latch",
  "top": "tb_d_latch",
  "description": "Level-sensitive latch with asynchronous reset.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_d_latch is end;\narchitecture test of tb_d_latch is\n  signal en:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal d:std_logic:='0';\n\nbegin\n  dut: entity work.d_latch port map(en,rst,d,q);\n  stimulus: process\n  begin\n    wait for 4 ns; rst<='0'; wait for 3 ns;\n    d<='1'; en<='1'; wait for 5 ns; assert q='1' report \"D latch transparent\" severity error;\n    en<='0'; d<='0'; wait for 5 ns; assert q='1' report \"D latch hold\" severity error;\n    en<='1'; wait for 5 ns; assert q='0' report \"D latch changed\" severity error;\n    report \"d_latch tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity d_latch is\n  port (\n    en: in std_logic;\n    rst: in std_logic;\n    d: in std_logic;\n    q: out std_logic\n  );\nend d_latch;\narchitecture behavioral of d_latch is\n  signal qi:std_logic:='0';\nbegin\n  process(all) begin\n    if rst='1' then qi<='0';\n    else\n    if en='1' then qi<=d; end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "jk_latch": {
  "label": "JK Latch",
  "group": "Sequential",
  "design": "jk_latch",
  "top": "tb_jk_latch",
  "description": "Transparent while enable=1; T/JK toggling is not physically stable as a level-sensitive feedback latch.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_jk_latch is end;\narchitecture test of tb_jk_latch is\n  signal en:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal j,k:std_logic:='0';\n\nbegin\n  dut: entity work.jk_latch port map(en,rst,j,k,q);\n  stimulus: process\n  begin\n    wait for 4 ns; rst<='0'; wait for 3 ns;\n    j<='1'; k<='0'; en<='1'; wait for 5 ns; assert q='1' report \"JK set\" severity error;\n    en<='0'; j<='0'; k<='1'; wait for 5 ns; assert q='1' report \"JK hold\" severity error;\n    en<='1'; wait for 5 ns; assert q='0' report \"JK reset\" severity error;\n    report \"jk_latch tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity jk_latch is\n  port (\n    en: in std_logic;\n    rst: in std_logic;\n    j,k: in std_logic;\n    q: out std_logic\n  );\nend jk_latch;\narchitecture behavioral of jk_latch is\n  signal qi:std_logic:='0';\nbegin\n  process(all) begin\n    if rst='1' then qi<='0';\n    else\n    if en='1' then\n      if j='0' and k='1' then qi<='0';\n      elsif j='1' and k='0' then qi<='1';\n      elsif j='1' and k='1' then qi<=not qi; end if;\n    end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "sr_latch": {
  "label": "SR Latch",
  "group": "Sequential",
  "design": "sr_latch",
  "top": "tb_sr_latch",
  "description": "Level-sensitive latch with asynchronous reset.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_sr_latch is end;\narchitecture test of tb_sr_latch is\n  signal en:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal s,r:std_logic:='0';\n\nbegin\n  dut: entity work.sr_latch port map(en,rst,s,r,q);\n  stimulus: process\n  begin\n    wait for 4 ns; rst<='0'; wait for 3 ns;\n    s<='1'; en<='1'; wait for 5 ns; assert q='1' report \"SR set\" severity error;\n    en<='0'; s<='0'; r<='1'; wait for 5 ns; assert q='1' report \"SR hold\" severity error;\n    en<='1'; wait for 5 ns; assert q='0' report \"SR reset\" severity error;\n    report \"sr_latch tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity sr_latch is\n  port (\n    en: in std_logic;\n    rst: in std_logic;\n    s,r: in std_logic;\n    q: out std_logic\n  );\nend sr_latch;\narchitecture behavioral of sr_latch is\n  signal qi:std_logic:='0';\nbegin\n  process(all) begin\n    if rst='1' then qi<='0';\n    else\n    if en='1' then\n      if s='1' and r='0' then qi<='1';\n      elsif s='0' and r='1' then qi<='0'; end if;\n    end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "t_latch": {
  "label": "T Latch",
  "group": "Sequential",
  "design": "t_latch",
  "top": "tb_t_latch",
  "description": "Transparent while enable=1; T/JK toggling is not physically stable as a level-sensitive feedback latch.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_t_latch is end;\narchitecture test of tb_t_latch is\n  signal en:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal t:std_logic:='0';\n\nbegin\n  dut: entity work.t_latch port map(en,rst,t,q);\n  stimulus: process\n  begin\n    wait for 4 ns; rst<='0'; wait for 3 ns;\n    en<='0'; t<='1'; wait for 5 ns; assert q='0' report \"T latch hold\" severity error;\n    en<='1'; t<='0'; wait for 5 ns; assert q='0' report \"T latch inactive\" severity error;\n    report \"t_latch tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity t_latch is\n  port (\n    en: in std_logic;\n    rst: in std_logic;\n    t: in std_logic;\n    q: out std_logic\n  );\nend t_latch;\narchitecture behavioral of t_latch is\n  signal qi:std_logic:='0';\nbegin\n  process(all) begin\n    if rst='1' then qi<='0';\n    else\n    if en='1' and t='1' then qi<=not qi; end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "d_ff": {
  "label": "D Flip-Flop",
  "group": "Sequential",
  "design": "d_ff",
  "top": "tb_d_ff",
  "description": "Positive-edge triggered with asynchronous reset.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_d_ff is end;\narchitecture test of tb_d_ff is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal d:std_logic:='0';\n\nbegin\n  dut: entity work.d_ff port map(clk,rst,d,q);\n  stimulus: process\n  begin\n    wait for 3 ns; rst<='0'; wait for 2 ns;\n    d<='1'; wait for 2 ns; assert q='0' report \"D FF edge only\" severity error;\n    clk<='1'; wait for 2 ns; assert q='1' report \"D FF capture\" severity error;\n    clk<='0'; d<='0'; wait for 2 ns; assert q='1' report \"D FF holds\" severity error;\n    clk<='1'; wait for 2 ns; assert q='0' report \"D FF second capture\" severity error;\n    report \"d_ff tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity d_ff is\n  port (\n    clk,rst: in std_logic;\n    d: in std_logic;\n    q: out std_logic\n  );\nend d_ff;\narchitecture behavioral of d_ff is\n  signal qi:std_logic:='0';\nbegin\n  process(clk,rst) begin\n    if rst='1' then qi<='0';\n    elsif rising_edge(clk) then\n      qi<=d;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "jk_ff": {
  "label": "JK Flip-Flop",
  "group": "Sequential",
  "design": "jk_ff",
  "top": "tb_jk_ff",
  "description": "Positive-edge triggered with asynchronous reset.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_jk_ff is end;\narchitecture test of tb_jk_ff is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal j,k:std_logic:='0';\n\nbegin\n  dut: entity work.jk_ff port map(clk,rst,j,k,q);\n  stimulus: process\n  begin\n    wait for 3 ns; rst<='0'; wait for 2 ns;\n    j<='1';k<='0';wait for 2 ns;clk<='1';wait for 2 ns;assert q='1' report \"JK set\" severity error;\n    clk<='0';j<='1';k<='1';wait for 2 ns;clk<='1';wait for 2 ns;assert q='0' report \"JK toggle\" severity error;\n    clk<='0';j<='0';k<='1';wait for 2 ns;clk<='1';wait for 2 ns;assert q='0' report \"JK reset\" severity error;\n    report \"jk_ff tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity jk_ff is\n  port (\n    clk,rst: in std_logic;\n    j,k: in std_logic;\n    q: out std_logic\n  );\nend jk_ff;\narchitecture behavioral of jk_ff is\n  signal qi:std_logic:='0';\nbegin\n  process(clk,rst) begin\n    if rst='1' then qi<='0';\n    elsif rising_edge(clk) then\n      if j='0' and k='1' then qi<='0';\n      elsif j='1' and k='0' then qi<='1';\n      elsif j='1' and k='1' then qi<=not qi; end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "sr_ff": {
  "label": "SR Flip-Flop",
  "group": "Sequential",
  "design": "sr_ff",
  "top": "tb_sr_ff",
  "description": "Positive-edge triggered with asynchronous reset.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_sr_ff is end;\narchitecture test of tb_sr_ff is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal s,r:std_logic:='0';\n\nbegin\n  dut: entity work.sr_ff port map(clk,rst,s,r,q);\n  stimulus: process\n  begin\n    wait for 3 ns; rst<='0'; wait for 2 ns;\n    s<='1';wait for 2 ns;clk<='1';wait for 2 ns;assert q='1' report \"SR set\" severity error;\n    clk<='0';s<='0';r<='1';wait for 2 ns;clk<='1';wait for 2 ns;assert q='0' report \"SR reset\" severity error;\n    report \"sr_ff tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity sr_ff is\n  port (\n    clk,rst: in std_logic;\n    s,r: in std_logic;\n    q: out std_logic\n  );\nend sr_ff;\narchitecture behavioral of sr_ff is\n  signal qi:std_logic:='0';\nbegin\n  process(clk,rst) begin\n    if rst='1' then qi<='0';\n    elsif rising_edge(clk) then\n      if s='1' and r='0' then qi<='1';\n      elsif s='0' and r='1' then qi<='0'; end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "t_ff": {
  "label": "T Flip-Flop",
  "group": "Sequential",
  "design": "t_ff",
  "top": "tb_t_ff",
  "description": "Positive-edge triggered with asynchronous reset.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_t_ff is end;\narchitecture test of tb_t_ff is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal q:std_logic;\n  signal t:std_logic:='0';\n\nbegin\n  dut: entity work.t_ff port map(clk,rst,t,q);\n  stimulus: process\n  begin\n    wait for 3 ns; rst<='0'; wait for 2 ns;\n    t<='1'; wait for 2 ns;clk<='1';wait for 2 ns;assert q='1' report \"T toggle 1\" severity error;\n    clk<='0';wait for 2 ns;clk<='1';wait for 2 ns;assert q='0' report \"T toggle 2\" severity error;\n    clk<='0';t<='0';wait for 2 ns;clk<='1';wait for 2 ns;assert q='0' report \"T hold\" severity error;\n    report \"t_ff tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity t_ff is\n  port (\n    clk,rst: in std_logic;\n    t: in std_logic;\n    q: out std_logic\n  );\nend t_ff;\narchitecture behavioral of t_ff is\n  signal qi:std_logic:='0';\nbegin\n  process(clk,rst) begin\n    if rst='1' then qi<='0';\n    elsif rising_edge(clk) then\n      if t='1' then qi<=not qi; end if;\n    end if;\n  end process;\n  q<=qi;\nend behavioral;\n"
   }
  }
 },
 "jk_master_slave": {
  "label": "JK Master-Slave",
  "group": "Sequential",
  "design": "jk_master_slave",
  "top": "tb_jk_master_slave",
  "description": "Two transparent stages using opposite clock levels.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_jk_master_slave is end;\narchitecture test of tb_jk_master_slave is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal j,k:std_logic:='0';\n  signal q:std_logic;\nbegin\n  dut: entity work.jk_master_slave port map(clk,rst,j,k,q);\n  stimulus: process\n  begin\n    wait for 3 ns; rst<='0'; wait for 3 ns;\n    j<='1'; k<='0'; clk<='1'; wait for 5 ns;\n    assert q='0' report \"Slave changed during master high phase\" severity error;\n    clk<='0'; wait for 5 ns; assert q='1' report \"Master-slave set failed\" severity error;\n    j<='0'; k<='1'; clk<='1'; wait for 5 ns;\n    clk<='0';wait for 5 ns;assert q='0' report \"Master-slave reset failed\" severity error;\n    report \"jk_master_slave tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity jk_master_slave is\n  port (\n    clk,rst: in std_logic;\n    j,k: in std_logic;\n    q: out std_logic\n  );\nend jk_master_slave;\narchitecture behavioral of jk_master_slave is\n  signal master,slave:std_logic:='0';\nbegin\n  process(all) begin\n    if rst='1' then master<='0';\n    elsif clk='1' then\n      if j='0' and k='1' then master<='0';\n      elsif j='1' and k='0' then master<='1';\n      elsif j='1' and k='1' then master<=not slave; end if;\n    end if;\n  end process;\n  process(all) begin\n    if rst='1' then slave<='0';\n    elsif clk='0' then slave<=master; end if;\n  end process;\n  q<=slave;\nend behavioral;\n"
   }
  }
 },
 "sr_master_slave": {
  "label": "SR Master-Slave",
  "group": "Sequential",
  "design": "sr_master_slave",
  "top": "tb_sr_master_slave",
  "description": "Two transparent stages using opposite clock levels.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_sr_master_slave is end;\narchitecture test of tb_sr_master_slave is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal s,r:std_logic:='0';\n  signal q:std_logic;\nbegin\n  dut: entity work.sr_master_slave port map(clk,rst,s,r,q);\n  stimulus: process\n  begin\n    wait for 3 ns; rst<='0'; wait for 3 ns;\n    s<='1'; r<='0'; clk<='1'; wait for 5 ns;\n    assert q='0' report \"Slave changed during master high phase\" severity error;\n    clk<='0'; wait for 5 ns; assert q='1' report \"Master-slave set failed\" severity error;\n    s<='0'; r<='1'; clk<='1'; wait for 5 ns;\n    clk<='0';wait for 5 ns;assert q='0' report \"Master-slave reset failed\" severity error;\n    report \"sr_master_slave tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity sr_master_slave is\n  port (\n    clk,rst: in std_logic;\n    s,r: in std_logic;\n    q: out std_logic\n  );\nend sr_master_slave;\narchitecture behavioral of sr_master_slave is\n  signal master,slave:std_logic:='0';\nbegin\n  process(all) begin\n    if rst='1' then master<='0';\n    elsif clk='1' then\n      if s='1' and r='0' then master<='1';\n      elsif s='0' and r='1' then master<='0'; end if;\n    end if;\n  end process;\n  process(all) begin\n    if rst='1' then slave<='0';\n    elsif clk='0' then slave<=master; end if;\n  end process;\n  q<=slave;\nend behavioral;\n"
   }
  }
 },
 "up_down_counter": {
  "label": "4-bit Up/Down Counter",
  "group": "Sequential",
  "design": "up_down_counter",
  "top": "tb_up_down_counter",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_up_down_counter is end;\narchitecture test of tb_up_down_counter is\n  signal clk:std_logic:='0'; signal rst:std_logic:='1';\n  signal en:std_logic:='1';signal up:std_logic:='1';\n  signal q:unsigned(3 downto 0);\nbegin\n  dut: entity work.up_down_counter port map(clk,rst,en,up,q);\n  stimulus: process\n  begin\n    wait for 2 ns;rst<='0';wait for 2 ns;\n    for i in 1 to 4 loop\n      clk<='1';wait for 2 ns;assert q=to_unsigned(i,4) report \"Up count\" severity error;\n      clk<='0';wait for 2 ns;\n    end loop;\n    up<='0';\n    for i in 3 downto 1 loop\n      clk<='1';wait for 2 ns;assert q=to_unsigned(i,4) report \"Down count\" severity error;\n      clk<='0';wait for 2 ns;\n    end loop;\n    en<='0';clk<='1';wait for 2 ns;assert q=to_unsigned(1,4) report \"Counter hold\" severity error;\n    report \"up_down_counter tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity up_down_counter is\n  port (\n    clk,rst,en,up: in std_logic;\n    q: out unsigned(3 downto 0)\n  );\nend up_down_counter;\narchitecture behavioral of up_down_counter is\n  signal cnt:unsigned(3 downto 0):=(others=>'0');\nbegin\n  process(clk,rst) begin\n    if rst='1' then cnt<=(others=>'0');\n    elsif rising_edge(clk) then\n      if en='1' then\n        if up='1' then cnt<=cnt+1; else cnt<=cnt-1; end if;\n      end if;\n    end if;\n  end process;\n  q<=cnt;\nend behavioral;\n"
   }
  }
 },
 "shift_register": {
  "label": "8-bit Shift Register",
  "group": "Sequential",
  "design": "shift_register",
  "top": "tb_shift_register",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_shift_register is end;\narchitecture test of tb_shift_register is\n  signal clk:std_logic:='0';signal rst:std_logic:='1';\n  signal en:std_logic:='1';signal din:std_logic:='0';\n  signal q:std_logic_vector(7 downto 0);\nbegin\n  dut: entity work.shift_register port map(clk,rst,en,din,q);\n  stimulus: process\n  begin\n    wait for 3 ns;rst<='0';wait for 2 ns;\n    for i in 0 to 7 loop\n      if i=0 or i=2 or i=5 then din<='1';else din<='0';end if;\n      wait for 1 ns;clk<='1';wait for 2 ns;\n      clk<='0';wait for 2 ns;\n    end loop;\n    assert q=x\"A4\" report \"Shift register sequence mismatch\" severity error;\n    en<='0';din<='1';clk<='1';wait for 2 ns;\n    assert q=x\"A4\" report \"Shift register hold\" severity error;\n    report \"shift_register tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity shift_register is\n  port (\n    clk,rst,en,din: in std_logic;\n    q: out std_logic_vector(7 downto 0)\n  );\nend shift_register;\narchitecture behavioral of shift_register is\n  signal state:std_logic_vector(7 downto 0):=(others=>'0');\nbegin\n  process(clk,rst) begin\n    if rst='1' then state<=(others=>'0');\n    elsif rising_edge(clk) then\n      if en='1' then state<=state(6 downto 0)&din; end if;\n    end if;\n  end process;\n  q<=state;\nend behavioral;\n"
   }
  }
 },
 "detector1101": {
  "label": "1101 Sequence Detector (Overlap)",
  "group": "Sequential",
  "design": "detector1101",
  "top": "tb_detector1101",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_detector1101 is end;\narchitecture test of tb_detector1101 is\n  signal clk:std_logic:='0';signal rst:std_logic:='1';\n  signal din:std_logic:='0';signal detected:std_logic;\nbegin\n  dut: entity work.detector1101 port map(clk,rst,din,detected);\n  stimulus: process\n  begin\n    wait for 2 ns;rst<='0';wait for 2 ns;\n    -- 1101101 contains two overlapping 1101 hits, ending at bits 4 and 7.\n    for i in 1 to 7 loop\n      case i is\n        when 1|2|4|5|7 => din<='1';\n        when others => din<='0';\n      end case;\n      wait for 1 ns;clk<='1';wait for 2 ns;\n      if i=4 or i=7 then assert detected='1' report \"Missing 1101 hit\" severity error;\n      else assert detected='0' report \"Spurious 1101 hit\" severity error; end if;\n      clk<='0';wait for 2 ns;\n    end loop;\n    report \"detector1101 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity detector1101 is\n  port (\n    clk,rst,din: in std_logic;\n    detected: out std_logic\n  );\nend detector1101;\narchitecture behavioral of detector1101 is\n  signal hist:std_logic_vector(3 downto 0):=(others=>'0');\n  signal hits:std_logic:='0';\nbegin\n  process(clk,rst)\n    variable incoming:std_logic_vector(3 downto 0);\n  begin\n    if rst='1' then hist<=(others=>'0');hits<='0';\n    elsif rising_edge(clk) then\n      incoming:=hist(2 downto 0)&din;\n      hist<=incoming;\n      if incoming=\"1101\" then hits<='1'; else hits<='0'; end if;\n    end if;\n  end process;\n  detected<=hits;\nend behavioral;\n"
   }
  }
 },
 "magnitude_comparator4": {
  "label": "4-bit Magnitude Comparator",
  "group": "Arithmetic",
  "design": "magnitude_comparator4",
  "top": "tb_magnitude_comparator4",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_magnitude_comparator4 is end;\narchitecture test of tb_magnitude_comparator4 is\n  signal a,b:unsigned(3 downto 0):=(others=>'0');\n  signal lt,eq,gt:std_logic;\nbegin\n  dut: entity work.magnitude_comparator4 port map(a,b,lt,eq,gt);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      for j in 0 to 15 loop\n        a<=to_unsigned(i,4);b<=to_unsigned(j,4);wait for 500 ps;\n        if i<j then assert lt='1' and eq='0' and gt='0' report \"Compare less mismatch\" severity error;\n        elsif i>j then assert lt='0' and eq='0' and gt='1' report \"Compare greater mismatch\" severity error;\n        else assert lt='0' and eq='1' and gt='0' report \"Compare equal mismatch\" severity error;end if;\n      end loop;\n    end loop;\n    report \"magnitude_comparator4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "dataflow": {
    "style": "dataflow",
    "label": "Dataflow",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity magnitude_comparator4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    lt,eq,gt: out std_logic\n  );\nend magnitude_comparator4;\narchitecture dataflow of magnitude_comparator4 is\nbegin\n  lt<='1' when a<b else '0';\n  eq<='1' when a=b else '0';\n  gt<='1' when a>b else '0';\nend dataflow;\n"
   },
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity magnitude_comparator4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    lt,eq,gt: out std_logic\n  );\nend magnitude_comparator4;\narchitecture behavioral of magnitude_comparator4 is\nbegin\n  process(all) begin\n    lt<='0';eq<='0';gt<='0';\n    if a<b then lt<='1';\n    elsif a>b then gt<='1';\n    else eq<='1';end if;\n  end process;\nend behavioral;\n"
   },
   "structural": {
    "style": "structural",
    "label": "Structural",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity cmp_bit is port(ai,bi,gt_in,eq_in,lt_in: in std_logic;gt_out,eq_out,lt_out:out std_logic);end;\narchitecture rtl of cmp_bit is begin\n gt_out <= gt_in or (eq_in and ai and not bi);\n lt_out <= lt_in or (eq_in and not ai and bi);\n eq_out <= eq_in and (ai xnor bi);\nend rtl;\nlibrary ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity magnitude_comparator4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    lt,eq,gt: out std_logic\n  );\nend magnitude_comparator4;\narchitecture structural of magnitude_comparator4 is\n  signal g,e,l:std_logic_vector(4 downto 0);\nbegin\n  g(4)<='0'; l(4)<='0';e(4)<='1';\n  c3:entity work.cmp_bit port map(a(3),b(3),g(4),e(4),l(4),g(3),e(3),l(3));\n  c2:entity work.cmp_bit port map(a(2),b(2),g(3),e(3),l(3),g(2),e(2),l(2));\n  c1:entity work.cmp_bit port map(a(1),b(1),g(2),e(2),l(2),g(1),e(1),l(1));\n  c0:entity work.cmp_bit port map(a(0),b(0),g(1),e(1),l(1),g(0),e(0),l(0));\n  gt<=g(0);eq<=e(0);lt<=l(0);\nend structural;\n"
   }
  }
 },
 "adder4": {
  "label": "4-bit Adder (Structural Ripple)",
  "group": "Arithmetic",
  "design": "adder4",
  "top": "tb_adder4",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_adder4 is end;\narchitecture test of tb_adder4 is\n  signal a,b:unsigned(3 downto 0):=(others=>'0');\n  signal cin:std_logic:='0';\n  signal sum:unsigned(3 downto 0);signal cout:std_logic;\nbegin\n  dut: entity work.adder4 port map(a,b,cin,sum,cout);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      for j in 0 to 15 loop\n        a<=to_unsigned(i,4);b<=to_unsigned(j,4);\n        if (i+j) mod 2=0 then cin<='0'; else cin<='1';end if;\n        wait for 500 ps;\n        assert to_integer(sum)=((i+j+((i+j) mod 2)) mod 16) report \"adder sum\" severity error;\n        if i+j+((i+j) mod 2)>=16 then assert cout='1' report \"carry missing\" severity error;\n        else assert cout='0' report \"unexpected carry\" severity error;end if;\n      end loop;\n    end loop;\n    report \"adder4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "dataflow": {
    "style": "dataflow",
    "label": "Dataflow",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity adder4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    cin: in std_logic;\n    sum: out unsigned(3 downto 0);\n    cout: out std_logic\n  );\nend adder4;\narchitecture dataflow of adder4 is\n  signal total:unsigned(4 downto 0);\nbegin\n  total <= ('0' & a)+('0' & b)+to_unsigned(1,5) when cin='1' else ('0' & a)+('0' & b);\n  sum<=total(3 downto 0);cout<=total(4);\nend dataflow;\n"
   },
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity adder4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    cin: in std_logic;\n    sum: out unsigned(3 downto 0);\n    cout: out std_logic\n  );\nend adder4;\narchitecture behavioral of adder4 is\nbegin\n  process(all)\n    variable v:unsigned(4 downto 0);\n  begin\n    v:=('0'&a)+('0'&b);\n    if cin='1' then v:=v+1;end if;\n    sum<=v(3 downto 0);cout<=v(4);\n  end process;\nend behavioral;\n"
   },
   "structural": {
    "style": "structural",
    "label": "Structural",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity full_adder is port(a,b,ci:in std_logic;s,co:out std_logic);end;\narchitecture rtl of full_adder is begin\n s<=a xor b xor ci;\n co<=(a and b) or (a and ci) or (b and ci);\nend rtl;\nlibrary ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity adder4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    cin: in std_logic;\n    sum: out unsigned(3 downto 0);\n    cout: out std_logic\n  );\nend adder4;\narchitecture structural of adder4 is\n  signal c:std_logic_vector(4 downto 0);\nbegin\n  c(0)<=cin;\n  fa0:entity work.full_adder port map(a(0),b(0),c(0),sum(0),c(1));\n  fa1:entity work.full_adder port map(a(1),b(1),c(1),sum(1),c(2));\n  fa2:entity work.full_adder port map(a(2),b(2),c(2),sum(2),c(3));\n  fa3:entity work.full_adder port map(a(3),b(3),c(3),sum(3),c(4));\n  cout<=c(4);\nend structural;\n"
   }
  }
 },
 "alu4": {
  "label": "4-bit ALU (8 operations)",
  "group": "Arithmetic",
  "design": "alu4",
  "top": "tb_alu4",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_alu4 is end;\narchitecture test of tb_alu4 is\n  signal a,b:unsigned(3 downto 0):=(others=>'0');\n  signal op:unsigned(2 downto 0):=(others=>'0');\n  signal result:unsigned(3 downto 0);signal zero:std_logic;\nbegin\n  dut: entity work.alu4 port map(a,b,op,result,zero);\n  stimulus: process\n  begin\n    a<=to_unsigned(6,4);b<=to_unsigned(3,4);\n    for i in 0 to 7 loop\n      op<=to_unsigned(i,3);wait for 5 ns;\n      case i is\n        when 0 => assert result=9 report \"ADD\" severity error;\n        when 1 => assert result=3 report \"SUB\" severity error;\n        when 2 => assert result=2 report \"AND\" severity error;\n        when 3 => assert result=7 report \"OR\" severity error;\n        when 4 => assert result=5 report \"XOR\" severity error;\n        when 5 => assert result=12 report \"SHL\" severity error;\n        when 6 => assert result=3 report \"SHR\" severity error;\n        when 7 => assert result=9 report \"NOT\" severity error;\n        when others=>null;\n      end case;\n      assert zero='0' report \"Zero flag wrong\" severity error;\n    end loop;\n    a<=to_unsigned(3,4);b<=to_unsigned(3,4);op<=to_unsigned(1,3);\n    wait for 5 ns;assert result=0 and zero='1' report \"Zero flag missing\" severity error;\n    report \"alu4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "case": {
    "style": "behavioral",
    "label": "Case",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity alu4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    op: in unsigned(2 downto 0);\n    result: out unsigned(3 downto 0);\n    zero: out std_logic\n  );\nend alu4;\narchitecture behavioral of alu4 is\n  signal res:unsigned(3 downto 0);\nbegin\n  process(all) begin\n    case to_integer(op) is\n      when 0 => res<=a+b;\n      when 1 => res<=a-b;\n      when 2 => res<=a and b;\n      when 3 => res<=a or b;\n      when 4 => res<=a xor b;\n      when 5 => res<=shift_left(a,1);\n      when 6 => res<=shift_right(a,1);\n      when 7 => res<=not a;\n      when others=>res<=(others=>'0');\n    end case;\n  end process;\n  result<=res;\n  zero<='1' when res=0 else '0';\nend behavioral;\n"
   },
   "when_else": {
    "style": "dataflow",
    "label": "When / Else",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity alu4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    op: in unsigned(2 downto 0);\n    result: out unsigned(3 downto 0);\n    zero: out std_logic\n  );\nend alu4;\narchitecture dataflow of alu4 is\n  signal res:unsigned(3 downto 0);\nbegin\n  res <= a+b when op=to_unsigned(0,3) else\n         a-b when op=to_unsigned(1,3) else\n         a and b when op=to_unsigned(2,3) else\n         a or b when op=to_unsigned(3,3) else\n         a xor b when op=to_unsigned(4,3) else\n         shift_left(a,1) when op=to_unsigned(5,3) else\n         shift_right(a,1) when op=to_unsigned(6,3) else not a;\n  result<=res;zero<='1' when res=0 else '0';\nend dataflow;\n"
   }
  }
 },
 "fifo4x8": {
  "label": "4×8 Synchronous FIFO",
  "group": "Advanced",
  "design": "fifo4x8",
  "top": "tb_fifo4x8",
  "description": "Simultaneous valid read/write supported; full and empty indicate status before the next active edge.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_fifo4x8 is end;\narchitecture test of tb_fifo4x8 is\n  signal clk:std_logic:='0';signal rst:std_logic:='1';\n  signal wr_en,rd_en:std_logic:='0';\n  signal din:std_logic_vector(7 downto 0):=(others=>'0');\n  signal dout:std_logic_vector(7 downto 0);\n  signal full,empty:std_logic;\nbegin\n  dut: entity work.fifo4x8 port map(clk,rst,wr_en,rd_en,din,dout,full,empty);\n  stimulus: process\n  begin\n    wait for 3 ns;rst<='0';wait for 2 ns;assert empty='1' report \"Reset FIFO not empty\" severity error;\n    wr_en<='1';\n    for i in 1 to 4 loop\n      din<=std_logic_vector(to_unsigned(i*9,8));clk<='1';wait for 2 ns;\n      clk<='0';wait for 2 ns;\n    end loop;\n    assert full='1' and empty='0' report \"Full flag mismatch\" severity error;\n    wr_en<='0';rd_en<='1';\n    for i in 1 to 4 loop\n      clk<='1';wait for 2 ns;\n      assert dout=std_logic_vector(to_unsigned(i*9,8)) report \"FIFO order mismatch\" severity error;\n      clk<='0';wait for 2 ns;\n    end loop;\n    assert empty='1' report \"Empty flag mismatch\" severity error;\n    report \"fifo4x8 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity fifo4x8 is\n  port (\n    clk,rst,wr_en,rd_en: in std_logic;\n    din: in std_logic_vector(7 downto 0);\n    dout: out std_logic_vector(7 downto 0);\n    full,empty: out std_logic\n  );\nend fifo4x8;\narchitecture behavioral of fifo4x8 is\n  type memory_t is array(0 to 3) of std_logic_vector(7 downto 0);\n  signal mem:memory_t:=(others=>(others=>'0'));\n  signal wptr,rptr:integer range 0 to 3:=0;\n  signal count:integer range 0 to 4:=0;\n  signal dout_reg:std_logic_vector(7 downto 0):=(others=>'0');\nbegin\n  process(clk,rst)\n    variable wr_ok,rd_ok:boolean;\n  begin\n    if rst='1' then wptr<=0;rptr<=0;count<=0;dout_reg<=(others=>'0');\n    elsif rising_edge(clk) then\n      wr_ok:=(wr_en='1' and count<4);\n      rd_ok:=(rd_en='1' and count>0);\n      if wr_ok then mem(wptr)<=din;wptr<=(wptr+1) mod 4;end if;\n      if rd_ok then dout_reg<=mem(rptr);rptr<=(rptr+1) mod 4;end if;\n      if wr_ok and not rd_ok then count<=count+1;\n      elsif rd_ok and not wr_ok then count<=count-1;end if;\n    end if;\n  end process;\n  dout<=dout_reg;\n  full<='1' when count=4 else '0';\n  empty<='1' when count=0 else '0';\nend behavioral;\n"
   }
  }
 },
 "unsigned_multiplier4": {
  "label": "4×4 Unsigned Multiplier",
  "group": "Arithmetic",
  "design": "unsigned_multiplier4",
  "top": "tb_unsigned_multiplier4",
  "description": "",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_unsigned_multiplier4 is end;\narchitecture test of tb_unsigned_multiplier4 is\n  signal a,b:unsigned(3 downto 0):=(others=>'0');\n  signal product:unsigned(7 downto 0);\nbegin\n  dut: entity work.unsigned_multiplier4 port map(a,b,product);\n  stimulus: process\n  begin\n    for i in 0 to 15 loop\n      for j in 0 to 15 loop\n        a<=to_unsigned(i,4);b<=to_unsigned(j,4);wait for 500 ps;\n        assert product=to_unsigned(i*j,8) report \"Multiplier mismatch\" severity error;\n      end loop;\n    end loop;\n    report \"unsigned_multiplier4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "dataflow": {
    "style": "dataflow",
    "label": "Dataflow",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity unsigned_multiplier4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    product: out unsigned(7 downto 0)\n  );\nend unsigned_multiplier4;\narchitecture dataflow of unsigned_multiplier4 is\nbegin\n  product<=a*b;\nend dataflow;\n"
   },
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity unsigned_multiplier4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    product: out unsigned(7 downto 0)\n  );\nend unsigned_multiplier4;\narchitecture behavioral of unsigned_multiplier4 is\nbegin\n  process(all)\n    variable p:unsigned(7 downto 0);\n  begin\n    p:=(others=>'0');\n    for i in 0 to 3 loop\n      if b(i)='1' then p:=p+shift_left(resize(a,8),i);end if;\n    end loop;\n    product<=p;\n  end process;\nend behavioral;\n"
   },
   "partial_products": {
    "style": "dataflow",
    "label": "Partial / Products",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity unsigned_multiplier4 is\n  port (\n    a,b: in unsigned(3 downto 0);\n    product: out unsigned(7 downto 0)\n  );\nend unsigned_multiplier4;\narchitecture dataflow of unsigned_multiplier4 is\n  signal p0,p1,p2,p3:unsigned(7 downto 0);\nbegin\n  product<=p0+p1+p2+p3;\n  p0<=resize(a,8) when b(0)='1' else (others=>'0');\n  p1<=shift_left(resize(a,8),1) when b(1)='1' else (others=>'0');\n  p2<=shift_left(resize(a,8),2) when b(2)='1' else (others=>'0');\n  p3<=shift_left(resize(a,8),3) when b(3)='1' else (others=>'0');\nend dataflow;\n"
   }
  }
 },
 "fir4": {
  "label": "4-tap FIR Filter",
  "group": "Advanced",
  "design": "fir4",
  "top": "tb_fir4",
  "description": "Signed 8-bit input; fixed tap coefficients [1,2,2,1], 16-bit accumulation.",
  "test": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity tb_fir4 is end;\narchitecture test of tb_fir4 is\n  signal clk:std_logic:='0';signal rst:std_logic:='1';\n  signal sample_in:signed(7 downto 0):=(others=>'0');\n  signal sample_out:signed(15 downto 0);\nbegin\n  dut: entity work.fir4 port map(clk,rst,sample_in,sample_out);\n  stimulus: process\n  begin\n    wait for 3 ns;rst<='0';wait for 2 ns;\n    for i in 0 to 4 loop\n      if i=0 then sample_in<=to_signed(1,8);else sample_in<=to_signed(0,8);end if;\n      wait for 1 ns;clk<='1';wait for 2 ns;\n      case i is\n        when 0=>assert sample_out=to_signed(1,16) report \"FIR tap0\" severity error;\n        when 1=>assert sample_out=to_signed(2,16) report \"FIR tap1\" severity error;\n        when 2=>assert sample_out=to_signed(2,16) report \"FIR tap2\" severity error;\n        when 3=>assert sample_out=to_signed(1,16) report \"FIR tap3\" severity error;\n        when others=>assert sample_out=to_signed(0,16) report \"FIR tail\" severity error;\n      end case;\n      clk<='0';wait for 2 ns;\n    end loop;\n    report \"fir4 tests PASSED\" severity note;\n    wait;\n  end process;\nend test;\n",
  "variants": {
   "behavioral": {
    "style": "behavioral",
    "label": "Behavioral",
    "rtl": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\nentity fir4 is\n  port (\n    clk,rst: in std_logic;\n    sample_in: in signed(7 downto 0);\n    sample_out: out signed(15 downto 0)\n  );\nend fir4;\narchitecture behavioral of fir4 is\n  signal d1,d2,d3:signed(7 downto 0):=(others=>'0');\n  signal result:signed(15 downto 0):=(others=>'0');\nbegin\n  process(clk,rst)\n    variable total:signed(15 downto 0);\n  begin\n    if rst='1' then\n      d1<=(others=>'0');d2<=(others=>'0');d3<=(others=>'0');result<=(others=>'0');\n    elsif rising_edge(clk) then\n      total:=resize(sample_in,16)+shift_left(resize(d1,16),1)\n            +shift_left(resize(d2,16),1)+resize(d3,16);\n      result<=total;\n      d3<=d2;d2<=d1;d1<=sample_in;\n    end if;\n  end process;\n  sample_out<=result;\nend behavioral;\n"
   }
  }
 }
};
