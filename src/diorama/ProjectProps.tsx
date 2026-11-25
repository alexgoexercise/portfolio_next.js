import { useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Small models, one per project, built from simple shapes. They are stand-ins
 * in the room's own colours: each can later be swapped for a model made in
 * Blender without touching anything else. Every model is about 0.2 m wide,
 * sits on its own origin, and faces along +x (the cat faces +z).
 */

const COLOUR = {
  cream: '#efe3c8',
  orange: '#e0692f',
  rust: '#b4472a',
  mustard: '#dfa83f',
  teal: '#3f8f8a',
  navy: '#1f2a44',
  dark: '#1a1614',
  steel: '#9aa3ad',
  green: '#2f7a48',
  wood: '#8a5a36',
};

interface PaintProps {
  color: string;
  rough?: number;
  metal?: number;
  /** Light the surface gives off, 0 for none. */
  glow?: number;
}

/** A material with the room's slightly rough, matte finish. */
function Paint({ color, rough = 0.55, metal = 0, glow = 0 }: PaintProps) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={rough}
      metalness={metal}
      emissive={glow > 0 ? color : '#000000'}
      emissiveIntensity={glow}
    />
  );
}

/** Autoboat: a small white boat with an orange stripe, a cabin and an antenna. */
function Boat() {
  const hull = useMemo(() => {
    const side = new THREE.Shape();
    side.moveTo(-0.11, 0.035);
    side.lineTo(-0.1, -0.015);
    side.lineTo(0.06, -0.015);
    side.quadraticCurveTo(0.13, -0.005, 0.14, 0.035);
    side.closePath();
    const geometry = new THREE.ExtrudeGeometry(side, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 2,
    });
    geometry.translate(0, 0, -0.04);
    return geometry;
  }, []);

  return (
    <group>
      <mesh geometry={hull}>
        <Paint color={COLOUR.cream} />
      </mesh>
      <mesh position={[0.005, 0.004, 0]}>
        <boxGeometry args={[0.2, 0.012, 0.094]} />
        <Paint color={COLOUR.orange} />
      </mesh>
      <mesh position={[0.005, 0.038, 0]}>
        <boxGeometry args={[0.2, 0.006, 0.08]} />
        <Paint color={COLOUR.navy} />
      </mesh>
      <mesh position={[-0.03, 0.062, 0]}>
        <boxGeometry args={[0.07, 0.042, 0.05]} />
        <Paint color={COLOUR.cream} />
      </mesh>
      <mesh position={[-0.02, 0.066, 0]}>
        <boxGeometry args={[0.04, 0.012, 0.052]} />
        <Paint color={COLOUR.navy} rough={0.2} />
      </mesh>
      <mesh position={[-0.05, 0.12, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.08, 8]} />
        <Paint color={COLOUR.steel} metal={0.8} rough={0.3} />
      </mesh>
      <mesh position={[-0.05, 0.164, 0]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <Paint color="#7fe3ff" glow={1.4} />
      </mesh>
    </group>
  );
}

/** AR Laser Tag++: a toy blaster with a glowing red muzzle and a green sensor. */
function Gun() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.16, 0.05, 0.045]} />
        <Paint color={COLOUR.dark} rough={0.4} />
      </mesh>
      <mesh position={[0.005, 0.076, 0]}>
        <boxGeometry args={[0.12, 0.012, 0.03]} />
        <Paint color={COLOUR.orange} />
      </mesh>
      <mesh position={[0.115, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.07, 14]} />
        <Paint color={COLOUR.steel} metal={0.7} rough={0.3} />
      </mesh>
      <mesh position={[0.152, 0.05, 0]}>
        <sphereGeometry args={[0.009, 12, 12]} />
        <Paint color="#ff3b2f" glow={2.2} />
      </mesh>
      <mesh position={[-0.04, -0.005, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[0.035, 0.09, 0.04]} />
        <Paint color={COLOUR.dark} rough={0.4} />
      </mesh>
      <mesh position={[-0.07, 0.066, 0]}>
        <boxGeometry args={[0.03, 0.022, 0.034]} />
        <Paint color={COLOUR.teal} />
      </mesh>
      <mesh position={[-0.07, 0.081, 0]}>
        <sphereGeometry args={[0.006, 10, 10]} />
        <Paint color="#59ff8a" glow={2} />
      </mesh>
    </group>
  );
}

