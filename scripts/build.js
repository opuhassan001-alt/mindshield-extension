/**
 * MindShield Build Script
 * Bundles modular ES code into standalone, zero-dependency distribution files
 * for Chrome Extension Manifest V3 (immune to web page CSP).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('[MindShield Builder] Starting build...');

// --- 1. BUILD BACKGROUND BUNDLE ---
const challengeEngineRaw = fs.readFileSync(path.resolve(rootDir, 'src/core/challenge-engine.js'), 'utf8');
const challengeEngineCode = challengeEngineRaw
  .replace(/^export const /gm, 'const ')
  .replace(/^export function /gm, 'function ')
  .replace(/^export default /gm, '');

const bgPrefix = `/**
 * MindShield Background Service Worker (Bundled)
 * Handles state management, badge counters, challenge generation & validation,
 * solution persistence, and cooldown timer enforcement.
 */

// --- CONFIGURATION ---
const DEFAULT_CONFIG = {
  reelLimit: 10,
  timeLimitMinutes: 15,
  cooldownMinutes: 30,
  challengeType: 'random', // 'math', 'sequence', 'stroop', 'logic', 'matrix', 'iba_bcs', 'game_logic', 'random'
  difficulty: 'insane',    // 'easy', 'medium', 'hard', 'insane'
  soundEnabled: true,
  maxFailedAttempts: 3,
  ageMode: 'all_ages'
};

const STORAGE_KEYS = {
  CONFIG: 'mindshield_config',
  STATE: 'mindshield_state',
  STATS: 'mindshield_stats',
  ACTIVE_CHALLENGE: 'mindshield_active_challenge',
  LAST_FAILED_CHALLENGE: 'mindshield_last_failed_challenge',
  RECENT_CHALLENGES: 'mindshield_recent_challenges'
};

// --- CHALLENGE ENGINE (HIGH-STANDARD IBA/BCS/CRT & ANTI-REPETITION) ---
`;

const bgSuffix = `
// --- STATE MANAGER ---
class StateManager {
  constructor() {
    this.storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
    this.config = { ...DEFAULT_CONFIG };
    this.state = {
      reelCount: 0,
      sessionStartTime: Date.now(),
      isBlocked: false,
      cooldownEndTime: null,
      failedAttempts: 0,
      lastFailedChallenge: null
    };
    this.stats = {
      date: new Date().toISOString().slice(0, 10),
      totalReelsToday: 0,
      challengesSolvedToday: 0,
      cooldownsTriggeredToday: 0
    };
  }

  async init() {
    if (!this.storage) return;
    try {
      const stored = await this.storage.get([
        STORAGE_KEYS.CONFIG,
        STORAGE_KEYS.STATE,
        STORAGE_KEYS.STATS
      ]);
      if (stored[STORAGE_KEYS.CONFIG]) {
        this.config = { ...this.config, ...stored[STORAGE_KEYS.CONFIG] };
      }
      if (stored[STORAGE_KEYS.STATE]) {
        this.state = { ...this.state, ...stored[STORAGE_KEYS.STATE] };
      }
      const today = new Date().toISOString().slice(0, 10);
      if (stored[STORAGE_KEYS.STATS]) {
        if (stored[STORAGE_KEYS.STATS].date === today) {
          this.stats = stored[STORAGE_KEYS.STATS];
        } else {
          this.stats = {
            date: today,
            totalReelsToday: 0,
            challengesSolvedToday: 0,
            cooldownsTriggeredToday: 0
          };
          await this._persistStats();
        }
      }
      await this.checkCooldownStatus();
    } catch (err) {
      console.error('[MindShield BG] Error initializing state:', err);
    }
  }

  async _persistState() {
    if (!this.storage) return;
    await this.storage.set({ [STORAGE_KEYS.STATE]: this.state });
  }

  async _persistStats() {
    if (!this.storage) return;
    await this.storage.set({ [STORAGE_KEYS.STATS]: this.stats });
  }

  async _persistConfig() {
    if (!this.storage) return;
    await this.storage.set({ [STORAGE_KEYS.CONFIG]: this.config });
  }

  async getState() {
    await this.checkCooldownStatus();
    return { ...this.state };
  }

  async getStats() {
    return { ...this.stats };
  }

  async getConfig() {
    return { ...this.config };
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this._persistConfig();
    return this.config;
  }

  async checkCooldownStatus() {
    if (this.state.cooldownEndTime) {
      const now = Date.now();
      if (now < this.state.cooldownEndTime) {
        const remainingSeconds = Math.ceil((this.state.cooldownEndTime - now) / 1000);
        return { isCooldown: true, remainingSeconds };
      } else {
        this.state.cooldownEndTime = null;
        this.state.isBlocked = false;
        this.state.reelCount = 0;
        this.state.failedAttempts = 0;
        this.state.sessionStartTime = Date.now();
        await this._persistState();
        return { isCooldown: false, remainingSeconds: 0 };
      }
    }
    return { isCooldown: false, remainingSeconds: 0 };
  }

  async checkSessionStatus() {
    const cooldown = await this.checkCooldownStatus();
    if (cooldown.isCooldown) {
      return {
        isBlocked: true,
        isCooldown: true,
        remainingSeconds: cooldown.remainingSeconds,
        reelCount: this.state.reelCount
      };
    }

    const elapsedMinutes = (Date.now() - this.state.sessionStartTime) / (1000 * 60);
    const hitReelLimit = this.state.reelCount >= this.config.reelLimit;
    const hitTimeLimit = elapsedMinutes >= this.config.timeLimitMinutes;

    if (hitReelLimit || hitTimeLimit) {
      this.state.isBlocked = true;
      await this._persistState();
      return {
        isBlocked: true,
        isCooldown: false,
        reason: hitReelLimit ? 'reel_limit' : 'time_limit',
        reelCount: this.state.reelCount,
        elapsedMinutes: Math.floor(elapsedMinutes),
        timeLimitMinutes: this.config.timeLimitMinutes || 15
      };
    }

    return {
      isBlocked: false,
      isCooldown: false,
      reelCount: this.state.reelCount,
      elapsedMinutes: Math.floor(elapsedMinutes),
      timeLimitMinutes: this.config.timeLimitMinutes || 15
    };
  }

