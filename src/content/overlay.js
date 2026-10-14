/**
 * MindShield Overlay Manager
 * Inescapable full-screen interruption modal with rich audio cues,
 * science-backed ADHD focus soundscapes, and particle celebrations.
 */

import {
  playWarningBell,
  playSuccessFanfare,
  playErrorBuzz,
  launchCelebration,
  getMuted,
  setMuted
} from '../core/sound-effects.js';

import {
  startSoundscape,
  stopSoundscape,
  isPlaying,
  getTrackInfo
} from '../core/focus-soundscapes.js';

import { getAngerMood } from '../core/anger-mood.js';

export class OverlayManager {
  constructor() {
    this.root = null;
    this.cooldownInterval = null;
    this.isScrollTrapped = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleWheel = this._handleWheel.bind(this);
    this._handleTouch = this._handleTouch.bind(this);
  }

  trapScroll() {
    if (this.isScrollTrapped) return;
    this.isScrollTrapped = true;

    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body?.style.setProperty('overflow', 'hidden', 'important');

    window.addEventListener('wheel', this._handleWheel, { passive: false, capture: true });
    window.addEventListener('touchmove', this._handleTouch, { passive: false, capture: true });
    window.addEventListener('keydown', this._handleKeyDown, { passive: false, capture: true });
  }

  releaseScroll() {
    if (!this.isScrollTrapped) return;
    this.isScrollTrapped = false;

    document.documentElement.style.removeProperty('overflow');
    document.body?.style.removeProperty('overflow');

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
    if (blockedKeys.includes(e.code) && e.target.tagName !== 'INPUT') {
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

  /**
   * Celebrate puzzle completion with fanfare and confetti before closing
   */
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

  /**
   * Render Brain Puzzle / Challenge
   */
  showChallenge({
    challenge,
    currentAttempts = 0,
    maxAttempts = 3,
    reason = 'limit',
    onSubmit,
    onGiveUp
  }) {
    if (this.currentOverlayType === 'challenge' && this.currentChallengeId === challenge.id) {
      return;
    }
    this.currentOverlayType = 'challenge';
    this.currentChallengeId = challenge.id;

    this.trapScroll();
    const root = this.getOrCreateRoot();

    let subtitle = reason === 'time_limit' 
      ? 'You have reached your active watching time limit. Engage your mind to unlock.'
      : 'You have reached your reel scroll limit. Wake up your prefrontal cortex!';

    let inputHtml = '';
    if (challenge.inputType === 'choice') {
      inputHtml = `
        <div class="ms-choices-grid">
          ${challenge.options.map(opt => `
            <button class="ms-choice-btn" data-val="${opt}">${opt}</button>
          `).join('')}
        </div>
      `;
    } else {
      inputHtml = `
        <div class="ms-input-group">
          <input type="text" class="ms-input" id="ms-answer-input" placeholder="Type your answer..." autocomplete="off" />
          <button class="ms-btn" id="ms-submit-btn">Unlock</button>
        </div>
      `;
    }

    let challengeContent = '';
    if (challenge.type === 'stroop') {
      challengeContent = `
        <div class="ms-subtitle">${challenge.instruction}</div>
        <div class="ms-stroop-word" style="color: ${challenge.inkColor};">${challenge.word}</div>
      `;
    } else if (challenge.type === 'matrix') {
      challengeContent = `
        <div class="ms-subtitle">${challenge.instruction}</div>
        <div class="ms-matrix-grid">${challenge.question}</div>
      `;
    } else {
      challengeContent = `
        <div class="ms-subtitle">${challenge.instruction}</div>
        <div class="ms-challenge-question">${challenge.question}</div>
      `;
    }

    const soundIcon = getMuted() ? '🔇' : '🔊';

    root.innerHTML = `
      <div class="ms-container">
        <button class="ms-sound-toggle" id="ms-sound-toggle" title="Toggle Sound">${soundIcon}</button>
        <div class="ms-badge-header">⚡ ADHD Mind Interruption</div>
        <h2 class="ms-title">${challenge.title}</h2>
        <div class="ms-subtitle">${subtitle}</div>

        <div class="ms-card">
          ${challengeContent}
          ${inputHtml}
          <div class="ms-feedback" id="ms-feedback">
            ${currentAttempts > 0 ? `Attempts: ${currentAttempts}/${maxAttempts}` : ''}
          </div>
        </div>

        <button class="ms-btn ms-btn-secondary" id="ms-giveup-btn">
          I want a break (Start 30-min Detox Cooldown)
        </button>
      </div>
    `;

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
        this._submitAnswer(inputEl.value, onSubmit, feedbackEl);
      });
    }

    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        this._submitAnswer(val, onSubmit, feedbackEl);
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

