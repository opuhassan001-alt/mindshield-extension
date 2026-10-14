import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isReelsUrl, getPlatformFromUrl, getReelIdFromUrl } from '../src/core/detector.js';

describe('Reels Platform Detector', () => {
  it('should detect Instagram Reels URLs', () => {
    const url1 = 'https://www.instagram.com/reels/';
    const url2 = 'https://www.instagram.com/reel/C2-938ABxYz/';
    const nonReel = 'https://www.instagram.com/p/C2-938ABxYz/';

    assert.equal(isReelsUrl(url1).match, true);
    assert.equal(isReelsUrl(url1).platform, 'instagram');
    assert.equal(isReelsUrl(url2).match, true);
    assert.equal(isReelsUrl(url2).platform, 'instagram');
    assert.equal(isReelsUrl(nonReel).match, false);
  });

  it('should detect YouTube Shorts URLs', () => {
    const shortUrl = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
    const normalVideo = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    assert.equal(isReelsUrl(shortUrl).match, true);
    assert.equal(isReelsUrl(shortUrl).platform, 'youtube');
    assert.equal(isReelsUrl(normalVideo).match, false);
  });

  it('should detect Facebook Reels URLs', () => {
    const fbReel = 'https://www.facebook.com/reel/123456789012345';
    const fbProfile = 'https://www.facebook.com/username';

    assert.equal(isReelsUrl(fbReel).match, true);
    assert.equal(isReelsUrl(fbReel).platform, 'facebook');
    assert.equal(isReelsUrl(fbProfile).match, false);
  });

  it('should detect TikTok URLs', () => {
    const tiktokVideo = 'https://www.tiktok.com/@user/video/7123456789012345678';
    const tiktokForYou = 'https://www.tiktok.com/foryou';
    const tiktokSettings = 'https://www.tiktok.com/setting';

    assert.equal(isReelsUrl(tiktokVideo).match, true);
    assert.equal(isReelsUrl(tiktokVideo).platform, 'tiktok');
    assert.equal(isReelsUrl(tiktokForYou).match, true);
    assert.equal(isReelsUrl(tiktokSettings).match, false);
  });

  it('should detect test playground URLs', () => {
    const playground = 'http://localhost:3000/playground.html#reel-3';
    const filePlayground = 'file:///C:/test/playground.html';

    assert.equal(isReelsUrl(playground).match, true);
    assert.equal(isReelsUrl(playground).platform, 'test-playground');
    assert.equal(isReelsUrl(filePlayground).match, true);
    assert.equal(isReelsUrl(filePlayground).platform, 'test-playground');
  });

  it('should extract reel ID when present', () => {
    assert.equal(getReelIdFromUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(getReelIdFromUrl('https://www.instagram.com/reel/C2-938ABxYz/'), 'C2-938ABxYz');
  });
});
