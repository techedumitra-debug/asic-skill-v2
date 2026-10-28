ASIC-Skill v37.1.05 — Editable Imported Interactive HTML
==========================================================
Base: ASIC-Skill v37.1.04 website, using the complete v37.1.03 website as the original source.

WHAT'S NEW
- Edit previously imported full interactive HTML lessons visually while retaining the
  original standalone page CSS, JavaScript, SVG and waveform functionality.
- New controls in Edit Content > Add HTML lesson / Manage lesson plan:
    * Edit Interactive Visually
    * Preview Interactive Page
    * Text inspector: Apply Selected Text, Load Selected HTML, Apply as HTML
    * Delete Selected, Undo, Move Up/Down, Add Heading/Paragraph/Note
    * Edit Full Interactive HTML Source (retained for advanced edits)
- Existing v37.1.04 imported pages automatically get the new interaction bridge.
- Edits are applied to the original iframe srcdoc so that Save Draft and Export ALL
  Lessons HTML include the modifications.

HOW TO EDIT AN INTERACTIVE IMPORT
1. Open digital-electronics.html with VS Code Live Server and click Edit Content.
2. Open the imported interactive lesson (sidebar or Open Lesson).
3. Click "Edit Interactive Visually".
4. Click a paragraph, heading, note, diagram, SVG text label, or control inside the
   embedded page. Its selection is shown in the editor panel.
5. Double-click normal text to edit it directly. Clicking away commits the change.
   Alternatively, change the selected text in the editor panel and click Apply Selected Text.
6. For formatting/markup, use Load Selected HTML, edit it, and click Apply as HTML.
7. Use Delete Selected / Undo, Move, and insert buttons as needed.
8. Click "Preview Interactive Page" to resume live simulator controls and waveforms.
9. Click Save Draft and Export ALL Lessons HTML; replace the unit HTML with the download.
10. Test the exported HTML under VS Code Live Server.

NOTES & SAFETY
- Interactive pages still run in a sandboxed iframe so their CSS and JavaScript
  cannot overwrite the surrounding ASIC-Skill editor.
- Editing/deleting a control whose ID a script expects may break the interactive
  demonstration. Undo immediately or use Full Interactive HTML Source to repair it.
- Text edits to an entire SVG object are blocked. Select individual SVG text labels,
  or use Full Interactive HTML Source to change circuit paths/wiring.
- 'Apply Selected Text' replaces the selected element's inner markup with plain text.
  Use 'Load Selected HTML' / 'Apply as HTML' to preserve formatting.
- Undo remembers the last 15 edits to the currently imported page. Export often.
- HTML files relying on external images/CSS/JS require those assets to be published.
- Editing the iframe contents changes its saved HTML, not the original source file
  on your PC. Export and upload the updated unit HTML to publish.
