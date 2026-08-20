/**
 * Pure Web Audio API synthesis engine — zero MP3 assets, zero network latency.
 *
 * Kickoff Whistle   — sine sweep 800Hz → 1200Hz
 * Goal Chime        — arpeggiated C major triad (C4-E4-G4-C5)
 * Save Thump        — low bandpass thump, 150Hz decay
 * Crossbar Clang    — metallic woodwork ping
 * Victory Fanfare   — bright square-wave horn sequence
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Call from any user gesture (click/tap) to unlock mobile audio. */
export function unlockAudio(): void {
  getCtx();
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  ctxRef: AudioContext,
  opts: { attack?: number; endFreq?: number } = {},
) {
  const osc = ctxRef.createOscillator();
  const gain = ctxRef.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctxRef.currentTime + start);
  if (opts.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, opts.endFreq),
      ctxRef.currentTime + start + duration,
    );
  }
  const attack = opts.attack ?? 0.008;
  gain.gain.setValueAtTime(0.0001, ctxRef.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ctxRef.currentTime + start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctxRef.currentTime + start + duration);
  osc.connect(gain).connect(ctxRef.destination);
  osc.start(ctxRef.currentTime + start);
  osc.stop(ctxRef.currentTime + start + duration + 0.05);
}

function noiseBurst(
  start: number,
  duration: number,
  volume: number,
  ctxRef: AudioContext,
  cutoff: number,
) {
  const bufferSize = Math.max(1, Math.floor(ctxRef.sampleRate * duration));
  const buffer = ctxRef.createBuffer(1, bufferSize, ctxRef.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = ctxRef.createBufferSource();
  src.buffer = buffer;
  const filter = ctxRef.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = cutoff;
  filter.Q.value = 0.8;
  const gain = ctxRef.createGain();
  gain.gain.setValueAtTime(volume, ctxRef.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctxRef.currentTime + start + duration);
  src.connect(filter).connect(gain).connect(ctxRef.destination);
  src.start(ctxRef.currentTime + start);
}

/** 🏁 Kickoff whistle: layered sine sweep holding a longer body. */
export function kickoffWhistle(): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  tone(800, 0, 0.32, 'sine', 0.22, c, { endFreq: 1200, attack: 0.02 });
  tone(800, 0.02, 0.3, 'sine', 0.16, c, { endFreq: 1200, attack: 0.02 });
  tone(1200, 0.09, 0.24, 'sine', 0.1, c, { endFreq: 1500 });
  void now;
}

/** ⚽ Goal chime: arpeggiated C major triad. */
export function goalChime(): void {
  const c = getCtx();
  if (!c) return;
  const notes = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5
  notes.forEach((f, i) => {
    tone(f, i * 0.09, 0.5, 'triangle', 0.2, c, { attack: 0.01 });
    tone(f * 2, i * 0.09 + 0.02, 0.35, 'sine', 0.06, c, { attack: 0.01 });
  });
  noiseBurst(0, 0.18, 0.28, c, 900);
}

/** 🧤 Save: low bandpass thump with 150Hz body decay. */
export function saveThump(): void {
  const c = getCtx();
  if (!c) return;
  tone(150, 0, 0.28, 'sine', 0.5, c, { endFreq: 60, attack: 0.004 });
  tone(95, 0, 0.22, 'square', 0.08, c, { endFreq: 50 });
  noiseBurst(0, 0.12, 0.16, c, 300);
}

/** 🪵 Crossbar: bright metallic clang. */
export function crossbarClang(): void {
  const c = getCtx();
  if (!c) return;
  tone(880, 0, 0.45, 'triangle', 0.24, c, { endFreq: 622, attack: 0.003 });
  tone(1318.5, 0.01, 0.3, 'sine', 0.1, c, { endFreq: 988 });
  noiseBurst(0, 0.06, 0.1, c, 4000);
}

