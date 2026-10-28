/* ASIC-Skill v37.1.07: unit-wide theme persistence, per-project scope. */
(function () {
  'use strict';
  const pathname = location.pathname;
  const projectRoot = pathname.slice(0, pathname.lastIndexOf('/') + 1);
  const KEY = 'asic-skill:de:appearance:v37107:' + projectRoot;
  const toggle = document.getElementById('de-theme');
  if (!toggle) return;
  try {
    const preference = localStorage.getItem(KEY);
    if (preference === 'dark' || preference === 'light') {
      document.body.classList.toggle('dark', preference === 'dark');
    } else {
      // Preserve the old unit's active theme the first time this upgrade runs.
      localStorage.setItem(KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
    }
  } catch (_) { /* Storage can be disabled; theme toggle still works. */ }
  // The unit's existing handler runs first; capture its final dark/light state.
  toggle.addEventListener('click', () => {
    try {localStorage.setItem(KEY, document.body.classList.contains('dark') ? 'dark' : 'light');}
    catch (_) {}
  });
  // If another tab changes the theme, keep this page in sync.
  window.addEventListener('storage', e => {
    if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
      document.body.classList.toggle('dark', e.newValue === 'dark');
    }
  });
})();
