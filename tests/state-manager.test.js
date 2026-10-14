import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { StateManager } from '../src/core/state-manager.js';
import { DEFAULT_CONFIG } from '../src/core/config.js';

// In-memory mock storage adapter for testing
class MockStorage {
  constructor() {
    this.store = {};
  }
  async get(keys) {
    if (typeof keys === 'string') {
      return { [keys]: this.store[keys] };
    }
    const result = {};
    for (const key of keys) {
      if (this.store[key] !== undefined) {
        result[key] = this.store[key];
      }
    }
    return result;
  }
  async set(items) {
    Object.assign(this.store, items);
  }
  async clear() {
    this.store = {};
  }
}

describe('StateManager', () => {
  let storage;
  let manager;

  beforeEach(async () => {
    storage = new MockStorage();
    manager = new StateManager(storage, {
      ...DEFAULT_CONFIG,
      reelLimit: 3,
      timeLimitMinutes: 5,
      cooldownMinutes: 30,
      maxFailedAttempts: 2
    });
    await manager.init();
  });

  it('should initialize with default state', async () => {
    const state = await manager.getState();
    assert.equal(state.reelCount, 0);
    assert.equal(state.isBlocked, false);
    assert.equal(state.cooldownEndTime, null);
  });

  it('should increment reel count and trigger block when reaching reelLimit', async () => {
    let result = await manager.recordReelView();
    assert.equal(result.reelCount, 1);
    assert.equal(result.shouldBlock, false);

    result = await manager.recordReelView();
    assert.equal(result.reelCount, 2);
    assert.equal(result.shouldBlock, false);

    result = await manager.recordReelView();
    assert.equal(result.reelCount, 3);
    assert.equal(result.shouldBlock, true); // Breached reelLimit (3)
  });

  it('should start cooldown and return remaining time correctly', async () => {
    const { cooldownEndTime } = await manager.startCooldown(30);
    assert.ok(cooldownEndTime > Date.now());

    const status = await manager.checkCooldownStatus();
    assert.equal(status.isCooldown, true);
    assert.ok(status.remainingSeconds > 1700 && status.remainingSeconds <= 1800);
  });

  it('should unlock session and reset counter upon successful puzzle completion', async () => {
    // Force block
    await manager.recordReelView();
    await manager.recordReelView();
    await manager.recordReelView();
    let state = await manager.getState();
    assert.equal(state.isBlocked, true);

    // Solve successfully
    const solveResult = await manager.recordChallengeAttempt(true);
    assert.equal(solveResult.unlocked, true);

    state = await manager.getState();
    assert.equal(state.reelCount, 0);
    assert.equal(state.isBlocked, false);
    assert.equal(state.failedAttempts, 0);
  });

  it('should trigger cooldown when reaching maxFailedAttempts', async () => {
    // 1st fail
    let attempt1 = await manager.recordChallengeAttempt(false);
    assert.equal(attempt1.unlocked, false);
    assert.equal(attempt1.cooldownTriggered, false);
    assert.equal(attempt1.failedAttempts, 1);

    // 2nd fail (hits maxFailedAttempts = 2)
    let attempt2 = await manager.recordChallengeAttempt(false);
    assert.equal(attempt2.cooldownTriggered, true);
    assert.ok(attempt2.cooldownEndTime > Date.now());

    const status = await manager.checkCooldownStatus();
    assert.equal(status.isCooldown, true);
  });

  it('should track daily statistics', async () => {
    await manager.recordReelView();
    await manager.recordChallengeAttempt(true);

    const stats = await manager.getStats();
    assert.equal(stats.totalReelsToday, 1);
    assert.equal(stats.challengesSolvedToday, 1);
  });
});
