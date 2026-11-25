import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useLang, useT } from '@/i18n';
import { localHotspot } from '@/i18n/content';
import type { Hotspot } from './hotspots';
import type { ViewName } from './sceneConfig';
import styles from './Hud.module.css';

interface HudProps {
  /** Wake-up meter, 0 (silent) to 1 (he wakes). */
  noise: number;
  awake: boolean;
  muted: boolean;
  hovered: Hotspot | null;
  selected: Hotspot | null;
  onToggleMute: () => void;
  onCloseCard: () => void;
  onLetSleep: () => void;
  /** Glide the camera to a preset view. */
  onView: (name: ViewName) => void;
  /** Show nothing but the loading message: the projects page brings its own panel. */
  minimal?: boolean;
  /** Behind the kit: shows a hint that the drums can be hit. */
  drumming?: boolean;
  /** Whether the key caps over the drums are showing, and how to switch them. */
  keyHints?: boolean;
  onToggleKeyHints?: () => void;
}

function statusText(noise: number, awake: boolean, t: (en: string, zh: string) => string) {
  if (awake) return t('Awake', '醒了');
  if (noise > 0.66) return t('Stirring', '又翻了个身');
  if (noise > 0.3) return t('Restless', '翻了个身');
  return t('Fast asleep', '睡得很香');
}

/** Everything drawn on top of the 3D room. */
export default function Hud({
  noise,
  awake,
  muted,
  hovered: hoveredIn,
  selected: selectedIn,
  onToggleMute,
  onCloseCard,
  onLetSleep,
  onView,
  minimal = false,
  drumming = false,
  keyHints = true,
  onToggleKeyHints,
}: HudProps) {
  const { active, progress } = useProgress();
  const { lang } = useLang();
  const t = useT();
  const hovered = hoveredIn && localHotspot(hoveredIn, lang);
  const selected = selectedIn && localHotspot(selectedIn, lang);
  const [viewsOpen, setViewsOpen] = useState(false);
  // Sitting behind the kit opens the view bar, so the way back out is in sight
  useEffect(() => {
    if (drumming) setViewsOpen(true);
  }, [drumming]);
  const percent = Math.round(Math.min(1, noise) * 100);

  if (active) {
    return (
      <div className={styles.hud}>
        <div className={styles.loading}>{t('Loading the room…', '正在加载房间…')} {Math.round(progress)}%</div>
      </div>
    );
  }

  if (minimal) return <div className={styles.hud} />;

  return (
    <div className={styles.hud}>
      {drumming && <div className={styles.drumHint}>{t('Click the drums, or play them with the keys. Not too loud…', '点一点鼓，或者用键盘来演奏，别太大声……')}</div>}
      <section
        className={`${styles.panel} ${styles.meter}`}
        data-compact={drumming || undefined}
        aria-label={t('Wake-up meter', '唤醒指数')}
      >
        <div className={styles.meterHead}>
          <span>{t('Noise', '噪音等级')}</span>
          <span className={awake ? styles.statusAwake : styles.status}>{statusText(noise, awake, t)}</span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t('How close Alex is to waking up', '修齐怒气值')}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <p className={styles.hint}>
          {awake
            ? t('Too loud. Alex is up now, and he is looking at you in confusion.', '修齐醒了，一脸懵逼地看着你。')
            : t(
                'Alex is asleep. You can click around the room, but every sound brings him closer to waking.',
                '在房间随便点点是可以的，只要别把修齐吵醒就行',
              )}
        </p>
        <button type="button" className={styles.mute} onClick={onToggleMute}>
          {t('Sound', '声音')}{t(': ', '：')}{muted ? t('off', '关') : t('on', '开')}
        </button>
      </section>

      <section className={styles.views} aria-label={t('Camera', '视角')}>
        <button
          type="button"
          className={styles.viewsToggle}
          aria-expanded={viewsOpen}
          aria-controls="camera-views"
          aria-label={t('Camera views', '视角切换')}
          title={t('Camera views', '视角切换')}
          onClick={() => setViewsOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        {viewsOpen && (
          <div id="camera-views" className={`${styles.panel} ${styles.viewsList}`}>
            <button type="button" className={styles.viewButton} onClick={() => onView('overview')}>
              {t('Overview', '全景')}
            </button>
            <button type="button" className={styles.viewButton} onClick={() => onView('drummer')}>
              {t("Drummer's view", '鼓手视角')}
            </button>
            <p className={styles.viewHint}>{t('Drag to turn · Shift-drag or W A S D to move', '拖动转向 · 按住 Shift 拖动或用 W A S D 移动')}</p>
          </div>
        )}
      </section>

      {drumming && onToggleKeyHints && (
        <button
          type="button"
          className={styles.hintsToggle}
          aria-pressed={keyHints}
          aria-label={keyHints ? t('Hide the key hints', '隐藏按键提示') : t('Show the key hints', '显示按键提示')}
          title={keyHints ? t('Hide the key hints', '隐藏按键提示') : t('Show the key hints', '显示按键提示')}
          onClick={onToggleKeyHints}
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2.5" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
            {!keyHints && <line x1="3" y1="3" x2="21" y2="21" />}
          </svg>
        </button>
      )}

      {awake && (
        <section className={`${styles.panel} ${styles.banner}`} role="status">
          <p className={styles.bannerTitle}>{t('You woke Alex.', '你把修齐吵醒了。')}</p>
          <p className={styles.bannerText}>{t('Alex was having a really good dream.', '修齐刚才正做着一个美梦呢。')}</p>
          <button type="button" className={styles.sleepButton} onClick={onLetSleep}>
            {t('Sorry. Please go back to sleep', '对不起，请继续睡吧')}
          </button>
        </section>
      )}

      {selected ? (
        <section className={`${styles.panel} ${styles.card}`}>
          <button type="button" className={styles.close} onClick={onCloseCard} aria-label={t('Close', '关闭')}>
            ×
          </button>
          <h2 className={styles.cardTitle}>{selected.label}</h2>
          <p className={styles.cardText}>{selected.blurb}</p>
          <div className={styles.cardActions}>
            {selected.href && (
              <Link href={selected.href} className={styles.cardLink}>
                {selected.cta ?? t('Open', '打开')} →
              </Link>
            )}
            {selected.view && (
              <button
                type="button"
                className={styles.cardSecondary}
                onClick={() => {
                  onView(selected.view!.name);
                  onCloseCard();
                }}
              >
                {selected.view.label}
              </button>
            )}
          </div>
        </section>
      ) : (
        hovered && <div className={`${styles.panel} ${styles.hoverLabel}`}>{hovered.label}</div>
      )}
    </div>
  );
}
