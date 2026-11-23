import type { ReactElement } from 'react';
import RoomLayout from '@/diorama/RoomLayout';

/** The about page inside the room: the shelf, and a sheet of paper that slides out of a book. */
export default function RoomAboutPage() {
  // The resume itself is drawn by RoomLayout, on the paper
  return null;
}

RoomAboutPage.getLayout = (page: ReactElement) => <RoomLayout>{page}</RoomLayout>;
