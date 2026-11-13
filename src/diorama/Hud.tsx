import Link from 'next/link';
import { useProgress } from '@react-three/drei';
import type { Hotspot } from './hotspots';
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
}

function statusText(noise: number, awake: boolean) {
  if (awake) return 'Awake';
  if (noise > 0.66) return 'Stirring';
  if (noise > 0.3) return 'Restless';
  return 'Fast asleep';
}

/** Everything drawn on top of the 3D room. */
export default function Hud({ noise, awake, muted, hovered, selected, onToggleMute, onCloseCard, onLetSleep }: HudProps) {
  const { active, progress } = useProgress();
  const percent = Math.round(Math.min(1, noise) * 100);

  if (active) {
    return (
      <div className={styles.hud}>
        <div className={styles.loading}>Loading the room… {Math.round(progress)}%</div>
      </div>
    );
  }

  return (
    <div className={styles.hud}>
      <section className={`${styles.panel} ${styles.meter}`} aria-label="Wake-up meter">
        <div className={styles.meterHead}>
          <span>Noise</span>
          <span className={awake ? styles.statusAwake : styles.status}>{statusText(noise, awake)}</span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="How close Alex is to waking up"
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <p className={styles.hint}>
          {awake
            ? 'Too loud. He is up now, and he is looking at you.'
            : 'Alex is asleep. Click around the room, but every sound brings him closer to waking.'}
        </p>
        <button type="button" className={styles.mute} onClick={onToggleMute}>
          Sound: {muted ? 'off' : 'on'}
        </button>
      </section>

      {awake && (
        <section className={`${styles.panel} ${styles.banner}`} role="status">
          <p className={styles.bannerTitle}>You woke Alex.</p>
          <p className={styles.bannerText}>He was having a really good dream.</p>
          <button type="button" className={styles.sleepButton} onClick={onLetSleep}>
            Sorry. Go back to sleep
          </button>
        </section>
      )}

      {selected ? (
        <section className={`${styles.panel} ${styles.card}`}>
          <button type="button" className={styles.close} onClick={onCloseCard} aria-label="Close">
            ×
          </button>
          <h2 className={styles.cardTitle}>{selected.label}</h2>
          <p className={styles.cardText}>{selected.blurb}</p>
          {selected.href && (
            <Link href={selected.href} className={styles.cardLink}>
              {selected.cta ?? 'Open'} →
            </Link>
          )}
        </section>
      ) : (
        hovered && <div className={`${styles.panel} ${styles.hoverLabel}`}>{hovered.label}</div>
      )}
    </div>
  );
}