    if (onSubmit) {
      onSubmit(answer);
    }
  }

  showErrorFeedback(message, remainingAttempts) {
    const root = this.getOrCreateRoot();
    const feedbackEl = root.querySelector('#ms-feedback');
    if (feedbackEl) {
      feedbackEl.className = 'ms-feedback error';
      feedbackEl.textContent = `${message} (${remainingAttempts} attempts left)`;
      playErrorBuzz();
    }
  }

  /**
   * Render Cooldown Screen with Science-backed ADHD Soundscapes
   */
  showCooldown(remainingSeconds, onComplete, solutionInfo = null) {
    if (this.currentOverlayType === 'cooldown') {
      return;
    }
    this.currentOverlayType = 'cooldown';
    this.currentChallengeId = null;

    this.trapScroll();
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    const root = this.getOrCreateRoot();
    let timeLeft = remainingSeconds;

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const soundIcon = getMuted() ? '🔇' : '🔊';

    let solutionHtml = '';
    if (solutionInfo && solutionInfo.question) {
      solutionHtml = `
        <div class="ms-solution-box">
          <div class="ms-solution-header">
            <span>💡 Missed Puzzle Solution & Breakdown</span>
            <button type="button" class="ms-solution-toggle-btn" id="ms-solution-toggle-btn">Hide Solution</button>
          </div>
          <div class="ms-solution-body" id="ms-solution-body">
            <div class="ms-sol-row">
              <span class="ms-sol-label">Question:</span>
              <p class="ms-sol-val-q">${solutionInfo.question}</p>
            </div>
            <div class="ms-sol-row">
              <span class="ms-sol-label">Correct Answer:</span>
              <span class="ms-sol-val-ans">${solutionInfo.answer}</span>
            </div>
            <div class="ms-sol-row">
              <span class="ms-sol-label">Step-by-Step Logic:</span>
              <p class="ms-sol-val-exp">${solutionInfo.explanation || 'Analyze the underlying patterns to strengthen cognitive control.'}</p>
            </div>
          </div>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="ms-container">
        <button class="ms-sound-toggle" id="ms-sound-toggle" title="Toggle Sound">${soundIcon}</button>
        <div class="ms-badge-header cooldown">🛑 Dopamine Detox Active</div>
        <h2 class="ms-title">MindShield Cooldown Lock</h2>
        <div class="ms-subtitle">
          Too many missed challenges or detox session started. Step away from short-form videos to restore dopamine sensitivity.
        </div>

        <div class="ms-card">
          <div class="ms-cooldown-timer" id="ms-timer-val">${formatTime(timeLeft)}</div>
          <div class="ms-breath-circle">Breathe</div>
          <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
            Reels will unlock automatically when timer expires.
          </p>

          <!-- Neuro-Focus Audio Player -->
          <div class="ms-focus-soundscape-box">
            <div class="ms-soundscape-header">
              <span>🎧 ADHD Focus Audio (Science-Backed)</span>
              <span class="ms-soundscape-badge" id="ms-soundscape-status">Stopped</span>
            </div>
            <div class="ms-soundscape-controls">
              <select id="ms-soundscape-select" class="ms-soundscape-select">
                <option value="brown">🌊 Deep Brown Noise (ADHD Stochastic Resonance)</option>
                <option value="gamma40">⚡ 40 Hz Gamma Focus Wave (MIT Research)</option>
                <option value="alpha">🧠 10 Hz Alpha Flow State (Calm Alertness)</option>
                <option value="beta">🎯 16 Hz Beta Analytical (Active Thinking)</option>
                <option value="pink">🌧️ Rainfall Pink Noise (Sustained Focus)</option>
              </select>
              <button type="button" id="ms-soundscape-toggle" class="ms-soundscape-btn">▶ Play</button>
            </div>
            <div class="ms-soundscape-desc" id="ms-soundscape-desc">
              Brown noise raises background neural stochastic resonance to calm dopamine-starved ADHD brains.
            </div>
          </div>

          <!-- Unsolved Challenge Solution & Explanation -->
          ${solutionHtml}
        </div>

        <div class="ms-quote">
          "The ability to delay gratification is the ultimate superpower in the age of algorithms."
        </div>
      </div>
    `;

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
        const info = getTrackInfo(soundscapeSelect.value);
        if (soundscapeDesc) soundscapeDesc.textContent = info.adhdBenefit;
        if (isPlaying()) {
          startSoundscape(soundscapeSelect.value, 0.45);
        }
      });

      soundscapeToggleBtn.addEventListener('click', () => {
        if (isPlaying()) {
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

/**
 * MindShield Floating Live Status Pill Manager
 * Shows dynamic evolving emotion avatar & progress (Reels count & Elapsed time)
 */
export class PillManager {
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
      this.pill.innerHTML = `
        <div class="ms-pill-avatar" id="ms-pill-avatar" title="Click to minimize/expand">
          <span class="ms-pill-emoji" id="ms-pill-emoji">😇</span>
        </div>
        <div class="ms-pill-body" id="ms-pill-body">
          <div class="ms-pill-header">
            <span class="ms-pill-mood-badge" id="ms-pill-mood">শান্ত মেজাজ</span>
            <span class="ms-pill-reels-count" id="ms-pill-count">0 / 10 Reels</span>
          </div>
          <div class="ms-pill-bar-track">
            <div class="ms-pill-bar-fill" id="ms-pill-fill" style="width: 0%;"></div>
          </div>
          <div class="ms-pill-sub-info" id="ms-pill-sub">⏱️ 0m / 15m • Fresh session</div>
        </div>
        <button type="button" class="ms-pill-toggle-btn" id="ms-pill-toggle" title="Minimize / Expand">◀</button>
      `;

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
      if (countEl) countEl.textContent = `${reelCount} / ${limit} Reels`;
      if (subEl) subEl.textContent = `⏱️ ${elapsedMinutes}m / ${timeLimitMinutes}m • ${moodInfo.quote}`;
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
