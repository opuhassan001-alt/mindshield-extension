/**
 * MindShield Content Script
 * Monitors short-form video consumption on Instagram, YouTube, Facebook, and TikTok.
 */

import { isReelsUrl, pauseAllMedia, getReelIdFromUrl } from '../core/detector.js';
import { OverlayManager } from './overlay.js';

let currentReelId = null;
let reelTimer = null;
let currentChallenge = null;
let overlayManager = new OverlayManager();

function log(...args) {
  console.log('[MindShield]', ...args);
}

/**
 * Send typed message to background service worker
 */
function sendMessageToBg(message) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(message, (res) => {
        resolve(res || {});
      });
    } else {
      resolve({});
    }
  });
}

/**
 * Handle UI display when blocked
 */
function handleLock(res) {
  pauseAllMedia();

  if (res.isCooldown) {
    overlayManager.showCooldown(res.remainingSeconds, () => {
      overlayManager.removeOverlay();
      checkCurrentStatus();
    }, res.lastFailedChallenge);
    return;
  }

  currentChallenge = res.challenge;
  if (!currentChallenge) return;

  overlayManager.showChallenge({
    challenge: currentChallenge,
    currentAttempts: res.failedAttempts || 0,
    maxAttempts: res.maxAttempts || 3,
    reason: res.reason,
    onSubmit: async (answer) => {
      const response = await sendMessageToBg({
        action: 'SUBMIT_CHALLENGE',
        challengeId: currentChallenge.id,
        answer: answer
      });

      if (response.unlocked) {
        overlayManager.celebrateAndClose(() => {
          currentChallenge = null;
          log('Challenge passed! Reels temporarily unlocked.');
        });
      } else if (response.cooldownTriggered) {
        overlayManager.showCooldown(response.remainingSeconds, () => {
          overlayManager.removeOverlay();
          checkCurrentStatus();
        }, response.lastFailedChallenge || currentChallenge);
      } else {
        overlayManager.showErrorFeedback('Incorrect answer, try again!', (response.maxAttempts || 3) - response.failedAttempts);
      }
    },
    onGiveUp: async () => {
      const response = await sendMessageToBg({
        action: 'START_COOLDOWN',
        failedChallenge: currentChallenge
      });
      overlayManager.showCooldown(response.remainingSeconds, () => {
        overlayManager.removeOverlay();
        checkCurrentStatus();
      }, currentChallenge);
    }
  });
}

/**
 * Checks overall status on initial load or navigation
 */
async function checkCurrentStatus() {
  const urlCheck = isReelsUrl(window.location.href);
  if (!urlCheck.match) {
    overlayManager.removeOverlay();
    return;
  }

  const res = await sendMessageToBg({
    action: 'CHECK_STATUS',
    url: window.location.href,
    platform: urlCheck.platform
  });

  if (res.isBlocked || res.isCooldown) {
    handleLock(res);
  } else {
    overlayManager.removeOverlay();
  }
}

/**
 * Triggered when a new reel is identified
 */
async function onNewReelDetected(reelId) {
  if (reelId === currentReelId) return;
  currentReelId = reelId;

  // Clear any existing dwell timer
  if (reelTimer) {
    clearTimeout(reelTimer);
  }

  // Count reel after 2.5 seconds of dwell time (prevents false counting on fast skips)
  reelTimer = setTimeout(async () => {
    const urlCheck = isReelsUrl(window.location.href);
    if (!urlCheck.match) return;

    log(`Reel counted: ${reelId || 'next_reel'}`);
    const res = await sendMessageToBg({
      action: 'REEL_SCROLLED',
      url: window.location.href,
      platform: urlCheck.platform
    });

    if (res.shouldBlock || res.isCooldown) {
      handleLock(res);
    }
  }, 2500);
}

/**
 * Watch DOM mutations and URL changes
 */
function initUrlObserver() {
  let lastUrl = window.location.href;

  const checkUrl = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      const reelId = getReelIdFromUrl(currentUrl) || currentUrl;
      onNewReelDetected(reelId);
      checkCurrentStatus();
    }
  };

  // Wrap pushState and replaceState for SPA routing
  const wrapHistory = (type) => {
    const orig = history[type];
    return function (...args) {
      const rv = orig.apply(this, args);
      window.dispatchEvent(new Event('ms-location-change'));
      return rv;
    };
  };
  history.pushState = wrapHistory('pushState');
  history.replaceState = wrapHistory('replaceState');

  window.addEventListener('popstate', checkUrl);
  window.addEventListener('ms-location-change', checkUrl);

  const observer = new MutationObserver(() => {
    checkUrl();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
}

// Initialize script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initUrlObserver();
    checkCurrentStatus();
  });
} else {
  initUrlObserver();
  checkCurrentStatus();
}
