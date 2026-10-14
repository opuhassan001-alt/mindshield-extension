/**
 * MindShield Content Script Loader
 * Allows native ES module imports in Chrome Extension Manifest V3
 */
(async () => {
  try {
    const scriptUrl = chrome.runtime.getURL('src/content/content-script.js');
    await import(scriptUrl);
  } catch (err) {
    console.error('[MindShield] Failed to load content module:', err);
  }
})();
