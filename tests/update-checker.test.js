import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkForUpdates } from '../src/core/update-checker.js';

describe('Update Checker', () => {
  it('should be a callable function and return result or null gracefully without network error', async () => {
    // Tests that function handles execution safely without throwing
    const result = await checkForUpdates('1.0.2');
    if (result) {
      assert.ok('hasUpdate' in result);
      assert.ok('currentVersion' in result);
    } else {
      assert.equal(result, null);
    }
  });
});
