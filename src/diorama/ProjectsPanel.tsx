import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useLang, useT } from '@/i18n';
import { localProject } from '@/i18n/content';
import { chosenSlug, roomProjects } from './projectsView';
import styles from './ProjectsPanel.module.css';

/**
 * The text half of the projects page, shown beside the 3D models: a list of
 * projects, and the details of the chosen one. The chosen project lives in the
 * address (?project=autoboat), so it can be linked to and the back button works.
 */
export default function ProjectsPanel() {
  const router = useRouter();
  const slug = chosenSlug(router.query.project);
  const index = roomProjects.findIndex((p) => p.slug === slug);
  const { lang } = useLang();
  const t = useT();
  const project = localProject(roomProjects[index].project, lang);
  const paragraphs = Array.isArray(project.description) ? project.description : [project.description];

  // Which of the project's pictures is showing; back to the first when the project changes
  const [shown, setShown] = useState({ slug, picture: 0 });
  const picture = shown.slug === slug ? shown.picture : 0;

  const choose = useCallback(
    (next: string) => {
      void router.replace({ pathname: '/diorama/projects', query: { project: next } }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router],
  );

  // Left and right arrows move between projects; Escape goes back to the room
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') choose(roomProjects[(index + 1) % roomProjects.length].slug);
      else if (e.key === 'ArrowLeft')
        choose(roomProjects[(index - 1 + roomProjects.length) % roomProjects.length].slug);
      else if (e.key === 'Escape') void router.push('/diorama');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, choose, router]);

  return (
    <div className={styles.layer}>
      <aside className={styles.panel} aria-label={t('Projects', '项目')}>
        <div className={styles.bar}>
          <Link href="/diorama" className={styles.back}>
            {t('← The room', '← 返回房间')}
          </Link>
        </div>

        <p className={styles.count}>
          {t(`Project ${index + 1} of ${roomProjects.length}`, `第 ${index + 1} 个项目，共 ${roomProjects.length} 个`)}
        </p>
        <h1 className={styles.title}>{project.title}</h1>

        <div className={styles.tabs} role="tablist" aria-label={t('Choose a project', '选择项目')}>
          {roomProjects.map((p) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={p.slug === slug}
              onClick={() => choose(p.slug)}
            >
              {p.project.title}
            </button>
          ))}
        </div>

        <div className={styles.text}>
          {paragraphs.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.open}>
            {project.clickNotice ?? t('Open', '打开')} ↗
          </a>
        )}

        {project.images.length > 0 && (
          <div className={styles.shots}>
            <div className={styles.shot}>
              <Image
                key={`${slug}-${picture}`}
                src={project.images[picture]}
                alt={t(`${project.title}, picture ${picture + 1} of ${project.images.length}`, `${project.title}，第 ${picture + 1} 张图，共 ${project.images.length} 张`)}
                fill
                sizes="(max-width: 760px) 100vw, 430px"
                className={styles.shotImage}
              />
            </div>
            {project.images.length > 1 && (
              <div className={styles.thumbs}>
                {project.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={styles.thumb}
                    aria-label={t(`Show picture ${i + 1}`, `查看第 ${i + 1} 张图`)}
                    aria-current={i === picture}
                    onClick={() => setShown({ slug, picture: i })}
                  >
                    <Image src={src} alt="" fill sizes="62px" style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className={styles.hint}>{t('← → to switch project · Esc for the room', '← → 切换项目 · Esc 返回房间')}</p>
      </aside>
    </div>
  );
}
