/**
 * MindShield Popup Controller
 */

import { startSoundscape, stopSoundscape, isPlaying } from '../core/focus-soundscapes.js';
import { getAngerMood } from '../core/anger-mood.js';
import { checkForUpdates } from '../core/update-checker.js';

async function checkVersion() {
  const updateBadge = document.getElementById('popup-update-badge');
  if (!updateBadge) return;

  try {
    const info = await checkForUpdates('1.0.2');
    if (info && info.hasUpdate) {
      updateBadge.textContent = `🚀 Update v${info.latestVersion}!`;
      updateBadge.classList.add('has-update');
      updateBadge.title = `A new version (v${info.latestVersion}) is available on GitHub! Click to download.`;
      if (info.releaseUrl) updateBadge.href = info.releaseUrl;
    } else {
      updateBadge.textContent = 'Up to date ✓';
      updateBadge.classList.remove('has-update');
      updateBadge.title = 'You are running the latest version of MindShield.';
    }
  } catch (e) {
    updateBadge.textContent = 'v1.0.2';
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadData() {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }

  chrome.runtime.sendMessage({ action: 'GET_POPUP_DATA' }, (res) => {
    if (chrome.runtime.lastError || !res) return;

    const { state, config, stats, isCooldown, remainingSeconds } = res;

    // Daily Stats
    document.getElementById('stat-reels-today').textContent = stats.totalReelsToday || 0;
    document.getElementById('stat-challenges-today').textContent = stats.challengesSolvedToday || 0;

    // Session Progress
    const reelLimit = config.reelLimit || 10;
    const currentCount = state.reelCount || 0;
    document.getElementById('session-ratio').textContent = `${currentCount} / ${reelLimit}`;

    // Dynamic Anger & Focus Avatar
    const moodInfo = getAngerMood({
      reelCount: currentCount,
      reelLimit,
      elapsedMinutes: res.elapsedMinutes || 0,
      timeLimitMinutes: (config && config.timeLimitMinutes) || 15,
      isBlocked: state.isBlocked,
      isCooldown
    });

    const emojiEl = document.getElementById('popup-avatar-emoji');
    const moodTitleEl = document.getElementById('popup-mood-title');
    const moodBadgeEl = document.getElementById('popup-mood-badge');
    const moodQuoteEl = document.getElementById('popup-mood-quote');

    if (emojiEl) emojiEl.textContent = moodInfo.emoji;
    if (moodTitleEl) moodTitleEl.textContent = moodInfo.bengali;
    if (moodBadgeEl) {
      moodBadgeEl.textContent = moodInfo.mood;
      moodBadgeEl.style.color = moodInfo.color;
    }
    if (moodQuoteEl) moodQuoteEl.textContent = moodInfo.quote;

    const fillEl = document.getElementById('progress-fill');
    if (fillEl) {
      fillEl.style.width = `${moodInfo.percent}%`;
      fillEl.style.background = moodInfo.color;
    }

    const remaining = Math.max(0, reelLimit - currentCount);
    const statusText = remaining > 0
      ? `${remaining} reel${remaining > 1 ? 's' : ''} left • ${res.elapsedMinutes || 0}m watched`
      : 'Limit reached! Brain challenge active';
    document.getElementById('session-status-text').textContent = statusText;

    // Cooldown Card
    const cooldownCard = document.getElementById('cooldown-card');
    const cooldownTime = document.getElementById('cooldown-time');
    const solutionBox = document.getElementById('popup-solution-box');

    if (isCooldown && remainingSeconds > 0) {
      cooldownCard.classList.remove('hidden');
      cooldownTime.textContent = formatTime(remainingSeconds);

      if (res.lastFailedChallenge && res.lastFailedChallenge.question) {
        solutionBox.classList.remove('hidden');
        document.getElementById('popup-solution-q').textContent = res.lastFailedChallenge.question;
        document.getElementById('popup-solution-ans').textContent = res.lastFailedChallenge.answer;
        document.getElementById('popup-solution-exp').textContent = res.lastFailedChallenge.explanation || '';
      } else {
        solutionBox.classList.add('hidden');
      }

      let currentSecs = remainingSeconds;
      const interval = setInterval(() => {
        currentSecs -= 1;
        if (currentSecs <= 0) {
          clearInterval(interval);
          cooldownCard.classList.add('hidden');
          loadData();
        } else {
          cooldownTime.textContent = formatTime(currentSecs);
        }
      }, 1000);
    } else {
      cooldownCard.classList.add('hidden');
      solutionBox.classList.add('hidden');
    }
  });
}

// Button actions
document.getElementById('btn-manual-break')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'START_COOLDOWN' }, () => {
    if (!chrome.runtime.lastError) loadData();
  });
});

document.getElementById('btn-reset-session')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'RESET_SESSION' }, () => {
    if (!chrome.runtime.lastError) loadData();
  });
});

// Focus Audio Player logic in popup
const audioToggleBtn = document.getElementById('popup-audio-toggle-btn');
const audioSelect = document.getElementById('popup-soundscape-select');
const audioBadge = document.getElementById('popup-audio-badge');

if (audioToggleBtn && audioSelect) {
  audioToggleBtn.addEventListener('click', () => {
    if (isPlaying()) {
      stopSoundscape();
      audioToggleBtn.textContent = '▶ Play';
      audioToggleBtn.classList.remove('playing');
      if (audioBadge) {
        audioBadge.textContent = 'Off';
        audioBadge.classList.remove('playing');
      }
    } else {
      startSoundscape(audioSelect.value, 0.45);
      audioToggleBtn.textContent = '⏹ Stop';
      audioToggleBtn.classList.add('playing');
      if (audioBadge) {
        audioBadge.textContent = 'Playing 🎧';
        audioBadge.classList.add('playing');
      }
    }
  });

  audioSelect.addEventListener('change', () => {
    if (isPlaying()) {
      startSoundscape(audioSelect.value, 0.45);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  checkVersion();
});
