import { useEffect, useRef, type ReactNode } from 'react';
import { paperDom, type StageDom } from './paperDom';
import styles from './Paper.module.css';

/** The HTML that rides on the floating folder. Position and size come from the 3D scene each frame. */
export default function PaperStage({
  children,
  dom = paperDom,
  rigClassName,
}: {
  children: ReactNode;
  /** Which floating thing this is for. */
  dom?: StageDom;
  /** Extra class for the rig, to restyle the ink and type. */
  rigClassName?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dom.container = container.current;
    dom.camera = camera.current;
    dom.rig = rig.current;
    return () => {
      dom.container = null;
      dom.camera = null;
      dom.rig = null;
    };
  }, [dom]);

  return (
    <div ref={container} className={styles.container}>
      <div ref={camera} className={styles.camera}>
        <div ref={rig} className={rigClassName ? `${styles.rig} ${rigClassName}` : styles.rig}>
          {children}
        </div>
      </div>
    </div>
  );
}
