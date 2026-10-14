/**
 * MindShield Challenge Engine
 * Generates prefrontal cortex cognitive exercises to disrupt the dopamine reel cycle.
 */

export const CHALLENGE_TYPES = ['math', 'sequence', 'stroop'];

const STROOP_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a Math Challenge
 */
function generateMathChallenge(difficulty = 'medium') {
  const id = `math_${Date.now()}_${getRandomInt(100, 999)}`;
  let question = '';
  let answer = 0;
  let hint = 'Calculate the exact result.';

  if (difficulty === 'easy') {
    const op = ['+', '-', '*'][getRandomInt(0, 2)];
    if (op === '+') {
      const a = getRandomInt(12, 59);
      const b = getRandomInt(11, 48);
      question = `${a} + ${b} = ?`;
      answer = a + b;
    } else if (op === '-') {
      const a = getRandomInt(30, 99);
      const b = getRandomInt(10, a - 5);
      question = `${a} - ${b} = ?`;
      answer = a - b;
    } else {
      const a = getRandomInt(3, 9);
      const b = getRandomInt(4, 9);
      question = `${a} × ${b} = ?`;
      answer = a * b;
    }
  } else if (difficulty === 'medium') {
    const template = getRandomInt(1, 3);
    if (template === 1) {
      // (A * B) + C
      const a = getRandomInt(6, 14);
      const b = getRandomInt(4, 8);
      const c = getRandomInt(11, 45);
      question = `(${a} × ${b}) + ${c} = ?`;
      answer = a * b + c;
    } else if (template === 2) {
      // Total - (A * B)
      const a = getRandomInt(5, 9);
      const b = getRandomInt(6, 9);
      const total = a * b + getRandomInt(20, 60);
      question = `${total} - (${a} × ${b}) = ?`;
      answer = total - (a * b);
    } else {
      // (A / B) + C
      const b = getRandomInt(4, 8);
      const mult = getRandomInt(6, 12);
      const a = b * mult;
      const c = getRandomInt(15, 55);
      question = `(${a} ÷ ${b}) + ${c} = ?`;
      answer = mult + c;
    }
  } else {
    // Hard: multi-step algebraic or mental math
    const template = getRandomInt(1, 2);
    if (template === 1) {
      // (A * B) - (C * D)
      const a = getRandomInt(11, 19);
      const b = getRandomInt(4, 7);
      const c = getRandomInt(3, 8);
      const d = getRandomInt(4, 6);
      question = `(${a} × ${b}) - (${c} × ${d}) = ?`;
      answer = (a * b) - (c * d);
    } else {
      // Linear equation: A * x + B = C, find x
      const x = getRandomInt(4, 15);
      const a = getRandomInt(3, 8);
      const b = getRandomInt(10, 40);
      const c = (a * x) + b;
      question = `Solve for x: ${a}x + ${b} = ${c}`;
      answer = x;
      hint = 'Find the value of x.';
    }
  }

  return {
    id,
    type: 'math',
    difficulty,
    title: '🧠 Mental Arithmetic Challenge',
    instruction: 'Solve the equation to unlock scrolling:',
    question,
    answer,
    hint,
    inputType: 'text'
  };
}

/**
 * Generate a Number Pattern / Sequence Challenge
 */
