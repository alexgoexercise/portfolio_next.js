import type { ReactElement } from 'react';
import RoomLayout from '@/diorama/RoomLayout';

/** The contacts page inside the room: the 3D scene is the shared layout, this is the text drawn on top. */
export default function RoomContactsPage() {
  // The phone and its screen are drawn by RoomLayout
  return null;
}

RoomContactsPage.getLayout = (page: ReactElement) => <RoomLayout>{page}</RoomLayout>;
