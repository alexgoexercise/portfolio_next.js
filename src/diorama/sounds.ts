/**
 * Tiny synthesised sound effects, made with the browser's Web Audio API so
 * there are no audio files to download. Browsers only allow sound after the
 * visitor has clicked something, which every sound here follows.
 */

export type SoundName = 'keys' | 'drum' | 'book' | 'ding' | 'poke' | 'wake';

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** A pitched blip that fades out. */
function tone(ctx: AudioContext, at: number, from: number, to: number, length: number, volume: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + length);
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** A burst of hiss, for snares, clicks and rustles. */
function hiss(ctx: AudioContext, at: number, length: number, volume: number, cutoff: number) {
  const frames = Math.floor(ctx.sampleRate * length);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(at);
}

export function playSound(name: SoundName) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  switch (name) {
    case 'drum': // kick, then snare, then a crash
      tone(ctx, t, 150, 45, 0.28, 0.9);
      tone(ctx, t + 0.16, 220, 120, 0.12, 0.4, 'triangle');
      hiss(ctx, t + 0.16, 0.18, 0.5, 1800);
      hiss(ctx, t + 0.32, 0.9, 0.35, 5000);
      break;
    case 'keys': // a few mechanical key clacks
      for (let i = 0; i < 4; i++) {
        hiss(ctx, t + i * 0.07, 0.03, 0.35, 2500);
        tone(ctx, t + i * 0.07, 900 - i * 60, 300, 0.03, 0.08, 'square');
      }
      break;
    case 'book': // a soft thud
      tone(ctx, t, 110, 60, 0.14, 0.5);
      hiss(ctx, t, 0.08, 0.15, 600);
      break;
    case 'ding': // two-note notification
      tone(ctx, t, 1320, 1320, 0.22, 0.25);
      tone(ctx, t + 0.12, 1760, 1760, 0.35, 0.25);
      break;
    case 'poke': // a muffled grumble
      tone(ctx, t, 140, 90, 0.35, 0.35, 'sawtooth');
      tone(ctx, t + 0.05, 95, 70, 0.4, 0.25, 'triangle');
      break;
    case 'wake': // a rising "huh?!"
      tone(ctx, t, 180, 420, 0.35, 0.35, 'sawtooth');
      tone(ctx, t + 0.3, 420, 300, 0.25, 0.25, 'triangle');
      break;
  }
}
