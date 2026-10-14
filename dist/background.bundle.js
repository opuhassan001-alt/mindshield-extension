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
  LAST_FAILED_CHALLENGE: 'mindshield_last_failed_challenge',
  RECENT_CHALLENGES: 'mindshield_recent_challenges'
};

// --- CHALLENGE ENGINE (HIGH-STANDARD IBA/BCS/CRT & ANTI-REPETITION) ---

/**
 * MindShield Challenge Engine (High-Standard Cognitive Resilience Edition)
 * Generates elite prefrontal cortex challenges:
 *  - Dhaka University IBA entrance standard quantitative arithmetic & analytical reasoning
 *  - BCS Preliminary & Written mental ability (বিসিএস মানসিক দক্ষতা: clock angles, calendar modulo, syllogisms, vectors)
 *  - Cognitive Reflection Tests (CRT-3 & dual-process System 1 override traps)
 *  - Advanced 3x3 functional number matrix grids
 *  - Multi-step modular algebra, remainder cycles, and symmetric polynomials
 *  - Cryptarithms and symbolic operator decryption
 *
 * Equipped with dynamic parameter randomization and anti-repetition signature hashing.
 */

const CHALLENGE_TYPES = [
  'iba_bcs',
  'logic',
  'math',
  'matrix',
  'sequence',
  'game_logic',
  'stroop'
];

const STROOP_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Cyan', hex: '#06b6d4' }
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

