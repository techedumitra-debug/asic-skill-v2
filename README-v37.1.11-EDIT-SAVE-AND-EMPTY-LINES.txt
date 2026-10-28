ASIC-Skill v37.1.11 — Editorial recovery and empty-line consistency
Based on the user-provided v37.1.10 complete website ZIP.

Fixes:
1. Unit 01 Synchronous vs. Asynchronous subsection: repaired an empty title,
   two paragraphs incorrectly nested inside H3 tags, and an extra empty heading.
   The preserved educational text and inline formatting remain in place.
2. Unit 01 Logic Pulses subsection: repaired an empty H2 followed by a duplicate
   H2 containing the real title.
3. Editor repairs accidental empty editorial headings and plain wrappers, not
   simulator/media/widget nodes or intentional spacers.
4. Repeated data-asic-node-id values are made unique so editor targeting/draft
   restoration do not accidentally affect another element.
5. Nested formatting spans are no longer made independently contenteditable;
   edit the actual heading, paragraph, or list item instead.
6. Edited text is automatically captured when leaving a content field or
   closing Edit mode. The Export ALL Lessons HTML button still must be used
   to publish changes to the file in VS Code / GitHub.
7. Added Backup Draft to save a browser-draft JSON recovery copy.
8. Selection outlines target currently editable text regions, not every
   nested span; this reduces misleading dotted boxes.

IMPORTANT ABOUT PAST EDITS
The ZIP supplied contains only the HTML/CSS/JS snapshots. Unsaved edits stored
in Chrome's localStorage are not included in the archive. This package does NOT
claim to have recovered yesterday's browser-only drafts. If you had edits that
are absent from the HTML, open the exact original project URL in the same
Chrome profile, use Restore Prior Draft when offered, review the changes, and
Export ALL Lessons HTML BEFORE replacing the installed files. Save a copy of
any latest exported HTML and your current website first.

Installation:
- Back up your current website folder and separately exported HTML files.
- Unzip this archive into a NEW folder to avoid mixing versions.
- Open the folder in VS Code and use Live Server.
- Test editing in Unit 01 > Synchronous vs. Asynchronous; Preview; reopen
  Edit; Export ALL Lessons HTML; replace the correct project file.
- Reload Chrome with Ctrl+Shift+R.

QA performed in headless Chromium using loaded HTML + editor JS:
- All 19 Digital Electronics unit pages opened and initialized the editor
  without page errors.
- Unit 01 edit -> Preview -> reopen Edit -> export -> reload preserved edits.
- Repaired subsection headings and duplicate node IDs checked.
Note: Full direct VS Code Live Server navigation could not be tested in this
sandbox because browser requests to localhost are blocked by environment policy.
