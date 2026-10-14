import { DEFAULT_CONFIG, STORAGE_KEYS } from './config.js';

/**
 * StateManager handles session counting, time tracking, daily statistics,
 * and the cooldown penalty lock.
 */
export class StateManager {
  constructor(storageAdapter = null, customConfig = null) {
    this.storage = storageAdapter || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    this.config = { ...DEFAULT_CONFIG, ...(customConfig || {}) };
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

  /**
   * Initialize state from storage
   */
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
          // Reset daily counters on a new calendar day
          this.stats = {
            date: today,
            totalReelsToday: 0,
            challengesSolvedToday: 0,
            cooldownsTriggeredToday: 0
          };
          await this._persistStats();
        }
      }

      // Check if any active cooldown has already expired
      await this.checkCooldownStatus();
    } catch (err) {
      console.error('[MindShield] Error initializing state:', err);
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

  /**
   * Check if user is currently under the cooldown lockout
   */
  async checkCooldownStatus() {
    if (this.state.cooldownEndTime) {
      const now = Date.now();
      if (now < this.state.cooldownEndTime) {
        const remainingSeconds = Math.ceil((this.state.cooldownEndTime - now) / 1000);
        return { isCooldown: true, remainingSeconds };
      } else {
        // Cooldown completed: lift the lock and restart clean session!
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

  /**
   * Check current session status against dual limits:
   * 1. Reel count limit (e.g., 10 reels)
   * 2. Active session elapsed time limit (e.g., 15 minutes)
   */
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
        elapsedMinutes: Math.floor(elapsedMinutes)
      };
    }

    return {
      isBlocked: false,
      isCooldown: false,
      reelCount: this.state.reelCount,
      elapsedMinutes: Math.floor(elapsedMinutes)
    };
  }

  /**
   * Record a reel being viewed
   */
  async recordReelView() {
    const cooldown = await this.checkCooldownStatus();
    if (cooldown.isCooldown) {
      return {
        reelCount: this.state.reelCount,
        shouldBlock: true,
        isCooldown: true,
        remainingSeconds: cooldown.remainingSeconds
      };
    }

    this.state.reelCount += 1;
    this.stats.totalReelsToday += 1;

    // Check time limit
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
      shouldBlock,
      isCooldown: false,
      reason: hitReelLimit ? 'reel_limit' : hitTimeLimit ? 'time_limit' : null
    };
  }

  /**
   * Start the cooldown penalty (e.g. 30 or 40 minutes)
   */
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

  /**
   * Record challenge answer attempt
   */
  async recordChallengeAttempt(success, challenge = null) {
    if (success) {
      // Prefrontal cortex unlocked! Reset session counters
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
        // Exceeded allowed attempts -> Start cooldown lockout & save solution for review
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

  /**
   * Force manual session reset
   */
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
