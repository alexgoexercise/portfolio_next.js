import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const { band, short, track } = journeyBands[index];
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [time, setTime] = useState({ at: 0, length: 0 });
  const audio = useRef<HTMLAudioElement | null>(null);
  const stepRef = useRef<(by: number) => void>(() => {});

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
      <aside className={`${base.panel} ${styles.panel}`} aria-label="Music journey" data-open={open}>
        <div className={base.bar}>
          <Link href="/diorama" className={base.back}>
            ← The room
          </Link>
          <span>
            {index + 1} / {journeyBands.length}
          </span>
        </div>

        <div className={open ? styles.mini : styles.player}>
          <div className={styles.head}>
            <h1 className={open ? styles.miniTitle : styles.title}>{band.name}</h1>
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
            aria-label="Seek"
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
            <button type="button" onClick={() => step(-1)} aria-label="Previous band">
              ⏮
            </button>
            <button
              type="button"
              className={styles.play}
              onClick={toggle}
              aria-label={spinning ? 'Pause' : 'Play'}
            >
              {spinning ? '⏸' : '▶'}
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next band">
              ⏭
            </button>
          </div>
          <button type="button" className={styles.expand} onClick={() => setOpen((o) => !o)}>
            {open ? 'Close the story ⌃' : 'Open the full story ⌄'}
          </button>
        </div>

        <div className={styles.shelf} role="tablist" aria-label="Choose a band">
          {journeyBands.map((b) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={b.id === id}
              aria-label={b.short}
              className={styles.cover}
              onClick={() => choose(b.id)}
            >
              <Image src={b.band.image} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
              <span>{b.short}</span>
            </button>
          ))}
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
                {band.clickNotice ?? 'Open'} ↗
              </a>
            )}

            <h2 className={styles.heading}>Shows with {short}</h2>
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
                      ▶ Watch the video
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
                            aria-label={`Watch ${show.title}`}
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

        <p className={base.hint}>← → band · space play/pause · ↓ story · Esc back</p>
      </aside>
    </div>
  );
}

function clock(seconds: number) {
  const s = Math.floor(seconds || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
