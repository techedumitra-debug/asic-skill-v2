ASIC-Skill v37.0.99 — Visual Editor update

Fixes:
- Each exported unit HTML contains edits to ALL its lesson pages (including lessons currently hidden behind navigation).
- Previously saved drafts from a different HTML revision are not silently reapplied on new exports; use Restore Prior Draft if deliberately needed.
- Clicking Next/Previous or a lesson link resets the insertion target to the active lesson.
- New Table Width (%) and Selected Column (%) controls; Auto Fit and Equal Columns; preserves column order.
- Changes remain local until the exported .html replaces its matching file on GitHub.

Editor-only patch: upload content-editor.js and content-editor.html. No unit page replacement is required if existing unit HTML already loads content-editor.js. Replacing unit HTML from the FULL WEBSITE ZIP will overwrite any custom VS Code changes.

IMPORTANT: if your source file already contains changes not in the earlier v37.0.98 base, use the editor-only patch, not the full website ZIP.
