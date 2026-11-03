ASIC-Skill Visual Content Editor — v37.1.00
============================================
Fix: Font size increase/decrease and numeric size selection.

• Select or click text in any Digital Electronics lesson, then choose a font size of 7–96 pt.
• A− decreases and A+ increases the current text size by 1 point.
• With highlighted text, only the selection changes; without a selection, the current heading, paragraph, list item or table cell changes.
• Font sizes survive export of all lessons to an updated HTML file.
• Consecutive A−/A+ changes reuse the same text span rather than nesting duplicate style wrappers.
• The full website uses content-editor.js?v=37.1.00 to avoid loading a cached older editor.

Editor-only patch: replace content-editor.js, then change the query in your HTML from
  content-editor.js?v=37.0.99
to
  content-editor.js?v=37.1.00
or hard-refresh in the browser. Do not overwrite customized lesson files.

GitHub Pages hosts the static site but does not directly save edits; export HTML and commit it.