  async recordReelView() {
    const cooldown = await this.checkCooldownStatus();
    if (cooldown.isCooldown) {
      return {
        reelCount: this.state.reelCount,
        elapsedMinutes: 0,
        timeLimitMinutes: this.config.timeLimitMinutes || 15,
        shouldBlock: true,
        isCooldown: true,
        remainingSeconds: cooldown.remainingSeconds
      };
    }

    this.state.reelCount += 1;
    this.stats.totalReelsToday += 1;

    const elapsedMinutes = (Date.now() - this.state.sessionStartTime) / (1000 * 60);
    const hitReelLimit = this.state.reelCount >= this.config.reelLimit;
    const hitTimeLimit = elapsedMinutes >= this.config.timeLimitMinutes;
    const shouldBlock = hitReelLimit || hitTimeLimit;

    if (shouldBlock) {
      this.state.isBlocked = true;
    }

    await this._persistState();
    await this._persistStats();

    return {
      reelCount: this.state.reelCount,
      elapsedMinutes: Math.floor(elapsedMinutes),
      timeLimitMinutes: this.config.timeLimitMinutes || 15,
      shouldBlock,
      isCooldown: false,
      reason: hitReelLimit ? 'reel_limit' : hitTimeLimit ? 'time_limit' : null
    };
  }

  async startCooldown(durationMinutes = null, failedChallenge = null) {
    const mins = durationMinutes || this.config.cooldownMinutes || 30;
    const cooldownEndTime = Date.now() + (mins * 60 * 1000);
    this.state.cooldownEndTime = cooldownEndTime;
    this.state.isBlocked = true;
    this.state.reelCount = 0;
    this.stats.cooldownsTriggeredToday += 1;

    if (failedChallenge) {
      this.state.lastFailedChallenge = {
        question: failedChallenge.question,
        answer: failedChallenge.answer,
        explanation: failedChallenge.explanation,
        title: failedChallenge.title,
        hint: failedChallenge.hint
      };
    }

    await this._persistState();
    await this._persistStats();
    return {
      cooldownEndTime,
      remainingSeconds: mins * 60,
      lastFailedChallenge: this.state.lastFailedChallenge
    };
  }

  async recordChallengeAttempt(success, challenge = null) {
    if (success) {
      this.state.isBlocked = false;
      this.state.reelCount = 0;
      this.state.failedAttempts = 0;
      this.state.lastFailedChallenge = null;
      this.state.sessionStartTime = Date.now();
      this.stats.challengesSolvedToday += 1;
      await this._persistState();
      await this._persistStats();
      return { unlocked: true, cooldownTriggered: false };
    } else {
      this.state.failedAttempts += 1;
      if (this.state.failedAttempts >= this.config.maxFailedAttempts) {
        const { cooldownEndTime, lastFailedChallenge } = await this.startCooldown(null, challenge);
        return {
          unlocked: false,
          cooldownTriggered: true,
          cooldownEndTime,
          failedAttempts: this.state.failedAttempts,
          lastFailedChallenge
        };
      }
      await this._persistState();
      return {
        unlocked: false,
        cooldownTriggered: false,
        failedAttempts: this.state.failedAttempts
      };
    }
  }

  async getLastFailedChallenge() {
    return this.state.lastFailedChallenge || null;
  }

  async resetSession() {
    this.state.reelCount = 0;
    this.state.isBlocked = false;
    this.state.failedAttempts = 0;
    this.state.cooldownEndTime = null;
    this.state.lastFailedChallenge = null;
    this.state.sessionStartTime = Date.now();
    await this._persistState();
  }
}

// --- SERVICE WORKER RUNTIME ---
const stateManager = new StateManager();

async function getStoredChallenge() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  const data = await chrome.storage.local.get([STORAGE_KEYS.ACTIVE_CHALLENGE]);
  return data[STORAGE_KEYS.ACTIVE_CHALLENGE] || null;
}

async function setStoredChallenge(challenge) {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  if (challenge) {
    await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_CHALLENGE]: challenge });
  } else {
    await chrome.storage.local.remove([STORAGE_KEYS.ACTIVE_CHALLENGE]);
  }
}

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
    chrome.action.setBadgeText({ text: state.reelCount + '/' + config.reelLimit });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await stateManager.init();
  await updateBadge();
  console.log('[MindShield] Installed and initialized.');
});

chrome.runtime.onStartup.addListener(async () => {
  await stateManager.init();
  await updateBadge();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      await stateManager.init();
      const config = await stateManager.getConfig();
      let state = await stateManager.getState();

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
          let challenge = await getStoredChallenge();
          if (!challenge) {
            const recentSignatures = await getRecentChallengeSignatures();
            challenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
            if (challenge && challenge.signature) {
              await recordRecentChallengeSignature(challenge.signature);
            }
            await setStoredChallenge(challenge);
          }
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: false,
            challenge,
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
        let challenge = null;

        if (result.shouldBlock && !result.isCooldown) {
          challenge = await getStoredChallenge();
          if (!challenge) {
            const recentSignatures = await getRecentChallengeSignatures();
            challenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
            if (challenge && challenge.signature) {
              await recordRecentChallengeSignature(challenge.signature);
            }
            await setStoredChallenge(challenge);
          }
        }

        await updateBadge();
        state = await stateManager.getState();

        return sendResponse({
          ...result,
          challenge,
          failedAttempts: state.failedAttempts,
          maxAttempts: config.maxFailedAttempts,
          config
        });
      }

      case 'SUBMIT_CHALLENGE': {
        let challenge = await getStoredChallenge();
        if (!challenge) {
          const recentSignatures = await getRecentChallengeSignatures();
          challenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
          if (challenge && challenge.signature) {
            await recordRecentChallengeSignature(challenge.signature);
          }
          await setStoredChallenge(challenge);
        }

        const isCorrect = verifyAnswer(challenge, request.answer);
        const attemptResult = await stateManager.recordChallengeAttempt(isCorrect, challenge);

        if (attemptResult.unlocked) {
          await setStoredChallenge(null);
        }

        await updateBadge();
        return sendResponse({
          unlocked: attemptResult.unlocked,
          cooldownTriggered: attemptResult.cooldownTriggered,
          remainingSeconds: attemptResult.cooldownEndTime ? Math.ceil((attemptResult.cooldownEndTime - Date.now()) / 1000) : 0,
          failedAttempts: attemptResult.failedAttempts || 0,
          maxAttempts: config.maxFailedAttempts,
          lastFailedChallenge: attemptResult.lastFailedChallenge || challenge
        });
      }

      case 'START_COOLDOWN': {
        let challenge = await getStoredChallenge();
        const challengeToSave = request.failedChallenge || challenge;
        const { cooldownEndTime, remainingSeconds, lastFailedChallenge } = await stateManager.startCooldown(null, challengeToSave);
        await setStoredChallenge(null);
        await updateBadge();
        return sendResponse({ cooldownEndTime, remainingSeconds, lastFailedChallenge });
      }

      case 'GET_POPUP_DATA': {
        const cooldown = await stateManager.checkCooldownStatus();
        const sessionStatus = await stateManager.checkSessionStatus();
        const stats = await stateManager.getStats();
        const lastFailedChallenge = await stateManager.getLastFailedChallenge();
        state = await stateManager.getState();
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
        await setStoredChallenge(null);
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

return true;
});

