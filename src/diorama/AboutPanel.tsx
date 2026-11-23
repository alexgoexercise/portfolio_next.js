import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { education, experience, researchProjects, summary, type ResumeEntry } from '../content/resume';
import { skills } from '../content/skills';
import { paperDom } from './paperDom';
import paper from './Paper.module.css';
import styles from './ProjectsPanel.module.css';

function Entries({ entries }: { entries: ResumeEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <div key={entry.title} className={styles.entry}>
          <h2 className={styles.entryTitle}>{entry.title}</h2>
          <p className={styles.entryMeta}>{[entry.subtitle, entry.dates].filter(Boolean).join(' · ')}</p>
          <ul className={styles.list}>
            {entry.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

interface Page {
  section: string;
  body: ReactNode;
}

/**
 * The resume as sheets. Every sheet has to fit without scrolling, so a section
 * that is too long for one (Experience) is split over two.
 */
const PAGES: Page[] = [
  {
    section: 'Summary',
    body: (
      <>
        <p className={styles.count}>Singapore</p>
        <h1 className={styles.title}>Alex Zhao Lixiuqi 赵李修齐</h1>
        <p>{summary}</p>
      </>
    ),
  },
  { section: 'Education', body: <Entries entries={education} /> },
  { section: 'Experience', body: <Entries entries={experience.slice(0, 2)} /> },
  { section: 'Experience', body: <Entries entries={experience.slice(2)} /> },
  { section: 'Projects', body: <Entries entries={researchProjects} /> },
  {
    section: 'Skills',
    body: (
      <div className={styles.tags}>
        {[...skills]
          .sort((a, b) => b.level - a.level)
          .map((skill) => (
            <a
              key={skill.name}
              className={styles.tag}
              href={`https://www.google.com/search?q=${encodeURIComponent(skill.name)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {skill.name}
            </a>
          ))}
      </div>
    ),
  },
];

const SECTIONS = PAGES.map((p) => p.section).filter((name, i, all) => all.indexOf(name) === i);
const SWAP_MS = 320; // how long the old sheet takes to slide down into the folder

/** The resume, in a folder: tabs along the top, one sheet drawn up at a time. */
export default function AboutPanel() {
  const router = useRouter();
  const [wanted, setWanted] = useState(0);
  const [shown, setShown] = useState(0);

  // Changing sheet: the old one slides into the folder, then the new one is drawn up
  useEffect(() => {
    paperDom.tabCount = SECTIONS.length;
    paperDom.activeTab = SECTIONS.indexOf(PAGES[wanted].section);
    if (wanted === shown) {
      paperDom.up = true;
      return;
    }
    paperDom.up = false;
    const timer = setTimeout(() => setShown(wanted), SWAP_MS);
    return () => clearTimeout(timer);
  }, [wanted, shown]);

  const go = useCallback((index: number) => setWanted(Math.max(0, Math.min(PAGES.length - 1, index))), []);
  const goToSection = (name: string) => go(PAGES.findIndex((p) => p.section === name));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') go(wanted + 1);
      else if (e.key === 'ArrowLeft') go(wanted - 1);
      else if (e.key === 'Escape') void router.push('/diorama');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wanted, go, router]);

  const page = PAGES[shown];
  const sectionPages = PAGES.filter((p) => p.section === PAGES[wanted].section);
  const within = sectionPages.indexOf(PAGES[wanted]) + 1;

  return (
    <>
      <div className={paper.tabs} role="tablist" aria-label="Resume sections">
        {SECTIONS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            className={paper.tabButton}
            aria-selected={name === PAGES[wanted].section}
            onClick={() => goToSection(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className={paper.sheet} aria-live="polite">
        <div className={styles.text}>{page.body}</div>
      </div>

      <div className={paper.front}>
        <Link href="/diorama" className={paper.frontLink}>
          ← The room
        </Link>
        <div className={paper.pager}>
          <button type="button" className={paper.frontButton} onClick={() => go(wanted - 1)} disabled={wanted === 0}>
            ‹
          </button>
          <span>
            {PAGES[wanted].section}
            {sectionPages.length > 1 ? ` ${within}/${sectionPages.length}` : ''}
          </span>
          <button
            type="button"
            className={paper.frontButton}
            onClick={() => go(wanted + 1)}
            disabled={wanted === PAGES.length - 1}
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}