/** 🏆 Victory fanfare: bright square-wave horn sequence. */
export function victoryFanfare(): void {
  const c = getCtx();
  if (!c) return;
  const seq = [
    [523.25, 0.0], // C5
    [659.25, 0.18], // E5
    [783.99, 0.36], // G5
    [1046.5, 0.52], // C6
    [783.99, 0.82], // G5
    [1046.5, 1.0], // C6
  ];
  seq.forEach(([f, t]) => {
    tone(f, t, 0.5, 'square', 0.07, c, { attack: 0.01 });
    tone(f / 2, t + 0.02, 0.45, 'sine', 0.16, c, { attack: 0.01 });
  });
  tone(392.0, 1.18, 1.2, 'sine', 0.18, c, { attack: 0.05 });
}

/** 🥈 Runner-up decrescendo to keep the drama respectful. */
export function runnerUpTone(): void {
  const c = getCtx();
  if (!c) return;
  [392.0, 329.63, 261.63].forEach((f, i) =>
    tone(f, i * 0.22, 0.5, 'triangle', 0.14, c, { attack: 0.02 }),
  );
}

/** 📦 Foil pack rip / unseal tear sound with crisp burst & frequency sweep. */
export function packRip(): void {
  const c = getCtx();
  if (!c) return;
  noiseBurst(0, 0.22, 0.35, c, 3200);
  tone(550, 0.02, 0.18, 'sine', 0.22, c, { endFreq: 180, attack: 0.005 });
  tone(220, 0.06, 0.28, 'triangle', 0.28, c, { endFreq: 60, attack: 0.008 });
}

/** 🃏 Quick snappy card deal / whoosh sound. */
export function cardDeal(): void {
  const c = getCtx();
  if (!c) return;
  noiseBurst(0, 0.06, 0.14, c, 1800);
  tone(380, 0, 0.08, 'sine', 0.12, c, { endFreq: 750, attack: 0.003 });
}

/** 🎴 Crisp card flip snap sound. */
export function cardFlip(): void {
  const c = getCtx();
  if (!c) return;
  tone(620, 0, 0.09, 'triangle', 0.22, c, { endFreq: 980, attack: 0.002 });
  noiseBurst(0, 0.04, 0.16, c, 2400);
}

/** ✨ Shimmer sparkle chime for high tier reveal. */
export function tierReveal(): void {
  const c = getCtx();
  if (!c) return;
  const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
  chord.forEach((freq, idx) => {
    tone(freq, idx * 0.04, 0.45, 'sine', 0.15, c, { attack: 0.005 });
    tone(freq * 1.5, idx * 0.04 + 0.02, 0.3, 'triangle', 0.08, c, { attack: 0.005 });
  });
  noiseBurst(0, 0.12, 0.1, c, 3500);
}

/** 🌟 Legendary walkout stinger (dramatic cinematic chord sequence). */
export function walkoutStinger(): void {
  const c = getCtx();
  if (!c) return;
  // Dramatic bass surge
  tone(80, 0, 0.8, 'sine', 0.45, c, { endFreq: 40, attack: 0.02 });
  tone(120, 0.05, 0.6, 'sawtooth', 0.15, c, { endFreq: 60, attack: 0.02 });

  // Stinger Fanfare
  const fanfare = [
    [440.0, 0.1], // A4
    [554.37, 0.22], // C#5
    [659.25, 0.35], // E5
    [880.0, 0.48], // A5
    [1108.73, 0.62], // C#6
  ];
  fanfare.forEach(([freq, time]) => {
    tone(freq, time, 0.65, 'triangle', 0.18, c, { attack: 0.008 });
    tone(freq / 2, time + 0.01, 0.6, 'sine', 0.12, c, { attack: 0.008 });
  });
}

export const sfx = {
  unlock: unlockAudio,
  kickoff: kickoffWhistle,
  goal: goalChime,
  save: saveThump,
  crossbar: crossbarClang,
  victory: victoryFanfare,
  runnerUp: runnerUpTone,
  packRip: packRip,
  cardDeal: cardDeal,
  cardFlip: cardFlip,
  tierReveal: tierReveal,
  walkout: walkoutStinger,
};
