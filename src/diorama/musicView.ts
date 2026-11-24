import { bandsData, type Band } from '@/content/bands';

/**
 * The music journey: every band is a piece of the drum kit. Hitting that piece
 * opens the band's story. The order is the order Alex joined them.
 */
export interface Track {
  title: string;
  artist?: string;
  src: string;
}

export interface JourneyBand {
  track: Track;
  id: string;
  /** What the little tag over the drum says. */
  short: string;
  band: Band;
}

const SHORT_NAMES: Record<string, string> = {
  '1': 'Voices',
  '2': 'Jazzlings',
  '3': 'Concrete Mirage',
  '4': 'Rosies',
  '5': '安得万全法',
  '6': 'NJB',
};

/** The song that plays for each band. */
const TRACKS: Record<string, Track> = {
  '1': { title: 'Finally', src: '/music/voices-finally.mp3' },
  '2': { title: 'Spanish Joint', artist: "D'Angelo", src: '/music/jazzlings-spanish-joint.mp3' },
  '3': { title: '777', artist: 'Silk Sonic', src: '/music/concrete-mirage-777.mp3' },
  '4': { title: '渣儿', artist: '二手玫瑰', src: '/music/rosies-zhaer.mp3' },
  '5': { title: '永嘉彗星', artist: '万能青年旅店', src: '/music/adwqf-yongjia-comet.mp3' },
  '6': { title: 'Full House', artist: 'Wes Montgomery', src: '/music/njb-full-house.mp3' },
};

const ORDER = ['1', '3', '6', '2', '4', '5'];

export const journeyBands: JourneyBand[] = ORDER.filter((id) => bandsData[id]).map((id) => ({
  id,
  track: TRACKS[id],
  short: SHORT_NAMES[id] ?? bandsData[id].name,
  band: bandsData[id],
}));

/** The band to show: the one in the address if it exists, otherwise the first. */
export function chosenBand(fromAddress: string | string[] | undefined) {
  const wanted = typeof fromAddress === 'string' ? fromAddress : undefined;
  return journeyBands.some((b) => b.id === wanted) ? (wanted as string) : journeyBands[0].id;
}
