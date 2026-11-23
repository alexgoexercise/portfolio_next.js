import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FALLBACK_MODEL, PROP_MODELS } from './ProjectProps';
import { roomProjects } from './projectsView';
import { sceneConfig } from './sceneConfig';

const { center, spacing, riseFrom, selected: lift, othersScale, light } = sceneConfig.showcase;
const damp = THREE.MathUtils.damp;

interface ItemProps {
  slug: string;
  index: number;
  count: number;
  active: boolean;
  chosen: boolean;
  hovered: boolean;
  onPick: (slug: string) => void;
  onHover: (slug: string | null) => void;
}

/** One project's model, on a small stand, moving between its place in the row and the front. */
function ShowcaseItem({ slug, index, count, active, chosen, hovered, onPick, onHover }: ItemProps) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const rise = useRef(0); // 0 = still under the desk, 1 = fully risen
  const age = useRef(0); // seconds since the page opened, so the models rise one after another
  const placed = useRef(false);
  const { Model, spin } = PROP_MODELS[slug] ?? FALLBACK_MODEL;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    age.current = active ? age.current + dt : 0;
    const open = active && age.current > index * 0.09 ? 1 : 0;
    rise.current = damp(rise.current, open, 3.5, dt);
    g.visible = rise.current > 0.01;
    if (!g.visible) return;

    // On a narrow screen the row is drawn closer together so it still fits
    const aspect = state.size.width / state.size.height;
    const squeeze = THREE.MathUtils.clamp(aspect / 1.6, 0.5, 1);
    const k = index - (count - 1) / 2;

    const targetX = chosen ? center[0] + lift.offset[0] : center[0] + k * spacing * squeeze;
    const targetY =
      (chosen ? center[1] + lift.offset[1] : center[1]) +
      Math.sin(t * 0.9 + index) * 0.012 +
      (1 - rise.current) * riseFrom;
    const targetZ = chosen ? center[2] + lift.offset[2] : center[2] - 0.05 * Math.abs(k);
    const size = (chosen ? lift.scale : hovered ? othersScale * 1.1 : othersScale) * rise.current;

    if (!placed.current) {
      // First appearance: start in place, under the desk, instead of flying in from the middle of the room
      g.position.set(targetX, targetY, targetZ);
      g.scale.setScalar(0.001);
      placed.current = true;
    }
    g.position.x = damp(g.position.x, targetX, 4, dt);
    g.position.y = damp(g.position.y, targetY, 4, dt);
    g.position.z = damp(g.position.z, targetZ, 4, dt);
    g.scale.setScalar(damp(g.scale.x, Math.max(size, 0.001), 4, dt));

    if (chosen && spin) {
      g.rotation.y += dt * 0.55;
    } else {
      // Settle to a gentle sway, taking the short way round after a spin
      g.rotation.y = THREE.MathUtils.euclideanModulo(g.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      g.rotation.y = damp(g.rotation.y, (spin ? 0.5 : 0) + Math.sin(t * 0.5 + index) * 0.3, 3, dt);
    }
    if (ring.current)
      ring.current.emissiveIntensity = damp(ring.current.emissiveIntensity, chosen ? 1.6 : hovered ? 0.8 : 0.25, 6, dt);
  });

  return (
    <group
      ref={group}
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        if (active) onPick(slug);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (active) onHover(slug);
      }}
      onPointerOut={() => onHover(null)}
    >
      <Model />
      {/* The stand: a dark disc with a ring that lights up when the model is chosen or hovered */}
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.12, 0.125, 0.012, 32]} />
        <meshStandardMaterial color="#1a1614" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.022, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.112, 0.003, 8, 48]} />
        <meshStandardMaterial ref={ring} color="#ff9a4d" emissive="#ff9a4d" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

interface ShowcaseProps {
  /** True while the projects page is open: the models rise and the light comes on. */
  active: boolean;
  /** The project whose model is at the front. */
  selected: string;
  onPick: (slug: string) => void;
}

/**
 * The projects page's 3D half: the models, and a warm light that is switched
 * on with them so they stand out even with the room dark.
 */
export default function ProjectShowcase({ active, selected, onPick }: ShowcaseProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const lamp = useRef<THREE.PointLight>(null);

  useFrame((_, dt) => {
    if (lamp.current) lamp.current.intensity = damp(lamp.current.intensity, active ? light.intensity : 0, 3, dt);
  });

  useEffect(() => {
    document.body.style.cursor = active && hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [active, hovered]);

  return (
    <>
      <pointLight ref={lamp} position={light.position} color={light.color} intensity={0} />
      {roomProjects.map(({ slug }, index) => (
        <ShowcaseItem
          key={slug}
          slug={slug}
          index={index}
          count={roomProjects.length}
          active={active}
          chosen={selected === slug}
          hovered={hovered === slug}
          onPick={onPick}
          onHover={setHovered}
        />
      ))}
    </>
  );
}
