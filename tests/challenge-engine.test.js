import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateChallenge, verifyAnswer, CHALLENGE_TYPES } from '../src/core/challenge-engine.js';

describe('Challenge Engine', () => {
  it('should list available challenge types including logic and matrix', () => {
    assert.ok(Array.isArray(CHALLENGE_TYPES));
    assert.ok(CHALLENGE_TYPES.includes('math'));
    assert.ok(CHALLENGE_TYPES.includes('sequence'));
    assert.ok(CHALLENGE_TYPES.includes('stroop'));
    assert.ok(CHALLENGE_TYPES.includes('logic'));
    assert.ok(CHALLENGE_TYPES.includes('matrix'));
  });

  describe('Math Challenges (Insane / Multi-Step)', () => {
    it('should generate valid easy, medium, and hard math challenges', () => {
      const easy = generateChallenge('math', 'easy');
      assert.equal(easy.type, 'math');
      assert.ok(verifyAnswer(easy, easy.answer));
      assert.ok(easy.explanation);

      const medium = generateChallenge('math', 'medium');
      assert.ok(verifyAnswer(medium, medium.answer));
      assert.ok(medium.explanation);

      const hard = generateChallenge('math', 'hard');
      assert.ok(verifyAnswer(hard, hard.answer));
      assert.ok(hard.explanation);
    });

    it('should generate insane multi-step algebra and modular arithmetic challenges', () => {
      const insane = generateChallenge('math', 'insane');
      assert.equal(insane.type, 'math');
      assert.equal(insane.difficulty, 'insane');
      assert.ok(insane.question);
      assert.ok(insane.answer !== undefined);
      assert.ok(insane.explanation);
      assert.ok(insane.explanation.length > 15);
      assert.equal(verifyAnswer(insane, insane.answer), true);
      assert.equal(verifyAnswer(insane, 'wrong_answer_999'), false);
    });
  });

  describe('Cognitive Reflection & Logic Challenges', () => {
    it('should generate lateral logic riddles with prefrontal traps and step-by-step explanations', () => {
      const logic = generateChallenge('logic', 'insane');
      assert.equal(logic.type, 'logic');
      assert.ok(logic.question);
      assert.ok(logic.answer);
      assert.ok(Array.isArray(logic.options));
      assert.ok(logic.options.includes(logic.answer));
      assert.ok(logic.explanation);
      assert.ok(logic.explanation.length > 20);
      assert.equal(verifyAnswer(logic, logic.answer), true);
      assert.equal(verifyAnswer(logic, 'incorrect_reflex'), false);
    });
  });

  describe('Matrix Number Logic Challenges', () => {
    it('should generate 3-row number matrix grids with rule explanations', () => {
      const matrix = generateChallenge('matrix', 'insane');
      assert.equal(matrix.type, 'matrix');
      assert.ok(matrix.question.includes('[') && matrix.question.includes('?'));
      assert.ok(matrix.answer);
      assert.ok(Array.isArray(matrix.options));
      assert.ok(matrix.options.includes(matrix.answer));
      assert.ok(matrix.explanation);
      assert.equal(verifyAnswer(matrix, matrix.answer), true);
      assert.equal(verifyAnswer(matrix, 'wrong_val'), false);
    });
  });

  describe('Sequence Challenges', () => {
    it('should generate number sequence puzzle with interleaved patterns and explanation', () => {
      const challenge = generateChallenge('sequence', 'insane');
      assert.equal(challenge.type, 'sequence');
      assert.ok(challenge.question.includes('?'));
      assert.ok(challenge.answer !== undefined);
      assert.ok(challenge.explanation);
      assert.equal(verifyAnswer(challenge, challenge.answer), true);
      assert.equal(verifyAnswer(challenge, 'wrong-ans'), false);
    });
  });

  describe('Stroop Conflict Challenges', () => {
    it('should generate Stroop color-conflict test with explanation', () => {
      const challenge = generateChallenge('stroop', 'hard');
      assert.equal(challenge.type, 'stroop');
      assert.ok(challenge.word);
      assert.ok(challenge.inkColor);
      assert.ok(challenge.options.length >= 3);
      assert.ok(challenge.options.includes(challenge.answer));
      assert.ok(challenge.explanation);
      assert.equal(verifyAnswer(challenge, challenge.answer), true);
      assert.equal(verifyAnswer(challenge, 'invalid_color'), false);
    });
  });

  describe('Random Challenge Generation', () => {
    it('should generate random challenges across all 5 types', () => {
      const challenge = generateChallenge('random', 'insane');
      assert.ok(CHALLENGE_TYPES.includes(challenge.type));
      assert.ok(challenge.question);
      assert.ok(challenge.answer !== undefined);
      assert.ok(challenge.explanation);
    });
  });
});
