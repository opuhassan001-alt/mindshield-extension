/**
 * MindShield Build Script
 * Bundles modular ES code into standalone, zero-dependency distribution files
 * for Chrome Extension Manifest V3 (immune to web page CSP).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('[MindShield Builder] Starting build...');

// --- 1. BUILD BACKGROUND BUNDLE ---
const bgBundleContent = `/**
 * MindShield Background Service Worker (Bundled)
 * Handles state management, badge counters, challenge generation & validation,
 * solution persistence, and cooldown timer enforcement.
 */

// --- CONFIGURATION ---
const DEFAULT_CONFIG = {
  reelLimit: 10,
  timeLimitMinutes: 15,
  cooldownMinutes: 30,
  challengeType: 'random', // 'math', 'sequence', 'stroop', 'logic', 'matrix', 'iba_bcs', 'game_logic', 'random'
  difficulty: 'insane',    // 'easy', 'medium', 'hard', 'insane'
  soundEnabled: true,
  maxFailedAttempts: 3,
  ageMode: 'all_ages'
};

const STORAGE_KEYS = {
  CONFIG: 'mindshield_config',
  STATE: 'mindshield_state',
  STATS: 'mindshield_stats',
  ACTIVE_CHALLENGE: 'mindshield_active_challenge',
  LAST_FAILED_CHALLENGE: 'mindshield_last_failed_challenge'
};

// --- CHALLENGE ENGINE ---
const CHALLENGE_TYPES = ['math', 'sequence', 'stroop', 'logic', 'matrix', 'iba_bcs', 'game_logic'];

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

