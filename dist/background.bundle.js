/**
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
    question: grid.join('\n'),
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
      hint: "Break down statements from the perspective of the speaker ('my mother\'s only daughter').",
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
    const question = 'Decipher the hidden operator rule:\nIf 3 ⨁ 4 = 25\nAnd 5 ⨁ 2 = 29\nWhat is ' + a + ' ⨁ ' + b + ' = ?';
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
    const question = 'Which arithmetic sign (+, -, ×, ÷) must replace ❓ to make the equation true?\n(' + a + ' ❓ ' + b + ') × ' + c + ' = ' + target;
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
    const question = 'In a cognitive cryptography game:\n' + item.plain + ' is encrypted as "' + item.coded + '".\nUsing the exact same cipher algorithm, how is "' + item.target + '" encrypted?';
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
  })();

  return true;
});
