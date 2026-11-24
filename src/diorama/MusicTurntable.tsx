import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { journeyBands } from './musicView';
import { musicPlayer } from './musicPlayer';
import { sceneConfig } from './sceneConfig';

const K = sceneConfig.paper.pxPerMetre;
const NAV = 58;
/** Width of the text panel (see .panel in MusicPanel.module.css); the record player sits half behind it */
const panelWidth = (w: number) => (w > 760 ? Math.min(w * 0.6, 920) : 0);
const ease = (t: number) => t * t * (3 - 2 * t);

/** The platter and spindle sit at this spot on the plinth (local units, plinth is 1 wide). */
const PLATTER = new THREE.Vector3(-0.18, 0.06, 0.02);
const ARM_PIVOT = new THREE.Vector3(0.38, 0.11, -0.22);
const ARM_ON = 0.03;
const ARM_OFF = -0.32;

// Small copies for the disc label: the full covers are far larger than a label needs
const covers = journeyBands.map((b) => `/band-images/disc/${b.id}.jpg`);

function groovesTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0c0a09';
  g.fillRect(0, 0, 512, 512);
  for (let r = 70; r < 256; r += 2.2) {
    g.strokeStyle = `rgba(255,255,255,${0.025 + ((r * 7) % 5) * 0.012})`;
    g.beginPath();
    g.arc(256, 256, r, 0, Math.PI * 2);
    g.stroke();
  }
  // A soft sheen across the disc, like light on real vinyl
  const sheen = g.createConicGradient(0.6, 256, 256);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.08, 'rgba(255,230,200,0.16)');
  sheen.addColorStop(0.18, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.58, 'rgba(255,230,200,0.12)');
  sheen.addColorStop(0.68, 'rgba(255,255,255,0)');
  g.fillStyle = sheen;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const slot = new THREE.Vector3();
const euler = new THREE.Euler();
const localQuat = new THREE.Quaternion();

/**
 * A real turntable for the music page, floating in front of the camera. Each
 * band is a record: switching bands lifts the old one off, drops the new one on
 * (its cover is the label), and the arm swings back onto the groove.
 */