function generateMathChallenge(difficulty = 'insane') {
  const id = 'math_' + Date.now() + '_' + getRandomInt(100, 999);
  let question = '';
  let answer = 0;
  let hint = 'Calculate the exact result.';
  let explanation = '';

  if (difficulty === 'easy') {
    const op = ['+', '-', '*'][getRandomInt(0, 2)];
    if (op === '+') {
      const a = getRandomInt(12, 59);
      const b = getRandomInt(11, 48);
      question = a + ' + ' + b + ' = ?';
      answer = a + b;
      explanation = 'Direct addition: ' + a + ' + ' + b + ' = ' + answer + '.';
    } else if (op === '-') {
      const a = getRandomInt(30, 99);
      const b = getRandomInt(10, a - 5);
      question = a + ' - ' + b + ' = ?';
      answer = a - b;
      explanation = 'Direct subtraction: ' + a + ' - ' + b + ' = ' + answer + '.';
    } else {
      const a = getRandomInt(3, 9);
      const b = getRandomInt(4, 9);
      question = a + ' × ' + b + ' = ?';
      answer = a * b;
      explanation = 'Direct multiplication: ' + a + ' × ' + b + ' = ' + answer + '.';
    }
  } else if (difficulty === 'medium') {
    const template = getRandomInt(1, 3);
    if (template === 1) {
      const a = getRandomInt(6, 14);
      const b = getRandomInt(4, 8);
      const c = getRandomInt(11, 45);
      question = '(' + a + ' × ' + b + ') + ' + c + ' = ?';
      answer = a * b + c;
      explanation = 'Multiply first: ' + a + ' × ' + b + ' = ' + (a*b) + '. Then add ' + c + ': ' + (a*b) + ' + ' + c + ' = ' + answer + '.';
    } else if (template === 2) {
      const a = getRandomInt(5, 9);
      const b = getRandomInt(6, 9);
      const total = a * b + getRandomInt(20, 60);
      question = total + ' - (' + a + ' × ' + b + ') = ?';
      answer = total - (a * b);
      explanation = 'Multiply first: ' + a + ' × ' + b + ' = ' + (a*b) + '. Subtract: ' + total + ' - ' + (a*b) + ' = ' + answer + '.';
    } else {
      const b = getRandomInt(4, 8);
      const mult = getRandomInt(6, 12);
      const a = b * mult;
      const c = getRandomInt(15, 55);
      question = '(' + a + ' ÷ ' + b + ') + ' + c + ' = ?';
      answer = mult + c;
      explanation = 'Divide first: ' + a + ' ÷ ' + b + ' = ' + mult + '. Then add ' + c + ': ' + mult + ' + ' + c + ' = ' + answer + '.';
    }
  } else if (difficulty === 'hard') {
    const template = getRandomInt(1, 2);
    if (template === 1) {
      const a = getRandomInt(11, 19);
      const b = getRandomInt(4, 7);
      const c = getRandomInt(3, 8);
      const d = getRandomInt(4, 6);
      question = '(' + a + ' × ' + b + ') - (' + c + ' × ' + d + ') = ?';
      answer = (a * b) - (c * d);
      explanation = 'Step 1: ' + a + ' × ' + b + ' = ' + (a*b) + '. Step 2: ' + c + ' × ' + d + ' = ' + (c*d) + '. Step 3: ' + (a*b) + ' - ' + (c*d) + ' = ' + answer + '.';
    } else {
      const x = getRandomInt(4, 15);
      const a = getRandomInt(3, 8);
      const b = getRandomInt(10, 40);
      const c = (a * x) + b;
      question = 'Solve for x: ' + a + 'x + ' + b + ' = ' + c;
      answer = x;
      hint = 'Find the value of x.';
      explanation = a + 'x = ' + c + ' - ' + b + ' = ' + (c-b) + ' => x = ' + (c-b) + ' ÷ ' + a + ' = ' + x + '.';
    }
  } else {
    // Insane multi-step system of equations or modular arithmetic
    const template = getRandomInt(1, 3);
    if (template === 1) {
      const x = getRandomInt(4, 10);
      const y = getRandomInt(2, 8);
      const aCoeff = getRandomInt(2, 3);
      const c1 = (aCoeff * x) + y;
      const c2 = x - y;
      question = 'System: ' + aCoeff + 'x + y = ' + c1 + ' and x - y = ' + c2 + '. What is x × y?';
      answer = x * y;
      hint = 'Solve for x and y first, then multiply them.';
      explanation = 'Add both equations: (' + aCoeff + 'x + y) + (x - y) = ' + c1 + ' + ' + c2 + ' => ' + (aCoeff + 1) + 'x = ' + (c1 + c2) + ' => x = ' + x + '. Substitute x: ' + x + ' - y = ' + c2 + ' => y = ' + y + '. Therefore, x × y = ' + x + ' × ' + y + ' = ' + answer + '.';
    } else if (template === 2) {
      const a = getRandomInt(12, 28);
      const b = getRandomInt(8, 19);
      const c = getRandomInt(15, 45);
      const d = getRandomInt(5, 9);
      const prod = a * b;
      const total = prod + c;
      const rem = total % d;
      question = 'What is the remainder when (' + a + ' × ' + b + ') + ' + c + ' is divided by ' + d + '?';
      answer = rem;
      hint = 'Calculate the sum or use modular reduction.';
      explanation = 'Step 1: ' + a + ' × ' + b + ' = ' + prod + '. Step 2: ' + prod + ' + ' + c + ' = ' + total + '. Step 3: ' + total + ' ÷ ' + d + ' gives quotient ' + Math.floor(total/d) + ' with remainder ' + rem + '.';
    } else {
      const a = getRandomInt(13, 24);
      const b = getRandomInt(11, 16);
      const c = getRandomInt(8, 14);
      const d = getRandomInt(7, 12);
      const e = getRandomInt(4, 8);
      question = '(' + a + ' × ' + b + ') - (' + c + ' × ' + d + ') + ' + e + '² = ?';
      answer = (a * b) - (c * d) + (e * e);
      hint = 'Multiplications and square first, then subtract and add.';
      explanation = 'Step 1: ' + a + ' × ' + b + ' = ' + (a*b) + '. Step 2: ' + c + ' × ' + d + ' = ' + (c*d) + '. Step 3: ' + e + '² = ' + (e*e) + '. Step 4: ' + (a*b) + ' - ' + (c*d) + ' + ' + (e*e) + ' = ' + answer + '.';
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
    explanation,
    inputType: 'text'
  };
}

function generateLogicChallenge(difficulty = 'insane') {
  const id = 'logic_' + Date.now() + '_' + getRandomInt(100, 999);
  const RIDDLES = [
    {
      question: 'A bat and a baseball cost $1.10 in total. The bat costs $1.00 more than the ball. How many cents does the ball cost?',
      answer: '5',
      hint: 'Be careful: the intuitive answer of 10 cents is a cognitive trap!',
      explanation: 'Let the ball cost B cents. The bat costs B + 100 cents. Together: B + (B + 100) = 110 cents => 2B = 10 => B = 5 cents. (If the ball were 10 cents, the bat would cost $1.10, making the total $1.20).',
      options: ['5', '10', '1', '15']
    },
    {
      question: 'If 5 machines take 5 minutes to make 5 widgets, how many minutes does it take 100 machines to make 100 widgets?',
      answer: '5',
      hint: 'Think about how long ONE machine takes to make ONE widget.',
      explanation: 'Each machine works independently and takes 5 minutes to produce 1 widget. Therefore, 100 machines operating in parallel will all finish their individual widgets in exactly 5 minutes, yielding 100 widgets.',
      options: ['5', '100', '20', '50']
    },
    {
      question: 'In a lake, a patch of water lilies doubles in size every day. If it takes 48 days to cover the entire lake, how many days does it take to cover half the lake?',
      answer: '47',
      hint: 'Work backwards from the 48th day.',
      explanation: 'Because the patch doubles in area every single day, going back one day halves its area. If the lake is 100% full on day 48, it was exactly 50% (half) covered on day 47.',
      options: ['47', '24', '46', '12']
    },
    {
      question: 'If 3 cats can catch 3 mice in 3 minutes, how many cats are needed to catch 100 mice in 100 minutes?',
      answer: '3',
      hint: 'Calculate the rate of catching mice per cat.',
      explanation: '3 cats catch 3 mice in 3 minutes, which means 1 cat catches 1 mouse every 3 minutes. In 100 minutes, 1 cat catches 100/3 = 33.33 mice. Thus, 3 cats will catch 3 × 33.33 = 100 mice in 100 minutes.',
      options: ['3', '100', '33', '9']
    },
    {
      question: 'A farmer has 17 sheep. All but 9 of them die in a sudden storm. How many sheep are still alive?',
      answer: '9',
      hint: 'Read the phrase "all but 9" literally.',
      explanation: 'The phrase "all but 9 die" states directly that 9 sheep survived. The remaining 9 sheep are still alive.',
      options: ['9', '8', '0', '17']
    },
    {
      question: 'A snail climbs a 10-foot pole. Each day it climbs 3 feet, but slips down 2 feet every night. On which day does it first reach the top?',
      answer: '8',
      hint: 'Once the snail reaches the top during daylight, it does not slip down.',
      explanation: 'After 7 full cycles of day and night, the snail is at 7 feet (7 days × 1 net foot). On the morning of day 8, it climbs 3 feet: 7 + 3 = 10 feet! It reaches the summit on day 8 before night falls.',
      options: ['8', '10', '7', '9']
    },
    {
      question: 'Two friends have 110 marbles combined. Friend A has 100 more marbles than Friend B. How many marbles does Friend B have?',
      answer: '5',
      hint: 'Do not rush to say 10! Form an equation.',
      explanation: 'Let Friend B have B marbles. Friend A has B + 100. Total: (B + 100) + B = 110 => 2B = 10 => B = 5 marbles. Friend A has 105 marbles. Total: 105 + 5 = 110.',
      options: ['5', '10', '15', '20']
    },
    {
      question: 'A rope ladder hangs over a ship. The rungs are 12 inches apart and 4 rungs are above water. If the ocean tide rises by 36 inches, how many rungs remain above water?',
      answer: '4',
      hint: 'Think about what happens to the ship when the tide rises.',
      explanation: 'Because the ship floats on the surface of the ocean, the entire ship and ladder rise together with the tide. The water level relative to the ladder never changes, so 4 rungs remain above water.',
      options: ['4', '1', '7', '0']
    }
  ];

  const chosen = RIDDLES[getRandomInt(0, RIDDLES.length - 1)];

  return {
    id,
    type: 'logic',
    difficulty,
    title: '🧩 Cognitive Reflection & Logic Test',
    instruction: 'Override your intuitive impulse: solve the riddle with active reasoning:',
    question: chosen.question,
    answer: chosen.answer,
    hint: chosen.hint,
    explanation: chosen.explanation,
    options: shuffle(chosen.options),
    inputType: 'choice'
  };
}

function generateMatrixChallenge(difficulty = 'insane') {
  const id = 'matrix_' + Date.now() + '_' + getRandomInt(100, 999);
  const template = getRandomInt(1, 3);
  let grid = [];
  let answer = 0;
  let explanation = '';
  let hint = 'Find the mathematical rule connecting each row.';

  if (template === 1) {
    const k = getRandomInt(1, 4);
    const r1 = [getRandomInt(2, 5), getRandomInt(3, 6)];
    const r1_ans = (r1[0] * r1[1]) + k;
    const r2 = [getRandomInt(3, 6), getRandomInt(2, 5)];
    const r2_ans = (r2[0] * r2[1]) + k;
    const r3 = [getRandomInt(4, 7), getRandomInt(3, 6)];
    answer = (r3[0] * r3[1]) + k;

    grid = [
      '[ ' + r1[0] + '  |  ' + r1[1] + '  |  ' + r1_ans + ' ]',
      '[ ' + r2[0] + '  |  ' + r2[1] + '  |  ' + r2_ans + ' ]',
      '[ ' + r3[0] + '  |  ' + r3[1] + '  |   ?   ]'
    ];
    explanation = 'In each row, Column 3 = (Column 1 × Column 2) + ' + k + '. Row 3: (' + r3[0] + ' × ' + r3[1] + ') + ' + k + ' = ' + answer + '.';
  } else if (template === 2) {
    const r1 = [getRandomInt(2, 4), getRandomInt(2, 4)];
    const r1_ans = (r1[0] * r1[0]) + (r1[1] * r1[1]);
    const r2 = [getRandomInt(1, 4), getRandomInt(3, 5)];
    const r2_ans = (r2[0] * r2[0]) + (r2[1] * r2[1]);
    const r3 = [getRandomInt(3, 5), getRandomInt(2, 4)];
    answer = (r3[0] * r3[0]) + (r3[1] * r3[1]);

    grid = [
      '[ ' + r1[0] + '  |  ' + r1[1] + '  |  ' + r1_ans + ' ]',
      '[ ' + r2[0] + '  |  ' + r2[1] + '  |  ' + r2_ans + ' ]',
      '[ ' + r3[0] + '  |  ' + r3[1] + '  |   ?   ]'
    ];
    explanation = 'In each row, Column 3 is the sum of squares of Column 1 and 2: (' + r3[0] + '² + ' + r3[1] + '²) = ' + (r3[0]*r3[0]) + ' + ' + (r3[1]*r3[1]) + ' = ' + answer + '.';
  } else {
    const targetSum = getRandomInt(24, 38);
    const r1 = [getRandomInt(5, 10), getRandomInt(6, 12)];
    const r1_ans = targetSum - (r1[0] + r1[1]);
    const r2 = [getRandomInt(4, 9), getRandomInt(7, 13)];
    const r2_ans = targetSum - (r2[0] + r2[1]);
    const r3 = [getRandomInt(5, 11), getRandomInt(6, 12)];
    answer = targetSum - (r3[0] + r3[1]);

    grid = [
      '[ ' + r1[0] + '  |  ' + r1[1] + '  |  ' + r1_ans + ' ]',
      '[ ' + r2[0] + '  |  ' + r2[1] + '  |  ' + r2_ans + ' ]',
      '[ ' + r3[0] + '  |  ' + r3[1] + '  |   ?   ]'
    ];
    explanation = 'The sum of numbers in every row is constant at ' + targetSum + '. Row 3: ' + r3[0] + ' + ' + r3[1] + ' + ? = ' + targetSum + ' => ? = ' + answer + '.';
  }

  const offsets = shuffle([-4, -2, -1, 1, 3, 5]);
  const options = shuffle([
    String(answer),
    String(answer + offsets[0]),
    String(answer + offsets[1]),
    String(answer + offsets[2])
  ]);

  return {
    id,
    type: 'matrix',
    difficulty,
    title: '🔢 Matrix Number Logic Grid',
    instruction: 'Discover the hidden relationship across the rows and find the missing value (?):',
    question: grid.join('\\n'),
    answer: String(answer),
    hint,
    explanation,
    options,
    inputType: 'choice'
  };
}

function generateSequenceChallenge(difficulty = 'insane') {
  const id = 'seq_' + Date.now() + '_' + getRandomInt(100, 999);
  let sequence = [];
  let answer = 0;
  let explanation = '';

  if (difficulty === 'easy') {
    const start = getRandomInt(2, 15);
    const step = getRandomInt(3, 8);
    sequence = [start, start + step, start + step * 2, start + step * 3, '?'];
    answer = start + step * 4;
    explanation = 'The sequence increases by +' + step + ' each step.';
  } else if (difficulty === 'medium') {
    const type = getRandomInt(1, 2);
    if (type === 1) {
      const start = getRandomInt(2, 6);
      sequence = [start, start * 2, start * 4, start * 8, '?'];
      answer = start * 16;
      explanation = 'Each number is multiplied by 2.';
    } else {
      const a = getRandomInt(1, 5);
      const b = getRandomInt(a, 6);
      const c = a + b;
      const d = b + c;
      const e = c + d;
      sequence = [a, b, c, d, e, '?'];
      answer = d + e;
      explanation = 'Each term is the sum of the previous two terms (Fibonacci pattern).';
    }
  } else {
    const type = getRandomInt(1, 3);
    if (type === 1) {
      const aStart = getRandomInt(2, 5);
      const bStart = getRandomInt(10, 20);
      const bStep = getRandomInt(3, 5);
      sequence = [
        aStart,
        bStart,
        aStart * 2,
        bStart + bStep,
        aStart * 4,
        bStart + bStep * 2,
        aStart * 8,
        '?'
      ];
      answer = bStart + bStep * 3;
      explanation = 'Dual interleaved sequence: Odd terms double (×2), while Even terms add +' + bStep + '. Next is ' + (bStart + bStep * 2) + ' + ' + bStep + ' = ' + answer + '.';
    } else if (type === 2) {
      const offset = getRandomInt(1, 3);
      sequence = [
        Math.pow(offset, 3),
        Math.pow(offset + 1, 3),
        Math.pow(offset + 2, 3),
        Math.pow(offset + 3, 3),
        '?'
      ];
      answer = Math.pow(offset + 4, 3);
      explanation = 'Consecutive cubes: ' + (offset + 4) + '³ = ' + answer + '.';
    } else {
      const start = getRandomInt(3, 10);
      const v1 = start;
      const v2 = v1 + 3;
      const v3 = v2 + 6;
      const v4 = v3 + 9;
      const v5 = v4 + 12;
      sequence = [v1, v2, v3, v4, v5, '?'];
      answer = v5 + 15;
      explanation = 'Differences increase by +3 each step: +3, +6, +9, +12, +15. ' + v5 + ' + 15 = ' + answer + '.';
    }
  }

  const offsets = shuffle([-3, -2, -1, 1, 2, 4]);
  const options = shuffle([
    String(answer),
    String(answer + offsets[0]),
    String(answer + offsets[1]),
    String(answer + offsets[2])
  ]);

  return {
    id,
    type: 'sequence',
    difficulty,
    title: '🧩 Pattern Recognition Challenge',
    instruction: 'Identify the rule and find the missing number (?):',
    question: sequence.join(', '),
    answer: String(answer),
    options,
    explanation,
    hint: 'Look for alternating patterns or expanding differences.',
    inputType: 'choice'
  };
}

function generateStroopChallenge(difficulty = 'hard') {
  const id = 'stroop_' + Date.now() + '_' + getRandomInt(100, 999);
  const shuffled = shuffle(STROOP_COLORS);
  const wordObj = shuffled[0];
  const inkObj = shuffled[1];
  const answer = inkObj.name;

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
    question: 'What INK COLOR is this word printed in?',
    answer,
    options,
    hint: 'Look at the color of the letters, do not read the letters themselves!',
    explanation: 'The word spells "' + wordObj.name.toUpperCase() + '", but the printed visual ink color is ' + inkObj.name + '. Stroop inhibition tests executive suppression of automated reading.',
    inputType: 'choice'
  };
}

