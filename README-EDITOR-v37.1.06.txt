ASIC-Skill v37.1.06 — Interactive Dark Mode and Caption Editing
==========================================================
Base: v37.1.05 complete website as provided in this conversation.

- Imported interactive HTML inherits the host Digital Electronics dark/light toggle, including imported header and footer.
- Themes sync on initial load and on every toggle; diagrams and SVG paths are preserved.
- Theme-only CSS and editor outlines do not enter saved/exported interactive source.
- Captions in all 19 Digital Electronics lesson pages can be edited by clicking their visible text in Edit Content, including existing uploaded-image figure captions.
- "Rename Image / Figure Caption" now uses the selected image/caption rather than the first image on a page.
- Inside imported interactive pages, Edit Interactive Visually allows editing header/footer text, figures and SVG text labels. New "Rename Image / Diagram Caption" creates or updates a persistent caption and accessible name without deleting the graphic.
- Existing lesson plan ordering, imported page scripts, diagrams and waveforms remain intact.

HOW TO USE
1. Extract the update over the existing website (back up locally first).
2. Open digital-electronics.html in VS Code Live Server.
3. Use ◐ in the header. Imported pages follow dark/light mode automatically.
4. Click Edit Content, open a lesson, click the caption and edit it (or use Rename Image / Figure Caption).
5. For imported HTML: Edit Interactive Visually > click figure or caption > Rename Image / Diagram Caption.
6. Imported page header and footer text can also be selected and edited in this mode.
7. Click Preview Interactive Page, then Export ALL Lessons HTML and replace the corresponding unit HTML file.

NOTES
- Image captions in source raster graphics (text drawn within an image) cannot be edited as HTML. Edit its HTML caption or replace/modify the source image.
- Imported full pages use sandboxed srcdoc to isolate their own scripts. Editing simulator controls or element IDs can break behavior; use source editing for those changes.
- For standalone linked HTML pages outside the embedded editor, dark mode syncing requires their own theme support.

- The published/exported HTML strips editor-only contenteditable and theme classes.
