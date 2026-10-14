import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getAngerMood, ANGER_TIERS, COOLDOWN_TIER } from '../src/core/anger-mood.js';

describe('Anger Mood Engine', () => {
  test('should return zen mood for 0 reels and 0 elapsed time', () => {
    const mood = getAngerMood({ reelCount: 0, reelLimit: 10, elapsedMinutes: 0, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 0);
    assert.strictEqual(mood.emoji, '😇');
    assert.strictEqual(mood.percent, 0);
  });

  test('should return funny / chill mood for Reel 1 (মজার emoji)', () => {
    const mood = getAngerMood({ reelCount: 1, reelLimit: 10, elapsedMinutes: 1, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 1);
    assert.strictEqual(mood.emoji, '😎');
    assert.match(mood.bengali, /মজার/);
  });

  test('should return slight anger for Reel 2 (হালকা রাগ)', () => {
    const mood = getAngerMood({ reelCount: 2, reelLimit: 10, elapsedMinutes: 2, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 2);
    assert.strictEqual(mood.emoji, '🤨');
    assert.match(mood.bengali, /হালকা রাগ/);
  });

  test('should return more anger for Reel 3 (আরও রাগ)', () => {
    const mood = getAngerMood({ reelCount: 3, reelLimit: 10, elapsedMinutes: 3, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 3);
    assert.strictEqual(mood.emoji, '😒');
    assert.match(mood.bengali, /আরও রাগ/);
  });

  test('should return even more anger for Reel 4 (আরও বেশি রাগ)', () => {
    const mood = getAngerMood({ reelCount: 4, reelLimit: 10, elapsedMinutes: 4, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 4);
    assert.strictEqual(mood.emoji, '😠');
    assert.match(mood.bengali, /আরও/);
  });

  test('should progressively increase anger up to Reel 9', () => {
    const mood5 = getAngerMood({ reelCount: 5, reelLimit: 10, elapsedMinutes: 5, timeLimitMinutes: 15 });
    assert.strictEqual(mood5.level, 5);
    assert.strictEqual(mood5.emoji, '😡');

    const mood7 = getAngerMood({ reelCount: 7, reelLimit: 10, elapsedMinutes: 7, timeLimitMinutes: 15 });
    assert.strictEqual(mood7.level, 7);
    assert.strictEqual(mood7.emoji, '🤬');

    const mood9 = getAngerMood({ reelCount: 9, reelLimit: 10, elapsedMinutes: 9, timeLimitMinutes: 15 });
    assert.strictEqual(mood9.level, 9);
    assert.strictEqual(mood9.emoji, '💥');
  });

  test('should explode in full rage at Reel 10 (রাগটা ফাইটে উঠবে)', () => {
    const mood = getAngerMood({ reelCount: 10, reelLimit: 10, elapsedMinutes: 5, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 10);
    assert.strictEqual(mood.emoji, '🤯');
    assert.match(mood.mood, /RAGE EXPLODED/);
    assert.match(mood.bengali, /ফাইটে উঠেছে/);
    assert.strictEqual(mood.percent, 100);
  });

  test('should increase anger based on elapsed time even if reel count is low', () => {
    // Only 1 reel watched, but 9 minutes elapsed out of 15 (60% time elapsed -> level 6)
    const mood = getAngerMood({ reelCount: 1, reelLimit: 10, elapsedMinutes: 9, timeLimitMinutes: 15 });
    assert.strictEqual(mood.level, 6);
    assert.strictEqual(mood.emoji, '😤');

    // 14 minutes elapsed -> level 9 fuse lit!
    const mood14 = getAngerMood({ reelCount: 1, reelLimit: 10, elapsedMinutes: 14, timeLimitMinutes: 15 });
    assert.strictEqual(mood14.level, 9);
    assert.strictEqual(mood14.emoji, '💥');

    // 15 minutes elapsed -> explosion!
    const mood15 = getAngerMood({ reelCount: 1, reelLimit: 10, elapsedMinutes: 15, timeLimitMinutes: 15 });
    assert.strictEqual(mood15.level, 10);
    assert.strictEqual(mood15.emoji, '🤯');
  });

  test('should return cooldown tier when isCooldown is true', () => {
    const mood = getAngerMood({ reelCount: 0, isCooldown: true });
    assert.strictEqual(mood.emoji, '🛑');
    assert.strictEqual(mood.level, -1);
  });
});

