ASIC-Skill v37.0.97 — Visual Content Studio / Office-style Editor
================================================================

For all 19 Digital Electronics units, click "Edit Content" in the unit top bar
or open content-editor.html and select a unit.

Microsoft Office-style formatting: font family/size, bold, italic, underline,
strikethrough, superscript, subscript, text and highlight colors, alignment,
numbered/bulleted lists, indent/outdent, clear formatting and undo/redo.

Lesson page deletion:
1. Open a unit and click Edit Content.
2. Under Lesson pages, choose the lesson to remove from that unit.
3. Click Delete Lesson Page and confirm. Grouped subtopics in that lesson
   are also included in the deletion.
4. Click Restore Lesson or Undo Last Delete to undo the deletion before export.
5. Click Export Updated HTML and replace the exported unit HTML on GitHub.
6. The exported file excludes the deleted lesson and its sidebar link, and
   renumbers the remaining lesson links. It does NOT delete the whole unit.

Other editing controls: clickable and editable lesson text, new headings,
paragraphs, notes, lists, tables and images, reordering, deletion of content
blocks, table row/column adjustments, image alt/name/caption editing, optional
selected-block HTML, and advanced full-page source editing.

Important: GitHub Pages hosts static HTML and cannot save edits directly to
GitHub. The edits/drafts are stored only in your browser until you export the
new HTML and replace it manually in GitHub. The content editor is not a
password-protected administration tool; published visitors can only change
their own browser copies, not the published repository.

To update an already customized v37.0.96 site without overwriting its
lessons, upload the following patch files to your repository root:
- content-editor.js
- content-editor.html (optional landing-page guidance)
Your existing unit pages should already reference content-editor.js?v=37.0.96;
this URL continues to load the replaced file. Clear the browser cache.

Editor changes to SVG, JavaScript or CSS should be tested carefully. Editing
interactive lab internals directly can affect running simulations.