export default function MusicTurntable({ open, bandId }: { open: boolean; bandId: string }) {
  const textures = useTexture(covers);
  const grooves = useMemo(groovesTexture, []);
  for (const t of textures) t.colorSpace = THREE.SRGBColorSpace;

  const group = useRef<THREE.Group>(null);
  const veil = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);
  const record = useRef<THREE.Group>(null);
  const vinyl = useRef<THREE.Group>(null);
  const label = useRef<THREE.MeshStandardMaterial>(null);
  const arm = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);

  const shown = useRef(bandId); // the record on the platter
  const swap = useRef(1); // 1 = settled; below that a swap is under way (0..0.5 out, 0.5..1 in)
  const progress = useRef(0);
  const spin = useRef(0);
  const speed = useRef(0);
  const armAngle = useRef(ARM_OFF);

  const veilTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 6, 64, 64, 92);
    grad.addColorStop(0, 'rgba(46,28,18,0.94)');
    grad.addColorStop(1, 'rgba(8,6,10,0.98)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const { size } = state;

    progress.current = THREE.MathUtils.clamp(progress.current + (open ? dt : -dt) / 0.9, 0, 1);
    const t = ease(progress.current);
    g.visible = progress.current > 0.001;
    if (veil.current) veil.current.visible = g.visible;
    if (!g.visible) return;

    // On a wide screen the player sits behind the panel's left edge, mostly showing; on a phone it is above the sheet
    const wide = size.width > 760;
    let cx: number;
    let cy: number;
    let widthPx: number;
    if (wide) {
      widthPx = Math.min(size.width * 0.5, size.height * 1.15, 820);
      const panelLeft = size.width - 24 - panelWidth(size.width);
      cx = Math.max(widthPx * 0.5 + 10, panelLeft - widthPx * 0.12);
      cy = NAV + (size.height - NAV) / 2;
    } else {
      const areaH = size.height * 0.52 - NAV;
      widthPx = Math.min(size.width * 0.7, areaH * 0.9, 700);
      cx = size.width / 2;
      cy = NAV + areaH / 2;
    }
    const s = (widthPx / K) * t;
    const depth = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / K;

    slot.set((cx - size.width / 2) / K, -(cy - size.height / 2) / K - (1 - t) * 0.25, -depth).applyMatrix4(
      cam.matrixWorld,
    );
    const sway = Math.sin(state.clock.elapsedTime * 0.5);
    euler.set(0.95 + sway * 0.02, -0.28 + sway * 0.06, 0);
    localQuat.setFromEuler(euler);
    g.position.copy(slot);
    g.quaternion.copy(cam.quaternion).multiply(localQuat);
    g.scale.setScalar(Math.max(s, 0.0001));

    if (veil.current) {
      const dv = depth + 0.55;
      const height = 2 * dv * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      veil.current.position.set(0, 0, -dv).applyMatrix4(cam.matrixWorld);
      veil.current.quaternion.copy(cam.quaternion);
      veil.current.scale.set(height * (size.width / size.height) * 1.05, height * 1.05, 1);
      veil.current.material.opacity = THREE.MathUtils.smoothstep(progress.current, 0.1, 0.8);
    }

    // A new band was chosen: start swapping the record
    if (bandId !== shown.current && swap.current >= 1) swap.current = 0;
    if (swap.current < 1) {
      swap.current = Math.min(1, swap.current + dt / 0.9);
      if (swap.current >= 0.5 && bandId !== shown.current) {
        shown.current = bandId;
        const index = Math.max(0, journeyBands.findIndex((b) => b.id === bandId));
        if (label.current) {
          label.current.map = textures[index];
          label.current.needsUpdate = true;
        }
      }
    }

    // The record leaves upward and tilts away, then the new one drops in from above
    const w = swap.current;
    const away = w < 0.5 ? ease(w * 2) : 1 - ease((w - 0.5) * 2);
    const settled = swap.current >= 1;
    if (record.current) {
      record.current.position.set(PLATTER.x, PLATTER.y + away * 0.7, PLATTER.z - away * 0.15);
      record.current.rotation.set(-away * 0.6, 0, 0);
      record.current.scale.setScalar(1 - away * 0.25);
    }

    // The arm lifts away while a record is changing or paused
    const wantArm = musicPlayer.spinning && settled ? ARM_ON : ARM_OFF;
    armAngle.current += (wantArm - armAngle.current) * Math.min(1, dt * 3);
    if (arm.current) {
      arm.current.rotation.y = armAngle.current;
      arm.current.position.y = ARM_PIVOT.y + (armAngle.current < -0.05 ? 0.02 : 0);
    }

    // The platter spins up and winds down
    const wantSpeed = musicPlayer.spinning && settled ? 3.5 : 0; // radians per second (about 33 rpm)
    speed.current += (wantSpeed - speed.current) * Math.min(1, dt * 1.6);
    spin.current += speed.current * dt;
    if (vinyl.current) vinyl.current.rotation.y = -spin.current;
    if (led.current) led.current.color.set(musicPlayer.spinning ? '#ffa24a' : '#4a2a14');
  });

  const index = Math.max(0, journeyBands.findIndex((b) => b.id === shown.current));

  return (
    <>
      <mesh ref={veil} visible={false} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={veilTexture} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={group} visible={false}>
        <pointLight position={[-0.2, 1.1, 0.5]} intensity={1.6} distance={4} decay={1.4} color="#ffd9b0" />
        <pointLight position={[0.9, 0.5, -0.4]} intensity={0.5} distance={4} decay={1.4} color="#ff9a5a" />

        {/* Plinth */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.04, 0.1, 0.8]} />
          <meshStandardMaterial color="#6b4428" roughness={0.5} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.052, 0]}>
          <boxGeometry args={[0.98, 0.008, 0.74]} />
          <meshStandardMaterial color="#1b1512" roughness={0.35} metalness={0.4} />
        </mesh>
        {[
          [-0.46, -0.07, -0.33],
          [0.46, -0.07, -0.33],
          [-0.46, -0.07, 0.33],
          [0.46, -0.07, 0.33],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.035, 0.045, 0.04, 16]} />
            <meshStandardMaterial color="#14100e" roughness={0.8} />
          </mesh>
        ))}

        {/* Platter */}
        <mesh position={[PLATTER.x, 0.065, PLATTER.z]}>
          <cylinderGeometry args={[0.31, 0.31, 0.03, 48]} />
          <meshStandardMaterial color="#9b9488" metalness={0.9} roughness={0.28} />
        </mesh>

        {/* The record: grooves, the cover as its label, a spindle through the middle */}
        <group ref={record} position={PLATTER.toArray()}>
          <group ref={vinyl}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.29, 0.29, 0.008, 64]} />
              <meshStandardMaterial map={grooves} roughness={0.25} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.0356, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.13, 48]} />
              <meshStandardMaterial ref={label} map={textures[index]} roughness={0.6} />
            </mesh>
          </group>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.03, 12]} />
            <meshStandardMaterial color="#d8d2c6" metalness={1} roughness={0.2} />
          </mesh>
        </group>

        {/* Tonearm */}
        <mesh position={[ARM_PIVOT.x, 0.07, ARM_PIVOT.z]}>
          <cylinderGeometry args={[0.05, 0.055, 0.05, 24]} />
          <meshStandardMaterial color="#bfb8aa" metalness={0.9} roughness={0.3} />
        </mesh>
        <group ref={arm} position={ARM_PIVOT.toArray()}>
          <mesh position={[-0.24, 0.0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0075, 0.0075, 0.52, 12]} />
            <meshStandardMaterial color="#e2dccf" metalness={0.95} roughness={0.22} />
          </mesh>
          <mesh position={[-0.52, -0.005, 0.012]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.07, 0.014, 0.03]} />
            <meshStandardMaterial color="#1c1714" roughness={0.5} />
          </mesh>
          <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.05, 16]} />
            <meshStandardMaterial color="#2c2622" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>

        {/* Little power light */}
        <mesh position={[0.4, 0.058, 0.3]}>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshBasicMaterial ref={led} color="#ffa24a" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
