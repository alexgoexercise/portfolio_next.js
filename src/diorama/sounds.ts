/**
 * Sound effects for the room. The drum kit plays real recordings (see below);
 * everything else is synthesised with the browser's Web Audio API, so there
 * are no more files to download. Browsers only allow sound after the visitor
 * has clicked something, which every sound here follows.
 *
 * Everything goes through one shared "bus": a gentle compressor so loud
 * moments never clip, a low-pass that takes the harsh edge off, and a small
 * room reverb so the effects sound like they happen in a space, not inside
 * the speaker.
 */

export type SoundName = 'keys' | 'drum' | 'book' | 'ding' | 'poke' | 'wake';

interface Bus {
  ctx: AudioContext;
  /** Dry sound goes here. */
  dry: AudioNode;
  /** A send into the room reverb. */
  room: AudioNode;
}

let bus: Bus | null = null;

/** A short burst of decaying noise, which is what a small room's echo sounds like. */
function roomImpulse(ctx: AudioContext, seconds = 1.1) {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, frames, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
  }
  return buffer;
}

function audio(): Bus | null {
  if (typeof window === 'undefined') return null;
  if (!bus) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 9000;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    soften.connect(compressor).connect(master).connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = roomImpulse(ctx);
    const reverbLevel = ctx.createGain();
    reverbLevel.gain.value = 0.22;
    reverb.connect(reverbLevel).connect(soften);
    bus = { ctx, dry: soften, room: reverb };
  }
  if (bus.ctx.state === 'suspended') void bus.ctx.resume();
  return bus;
}

/** Sends a sound source to the bus: all of it dry, and some of it into the room. */
function route(b: Bus, source: AudioNode, room = 0.5) {
  source.connect(b.dry);
  if (room > 0) {
    const send = b.ctx.createGain();
    send.gain.value = room;
    source.connect(send).connect(b.room);
  }
}

/** A pitched note with a soft attack that fades out. */
function tone(
  b: Bus,
  at: number,
  from: number,
  to: number,
  length: number,
  volume: number,
  type: OscillatorType = 'sine',
  room = 0.5,
) {
  const osc = b.ctx.createOscillator();
  const gain = b.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + length);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain);
  route(b, gain, room);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** A burst of filtered noise, for clicks, paper and rustles. */
function noise(b: Bus, at: number, length: number, volume: number, centre: number, q = 0.8, room = 0.4) {
  const frames = Math.max(1, Math.floor(b.ctx.sampleRate * length));
  const buffer = b.ctx.createBuffer(1, frames, b.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2);
  const source = b.ctx.createBufferSource();
  source.buffer = buffer;
  const filter = b.ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = centre;
  filter.Q.value = q;
  const gain = b.ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain);
  route(b, gain, room);
  source.start(at);
}

/** A soft bell: the note plus two quieter overtones, ringing out. */
function bell(b: Bus, at: number, pitch: number, length: number, volume: number) {
  tone(b, at, pitch, pitch, length, volume, 'sine', 0.9);
  tone(b, at, pitch * 2.01, pitch * 2.01, length * 0.6, volume * 0.35, 'sine', 0.9);
  tone(b, at, pitch * 3.9, pitch * 3.9, length * 0.3, volume * 0.12, 'sine', 0.9);
}

export function playSound(name: SoundName) {
  const b = audio();
  if (!b) return;
  const t = b.ctx.currentTime + 0.01;
  switch (name) {
    case 'drum': // the kit card: a real kick, snare and crash, played as a little fill
      playDrumPiece('kick', 0, 0.9);
      playDrumPiece('snare', 0.16, 0.8);
      playDrumPiece('crashL', 0.32, 0.7);
      break;
    case 'keys': // real typing, one of two recorded bursts
      playClip(['keys-1', 'keys-2'], 0.9);
      break;
    case 'book': // a real book set down, or its pages flipped
      playClip(['book-1', 'book-2'], 0.9);
      break;
    case 'ding': // a phone notification: two soft bell notes
      bell(b, t, 1568, 0.55, 0.16);
      bell(b, t + 0.13, 2093, 0.8, 0.16);
      break;
    case 'poke': // a sleepy "mmph": a low hum that wobbles and sinks
      tone(b, t, 150, 95, 0.4, 0.2, 'sawtooth', 0.5);
      tone(b, t + 0.04, 110, 80, 0.45, 0.14, 'triangle', 0.5);
      noise(b, t, 0.3, 0.05, 500, 0.5, 0.4);
      break;
    case 'wake': // the bedsheets thrown off, then a startled breath
      playClip(['wake-1'], 1);
      tone(b, t + 0.25, 190, 300, 0.22, 0.1, 'triangle', 0.6);
      noise(b, t + 0.3, 0.3, 0.06, 2200, 0.5, 0.5);
      break;
  }
}

