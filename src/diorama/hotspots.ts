import type { ViewName } from './sceneConfig';
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
  /** A preset camera view the card can glide to, and the text on its button. */
  view?: { name: ViewName; label: string };
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
    blurb: 'Robots, embedded systems and the things I built on this machine (with Claude).',
    href: '/projects',
    cta: 'Stalk what projects Alex has been working on',
    source: 'room',
    parts: ['GamingPC', 'Monitor_Left', 'Monitor_Right', 'Keyboard'],
    sound: 'keys',
    noise: 0.2,
  },
  {
    id: 'music',
    label: 'The drum kit',
    blurb: 'Alex did not practise any rudiments today.',
    href: '/projects?music=1',
    cta: 'Stalk Alex\'s music journey',
    view: { name: 'drummer', label: 'Sit behind the kit' },
    source: 'drumkit',
    parts: [],
    sound: 'drum',
    noise: 0.45,
  },
  {
    id: 'about',
    label: 'The shelf',
    blurb: 'If you want to know where I studied, where I have worked and what I know.',
    href: '/about',
    cta: 'Stalk Alex\s Resume',
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
    cta: 'Get in touch with Alex and follow him on Instagram',
    source: 'room',
    parts: ['Phone'],
    sound: 'ding',
    noise: 0.25,
  },
  {
    id: 'alex',
    label: 'Alex',
    blurb: 'Don\'t poke me, Don\'t poke me.',
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
