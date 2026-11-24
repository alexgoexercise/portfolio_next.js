import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraCss, objectCss } from './cssMatrix';
import { paperDom } from './paperDom';
import { sceneConfig } from './sceneConfig';

const { book, pxPerMetre: K, delay, seconds, width: PAPER_W, maxHeight: PAPER_MAX_H } = sceneConfig.paper;

const ease = (t: number) => t * t * (3 - 2 * t);

// Layout of the folder, in CSS pixels (1 px is 1/K metres in the scene)
const MARGIN = 14; // folder edge to paper edge, left and right
const TAB = 34; // height of the tabs along the top
const GAP = 14; // between the tabs and the top of the paper
const LIP = 64; // the front flap, which holds the controls and hides the sheet sliding in
const NAV = 58;
const MAX_TABS = 8;

const COLORS = {
  back: '#c9a463',
  front: '#dcbc7e',
  tab: '#b08a45',
  tabOn: '#e6c783',
  edge: '#8a6a30',
  paper: '#efe3c8',
};

const slotPos = new THREE.Vector3();
const slotQuat = new THREE.Quaternion();
const euler = new THREE.Euler();
const localQuat = new THREE.Quaternion();
const bookPos = new THREE.Vector3(...book);
const bookQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const objectMatrix = new THREE.Matrix4();
const unit = new THREE.Vector3(1, 1, 1);
const scaleV = new THREE.Vector3();

type Flat = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

/**
 * A manila folder floating in front of the camera. It slides out of a book on
 * the shelf when `open` turns on and back into it when it turns off. A sheet
 * of paper is drawn up out of it, and the page's HTML (see PaperStage) is kept
 * glued to the folder while it moves.
 */
