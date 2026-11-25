import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';

const SRC = '/music/ambient-nu-pogodi.mp3';
/** The file is already mixed quiet and washed in reverb; this is the ceiling for the element. */
const LEVEL = 1;
const FADE_MS = 1600;

/**
 * A distant, hazy song that plays under the 3D room only (not the landing page, the plain site, or the
 * music page, where each band has its own song). It fades in and out as you move around, starts on
 * the first tap or key press when the browser blocks autoplay, and can be muted.
 */
export default function BackgroundMusic() {
  const { pathname } = useRouter();
  const t = useT();
  // Only the 3D room has it; the landing page, the plain site and the music page (its own songs) stay silent
  const quiet = !pathname.startsWith('/diorama') || pathname === '/diorama/music';
  const audio = useRef<HTMLAudioElement | null>(null);
  const fade = useRef<number | null>(null);
  const want = useRef(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const fadeTo = (target: number) => {
    const el = audio.current;
    if (!el) return;
    if (fade.current) cancelAnimationFrame(fade.current);
    const from = el.volume;
    const start = performance.now();
    const tick = (now: number) => {
      // rAF timestamps can be a hair earlier than performance.now(), so clamp both ends
      const k = Math.max(0, Math.min(1, (now - start) / FADE_MS));
      el.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k < 1) fade.current = requestAnimationFrame(tick);
      else if (target === 0) el.pause();
    };
    fade.current = requestAnimationFrame(tick);
  };

  const sync = () => {
    const el = audio.current;
    if (!el) return;
    if (want.current && !mutedRef.current) {
      void el.play().then(() => fadeTo(LEVEL)).catch(() => {});
    } else {
      fadeTo(0);
    }
  };

  useEffect(() => {
    try {
      mutedRef.current = localStorage.getItem('bgMusicMuted') === '1';
      setMuted(mutedRef.current);
    } catch {}
    const el = new Audio(SRC);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    audio.current = el;
    // Browsers refuse sound before a gesture, so the first one starts it
    const unlock = () => sync();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (fade.current) cancelAnimationFrame(fade.current);
      el.pause();
      el.removeAttribute('src');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    want.current = !quiet;
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiet, muted]);

  if (quiet) return null;
  return (
    <button
      type="button"
      className="bg-music"
      data-muted={muted || undefined}
      aria-label={muted ? t('Turn the background music on', '打开背景音乐') : t('Turn the background music off', '关闭背景音乐')}
      title={muted ? t('Music on', '打开音乐') : t('Music off', '关闭音乐')}
      onClick={() => {
        const next = !mutedRef.current;
        mutedRef.current = next;
        setMuted(next);
        try {
          localStorage.setItem('bgMusicMuted', next ? '1' : '0');
        } catch {}
      }}
    >
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
        {muted && <line x1="2" y1="2" x2="22" y2="22" />}
      </svg>
    </button>
  );
}
