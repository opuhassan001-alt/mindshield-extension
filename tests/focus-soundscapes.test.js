import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOCUS_TRACKS, getTrackInfo } from '../src/core/focus-soundscapes.js';

describe('Focus Soundscapes Engine', () => {
  it('should list all science-backed neuro soundscapes', () => {
    assert.ok(Array.isArray(FOCUS_TRACKS));
    assert.equal(FOCUS_TRACKS.length, 5);

    const ids = FOCUS_TRACKS.map(t => t.id);
    assert.ok(ids.includes('brown'));
    assert.ok(ids.includes('gamma40'));
    assert.ok(ids.includes('alpha'));
    assert.ok(ids.includes('beta'));
    assert.ok(ids.includes('pink'));
  });

  it('should provide scientific neuro-focus rationale for each soundscape', () => {
    const brown = getTrackInfo('brown');
    assert.equal(brown.name, 'Deep Brown Noise');
    assert.ok(brown.adhdBenefit.includes('ADHD'));
    assert.equal(brown.category, 'noise');

    const gamma = getTrackInfo('gamma40');
    assert.equal(gamma.name, '40 Hz Gamma Focus Wave');
    assert.equal(gamma.frequency, 40);
    assert.ok(gamma.adhdBenefit.includes('Working Memory') || gamma.adhdBenefit.includes('Attention'));

    const alpha = getTrackInfo('alpha');
    assert.equal(alpha.name, '10 Hz Alpha Flow State');
    assert.equal(alpha.beatFreq, 10);
  });

  it('should return default fallback track for unknown ID', () => {
    const track = getTrackInfo('unknown-sound');
    assert.equal(track.id, 'brown');
  });
});

