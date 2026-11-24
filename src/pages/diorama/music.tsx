import type { ReactElement } from 'react';
import MusicPanel from '@/diorama/MusicPanel';
import RoomLayout from '@/diorama/RoomLayout';

/**
 * The music journey inside the room: the camera sits behind the drum kit and
 * every drum or cymbal stands for a band. The plain version is still at /projects?music=1.
 */
export default function RoomMusicPage() {
  return <MusicPanel />;
}

RoomMusicPage.getLayout = (page: ReactElement) => <RoomLayout>{page}</RoomLayout>;
