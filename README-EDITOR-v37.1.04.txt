ASIC-Skill v37.1.04 — Interactive HTML Lesson Fidelity Fix

Built from the supplied ASIC-Skill-v37.1.03-Website(1).zip.

CHANGE: In Edit Content > Add HTML lesson, the new checked-by-default Preserve complete interactive page mode embeds the entire imported HTML document as an iframe srcdoc with sandbox="allow-scripts" (without allow-same-origin). CSS, SVG figures, controls, waveforms, scripts, and document structure remain inside the isolated document, avoiding conflicts with the unit's styles.

Use the Add HTML File as Lesson button, choose a complete interactive HTML page, select its lesson plan position and export ALL Lessons HTML. A successful export embeds the interactive page; no separately hosted HTML file is needed when its assets and scripts are self-contained. The imported HTML source can be edited from Edit Imported Interactive HTML. Do not try to edit text by clicking inside the iframe: use that source control instead. If your page references images, stylesheets, scripts or media as separate files, copy those assets into the matching relative website paths.

OPTION: Uncheck Preserve complete interactive page to use the older static conversion; it strips interactive elements and is suitable only for text-centric documents.

SECURITY: Imported scripts execute in a sandboxed, opaque-origin frame. The editor does not run scripts in the parent document. As in any browser, only import HTML from sources you trust. Some third-party widgets depending on cookies, localStorage, fullscreen, popups, cross-origin calls or forms may be restricted by the sandbox.

RESTORE: Existing content and editor features are retained. As before, back up your site and export/replace the HTML file to publish lesson edits.