export default function PaperSheet({ open }: { open: boolean }) {
  const group = useRef<THREE.Group>(null);
  const back = useRef<Flat>(null);
  const sheet = useRef<Flat>(null);
  const lip = useRef<Flat>(null);
  const lipEdge = useRef<Flat>(null);
  const tabs = useRef<(Flat | null)[]>([]);
  const shadow = useRef<THREE.Mesh>(null);
  const dim = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);
  const progress = useRef(0);
  const waited = useRef(0);
  const drawn = useRef(0);
  // Where the folder last rested, so it can fly back from there even while the camera moves on
  const rest = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });

  // A soft vignette that darkens the room behind the folder, so the folder has the focus
  const dimTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 70, 10, 64, 64, 90);
    grad.addColorStop(0, 'rgba(6,5,12,0.45)');
    grad.addColorStop(1, 'rgba(6,5,12,0.88)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  const shadowTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 8, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const { camera, size } = state;
    const cam = camera as THREE.PerspectiveCamera;
    const rig = paperDom.rig;

    // Timing: wait for the camera to arrive, then slide; leaving starts at once
    if (open) waited.current += dt;
    else waited.current = 0;
    const going = open && waited.current > delay;
    progress.current = THREE.MathUtils.clamp(progress.current + (going ? dt : -dt) / seconds, 0, 1);
    const t = ease(progress.current);
    g.visible = progress.current > 0.001;
    if (dim.current) dim.current.visible = g.visible;
    if (!g.visible) {
      if (rig) rig.style.opacity = '0';
      return;
    }

    // Sizes, in pixels: a sheet that fits the screen, with the folder around it
    const paperW = Math.min(PAPER_W, size.width - 40);
    const paperH = THREE.MathUtils.clamp(size.height - NAV - 40 - TAB - GAP, 340, PAPER_MAX_H);
    const folderW = paperW + 2 * MARGIN;
    const folderH = TAB + GAP + paperH;
    const cx = size.width / 2;
    const cy = NAV + (size.height - NAV) / 2 + 4;

    // The sheet is drawn up out of the folder when the page wants it, and slides back in while it swaps
    const wantUp = open && progress.current > 0.97 && paperDom.up;
    drawn.current = THREE.MathUtils.clamp(drawn.current + (wantUp ? dt : -dt) / 0.38, 0, 1);
    const down = (1 - ease(drawn.current)) * (paperH - LIP + 6);
    const hidden = Math.min(paperH, down + LIP);

    // Where the folder rests: in front of the camera, at the distance that makes it 1:1 with the screen
    if (open) {
      const depth = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / K;
      slotPos.set((cx - size.width / 2) / K, -(cy - size.height / 2) / K, -depth).applyMatrix4(cam.matrixWorld);
      // A little turned and tilted, so it reads as a thing in the air
      const bob = Math.sin(state.clock.elapsedTime * 0.9);
      euler.set(0.07 + bob * 0.01, -0.05, bob * 0.006);
      localQuat.setFromEuler(euler);
      slotQuat.copy(cam.quaternion).multiply(localQuat);
      slotPos.y += bob * 0.004;
      rest.current.pos.copy(slotPos);
      rest.current.quat.copy(slotQuat);
    }

    // Between the book and the resting place: along an arc, unfolding as it goes
    pos.lerpVectors(bookPos, rest.current.pos, t);
    pos.y += Math.sin(Math.PI * t) * 0.35;
    quat.slerpQuaternions(bookQuat, rest.current.quat, THREE.MathUtils.smoothstep(t, 0, 0.85));
    const s = THREE.MathUtils.lerp(0.06, 1, t);
    g.position.copy(pos);
    g.quaternion.copy(quat);
    g.scale.setScalar(s);

    // Lay out the flat pieces: (x, y) is the top left in folder pixels, y downwards
    const put = (
      mesh: Flat | null | undefined,
      x: number,
      y: number,
      w: number,
      h: number,
      z: number,
      color?: string,
    ) => {
      if (!mesh) return;
      mesh.position.set((x + w / 2 - folderW / 2) / K, (folderH / 2 - (y + h / 2)) / K, z);
      mesh.scale.set(w / K, Math.max(h, 0.001) / K, 1);
      if (color) mesh.material.color.set(color);
    };
    put(back.current, 0, TAB, folderW, folderH - TAB, -0.006, COLORS.back);
    put(sheet.current, MARGIN, TAB + GAP + down, paperW, paperH - down, 0, COLORS.paper);
    put(lip.current, 0, folderH - LIP, folderW, LIP, 0.005, COLORS.front);
    put(lipEdge.current, 0, folderH - LIP - 1, folderW, 2, 0.0052, COLORS.edge);
    const count = Math.min(paperDom.tabCount, MAX_TABS);
    const tabW = (folderW - 16 - 4 * (count - 1)) / Math.max(count, 1);
    tabs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.visible = i < count;
      if (i >= count) return;
      put(mesh, 8 + i * (tabW + 4), 2, tabW, TAB + 4, -0.0058);
      mesh.material.color.set(i === paperDom.activeTab ? COLORS.tabOn : COLORS.tab);
    });
    if (shadow.current) {
      shadow.current.visible = t > 0.3;
      shadow.current.scale.set((folderW * 1.12) / K, (folderH * 1.1) / K, 1);
      shadow.current.position.set(0.012, -0.018, -0.012);
    }

    // The dimming veil: a screen-filling plane just behind the folder
    if (dim.current) {
      const depth = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / K + 0.08;
      const height = 2 * depth * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      dim.current.position.set(0, 0, -depth).applyMatrix4(cam.matrixWorld);
      dim.current.quaternion.copy(cam.quaternion);
      dim.current.scale.set(height * (size.width / size.height) * 1.02, height * 1.02, 1);
      dim.current.material.opacity = THREE.MathUtils.smoothstep(progress.current, 0.3, 0.95);
    }

    // Keep the HTML on the folder
    if (paperDom.container && paperDom.camera && rig) {
      const fovPx = (1 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) * (size.height / 2);
      paperDom.container.style.perspective = `${fovPx}px`;
      paperDom.camera.style.transform = `translateZ(${fovPx}px) ${cameraCss(cam.matrixWorldInverse)} translate(${size.width / 2}px,${size.height / 2}px)`;
      objectMatrix.compose(pos, quat, scaleV.copy(unit).multiplyScalar(s));
      const vars: Record<string, number> = {
        '--wr': folderW,
        '--hr': folderH,
        '--wp': paperW,
        '--hp': paperH,
        '--m': MARGIN,
        '--tab': TAB,
        '--lip': LIP,
        '--d': down,
        '--clip': hidden,
        // Smaller type on a narrow screen, so a sheet's text still fits without scrolling
        '--fs': THREE.MathUtils.clamp((paperW / PAPER_W) * 13.5, 11, 13.5),
      };
      for (const key in vars) rig.style.setProperty(key, String(vars[key]));
      rig.style.transform = objectCss(objectMatrix);
      rig.style.opacity = String(THREE.MathUtils.smoothstep(progress.current, 0.6, 0.9));
      rig.style.pointerEvents = progress.current > 0.95 && open ? 'auto' : 'none';
    }
  });

  const flat = (color: string, extra?: object) => (
    <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} {...extra} />
  );

  return (
    <>
      <mesh ref={dim} visible={false} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={dimTexture} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={group} visible={false}>
        {/* A soft shadow just behind, so the folder lifts off the room */}
        <mesh ref={shadow}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={back}>
          <planeGeometry args={[1, 1]} />
          {flat(COLORS.back)}
        </mesh>
        {Array.from({ length: MAX_TABS }, (_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              tabs.current[i] = m as Flat | null;
            }}
          >
            <planeGeometry args={[1, 1]} />
            {flat(COLORS.tab)}
          </mesh>
        ))}
        <mesh ref={sheet}>
          <planeGeometry args={[1, 1]} />
          {flat(COLORS.paper)}
        </mesh>
        <mesh ref={lip}>
          <planeGeometry args={[1, 1]} />
          {flat(COLORS.front)}
        </mesh>
        <mesh ref={lipEdge}>
          <planeGeometry args={[1, 1]} />
          {flat(COLORS.edge)}
        </mesh>
      </group>
    </>
  );
}
