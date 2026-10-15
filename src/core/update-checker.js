/**
 * MindShield Update Checker
 * Checks GitHub Releases API periodically (cached 24h) to notify users of new versions.
 */
export async function checkForUpdates(currentVersion = '1.0.2') {
  const GITHUB_REPO = 'opuhassan001-alt/mindshield-extension';
  const CACHE_KEY = 'mindshield_update_check';
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const cached = await chrome.storage.local.get([CACHE_KEY]);
      const now = Date.now();
      if (cached[CACHE_KEY] && (now - cached[CACHE_KEY].timestamp < ONE_DAY_MS)) {
        return cached[CACHE_KEY].result;
      }
    }

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!res.ok) return null;

    const data = await res.json();
    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    const hasUpdate = Boolean(latestVersion && latestVersion !== currentVersion);

    const result = {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      releaseName: data.name || `v${latestVersion}`
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        [CACHE_KEY]: {
          timestamp: Date.now(),
          result
        }
      });
    }

    return result;
  } catch (err) {
    return null;
  }
}
