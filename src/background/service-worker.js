import { StateManager } from '../core/state-manager.js';
import { generateChallenge, verifyAnswer } from '../core/challenge-engine.js';
import { DEFAULT_CONFIG } from '../core/config.js';

const stateManager = new StateManager();
let activeChallenge = null;

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
    await stateManager.init();
    const config = await stateManager.getConfig();
    const state = await stateManager.getState();

    switch (request.action) {
      case 'CHECK_STATUS': {
        const cooldown = await stateManager.checkCooldownStatus();
        if (cooldown.isCooldown) {
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: true,
            remainingSeconds: cooldown.remainingSeconds
          });
        }

        if (state.isBlocked) {
          if (!activeChallenge) {
            activeChallenge = generateChallenge(config.challengeType, config.difficulty);
          }
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: false,
            challenge: activeChallenge,
            failedAttempts: state.failedAttempts,
            maxAttempts: config.maxFailedAttempts
          });
        }

        await updateBadge();
        return sendResponse({
          isBlocked: false,
          isCooldown: false,
          reelCount: state.reelCount,
          config
        });
      }

      case 'REEL_SCROLLED': {
        const result = await stateManager.recordReelView();
        if (result.shouldBlock && !result.isCooldown) {
          activeChallenge = generateChallenge(config.challengeType, config.difficulty);
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
          activeChallenge = generateChallenge(config.challengeType, config.difficulty);
        }

        const isCorrect = verifyAnswer(activeChallenge, request.answer);
        const attemptResult = await stateManager.recordChallengeAttempt(isCorrect);

        if (attemptResult.unlocked) {
          activeChallenge = null;
        }

        await updateBadge();
        return sendResponse({
          unlocked: attemptResult.unlocked,
          cooldownTriggered: attemptResult.cooldownTriggered,
          remainingSeconds: attemptResult.cooldownEndTime ? Math.ceil((attemptResult.cooldownEndTime - Date.now()) / 1000) : 0,
          failedAttempts: attemptResult.failedAttempts || 0,
          maxAttempts: config.maxFailedAttempts
        });
      }

      case 'START_COOLDOWN': {
        const { cooldownEndTime, remainingSeconds } = await stateManager.startCooldown();
        activeChallenge = null;
        await updateBadge();
        return sendResponse({ cooldownEndTime, remainingSeconds });
      }

      case 'GET_POPUP_DATA': {
        const cooldown = await stateManager.checkCooldownStatus();
        const stats = await stateManager.getStats();
        return sendResponse({
          state,
          config,
          stats,
          isCooldown: cooldown.isCooldown,
          remainingSeconds: cooldown.remainingSeconds
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
  })();

  return true; // Keep message channel open for async response
});
