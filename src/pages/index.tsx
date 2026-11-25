import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useT } from '@/i18n';
import LangSwitch from '@/components/LangSwitch';

/** A slowly twinkling night sky, drawn on a canvas so it costs almost nothing. */
function Stars() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext('2d');
    if (!el || !g) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    let w = 0;
    let h = 0;
    let frame = 0;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((w * h) / 5500) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 1.4 + 0.4,
      }));
    };
    const draw = (t: number) => {
      g.clearRect(0, 0, w, h);
      for (const star of stars) {
        const a = still ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * star.s + star.p));
        g.fillStyle = `rgba(255, 240, 215, ${a})`;
        g.beginPath();
        g.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        g.fill();
      }
      if (!still) frame = requestAnimationFrame(draw);
    };
    size();
    draw(0);
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={canvas} className="landing-stars" aria-hidden="true" />;
}

/**
 * The front door: a night sky with the room floating in it. The room is one
 * way in (click it, or the lit button); the plain site is the other. Every
 * page links back here, so you can always choose again.
 */
export default function Landing() {
  const router = useRouter();
  const t = useT();
  const root = useRef<HTMLElement>(null);
  const [leaving, setLeaving] = useState<'room' | 'plain' | null>(null);

  // The room and the sky lean a little toward the pointer
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = root.current;
    if (!el) return;
    el.style.setProperty('--mx', String((e.clientX / window.innerWidth - 0.5) * 2));
    el.style.setProperty('--my', String((e.clientY / window.innerHeight - 0.5) * 2));
  };

  const go = useCallback(
    (to: 'room' | 'plain') => (e: React.MouseEvent) => {
      // Let modified clicks (new tab) behave normally
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      setLeaving(to);
      window.setTimeout(() => void router.push(to === 'room' ? '/diorama' : '/home'), to === 'room' ? 650 : 320);
    },
    [router],
  );

  useEffect(() => {
    void router.prefetch('/diorama');
    void router.prefetch('/home');
  }, [router]);

  return (
    <main className="landing" ref={root} onPointerMove={onMove} data-leaving={leaving ?? undefined}>
      <Stars />
      <LangSwitch className="landing-lang" />
      <div className="landing-sun" aria-hidden="true" />
      <div className="landing-inner">
        <div className="landing-copy">
          <p className="landing-eyebrow">{t('Zhao Lixiuqi · 赵李修齐 · Singapore', '赵李修齐 · Zhao Lixiuqi · 新加坡')}</p>
          <h1 className="landing-title">alexgo<br />sleep</h1>
          <div className="landing-stripes" aria-hidden="true" />
          <p className="landing-lede">
            {t(
              "Hi, I'm Alex: computer engineer, robot builder and drummer. This is where I keep my work. Choose how you want to meet it.",
              '嗨，我是修齐，我平时写写代码打打鼓。',
            )}
          </p>
          <div className="landing-doors">
            <Link href="/diorama" className="door door-room" onClick={go('room')}>
              <span className="door-lamp" aria-hidden="true" />
              {t('Enter the room', '进入房间')}
            </Link>
            <Link href="/home" className="door door-plain" onClick={go('plain')}>
              {t('Read the plain site →', '看文字版网站 →')}
            </Link>
          </div>
          <p className="landing-hint">{t('The room is a 3D bedroom. Try not to wake Alex up.', '房间是个 3D 卧室，小心别把修齐吵醒。')}</p>
        </div>

        <Link href="/diorama" className="landing-room" onClick={go('room')} aria-label={t('Enter the room', '进入房间')}>
          <div className="landing-room-tilt">
            <Image
              src="/room-preview.jpg"
              alt={t('A small bedroom at night with a drum kit, a desk and a sleeping Alex', '夜晚的小卧室，里面有一套架子鼓、一张书桌，和一个正在睡觉的修齐')}
              width={1400}
              height={1050}
              priority
            />
            <div className="landing-zzz" aria-hidden="true">
              <span>z</span>
              <span>Z</span>
              <span>z</span>
            </div>
          </div>
        </Link>
      </div>
      <p className="landing-foot">{t('Made by Alex, who should have been asleep hours ago.', '修齐做的——他几个小时前就该睡了。')}</p>
    </main>
  );
}
