import { DEFAULT_CONFIG, STORAGE_KEYS } from '../core/config.js';

async function loadOptions() {
  let config = { ...DEFAULT_CONFIG };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
    if (stored[STORAGE_KEYS.CONFIG]) {
      config = { ...config, ...stored[STORAGE_KEYS.CONFIG] };
    }
  }

  document.getElementById('reelLimit').value = config.reelLimit;
  document.getElementById('timeLimitMinutes').value = config.timeLimitMinutes;
  document.getElementById('cooldownMinutes').value = config.cooldownMinutes;
  document.getElementById('maxFailedAttempts').value = config.maxFailedAttempts;
  document.getElementById('challengeType').value = config.challengeType;
  document.getElementById('difficulty').value = config.difficulty;

  document.getElementById('plat-instagram').checked = config.platforms.instagram;
  document.getElementById('plat-youtube').checked = config.platforms.youtube;
  document.getElementById('plat-facebook').checked = config.platforms.facebook;
  document.getElementById('plat-tiktok').checked = config.platforms.tiktok;
}

async function saveOptions(e) {
  e.preventDefault();

  const newConfig = {
    reelLimit: parseInt(document.getElementById('reelLimit').value, 10) || 5,
    timeLimitMinutes: parseInt(document.getElementById('timeLimitMinutes').value, 10) || 10,
    cooldownMinutes: parseInt(document.getElementById('cooldownMinutes').value, 10) || 30,
    maxFailedAttempts: parseInt(document.getElementById('maxFailedAttempts').value, 10) || 3,
    challengeType: document.getElementById('challengeType').value,
    difficulty: document.getElementById('difficulty').value,
    platforms: {
      instagram: document.getElementById('plat-instagram').checked,
      youtube: document.getElementById('plat-youtube').checked,
      facebook: document.getElementById('plat-facebook').checked,
      tiktok: document.getElementById('plat-tiktok').checked
    }
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: newConfig });
  }

  const msg = document.getElementById('save-msg');
  msg.textContent = '✓ Preferences saved successfully!';
  setTimeout(() => {
    msg.textContent = '';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('settings-form').addEventListener('submit', saveOptions);