function generateSequenceChallenge(difficulty = 'medium') {
  const id = `seq_${Date.now()}_${getRandomInt(100, 999)}`;
  let sequence = [];
  let answer = 0;
  let explanation = '';

  if (difficulty === 'easy') {
    // Arithmetic step progression
    const start = getRandomInt(2, 15);
    const step = getRandomInt(3, 8);
    sequence = [start, start + step, start + step * 2, start + step * 3, '?'];
    answer = start + step * 4;
    explanation = `The sequence increases by +${step} each step.`;
  } else if (difficulty === 'medium') {
    // Alternating or Geometric (double)
    const type = getRandomInt(1, 2);
    if (type === 1) {
      // Doubling sequence
      const start = getRandomInt(2, 6);
      sequence = [start, start * 2, start * 4, start * 8, '?'];
      answer = start * 16;
      explanation = 'Each number is multiplied by 2.';
    } else {
      // Fibonacci addition style: n3 = n1 + n2
      const a = getRandomInt(1, 5);
      const b = getRandomInt(a, 6);
      const c = a + b;
      const d = b + c;
      const e = c + d;
      sequence = [a, b, c, d, e, '?'];
      answer = d + e;
      explanation = 'Each term is the sum of the previous two terms.';
    }
  } else {
    // Hard: Quadratic / expanding differences
    const start = getRandomInt(2, 10);
    const d1 = getRandomInt(2, 4);
    const d2 = d1 + 2;
    const d3 = d2 + 2;
    const d4 = d3 + 2;
    const d5 = d4 + 2;
    const v1 = start;
    const v2 = v1 + d1;
    const v3 = v2 + d2;
    const v4 = v3 + d3;
    const v5 = v4 + d4;
    sequence = [v1, v2, v3, v4, v5, '?'];
    answer = v5 + d5;
    explanation = 'The differences between consecutive terms increase by 2.';
  }

  // Generate plausible options for multiple-choice buttons or numeric input
  const offsets = shuffle([-3, -2, -1, 1, 2, 4]);
  const options = shuffle([
    answer,
    answer + offsets[0],
    answer + offsets[1],
    answer + offsets[2]
  ]);

  return {
    id,
    type: 'sequence',
    difficulty,
    title: '🧩 Pattern Recognition Challenge',
    instruction: 'Identify the rule and find the missing number:',
    question: sequence.join(', '),
    answer,
    options,
    explanation,
    hint: 'Look at the difference between consecutive numbers.',
    inputType: 'choice'
  };
}

/**
 * Generate a Stroop Cognitive Conflict Challenge
 */
function generateStroopChallenge(difficulty = 'medium') {
  const id = `stroop_${Date.now()}_${getRandomInt(100, 999)}`;
  const shuffled = shuffle(STROOP_COLORS);
  const wordObj = shuffled[0];
  const inkObj = shuffled[1]; // Ink color is intentionally DIFFERENT from the word!

  // The challenge tests inhibition: user must select the visual INK color, not what word says
  const answer = inkObj.name;
  
  // Create 4 distinct options including the correct answer
  const distractors = STROOP_COLORS
    .filter(c => c.name !== inkObj.name)
    .slice(0, 3)
    .map(c => c.name);

  const options = shuffle([answer, ...distractors]);

  return {
    id,
    type: 'stroop',
    difficulty,
    title: '🎯 Cognitive Reflex (Stroop) Test',
    instruction: 'Prefrontal Cortex Check: Select the INK COLOR of the word below (ignore what the text spells!):',
    word: wordObj.name.toUpperCase(),
    inkColor: inkObj.hex,
    question: `What INK COLOR is this word printed in?`,
    answer,
    options,
    hint: 'Look at the color of the letters, do not read the letters themselves!',
    inputType: 'choice'
  };
}

/**
 * Main factory to generate challenges
 */
export function generateChallenge(type = 'random', difficulty = 'medium') {
  let chosenType = type;
  if (chosenType === 'random' || !CHALLENGE_TYPES.includes(chosenType)) {
    chosenType = CHALLENGE_TYPES[getRandomInt(0, CHALLENGE_TYPES.length - 1)];
  }

  switch (chosenType) {
    case 'math':
      return generateMathChallenge(difficulty);
    case 'sequence':
      return generateSequenceChallenge(difficulty);
    case 'stroop':
      return generateStroopChallenge(difficulty);
    default:
      return generateMathChallenge(difficulty);
  }
}

/**
 * Verify submitted answer against challenge
 */
export function verifyAnswer(challenge, submittedAnswer) {
  if (!challenge || submittedAnswer === undefined || submittedAnswer === null) {
    return false;
  }

  const cleanSubmitted = String(submittedAnswer).trim().toLowerCase();
  const cleanCorrect = String(challenge.answer).trim().toLowerCase();

  return cleanSubmitted === cleanCorrect;
}
