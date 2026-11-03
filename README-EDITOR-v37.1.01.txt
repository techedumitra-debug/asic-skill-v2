ASIC-Skill Visual Content Studio — v37.1.01
=============================================
Fix: identical table layout in Edit mode, Preview mode, and exported HTML.

Root cause
----------
Contenteditable table cells can have different intrinsic column sizes from
read-only cells. Original CSS also used overflow-wrap:anywhere for content
containing tables, allowing words to split in the middle in Preview mode.
Unit 01 additionally shipped with the transient asic-edit-mode body class.

Changes
-------
• Learning-material tables now use the same fixed table layout in both modes.
• Three-column comparison tables reserve ~23% for their first/label column.
• Tables have a minimum sensible width; narrow viewports scroll horizontally.
• Table cells do not split standard words arbitrarily.
• Existing Table width / Selected column width controls still override defaults.
• Unit 01 stray editor-mode class removed; editor resets legacy stale class.
• Export now strips editor mode from the CLONED HTML body (previous code used root.body, which was undefined).
• All 19 Digital Electronics files now reference content-editor.js?v=37.1.01.
• Original lessons, interactive labs, media and other website files retained.

Installation
------------
Replace the website directory with this ZIP's contents, or copy
  content-editor.js
  digital-electronics.html
  digital-electronics-unit02.html ... digital-electronics-unit19.html
into the existing directory. Keep your existing lesson files BACKED UP first,
because replacing a lesson file overwrites that file's own authored content.
If you have new edits not in this archive, copy only the CSS block with id
asic-consistent-table-layout-v37101 and the JS changes into your newer files.

In VS Code Live Server reload with Ctrl+Shift+R, open Unit 01 → Analog vs Digital,
compare the first column in Edit and Preview, and verify no mid-word break.
Test a manual Selected column width (%) change and Export ALL Lessons HTML.
