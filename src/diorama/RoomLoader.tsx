import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import styles from './RoomLoader.module.css';

/**
 * Shows how much of the room has arrived. The first time, it is a full-screen
 * "waking the room" card with a bar; afterwards (a new model or texture coming
 * in) it is just a thin bar along the top. It follows the real download
 * progress of every model and texture the scene asks for.
 */
export default function RoomLoader() {
  const t = useT();
  const { active, progress, total } = useProgress();
  const [firstDone, setFirstDone] = useState(false);
  const [gone, setGone] = useState(false);
  const [shown, setShown] = useState(0);

  // The bar eases toward the real number so it never jumps backwards when more files are queued
  useEffect(() => {
    setShown((s) => Math.max(s, progress));
  }, [progress]);

  // Ready once something has loaded and nothing more is pending; give up waiting after a while, so a cached
  // room (which loads nothing) never leaves the card up
  useEffect(() => {
    if (total > 0 && !active) {
      const t = setTimeout(() => setFirstDone(true), 250);
      return () => clearTimeout(t);
    }
  }, [total, active]);
  useEffect(() => {
    const t = setTimeout(() => setFirstDone(true), 15000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!firstDone) return;
    const t = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(t);
  }, [firstDone]);

  return (
    <>
      {!gone && (
        <div className={styles.curtain} data-done={firstDone} role="status" aria-live="polite">
          <p className={styles.line}>{t('Waking up the room…', '正在叫醒房间…')}</p>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${firstDone ? 100 : Math.max(shown, 6)}%` }} />
          </div>
          <p className={styles.percent}>{firstDone ? 100 : Math.round(shown)}%</p>
        </div>
      )}
      {gone && active && (
        <div className={styles.thin} role="status" aria-label={t('Loading', '加载中')}>
          <div className={styles.thinFill} style={{ width: `${Math.max(progress, 8)}%` }} />
        </div>
      )}
    </>
  );
}
