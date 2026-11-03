ASIC-Skill v37.1.12 — List Marker / Bullet Editing Repair
========================================================
Based on the user-supplied ASIC-Skill v37.1.11 website ZIP.

WHAT WAS FIXED
- The visible bullet/number comes from a list-item (<li>), not the inner paragraph.
- Edit Content now includes Remove Bullet / Number: convert the selected list item into ordinary text while keeping the original content, formatting and nested sections.
- Delete List Item removes both the bullet marker and the item content (with Undo Last Delete support).
- Delete Selected Element will delete the complete list item if a paragraph within the list item is selected, avoiding orphan bullet markers.
- Removed the two unwanted OUTER bullets from the Unit 01 Code Converters introduction shown in the screenshot. The nested BCD explanatory bullet remains intact.
- Converted list structure is stored as an edited block for draft/export persistence; unchanged data and assets remain in place.

USAGE
1. Back up your current website, and export any unsaved browser drafts before replacing HTML files.
2. Extract the full ZIP or overwrite the matching files from Editor-Update-Only ZIP in the VS Code website directory.
3. Open digital-electronics.html through VS Code Live Server; hard refresh Ctrl+Shift+R.
4. Choose Edit Content and click inside the desired bullet or numbered item (including its text).
5. Select Remove Bullet / Number (keep text) OR Delete List Item (remove the entire entry).
6. Use Undo Last Delete to revert either action, then Export ALL Lessons HTML to publish changes.

NOTE
When a list item contains headings/other paragraphs, Remove Bullet / Number keeps them together in a non-list wrapper. For a normal list, adjacent bullet items remain bulleted. The original JS/SVG interactive lessons were left unchanged. If an older Chrome draft is restored, review it carefully because it may bring back old markup.

VALIDATION
Node.js JS syntax check passed; Chromium set-content tests covered removal, deletion, Undo, multi-item lists, export/reopen, and checked for page script errors. Direct VS Code Live Server navigation was blocked by the browser environment and was not tested.
