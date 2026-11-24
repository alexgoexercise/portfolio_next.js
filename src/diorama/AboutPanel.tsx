import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { ResumeEntry } from '../content/resume';
import { useT } from '@/i18n';
import { useResume } from '@/i18n/content';
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
  /** Stable name of the section this sheet belongs to. */
  section: string;
  body: ReactNode;
}

const SECTION_LABELS: Record<string, [string, string]> = {
  summary: ['Summary', '简介'],
  education: ['Education', '教育'],
  experience: ['Experience', '经历'],
  projects: ['Projects', '项目'],
  skills: ['Skills', '技能'],
};

const SWAP_MS = 320; // how long the old sheet takes to slide down into the folder

/** The resume, in a folder: tabs along the top, one sheet drawn up at a time. */
export default function AboutPanel() {
  const router = useRouter();
  const t = useT();
  const resume = useResume();

  /**
   * The resume as sheets. Every sheet has to fit without scrolling, so a section
   * that is too long for one (Experience) is split over two.
   */
  const PAGES: Page[] = useMemo(
    () => [
      {
        section: 'summary',
        body: (
          <>
            <p className={styles.count}>{t('Singapore', '新加坡')}</p>
            <h1 className={styles.title}>{t('Alex Zhao Lixiuqi 赵李修齐', '赵李修齐 Alex Zhao')}</h1>
            <p>{resume.summary}</p>
          </>
        ),
      },
      { section: 'education', body: <Entries entries={resume.education} /> },
      { section: 'experience', body: <Entries entries={resume.experience.slice(0, 2)} /> },
      { section: 'experience', body: <Entries entries={resume.experience.slice(2)} /> },
      { section: 'projects', body: <Entries entries={resume.researchProjects} /> },
      {
        section: 'skills',
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resume],
  );
  const SECTIONS = useMemo(() => PAGES.map((p) => p.section).filter((name, i, all) => all.indexOf(name) === i), [PAGES]);
  const label = (name: string) => t(...SECTION_LABELS[name]);

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
  }, [wanted, shown, PAGES, SECTIONS]);

  const go = useCallback((index: number) => setWanted(Math.max(0, Math.min(PAGES.length - 1, index))), [PAGES.length]);
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
      <div className={paper.tabs} role="tablist" aria-label={t('Resume sections', '简历分区')}>
        {SECTIONS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            className={paper.tabButton}
            aria-selected={name === PAGES[wanted].section}
            onClick={() => goToSection(name)}
          >
            {label(name)}
          </button>
        ))}
      </div>

      <div className={paper.sheet} aria-live="polite">
        <div className={styles.text}>{page.body}</div>
      </div>

      <div className={paper.front}>
        <Link href="/diorama" className={paper.frontLink}>
          {t('← The room', '← 返回房间')}
        </Link>
        <div className={paper.pager}>
          <button type="button" className={paper.frontButton} onClick={() => go(wanted - 1)} disabled={wanted === 0}>
            ‹
          </button>
          <span>
            {label(PAGES[wanted].section)}
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
