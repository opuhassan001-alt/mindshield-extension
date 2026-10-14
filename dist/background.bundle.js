/**
 * MindShield Background Service Worker (Bundled)
 * Handles state management, badge counters, challenge generation & validation,
 * and cooldown timer enforcement.
 */

// --- CONFIGURATION ---
const DEFAULT_CONFIG = {
  reelLimit: 5,
  timeLimitMinutes: 10,
  cooldownMinutes: 30,
  challengeType: 'random', // 'math', 'sequence', 'stroop', 'random'
  difficulty: 'medium',    // 'easy', 'medium', 'hard'
  soundEnabled: true,
  maxFailedAttempts: 3
};

const STORAGE_KEYS = {
  CONFIG: 'mindshield_config',
  STATE: 'mindshield_state',
  STATS: 'mindshield_stats',
  ACTIVE_CHALLENGE: 'mindshield_active_challenge'
};

// --- CHALLENGE ENGINE ---
const CHALLENGE_TYPES = ['math', 'sequence', 'stroop'];

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

function generateMathChallenge(difficulty = 'medium') {
  const id = 'math_' + Date.now() + '_' + getRandomInt(100, 999);
  let question = '';
  let answer = 0;
  let hint = 'Calculate the exact result.';

  if (difficulty === 'easy') {
    const op = ['+', '-', '*'][getRandomInt(0, 2)];
    if (op === '+') {
      const a = getRandomInt(12, 59);
      const b = getRandomInt(11, 48);
      question = a + ' + ' + b + ' = ?';
      answer = a + b;
    } else if (op === '-') {
      const a = getRandomInt(30, 99);
      const b = getRandomInt(10, a - 5);
      question = a + ' - ' + b + ' = ?';
      answer = a - b;
    } else {
      const a = getRandomInt(3, 9);
      const b = getRandomInt(4, 9);
      question = a + ' × ' + b + ' = ?';
      answer = a * b;
    }
  } else if (difficulty === 'medium') {
    const template = getRandomInt(1, 3);
    if (template === 1) {
      const a = getRandomInt(6, 14);
      const b = getRandomInt(4, 8);
      const c = getRandomInt(11, 45);
      question = '(' + a + ' × ' + b + ') + ' + c + ' = ?';
      answer = a * b + c;
    } else if (template === 2) {
      const a = getRandomInt(5, 9);
      const b = getRandomInt(6, 9);
      const total = a * b + getRandomInt(20, 60);
      question = total + ' - (' + a + ' × ' + b + ') = ?';
      answer = total - (a * b);
    } else {
      const b = getRandomInt(4, 8);
      const mult = getRandomInt(6, 12);
      const a = b * mult;
      const c = getRandomInt(15, 55);
      question = '(' + a + ' ÷ ' + b + ') + ' + c + ' = ?';
      answer = mult + c;
    }
  } else {
    const template = getRandomInt(1, 2);
    if (template === 1) {
      const a = getRandomInt(11, 19);
      const b = getRandomInt(4, 7);
      const c = getRandomInt(3, 8);
      const d = getRandomInt(4, 6);
      question = '(' + a + ' × ' + b + ') - (' + c + ' × ' + d + ') = ?';
      answer = (a * b) - (c * d);
    } else {
      const x = getRandomInt(4, 15);
      const a = getRandomInt(3, 8);
      const b = getRandomInt(10, 40);
      const c = (a * x) + b;
      question = 'Solve for x: ' + a + 'x + ' + b + ' = ' + c;
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

function generateSequenceChallenge(difficulty = 'medium') {
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
      explanation = 'Each term is the sum of the previous two terms.';
    }
  } else {
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

function generateStroopChallenge(difficulty = 'medium') {
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
    inputType: 'choice'
  };
}

function generateChallenge(type = 'random', difficulty = 'medium') {
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
      failedAttempts: 0
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

  async startCooldown(durationMinutes = null) {
    const mins = durationMinutes || this.config.cooldownMinutes || 30;
    const cooldownEndTime = Date.now() + (mins * 60 * 1000);
    this.state.cooldownEndTime = cooldownEndTime;
    this.state.isBlocked = true;
    this.state.reelCount = 0;
    this.stats.cooldownsTriggeredToday += 1;

    await this._persistState();
    await this._persistStats();
    return { cooldownEndTime, remainingSeconds: mins * 60 };
  }

  async recordChallengeAttempt(success) {
    if (success) {
      this.state.isBlocked = false;
      this.state.reelCount = 0;
      this.state.failedAttempts = 0;
      this.state.sessionStartTime = Date.now();
      this.stats.challengesSolvedToday += 1;
      await this._persistState();
      await this._persistStats();
      return { unlocked: true, cooldownTriggered: false };
    } else {
      this.state.failedAttempts += 1;
      if (this.state.failedAttempts >= this.config.maxFailedAttempts) {
        const { cooldownEndTime } = await this.startCooldown();
        return {
          unlocked: false,
          cooldownTriggered: true,
          cooldownEndTime,
          failedAttempts: this.state.failedAttempts
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

  async resetSession() {
    this.state.reelCount = 0;
    this.state.isBlocked = false;
    this.state.failedAttempts = 0;
    this.state.cooldownEndTime = null;
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
        if (cooldown.isCooldown) {
          await updateBadge();
          return sendResponse({
            isBlocked: true,
            isCooldown: true,
            remainingSeconds: cooldown.remainingSeconds,
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
        const attemptResult = await stateManager.recordChallengeAttempt(isCorrect);

        if (attemptResult.unlocked) {
          await setStoredChallenge(null);
        }

        await updateBadge();
        return sendResponse({
          unlocked: attemptResult.unlocked,
          cooldownTriggered: attemptResult.cooldownTriggered,
          remainingSeconds: attemptResult.cooldownEndTime ? Math.ceil((attemptResult.cooldownEndTime - Date.now()) / 1000) : 0,
          failedAttempts: attemptResult.failedAttempts || 0,
          maxAttempts: config.maxFailedAttempts
        });
      }

      case 'START_COOLDOWN': {
        const { cooldownEndTime, remainingSeconds } = await stateManager.startCooldown();
        await setStoredChallenge(null);
        await updateBadge();
        return sendResponse({ cooldownEndTime, remainingSeconds });
      }

      case 'GET_POPUP_DATA': {
        const cooldown = await stateManager.checkCooldownStatus();
        const stats = await stateManager.getStats();
        state = await stateManager.getState();
        return sendResponse({
          state,
          config,
          stats,
          isCooldown: cooldown.isCooldown,
          remainingSeconds: cooldown.remainingSeconds
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
