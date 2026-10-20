-- ASIC-Skill v32.6 — Universal course catalogue
-- Safe to run more than once. Existing course IDs/materials are preserved.

insert into public.courses (title, slug, description, sort_order, is_active) values
('ASIC Physical Design — Complete Flow','physical-design','From design inputs and floorplan through placement, CTS, routing and chip finishing.',1,true),
('Static Timing Analysis','static-timing-analysis','Timing paths, setup/hold, slack, libraries, parasitics, OCV, SI and report analysis.',2,true),
('SDC & Timing Constraints','sdc-timing-constraints','Clocks, I/O delays, clock groups, false paths, multicycle paths and constraint validation.',3,true),
('MMMC Timing Signoff','mmmc-timing-signoff','Modes, PVT corners, analysis views, parasitic corners and multi-scenario closure.',4,true),
('DRC, LVS & Physical Verification','physical-verification','Understand physical verification checks, debug methodology and tapeout evidence.',5,true),
('UPF & Low-Power Design','upf-low-power','Power domains, isolation, level shifters, retention, power intent and verification.',6,true),
('Verilog & SystemVerilog','verilog-systemverilog','RTL coding foundations, synthesizable design, testbenches and verification concepts.',7,true),
('DFT, Scan & ATPG','dft-scan-atpg','Test architecture, scan chains, fault models, ATPG concepts and test coverage.',8,true)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

select id, sort_order, title, slug, is_active
from public.courses
where slug in (
 'physical-design','static-timing-analysis','sdc-timing-constraints','mmmc-timing-signoff',
 'physical-verification','upf-low-power','verilog-systemverilog','dft-scan-atpg'
)
order by sort_order;
