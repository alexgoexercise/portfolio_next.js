import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLang, useT } from '@/i18n';
import { localBand, localShort } from '@/i18n/content';
import { chosenBand, journeyBands } from './musicView';
import { musicPlayer } from './musicPlayer';
import base from './ProjectsPanel.module.css';
import styles from './MusicPanel.module.css';

/**
 * The music page as a record player. Each band is a record: its cover is the
 * label, and the disc spins while it "plays". Tap the card to open the band's
 * full story and the shows Alex played. The chosen band lives in the address
 * (?band=2), so it can be linked to and the back button works.
 */
export default function MusicPanel() {
  const router = useRouter();
  const id = chosenBand(router.query.band);
  const index = journeyBands.findIndex((b) => b.id === id);
  const { lang } = useLang();
  const t = useT();
  const { band: original, short: shortEn, track } = journeyBands[index];
  const band = localBand(original, lang);
  const short = localShort(id, shortEn, lang);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [time, setTime] = useState({ at: 0, length: 0 });
  const audio = useRef<HTMLAudioElement | null>(null);
  const stepRef = useRef<(by: number) => void>(() => {});
  const swipe = useRef(0);

  // One audio element for the page: it follows the band, and the record spins only while it plays
  useEffect(() => {
    const el = new Audio();
    el.preload = 'metadata';
    audio.current = el;
    const sync = () => {
      musicPlayer.spinning = !el.paused;
      setSpinning(!el.paused);
    };
    el.addEventListener('play', sync);
    el.addEventListener('pause', sync);
    el.addEventListener('timeupdate', () => setTime({ at: el.currentTime, length: el.duration || 0 }));
    el.addEventListener('ended', () => stepRef.current(1));
    return () => {
      el.pause();
      el.removeAttribute('src');
      musicPlayer.spinning = false;
    };
  }, []);

  // A new band loads its song and plays it (the browser may refuse before the first tap; then it waits)
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.src = track.src;
    setTime({ at: 0, length: 0 });
    el.play().catch(() => {});
  }, [track.src]);

  const toggle = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }, []);

  const choose = useCallback(
    (next: string) => {
      void router.replace({ pathname: '/diorama/music', query: { band: next } }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router],
  );
  const step = useCallback(
    (by: number) => choose(journeyBands[(index + by + journeyBands.length) % journeyBands.length].id),
    [index, choose],
  );
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowUp') setOpen(false);
      else if (e.key === 'ArrowDown') setOpen(true);
      else if (e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape') {
        if (open) setOpen(false);
        else void router.push('/diorama');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, router, open, toggle]);

  return (
    <div className={base.layer}>
      <aside className={`${base.panel} ${styles.panel}`} aria-label={t('Music journey', '音乐之旅')} data-open={open}>
        <div className={base.bar}>
          <Link href="/diorama" className={base.back}>
            {t('← The room', '← 返回房间')}
          </Link>
          <span>
            {index + 1} / {journeyBands.length}
          </span>
        </div>

        <div
          className={styles.carousel}
          role="tablist"
          aria-label={t('Choose a band', '选择乐队')}
          onTouchStart={(e) => {
            swipe.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - swipe.current;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
          }}
        >
          {journeyBands.map((b, i) => {
            // Shortest way round the loop, so the chosen cover is always in the middle and both sides mirror each other
            const n = journeyBands.length;
            let d = (i - index + n) % n;
            if (d > n / 2) d -= n;
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={d === 0}
                aria-label={b.short}
                tabIndex={d === 0 ? 0 : -1}
                className={styles.slide}
                data-d={Math.abs(d) > 2 ? 'far' : d}
                style={{ '--d': d } as CSSProperties}
                onClick={() => choose(b.id)}
              >
                <Image src={b.band.image} alt="" fill sizes="260px" style={{ objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>

        <div className={styles.player}>
          <div className={styles.head}>
            <h1 className={styles.title}>{band.name}</h1>
            <p className={styles.period}>
              {band.period} · {band.tags.join(' · ')}
            </p>
          </div>
          <div className={styles.progress}>
          <p className={styles.now}>
            ♪ {track.title}
            {track.artist ? ` · ${track.artist}` : ''}
          </p>
          <input
            type="range"
            className={styles.seek}
            min={0}
            max={Math.max(1, Math.floor(time.length))}
            value={Math.floor(time.at)}
            aria-label={t('Seek', '拖动进度')}
            onChange={(e) => {
              if (audio.current) audio.current.currentTime = Number(e.target.value);
            }}
          />
          <div className={styles.times}>
            <span>{clock(time.at)}</span>
            <span>{clock(time.length)}</span>
          </div>
          </div>
          <div className={styles.controls}>
            <button type="button" onClick={() => step(-1)} aria-label={t('Previous band', '上一个乐队')}>
              ⏮
            </button>
            <button
              type="button"
              className={styles.play}
              onClick={toggle}
              aria-label={spinning ? t('Pause', '暂停') : t('Play', '播放')}
            >
              {spinning ? '⏸' : '▶'}
            </button>
            <button type="button" onClick={() => step(1)} aria-label={t('Next band', '下一个乐队')}>
              ⏭
            </button>
          </div>
          <button type="button" className={styles.expand} onClick={() => setOpen((o) => !o)}>
            {open ? t('Close the story ⌃', '收起故事 ⌃') : t('Open the full story ⌄', '展开完整故事 ⌄')}
          </button>
        </div>

        {open && (
          <div className={styles.story}>
            <p className={styles.role}>{band.role}</p>
            <div className={base.text}>
              {band.description.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph.trim()}</p>
              ))}
            </div>

            {band.externalUrl && (
              <a href={band.externalUrl} target="_blank" rel="noopener noreferrer" className={base.open}>
                {band.clickNotice ?? t('Open', '打开')} ↗
              </a>
            )}

            <h2 className={styles.heading}>{t(`Shows with ${short}`, `${short}的演出`)}</h2>
            <ol className={styles.shows}>
              {band.performances.map((show) => (
                <li key={`${show.date}-${show.title}`} className={styles.show}>
                  <p className={styles.showMeta}>
                    {show.date} · {show.venue}
                  </p>
                  <h3 className={styles.showTitle}>{show.title}</h3>
                  <p className={styles.showText}>{show.description}</p>
                  {show.video && (
                    <a href={show.video} target="_blank" rel="noopener noreferrer" className={styles.watch}>
                      {t('▶ Watch the video', '▶ 观看视频')}
                    </a>
                  )}
                  {show.images.length > 0 && (
                    <div className={styles.pictures} data-count={Math.min(show.images.length, 5)}>
                      {show.images.map((picture, at) => {
                        // One ▶ per video: only the first picture that points at a link is clickable
                        const first = !!picture.url && show.images.findIndex((p) => p.url === picture.url) === at;
                        const image = (
                          <Image src={picture.src} alt="" fill sizes="(min-width: 1100px) 640px, 92vw" style={{ objectFit: 'cover' }} />
                        );
                        return first ? (
                          <a
                            key={picture.src}
                            href={picture.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.picture}
                            aria-label={t(`Watch ${show.title}`, `观看 ${show.title}`)}
                          >
                            {image}
                            <span className={styles.playTag} aria-hidden="true">
                              ▶
                            </span>
                          </a>
                        ) : (
                          <span key={picture.src} className={styles.picture}>
                            {image}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className={base.hint}>{t('← → band · space play/pause · ↓ story · Esc back', '← → 切换乐队 · 空格 播放/暂停 · ↓ 故事 · Esc 返回')}</p>
      </aside>
    </div>
  );
}

function clock(seconds: number) {
  const s = Math.floor(seconds || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
