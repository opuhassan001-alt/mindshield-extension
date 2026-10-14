/**
 * MindShield Content Script Bundle (Standalone - Zero Imports)
 * Injected into Instagram, YouTube Shorts, Facebook, and TikTok.
 * Features:
 *  - Multi-signal Reel & Short Video detection (<video> playback + SPA URL observer)
 *  - Floating live count pill (real-time feedback for the user)
 *  - Scroll trap and full-screen challenge overlay
 *  - Pure Web Audio API focus tones, fanfare, error buzz, and neuro soundscapes
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
      regex: /^https?:\/\/(?:www\.)?instagram\.com\/(?:reels?)(?:\/([A-Za-z0-9_-]*))?/i
    },
    {
      platform: 'youtube',
      regex: /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i
    },
    {
      platform: 'facebook',
      regex: /^https?:\/\/(?:www\.)?facebook\.com\/(?:reels?\/|watch\/\?v=)([0-9]+)/i
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

  function isReelsUrl(url) {
    if (!url) return { match: false, platform: null };
    for (const { platform, regex } of PATTERNS) {
      if (regex.test(url)) {
        return { match: true, platform };
      }
    }
    // Also consider active if on Instagram with reels or viewing reel popup
    if (/instagram\.com\/(?:reel|reels)/i.test(url)) {
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
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const freqs = [528, 1056, 1584];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const vol = 0.12 / (i + 1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2 + (i * 0.2));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
      });
    } catch (_) {}
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
        // Pink noise fallback
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
      } else {
        challengeContent = '<div class="ms-subtitle">' + challenge.instruction + '</div>' +
          '<div class="ms-challenge-question">' + challenge.question + '</div>';
      }

      const soundIcon = getMuted() ? '🔇' : '🔊';

      root.innerHTML = [
        '<div class="ms-container">',
        '  <button class="ms-sound-toggle" id="ms-sound-toggle" title="Toggle Sound">' + soundIcon + '</button>',
        '  <div class="ms-badge-header">⚡ ADHD Mind Interruption</div>',
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

      playWarningBell();

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

    showCooldown(remainingSeconds, onComplete) {
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
        '  </div>',
        '  <div class="ms-quote">"The ability to delay gratification is the ultimate superpower in the age of algorithms."</div>',
        '</div>'
      ].join('');

      playWarningBell();

      const timerVal = root.querySelector('#ms-timer-val');
      const soundToggleBtn = root.querySelector('#ms-sound-toggle');
      const soundscapeSelect = root.querySelector('#ms-soundscape-select');
      const soundscapeToggleBtn = root.querySelector('#ms-soundscape-toggle');
      const soundscapeDesc = root.querySelector('#ms-soundscape-desc');
      const soundscapeStatus = root.querySelector('#ms-soundscape-status');

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

  // --- 5. FLOATING LIVE STATUS PILL ---
  class PillManager {
    constructor() {
      this.pill = null;
    }

    getOrCreate() {
      if (!this.pill || !document.body.contains(this.pill)) {
        this.pill = document.createElement('div');
        this.pill.id = 'mindshield-counter-pill';
        this.pill.innerHTML = [
          '<span>🛡️</span>',
          '<span id="ms-pill-text">MindShield: <span class="ms-pill-badge" id="ms-pill-count">0 / 5</span> Reels</span>'
        ].join('');
        document.body.appendChild(this.pill);

        this.pill.addEventListener('click', () => {
          // Send break action or check status
          console.log('[MindShield] Pill clicked - checking status...');
        });
      }
      return this.pill;
    }

    update(count, limit, isBlocked = false, isCooldown = false) {
      const el = this.getOrCreate();
      const countEl = el.querySelector('#ms-pill-count');
      const textEl = el.querySelector('#ms-pill-text');

      el.classList.remove('warning', 'danger');

      if (isCooldown) {
        el.classList.add('danger');
        if (textEl) textEl.innerHTML = '🛑 Cooldown Lock Active';
      } else if (isBlocked) {
        el.classList.add('danger');
        if (textEl) textEl.innerHTML = '🔒 Limit Reached! Solve Puzzle';
      } else {
        const remaining = Math.max(0, limit - count);
        if (remaining <= 1) {
          el.classList.add('warning');
        }
        if (countEl) countEl.textContent = count + ' / ' + limit;
        if (textEl) textEl.innerHTML = 'MindShield: <span class="ms-pill-badge" id="ms-pill-count">' + count + ' / ' + limit + '</span> Reels';
      }

      // Pulse animation
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }

    remove() {
      if (this.pill && this.pill.parentNode) {
        this.pill.parentNode.removeChild(this.pill);
        this.pill = null;
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
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(msg, res => resolve(res || {}));
      } else {
        resolve({});
      }
    });
  }

  function handleLock(res) {
    pauseAllMedia();

    if (res.isCooldown) {
      pillManager.update(res.reelCount || 0, currentReelLimit, true, true);
      overlayManager.showCooldown(res.remainingSeconds, () => {
        overlayManager.removeOverlay();
        checkCurrentStatus();
      });
      return;
    }

    currentChallenge = res.challenge;
    if (!currentChallenge) return;

    pillManager.update(res.reelCount || currentReelLimit, currentReelLimit, true, false);

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
          pillManager.update(0, currentReelLimit, true, true);
          overlayManager.showCooldown(response.remainingSeconds, () => {
            overlayManager.removeOverlay();
            checkCurrentStatus();
          });
        } else {
          overlayManager.showErrorFeedback('Incorrect answer, try again!', (response.maxAttempts || 3) - response.failedAttempts);
        }
      },
      onGiveUp: async () => {
        const response = await sendMessageToBg({ action: 'START_COOLDOWN' });
        pillManager.update(0, currentReelLimit, true, true);
        overlayManager.showCooldown(response.remainingSeconds, () => {
          overlayManager.removeOverlay();
          checkCurrentStatus();
        });
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

    pillManager.update(res.reelCount || 0, currentReelLimit, res.isBlocked, res.isCooldown);

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
    // Throttle: don't count twice within 2.5 seconds
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

    pillManager.update(res.reelCount, currentReelLimit, res.shouldBlock, res.isCooldown);

    if (res.shouldBlock || res.isCooldown) {
      handleLock(res);
    }
  }

  // Signal A: Video Playback Event (Instagram, YouTube Shorts, Facebook, TikTok)
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

    // Require 1.8 seconds of continuous viewing before counting (prevents rapid-swipe false counts)
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

  // Signal B: URL & SPA Navigation Watcher
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

  // YouTube Shorts custom navigation event
  window.addEventListener('yt-navigate-finish', checkUrlChange);
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('hashchange', checkUrlChange);

  // Periodic fallback check (catches silent SPA changes)
  setInterval(() => {
    checkUrlChange();
  }, 400);

  // Start immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkCurrentStatus();
    });
  } else {
    checkCurrentStatus();
  }
})();
