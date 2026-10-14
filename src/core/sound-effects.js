/**
 * MindShield Sound & Particle FX Engine
 * Pure Web Audio API synthesizers and visual celebrations.
 */

let isMuted = false;

export function setMuted(muted) {
  isMuted = muted;
}

export function getMuted() {
  return isMuted;
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

/**
 * Play gentle focus chime / Tibetan singing bowl chord
 * Used when the screen locks to gently interrupt the dopamine trance
 */
export function playWarningBell() {
  // Turned off by user request: "ting ting ting ting" sound disabled
  return;
}

/**
 * Play a victorious ascending major arpeggio
 * Used when the user solves the prefrontal challenge correctly!
 */
export function playSuccessFanfare() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // C5, E5, G5, C6 arpeggio
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
  } catch (e) {
    // Audio context blocked
  }
}

/**
 * Play low discord warning buzz
 * Used when an incorrect answer is submitted
 */
export function playErrorBuzz() {
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
    osc2.frequency.setValueAtTime(147, ctx.currentTime); // Discord dissonance

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio context blocked
  }
}

/**
 * Generate confetti celebration explosion inside a container
 */
export function launchCelebration(container) {
  if (!container) return;

  const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
  const confettiCount = 36;

  for (let i = 0; i < confettiCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'ms-confetti-particle';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 360;
    const distance = 80 + Math.random() * 160;
    const size = 6 + Math.random() * 8;
    const spin = (Math.random() - 0.5) * 720;

    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * distance;
    const ty = Math.sin(rad) * distance;

    particle.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      width: ${size}px;
      height: ${size * (Math.random() > 0.5 ? 1 : 1.8)}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events: none;
      z-index: 9999;
      --tx: ${tx}px;
      --ty: ${ty}px;
      --spin: ${spin}deg;
      animation: msBurstParticle 0.7s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
    `;

    container.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}
