import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraCss, objectCss } from './cssMatrix';
import { phoneDom } from './paperDom';
import { sceneConfig } from './sceneConfig';

const { phone, pxPerMetre: K, delay, seconds } = sceneConfig.paper;

const ease = (t: number) => t * t * (3 - 2 * t);

const NAV = 58;
/** Height over width of the phone. */
const ASPECT = 2.05;
const BEZEL = 12; // CSS pixels from the edge of the body to the screen
const RADIUS = 46; // corner radius of the body, in CSS pixels at full size
/** The real phone is about 7 cm wide; the one in the air is far bigger so its screen can be read. */
const REAL_WIDTH = 0.072;

// Body geometry in units of the phone's width (so the whole group is scaled by the width in metres)
const DEPTH = 0.022;
const BEVEL = 0.008;
const FRONT = DEPTH / 2 + BEVEL; // z of the front face

function roundedRect(width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - radius);
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, y + height);
  shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
  return shape;
}

const slotPos = new THREE.Vector3();
const slotQuat = new THREE.Quaternion();
const localQuat = new THREE.Quaternion();
const euler = new THREE.Euler();
const startPos = new THREE.Vector3(...phone.position);
// Lying face up on the nightstand, turned a little like the real one
const startQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.2, 'YXZ'));
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const unit = new THREE.Vector3(1, 1, 1);
const scaleV = new THREE.Vector3();
const objectMatrix = new THREE.Matrix4();
const lift = new THREE.Matrix4();

/**
 * The phone from the nightstand, lifted into the air in front of the camera.
 * Its screen is HTML (see ContactsPanel), kept glued to it while it moves.
 */
export default function PhoneSheet({ open }: { open: boolean }) {
  const group = useRef<THREE.Group>(null);
  const dim = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const waited = useRef(0);
  const rest = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });

  const bodyGeometry = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(1, ASPECT, RADIUS / 350), {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: 0.008,
      bevelSegments: 4,
      curveSegments: 14,
    });
    geometry.translate(0, 0, -DEPTH / 2);
    return geometry;
  }, []);
  const screenGeometry = useMemo(() => {
    const inset = (BEZEL / 350) * 1;
    return new THREE.ShapeGeometry(roundedRect(1 - 2 * inset, ASPECT - 2 * inset, (RADIUS - BEZEL + 4) / 350), 14);
  }, []);

  const dimTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 70, 10, 64, 64, 90);
    grad.addColorStop(0, 'rgba(6,5,12,0.5)');
    grad.addColorStop(1, 'rgba(6,5,12,0.9)');
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
    const rig = phoneDom.rig;

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

    // Size on screen, in CSS pixels: as tall as fits, at the phone's shape
    const bodyW = Math.min((size.height - NAV - 34) / ASPECT, 350, size.width - 30);
    const bodyH = bodyW * ASPECT;
    const cx = size.width / 2;
    const cy = NAV + (size.height - NAV) / 2 + 2;
    const widthM = bodyW / K;

    // Resting place: in front of the camera, at the distance that makes it 1:1 with the screen
    if (open) {
      const depth = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / K;
      slotPos.set((cx - size.width / 2) / K, -(cy - size.height / 2) / K, -depth).applyMatrix4(cam.matrixWorld);
      const bob = Math.sin(state.clock.elapsedTime * 0.9);
      euler.set(0.04 + bob * 0.012, -0.1 + bob * 0.015, bob * 0.008);
      localQuat.setFromEuler(euler);
      slotQuat.copy(cam.quaternion).multiply(localQuat);
      slotPos.y += bob * 0.005;
      rest.current.pos.copy(slotPos);
      rest.current.quat.copy(slotQuat);
    }

    // Lift off the nightstand, swinging up and round to face the camera, growing as it comes
    pos.lerpVectors(startPos, rest.current.pos, t);
    pos.y += Math.sin(Math.PI * t) * 0.3;
    quat.slerpQuaternions(startQuat, rest.current.quat, THREE.MathUtils.smoothstep(t, 0, 0.9));
    const s = THREE.MathUtils.lerp(REAL_WIDTH / widthM, 1, t);
    g.position.copy(pos);
    g.quaternion.copy(quat);
    g.scale.setScalar(widthM * s);

    if (shadow.current) {
      shadow.current.visible = t > 0.3;
      shadow.current.scale.set(1.5, ASPECT * 1.18, 1);
      shadow.current.position.set(0.05, -0.07, -0.05);
    }

    // The veil behind that darkens the room
    if (dim.current) {
      const depth = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / K + 0.08;
      const height = 2 * depth * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      dim.current.position.set(0, 0, -depth).applyMatrix4(cam.matrixWorld);
      dim.current.quaternion.copy(cam.quaternion);
      dim.current.scale.set(height * (size.width / size.height) * 1.02, height * 1.02, 1);
      dim.current.material.opacity = THREE.MathUtils.smoothstep(progress.current, 0.3, 0.95);
    }

    // The screen's HTML sits on the front face of the body
    if (phoneDom.container && phoneDom.camera && rig) {
      const fovPx = (1 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) * (size.height / 2);
      phoneDom.container.style.perspective = `${fovPx}px`;
      phoneDom.camera.style.transform = `translateZ(${fovPx}px) ${cameraCss(cam.matrixWorldInverse)} translate(${size.width / 2}px,${size.height / 2}px)`;
      objectMatrix.compose(pos, quat, scaleV.copy(unit).multiplyScalar(s));
      objectMatrix.multiply(lift.makeTranslation(0, 0, (FRONT + 0.001) * widthM));
      rig.style.setProperty('--wr', String(bodyW));
      rig.style.setProperty('--hr', String(bodyH));
      rig.style.setProperty('--bezel', String(BEZEL));
      rig.style.setProperty('--fs', String(THREE.MathUtils.clamp((bodyW / 350) * 14, 11, 14)));
      rig.style.transform = objectCss(objectMatrix);
      rig.style.opacity = String(THREE.MathUtils.smoothstep(progress.current, 0.6, 0.9));
      rig.style.pointerEvents = progress.current > 0.95 && open ? 'auto' : 'none';
    }
  });

  return (
    <>
      <mesh ref={dim} visible={false} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={dimTexture} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={group} visible={false}>
        <mesh ref={shadow}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh geometry={bodyGeometry}>
          <meshStandardMaterial color="#2b2e38" metalness={0.75} roughness={0.32} />
        </mesh>
        <mesh geometry={screenGeometry} position={[0, 0, FRONT + 0.0006]}>
          <meshBasicMaterial color="#0b0d14" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
