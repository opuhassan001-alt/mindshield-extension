import { StateManager } from '../core/state-manager.js';
import { generateChallenge, verifyAnswer } from '../core/challenge-engine.js';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../core/config.js';

const stateManager = new StateManager();
let activeChallenge = null;

async function getRecentChallengeSignatures() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return [];
  try {
    const key = STORAGE_KEYS.RECENT_CHALLENGES || 'mindshield_recent_challenges';
    const data = await chrome.storage.local.get([key]);
    return Array.isArray(data[key]) ? data[key] : [];
  } catch (e) {
    return [];
  }
}

async function recordRecentChallengeSignature(signature) {
  if (!signature || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  try {
    const key = STORAGE_KEYS.RECENT_CHALLENGES || 'mindshield_recent_challenges';
    const current = await getRecentChallengeSignatures();
    const updated = [signature, ...current.filter(s => s !== signature)].slice(0, 30);
    await chrome.storage.local.set({ [key]: updated });
  } catch (e) {
    // Non-blocking
  }
}

async function updateBadge() {
  if (typeof chrome === 'undefined' || !chrome.action) return;

  const state = await stateManager.getState();
  const config = await stateManager.getConfig();

  if (state.cooldownEndTime && Date.now() < state.cooldownEndTime) {
    chrome.action.setBadgeText({ text: '🛑' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else if (state.isBlocked) {
    chrome.action.setBadgeText({ text: 'LOCK' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
  } else if (state.reelCount > 0) {
    chrome.action.setBadgeText({ text: `${state.reelCount}/${config.reelLimit}` });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(async () => {
  await stateManager.init();
  updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await stateManager.init();
  updateBadge();
});

// Handle incoming messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      await stateManager.init();
      const config = await stateManager.getConfig();
      const state = await stateManager.getState();

      switch (request.action) {
      case 'CHECK_STATUS': {
        const cooldown = await stateManager.checkCooldownStatus();
        const lastFailedChallenge = await stateManager.getLastFailedChallenge();
        if (cooldown.isCooldown) {
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: true,
            remainingSeconds: cooldown.remainingSeconds,
            lastFailedChallenge,
            reelCount: state.reelCount,
            config
          });
        }

        // Check dual limit threshold (Reels count >= 10 OR Elapsed time >= 15 min)
        const sessionStatus = await stateManager.checkSessionStatus();
        if (sessionStatus.isBlocked) {
          if (!activeChallenge) {
            const recentSignatures = await getRecentChallengeSignatures();
            activeChallenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
            if (activeChallenge && activeChallenge.signature) {
              await recordRecentChallengeSignature(activeChallenge.signature);
            }
          }
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: false,
            challenge: activeChallenge,
            failedAttempts: state.failedAttempts,
            maxAttempts: config.maxFailedAttempts,
            reelCount: sessionStatus.reelCount,
            elapsedMinutes: sessionStatus.elapsedMinutes,
            reason: sessionStatus.reason,
            config
          });
        }

        await updateBadge();
        return sendResponse({
          isBlocked: false,
          isCooldown: false,
          reelCount: sessionStatus.reelCount,
          elapsedMinutes: sessionStatus.elapsedMinutes,
          config
        });
      }

      case 'REEL_SCROLLED': {
        const result = await stateManager.recordReelView();
        if (result.shouldBlock && !result.isCooldown) {
          const recentSignatures = await getRecentChallengeSignatures();
          activeChallenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
          if (activeChallenge && activeChallenge.signature) {
            await recordRecentChallengeSignature(activeChallenge.signature);
          }
        }
        await updateBadge();
        return sendResponse({
          ...result,
          challenge: activeChallenge,
          failedAttempts: state.failedAttempts,
          maxAttempts: config.maxFailedAttempts
        });
      }

      case 'SUBMIT_CHALLENGE': {
        if (!activeChallenge) {
          const recentSignatures = await getRecentChallengeSignatures();
          activeChallenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
          if (activeChallenge && activeChallenge.signature) {
            await recordRecentChallengeSignature(activeChallenge.signature);
          }
        }

        const isCorrect = verifyAnswer(activeChallenge, request.answer);
        const attemptResult = await stateManager.recordChallengeAttempt(isCorrect, activeChallenge);

        if (attemptResult.unlocked) {
          activeChallenge = null;
        }

        await updateBadge();
        return sendResponse({
          unlocked: attemptResult.unlocked,
          cooldownTriggered: attemptResult.cooldownTriggered,
          remainingSeconds: attemptResult.cooldownEndTime ? Math.ceil((attemptResult.cooldownEndTime - Date.now()) / 1000) : 0,
          failedAttempts: attemptResult.failedAttempts || 0,
          maxAttempts: config.maxFailedAttempts,
          lastFailedChallenge: attemptResult.lastFailedChallenge || activeChallenge
        });
      }

      case 'START_COOLDOWN': {
        const challengeToSave = request.failedChallenge || activeChallenge;
        const { cooldownEndTime, remainingSeconds, lastFailedChallenge } = await stateManager.startCooldown(null, challengeToSave);
        activeChallenge = null;
        await updateBadge();
        return sendResponse({ cooldownEndTime, remainingSeconds, lastFailedChallenge });
      }

      case 'GET_POPUP_DATA': {
        const cooldown = await stateManager.checkCooldownStatus();
        const sessionStatus = await stateManager.checkSessionStatus();
        const stats = await stateManager.getStats();
        const lastFailedChallenge = await stateManager.getLastFailedChallenge();
        return sendResponse({
          state,
          config,
          stats,
          isCooldown: cooldown.isCooldown,
          remainingSeconds: cooldown.remainingSeconds,
          elapsedMinutes: sessionStatus.elapsedMinutes || 0,
          timeLimitMinutes: config.timeLimitMinutes || 15,
          lastFailedChallenge
        });
      }

      case 'RESET_SESSION': {
        await stateManager.resetSession();
        activeChallenge = null;
        await updateBadge();
        return sendResponse({ success: true });
      }

      default:
        return sendResponse({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('[MindShield BG] Error handling message:', err);
    sendResponse({ error: err.message });
  }
})();

return true; // Keep message channel open for async response
});