function generateIbaBcsChallenge(difficulty = 'insane') {
  const id = 'ibabcs_' + Date.now() + '_' + getRandomInt(100, 999);
  const category = getRandomInt(1, 6);

  if (category === 1) {
    const pairs = [
      { a: 10, b: 15, ans: 6 },
      { a: 12, b: 24, ans: 8 },
      { a: 20, b: 30, ans: 12 },
      { a: 15, b: 30, ans: 10 },
      { a: 12, b: 6, ans: 4 }
    ];
    const item = pairs[getRandomInt(0, pairs.length - 1)];
    const question = 'Worker A can finish a project in ' + item.a + ' days, and Worker B finishes the same project in ' + item.b + ' days. Working together, in how many days will they complete the project?';
    const answer = String(item.ans);
    const explanation = "Worker A's 1-day rate = 1/" + item.a + ". Worker B's 1-day rate = 1/" + item.b + ". Combined rate = 1/" + item.a + " + 1/" + item.b + " = (" + item.b + " + " + item.a + ") / (" + (item.a * item.b) + ") = 1/" + item.ans + ". Therefore, together they take " + item.ans + " days.";
    const offsets = shuffle([-3, -2, -1, 1, 2, 4]);
    const options = shuffle([
      answer,
      String(item.ans + offsets[0]),
      String(item.ans + offsets[1]),
      String(item.ans + offsets[2])
    ]);

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'time_and_work',
      difficulty,
      title: '🏛️ IBA / BCS Standard: Time & Work',
      instruction: 'Solve this competitive entrance arithmetic problem:',
      question,
      answer,
      options,
      hint: "Calculate each worker's 1-day fraction of work, add them, and invert.",
      explanation,
      inputType: 'choice'
    };
  } else if (category === 2) {
    const items = [
      {
        q: 'An item is marked up by 25% and then discounted by 20%. What is the net percentage profit or loss?',
        ans: '0% (Break-even)',
        expl: 'Formula: Net change = [a + b + (a×b)/100]%. Here a = +25, b = -20. Net = 25 - 20 - (25×20)/100 = 5 - 5 = 0%. The retailer breaks even.',
        opts: ['0% (Break-even)', '+5% profit', '-5% loss', '+4% profit']
      },
      {
        q: "A software engineer's salary increases by 20% in year one, but is reduced by 10% in year two. What is the net percentage change from original?",
        ans: '+8% increase',
        expl: 'Let original salary = 100. After +20%, salary = 120. After -10% of 120, reduction = 12. Final salary = 120 - 12 = 108. Net change = +8% increase.',
        opts: ['+8% increase', '+10% increase', '+5% increase', '-2% decrease']
      },
      {
        q: 'A stock price surges by 50% on Monday, but crashes by 50% on Tuesday. What is the overall percentage change?',
        ans: '-25% decrease',
        expl: 'Formula: Let initial value = 100. Monday = 150. Tuesday (-50% of 150) = 75. Overall change = 75 - 100 = -25% (a net 25% loss). Intuitive 0% is an autopilot trap.',
        opts: ['-25% decrease', '0% (Unchanged)', '-15% decrease', '-50% decrease']
      },
      {
        q: 'The length of a rectangle increases by 30% and width decreases by 20%. By what percentage does the area change?',
        ans: '+4% increase',
        expl: 'Area change = a + b + (ab/100) = 30 - 20 - (30×20)/100 = 10 - 6 = +4% increase.',
        opts: ['+4% increase', '+10% increase', '-4% decrease', '+6% increase']
      }
    ];
    const item = items[getRandomInt(0, items.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'successive_percentages',
      difficulty,
      title: '📊 IBA / BCS Standard: Percentage & Profit-Loss',
      instruction: 'Calculate the cumulative rate of change without falling into cognitive traps:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: 'Apply successive percentage rule: a + b + (ab/100).',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else if (category === 3) {
    const items = [
      {
        q: 'A train 120 meters long passes an electric telegraph post in 6 seconds. What is the speed of the train in km/h?',
        ans: '72 km/h',
        expl: 'Speed in m/s = Distance / Time = 120m / 6s = 20 m/s. To convert to km/h, multiply by 18/5: 20 × (18/5) = 72 km/h.',
        opts: ['72 km/h', '60 km/h', '54 km/h', '80 km/h']
      },
      {
        q: 'Two trains 100m and 150m long are moving towards each other on parallel tracks at 40 km/h and 50 km/h. How many seconds will they take to completely pass each other?',
        ans: '10 seconds',
        expl: 'Total distance = 100m + 150m = 250m. Relative speed = 40 + 50 = 90 km/h. Convert to m/s: 90 × (5/18) = 25 m/s. Time = 250m / 25 m/s = 10 seconds.',
        opts: ['10 seconds', '12 seconds', '8 seconds', '15 seconds']
      },
      {
        q: 'A train 150 meters long is traveling at 54 km/h. How many seconds will it take to cross a bridge 300 meters long?',
        ans: '30 seconds',
        expl: 'Total distance to clear = Train length + Bridge length = 150m + 300m = 450m. Speed = 54 km/h = 54 × (5/18) = 15 m/s. Time = 450m / 15 m/s = 30 seconds.',
        opts: ['30 seconds', '25 seconds', '35 seconds', '20 seconds']
      }
    ];
    const item = items[getRandomInt(0, items.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'relative_speed',
      difficulty,
      title: '🚆 IBA / BCS Standard: Relative Speed & Distance',
      instruction: 'Determine the velocity / crossing time using relative motion formulas:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: 'Total distance is the sum of lengths. Convert km/h to m/s by multiplying with 5/18.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else if (category === 4) {
    const items = [
      {
        q: 'In a 60-liter mixture of milk and water, the ratio of milk to water is 2:1. How many liters of water must be added to make the ratio 1:2?',
        ans: '60 liters',
        expl: 'Initial amounts: Total = 60L. Ratio 2:1 => Milk = 40L, Water = 20L. In the new ratio 1:2, Milk is 1 part (40L), so Water must be 2 parts = 80L. Water to add = 80L - 20L = 60 liters.',
        opts: ['60 liters', '40 liters', '30 liters', '50 liters']
      },
      {
        q: 'In a 45-liter container of acid and water, the ratio is 2:1. How many liters of water must be added so that the ratio of acid to water becomes 1:1?',
        ans: '15 liters',
        expl: 'Total = 45L. Acid = (2/3)×45 = 30L, Water = 15L. To make the ratio 1:1, Water must equal Acid (30L). Water added = 30L - 15L = 15 liters.',
        opts: ['15 liters', '20 liters', '10 liters', '25 liters']
      }
    ];
    const item = items[getRandomInt(0, items.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'mixture_ratio',
      difficulty,
      title: '🧪 IBA / BCS Standard: Mixtures & Ratio',
      instruction: 'Compute the exact volume required for ratio equilibration:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: 'Find the invariant component (the one not being added), and calculate target proportion.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else if (category === 5) {
    const items = [
      {
        q: 'Pointing to a portrait of a gentleman, a lady says: "His mother is the only daughter of my mother." How is the lady related to the gentleman in the portrait?',
        ans: 'Mother',
        expl: '"The only daughter of my mother" means the lady herself. Thus, his mother is the lady herself. The lady is his Mother.',
        opts: ['Mother', 'Aunt', 'Sister', 'Grandmother']
      },
      {
        q: 'A is the brother of B. B is the daughter of C. D is the father of C. How is A related to D?',
        ans: 'Grandson',
        expl: 'B is daughter of C, and A is brother of B, so A is the son of C. Since D is the father of C, A is the Grandson of D.',
        opts: ['Grandson', 'Son', 'Brother', 'Nephew']
      },
      {
        q: 'A man says: "The father of the boy playing chess is the only son of my father." How is the man related to the boy?',
        ans: 'Father',
        expl: '"The only son of my father" refers to the speaker himself. Therefore, the father of the boy is the speaker himself. He is the Father.',
        opts: ['Father', 'Uncle', 'Brother', 'Grandfather']
      }
    ];
    const item = items[getRandomInt(0, items.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'mental_ability_relations',
      difficulty,
      title: '👥 BCS Mental Ability: Blood Relations',
      instruction: 'Trace the genealogical chain to identify the relationship:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: "Break down statements from the perspective of the speaker ('my mother\\'s only daughter').",
      explanation: item.expl,
      inputType: 'choice'
    };
  } else {
    const subType = getRandomInt(1, 2);
    if (subType === 1) {
      const triples = [
        { north: 9, east: 12, ans: 15 },
        { north: 6, east: 8, ans: 10 },
        { north: 5, east: 12, ans: 13 },
        { north: 8, east: 15, ans: 17 }
      ];
      const item = triples[getRandomInt(0, triples.length - 1)];
      const question = 'A candidate walks ' + item.north + ' km North, then turns 90° right and walks ' + item.east + ' km East. What is the shortest direct straight-line distance from the starting point?';
      const answer = item.ans + ' km';
      const explanation = 'North and East form a perpendicular 90° right triangle. By the Pythagorean theorem: Distance = √(' + item.north + '² + ' + item.east + '²) = √(' + (item.north * item.north) + ' + ' + (item.east * item.east) + ') = √' + (item.ans * item.ans) + ' = ' + item.ans + ' km.';
      const offsets = shuffle([-3, -1, 2, 4]);
      const options = shuffle([
        answer,
        (item.ans + offsets[0]) + ' km',
        (item.ans + offsets[1]) + ' km',
        (item.ans + offsets[2]) + ' km'
      ]);

      return {
        id,
        type: 'iba_bcs',
        subCategory: 'direction_pythagoras',
        difficulty,
        title: '🧭 BCS Mental Ability: Direction & Displacement',
        instruction: 'Calculate the minimum Euclidean displacement from the origin:',
        question,
        answer,
        options,
        hint: 'Use the Pythagorean theorem: a² + b² = c².',
        explanation,
        inputType: 'choice'
      };
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const startIdx = getRandomInt(0, 6);
      const startDay = days[startIdx];
      const daysAhead = getRandomInt(45, 95);
      const targetIdx = (startIdx + daysAhead) % 7;
      const answer = days[targetIdx];
      const question = 'If today is ' + startDay + ', what day of the week will it be exactly ' + daysAhead + ' days from today?';
      const remainder = daysAhead % 7;
      const explanation = 'Each 7 days brings back the exact same day of the week. ' + daysAhead + ' ÷ 7 = ' + Math.floor(daysAhead / 7) + ' cycles with a remainder of ' + remainder + '. Counting ' + remainder + ' days forward from ' + startDay + ' lands on ' + answer + '.';
      const otherDays = days.filter(d => d !== answer);
      const options = shuffle([answer, otherDays[0], otherDays[1], otherDays[2]]);

      return {
        id,
        type: 'iba_bcs',
        subCategory: 'calendar_modular',
        difficulty,
        title: '📅 BCS Mental Ability: Calendar Mathematics',
        instruction: 'Compute the modular weekday offset:',
        question,
        answer,
        options,
        hint: 'Divide the number of days by 7 and find the remainder.',
        explanation,
        inputType: 'choice'
      };
    }
  }
}

function generateGameLogicChallenge(difficulty = 'insane') {
  const id = 'game_' + Date.now() + '_' + getRandomInt(100, 999);
  const template = getRandomInt(1, 3);

  if (template === 1) {
    const a = getRandomInt(4, 7);
    const b = getRandomInt(3, 6);
    const answer = String(a * a + b * b);
    const question = 'Decipher the hidden operator rule:\\nIf 3 ⨁ 4 = 25\\nAnd 5 ⨁ 2 = 29\\nWhat is ' + a + ' ⨁ ' + b + ' = ?';
    const explanation = 'The operator ⨁ calculates the sum of squares: x ⨁ y = x² + y². For 3 ⨁ 4: 3² + 4² = 9 + 16 = 25. For ' + a + ' ⨁ ' + b + ': ' + a + '² + ' + b + '² = ' + (a * a) + ' + ' + (b * b) + ' = ' + answer + '.';
    const offsets = shuffle([-6, -4, 4, 8]);
    const options = shuffle([
      answer,
      String(a * a + b * b + offsets[0]),
      String(a * a + b * b + offsets[1]),
      String(a * a + b * b + offsets[2])
    ]);

    return {
      id,
      type: 'game_logic',
      subCategory: 'operator_cipher',
      difficulty,
      title: '🎮 Brain Game: Operator Decryption',
      instruction: 'Find the secret mathematical function represented by ⨁:',
      question,
      answer,
      options,
      hint: 'Look at squares or multiplication relationships.',
      explanation,
      inputType: 'choice'
    };
  } else if (template === 2) {
    const a = getRandomInt(5, 9);
    const b = getRandomInt(2, 4);
    const c = getRandomInt(3, 5);
    const target = (a - b) * c;
    const question = 'Which arithmetic sign (+, -, ×, ÷) must replace ❓ to make the equation true?\\n(' + a + ' ❓ ' + b + ') × ' + c + ' = ' + target;
    const answer = '-';
    const explanation = "Substitute '-': (" + a + " - " + b + ") × " + c + " = " + (a - b) + " × " + c + " = " + target + ". Therefore, ❓ must be the minus sign (-).";
    const options = ['-', '+', '×', '÷'];

    return {
      id,
      type: 'game_logic',
      subCategory: 'operator_game',
      difficulty,
      title: '🎯 Brain Game: Arithmetic Operator Match',
      instruction: 'Select the missing mathematical operator that balances the equation:',
      question,
      answer,
      options,
      hint: 'Divide both sides by ' + c + ' first to see what (' + a + ' ❓ ' + b + ') must equal.',
      explanation,
      inputType: 'choice'
    };
  } else {
    const words = [
      { plain: 'FOCUS', coded: 'GPFVT', target: 'BRAIN', targetCoded: 'CSBJO', rule: '+1' },
      { plain: 'LOGIC', coded: 'MPHJD', target: 'SMART', targetCoded: 'TNBSU', rule: '+1' },
      { plain: 'MIND', coded: 'OJPE', target: 'GOAL', targetCoded: 'IQCN', rule: '+2' }
    ];
    const item = words[getRandomInt(0, words.length - 1)];
    const question = 'In a cognitive cryptography game:\\n' + item.plain + ' is encrypted as "' + item.coded + '".\\nUsing the exact same cipher algorithm, how is "' + item.target + '" encrypted?';
    const answer = item.targetCoded;
    const explanation = 'Each letter is shifted forward by ' + item.rule + ' position(s) in the alphabet. Result = ' + answer + '.';
    
    const d1 = item.target.split('').map(c => String.fromCharCode(c.charCodeAt(0) + (item.rule === '+1' ? 2 : 1))).join('');
    const d2 = item.target.split('').reverse().join('');
    const d3 = item.targetCoded.slice(1) + item.targetCoded[0];
    const options = shuffle([answer, d1, d2, d3]);

    return {
      id,
      type: 'game_logic',
      subCategory: 'cipher_game',
      difficulty,
      title: '🔐 Brain Game: Alphabetic Cryptography',
      instruction: 'Crack the cipher shift rule and encode the target keyword:',
      question,
      answer,
      options,
      hint: 'Compare the position of each corresponding letter in the English alphabet.',
      explanation,
      inputType: 'choice'
    };
  }
}

function generateChallenge(type = 'random', difficulty = 'insane') {
  let chosenType = type;
  if (chosenType === 'random' || !CHALLENGE_TYPES.includes(chosenType)) {
    chosenType = CHALLENGE_TYPES[getRandomInt(0, CHALLENGE_TYPES.length - 1)];
  }

  switch (chosenType) {
    case 'math':
      return generateMathChallenge(difficulty);
    case 'logic':
      return generateLogicChallenge(difficulty);
    case 'matrix':
      return generateMatrixChallenge(difficulty);
    case 'sequence':
      return generateSequenceChallenge(difficulty);
    case 'stroop':
      return generateStroopChallenge(difficulty);
    case 'iba_bcs':
      return generateIbaBcsChallenge(difficulty);
    case 'game_logic':
      return generateGameLogicChallenge(difficulty);
    default:
      return generateLogicChallenge(difficulty);
  }
}

function verifyAnswer(challenge, submittedAnswer) {
  if (!challenge || submittedAnswer === undefined || submittedAnswer === null) {
    return false;
  }
  const cleanSubmitted = String(submittedAnswer).trim().toLowerCase();
  const cleanCorrect = String(challenge.answer).trim().toLowerCase();
  return cleanSubmitted === cleanCorrect;
}

// --- STATE MANAGER ---
class StateManager {
  constructor() {
    this.storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
    this.config = { ...DEFAULT_CONFIG };
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
          this.stats = {
            date: today,
            totalReelsToday: 0,
            challengesSolvedToday: 0,
            cooldownsTriggeredToday: 0
          };
          await this._persistStats();
        }
      }
      await this.checkCooldownStatus();
    } catch (err) {
      console.error('[MindShield BG] Error initializing state:', err);
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

  async checkCooldownStatus() {
    if (this.state.cooldownEndTime) {
      const now = Date.now();
      if (now < this.state.cooldownEndTime) {
        const remainingSeconds = Math.ceil((this.state.cooldownEndTime - now) / 1000);
        return { isCooldown: true, remainingSeconds };
      } else {
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

  async recordChallengeAttempt(success, challenge = null) {
    if (success) {
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

// --- SERVICE WORKER RUNTIME ---
const stateManager = new StateManager();

async function getStoredChallenge() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  const data = await chrome.storage.local.get([STORAGE_KEYS.ACTIVE_CHALLENGE]);
  return data[STORAGE_KEYS.ACTIVE_CHALLENGE] || null;
}

async function setStoredChallenge(challenge) {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  if (challenge) {
    await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_CHALLENGE]: challenge });
  } else {
    await chrome.storage.local.remove([STORAGE_KEYS.ACTIVE_CHALLENGE]);
  }
}

async function updateBadge() {
  if (typeof chrome === 'undefined' || !chrome.action) return;
  const state = await stateManager.getState();
  const config = await stateManager.getConfig();

  if (state.cooldownEndTime && Date.now() < state.cooldownEndTime) {
    chrome.action.setBadgeText({ text: '🛑' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else if (state.isBlocked) {
    chrome.action.setBadgeText({ text: 'LOCK' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
  } else if (state.reelCount > 0) {
    chrome.action.setBadgeText({ text: state.reelCount + '/' + config.reelLimit });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await stateManager.init();
  await updateBadge();
  console.log('[MindShield] Installed and initialized.');
});

chrome.runtime.onStartup.addListener(async () => {
  await stateManager.init();
  await updateBadge();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      await stateManager.init();
      const config = await stateManager.getConfig();
      let state = await stateManager.getState();

      switch (request.action) {
      case 'CHECK_STATUS': {
        const cooldown = await stateManager.checkCooldownStatus();
        const lastFailedChallenge = await stateManager.getLastFailedChallenge();
        if (cooldown.isCooldown) {
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: true,
            remainingSeconds: cooldown.remainingSeconds,
            lastFailedChallenge,
            reelCount: state.reelCount,
            config
          });
        }

        // Check dual limit threshold (Reels count >= 10 OR Elapsed time >= 15 min)
        const sessionStatus = await stateManager.checkSessionStatus();
        if (sessionStatus.isBlocked) {
          let challenge = await getStoredChallenge();
          if (!challenge) {
            challenge = generateChallenge(config.challengeType, config.difficulty);
            await setStoredChallenge(challenge);
          }
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: false,
            challenge,
            failedAttempts: state.failedAttempts,
            maxAttempts: config.maxFailedAttempts,
            reelCount: sessionStatus.reelCount,
            elapsedMinutes: sessionStatus.elapsedMinutes,
            reason: sessionStatus.reason,
            config
          });
        }

        await updateBadge();
        return sendResponse({
          isBlocked: false,
          isCooldown: false,
          reelCount: sessionStatus.reelCount,
          elapsedMinutes: sessionStatus.elapsedMinutes,
          config
        });
      }

      case 'REEL_SCROLLED': {
        const result = await stateManager.recordReelView();
        let challenge = null;

        if (result.shouldBlock && !result.isCooldown) {
          challenge = await getStoredChallenge();
          if (!challenge) {
            challenge = generateChallenge(config.challengeType, config.difficulty);
            await setStoredChallenge(challenge);
          }
        }

        await updateBadge();
        state = await stateManager.getState();

        return sendResponse({
          ...result,
          challenge,
          failedAttempts: state.failedAttempts,
          maxAttempts: config.maxFailedAttempts,
          config
        });
      }

      case 'SUBMIT_CHALLENGE': {
        let challenge = await getStoredChallenge();
        if (!challenge) {
          challenge = generateChallenge(config.challengeType, config.difficulty);
          await setStoredChallenge(challenge);
        }

        const isCorrect = verifyAnswer(challenge, request.answer);
        const attemptResult = await stateManager.recordChallengeAttempt(isCorrect, challenge);

        if (attemptResult.unlocked) {
          await setStoredChallenge(null);
        }

        await updateBadge();
        return sendResponse({
          unlocked: attemptResult.unlocked,
          cooldownTriggered: attemptResult.cooldownTriggered,
          remainingSeconds: attemptResult.cooldownEndTime ? Math.ceil((attemptResult.cooldownEndTime - Date.now()) / 1000) : 0,
          failedAttempts: attemptResult.failedAttempts || 0,
          maxAttempts: config.maxFailedAttempts,
          lastFailedChallenge: attemptResult.lastFailedChallenge || challenge
        });
      }

      case 'START_COOLDOWN': {
        let challenge = await getStoredChallenge();
        const challengeToSave = request.failedChallenge || challenge;
        const { cooldownEndTime, remainingSeconds, lastFailedChallenge } = await stateManager.startCooldown(null, challengeToSave);
        await setStoredChallenge(null);
        await updateBadge();
        return sendResponse({ cooldownEndTime, remainingSeconds, lastFailedChallenge });
      }

      case 'GET_POPUP_DATA': {
        const cooldown = await stateManager.checkCooldownStatus();
        const stats = await stateManager.getStats();
        const lastFailedChallenge = await stateManager.getLastFailedChallenge();
        state = await stateManager.getState();
        return sendResponse({
          state,
          config,
          stats,
          isCooldown: cooldown.isCooldown,
          remainingSeconds: cooldown.remainingSeconds,
          lastFailedChallenge
        });
      }

      case 'RESET_SESSION': {
        await stateManager.resetSession();
        await setStoredChallenge(null);
        await updateBadge();
        return sendResponse({ success: true });
      }

      default:
        return sendResponse({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('[MindShield BG] Error handling message:', err);
    sendResponse({ error: err.message });
  }
})();

return true;
});
`;

fs.writeFileSync(path.resolve(distDir, 'background.bundle.js'), bgBundleContent, 'utf8');
console.log('[MindShield Builder] background.bundle.js generated successfully.');

// --- 2. BUILD CONTENT BUNDLE ---
const contentBundleContent = `/**
 * MindShield Content Script Bundle (Standalone - Zero Imports)
 * Injected into Instagram, YouTube Shorts, Facebook, and TikTok.
 * Features:
 *  - Multi-signal Reel & Short Video detection (<video> playback + SPA URL observer)
 *  - Floating live count pill (real-time feedback for the user)
 *  - Scroll trap and full-screen challenge overlay
 *  - Pure Web Audio API focus tones, fanfare, error buzz, and neuro soundscapes
 *  - Missed challenge solution & explanation breakdown on cooldown screen
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
      regex: /^https?:\\/\\/(?:www\\.)?instagram\\.com\\/(?:reels?)(?:\\/([A-Za-z0-9_-]*))?/i
    },
    {
      platform: 'youtube',
      regex: /^https?:\\/\\/(?:www\\.)?youtube\\.com\\/shorts\\/([A-Za-z0-9_-]+)/i
    },
    {
      platform: 'facebook',
      regex: /^https?:\\/\\/(?:www\\.)?facebook\\.com\\/(?:reels?\\/|watch\\/\\?v=)([0-9]+)/i
    },
    {
      platform: 'tiktok',
      regex: /^https?:\\/\\/(?:www\\.)?tiktok\\.com\\/(?:@[^/]+\\/video\\/(\\d+)|foryou)/i
    },
    {
      platform: 'test-playground',
      regex: /(?:playground\\.html|\\?test=reels)/i
    }
  ];

  function isReelsUrl(url) {
    if (!url) return { match: false, platform: null };
    for (const { platform, regex } of PATTERNS) {
      if (regex.test(url)) {
        return { match: true, platform };
      }
    }
    if (/instagram\\.com\\/(?:reel|reels)/i.test(url)) {
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
    // Turned off by user request: "ting ting ting ting" sound disabled
    return;
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
      this.currentOverlayType = null;
      this.currentChallengeId = null;
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
      this.currentOverlayType = null;
      this.currentChallengeId = null;
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
      if (this.currentOverlayType === 'challenge' && this.currentChallengeId === challenge.id) {
        return;
      }
      this.currentOverlayType = 'challenge';
      this.currentChallengeId = challenge.id;

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
      } else if (challenge.type === 'matrix') {
        challengeContent = '<div class="ms-subtitle">' + challenge.instruction + '</div>' +
          '<div class="ms-matrix-grid">' + challenge.question + '</div>';
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

    showCooldown(remainingSeconds, onComplete, solutionInfo = null) {
      if (this.currentOverlayType === 'cooldown') {
        return;
      }
      this.currentOverlayType = 'cooldown';
      this.currentChallengeId = null;

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

      let solutionHtml = '';
      if (solutionInfo && solutionInfo.question) {
        solutionHtml = [
          '<div class="ms-solution-box">',
          '  <div class="ms-solution-header">',
          '    <span>💡 Missed Puzzle Solution & Explanation</span>',
          '    <button type="button" class="ms-solution-toggle-btn" id="ms-solution-toggle-btn">Hide Solution</button>',
          '  </div>',
          '  <div class="ms-solution-body" id="ms-solution-body">',
          '    <div class="ms-sol-row">',
          '      <span class="ms-sol-label">Question:</span>',
          '      <p class="ms-sol-val-q">' + solutionInfo.question + '</p>',
          '    </div>',
          '    <div class="ms-sol-row">',
          '      <span class="ms-sol-label">Correct Answer:</span>',
          '      <span class="ms-sol-val-ans">' + solutionInfo.answer + '</span>',
          '    </div>',
          '    <div class="ms-sol-row">',
          '      <span class="ms-sol-label">Step-by-Step Logic Breakdown:</span>',
          '      <p class="ms-sol-val-exp">' + (solutionInfo.explanation || 'Analyze the underlying patterns to strengthen cognitive control.') + '</p>',
          '    </div>',
          '  </div>',
          '</div>'
        ].join('');
      }

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
        '    ' + solutionHtml,
        '  </div>',
        '  <div class="ms-quote">"The ability to delay gratification is the ultimate superpower in the age of algorithms."</div>',
        '</div>'
      ].join('');

      const timerVal = root.querySelector('#ms-timer-val');
      const soundToggleBtn = root.querySelector('#ms-sound-toggle');
      const soundscapeSelect = root.querySelector('#ms-soundscape-select');
      const soundscapeToggleBtn = root.querySelector('#ms-soundscape-toggle');
      const soundscapeDesc = root.querySelector('#ms-soundscape-desc');
      const soundscapeStatus = root.querySelector('#ms-soundscape-status');
      const solutionToggleBtn = root.querySelector('#ms-solution-toggle-btn');
      const solutionBody = root.querySelector('#ms-solution-body');

      if (solutionToggleBtn && solutionBody) {
        solutionToggleBtn.addEventListener('click', () => {
          const isHidden = solutionBody.classList.toggle('hidden');
          solutionToggleBtn.textContent = isHidden ? 'Show Solution' : 'Hide Solution';
        });
      }

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
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(msg, res => {
            if (chrome.runtime.lastError) {
              resolve({});
            } else {
              resolve(res || {});
            }
          });
        } else {
          resolve({});
        }
      } catch {
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
      }, res.lastFailedChallenge);
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
          }, response.lastFailedChallenge || currentChallenge);
        } else {
          overlayManager.showErrorFeedback('Incorrect answer, try again!', (response.maxAttempts || 3) - response.failedAttempts);
        }
      },
      onGiveUp: async () => {
        const response = await sendMessageToBg({
          action: 'START_COOLDOWN',
          failedChallenge: currentChallenge
        });
        pillManager.update(0, currentReelLimit, true, true);
        overlayManager.showCooldown(response.remainingSeconds, () => {
          overlayManager.removeOverlay();
          checkCurrentStatus();
        }, currentChallenge);
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

  window.addEventListener('yt-navigate-finish', checkUrlChange);
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('hashchange', checkUrlChange);

  setInterval(() => {
    checkUrlChange();
  }, 400);

  // Periodic time threshold ticker: ensures 15-minute time limit blocks the feed
  // even if user stays on a single reel without scrolling or URL change.
  setInterval(() => {
    checkCurrentStatus();
  }, 5000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkCurrentStatus();
    });
  } else {
    checkCurrentStatus();
  }
})();
`;

fs.writeFileSync(path.resolve(distDir, 'content.bundle.js'), contentBundleContent, 'utf8');
console.log('[MindShield Builder] content.bundle.js generated successfully.');

console.log('[MindShield Builder] Build completed successfully.');
