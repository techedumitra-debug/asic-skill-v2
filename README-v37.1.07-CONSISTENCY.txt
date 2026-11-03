ASIC-Skill v37.1.07 — Chrome consistency and footer fixes

WHAT CHANGED
- Removed 4 accidentally embedded VS Code Live Server WebSocket reload scripts from Unit 01. The real Live Server can add one dynamically; that is expected.
- Exports strip accidental Live Server development scripts, preventing them from multiplying.
- The 19 Digital Electronics unit pages share exactly the same branded footer. It appears after whichever lesson is currently displayed, including imported interactive HTML lessons.
- Dark/light preference is shared by the 19 units of the same website directory. Imported interactive HTML listens to the parent body theme.
- Editor drafts are now scoped to the full path, avoiding cross-project collisions on the same localhost:5500 origin. The previous v99 draft remains available via the Restore Saved Draft control; restoring should only be done for a matching version.
- Editor JavaScript has a new query-string version to avoid stale Chrome resource cache.

LOCAL DEPLOYMENT
1. Back up your current website and any unsaved lesson changes.
2. Extract the complete ZIP to ONE folder; do not mix versions.
3. Open that exact directory in VS Code; select digital-electronics.html -> Open with Live Server.
4. Open a new Chrome tab; use Ctrl+Shift+R once.
5. Navigation fragments such as #comb-seq refer to lessons and are normal.
6. Export ALL Lessons HTML after making changes. Replace the matching unit HTML in your project, and reload.

IMPORTANT
No file server can fix stale drafts already stored in the browser: choose the correct project folder, then inspect Application > Local Storage if old content unexpectedly appears. Clearing site data can delete unsaved work.
