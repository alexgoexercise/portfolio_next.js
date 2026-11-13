import type { SoundName } from './sounds';

/**
 * The things in the room you can click.
 *
 * `parts` are object names from the Blender files (see blender/bake_room.py
 * for the list). Each hotspot's clickable area is worked out from where those
 * parts sit, so moving furniture in Blender needs no change here.
 */
export interface Hotspot {
  id: string;
  /** Short name shown on hover and as the card's title. */
  label: string;
  /** One line shown on the card after a click. */
  blurb: string;
  /** Page the card links to. Leave out for things that only make noise. */
  href?: string;
  /** Text on the card's link. */
  cta?: string;
  /** Where the parts live: the baked room, or the drum kit file (the whole kit). */
  source: 'room' | 'drumkit';
  parts: string[];
  sound: SoundName;
  /** How much one click adds to the wake-up meter (which is full at 1). */
  noise: number;
}

export const hotspots: Hotspot[] = [
  {
    id: 'projects',
    label: 'The PC',
    blurb: 'Robots, embedded systems and the things I built on this machine.',
    href: '/projects',
    cta: 'See projects',
    source: 'room',
    parts: ['GamingPC', 'Monitor_Left', 'Monitor_Right', 'Keyboard'],
    sound: 'keys',
    noise: 0.2,
  },
  {
    id: 'music',
    label: 'The drum kit',
    blurb: 'Bands, gigs and what I play when I am not at the desk.',
    href: '/projects?music=1',
    cta: 'See music',
    source: 'drumkit',
    parts: [],
    sound: 'drum',
    noise: 0.45,
  },
  {
    id: 'about',
    label: 'The shelf',
    blurb: 'Where I studied, where I have worked and what I know.',
    href: '/about',
    cta: 'About me',
    source: 'room',
    parts: ['Shelf'],
    sound: 'book',
    noise: 0.15,
  },
  {
    id: 'contacts',
    label: 'The phone',
    blurb: 'Email, LinkedIn and everywhere else you can reach me.',
    href: '/contacts',
    cta: 'Get in touch',
    source: 'room',
    parts: ['Phone'],
    sound: 'ding',
    noise: 0.25,
  },
  {
    id: 'alex',
    label: 'Alex',
    blurb: 'Asleep. Poking him is not going to help.',
    source: 'room',
    parts: ['Bed'],
    sound: 'poke',
    noise: 0.5,
  },
];

/** Game tuning. */
export const game = {
  /** Meter drained per second while nobody is making noise. */
  calmPerSecond: 0.035,
  /** Where the meter restarts after Alex is allowed back to sleep. */
  afterSleep: 0.2,
  /** Smallest clickable box, in metres, so tiny things like the phone are easy to hit. */
  minHotspotSize: 0.34,
};
