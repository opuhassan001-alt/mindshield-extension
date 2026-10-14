/**
 * MindShield Neuro-Focus Soundscapes Engine
 * Generates scientifically proven audio frequencies to optimize prefrontal cortex focus,
 * calm ADHD restlessness, and promote dopamine recovery.
 */

export const FOCUS_TRACKS = [
  {
    id: 'brown',
    name: 'Deep Brown Noise',
    tag: '🌊 ADHD Stochastic Resonance',
    category: 'noise',
    description: 'Deep rumbling frequency spectrum with gentle low-pass roll-off. Reduces ADHD mental chatter and provides an acoustic blanket.',
    adhdBenefit: 'Optimal for ADHD focus: raises background neural arousal to reduce dopamine-seeking restlessness.'
  },
  {
    id: 'gamma40',
    name: '40 Hz Gamma Focus Wave',
    tag: '⚡ Prefrontal Gamma Entrainment',
    category: 'binaural',
    frequency: 40,
    description: '40 Hz amplitude-modulated gamma oscillation (MIT Research). Synchronizes neural circuits for executive processing.',
    adhdBenefit: 'Clinically proven to sharpen Working Memory and executive attention span.'
  },
  {
    id: 'alpha',
    name: '10 Hz Alpha Flow State',
    tag: '🧠 Calm Alertness',
    category: 'binaural',
    carrierFreq: 210,
    beatFreq: 10,
    description: 'Stereo binaural beat at 10 Hz (Alpha band). Promotes relaxed alertness and calm concentration without drowsiness.',
    adhdBenefit: 'Shifts brainwaves away from anxious racing thoughts into calm flow states.'
  },
  {
    id: 'beta',
    name: '16 Hz Beta Analytical Boost',
    tag: '🎯 Problem Solving Focus',
    category: 'binaural',
    carrierFreq: 200,
    beatFreq: 16,
    description: 'Stereo binaural beat at 16 Hz (Beta band). Stimulates prefrontal cortex for solving math, logic puzzles, and active analysis.',
    adhdBenefit: 'Enhances cognitive speed and analytical problem-solving capability.'
  },
  {
    id: 'pink',
    name: 'Rainfall Pink Noise',
    tag: '🌧️ Sustained Concentration',
    category: 'noise',
    description: 'Natural 1/f frequency balance mimicking continuous rainfall. Masks distracting sudden room noises.',
    adhdBenefit: 'Improves sustained task endurance and prevents sensory overload.'
  }
];

export function getTrackInfo(id) {
  const found = FOCUS_TRACKS.find(t => t.id === id);
  return found || FOCUS_TRACKS[0];
}

// Runtime State for Web Audio API
let audioCtx = null;
let currentNodes = [];
let gainNode = null;
let activeTrackId = null;
let isSoundActive = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Stop any running soundscape
 */
export function stopSoundscape() {
  currentNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch {
      // Node already stopped
    }
  });
  currentNodes = [];
  activeTrackId = null;
  isSoundActive = false;
}

export function isPlaying() {
  return isSoundActive;
}

export function getCurrentTrack() {
  return activeTrackId ? getTrackInfo(activeTrackId) : null;
}

export function setSoundscapeVolume(vol) {
  if (gainNode && audioCtx) {
    const safeVol = Math.max(0, Math.min(1, vol));
    gainNode.gain.setValueAtTime(safeVol, audioCtx.currentTime);
  }
}

/**
 * Start a specific neuro-focus soundscape
 */
export function startSoundscape(trackId = 'brown', volume = 0.5) {
  stopSoundscape();

  const ctx = getAudioContext();
  if (!ctx) return false;

  gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.connect(ctx.destination);

  switch (trackId) {
    case 'brown':
      createBrownNoise(ctx, gainNode);
      break;
    case 'gamma40':
      createGamma40Hz(ctx, gainNode);
      break;
    case 'alpha':
      createBinauralBeat(ctx, gainNode, 210, 10);
      break;
    case 'beta':
      createBinauralBeat(ctx, gainNode, 200, 16);
      break;
    case 'pink':
      createPinkNoise(ctx, gainNode);
      break;
    default:
      createBrownNoise(ctx, gainNode);
      break;
  }

  activeTrackId = trackId;
  isSoundActive = true;
  return true;
}

/**
 * Brownian Noise (1/f^2 random walk)
 */
function createBrownNoise(ctx, masterGain) {
  const bufferSize = 5 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + (0.02 * white)) / 1.02;
    data[i] = lastOut * 3.5;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  // Gentle low-pass filter to smooth higher harmonics
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, ctx.currentTime);

  noise.connect(filter);
  filter.connect(masterGain);

  noise.start();
  currentNodes.push(noise, filter);
}

/**
 * 40 Hz Gamma Wave Entrainment (Amplitude Modulated Carrier)
 */
function createGamma40Hz(ctx, masterGain) {
  // Carrier Tone: 220 Hz (Warm A3 tone)
  const carrier = ctx.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(220, ctx.currentTime);

  // 40 Hz Modulator
  const modulator = ctx.createOscillator();
  modulator.type = 'sine';
  modulator.frequency.setValueAtTime(40, ctx.currentTime);

  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(0.5, ctx.currentTime);

  const carrierGain = ctx.createGain();
  carrierGain.gain.setValueAtTime(0.5, ctx.currentTime);

  modulator.connect(modGain);
  modGain.connect(carrierGain.gain);

  carrier.connect(carrierGain);
  carrierGain.connect(masterGain);

  carrier.start();
  modulator.start();
  currentNodes.push(carrier, modulator, carrierGain, modGain);
}

/**
 * Binaural Beat Generator (Stereo Panned Left/Right Frequencies)
 */
function createBinauralBeat(ctx, masterGain, carrierFreq, beatFreq) {
  const leftFreq = carrierFreq;
  const rightFreq = carrierFreq + beatFreq;

  const leftOsc = ctx.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.setValueAtTime(leftFreq, ctx.currentTime);

  const rightOsc = ctx.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.setValueAtTime(rightFreq, ctx.currentTime);

  // Stereo Panners
  let leftNode = leftOsc;
  let rightNode = rightOsc;

  if (ctx.createStereoPanner) {
    const leftPanner = ctx.createStereoPanner();
    leftPanner.pan.setValueAtTime(-1, ctx.currentTime); // 100% Left
    leftOsc.connect(leftPanner);
    leftNode = leftPanner;

    const rightPanner = ctx.createStereoPanner();
    rightPanner.pan.setValueAtTime(1, ctx.currentTime); // 100% Right
    rightOsc.connect(rightPanner);
    rightNode = rightPanner;

    currentNodes.push(leftPanner, rightPanner);
  }

  leftNode.connect(masterGain);
  rightNode.connect(masterGain);

  leftOsc.start();
  rightOsc.start();
  currentNodes.push(leftOsc, rightOsc);
}

/**
 * Pink Noise (1/f natural noise)
 */
function createPinkNoise(ctx, masterGain) {
  const bufferSize = 5 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
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

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  noise.connect(masterGain);
  noise.start();
  currentNodes.push(noise);
}

