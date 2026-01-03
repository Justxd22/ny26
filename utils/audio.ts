// Advanced Procedural Audio Engine
// Generates sci-fi UI sounds using Web Audio API

let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
};

// --- SYNTHESIZERS ---

const playBootSound = (ctx: AudioContext, time: number) => {
  // THX-style deep rising drone
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = "sawtooth";
  osc2.type = "square";
  
  osc1.frequency.setValueAtTime(50, time);
  osc1.frequency.exponentialRampToValueAtTime(300, time + 2);
  
  osc2.frequency.setValueAtTime(52, time); // Detuned slightly
  osc2.frequency.exponentialRampToValueAtTime(302, time + 2);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(100, time);
  filter.frequency.linearRampToValueAtTime(2000, time + 1.5);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.3, time + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 3);
  osc2.stop(time + 3);
};

const playTypeSound = (ctx: AudioContext, time: number) => {
  // Clicky mechanical keyboard switch sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  
  // 1. Tonal "clack"
  osc.frequency.setValueAtTime(800 + Math.random() * 200, time);
  osc.type = "square";
  gain.gain.setValueAtTime(0.05, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  
  // 2. Physical "thud" (noise)
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = buffer;
  
  // Filter the noise to be bassy
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1000;

  noiseGain.gain.setValueAtTime(0.1, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.05);
  noise.start(time);
};

const playErrorSound = (ctx: AudioContext, time: number) => {
  // Harsh digital glitch
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator(); // Low Frequency Oscillator for modulation

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, time);
  
  lfo.type = "square";
  lfo.frequency.value = 50; // Fast stutter
  lfo.connect(gain.gain); // Modulate volume

  gain.gain.setValueAtTime(0.2, time);
  gain.gain.linearRampToValueAtTime(0.001, time + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  lfo.start(time);
  osc.start(time);
  osc.stop(time + 0.4);
  lfo.stop(time + 0.4);
};

const playWhooshSound = (ctx: AudioContext, time: number) => {
  // Sci-fi pass-by
  const bufferSize = ctx.sampleRate * 1.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1;
  
  // Filter sweep
  filter.frequency.setValueAtTime(200, time);
  filter.frequency.exponentialRampToValueAtTime(3000, time + 0.5);
  filter.frequency.exponentialRampToValueAtTime(100, time + 1.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.2, time + 0.5);
  gain.gain.linearRampToValueAtTime(0, time + 1.2);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(-1, time);
  panner.pan.linearRampToValueAtTime(1, time + 1.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);

  noise.start(time);
};

const playSuccessSound = (ctx: AudioContext, time: number) => {
  // Nintendo/Sega coin style
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc2.type = "triangle";

  // Arpeggio B -> E (High pitch)
  osc1.frequency.setValueAtTime(987.77, time); // B5
  osc1.frequency.setValueAtTime(1318.51, time + 0.1); // E6
  
  osc2.frequency.setValueAtTime(987.77 * 1.01, time); // Detuned slightly
  osc2.frequency.setValueAtTime(1318.51 * 1.01, time + 0.1);

  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.6);
  osc2.stop(time + 0.6);
};

const playExplosionSound = (ctx: AudioContext, time: number) => {
  // Deep bass hit + noise
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(100, time);
  osc.frequency.exponentialRampToValueAtTime(10, time + 1);
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 1);
};

// --- PUBLIC API ---

export const playSound = (type: 'boot' | 'type' | 'error' | 'success' | 'explosion' | 'whoosh') => {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  switch (type) {
    case 'boot': playBootSound(ctx, now); break;
    case 'type': playTypeSound(ctx, now); break;
    case 'error': playErrorSound(ctx, now); break;
    case 'success': playSuccessSound(ctx, now); break;
    case 'explosion': playExplosionSound(ctx, now); break;
    case 'whoosh': playWhooshSound(ctx, now); break;
  }
};