/**
 * Platform URL and Video Detector for MindShield
 */

const PATTERNS = [
  {
    platform: 'instagram',
    regex: /^https?:\/\/(?:www\.)?instagram\.com\/(?:reels|reel)(?:\/([A-Za-z0-9_-]*))?/i
  },
  {
    platform: 'youtube',
    regex: /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i
  },
  {
    platform: 'facebook',
    regex: /^https?:\/\/(?:www\.)?facebook\.com\/(?:reel\/|watch\/\?v=)([0-9]+)/i
  },
  {
    platform: 'tiktok',
    regex: /^https?:\/\/(?:www\.)?tiktok\.com\/(?:@[^/]+\/video\/(\d+)|foryou)/i
  },
  {
    platform: 'test-playground',
    regex: /(?:playground\.html|\?test=reels)/i
  }
];

/**
 * Checks if a URL points to a reel/short-form video feed
 */
export function isReelsUrl(url) {
  if (!url) return { match: false, platform: null };

  for (const { platform, regex } of PATTERNS) {
    if (regex.test(url)) {
      return { match: true, platform };
    }
  }

  return { match: false, platform: null };
}

/**
 * Get the platform name from URL
 */
export function getPlatformFromUrl(url) {
  return isReelsUrl(url).platform;
}

/**
 * Extract Reel / Video ID from URL if available
 */
export function getReelIdFromUrl(url) {
  if (!url) return null;

  for (const { regex } of PATTERNS) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Finds and pauses all video elements playing on the page
 */
export function pauseAllMedia() {
  if (typeof document === 'undefined') return;

  const videos = document.querySelectorAll('video');
  videos.forEach(v => {
    try {
      if (!v.paused) {
        v.pause();
        v.currentTime = v.currentTime; // Freeze frame
      }
    } catch (e) {
      // Audio or security restriction
    }
  });
}