/** The pieces of the drum kit you can hit. */
export type DrumPiece =
  | 'kick'
  | 'snare'
  | 'snare2'
  | 'tom1'
  | 'tom2'
  | 'tom3'
  | 'tom4'
  | 'hihat'
  | 'crashL'
  | 'crashR'
  | 'crashBig'
  | 'ride'
  | 'china'
  | 'stack'
  | 'splash';

/**
 * Real recordings of the Muldjord drum kit, plus the second snare and the splash from Naked Drums (both Creative Commons BY 4.0, credited in the README). Each piece has a soft and a hard
 * hit. The clips are all levelled to the same loudness when they are made, so "gain" is 1 unless one piece needs a nudge.
 */
const DRUM_SAMPLES: Record<DrumPiece, { file: string; gain: number; rate?: number }> = {
  kick: { file: 'kick', gain: 1 },
  snare: { file: 'snare', gain: 1 },
  // Cranked tight and high: the brighter snare, played a little faster so it sits higher
  snare2: { file: 'snare2', gain: 1, rate: 1.22 },
  tom1: { file: 'tom1', gain: 1 },
  tom2: { file: 'tom2', gain: 1 },
  tom3: { file: 'tom3', gain: 1 },
  tom4: { file: 'tom4', gain: 1 },
  // Half open: the open hi-hat's recording, cut short so it sizzles and chokes
  hihat: { file: 'hihatSemi', gain: 1 },
  crashL: { file: 'crashL', gain: 1 },
  crashR: { file: 'crashR', gain: 1 },
  // The big crash is the same recording played slower, which makes it deeper and larger
  crashBig: { file: 'crashL', gain: 1, rate: 0.85 },
  ride: { file: 'ride', gain: 1 },
  china: { file: 'china', gain: 1 },
  // A stacked china: the china, a splash and a hi-hat sounded together and cut short, so it trashes
  stack: { file: 'stack', gain: 1 },
  splash: { file: 'splash', gain: 1 },
};

const drumBuffers = new Map<string, Promise<AudioBuffer | null>>();

function drumBuffer(ctx: AudioContext, name: string) {
  let buffer = drumBuffers.get(name);
  if (!buffer) {
    buffer = fetch(`/sounds/drums/${name}.mp3`)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    drumBuffers.set(name, buffer);
  }
  return buffer;
}

/** Starts downloading the drum recordings, so the first hit is not late. */
export function preloadDrums() {
  const b = audio();
  if (!b) return;
  for (const { file } of Object.values(DRUM_SAMPLES)) {
    void drumBuffer(b.ctx, `${file}-soft`);
    void drumBuffer(b.ctx, `${file}-hard`);
  }
}

/**
 * One hit on one piece of the kit: a recording of the real thing, with a little variation each time.
 * "delay" (seconds) and "level" are for playing several pieces in a row, like the fill on the kit's card.
 */
export function playDrumPiece(piece: DrumPiece, delay = 0, level = 1) {
  const b = audio();
  if (!b) return;
  const { file, gain, rate = 1 } = DRUM_SAMPLES[piece];
  const hard = Math.random() < 0.6;
  void drumBuffer(b.ctx, `${file}-${hard ? 'hard' : 'soft'}`).then((buffer) => {
    if (!buffer) return;
    const source = b.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate * (1 + (Math.random() - 0.5) * 0.04);
    const volume = b.ctx.createGain();
    volume.gain.value = Math.min(gain * (hard ? 0.9 : 0.75), 3) * level;
    source.connect(volume);
    route(b, volume, 0.12);
    source.start(b.ctx.currentTime + delay);
  });
}

const clipBuffers = new Map<string, Promise<AudioBuffer | null>>();

function clipBuffer(ctx: AudioContext, name: string) {
  let buffer = clipBuffers.get(name);
  if (!buffer) {
    buffer = fetch(`/sounds/fx/${name}.mp3`)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    clipBuffers.set(name, buffer);
  }
  return buffer;
}

/** Plays a recorded sound effect: one of the named clips, picked at random, with a little variation. */
function playClip(names: string[], level = 1) {
  const b = audio();
  if (!b) return;
  const name = names[Math.floor(Math.random() * names.length)];
  void clipBuffer(b.ctx, name).then((buffer) => {
    if (!buffer) return;
    const source = b.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.06;
    const volume = b.ctx.createGain();
    volume.gain.value = level;
    source.connect(volume);
    route(b, volume, 0.15);
    source.start();
  });
}

/** Starts downloading the recorded effects when the room opens, so the first click already has its sound. */
export function preloadEffects() {
  const b = audio();
  if (!b) return;
  for (const name of ['keys-1', 'keys-2', 'book-1', 'book-2', 'wake-1']) void clipBuffer(b.ctx, name);
  for (const piece of ['kick', 'snare', 'crashL'] as const) {
    void drumBuffer(b.ctx, `${DRUM_SAMPLES[piece].file}-soft`);
    void drumBuffer(b.ctx, `${DRUM_SAMPLES[piece].file}-hard`);
  }
}
