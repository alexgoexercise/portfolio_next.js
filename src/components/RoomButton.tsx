import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ROOM_VISITED_KEY } from '@/diorama/session';

/**
 * Floating button on every plain page that leads to the 3D room.
 *
 * It knows which page it is on and sends you to the matching object: from
 * Projects you land with the PC selected, from a band page the drum kit, and
 * so on. If you have already been in the room this visit it says "Back to".
 * The room also remembers its noise meter, so you return to it as you left it.
 */
function spotFor(pathname: string, music: boolean): string | null {
  if (pathname.startsWith('/band')) return 'music';
  if (pathname === '/projects') return music ? 'music' : 'projects';
  if (pathname === '/about') return 'about';
  if (pathname === '/contacts') return 'contacts';
  return null;
}

export default function RoomButton() {
  const { pathname, query } = useRouter();
  const [visited, setVisited] = useState(false);

  useEffect(() => {
    try {
      setVisited(window.sessionStorage.getItem(ROOM_VISITED_KEY) === '1');
    } catch {
      // Storage can be blocked (private windows); the button still works
    }
  }, [pathname]);

  const spot = spotFor(pathname, query.music === '1');
  // From the plain projects page, go straight to the projects page in the room
  const href = spot === 'projects' ? '/diorama/projects' : spot ? `/diorama?at=${spot}` : '/diorama';

  return (
    <Link href={href} className="room-button">
      <span className="room-button-lamp" aria-hidden="true" />
      {visited ? 'Back to the room' : 'See the room'}
    </Link>
  );
}
