/**
 * MindShield Popup Controller
 */

import { startSoundscape, stopSoundscape, isPlaying } from '../core/focus-soundscapes.js';

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
    if (!res) return;

    const { state, config, stats, isCooldown, remainingSeconds } = res;

    // Daily Stats
    document.getElementById('stat-reels-today').textContent = stats.totalReelsToday || 0;
    document.getElementById('stat-challenges-today').textContent = stats.challengesSolvedToday || 0;

    // Session Progress
    const reelLimit = config.reelLimit || 5;
    const currentCount = state.reelCount || 0;
    document.getElementById('session-ratio').textContent = `${currentCount} / ${reelLimit}`;

    const percent = Math.min(100, Math.round((currentCount / reelLimit) * 100));
    document.getElementById('progress-fill').style.width = `${percent}%`;

    const remaining = Math.max(0, reelLimit - currentCount);
    const statusText = remaining > 0
      ? `${remaining} reel${remaining > 1 ? 's' : ''} until brain interruption`
      : 'Limit reached! Brain challenge active';
    document.getElementById('session-status-text').textContent = statusText;

    // Cooldown Card
    const cooldownCard = document.getElementById('cooldown-card');
    const cooldownTime = document.getElementById('cooldown-time');

    if (isCooldown && remainingSeconds > 0) {
      cooldownCard.classList.remove('hidden');
      cooldownTime.textContent = formatTime(remainingSeconds);

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
    }
  });
}

// Button actions
document.getElementById('btn-manual-break')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'START_COOLDOWN' }, () => {
    loadData();
  });
});

document.getElementById('btn-reset-session')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'RESET_SESSION' }, () => {
    loadData();
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

document.addEventListener('DOMContentLoaded', loadData);
