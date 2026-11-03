ASIC-Skill v37.1.09 — Unwanted Orange Outline Fix
===================================================
Base: v37.1.08 Complete Website - Blank Paragraph Fix.

Resolved:
1. Removed two wrongly persisted orange outline styles from the Unit 01 lesson
   "Synchronous vs. Asynchronous Sequential Circuits".
2. The editor now removes known editor-only orange selection outlines during
   page initialization, draft restoration, saving, and HTML export.
3. Updated editor JS cache version across all 19 Digital Electronics units.

The fix does not remove intentional instructional diagram borders, table borders,
notes, or other user-defined styling.

Install: BACK UP the current website and all unpublished browser drafts. Extract
this ZIP into your website root, preserving folder structure and allowing file
replacement. Open VS Code Live Server and press Ctrl+Shift+R. Open the lesson
in both Preview and Edit modes, then export once to save the cleaned markup.

Update Only package includes the 19 Digital Electronics pages, editor JS, and
this README. Complete Website package contains all site files.