/** RTOS Car Racing: a small chassis with a green circuit board and four wheels. */
function Car() {
  const wheels: [number, number][] = [
    [-0.065, -0.058],
    [-0.065, 0.058],
    [0.065, -0.058],
    [0.065, 0.058],
  ];
  return (
    <group position={[0, 0.0, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.2, 0.024, 0.1]} />
        <Paint color={COLOUR.teal} />
      </mesh>
      <mesh position={[-0.01, 0.05, 0]}>
        <boxGeometry args={[0.11, 0.008, 0.075]} />
        <Paint color={COLOUR.green} rough={0.4} />
      </mesh>
      {[-0.03, 0.005, 0.04].map((x, i) => (
        <mesh key={x} position={[x - 0.01, 0.057, i === 1 ? 0.014 : -0.014]}>
          <boxGeometry args={[0.022, 0.006, 0.022]} />
          <Paint color={COLOUR.dark} />
        </mesh>
      ))}
      <mesh position={[0.045, 0.058, 0.026]}>
        <sphereGeometry args={[0.005, 10, 10]} />
        <Paint color={COLOUR.mustard} glow={2} />
      </mesh>
      <mesh position={[0.108, 0.03, 0]}>
        <boxGeometry args={[0.012, 0.016, 0.05]} />
        <Paint color={COLOUR.dark} />
      </mesh>
      {wheels.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.028, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.028, 0.028, 0.022, 20]} />
            <Paint color={COLOUR.dark} rough={0.8} />
          </mesh>
          <mesh position={[0, z > 0 ? 0.0115 : -0.0115, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.002, 14]} />
            <Paint color={COLOUR.cream} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const _toCamera = new THREE.Vector3();

/** Cat Aims At You: a cartoon cat head that turns to follow the camera, with its gun aimed along the way. */
function Cat() {
  const head = useRef<THREE.Group>(null);

  useFrame(({ camera }, delta) => {
    const h = head.current;
    if (!h || !h.parent) return;
    // Where the camera is, as seen from the head's own surroundings
    h.parent.worldToLocal(_toCamera.copy(camera.position));
    const dx = _toCamera.x - h.position.x;
    const dy = _toCamera.y - h.position.y;
    const dz = _toCamera.z - h.position.z;
    const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -1.0, 1.0);
    const pitch = THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.45, 0.45);
    h.rotation.y = THREE.MathUtils.damp(h.rotation.y, yaw, 4, delta);
    h.rotation.x = THREE.MathUtils.damp(h.rotation.x, pitch, 4, delta);
  });

  return (
    <group>
      <mesh position={[0, 0.03, 0]} scale={[1, 0.85, 0.9]}>
        <sphereGeometry args={[0.062, 20, 16]} />
        <Paint color={COLOUR.rust} />
      </mesh>
      <group ref={head} position={[0, 0.115, 0]}>
        <mesh scale={[1.05, 0.9, 0.95]}>
          <sphereGeometry args={[0.068, 24, 18]} />
          <Paint color={COLOUR.orange} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.043, 0.056, 0]} rotation={[0, 0, -side * 0.35]}>
            <mesh>
              <coneGeometry args={[0.03, 0.055, 4]} />
              <Paint color={COLOUR.orange} />
            </mesh>
            <mesh position={[0, -0.004, 0.011]} scale={0.6}>
              <coneGeometry args={[0.03, 0.055, 4]} />
              <Paint color="#ffb4a0" />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((side) => (
          <group key={`eye${side}`} position={[side * 0.028, 0.012, 0.056]}>
            <mesh>
              <sphereGeometry args={[0.016, 14, 14]} />
              <Paint color="#ffffff" rough={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.011]}>
              <sphereGeometry args={[0.0085, 12, 12]} />
              <Paint color="#000000" rough={0.2} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.012, 0.0655]}>
          <sphereGeometry args={[0.007, 10, 10]} />
          <Paint color="#ff8da0" />
        </mesh>
        {/* The gun, held out to the side and pointing where the cat is looking */}
        <group position={[0.07, -0.03, 0.04]}>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.018, 0.022, 0.06]} />
            <Paint color={COLOUR.dark} rough={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.04, 10]} />
            <Paint color={COLOUR.steel} metal={0.7} rough={0.3} />
          </mesh>
          <mesh position={[0, -0.025, -0.002]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.016, 0.034, 0.02]} />
            <Paint color={COLOUR.dark} rough={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Personal Website: the bedroom in miniature, a cutaway box with a bed, a drum and a lit lamp. */
function MiniRoom() {
  return (
    <group position={[0, 0.0, 0]}>
      <mesh position={[0, 0.0, 0]}>
        <boxGeometry args={[0.2, 0.012, 0.2]} />
        <Paint color={COLOUR.dark} />
      </mesh>
      <mesh position={[0, 0.009, 0]}>
        <boxGeometry args={[0.19, 0.006, 0.19]} />
        <Paint color={COLOUR.wood} />
      </mesh>
      <mesh position={[0, 0.072, -0.091]}>
        <boxGeometry args={[0.19, 0.12, 0.008]} />
        <Paint color={COLOUR.cream} />
      </mesh>
      <mesh position={[-0.091, 0.072, 0]}>
        <boxGeometry args={[0.008, 0.12, 0.19]} />
        <Paint color={COLOUR.cream} />
      </mesh>
      <mesh position={[-0.0865, 0.085, 0.02]}>
        <boxGeometry args={[0.002, 0.04, 0.05]} />
        <Paint color="#10162e" glow={0.5} />
      </mesh>
      <mesh position={[-0.045, 0.027, -0.025]}>
        <boxGeometry args={[0.06, 0.022, 0.1]} />
        <Paint color={COLOUR.orange} />
      </mesh>
      <mesh position={[-0.045, 0.042, -0.065]}>
        <boxGeometry args={[0.05, 0.008, 0.024]} />
        <Paint color={COLOUR.cream} />
      </mesh>
      <mesh position={[0.045, 0.03, 0.05]}>
        <cylinderGeometry args={[0.026, 0.026, 0.028, 18]} />
        <Paint color={COLOUR.teal} rough={0.3} />
      </mesh>
      <mesh position={[0.045, 0.072, 0.05]}>
        <cylinderGeometry args={[0.03, 0.03, 0.003, 18]} />
        <Paint color={COLOUR.mustard} metal={0.8} rough={0.3} />
      </mesh>
      <mesh position={[0.05, 0.03, -0.07]}>
        <boxGeometry args={[0.07, 0.004, 0.03]} />
        <Paint color={COLOUR.dark} />
      </mesh>
      <mesh position={[-0.065, 0.052, -0.075]}>
        <sphereGeometry args={[0.009, 12, 12]} />
        <Paint color="#ffb866" glow={2.4} />
      </mesh>
    </group>
  );
}

/**
 * IBVS Drone Gate Traversal: the quadrotor from the lab. A carbon X frame with four motors, yellow props and
 * half-round guards, the Jetson stack and battery on top, the D435i camera at the nose (+x) and the
 * flight controller slung underneath on its little feet.
 */
function Drone() {
  const props = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, delta) => {
    props.current.forEach((p, i) => {
      if (p) p.rotation.y += delta * (i % 2 ? -38 : 38);
    });
  });
  const arm = 0.062;
  const corners: [number, number][] = [
    [arm, arm],
    [arm, -arm],
    [-arm, arm],
    [-arm, -arm],
  ];
  return (
    <group position={[0, 0.05, 0]}>
      {/* The X-shaped carbon frame */}
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, r, 0]}>
          <boxGeometry args={[0.2, 0.006, 0.012]} />
          <Paint color="#26282c" rough={0.35} metal={0.3} />
        </mesh>
      ))}
      {/* Motors, props and guards */}
      {corners.map(([x, z], i) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.016, 14]} />
            <Paint color={COLOUR.dark} metal={0.6} rough={0.35} />
          </mesh>
          <group
            ref={(g) => {
              props.current[i] = g;
            }}
            position={[0, 0.02, 0]}
          >
            <mesh>
              <boxGeometry args={[0.07, 0.002, 0.009]} />
              <Paint color="#c6f21a" rough={0.4} glow={0.15} />
            </mesh>
          </group>
          {/* Half-round guard on the outer side of each rotor */}
          <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, Math.atan2(z, x) - Math.PI / 2]}>
            <torusGeometry args={[0.036, 0.0022, 6, 20, Math.PI]} />
            <Paint color="#26282c" rough={0.4} />
          </mesh>
        </group>
      ))}
      {/* Jetson Orin stack in the middle, with its honeycomb lid */}
      <mesh position={[0.012, 0.022, 0]}>
        <boxGeometry args={[0.07, 0.034, 0.042]} />
        <Paint color="#1d1f23" rough={0.5} />
      </mesh>
      <mesh position={[0.012, 0.0405, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.003, 6]} />
        <Paint color="#3a3d44" rough={0.5} />
      </mesh>
      {/* Battery pack beside it */}
      <mesh position={[-0.05, 0.026, 0]}>
        <boxGeometry args={[0.062, 0.026, 0.036]} />
        <Paint color="#d9dadd" rough={0.45} />
      </mesh>
      <mesh position={[-0.05, 0.04, 0]}>
        <boxGeometry args={[0.03, 0.002, 0.037]} />
        <Paint color={COLOUR.mustard} />
      </mesh>
      {/* RealSense D435i at the nose */}
      <mesh position={[0.058, 0.026, 0]}>
        <boxGeometry args={[0.016, 0.018, 0.062]} />
        <Paint color={COLOUR.steel} metal={0.6} rough={0.35} />
      </mesh>
      {[-0.022, 0, 0.022].map((z) => (
        <mesh key={z} position={[0.0664, 0.026, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0042, 0.0042, 0.001, 12]} />
          <Paint color="#000000" rough={0.15} />
        </mesh>
      ))}
      {/* Flight controller underneath, on its feet */}
      <mesh position={[0, -0.014, 0]}>
        <boxGeometry args={[0.04, 0.012, 0.04]} />
        <Paint color="#17181b" rough={0.4} />
      </mesh>
      {[
        [-0.028, -0.028],
        [-0.028, 0.028],
        [0.028, -0.028],
        [0.028, 0.028],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -0.026, z]}>
          <cylinderGeometry args={[0.005, 0.0065, 0.016, 10]} />
          <Paint color={COLOUR.teal} />
        </mesh>
      ))}
    </group>
  );
}

/** Stand-in for a project that has no model of its own yet: a glowing cube. */
function Placeholder() {
  return (
    <mesh position={[0, 0.05, 0]} rotation={[0.4, 0.6, 0]}>
      <boxGeometry args={[0.09, 0.09, 0.09]} />
      <Paint color={COLOUR.mustard} glow={0.6} />
    </mesh>
  );
}

interface PropModel {
  Model: ComponentType;
  /** Turn slowly while chosen. Off for the cat, whose head already turns toward you. */
  spin: boolean;
}

/** The model for each project, by its slug (see projectsView.ts). */
export const PROP_MODELS: Record<string, PropModel> = {
  autoboat: { Model: Boat, spin: true },
  'ibvs-drone-gate-traversal': { Model: Drone, spin: true },
  'ar-laser-tag': { Model: Gun, spin: true },
  'rtos-car-racing': { Model: Car, spin: true },
  'cat-aims-at-you': { Model: Cat, spin: false },
  'personal-website': { Model: MiniRoom, spin: true },
};

export const FALLBACK_MODEL: PropModel = { Model: Placeholder, spin: true };
