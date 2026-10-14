/**
 * MindShield Dopamine Anger & Focus Avatar Engine
 * Dynamically computes guardian emotion & emoji based on:
 * 1. Reel count progress (e.g. 1 to 10 reels)
 * 2. Active watch elapsed time (e.g. 0 to 15 minutes)
 * Whichever reaches the limit increases the anger level!
 */

export const ANGER_TIERS = [
  {
    level: 0,
    emoji: '😇',
    mood: 'Zen Focus',
    bengali: 'শান্ত মেজাজ',
    quote: 'Fresh session. Be intentional!',
    color: '#10b981',
    className: 'ms-anger-0'
  },
  {
    level: 1,
    emoji: '😎',
    mood: 'Chill (1st Reel)',
    bengali: 'মজার মেজাজ (১ম রিল)',
    quote: 'Just one reel! Enjoying responsibly.',
    color: '#06b6d4',
    className: 'ms-anger-1'
  },
  {
    level: 2,
    emoji: '🤨',
    mood: 'Mild Suspicion',
    bengali: 'হালকা রাগ (২য় রিল)',
    quote: 'Hmm... watching another already?',
    color: '#3b82f6',
    className: 'ms-anger-2'
  },
  {
    level: 3,
    emoji: '😒',
    mood: 'Unamused',
    bengali: 'আরও রাগ (৩য় রিল)',
    quote: '3 reels in. Dopamine spiral starting.',
    color: '#8b5cf6',
    className: 'ms-anger-3'
  },
  {
    level: 4,
    emoji: '😠',
    mood: 'Irritated',
    bengali: 'আরও রাগ (৪র্থ রিল)',
    quote: 'Getting irritated! Put the phone down.',
    color: '#f59e0b',
    className: 'ms-anger-4'
  },
  {
    level: 5,
    emoji: '😡',
    mood: 'Halfway Stern',
    bengali: 'গম্ভীর রাগ (অর্ধেক শেষ)',
    quote: '50% dopamine limit breached!',
    color: '#f97316',
    className: 'ms-anger-5'
  },
  {
    level: 6,
    emoji: '😤',
    mood: 'Steaming Mad',
    bengali: 'ফুঁসছে রাগ (৬ষ্ঠ রিল)',
    quote: 'Steam from ears! Still scrolling?!',
    color: '#ea580c',
    className: 'ms-anger-6'
  },
  {
    level: 7,
    emoji: '🤬',
    mood: 'Furious Guardian',
    bengali: 'মারাত্মক ক্ষিপ্ত (৭ম রিল)',
    quote: 'Why are you doing this to your brain?!',
    color: '#ef4444',
    className: 'ms-anger-7'
  },
  {
    level: 8,
    emoji: '👿',
    mood: 'Danger Zone',
    bengali: 'চরম বিপদসীমা (৮ম রিল)',
    quote: 'Red alert! You are losing control.',
    color: '#dc2626',
    className: 'ms-anger-8'
  },
  {
    level: 9,
    emoji: '💥',
    mood: 'Fuse Lit',
    bengali: 'বিস্ফোরণোন্মুখ (৯ম রিল)',
    quote: 'Final warning! NEXT REEL WILL LOCK!',
    color: '#b91c1c',
    className: 'ms-anger-9'
  },
  {
    level: 10,
    emoji: '🤯',
    altEmoji: '🌋',
    mood: 'RAGE EXPLODED!',
    bengali: 'রাগ ফাইটে উঠেছে! (১০ম রিল/টাইম শেষ)',
    quote: 'BOOM! Dopamine limit destroyed. LOCK ENGAGED!',
    color: '#7f1d1d',
    className: 'ms-anger-10'
  }
];

export const COOLDOWN_TIER = {
  level: -1,
  emoji: '🛑',
  mood: 'Detox Lockout',
  bengali: 'ডোপামিন ডিটক্স মোড',
  quote: 'Step away from the screen and breathe.',
  color: '#ef4444',
  className: 'ms-anger-cooldown'
};

/**
 * Compute the anger level (0-10) from both reelCount and elapsedMinutes
 */
export function getAngerMood({
  reelCount = 0,
  reelLimit = 10,
  elapsedMinutes = 0,
  timeLimitMinutes = 15,
  isBlocked = false,
  isCooldown = false
}) {
  if (isCooldown) {
    return { ...COOLDOWN_TIER, percent: 100 };
  }

  // Calculate percentage of limits reached
  const reelRatio = reelLimit > 0 ? (reelCount / reelLimit) : 0;
  const timeRatio = timeLimitMinutes > 0 ? (elapsedMinutes / timeLimitMinutes) : 0;

  // Progression: take the most intense driver (reels or time)
  // If either hits limit or isBlocked is set, rage explodes at level 10!
  if (isBlocked || (reelLimit > 0 && reelCount >= reelLimit) || (timeLimitMinutes > 0 && elapsedMinutes >= timeLimitMinutes)) {
    return { ...ANGER_TIERS[10], percent: 100 };
  }

  const reelLevel = Math.min(10, Math.floor(reelCount));
  const timeLevel = Math.min(10, Math.floor(timeRatio * 10));
  const level = Math.min(10, Math.max(0, Math.max(reelLevel, timeLevel)));

  const effectivePercent = Math.min(100, Math.round(Math.max(reelRatio, timeRatio) * 100));

  return {
    ...ANGER_TIERS[level],
    percent: effectivePercent,
    level
  };
}

