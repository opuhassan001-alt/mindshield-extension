/**
 * MindShield Configuration Defaults
 */
export const DEFAULT_CONFIG = {
  // Limits triggering the intervention
  reelLimit: 5,               // Trigger puzzle after 5 reels
  timeLimitMinutes: 10,       // Or trigger after 10 minutes of active reels watching
  
  // Cooldown / Penalty lockout
  cooldownMinutes: 30,        // 30 minutes lockout if puzzle failed or skipped
  maxFailedAttempts: 3,       // Number of tries before forcing cooldown
  
  // Brain Challenge Settings
  difficulty: 'insane',       // 'easy' | 'medium' | 'hard' | 'insane' (Maximum cognitive difficulty)
  challengeType: 'random',    // 'random' | 'math' | 'sequence' | 'stroop' | 'logic' | 'matrix'
  
  // Platform Toggles
  platforms: {
    instagram: true,
    youtube: true,
    facebook: true,
    tiktok: true
  },
  
  // Audio & Motivational Settings
  enableSound: true,
  strictMode: true            // In strict mode, user cannot dismiss overlay without solving
};

export const STORAGE_KEYS = {
  CONFIG: 'mindshield_config',
  STATE: 'mindshield_state',
  STATS: 'mindshield_stats',
  ACTIVE_CHALLENGE: 'mindshield_active_challenge',
  LAST_FAILED_CHALLENGE: 'mindshield_last_failed_challenge'
};
