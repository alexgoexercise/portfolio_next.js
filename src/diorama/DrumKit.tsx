import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sceneConfig } from './sceneConfig';
import type { DrumPiece } from './sounds';

/**
 * A piece of the kit that can be hit. The positions are measured in the kit's
 * own file, where the floor is the x/y plane and z is up (the way Blender
 * draws it); they are turned into three.js's y-up axes below.
 */
interface Piece {
  id: DrumPiece;
  label: string;
  /** Middle of the piece on the floor plane. */
  at: [number, number];
  /** Lowest and highest point. */
  z: [number, number];
  /** Round pieces have a radius; the tilted kick drum is a box. */
  radius?: number;
  box?: { x: [number, number]; y: [number, number] };
  cymbal?: boolean;
}

const PIECES: Piece[] = [
  { id: 'crashBig', label: 'Crash', at: [1.6, -0.68], z: [0.9, 1.12], radius: 0.24, cymbal: true },
  { id: 'crashR', label: 'Crash', at: [1.74, -0.34], z: [0.9, 1.08], radius: 0.17, cymbal: true },
  { id: 'crashR', label: 'Crash', at: [0.5, -0.99], z: [0.9, 1.03], radius: 0.23, cymbal: true },
  { id: 'hihat', label: 'Hi-hat', at: [1.455, -0.33], z: [0.73, 0.87], radius: 0.22, cymbal: true },
  { id: 'stack', label: 'Stack', at: [0.18, -0.87], z: [0.74, 0.86], radius: 0.22, cymbal: true },
  { id: 'ride', label: 'Ride', at: [0.93, -1.06], z: [0.8, 1.0], radius: 0.28, cymbal: true },
  { id: 'splash', label: 'Splash', at: [1.43, -0.62], z: [0.74, 0.86], radius: 0.12, cymbal: true },
  { id: 'tom1', label: 'Tom', at: [1.27, -0.86], z: [0.52, 0.8], radius: 0.15 },
  { id: 'snare2', label: 'Side snare', at: [1.38, -0.05], z: [0.5, 0.68], radius: 0.2 },
  { id: 'snare', label: 'Snare', at: [1.27, -0.55], z: [0.44, 0.68], radius: 0.22 },
  { id: 'tom3', label: 'Tom', at: [0.67, -0.79], z: [0.38, 0.68], radius: 0.22 },
  { id: 'tom4', label: 'Floor tom', at: [0.31, -0.53], z: [0.24, 0.68], radius: 0.26 },
  { id: 'kick', label: 'Kick', at: [1.17, -1.03], z: [0, 0.54], box: { x: [0.84, 1.5], y: [-1.35, -0.71] } },
];

/** How far a point is into a piece, as a share of its size (under 1 means inside), or Infinity if outside. */
function depthIn(piece: Piece, x: number, y: number, z: number) {
  if (z < piece.z[0] || z > piece.z[1]) return Infinity;
  if (piece.box) {
    const { x: bx, y: by } = piece.box;
    if (x < bx[0] || x > bx[1] || y < by[0] || y > by[1]) return Infinity;
    return Math.max(
      Math.abs(x - piece.at[0]) / ((bx[1] - bx[0]) / 2),
      Math.abs(y - piece.at[1]) / ((by[1] - by[0]) / 2),
    );
  }
  const d = Math.hypot(x - piece.at[0], y - piece.at[1]) / (piece.radius ?? 0.2);
  return d <= 1 ? d : Infinity;
}

/** Which piece a point of the model belongs to, or -1 for the stands and everything that stays still. */
function pieceAt(x: number, y: number, z: number) {
  let best = -1;
  let bestDepth = Infinity;
  PIECES.forEach((piece, i) => {
    const d = depthIn(piece, x, y, z);
    if (d < bestDepth) {
      bestDepth = d;
      best = i;
    }
  });
  return best;
}

interface Built {
  fixed: THREE.Mesh[];
  /** For each piece, the meshes that make it up (the glTF has one per material). */
  parts: THREE.Mesh[][];
}

/**
 * The kit's file is one welded model. This cuts it back into its pieces,
 * by position, so each drum and cymbal can move on its own when it is hit.
 * The original is left alone (the hover highlight still reads its materials).
 */