`;

const bgBundleContent = bgPrefix + '\n' + challengeEngineCode + '\n' + bgSuffix;
fs.writeFileSync(path.resolve(distDir, 'background.bundle.js'), bgBundleContent, 'utf8');
console.log('[MindShield Builder] background.bundle.js generated successfully.');

// --- 2. BUILD CONTENT BUNDLE ---
const contentBundleContent = `/**
 * MindShield Content Script Bundle (Standalone - Zero Imports)
 * Injected into Instagram, YouTube Shorts, Facebook, and TikTok.
 * Features:
 *  - Multi-signal Reel & Short Video detection (<video> playback + SPA URL observer)
 *  - Floating live count pill (real-time feedback for the user)
 *  - Scroll trap and full-screen challenge overlay
 *  - Pure Web Audio API focus tones, fanfare, error buzz, and neuro soundscapes
 *  - Missed challenge solution & explanation breakdown on cooldown screen
 */
(() => {
  'use strict';

  // Prevent multiple injections
  if (window.__MINDSHIELD_INJECTED__) return;
  window.__MINDSHIELD_INJECTED__ = true;

  console.log('%c[MindShield] 🛡️ Shield activated on: ' + window.location.hostname, 'background: #1e1b4b; color: #818cf8; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

  // --- 1. REELS PLATFORM DETECTOR ---
  const PATTERNS = [
    {
      platform: 'instagram',
      regex: /^https?:\\/\\/(?:www\\.)?instagram\\.com\\/(?:reels?)(?:\\/([A-Za-z0-9_-]*))?/i
    },
    {
      platform: 'youtube',
      regex: /^https?:\\/\\/(?:www\\.)?youtube\\.com\\/shorts\\/([A-Za-z0-9_-]+)/i
    },
    {
      platform: 'facebook',
      regex: /^https?:\\/\\/(?:www\\.)?facebook\\.com\\/(?:reels?\\/|watch\\/\\?v=)([0-9]+)/i
    },
    {
      platform: 'tiktok',
      regex: /^https?:\\/\\/(?:www\\.)?tiktok\\.com\\/(?:@[^/]+\\/video\\/(\\d+)|foryou)/i
    },
    {
      platform: 'test-playground',
      regex: /(?:playground\\.html|\\?test=reels)/i
    }
  ];

  function isReelsUrl(url) {
    if (!url) return { match: false, platform: null };
    for (const { platform, regex } of PATTERNS) {
      if (regex.test(url)) {
        return { match: true, platform };
      }
    }
    if (/instagram\\.com\\/(?:reel|reels)/i.test(url)) {
      return { match: true, platform: 'instagram' };
    }
    return { match: false, platform: null };
  }

  function getReelIdFromUrl(url) {
    if (!url) return null;
    for (const { regex } of PATTERNS) {
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  function pauseAllMedia() {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach(v => {
        try {
          if (!v.paused) {
            v.pause();
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  // --- 2. AUDIO & FX SYNTHESIZERS ---
  let isMuted = false;

  function setMuted(muted) {
    isMuted = muted;
  }

  function getMuted() {
    return isMuted;
  }

  function getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  }

  function playWarningBell() {
    // Turned off by user request: "ting ting ting ting" sound disabled
    return;
  }

  function playSuccessFanfare() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const startTime = ctx.currentTime + (i * 0.08);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (_) {}
  }

  function playErrorBuzz() {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(140, ctx.currentTime);
      osc2.frequency.setValueAtTime(147, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }

  function launchCelebration(container) {
    if (!container) return;
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('div');
      p.className = 'ms-confetti-particle';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * 360;
      const dist = 80 + Math.random() * 160;
      const size = 6 + Math.random() * 8;
      const spin = (Math.random() - 0.5) * 720;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * dist;
      const ty = Math.sin(rad) * dist;

      p.style.cssText = [
        'position: absolute',
        'left: 50%',
        'top: 50%',
        'width: ' + size + 'px',
        'height: ' + (size * (Math.random() > 0.5 ? 1 : 1.8)) + 'px',
        'background: ' + color,
        'border-radius: ' + (Math.random() > 0.5 ? '50%' : '2px'),
        'pointer-events: none',
        'z-index: 9999',
        '--tx: ' + tx + 'px',
        '--ty: ' + ty + 'px',
        '--spin: ' + spin + 'deg',
        'animation: msBurstParticle 0.7s cubic-bezier(0.1, 0.9, 0.2, 1) forwards'
      ].join(';');

      container.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  // --- 3. NEURO-FOCUS SOUNDSCAPES ---
  const FOCUS_TRACKS = [
    {
      id: 'brown',
      name: 'Deep Brown Noise',
      adhdBenefit: 'Optimal for ADHD focus: raises background neural arousal to reduce dopamine-seeking restlessness.'
    },
    {
      id: 'gamma40',
      name: '40 Hz Gamma Focus Wave',
      adhdBenefit: 'Clinically proven (MIT) to synchronize prefrontal neural circuits for executive processing.'
    },
    {
      id: 'alpha',
      name: '10 Hz Alpha Flow State',
      adhdBenefit: 'Shifts brainwaves away from anxious racing thoughts into calm flow states.'
    },
    {
      id: 'beta',
      name: '16 Hz Beta Analytical Boost',
      adhdBenefit: 'Enhances cognitive speed and analytical problem-solving capability.'
    },
    {
      id: 'pink',
      name: 'Rainfall Pink Noise',
      adhdBenefit: 'Improves sustained task endurance and prevents sensory overload.'
    }
  ];

  let soundscapeCtx = null;
  let currentSoundscapeNodes = [];
  let isSoundActive = false;

  function stopSoundscape() {
    currentSoundscapeNodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (_) {}
    });
    currentSoundscapeNodes = [];
    isSoundActive = false;
  }

  function startSoundscape(trackId = 'brown', volume = 0.45) {
    stopSoundscape();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      if (!soundscapeCtx) soundscapeCtx = new AudioCtx();
      if (soundscapeCtx.state === 'suspended') soundscapeCtx.resume();

      const masterGain = soundscapeCtx.createGain();
      masterGain.gain.setValueAtTime(volume, soundscapeCtx.currentTime);
      masterGain.connect(soundscapeCtx.destination);

      if (trackId === 'brown') {
        const bufferSize = 5 * soundscapeCtx.sampleRate;
        const buffer = soundscapeCtx.createBuffer(1, bufferSize, soundscapeCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] = lastOut * 3.5;
        }
        const noise = soundscapeCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = soundscapeCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, soundscapeCtx.currentTime);
        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        currentSoundscapeNodes.push(noise, filter, masterGain);
      } else if (trackId === 'gamma40') {
        const carrier = soundscapeCtx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(220, soundscapeCtx.currentTime);
        const modulator = soundscapeCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(40, soundscapeCtx.currentTime);
        const modGain = soundscapeCtx.createGain();
        modGain.gain.setValueAtTime(0.5, soundscapeCtx.currentTime);
        const carrierGain = soundscapeCtx.createGain();
        carrierGain.gain.setValueAtTime(0.5, soundscapeCtx.currentTime);
        modulator.connect(modGain);
        modGain.connect(carrierGain.gain);
        carrier.connect(carrierGain);
        carrierGain.connect(masterGain);
        carrier.start();
        modulator.start();
        currentSoundscapeNodes.push(carrier, modulator, carrierGain, modGain, masterGain);
      } else if (trackId === 'alpha' || trackId === 'beta') {
        const beatFreq = trackId === 'alpha' ? 10 : 16;
        const leftOsc = soundscapeCtx.createOscillator();
        const rightOsc = soundscapeCtx.createOscillator();
        leftOsc.type = 'sine';
        rightOsc.type = 'sine';
        leftOsc.frequency.setValueAtTime(210, soundscapeCtx.currentTime);
        rightOsc.frequency.setValueAtTime(210 + beatFreq, soundscapeCtx.currentTime);

        if (soundscapeCtx.createStereoPanner) {
          const leftPan = soundscapeCtx.createStereoPanner();
          leftPan.pan.setValueAtTime(-1, soundscapeCtx.currentTime);
          const rightPan = soundscapeCtx.createStereoPanner();
          rightPan.pan.setValueAtTime(1, soundscapeCtx.currentTime);
          leftOsc.connect(leftPan);
          leftPan.connect(masterGain);
          rightOsc.connect(rightPan);
          rightPan.connect(masterGain);
          currentSoundscapeNodes.push(leftPan, rightPan);
        } else {
          leftOsc.connect(masterGain);
          rightOsc.connect(masterGain);
        }
        leftOsc.start();
        rightOsc.start();
        currentSoundscapeNodes.push(leftOsc, rightOsc, masterGain);
      } else {
        const bufferSize = 5 * soundscapeCtx.sampleRate;
        const buffer = soundscapeCtx.createBuffer(1, bufferSize, soundscapeCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        const noise = soundscapeCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        noise.connect(masterGain);
        noise.start();
        currentSoundscapeNodes.push(noise, masterGain);
      }

      isSoundActive = true;
      return true;
    } catch (e) {
      console.warn('[MindShield] Audio start failed:', e);
      return false;
    }
  }

  // --- 4. OVERLAY MANAGER ---
  class OverlayManager {
    constructor() {
      this.root = null;
      this.cooldownInterval = null;
      this.isScrollTrapped = false;
      this.currentOverlayType = null;
      this.currentChallengeId = null;
      this._handleKeyDown = this._handleKeyDown.bind(this);
      this._handleWheel = this._handleWheel.bind(this);
      this._handleTouch = this._handleTouch.bind(this);
    }

    trapScroll() {
      if (this.isScrollTrapped) return;
      this.isScrollTrapped = true;
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      if (document.body) {
        document.body.style.setProperty('overflow', 'hidden', 'important');
      }
      window.addEventListener('wheel', this._handleWheel, { passive: false, capture: true });
      window.addEventListener('touchmove', this._handleTouch, { passive: false, capture: true });
      window.addEventListener('keydown', this._handleKeyDown, { passive: false, capture: true });
    }

    releaseScroll() {
      if (!this.isScrollTrapped) return;
      this.isScrollTrapped = false;
      document.documentElement.style.removeProperty('overflow');
      if (document.body) {
        document.body.style.removeProperty('overflow');
      }
      window.removeEventListener('wheel', this._handleWheel, { capture: true });
      window.removeEventListener('touchmove', this._handleTouch, { capture: true });
      window.removeEventListener('keydown', this._handleKeyDown, { capture: true });
    }

    _handleWheel(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    _handleTouch(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    _handleKeyDown(e) {
      const blockedKeys = ['Space', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];
      if (blockedKeys.includes(e.code) && e.target && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    getOrCreateRoot() {
      if (!this.root || !document.body.contains(this.root)) {
        this.root = document.createElement('div');
        this.root.id = 'mindshield-overlay-root';
        document.body.appendChild(this.root);
      }
      return this.root;
    }

    removeOverlay() {
      stopSoundscape();
      if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
      if (this.root && this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }
      this.currentOverlayType = null;
      this.currentChallengeId = null;
      this.root = null;
      this.releaseScroll();
    }

    celebrateAndClose(callback) {
      const root = this.getOrCreateRoot();
      const container = root.querySelector('.ms-container');
      if (container) {
        container.classList.add('unlocked');
        launchCelebration(container);
      }
      playSuccessFanfare();
      setTimeout(() => {
        this.removeOverlay();
        if (callback) callback();
      }, 700);
    }

    showChallenge({ challenge, currentAttempts = 0, maxAttempts = 3, reason = 'limit', onSubmit, onGiveUp }) {
      if (this.currentOverlayType === 'challenge' && this.currentChallengeId === challenge.id) {
        return;
      }
      this.currentOverlayType = 'challenge';
      this.currentChallengeId = challenge.id;

      this.trapScroll();
      const root = this.getOrCreateRoot();

      const subtitle = reason === 'time_limit'
        ? 'You have reached your active watching time limit. Engage your mind to unlock.'
        : 'You have reached your reel scroll limit. Wake up your prefrontal cortex!';

      let inputHtml = '';
      if (challenge.inputType === 'choice') {
        inputHtml = '<div class="ms-choices-grid">' +
          challenge.options.map(opt => '<button class="ms-choice-btn" data-val="' + opt + '">' + opt + '</button>').join('') +
          '</div>';
      } else {
        inputHtml = '<div class="ms-input-group">' +
          '<input type="text" class="ms-input" id="ms-answer-input" placeholder="Type your answer..." autocomplete="off" />' +
          '<button class="ms-btn" id="ms-submit-btn">Unlock</button>' +
          '</div>';
      }

      let challengeContent = '';
      if (challenge.type === 'stroop') {
        challengeContent = '<div class="ms-subtitle">' + challenge.instruction + '</div>' +
          '<div class="ms-stroop-word" style="color: ' + challenge.inkColor + ';">' + challenge.word + '</div>';
      } else if (challenge.type === 'matrix') {
        challengeContent = '<div class="ms-subtitle">' + challenge.instruction + '</div>' +
          '<div class="ms-matrix-grid">' + challenge.question + '</div>';
      } else {
        challengeContent = '<div class="ms-subtitle">' + challenge.instruction + '</div>' +
          '<div class="ms-challenge-question">' + challenge.question + '</div>';
      }

      const soundIcon = getMuted() ? '🔇' : '🔊';

      root.innerHTML = [
        '<div class="ms-container">',
        '  <button class="ms-sound-toggle" id="ms-sound-toggle" title="Toggle Sound">' + soundIcon + '</button>',
        '  <div class="ms-badge-header">🤯 রাগ ফাইটে উঠেছে! ⚡ ADHD Mind Interruption</div>',
        '  <h2 class="ms-title">' + challenge.title + '</h2>',
        '  <div class="ms-subtitle">' + subtitle + '</div>',
        '  <div class="ms-card">',
        '    ' + challengeContent,
        '    ' + inputHtml,
        '    <div class="ms-feedback" id="ms-feedback">' + (currentAttempts > 0 ? ('Attempts: ' + currentAttempts + '/' + maxAttempts) : '') + '</div>',
        '  </div>',
        '  <button class="ms-btn ms-btn-secondary" id="ms-giveup-btn">I want a break (Start 30-min Detox Cooldown)</button>',
        '</div>'
      ].join('');

      const feedbackEl = root.querySelector('#ms-feedback');
      const inputEl = root.querySelector('#ms-answer-input');
      const submitBtn = root.querySelector('#ms-submit-btn');
      const giveUpBtn = root.querySelector('#ms-giveup-btn');
      const choiceBtns = root.querySelectorAll('.ms-choice-btn');
      const soundToggleBtn = root.querySelector('#ms-sound-toggle');

      if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
          const nextMuted = !getMuted();
          setMuted(nextMuted);
          soundToggleBtn.textContent = nextMuted ? '🔇' : '🔊';
        });
      }

      if (inputEl) {
        inputEl.focus();
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this._submitAnswer(inputEl.value, onSubmit, feedbackEl);
          }
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          this._submitAnswer(inputEl ? inputEl.value : '', onSubmit, feedbackEl);
        });
      }

      choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this._submitAnswer(btn.getAttribute('data-val'), onSubmit, feedbackEl);
        });
      });

      if (giveUpBtn) {
        giveUpBtn.addEventListener('click', () => {
          if (onGiveUp) onGiveUp();
        });
      }
    }

    _submitAnswer(answer, onSubmit, feedbackEl) {
      if (!answer || answer.trim() === '') {
        if (feedbackEl) {
          feedbackEl.className = 'ms-feedback error';
          feedbackEl.textContent = 'Please enter an answer first!';
          playErrorBuzz();
        }
        return;
      }
      if (onSubmit) onSubmit(answer);
    }

    showErrorFeedback(message, remainingAttempts) {
      const root = this.getOrCreateRoot();
      const feedbackEl = root.querySelector('#ms-feedback');
      if (feedbackEl) {
        feedbackEl.className = 'ms-feedback error';
        feedbackEl.textContent = message + ' (' + remainingAttempts + ' attempts left)';
        playErrorBuzz();
      }
    }

    showCooldown(remainingSeconds, onComplete, solutionInfo = null) {
      if (this.currentOverlayType === 'cooldown') {
        return;
      }
      this.currentOverlayType = 'cooldown';
      this.currentChallengeId = null;

      this.trapScroll();
      if (this.cooldownInterval) clearInterval(this.cooldownInterval);

      const root = this.getOrCreateRoot();
      let timeLeft = remainingSeconds;

      const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      };

      const soundIcon = getMuted() ? '🔇' : '🔊';

      let solutionHtml = '';
      if (solutionInfo && solutionInfo.question) {
        solutionHtml = [
          '<div class="ms-solution-box">',
          '  <div class="ms-solution-header">',
          '    <span>💡 Missed Puzzle Solution & Explanation</span>',
          '    <button type="button" class="ms-solution-toggle-btn" id="ms-solution-toggle-btn">Hide Solution</button>',
          '  </div>',
          '  <div class="ms-solution-body" id="ms-solution-body">',
          '    <div class="ms-sol-row">',
          '      <span class="ms-sol-label">Question:</span>',
          '      <p class="ms-sol-val-q">' + solutionInfo.question + '</p>',
          '    </div>',
          '    <div class="ms-sol-row">',
          '      <span class="ms-sol-label">Correct Answer:</span>',
          '      <span class="ms-sol-val-ans">' + solutionInfo.answer + '</span>',
          '    </div>',
          '    <div class="ms-sol-row">',
          '      <span class="ms-sol-label">Step-by-Step Logic Breakdown:</span>',
          '      <p class="ms-sol-val-exp">' + (solutionInfo.explanation || 'Analyze the underlying patterns to strengthen cognitive control.') + '</p>',
          '    </div>',
          '  </div>',
          '</div>'
        ].join('');
      }

      root.innerHTML = [
        '<div class="ms-container">',
        '  <button class="ms-sound-toggle" id="ms-sound-toggle" title="Toggle Sound">' + soundIcon + '</button>',
        '  <div class="ms-badge-header cooldown">🛑 Dopamine Detox Active</div>',
        '  <h2 class="ms-title">MindShield Cooldown Lock</h2>',
        '  <div class="ms-subtitle">Too many missed challenges or detox session started. Step away from short-form videos to restore dopamine sensitivity.</div>',
        '  <div class="ms-card">',
        '    <div class="ms-cooldown-timer" id="ms-timer-val">' + formatTime(timeLeft) + '</div>',
        '    <div class="ms-breath-circle">Breathe</div>',
        '    <p style="margin: 0; font-size: 13px; color: #cbd5e1;">Reels will unlock automatically when timer expires.</p>',
        '    <div class="ms-focus-soundscape-box">',
        '      <div class="ms-soundscape-header">',
        '        <span>🎧 ADHD Focus Audio (Science-Backed)</span>',
        '        <span class="ms-soundscape-badge" id="ms-soundscape-status">Stopped</span>',
        '      </div>',
        '      <div class="ms-soundscape-controls">',
        '        <select id="ms-soundscape-select" class="ms-soundscape-select">',
        '          <option value="brown">🌊 Deep Brown Noise (ADHD Stochastic Resonance)</option>',
        '          <option value="gamma40">⚡ 40 Hz Gamma Focus Wave (MIT Research)</option>',
        '          <option value="alpha">🧠 10 Hz Alpha Flow State (Calm Alertness)</option>',
        '          <option value="beta">🎯 16 Hz Beta Analytical (Active Thinking)</option>',
        '          <option value="pink">🌧️ Rainfall Pink Noise (Sustained Focus)</option>',
        '        </select>',
        '        <button type="button" id="ms-soundscape-toggle" class="ms-soundscape-btn">▶ Play</button>',
        '      </div>',
        '      <div class="ms-soundscape-desc" id="ms-soundscape-desc">Brown noise raises background neural stochastic resonance to calm dopamine-starved ADHD brains.</div>',
        '    </div>',
        '    ' + solutionHtml,
        '  </div>',
        '  <div class="ms-quote">"The ability to delay gratification is the ultimate superpower in the age of algorithms."</div>',
        '</div>'
      ].join('');

      const timerVal = root.querySelector('#ms-timer-val');
      const soundToggleBtn = root.querySelector('#ms-sound-toggle');
      const soundscapeSelect = root.querySelector('#ms-soundscape-select');
      const soundscapeToggleBtn = root.querySelector('#ms-soundscape-toggle');
      const soundscapeDesc = root.querySelector('#ms-soundscape-desc');
      const soundscapeStatus = root.querySelector('#ms-soundscape-status');
      const solutionToggleBtn = root.querySelector('#ms-solution-toggle-btn');
      const solutionBody = root.querySelector('#ms-solution-body');

      if (solutionToggleBtn && solutionBody) {
        solutionToggleBtn.addEventListener('click', () => {
          const isHidden = solutionBody.classList.toggle('hidden');
          solutionToggleBtn.textContent = isHidden ? 'Show Solution' : 'Hide Solution';
        });
      }

      if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
          const nextMuted = !getMuted();
          setMuted(nextMuted);
          soundToggleBtn.textContent = nextMuted ? '🔇' : '🔊';
        });
      }

      if (soundscapeSelect && soundscapeToggleBtn) {
        soundscapeSelect.addEventListener('change', () => {
          const found = FOCUS_TRACKS.find(t => t.id === soundscapeSelect.value) || FOCUS_TRACKS[0];
          if (soundscapeDesc) soundscapeDesc.textContent = found.adhdBenefit;
          if (isSoundActive) startSoundscape(soundscapeSelect.value, 0.45);
        });

        soundscapeToggleBtn.addEventListener('click', () => {
          if (isSoundActive) {
            stopSoundscape();
            soundscapeToggleBtn.textContent = '▶ Play';
            soundscapeToggleBtn.classList.remove('playing');
            if (soundscapeStatus) {
              soundscapeStatus.textContent = 'Stopped';
              soundscapeStatus.classList.remove('playing');
            }
          } else {
            startSoundscape(soundscapeSelect.value, 0.45);
            soundscapeToggleBtn.textContent = '⏹ Stop';
            soundscapeToggleBtn.classList.add('playing');
            if (soundscapeStatus) {
              soundscapeStatus.textContent = 'Playing 🎧';
              soundscapeStatus.classList.add('playing');
            }
          }
        });
      }

      this.cooldownInterval = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
          stopSoundscape();
          if (timerVal) timerVal.textContent = '00:00';
          playSuccessFanfare();
          if (onComplete) onComplete();
        } else {
          if (timerVal) timerVal.textContent = formatTime(timeLeft);
        }
      }, 1000);
    }
  }

  // --- 5. ANGER MOOD & FOCUS AVATAR ENGINE ---
  const ANGER_TIERS = [
    { level: 0, emoji: '😇', mood: 'Zen Focus', bengali: 'শান্ত মেজাজ', quote: 'Fresh session. Be intentional!', color: '#10b981', className: 'ms-anger-0' },
    { level: 1, emoji: '😎', mood: 'Chill (1st Reel)', bengali: 'মজার মেজাজ (১ম রিল)', quote: 'Just one reel! Enjoying responsibly.', color: '#06b6d4', className: 'ms-anger-1' },
    { level: 2, emoji: '🤨', mood: 'Mild Suspicion', bengali: 'হালকা রাগ (২য় রিল)', quote: 'Hmm... watching another already?', color: '#3b82f6', className: 'ms-anger-2' },
    { level: 3, emoji: '😒', mood: 'Unamused', bengali: 'আরও রাগ (৩য় রিল)', quote: '3 reels in. Dopamine spiral starting.', color: '#8b5cf6', className: 'ms-anger-3' },
    { level: 4, emoji: '😠', mood: 'Irritated', bengali: 'আরও রাগ (৪র্থ রিল)', quote: 'Getting irritated! Put the phone down.', color: '#f59e0b', className: 'ms-anger-4' },
    { level: 5, emoji: '😡', mood: 'Halfway Stern', bengali: 'গম্ভীর রাগ (অর্ধেক শেষ)', quote: '50% dopamine limit breached!', color: '#f97316', className: 'ms-anger-5' },
    { level: 6, emoji: '😤', mood: 'Steaming Mad', bengali: 'ফুঁসছে রাগ (৬ষ্ঠ রিল)', quote: 'Steam from ears! Still scrolling?!', color: '#ea580c', className: 'ms-anger-6' },
    { level: 7, emoji: '🤬', mood: 'Furious Guardian', bengali: 'মারাত্মক ক্ষিপ্ত (৭ম রিল)', quote: 'Why are you doing this to your brain?!', color: '#ef4444', className: 'ms-anger-7' },
    { level: 8, emoji: '👿', mood: 'Danger Zone', bengali: 'চরম বিপদসীমা (৮ম রিল)', quote: 'Red alert! You are losing control.', color: '#dc2626', className: 'ms-anger-8' },
    { level: 9, emoji: '💥', mood: 'Fuse Lit', bengali: 'বিস্ফোরণোন্মুখ (৯ম রিল)', quote: 'Final warning! NEXT REEL WILL LOCK!', color: '#b91c1c', className: 'ms-anger-9' },
    { level: 10, emoji: '🤯', altEmoji: '🌋', mood: 'RAGE EXPLODED!', bengali: 'রাগ ফাইটে উঠেছে! (১০ম রিল/টাইম শেষ)', quote: 'BOOM! Dopamine limit destroyed. LOCK ENGAGED!', color: '#7f1d1d', className: 'ms-anger-10' }
  ];

  const COOLDOWN_TIER = {
    level: -1,
    emoji: '🛑',
    mood: 'Detox Lockout',
    bengali: 'ডোপামিন ডিটক্স মোড',
    quote: 'Step away from the screen and breathe.',
    color: '#ef4444',
    className: 'ms-anger-cooldown'
  };

  function getAngerMood({ reelCount = 0, reelLimit = 10, elapsedMinutes = 0, timeLimitMinutes = 15, isBlocked = false, isCooldown = false }) {
    if (isCooldown) {
      return { ...COOLDOWN_TIER, percent: 100 };
    }
    const reelRatio = reelLimit > 0 ? (reelCount / reelLimit) : 0;
    const timeRatio = timeLimitMinutes > 0 ? (elapsedMinutes / timeLimitMinutes) : 0;

    if (isBlocked || (reelLimit > 0 && reelCount >= reelLimit) || (timeLimitMinutes > 0 && elapsedMinutes >= timeLimitMinutes)) {
      return { ...ANGER_TIERS[10], percent: 100 };
    }

    const reelLevel = Math.min(10, Math.floor(reelCount));
    const timeLevel = Math.min(10, Math.floor(timeRatio * 10));
    const level = Math.min(10, Math.max(0, Math.max(reelLevel, timeLevel)));
    const effectivePercent = Math.min(100, Math.round(Math.max(reelRatio, timeRatio) * 100));

    return {
      ...ANGER_TIERS[level],
      percent: effectivePercent,
      level
    };
  }

  // --- 6. FLOATING LIVE STATUS PILL (DYNAMIC EMOJI ANGER BAR) ---
  class PillManager {
    constructor() {
      this.pill = null;
      this.currentLevel = null;
      this.isMinimized = false;
    }

    getOrCreate() {
      if (!this.pill || !document.body.contains(this.pill)) {
        this.pill = document.createElement('div');
        this.pill.id = 'mindshield-counter-pill';
        this.pill.className = 'ms-pill ms-anger-0';
        this.pill.innerHTML = [
          '<div class="ms-pill-avatar" id="ms-pill-avatar" title="Click to minimize/expand">',
          '  <span class="ms-pill-emoji" id="ms-pill-emoji">😇</span>',
          '</div>',
          '<div class="ms-pill-body" id="ms-pill-body">',
          '  <div class="ms-pill-header">',
          '    <span class="ms-pill-mood-badge" id="ms-pill-mood">শান্ত মেজাজ</span>',
          '    <span class="ms-pill-reels-count" id="ms-pill-count">0 / 10 Reels</span>',
          '  </div>',
          '  <div class="ms-pill-bar-track">',
          '    <div class="ms-pill-bar-fill" id="ms-pill-fill" style="width: 0%;"></div>',
          '  </div>',
          '  <div class="ms-pill-sub-info" id="ms-pill-sub">⏱️ 0m / 15m • Fresh session</div>',
          '</div>',
          '<button type="button" class="ms-pill-toggle-btn" id="ms-pill-toggle" title="Minimize / Expand">◀</button>'
        ].join('');

        const toggleBtn = this.pill.querySelector('#ms-pill-toggle');
        const avatar = this.pill.querySelector('#ms-pill-avatar');
        const toggleHandler = (e) => {
          e.stopPropagation();
          this.isMinimized = !this.isMinimized;
          if (this.isMinimized) {
            this.pill.classList.add('ms-minimized');
            if (toggleBtn) toggleBtn.textContent = '▶';
          } else {
            this.pill.classList.remove('ms-minimized');
            if (toggleBtn) toggleBtn.textContent = '◀';
          }
        };

        if (toggleBtn) toggleBtn.addEventListener('click', toggleHandler);
        if (avatar) avatar.addEventListener('click', toggleHandler);

        document.body.appendChild(this.pill);
      }
      return this.pill;
    }

    update({ reelCount = 0, limit = 10, elapsedMinutes = 0, timeLimitMinutes = 15, isBlocked = false, isCooldown = false }) {
      const el = this.getOrCreate();
      const emojiEl = el.querySelector('#ms-pill-emoji');
      const avatarEl = el.querySelector('#ms-pill-avatar');
      const moodEl = el.querySelector('#ms-pill-mood');
      const countEl = el.querySelector('#ms-pill-count');
      const fillEl = el.querySelector('#ms-pill-fill');
      const subEl = el.querySelector('#ms-pill-sub');

      const moodInfo = getAngerMood({
        reelCount,
        reelLimit: limit,
        elapsedMinutes,
        timeLimitMinutes,
        isBlocked,
        isCooldown
      });

      for (let i = 0; i <= 10; i++) {
        el.classList.remove('ms-anger-' + i);
      }
      el.classList.remove('ms-anger-cooldown');
      el.classList.add(moodInfo.className);

      if (this.currentLevel !== moodInfo.level) {
        this.currentLevel = moodInfo.level;
        if (avatarEl) {
          avatarEl.classList.remove('pop');
          void avatarEl.offsetWidth;
          avatarEl.classList.add('pop');
        }
      }

      if (emojiEl) emojiEl.textContent = moodInfo.emoji;
      if (moodEl) moodEl.textContent = moodInfo.bengali;
      if (fillEl) fillEl.style.width = moodInfo.percent + '%';

      if (isCooldown) {
        if (countEl) countEl.textContent = '🛑 Lockout';
        if (subEl) subEl.textContent = 'ডোপামিন ডিটক্স মোড • Take a break';
      } else if (isBlocked) {
        if (countEl) countEl.textContent = '🔒 Limit Reached';
        if (subEl) subEl.textContent = '💥 ' + moodInfo.quote;
      } else {
        if (countEl) countEl.textContent = reelCount + ' / ' + limit + ' Reels';
        if (subEl) subEl.textContent = '⏱️ ' + elapsedMinutes + 'm / ' + timeLimitMinutes + 'm • ' + moodInfo.quote;
      }
    }

    remove() {
      if (this.pill && this.pill.parentNode) {
        this.pill.parentNode.removeChild(this.pill);
        this.pill = null;
        this.currentLevel = null;
      }
    }
  }

  // --- 6. CORE COORDINATOR ---
  const overlayManager = new OverlayManager();
  const pillManager = new PillManager();
  let currentChallenge = null;
  let currentReelLimit = 5;

  function sendMessageToBg(msg) {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(msg, res => {
            if (chrome.runtime.lastError) {
              resolve({});
            } else {
              resolve(res || {});
            }
          });
        } else {
          resolve({});
        }
      } catch {
        resolve({});
      }
    });
  }

  function handleLock(res) {
    pauseAllMedia();
    const timeLimit = (res.config && res.config.timeLimitMinutes) || 15;

    if (res.isCooldown) {
      pillManager.update({
        reelCount: res.reelCount || 0,
        limit: currentReelLimit,
        elapsedMinutes: res.elapsedMinutes || 0,
        timeLimitMinutes: timeLimit,
        isBlocked: true,
        isCooldown: true
      });
      overlayManager.showCooldown(res.remainingSeconds, () => {
        overlayManager.removeOverlay();
        checkCurrentStatus();
      }, res.lastFailedChallenge);
      return;
    }

    currentChallenge = res.challenge;
    if (!currentChallenge) return;

    pillManager.update({
      reelCount: res.reelCount || currentReelLimit,
      limit: currentReelLimit,
      elapsedMinutes: res.elapsedMinutes || timeLimit,
      timeLimitMinutes: timeLimit,
      isBlocked: true,
      isCooldown: false
    });

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
            console.log('%c[MindShield] Challenge solved! Session unlocked.', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
            checkCurrentStatus();
          });
        } else if (response.cooldownTriggered) {
          pillManager.update({
            reelCount: 0,
            limit: currentReelLimit,
            elapsedMinutes: 0,
            timeLimitMinutes: timeLimit,
            isBlocked: true,
            isCooldown: true
          });
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
        pillManager.update({
          reelCount: 0,
          limit: currentReelLimit,
          elapsedMinutes: 0,
          timeLimitMinutes: timeLimit,
          isBlocked: true,
          isCooldown: true
        });
        overlayManager.showCooldown(response.remainingSeconds, () => {
          overlayManager.removeOverlay();
          checkCurrentStatus();
        }, currentChallenge);
      }
    });
  }

  async function checkCurrentStatus() {
    const check = isReelsUrl(window.location.href);
    if (!check.match) {
      pillManager.remove();
      overlayManager.removeOverlay();
      return;
    }

    const res = await sendMessageToBg({
      action: 'CHECK_STATUS',
      url: window.location.href,
      platform: check.platform
    });

    if (res.config && res.config.reelLimit) {
      currentReelLimit = res.config.reelLimit;
    }

    const timeLimit = (res.config && res.config.timeLimitMinutes) || 15;
    pillManager.update({
      reelCount: res.reelCount || 0,
      limit: currentReelLimit,
      elapsedMinutes: res.elapsedMinutes || 0,
      timeLimitMinutes: timeLimit,
      isBlocked: res.isBlocked,
      isCooldown: res.isCooldown
    });

    if (res.isBlocked || res.isCooldown) {
      handleLock(res);
    } else {
      overlayManager.removeOverlay();
    }
  }

  // --- 7. MULTI-SIGNAL REEL DETECTION ---
  const countedVideoKeys = new Set();
  let lastUrl = window.location.href;
  let activeVideoDwellTimer = null;
  let lastCountedTimestamp = 0;

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;
    return (
      rect.width > 120 &&
      rect.height > 120 &&
      rect.top < vHeight &&
      rect.bottom > 0 &&
      rect.left < vWidth &&
      rect.right > 0
    );
  }

  function getVideoKey(video) {
    if (!video) return null;
    if (video.currentSrc && video.currentSrc.length > 5) return video.currentSrc;
    if (video.src && video.src.length > 5) return video.src;
    if (!video.dataset.msVidId) {
      video.dataset.msVidId = 'ms_' + Math.random().toString(36).slice(2, 9);
    }
    return video.dataset.msVidId;
  }

  async function registerReelWatched(source) {
    const now = Date.now();
    if (now - lastCountedTimestamp < 2500) return;
    lastCountedTimestamp = now;

    console.log('%c[MindShield] 🛡️ Reel watched via ' + source, 'background: #4f46e5; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

    const res = await sendMessageToBg({
      action: 'REEL_SCROLLED',
      url: window.location.href,
      source
    });

    if (res.config && res.config.reelLimit) {
      currentReelLimit = res.config.reelLimit;
    }

    const timeLimit = (res.config && res.config.timeLimitMinutes) || 15;
    pillManager.update({
      reelCount: res.reelCount || 0,
      limit: currentReelLimit,
      elapsedMinutes: res.elapsedMinutes || 0,
      timeLimitMinutes: timeLimit,
      isBlocked: res.shouldBlock,
      isCooldown: res.isCooldown
    });

    if (res.shouldBlock || res.isCooldown) {
      handleLock(res);
    }
  }

  function onVideoPlaying(video) {
    const check = isReelsUrl(window.location.href);
    if (!check.match) return;
    if (!isElementVisible(video)) return;

    const key = getVideoKey(video);
    if (!key || countedVideoKeys.has(key)) return;

    if (activeVideoDwellTimer) {
      clearTimeout(activeVideoDwellTimer);
      activeVideoDwellTimer = null;
    }

    activeVideoDwellTimer = setTimeout(() => {
      if (video && !video.paused && isElementVisible(video)) {
        countedVideoKeys.add(key);
        registerReelWatched('video_playback:' + key.slice(-15));
      }
    }, 1800);
  }

  document.addEventListener('playing', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') {
      onVideoPlaying(e.target);
    }
  }, true);

  function checkUrlChange() {
    const current = window.location.href;
    if (current !== lastUrl) {
      lastUrl = current;
      const reelId = getReelIdFromUrl(current);
      if (reelId && !countedVideoKeys.has(reelId)) {
        countedVideoKeys.add(reelId);
        registerReelWatched('url_navigation:' + reelId);
      }
      checkCurrentStatus();
    }
  }

  window.addEventListener('yt-navigate-finish', checkUrlChange);
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('hashchange', checkUrlChange);

  setInterval(() => {
    checkUrlChange();
  }, 400);

  // Periodic time threshold ticker: ensures 15-minute time limit blocks the feed
  // even if user stays on a single reel without scrolling or URL change.
  setInterval(() => {
    checkCurrentStatus();
  }, 5000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkCurrentStatus();
    });
  } else {
    checkCurrentStatus();
  }
})();
`;

fs.writeFileSync(path.resolve(distDir, 'content.bundle.js'), contentBundleContent, 'utf8');
console.log('[MindShield Builder] content.bundle.js generated successfully.');

console.log('[MindShield Builder] Build completed successfully.');
