import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateChallenge, verifyAnswer, CHALLENGE_TYPES } from '../src/core/challenge-engine.js';

describe('Challenge Engine', () => {
  it('should list available challenge types', () => {
    assert.ok(Array.isArray(CHALLENGE_TYPES));
    assert.ok(CHALLENGE_TYPES.includes('math'));
    assert.ok(CHALLENGE_TYPES.includes('sequence'));
    assert.ok(CHALLENGE_TYPES.includes('stroop'));
  });

  describe('Math Challenges', () => {
    it('should generate a valid easy math challenge', () => {
      const challenge = generateChallenge('math', 'easy');
      assert.equal(challenge.type, 'math');
      assert.equal(challenge.difficulty, 'easy');
      assert.ok(challenge.id);
      assert.ok(challenge.question);
      assert.ok(challenge.question.includes('= ?') || challenge.question.includes('?'));
      assert.ok(typeof challenge.answer === 'number' || typeof challenge.answer === 'string');
      
      // Verify answer verification works
      const isValid = verifyAnswer(challenge, challenge.answer);
      assert.equal(isValid, true);

      // Verify wrong answer fails
      const isInvalid = verifyAnswer(challenge, Number(challenge.answer) + 999);
      assert.equal(isInvalid, false);
    });

    it('should generate valid medium and hard math challenges', () => {
      const medium = generateChallenge('math', 'medium');
      assert.equal(medium.difficulty, 'medium');
      assert.ok(verifyAnswer(medium, medium.answer));

      const hard = generateChallenge('math', 'hard');
      assert.equal(hard.difficulty, 'hard');
      assert.ok(verifyAnswer(hard, hard.answer));
    });
  });

  describe('Sequence Challenges', () => {
    it('should generate number sequence puzzle with options or direct answer', () => {
      const challenge = generateChallenge('sequence', 'medium');
      assert.equal(challenge.type, 'sequence');
      assert.ok(challenge.question.includes('?'));
      assert.ok(challenge.answer !== undefined);
      assert.equal(verifyAnswer(challenge, challenge.answer), true);
      assert.equal(verifyAnswer(challenge, 'wrong-ans'), false);
    });
  });

  describe('Stroop Conflict Challenges', () => {
    it('should generate Stroop color-conflict test', () => {
      const challenge = generateChallenge('stroop', 'medium');
      assert.equal(challenge.type, 'stroop');
      assert.ok(challenge.word);
      assert.ok(challenge.inkColor);
      assert.ok(challenge.options.length >= 3);
      assert.ok(challenge.options.includes(challenge.answer));
      assert.equal(verifyAnswer(challenge, challenge.answer), true);
      assert.equal(verifyAnswer(challenge, 'invalid_color'), false);
    });
  });

  describe('Random Challenge Generation', () => {
    it('should generate random challenge when type is "random"', () => {
      const challenge = generateChallenge('random', 'easy');
      assert.ok(['math', 'sequence', 'stroop'].includes(challenge.type));
      assert.ok(challenge.question);
      assert.ok(challenge.answer !== undefined);
    });
  });
});
