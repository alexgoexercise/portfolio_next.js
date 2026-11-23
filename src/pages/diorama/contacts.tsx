import type { ReactElement } from 'react';
import ContactsPanel from '@/diorama/ContactsPanel';
import RoomLayout from '@/diorama/RoomLayout';

/** The contacts page inside the room: the 3D scene is the shared layout, this is the text drawn on top. */
export default function RoomContactsPage() {
  return <ContactsPanel />;
}

RoomContactsPage.getLayout = (page: ReactElement) => <RoomLayout>{page}</RoomLayout>;
