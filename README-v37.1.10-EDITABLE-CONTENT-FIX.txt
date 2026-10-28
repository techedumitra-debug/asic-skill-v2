ASIC-Skill v37.1.10 — Editable heading and lesson content correction

Source: user-supplied ASIC-Skill v37.1.09 complete website.

Issue: a malformed pasted heading caused an empty <h1> and a separate <h3>
outside .de-content, so the visible lesson heading was not editable.

Fixes:
- Repaired six detached lesson headings in Unit 01, retaining text and inline
  formatting. The original headings are now the editable lesson titles.
- Added automatic, repeatable repair for split lesson heading markup and other
  orphan text blocks immediately between title and content area.
- Updated editor to register normal new text nodes created through paste or
  normalization and make them editable again after reopening.
- Runs repair at initial load, edit-mode toggle, save, and HTML export.
- Does not modify widget/script/SVG content or existing educational text.

Test: Open digital-electronics.html via VS Code Live Server, navigate to
Multiplexers and Demultiplexers, open Edit Content, click the title, type,
save/export, replace the HTML file and reload. Do the same with lesson text.

Back up any previous work. Browser-local drafts from earlier revisions
should be reviewed before restoring over updated lesson HTML.