function split(scene: THREE.Object3D): Built {
  scene.updateWorldMatrix(true, true);
  const fixed: THREE.Mesh[] = [];
  const parts: THREE.Mesh[][] = PIECES.map(() => []);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  scene.traverse((node) => {
    const source = node as THREE.Mesh;
    if (!source.isMesh || !source.geometry.index) return;
    const geometry = source.geometry.clone().applyMatrix4(source.matrixWorld);
    const position = geometry.getAttribute('position');
    const index = geometry.index!.array;
    const buckets: number[][] = Array.from({ length: PIECES.length + 1 }, () => []);
    for (let i = 0; i < index.length; i += 3) {
      a.fromBufferAttribute(position, index[i]);
      b.fromBufferAttribute(position, index[i + 1]);
      c.fromBufferAttribute(position, index[i + 2]);
      const cx = (a.x + b.x + c.x) / 3;
      const cy = (a.y + b.y + c.y) / 3;
      const cz = (a.z + b.z + c.z) / 3;
      // Three.js has y up and z toward the viewer; the measurements are z up and y away
      const which = pieceAt(cx, -cz, cy);
      buckets[which < 0 ? PIECES.length : which].push(index[i], index[i + 1], index[i + 2]);
    }
    buckets.forEach((triangles, which) => {
      if (!triangles.length) return;
      const piece = new THREE.BufferGeometry();
      for (const name of Object.keys(geometry.attributes)) piece.setAttribute(name, geometry.getAttribute(name));
      piece.setIndex(new THREE.Uint32BufferAttribute(triangles, 1));
      piece.computeBoundingSphere();
      const mesh = new THREE.Mesh(piece, source.material);
      (which === PIECES.length ? fixed : parts[which]).push(mesh);
    });
  });
  return { fixed, parts };
}

/** Where a piece turns from, in three.js's axes. */
function pivotOf(piece: Piece) {
  return new THREE.Vector3(piece.at[0], (piece.z[0] + piece.z[1]) / 2, -piece.at[1]);
}

interface DrumKitProps {
  /** Whether hitting the drums is on (the camera is behind the kit). */
  drumming: boolean;
  onHit: (piece: DrumPiece) => void;
}

/**
 * The drum kit keeps real, shiny materials, so it is lit live by <Lamps />.
 * Behind the kit, every drum and cymbal can be hit: it plays its sound and
 * the piece shudders (cymbals swing on their stands, drums jump).
 */
export default function DrumKit({ drumming, onHit }: DrumKitProps) {
  const { scene } = useGLTF(sceneConfig.drumKitUrl, sceneConfig.dracoPath);
  const built = useMemo(() => split(scene), [scene]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const hits = useRef<{ age: number; strength: number; axis: number }[]>(
    PIECES.map(() => ({ age: 99, strength: 0, axis: 0 })),
  );
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const axisVector = useMemo(() => new THREE.Vector3(), []);

  // Free the copies when the scene goes away
  useEffect(
    () => () => {
      for (const mesh of [...built.fixed, ...built.parts.flat()]) mesh.geometry.dispose();
    },
    [built],
  );

  useFrame((_, delta) => {
    PIECES.forEach((piece, i) => {
      const group = groups.current[i];
      const hit = hits.current[i];
      if (!group || hit.age > 3) return;
      hit.age += delta;
      const fade = Math.exp(-hit.age * (piece.cymbal ? 2.6 : 11)) * hit.strength;
      if (piece.cymbal) {
        // Swings on its stand, like a cymbal struck from above
        axisVector.set(Math.cos(hit.axis), 0, Math.sin(hit.axis));
        group.quaternion.copy(quaternion.setFromAxisAngle(axisVector, Math.sin(hit.age * 22) * 0.12 * fade));
        group.scale.setScalar(1);
      } else {
        group.quaternion.identity();
        group.scale.setScalar(1 + 0.045 * fade);
      }
      if (hit.age > 3) {
        group.quaternion.identity();
        group.scale.setScalar(1);
      }
    });
  });

  const shake = (index: number) => {
    const hit = hits.current[index];
    hit.age = 0;
    hit.strength = 1;
    hit.axis = Math.random() * Math.PI * 2;
  };

  const strike = (index: number) => {
    shake(index);
    onHit(PIECES[index].id);
  };

  return (
    <>
      {built.fixed.map((mesh, i) => (
        <primitive key={`fixed${i}`} object={mesh} />
      ))}
      {PIECES.map((piece, i) => {
        const pivot = pivotOf(piece);
        return (
          <group key={i} position={pivot} ref={(g) => void (groups.current[i] = g)}>
            {built.parts[i].map((mesh, j) => (
              <primitive key={j} object={mesh} position={[-pivot.x, -pivot.y, -pivot.z]} />
            ))}
          </group>
        );
      })}
      {drumming &&
        PIECES.map((piece, i) => {
          const pivot = pivotOf(piece);
          const height = piece.z[1] - piece.z[0];
          return (
            <mesh
              key={`hit${i}`}
              position={pivot}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = '';
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                if (e.delta > 6) return; // a drag to orbit, not a hit
                strike(i);
              }}
            >
              {piece.box ? (
                <boxGeometry args={[piece.box.x[1] - piece.box.x[0], height, piece.box.y[1] - piece.box.y[0]]} />
              ) : (
                <cylinderGeometry args={[piece.radius, piece.radius, height, 20]} />
              )}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          );
        })}
    </>
  );
}

useGLTF.preload(sceneConfig.drumKitUrl, sceneConfig.dracoPath);