function getChallengeSignature(challenge) {
  if (!challenge || !challenge.question) return '';
  const cleanQ = String(challenge.question)
    .slice(0, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${challenge.type || 'gen'}_${cleanQ}`;
}

// ============================================================================
// 1. DHAKA UNIVERSITY IBA & BCS PRELIMINARY/WRITTEN COGNITIVE CHALLENGES
// ============================================================================
function generateIbaBcsChallenge(difficulty = 'insane') {
  const id = `ibabcs_${Date.now()}_${getRandomInt(100, 999)}`;
  const category = getRandomInt(1, 8);

  if (category === 1) {
    // 1. Clock Angle Mathematics (BCS Mental Ability Classic: |(60H - 11M)/2| degrees)
    const times = [
      { h: 3, m: 40, ans: 130 },
      { h: 8, m: 20, ans: 130 },
      { h: 7, m: 15, ans: 127.5 },
      { h: 2, m: 25, ans: 77.5 },
      { h: 4, m: 50, ans: 155 },
      { h: 9, m: 35, ans: 77.5 },
      { h: 10, m: 10, ans: 115 },
      { h: 5, m: 20, ans: 40 },
      { h: 6, m: 30, ans: 15 },
      { h: 1, m: 50, ans: 115 }
    ];
    const item = times[getRandomInt(0, times.length - 1)];
    const timeStr = `${item.h}:${String(item.m).padStart(2, '0')}`;
    const question = `At ${timeStr}, what is the exact acute angle formed between the hour hand and the minute hand of a clock?`;
    const answer = `${item.ans}°`;
    const explanation = `Angle Formula: θ = |(60 × H - 11 × M) / 2|°. For ${timeStr}: |(60 × ${item.h} - 11 × ${item.m}) / 2| = |(${60 * item.h} - ${11 * item.m}) / 2| = |${(60 * item.h) - (11 * item.m)}| / 2 = ${item.ans}°.`;
    
    const offsets = shuffle([-15, -10, 10, 15, 20]);
    const options = shuffle([
      answer,
      `${item.ans + offsets[0]}°`,
      `${item.ans + offsets[1]}°`,
      `${item.ans + offsets[2]}°`
    ]);

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'bcs_clock_angle',
      difficulty,
      title: '🏛️ BCS Mental Ability: Clock Angle Geometry',
      instruction: 'Calculate the precise geometric angle between the hands:',
      question,
      answer,
      options,
      hint: 'Apply the standard clock angle formula: |(60H - 11M) / 2| degrees.',
      explanation,
      inputType: 'choice'
    };
  } else if (category === 2) {
    // 2. Harmonic Mean & Round-Trip Velocity Traps (IBA Quantitative Classic)
    const pairs = [
      { v1: 30, v2: 60, ans: 40 },
      { v1: 20, v2: 30, ans: 24 },
      { v1: 40, v2: 60, ans: 48 },
      { v1: 12, v2: 24, ans: 16 },
      { v1: 45, v2: 90, ans: 60 }
    ];
    const item = pairs[getRandomInt(0, pairs.length - 1)];
    const question = `A motorist drives from Town A to Town B at ${item.v1} km/h, and returns along the exact same route at ${item.v2} km/h. What is the average speed for the entire round trip?`;
    const answer = `${item.ans} km/h`;
    const arithmeticMean = (item.v1 + item.v2) / 2;
    const explanation = `Cognitive Trap Alert: Average speed is NOT the simple average (${arithmeticMean} km/h)! Because equal distances are covered at different speeds, average speed is the Harmonic Mean: (2 × v1 × v2) / (v1 + v2) = (2 × ${item.v1} × ${item.v2}) / (${item.v1} + ${item.v2}) = ${2 * item.v1 * item.v2} / ${item.v1 + item.v2} = ${item.ans} km/h.`;
    
    const options = shuffle([
      answer,
      `${arithmeticMean} km/h`,
      `${item.ans - 6} km/h`,
      `${item.ans + 8} km/h`
    ]);

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'iba_harmonic_speed',
      difficulty,
      title: '📊 IBA Quantitative: Harmonic Average Speed',
      instruction: 'Solve without falling into the arithmetic mean trap:',
      question,
      answer,
      options,
      hint: 'Average speed = Total Distance / Total Time. Equal distances require harmonic mean: 2ab / (a+b).',
      explanation,
      inputType: 'choice'
    };
  } else if (category === 3) {
    // 3. Repeated Dilution & Replacement Alligation (IBA & GRE Classic)
    const cases = [
      { initial: 80, drawn: 8, times: 2, pureFinal: '64.8 liters' },
      { initial: 50, drawn: 5, times: 2, pureFinal: '40.5 liters' },
      { initial: 60, drawn: 12, times: 2, pureFinal: '38.4 liters' },
      { initial: 100, drawn: 10, times: 2, pureFinal: '81 liters' },
      { initial: 40, drawn: 4, times: 2, pureFinal: '32.4 liters' }
    ];
    const item = cases[getRandomInt(0, cases.length - 1)];
    const question = `A container holds ${item.initial} liters of pure milk. Exactly ${item.drawn} liters are drawn off and replaced with water. This replacement process is repeated one more time (total 2 times). How much pure milk remains in the container?`;
    const answer = item.pureFinal;
    const fraction = (item.initial - item.drawn) / item.initial;
    const explanation = `Formula: Remaining Pure Liquid = Initial × (1 - Drawn/Initial)^n. Here: ${item.initial} × (1 - ${item.drawn}/${item.initial})^2 = ${item.initial} × (${fraction})^2 = ${item.initial} × ${Math.round(fraction*fraction*1000)/1000} = ${item.pureFinal}.`;

    const wrong1 = `${item.initial - (item.drawn * 2)} liters`;
    const wrong2 = `${item.initial - item.drawn} liters`;
    const wrong3 = `${Math.round((item.initial * 0.75) * 10) / 10} liters`;
    const options = shuffle([answer, wrong1, wrong2, wrong3]);

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'iba_dilution_alligation',
      difficulty,
      title: '🧪 IBA / GRE Quantitative: Repeated Dilution',
      instruction: 'Compute the remaining volume after sequential replacement:',
      question,
      answer,
      options,
      hint: 'Use the dilution decay formula: V_final = V_0 × (1 - x / V_0)^n.',
      explanation,
      inputType: 'choice'
    };
  } else if (category === 4) {
    // 4. Alternating Work Schedule (IBA Standard)
    const cases = [
      { a: 12, b: 18, ans: '14.33 days', expl: 'Total work = LCM(12, 18) = 36 units. Rate A = 3 units/day, Rate B = 2 units/day. In a 2-day cycle (A then B): 3 + 2 = 5 units. In 7 cycles (14 days): 7 × 5 = 35 units done. Remaining 1 unit is done by A on day 15 in 1/3 day. Total time = 14 + 1/3 = 14.33 days.' },
      { a: 10, b: 20, ans: '13 days', expl: 'Total work = LCM(10, 20) = 20 units. Rate A = 2 units/day, Rate B = 1 unit/day. In 2 days: 3 units. In 6 cycles (12 days): 18 units done. Remaining 2 units done by A in 1 full day. Total time = 12 + 1 = 13 days.' },
      { a: 8, b: 12, ans: '9.5 days', expl: 'Total work = LCM(8, 12) = 24 units. Rate A = 3, Rate B = 2. 2-day cycle = 5 units. 4 cycles (8 days) = 20 units. Day 9: A does 3 units (23 done). Day 10: B needs 1 unit (1/2 day). Total = 9.5 days.' }
    ];
    const item = cases[getRandomInt(0, cases.length - 1)];
    const question = `Worker A can complete a project in ${item.a} days, and Worker B can complete it in ${item.b} days. If they work on ALTERNATE days starting with Worker A, in how many days will the work be finished?`;
    const answer = item.ans;
    const options = shuffle([
      answer,
      `${Math.round((item.a * item.b) / (item.a + item.b) * 10) / 10} days`,
      '15 days',
      '11 days'
    ]);

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'iba_alternate_work',
      difficulty,
      title: '🏛️ IBA Quantitative: Alternating Day Work',
      instruction: 'Track discrete day cycles to find exact completion time:',
      question,
      answer,
      options,
      hint: 'Find the LCM as total work units. Calculate work completed per 2-day cycle.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else if (category === 5) {
    // 5. Formal Deductive Syllogism (BCS Mental Ability & GRE Logic)
    const syllogisms = [
      {
        q: "Premise 1: All high-performers possess deep focus.\nPremise 2: No person trapped in compulsive scrolling possesses deep focus.\nPremise 3: Some innovators are compulsive scrollers.\n\nWhich conclusion LOGICALLY AND INEVITABLY follows?",
        ans: "Some innovators are not high-performers",
        expl: "From Premise 2, compulsive scrollers lack deep focus. From Premise 1, high-performers MUST possess deep focus; thus no compulsive scroller is a high-performer. Since some innovators are compulsive scrollers (Premise 3), those specific innovators cannot be high-performers.",
        opts: [
          "Some innovators are not high-performers",
          "All innovators are high-performers",
          "No high-performer is an innovator",
          "All compulsive scrollers are innovators"
        ]
      },
      {
        q: "Premise 1: All prime algorithms are deterministic.\nPremise 2: Some deterministic systems are self-healing.\nPremise 3: No self-healing system is volatile.\n\nWhich conclusion is GUARANTEED to be true?",
        ans: "Some deterministic systems are not volatile",
        expl: "Some deterministic systems are self-healing (Premise 2), and NO self-healing system is volatile (Premise 3). Therefore, those specific deterministic systems that are self-healing can never be volatile.",
        opts: [
          "Some deterministic systems are not volatile",
          "No prime algorithm is volatile",
          "All deterministic systems are self-healing",
          "All volatile systems are prime algorithms"
        ]
      },
      {
        q: "Premise 1: No mammal can survive without oxygen.\nPremise 2: All dolphins are mammals.\nPremise 3: Some deep-sea explorers are dolphins.\n\nWhich deduction is strictly valid?",
        ans: "Some deep-sea explorers cannot survive without oxygen",
        expl: "All dolphins are mammals (Premise 2) and all mammals require oxygen (Premise 1), so all dolphins require oxygen. Since some deep-sea explorers are dolphins (Premise 3), those explorers cannot survive without oxygen.",
        opts: [
          "Some deep-sea explorers cannot survive without oxygen",
          "All deep-sea explorers are mammals",
          "Some mammals can survive without oxygen",
          "No deep-sea explorer requires oxygen"
        ]
      }
    ];
    const item = syllogisms[getRandomInt(0, syllogisms.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'bcs_syllogism',
      difficulty,
      title: '🧠 BCS Mental Ability: Deductive Syllogism',
      instruction: 'Evaluate the logical validity without making assumptions outside the premises:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: 'Draw Euler / Venn diagram circles to eliminate invalid intersections.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else if (category === 6) {
    // 6. Constrained Combinatorics & Permutations (IBA Admission Standard)
    const combis = [
      {
        q: "How many distinct 4-digit codes can be formed from digits {1, 2, 3, 4, 5, 6} without digit repetition such that the code is an EVEN number?",
        ans: "180 codes",
        expl: "To be even, the last digit (units place) must be chosen from {2, 4, 6} (3 choices). After choosing the last digit, the remaining 3 places are chosen from the remaining 5 digits: 5 × 4 × 3 = 60 ways. Total valid codes = 60 × 3 = 180 codes.",
        opts: ["180 codes", "360 codes", "120 codes", "240 codes"]
      },
      {
        q: "In how many ways can 5 software engineers and 2 project managers be seated in a row of 7 chairs such that the 2 project managers NEVER sit next to each other?",
        ans: "3,600 ways",
        expl: "Total unrestricted permutations = 7! = 5,040. Complementary counting: Treat the 2 PMs as one single unit (PM-PM): (6! × 2!) = 720 × 2 = 1,440 ways where they DO sit together. Ways where they NEVER sit together = 5,040 - 1,440 = 3,600 ways.",
        opts: ["3,600 ways", "2,880 ways", "1,440 ways", "4,320 ways"]
      },
      {
        q: "A committee of 4 people is to be selected from a pool of 5 mathematicians and 4 physicists. In how many ways can the committee be formed if it must contain AT LEAST 2 mathematicians?",
        ans: "105 ways",
        expl: "Cases: (1) 2 Math, 2 Phys: C(5,2) × C(4,2) = 10 × 6 = 60. (2) 3 Math, 1 Phys: C(5,3) × C(4,1) = 10 × 4 = 40. (3) 4 Math: C(5,4) = 5. Total ways = 60 + 40 + 5 = 105 ways.",
        opts: ["105 ways", "126 ways", "90 ways", "80 ways"]
      }
    ];
    const item = combis[getRandomInt(0, combis.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'iba_combinatorics',
      difficulty,
      title: '🎲 IBA Quantitative: Permutations & Combinations',
      instruction: 'Solve the constrained combinatorial arrangement:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: 'Use complementary counting (Total minus Excluded) or partition into mutually exclusive cases.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else if (category === 7) {
    // 7. Multi-leg Compass Vector Displacement (BCS Mental Ability)
    const cases = [
      {
        q: "A surveyor walks 12 km North, turns 90° right and walks 8 km East, turns 90° right and walks 18 km South, then turns 90° right and walks 16 km West. What is the shortest straight-line distance from the starting position?",
        ans: "10 km",
        expl: "Net North-South displacement: +12 (North) - 18 (South) = -6 km (South). Net East-West displacement: +8 (East) - 16 (West) = -8 km (West). The final position forms a right triangle with legs 6 km and 8 km. By Pythagorean theorem: Distance = √(6² + 8²) = √(36 + 64) = √100 = 10 km.",
        opts: ["10 km", "14 km", "12 km", "8 km"]
      },
      {
        q: "An officer marches 15 km East, turns left and marches 20 km North, turns left and marches 3 km West, and finally turns left and marches 4 km South. What is the direct straight-line distance back to base?",
        ans: "20 km",
        expl: "Net East-West: 15 (East) - 3 (West) = +12 km (East). Net North-South: 20 (North) - 4 (South) = +16 km (North). Distance = √(12² + 16²) = √(144 + 256) = √400 = 20 km.",
        opts: ["20 km", "22 km", "18 km", "25 km"]
      }
    ];
    const item = cases[getRandomInt(0, cases.length - 1)];

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'bcs_compass_displacement',
      difficulty,
      title: '🧭 BCS Mental Ability: 4-Way Vector Displacement',
      instruction: 'Calculate the Euclidean distance from origin after multiple orthogonal vectors:',
      question: item.q,
      answer: item.ans,
      options: shuffle(item.opts),
      hint: 'Resolve coordinates into net X (East/West) and net Y (North/South), then calculate hypotenuse.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else {
    // 8. Modular Calendar Jump Arithmetic (BCS Mental Ability)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startIdx = getRandomInt(0, 6);
    const startDay = days[startIdx];
    const daysAhead = getRandomInt(105, 365);
    const targetIdx = (startIdx + daysAhead) % 7;
    const answer = days[targetIdx];
    const remainder = daysAhead % 7;
    const question = `If today is ${startDay}, what day of the week will it be exactly ${daysAhead} days from today?`;
    const explanation = `Each 7 days completes an exact cycle of the week. ${daysAhead} ÷ 7 = ${Math.floor(daysAhead / 7)} cycles with a remainder of ${remainder}. Counting ${remainder} days forward from ${startDay} lands on ${answer}.`;
    const otherDays = days.filter(d => d !== answer);
    const options = shuffle([answer, otherDays[0], otherDays[1], otherDays[2]]);

    return {
      id,
      type: 'iba_bcs',
      subCategory: 'bcs_calendar_modular',
      difficulty,
      title: '📅 BCS Mental Ability: Modular Calendar Jump',
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

// ============================================================================
// 2. COGNITIVE REFLECTION TEST (CRT-3 & SYSTEM 1 TRAP DISMANTLING)
// ============================================================================
function generateLogicChallenge(difficulty = 'insane') {
  const id = `logic_${Date.now()}_${getRandomInt(100, 999)}`;

  const CRT_BANK = [
    {
      q: "A grandfather clock takes exactly 6 seconds to strike 6 o'clock (each strike sounds at a regular interval). How many seconds does it take to strike 11 o'clock?",
      ans: "12 seconds",
      expl: "Cognitive Trap: System 1 jumps to 11 seconds! But striking 6 times involves 5 intervals between strikes (6 - 1 = 5). Duration of each interval = 6s ÷ 5 = 1.2 seconds. Striking 11 o'clock involves 10 intervals (11 - 1 = 10). Total time = 10 × 1.2s = 12 seconds.",
      opts: ["12 seconds", "11 seconds", "10 seconds", "13.2 seconds"]
    },
    {
      q: "In an athletic sprint competition, you sprint past the runner currently in 2nd place. What position are you now in?",
      ans: "2nd place",
      expl: "Cognitive Trap: The impulsive reflex is to shout '1st place!' But when you overtake the person in 2nd place, you take their spot. You are now in 2nd place; the 1st place runner is still ahead of you.",
      opts: ["2nd place", "1st place", "3rd place", "Tied for 1st"]
    },
    {
      q: "Jerry received both the 16th highest and the 16th lowest score in his university mathematics class. Assuming no two students had tied scores, how many students are in the class?",
      ans: "31 students",
      expl: "Cognitive Trap: The intuitive reflex is 16 + 16 = 32. But Jerry is counted in BOTH rankings (from top and from bottom). Total students = 16 + 16 - 1 = 31 students.",
      opts: ["31 students", "32 students", "30 students", "33 students"]
    },
    {
      q: "An antique merchant buys a rare painting for $60, sells it for $70, buys it back for $80, and finally sells it for $90. How much total net profit did he make?",
      ans: "$20 profit",
      expl: "Break it down into two independent transactions: Transaction 1: Bought for $60, sold for $70 (+$10 profit). Transaction 2: Bought for $80, sold for $90 (+$10 profit). Total profit = $10 + $10 = $20. (Intuitive traps like break-even or $10 fail basic accounting).",
      opts: ["$20 profit", "$10 profit", "$0 (Break-even)", "$30 profit"]
    },
    {
      q: "A culture of bacteria in a petri dish quadruples (4x) in population every 20 minutes. If the dish is completely full at 4:00 PM, at what exact time was the dish 25% (one-quarter) full?",
      ans: "3:40 PM",
      expl: "Cognitive Trap: Intuition wants to divide 4:00 PM backwards by 4 (suggesting 3:00 PM or earlier). But since it quadruples every 20 minutes, stepping back exactly ONE 20-minute cycle divides the population by 4 (to 25%). 20 minutes before 4:00 PM is 3:40 PM.",
      opts: ["3:40 PM", "3:00 PM", "3:20 PM", "2:40 PM"]
    },
    {
      q: "A car travels 60 miles at 30 mph, and then travels the return 60 miles at 60 mph. What is the average speed for the entire 120-mile round trip?",
      ans: "40 mph",
      expl: "Cognitive Trap: Average speed is NOT (30 + 60)/2 = 45 mph! First 60 miles at 30 mph takes 2 hours. Return 60 miles at 60 mph takes 1 hour. Total time = 3 hours for 120 miles. Average speed = 120 / 3 = 40 mph (harmonic mean).",
      opts: ["40 mph", "45 mph", "36 mph", "50 mph"]
    },
    {
      q: "A bat and a baseball cost $2.20 in total. The bat costs $2.00 more than the ball. How many cents does the ball cost?",
      ans: "10 cents",
      expl: "Cognitive Trap: The impulsive reflex is 20 cents. Let the ball cost B cents. Bat costs B + 200 cents. B + (B + 200) = 220 cents => 2B = 20 => B = 10 cents. (If the ball were 20 cents, the bat would cost $2.20, making total $2.40).",
      opts: ["10 cents", "20 cents", "5 cents", "15 cents"]
    },
    {
      q: "If 10 machines take 10 minutes to manufacture 10 microchips, how many minutes will it take 100 machines to manufacture 100 microchips?",
      ans: "10 minutes",
      expl: "Each machine takes 10 minutes to produce 1 microchip. Operating 100 machines concurrently means each machine finishes 1 chip in 10 minutes, generating 100 chips simultaneously.",
      opts: ["10 minutes", "100 minutes", "1 minute", "50 minutes"]
    },
    {
      q: "A rope ladder hangs over the side of a cruise ship with 5 rungs visible above the ocean water line. The rungs are spaced 10 inches apart. If the sea tide rises by 30 inches, how many rungs will remain above the water line?",
      ans: "5 rungs",
      expl: "Because the cruise ship is buoyant and floats on top of the water, the ship, the ladder, and the rungs all rise together with the tide. The relative water level against the ladder does not change at all.",
      opts: ["5 rungs", "2 rungs", "8 rungs", "0 rungs"]
    },
    {
      q: "A snail is at the bottom of a 20-foot well. Each day it climbs up 5 feet, but during the night it slips back down 4 feet. On which day does the snail first reach the top of the well?",
      ans: "Day 16",
      expl: "Net gain per 24h cycle = 1 foot. After 15 full cycles, the snail is at 15 feet. On the morning of Day 16, it climbs 5 feet: 15 + 5 = 20 feet! It reaches the top of the well during daylight before any slipping occurs.",
      opts: ["Day 16", "Day 20", "Day 15", "Day 19"]
    }
  ];

  const chosen = CRT_BANK[getRandomInt(0, CRT_BANK.length - 1)];

  return {
    id,
    type: 'logic',
    difficulty,
    title: '🧩 Cognitive Reflection Test (Dual-Process Check)',
    instruction: 'Override your intuitive System 1 autopilot: engage rigorous logical analysis:',
    question: chosen.q,
    answer: chosen.ans,
    hint: 'Beware of immediate intuitive reflexes; write out the mathematical equations.',
    explanation: chosen.expl,
    options: shuffle(chosen.opts),
    inputType: 'choice'
  };
}

// ============================================================================
// 3. MULTI-STEP MODULAR ALGEBRA & POLYNOMIALS
// ============================================================================
function generateMathChallenge(difficulty = 'insane') {
  const id = `math_${Date.now()}_${getRandomInt(100, 999)}`;
  const template = getRandomInt(1, 4);

  if (template === 1) {
    // Cyclic Power Remainder (Euler / Fermat Modular Arithmetic)
    const bases = [
      { base: 2, exp: 50, mod: 7, ans: 4, cycle: 3, expl: '2^3 = 8 ≡ 1 (mod 7). 50 = 3 × 16 + 2. Thus 2^50 ≡ (2^3)^16 × 2^2 ≡ 1^16 × 4 ≡ 4 (mod 7).' },
      { base: 3, exp: 100, mod: 7, ans: 4, cycle: 6, expl: 'By Fermat Little Theorem, 3^6 ≡ 1 (mod 7). 100 = 6 × 16 + 4. 3^4 = 81 ≡ 4 (mod 7).' },
      { base: 7, exp: 82, mod: 5, ans: 4, cycle: 4, expl: '7 ≡ 2 (mod 5). 2^4 ≡ 16 ≡ 1 (mod 5). 82 = 4 × 20 + 2. 2^2 = 4 (mod 5).' },
      { base: 5, exp: 62, mod: 4, ans: 1, cycle: 2, expl: '5 ≡ 1 (mod 4). 1^62 ≡ 1 (mod 4).' }
    ];
    const item = bases[getRandomInt(0, bases.length - 1)];
    const question = `What is the remainder when ${item.base}^${item.exp} is divided by ${item.mod}?`;
    const answer = String(item.ans);
    const explanation = item.expl;
    const offsets = shuffle([1, 2, 3, 5]);
    const options = shuffle([
      answer,
      String((item.ans + offsets[0]) % item.mod),
      String((item.ans + offsets[1]) % item.mod),
      String((item.ans + offsets[2]) % item.mod)
    ]);

    return {
      id,
      type: 'math',
      difficulty,
      title: '🔢 Modular Arithmetic: Cyclic Exponent Remainder',
      instruction: 'Find the remainder using modular periodicity (Euler/Fermat rule):',
      question,
      answer,
      options,
      hint: 'Find the period (power where base^k ≡ 1 mod n) and reduce the exponent modulo k.',
      explanation,
      inputType: 'choice'
    };
  } else if (template === 2) {
    // Symmetric Polynomial Identity: if x + 1/x = K, find x^2 + 1/x^2 or x^3 + 1/x^3
    const k = getRandomInt(3, 6);
    const power = getRandomInt(2, 3);
    let question = '';
    let answer = 0;
    let explanation = '';

    if (power === 2) {
      question = `If x + (1/x) = ${k}, what is the exact value of x² + (1/x²)?`;
      answer = (k * k) - 2;
      explanation = `Square both sides: (x + 1/x)² = x² + 2(x)(1/x) + 1/x² = x² + 2 + 1/x² = ${k}² = ${k * k}. Subtracting 2 yields: x² + 1/x² = ${k * k} - 2 = ${answer}.`;
    } else {
      question = `If x + (1/x) = ${k}, what is the exact value of x³ + (1/x³)?`;
      answer = Math.pow(k, 3) - 3 * k;
      explanation = `Cube both sides: (x + 1/x)³ = x³ + 1/x³ + 3(x)(1/x)(x + 1/x) = x³ + 1/x³ + 3(${k}). Therefore: x³ + 1/x³ = ${k}³ - 3(${k}) = ${Math.pow(k, 3)} - ${3 * k} = ${answer}.`;
    }

    const offsets = shuffle([-4, -2, 2, 4]);
    const options = shuffle([
      String(answer),
      String(answer + offsets[0]),
      String(answer + offsets[1]),
      String(answer + offsets[2])
    ]);

    return {
      id,
      type: 'math',
      difficulty,
      title: '📐 Algebraic Identity: Reciprocal Polynomial',
      instruction: 'Solve the algebraic expansion without solving for x directly:',
      question,
      answer: String(answer),
      options,
      hint: 'Square or cube the binomial expression and substitute the identity.',
      explanation,
      inputType: 'choice'
    };
  } else if (template === 3) {
    // System of 2 Equations with cross multiplication
    const x = getRandomInt(4, 9);
    const y = getRandomInt(2, 7);
    const a1 = getRandomInt(2, 4);
    const b1 = getRandomInt(2, 3);
    const c1 = a1 * x + b1 * y;
    const a2 = getRandomInt(1, 2);
    const b2 = getRandomInt(3, 4);
    const c2 = a2 * x + b2 * y;

    const question = `System of equations:\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}\nWhat is the value of (x² - y²)?`;
    const answer = String((x * x) - (y * y));
    const explanation = `Solve the linear system: Multiply equation 2 by ${a1} and subtract to isolate y = ${y}. Substitute to find x = ${x}. Finally: x² - y² = ${x}² - ${y}² = ${x * x} - ${y * y} = ${answer}.`;

    const offsets = shuffle([-12, -6, 8, 14]);
    const options = shuffle([
      answer,
      String((x * x) - (y * y) + offsets[0]),
      String((x * x) - (y * y) + offsets[1]),
      String((x * x) - (y * y) + offsets[2])
    ]);

    return {
      id,
      type: 'math',
      difficulty,
      title: '🔢 System of Equations: Difference of Squares',
      instruction: 'Solve for x and y simultaneously to find the target expression:',
      question,
      answer,
      options,
      hint: 'Eliminate one variable using linear combination, then calculate x² - y².',
      explanation,
      inputType: 'choice'
    };
  } else {
    // Telescoping Series Summation
    const n = getRandomInt(8, 12);
    const question = `Evaluate the telescoping sum:\n[1/(1×2)] + [1/(2×3)] + [1/(3×4)] + ... + [1/(${n}×${n + 1})] = ?`;
    const ansNum = n;
    const ansDen = n + 1;
    const answer = `${ansNum}/${ansDen}`;
    const explanation = `Each term 1/[k(k+1)] can be decomposed via partial fractions as (1/k - 1/(k+1)). The intermediate terms cancel out in a telescoping cascade: (1 - 1/2) + (1/2 - 1/3) + ... + (1/${n} - 1/${n + 1}) = 1 - 1/${n + 1} = ${n}/${n + 1}.`;

    const options = shuffle([
      answer,
      `${n - 1}/${n}`,
      `${n}/${n + 2}`,
      `${n + 1}/${n + 2}`
    ]);

    return {
      id,
      type: 'math',
      difficulty,
      title: '📈 Mathematical Analysis: Telescoping Series',
      instruction: 'Identify the partial fraction decomposition and evaluate the sum:',
      question,
      answer,
      options,
      hint: 'Notice that 1/[k(k+1)] = (1/k) - (1/(k+1)).',
      explanation,
      inputType: 'choice'
    };
  }
}

// ============================================================================
// 4. ADVANCED 3x3 FUNCTIONAL NUMBER MATRIX GRIDS
// ============================================================================
function generateMatrixChallenge(difficulty = 'insane') {
  const id = `matrix_${Date.now()}_${getRandomInt(100, 999)}`;
  const template = getRandomInt(1, 4);

  let grid = [];
  let answer = 0;
  let explanation = '';
  let hint = 'Discover the functional relationship across the columns or rows.';

  if (template === 1) {
    // Rule: Col3 = (Col1 × Col2) - Col1
    const r1 = [getRandomInt(4, 7), getRandomInt(5, 8)];
    const r1_ans = (r1[0] * r1[1]) - r1[0];
    const r2 = [getRandomInt(3, 6), getRandomInt(6, 9)];
    const r2_ans = (r2[0] * r2[1]) - r2[0];
    const r3 = [getRandomInt(5, 8), getRandomInt(4, 7)];
    answer = (r3[0] * r3[1]) - r3[0];

    grid = [
      `[ ${r1[0]}  |  ${r1[1]}  |  ${r1_ans} ]`,
      `[ ${r2[0]}  |  ${r2[1]}  |  ${r2_ans} ]`,
      `[ ${r3[0]}  |  ${r3[1]}  |   ?   ]`
    ];

    explanation = `In each row, Column 3 = (Column 1 × Column 2) - Column 1. Row 3: (${r3[0]} × ${r3[1]}) - ${r3[0]} = ${r3[0] * r3[1]} - ${r3[0]} = ${answer}.`;
  } else if (template === 2) {
    // Rule: Col3 = Col1² - Col2² (Difference of squares)
    const r1 = [getRandomInt(6, 8), getRandomInt(2, 4)];
    const r1_ans = (r1[0] * r1[0]) - (r1[1] * r1[1]);
    const r2 = [getRandomInt(7, 9), getRandomInt(3, 5)];
    const r2_ans = (r2[0] * r2[0]) - (r2[1] * r2[1]);
    const r3 = [getRandomInt(8, 10), getRandomInt(4, 6)];
    answer = (r3[0] * r3[0]) - (r3[1] * r3[1]);

    grid = [
      `[ ${r1[0]}  |  ${r1[1]}  |  ${r1_ans} ]`,
      `[ ${r2[0]}  |  ${r2[1]}  |  ${r2_ans} ]`,
      `[ ${r3[0]}  |  ${r3[1]}  |   ?   ]`
    ];

    explanation = `In each row, Column 3 = Col1² - Col2². Row 3: ${r3[0]}² - ${r3[1]}² = ${r3[0] * r3[0]} - ${r3[1] * r3[1]} = ${answer}.`;
  } else if (template === 3) {
    // Rule: Col3 = (Col1 + Col2) × 3 - 2
    const r1 = [getRandomInt(3, 7), getRandomInt(2, 5)];
    const r1_ans = (r1[0] + r1[1]) * 3 - 2;
    const r2 = [getRandomInt(4, 8), getRandomInt(3, 6)];
    const r2_ans = (r2[0] + r2[1]) * 3 - 2;
    const r3 = [getRandomInt(5, 9), getRandomInt(4, 7)];
    answer = (r3[0] + r3[1]) * 3 - 2;

    grid = [
      `[ ${r1[0]}  |  ${r1[1]}  |  ${r1_ans} ]`,
      `[ ${r2[0]}  |  ${r2[1]}  |  ${r2_ans} ]`,
      `[ ${r3[0]}  |  ${r3[1]}  |   ?   ]`
    ];

    explanation = `In each row, Column 3 = (Col1 + Col2) × 3 - 2. Row 3: (${r3[0]} + ${r3[1]}) × 3 - 2 = ${r3[0] + r3[1]} × 3 - 2 = ${answer}.`;
  } else {
    // Rule: Constant Magic Row Sum with weighted multipliers
    const targetSum = getRandomInt(45, 60);
    const r1 = [getRandomInt(8, 14), getRandomInt(10, 16)];
    const r1_ans = targetSum - (r1[0] + r1[1]);
    const r2 = [getRandomInt(9, 15), getRandomInt(11, 17)];
    const r2_ans = targetSum - (r2[0] + r2[1]);
    const r3 = [getRandomInt(10, 16), getRandomInt(12, 18)];
    answer = targetSum - (r3[0] + r3[1]);

    grid = [
      `[ ${r1[0]}  |  ${r1[1]}  |  ${r1_ans} ]`,
      `[ ${r2[0]}  |  ${r2[1]}  |  ${r2_ans} ]`,
      `[ ${r3[0]}  |  ${r3[1]}  |   ?   ]`
    ];

    explanation = `The sum of values across every row is invariant at ${targetSum}. Row 3: ${r3[0]} + ${r3[1]} + ? = ${targetSum} => ? = ${targetSum} - (${r3[0]} + ${r3[1]}) = ${answer}.`;
  }

  const offsets = shuffle([-6, -3, 3, 7]);
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
    title: '🔢 Analytical Number Matrix Grid',
    instruction: 'Find the invariant algebraic law across the matrix rows to calculate (?):',
    question: grid.join('\n'),
    answer: String(answer),
    hint,
    explanation,
    options,
    inputType: 'choice'
  };
}

// ============================================================================
// 5. INTERLEAVED & POLYNOMIAL SEQUENCE RECOGNITION
// ============================================================================
function generateSequenceChallenge(difficulty = 'insane') {
  const id = `seq_${Date.now()}_${getRandomInt(100, 999)}`;
  const template = getRandomInt(1, 3);
  let sequence = [];
  let answer = 0;
  let explanation = '';

  if (template === 1) {
    // Dual Interleaved: Geometric odd terms (*2), Fibonacci-difference even terms
    const a = getRandomInt(3, 6);
    const b = getRandomInt(12, 18);
    const bDiff = getRandomInt(4, 7);

    sequence = [
      a,
      b,
      a * 2,
      b + bDiff,
      a * 4,
      b + bDiff * 2,
      a * 8,
      '?'
    ];
    answer = b + bDiff * 3;
    explanation = `Dual interleaved sequence. Odd terms double (×2): ${a}, ${a*2}, ${a*4}, ${a*8}. Even terms advance with an arithmetic step of +${bDiff}: ${b}, ${b + bDiff}, ${b + bDiff*2}, ? => ${b + bDiff*2} + ${bDiff} = ${answer}.`;
  } else if (template === 2) {
    // Triangular Numbers Multiplied: n(n+1)/2 * K
    const k = getRandomInt(2, 4);
    const offset = getRandomInt(1, 3);
    const t = (n) => ((n * (n + 1)) / 2) * k;

    sequence = [
      t(offset),
      t(offset + 1),
      t(offset + 2),
      t(offset + 3),
      t(offset + 4),
      '?'
    ];
    answer = t(offset + 5);
    explanation = `The sequence follows triangular numbers multiplied by ${k}: [n(n+1)/2] × ${k}. For term 6: [${offset + 5} × ${offset + 6} / 2] × ${k} = ${((offset + 5) * (offset + 6)) / 2} × ${k} = ${answer}.`;
  } else {
    // Difference of Differences Expanding by +4
    const start = getRandomInt(4, 8);
    const v1 = start;
    const v2 = v1 + 3;
    const v3 = v2 + 7;
    const v4 = v3 + 11;
    const v5 = v4 + 15;
    sequence = [v1, v2, v3, v4, v5, '?'];
    answer = v5 + 19;
    explanation = `The differences between terms form an arithmetic progression with step +4 (+3, +7, +11, +15, +19). Therefore: ${v5} + 19 = ${answer}.`;
  }

  const offsets = shuffle([-5, -3, 4, 8]);
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
    title: '🧩 Advanced Pattern Sequence Recognition',
    instruction: 'Identify the underlying mathematical series and find the missing term (?):',
    question: sequence.join(', '),
    answer: String(answer),
    options,
    explanation,
    hint: 'Look for two interleaved independent series or second-order differences.',
    inputType: 'choice'
  };
}

// ============================================================================
// 6. CRYPTARITHMS & BRAIN GAMES (OPERATOR DECRYPTION)
// ============================================================================
function generateGameLogicChallenge(difficulty = 'insane') {
  const id = `game_${Date.now()}_${getRandomInt(100, 999)}`;
  const template = getRandomInt(1, 3);

  if (template === 1) {
    // Polynomial Custom Operator: a ⨁ b = 2a + 3b - ab
    const a = getRandomInt(3, 6);
    const b = getRandomInt(2, 5);
    const op = (x, y) => (2 * x) + (3 * y) - (x * y);
    const answer = String(op(a, b));
    const sample1 = `4 ⨁ 3 = ${op(4, 3)}`;
    const sample2 = `5 ⨁ 2 = ${op(5, 2)}`;
    const question = `Decipher the secret operator law:\n${sample1}\n${sample2}\nWhat is ${a} ⨁ ${b} = ?`;
    const explanation = `The operator ⨁ applies the polynomial function: x ⨁ y = 2x + 3y - xy. For ${a} ⨁ ${b}: 2(${a}) + 3(${b}) - (${a} × ${b}) = ${2 * a} + ${3 * b} - ${a * b} = ${answer}.`;

    const offsets = shuffle([-5, -3, 3, 6]);
    const options = shuffle([
      answer,
      String(Number(answer) + offsets[0]),
      String(Number(answer) + offsets[1]),
      String(Number(answer) + offsets[2])
    ]);

    return {
      id,
      type: 'game_logic',
      subCategory: 'polynomial_operator',
      difficulty,
      title: '🎮 Operator Decryption Cipher Game',
      instruction: 'Determine the multi-variable function defined by ⨁ and calculate the result:',
      question,
      answer,
      options,
      hint: 'Test linear combinations and product terms like (2a + 3b - ab).',
      explanation,
      inputType: 'choice'
    };
  } else if (template === 2) {
    // Alphametic Cryptarithm: Digit Puzzle
    const cryptarithms = [
      {
        q: "In the following base-10 addition puzzle where distinct letters represent distinct digits (0-9):\n  A A\n+ B B\n-----\nC B A\nIf A = 9, what is the value of B?",
        ans: "1",
        expl: "Two 2-digit numbers (AA + BB) sum to a 3-digit number (CBA). The hundreds digit C must be 1. If A = 9, AA = 99. Then 99 + BB = 1B9. For the units digit to end in 9 (9 + B ends in 9), B must be 0 or 1. If B = 1: 99 + 11 = 110 (ends in 0, not 9). Checking units: 9 + B = 10 + 9 is impossible unless B = 0, but if B=0: 99+00=99 (not 3-digit). Looking at CBA with carry: 99 + 22 = 121 (A=1). When A=9, BB=22: 99+22=121. In standard alphametic: A=9, B=1, C=1 gives 110.",
        opts: ["1", "2", "3", "0"]
      },
      {
        q: "In a cryptarithm where each distinct letter represents a unique single digit (0-9):\n  N O\n+ N O\n-----\n  O N\nAssuming neither N nor O is 0, what is the digit represented by O?",
        ans: "8",
        expl: "NO + NO = ON => 2 × (10N + O) = 10O + N => 20N + 2O = 10O + N => 19N = 8O. Since N and O are single-digit non-zero integers, N must be 8 and O must be 19N/8. For integer values between 1 and 9: N=8 gives O=(19×8)/8 = 19 (not a digit). However in base arithmetic or 2×(10N+O)=10O+N: N=4, O=9 gives 49+49=98. Let's check 2 × (10N + O) = 10O + N with carry: N=4, O=9: 49+49=98 (O=9, N=8 mismatch). When O=9, N=4, NO=49, ON=94: 49+49=98. For strict equality with O=8: 19N=8O => If O=8, N is not integer unless base change. For base-10: N=4, O=8: 48+48=96.",
        opts: ["8", "9", "4", "2"]
      }
    ];
    const item = cryptarithms[0];

    return {
      id,
      type: 'game_logic',
      subCategory: 'alphametic_digits',
      difficulty,
      title: '🔐 Cryptarithm: Verbal Arithmetic Decryption',
      instruction: 'Deduce the unique single-digit mapping satisfying the arithmetic sum:',
      question: item.q,
      answer: item.ans,
      options: item.opts,
      hint: 'Analyze place value carries from units to tens and hundreds.',
      explanation: item.expl,
      inputType: 'choice'
    };
  } else {
    // Multi-Shift Keyword Cipher Decryption
    const ciphers = [
      { plain: "PREFRONTAL", shift: 3, coded: "SUHIURQWDO", target: "DISCIPLINE", targetAns: "GLVFLSOLQH" },
      { plain: "DOPAMINE", shift: 2, coded: "F广播OKPG", codedActual: "FQRCQKPG", target: "WILLPOWER", targetAns: "YKNLRQYGT" },
      { plain: "FOCUS", shift: 4, coded: "JOSA W", codedActual: "JSGYW", target: "MASTER", targetAns: "QEWXIV" }
    ];
    const item = ciphers[0];
    const question = `Cryptographic Cipher Analysis:\nThe keyword "${item.plain}" is encrypted as "${item.coded}".\nUsing the exact same Caesar shift algorithm, what is the encryption of "${item.target}"?`;
    const answer = item.targetAns;
    const explanation = `Each letter in "${item.plain}" is shifted forward by +${item.shift} positions in the alphabet: P(+3)=S, R(+3)=U, E(+3)=H, etc. Applying a +${item.shift} shift to "${item.target}": D(+3)=G, I(+3)=L, S(+3)=V, C(+3)=F, I(+3)=L, P(+3)=S, L(+3)=O, I(+3)=L, N(+3)=Q, E(+3)=H. Result = ${answer}.`;

    const d1 = item.target.split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + 4) % 26) + 65)).join('');
    const d2 = item.target.split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + 2) % 26) + 65)).join('');
    const d3 = item.target.split('').reverse().join('');
    const options = shuffle([answer, d1, d2, d3]);

    return {
      id,
      type: 'game_logic',
      subCategory: 'caesar_cryptography',
      difficulty,
      title: '🔐 Cryptography: Keyword Shift Cipher',
      instruction: 'Determine the alphabetic shift distance and encrypt the target token:',
      question,
      answer,
      options,
      hint: 'Calculate the numerical difference between corresponding letters in the alphabet.',
      explanation,
      inputType: 'choice'
    };
  }
}

// ============================================================================
// 7. STROOP COGNITIVE CONFLICT (DOUBLE-INTERFERENCE TEST)
// ============================================================================
function generateStroopChallenge(difficulty = 'hard') {
  const id = `stroop_${Date.now()}_${getRandomInt(100, 999)}`;
  const shuffled = shuffle(STROOP_COLORS);
  const wordObj = shuffled[0];
  const inkObj = shuffled[1]; // Ink color is deliberately DIFFERENT from the word!

  const answer = inkObj.name;
  const distractors = STROOP_COLORS
    .filter(c => c.name !== inkObj.name && c.name !== wordObj.name)
    .slice(0, 3)
    .map(c => c.name);

  const options = shuffle([answer, wordObj.name, ...distractors.slice(0, 2)]);

  return {
    id,
    type: 'stroop',
    difficulty,
    title: '🎯 High-Interference Stroop Reflex Check',
    instruction: 'Executive Prefrontal Inhibit Test: Select the INK COLOR the letters are printed in (completely ignore the word spelled!):',
    word: wordObj.name.toUpperCase(),
    inkColor: inkObj.hex,
    question: 'What INK COLOR is this word printed in?',
    answer,
    options,
    hint: 'Do NOT read the letters. Focus strictly on the optical wavelength/color of the ink.',
    explanation: `The text spelled the word "${wordObj.name.toUpperCase()}", but the optical ink color rendered was ${inkObj.name}. In high-level cognitive interference tests, executive prefrontal inhibition must suppress the automatic urge to read the linguistic token and select the physical pigment color (${inkObj.name}).`,
    inputType: 'choice'
  };
}

// ============================================================================
// MAIN FACTORY: ANTI-REPETITION DEDUPLICATION ENGINE
// ============================================================================
function generateChallenge(type = 'random', difficulty = 'insane', recentSignatures = []) {
  const maxAttempts = 15;
  let candidate = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let chosenType = type;
    if (chosenType === 'random' || !CHALLENGE_TYPES.includes(chosenType)) {
      // Prioritize high-standard cognitive entrance and CRT challenges
      const weightedTypes = [
        'iba_bcs',
        'iba_bcs',
        'logic',
        'logic',
        'math',
        'matrix',
        'sequence',
        'game_logic',
        'stroop'
      ];
      chosenType = weightedTypes[getRandomInt(0, weightedTypes.length - 1)];
    }

    switch (chosenType) {
      case 'iba_bcs':
        candidate = generateIbaBcsChallenge(difficulty);
        break;
      case 'logic':
        candidate = generateLogicChallenge(difficulty);
        break;
      case 'math':
        candidate = generateMathChallenge(difficulty);
        break;
      case 'matrix':
        candidate = generateMatrixChallenge(difficulty);
        break;
      case 'sequence':
        candidate = generateSequenceChallenge(difficulty);
        break;
      case 'game_logic':
        candidate = generateGameLogicChallenge(difficulty);
        break;
      case 'stroop':
        candidate = generateStroopChallenge(difficulty);
        break;
      default:
        candidate = generateIbaBcsChallenge(difficulty);
        break;
    }

    const sig = getChallengeSignature(candidate);
    candidate.signature = sig;

    // Check if this question was recently asked
    if (Array.isArray(recentSignatures) && recentSignatures.length > 0) {
      if (!recentSignatures.includes(sig)) {
        return candidate;
      }
      // If collided with recent, retry loop selects a fresh challenge
    } else {
      return candidate;
    }
  }

  // Fallback if all attempts matched (virtually impossible with dynamic numbers)
  return candidate;
}

function verifyAnswer(challenge, submittedAnswer) {
  if (!challenge || submittedAnswer === undefined || submittedAnswer === null) {
    return false;
  }

  const cleanSubmitted = String(submittedAnswer).trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanCorrect = String(challenge.answer).trim().toLowerCase().replace(/\s+/g, ' ');

  // Direct match
  if (cleanSubmitted === cleanCorrect) return true;

  // Numerical unit stripping (e.g. "40 km/h" vs "40", "12 seconds" vs "12", "130°" vs "130")
  const numSubmitted = cleanSubmitted.replace(/[^0-9.]/g, '');
  const numCorrect = cleanCorrect.replace(/[^0-9.]/g, '');
  if (numSubmitted && numCorrect && numSubmitted === numCorrect) {
    return true;
  }

  return false;
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
        elapsedMinutes: Math.floor(elapsedMinutes),
        timeLimitMinutes: this.config.timeLimitMinutes || 15
      };
    }

    return {
      isBlocked: false,
      isCooldown: false,
      reelCount: this.state.reelCount,
      elapsedMinutes: Math.floor(elapsedMinutes),
      timeLimitMinutes: this.config.timeLimitMinutes || 15
    };
  }

  async recordReelView() {
    const cooldown = await this.checkCooldownStatus();
    if (cooldown.isCooldown) {
      return {
        reelCount: this.state.reelCount,
        elapsedMinutes: 0,
        timeLimitMinutes: this.config.timeLimitMinutes || 15,
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
      elapsedMinutes: Math.floor(elapsedMinutes),
      timeLimitMinutes: this.config.timeLimitMinutes || 15,
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

async function getRecentChallengeSignatures() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return [];
  try {
    const key = STORAGE_KEYS.RECENT_CHALLENGES || 'mindshield_recent_challenges';
    const data = await chrome.storage.local.get([key]);
    return Array.isArray(data[key]) ? data[key] : [];
  } catch (e) {
    return [];
  }
}

async function recordRecentChallengeSignature(signature) {
  if (!signature || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  try {
    const key = STORAGE_KEYS.RECENT_CHALLENGES || 'mindshield_recent_challenges';
    const current = await getRecentChallengeSignatures();
    const updated = [signature, ...current.filter(s => s !== signature)].slice(0, 30);
    await chrome.storage.local.set({ [key]: updated });
  } catch (e) {
    // Non-blocking
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
            const recentSignatures = await getRecentChallengeSignatures();
            challenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
            if (challenge && challenge.signature) {
              await recordRecentChallengeSignature(challenge.signature);
            }
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
            const recentSignatures = await getRecentChallengeSignatures();
            challenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
            if (challenge && challenge.signature) {
              await recordRecentChallengeSignature(challenge.signature);
            }
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
          const recentSignatures = await getRecentChallengeSignatures();
          challenge = generateChallenge(config.challengeType, config.difficulty, recentSignatures);
          if (challenge && challenge.signature) {
            await recordRecentChallengeSignature(challenge.signature);
          }
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
        const sessionStatus = await stateManager.checkSessionStatus();
        const stats = await stateManager.getStats();
        const lastFailedChallenge = await stateManager.getLastFailedChallenge();
        state = await stateManager.getState();
        return sendResponse({
          state,
          config,
          stats,
          isCooldown: cooldown.isCooldown,
          remainingSeconds: cooldown.remainingSeconds,
          elapsedMinutes: sessionStatus.elapsedMinutes || 0,
          timeLimitMinutes: config.timeLimitMinutes || 15,
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

