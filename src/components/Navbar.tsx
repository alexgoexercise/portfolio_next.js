import Link from 'next/link';
import { useRouter } from 'next/router';

const LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/contacts', label: 'Contacts' },
];

export default function Navbar() {
  const { pathname } = useRouter();
  // Band pages belong to Projects
  const current = pathname.startsWith('/band') ? '/projects' : pathname;

  return (
    <nav className="site-nav" aria-label="Main">
      <Link href="/" className="brand" aria-label="alexgosleep: back to the start">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-text">alexgosleep</span>
      </Link>
      <div className="nav-links">
        {LINKS.map(({ href, label }) => (
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
    </nav>
  );
}
