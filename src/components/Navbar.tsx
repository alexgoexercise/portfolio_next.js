import Link from 'next/link';
import { useRouter } from 'next/router';

const PLAIN = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/contacts', label: 'Contacts' },
];

const ROOM = [
  { href: '/diorama', label: 'Room' },
  { href: '/diorama/about', label: 'About' },
  { href: '/diorama/projects', label: 'Projects' },
  { href: '/diorama/music', label: 'Music' },
  { href: '/diorama/contacts', label: 'Contacts' },
];

/** The same place in the other version of the site, so switching keeps you where you were. */
export function otherSide(pathname: string, music: boolean) {
  if (pathname.startsWith('/diorama')) {
    if (pathname === '/diorama/about') return '/about';
    if (pathname === '/diorama/projects') return '/projects';
    if (pathname === '/diorama/music') return '/projects?music=1';
    if (pathname === '/diorama/contacts') return '/contacts';
    return '/home';
  }
  if (pathname.startsWith('/band')) return '/diorama/music';
  if (pathname === '/projects') return music ? '/diorama/music' : '/diorama/projects';
  if (pathname === '/about') return '/diorama/about';
  if (pathname === '/contacts') return '/diorama/contacts';
  return '/diorama';
}

/**
 * The bar on every page except the landing page. Its links stay inside the
 * version you are in (the room or the plain site); the switch on the right
 * jumps to the same page in the other one, and the brand goes back to the
 * landing page where you can choose again.
 */
export default function Navbar() {
  const { pathname, query } = useRouter();
  const inRoom = pathname.startsWith('/diorama');
  const links = inRoom ? ROOM : PLAIN;
  // Band pages belong to Projects
  const current = pathname.startsWith('/band') ? '/projects' : pathname;
  const other = otherSide(pathname, query.music === '1');

  return (
    <nav className="site-nav" aria-label="Main" data-mode={inRoom ? 'room' : 'plain'}>
      <Link href="/" className="brand" aria-label="alexgosleep: back to the start" title="Back to the start">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-text">alexgosleep</span>
      </Link>
      <div className="nav-links">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={current === href ? 'nav-link active' : 'nav-link'}
            aria-current={current === href ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mode-switch" role="group" aria-label="Version of the site">
        <Link href={inRoom ? pathname : other} className="mode-option" aria-current={inRoom ? 'true' : undefined}>
          Room
        </Link>
        <Link href={inRoom ? other : pathname} className="mode-option" aria-current={inRoom ? undefined : 'true'}>
          Plain
        </Link>
      </div>
    </nav>
  );
}
