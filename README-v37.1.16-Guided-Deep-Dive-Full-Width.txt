ASIC-Skill v37.1.16 — Guided Deep Dive Full-Width Layout Fix

Based on ASIC-Skill v37.1.15.

Changes in digital-electronics.html (Unit 01):
- Guided Deep Dive blocks occupy the full available lesson-content width.
- Removed the 85ch paragraph max-width that left empty space to the right at reduced font sizes.
- Reduced the extra desktop inset padding from 26px to 18px maximum.
- Existing table scrollability, diagrams, interactive examples, and lesson navigation are retained.
- These styles apply to all 18 Guided Deep Dive blocks in Unit 01.

Installation:
1) Back up your current website and export any unsaved editor drafts.
2) For a targeted update, replace digital-electronics.html only.
3) For the full website, extract all files into a NEW folder.
4) Open via VS Code Live Server, then use Ctrl+Shift+R in Chrome.

Note: Other unit files are unchanged. The new horizontal layout still respects mobile widths; wide tables can scroll horizontally.
