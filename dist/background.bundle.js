/**
 * MindShield Background Service Worker (Bundled)
 * Handles state management, badge counters, challenge generation & validation,
 * solution persistence, and cooldown timer enforcement.
 */

// --- CONFIGURATION ---
const DEFAULT_CONFIG = {
  reelLimit: 5,
  timeLimitMinutes: 10,
  cooldownMinutes: 30,
  challengeType: 'random', // 'math', 'sequence', 'stroop', 'logic', 'matrix', 'random'
  difficulty: 'insane',    // 'easy', 'medium', 'hard', 'insane'
  soundEnabled: true,
  maxFailedAttempts: 3
};

const STORAGE_KEYS = {
  CONFIG: 'mindshield_config',
  STATE: 'mindshield_state',
  STATS: 'mindshield_stats',
  ACTIVE_CHALLENGE: 'mindshield_active_challenge',
  LAST_FAILED_CHALLENGE: 'mindshield_last_failed_challenge'
};

// --- CHALLENGE ENGINE ---
const CHALLENGE_TYPES = ['math', 'sequence', 'stroop', 'logic', 'matrix'];

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

        if (state.isBlocked) {
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
            reelCount: state.reelCount,
            config
          });
        }

        await updateBadge();
        return sendResponse({
          isBlocked: false,
          isCooldown: false,
          reelCount: state.reelCount,
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
