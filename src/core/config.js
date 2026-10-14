/**
 * MindShield Configuration Defaults
 * Enforces dual threshold triggers (10 reels OR 15 minutes of watching)
 * and high-cognitive challenge types (IBA/BCS, matrix logic, CRT).
 */
export const DEFAULT_CONFIG = {
  // Dual Limits: Triggers intervention whichever is breached first
  reelLimit: 10,              // Trigger puzzle after 10 reels
  timeLimitMinutes: 15,       // OR after 15 minutes of active reels watching
  
  // Cooldown / Penalty lockout
  cooldownMinutes: 30,        // 30 minutes lockout if puzzle failed or skipped
  maxFailedAttempts: 3,       // Number of tries before forcing cooldown
  
  // Brain Challenge Settings
  difficulty: 'insane',       // 'easy' | 'medium' | 'hard' | 'insane'
  challengeType: 'random',    // 'random' | 'math' | 'sequence' | 'stroop' | 'logic' | 'matrix' | 'iba_bcs' | 'game_logic'
  
  // Platform Toggles
  platforms: {
    instagram: true,
    youtube: true,
    facebook: true,
    tiktok: true
  },
  
  // Audio & Motivational Settings
  enableSound: true,
  strictMode: true,           // In strict mode, user cannot dismiss overlay without solving
  ageMode: 'all_ages'         // Age-appropriate, respectful content without violence or gambling cues
};

export const STORAGE_KEYS = {
  CONFIG: 'mindshield_config',
  STATE: 'mindshield_state',
  STATS: 'mindshield_stats',
  ACTIVE_CHALLENGE: 'mindshield_active_challenge',
  LAST_FAILED_CHALLENGE: 'mindshield_last_failed_challenge'
};
