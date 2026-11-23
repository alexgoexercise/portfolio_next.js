import type { ReactElement } from 'react';
import RoomLayout from '@/diorama/RoomLayout';

/**
 * The 3D bedroom. Reached from the landing page and from the "room" button on
 * every other page; ?at=projects (or music, about, contacts) opens that object.
 * The room itself is drawn by the shared layout, so this page adds nothing.
 */
export default function RoomPage() {
  return null;
}

RoomPage.getLayout = (page: ReactElement) => <RoomLayout>{page}</RoomLayout>;
