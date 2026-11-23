import { useEffect, useRef, type ReactNode } from 'react';
import { paperDom } from './paperDom';
import styles from './Paper.module.css';

/** The HTML that rides on the floating folder. Position and size come from the 3D scene each frame. */
export default function PaperStage({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);

  useEffect(() => {
    paperDom.container = container.current;
    paperDom.camera = camera.current;
    paperDom.rig = rig.current;
    return () => {
      paperDom.container = null;
      paperDom.camera = null;
      paperDom.rig = null;
    };
  }, []);

  return (
    <div ref={container} className={styles.container}>
      <div ref={camera} className={styles.camera}>
        <div ref={rig} className={styles.rig}>
          {children}
        </div>
      </div>
    </div>
  );
}
