import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './ProjectsPanel.module.css';

/** The top line of every room panel: back to the room. Esc also goes back. */
export default function PanelBar() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void router.push('/diorama');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <div className={styles.bar}>
      <Link href="/diorama" className={styles.back}>
        ← The room
      </Link>
    </div>
  );
}
