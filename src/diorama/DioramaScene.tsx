import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, PerspectiveCamera, useAnimations, useGLTF } from '@react-three/drei';
import { Leva, button, levaStore, useControls } from 'leva';
import * as THREE from 'three';
import Hud from './Hud';
import { game, hotspots, type Hotspot } from './hotspots';
import { sceneConfig } from './sceneConfig';
import { loadRoomState, saveRoomState } from './session';
import { playSound } from './sounds';

/** Copies every slider's current value as JSON, ready to paste into sceneConfig.ts. */
function copyAllSettings() {
  const out: Record<string, unknown> = {};
  for (const [path, item] of Object.entries(levaStore.getData())) {
    const value = (item as { value?: unknown }).value;
    if (value !== undefined) out[path] = value;
  }
  void navigator.clipboard.writeText(JSON.stringify(out, null, 2));
}

/**
 * The room's colours and lighting are already painted into its textures, so
 * every surface is drawn "unlit": the picture is shown exactly as baked and
 * no lights are needed for it. Each mesh gets its own material so a single
 * piece of furniture can be brightened on hover. Safe to call more than once.
 */
function prepareRoom(scene: THREE.Object3D) {
  if (scene.userData.prepared) return scene;
  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const source = mesh.material as THREE.MeshStandardMaterial;
    if (source.transparent || source.opacity < 1) {
      // The PC's glass panels: a faint tint you can see through
      mesh.material = new THREE.MeshBasicMaterial({
        color: source.color,
        transparent: true,
        opacity: source.opacity,
        depthWrite: false,
      });
      return;
    }
    const map = source.map ?? source.emissiveMap;
    if (map) map.anisotropy = 8;
    mesh.material = new THREE.MeshBasicMaterial({ map });
  });
  scene.userData.prepared = true;
  return scene;
}

function Room({ awake }: { awake: boolean }) {
  const { scene } = useGLTF(sceneConfig.roomUrl);
  const room = useMemo(() => prepareRoom(scene), [scene]);

  // His spare glasses leave the nightstand when he wakes: he is wearing them
  useEffect(() => {
    const glasses = room.getObjectByName('Glasses_On_Nightstand');
    if (glasses) glasses.visible = !awake;
  }, [room, awake]);

  return <primitive object={room} />;
}

/** How Alex's exported parts are drawn. Hair and clothes ship in their original colours and are darkened here. */
const ALEX_PARTS: Record<string, { tint?: number; cutout?: boolean }> = {
  Alex_Body: {},
  Alex_Clothes: { tint: 0.07 },
  Alex_Teeth: {},
  Alex_Eyes: {},
  Alex_Hair: { tint: 0.14, cutout: true },
  Alex_Eyebrows: { tint: 0.5, cutout: true },
  Alex_Eyelashes: { cutout: true },
};

/**
 * Alex has a real skeleton. "Asleep" and "Awake" are single poses exported
 * from Blender; switching between them cross-fades, which reads as him
 * sitting up or lying back down. His eyelids are a separate slider on his face.
 */
function Alex({ awake }: { awake: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(sceneConfig.alexUrl, sceneConfig.dracoPath);
  const { actions } = useAnimations(animations, group);
  const eyelids = useRef(1);

  const { body, glasses, lashes } = useMemo(() => {
    let body: THREE.Mesh | undefined;
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false; // a posed skeleton can leave its original bounds
      const style = ALEX_PARTS[mesh.name] ?? ALEX_PARTS[mesh.parent?.name ?? ''];
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (style) {
        material.transparent = false;
        material.depthWrite = true;
        if (style.cutout) material.alphaTest = 0.35;
        if (style.tint) material.color.setScalar(style.tint);
      }
      if (mesh.morphTargetDictionary && 'eye-left-closure' in mesh.morphTargetDictionary) body = mesh;
    });
    return {
      body,
      glasses: scene.getObjectByName('Alex_Glasses'),
      lashes: scene.getObjectByName('Alex_Eyelashes'),
    };
  }, [scene]);

  const started = useRef(false);
  useEffect(() => {
    const next = actions[awake ? 'Awake' : 'Asleep'];
    const previous = actions[awake ? 'Asleep' : 'Awake'];
    if (!next) return;
    const move = () => {
      next.reset().fadeIn(sceneConfig.motion.sitUp).play();
      previous?.fadeOut(sceneConfig.motion.sitUp);
      if (glasses) glasses.visible = awake;
      // The lashes do not follow the eyelid shapes, so they are hidden while his eyes are shut
      if (lashes) lashes.visible = awake;
    };
    // Waking up, he gives the duvet a moment to slide clear before he sits up.
    // Lying back down (and the very first pose on load) happens straight away.
    if (!awake || !started.current) {
      started.current = true;
      move();
      return;
    }
    const timer = setTimeout(move, sceneConfig.motion.sitUpDelay * 1000);
    return () => clearTimeout(timer);
  }, [actions, awake, glasses, lashes]);

  useFrame((_, delta) => {
    if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
    // His eyes react at once, before he moves
    const target = awake ? 0 : 1;
    eyelids.current += (target - eyelids.current) * Math.min(1, delta * 5);
    for (const side of ['eye-left-closure', 'eye-right-closure']) {
      body.morphTargetInfluences[body.morphTargetDictionary[side]] = eyelids.current;
    }
  });

  return <primitive ref={group} object={scene} />;
}

/**
 * The duvet was draped twice in Blender: once over Alex asleep, once pushed
 * down with him sat up. The file holds both shapes and this slides between
 * them.
 *
 * A straight slide would drag the cloth through his hands and toes, and
 * sliding while he sits up would put his chest through it. So the slide is
 * timed around him (see sceneConfig.motion) and the duvet rises a little in
 * the middle of the slide, as if it were being lifted and thrown back.
 */
function Duvet({ awake }: { awake: boolean }) {
  const { scene } = useGLTF(sceneConfig.duvetUrl, sceneConfig.dracoPath);
  const progress = useRef(awake ? 1 : 0); // 0 = over him, 1 = pushed down
  const waiting = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    // Going back to sleep, the duvet waits for him to lie down first
    waiting.current = started.current && !awake ? sceneConfig.motion.duvetReturnDelay : 0;
    started.current = true;
  }, [awake]);

  const cloth = useMemo(() => {
    let found: THREE.Mesh | undefined;
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false; // the second shape reaches outside the first one's bounds
      if (mesh.morphTargetInfluences?.length) found = mesh;
    });
    return found;
  }, [scene]);

  useFrame((_, delta) => {
    if (!cloth?.morphTargetInfluences) return;
    if (waiting.current > 0) {
      waiting.current -= delta;
    } else {
      const step = delta / sceneConfig.motion.duvetSlide;
      progress.current = awake ? Math.min(1, progress.current + step) : Math.max(0, progress.current - step);
    }
    const p = progress.current;
    cloth.morphTargetInfluences[0] = p * p * (3 - 2 * p); // ease in and out
    scene.position.y = Math.sin(Math.PI * p) * sceneConfig.motion.duvetLift;
  });

  return <primitive object={scene} />;
}

/** The drum kit keeps real, shiny materials, so it is lit live by <Lamps /> below. */
function DrumKit() {
  const { scene } = useGLTF(sceneConfig.drumKitUrl, sceneConfig.dracoPath);
  return <primitive object={scene} />;
}

interface HotspotsProps {
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onPick: (spot: Hotspot) => void;
}

/**
 * Makes the hotspots clickable. Each one gets an invisible box around its
 * parts: testing the pointer against a handful of boxes is far cheaper than
 * against every triangle of the drum kit. Hovering brightens the real parts.
 */
function Hotspots({ hoveredId, onHover, onPick }: HotspotsProps) {
  const { scene: roomScene } = useGLTF(sceneConfig.roomUrl);
  const { scene: kit } = useGLTF(sceneConfig.drumKitUrl, sceneConfig.dracoPath);

  const zones = useMemo(() => {
    const room = prepareRoom(roomScene);
    room.updateWorldMatrix(true, true);
    kit.updateWorldMatrix(true, true);
    return hotspots.map((spot) => {
      const targets =
        spot.source === 'drumkit'
          ? [kit]
          : spot.parts.map((name) => room.getObjectByName(name)).filter((o): o is THREE.Object3D => Boolean(o));
      const box = new THREE.Box3();
      const meshes: THREE.Mesh[] = [];
      for (const target of targets) {
        box.expandByObject(target);
        target.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (mesh.isMesh && !(mesh.material as THREE.Material).transparent) meshes.push(mesh);
        });
      }
      const size = box.getSize(new THREE.Vector3());
      size.set(
        Math.max(size.x, game.minHotspotSize),
        Math.max(size.y, game.minHotspotSize),
        Math.max(size.z, game.minHotspotSize)
      );
      return { spot, centre: box.getCenter(new THREE.Vector3()), size, meshes, empty: box.isEmpty() };
    });
  }, [roomScene, kit]);

  // Brighten whatever is hovered. Baked parts multiply their picture by a
  // colour above white; the lit drum kit gets a faint warm glow instead.
  useEffect(() => {
    for (const { spot, meshes } of zones) {
      const on = spot.id === hoveredId;
      for (const mesh of meshes) {
        const material = mesh.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
        if ('emissive' in material && !material.emissiveMap) {
          material.emissive.setRGB(on ? 0.16 : 0, on ? 0.1 : 0, on ? 0.04 : 0);
        } else if (material instanceof THREE.MeshBasicMaterial) {
          material.color.setScalar(on ? 1.5 : 1);
        }
      }
    }
    document.body.style.cursor = hoveredId ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [zones, hoveredId]);

  return (
    <>
      {zones
        .filter((zone) => !zone.empty)
        .map(({ spot, centre, size }) => (
          <mesh
            key={spot.id}
            position={centre}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover(spot.id);
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              if (e.delta > 6) return; // that was a drag to orbit, not a click
              onPick(spot);
            }}
          >
            <boxGeometry args={[size.x, size.y, size.z]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
    </>
  );
}

/** Stand-ins for the room's lamps, plus soft reflections for chrome and cymbals. */
function Lamps() {
  const { kitLamp, bedsideLamp, monitors, moon, fill } = sceneConfig.lights;
  return (
    <>
      <ambientLight color={fill.color} intensity={fill.intensity} />
      <pointLight position={kitLamp.position} color={kitLamp.color} intensity={kitLamp.intensity} />
      <pointLight position={bedsideLamp.position} color={bedsideLamp.color} intensity={bedsideLamp.intensity} />
      <pointLight position={monitors.position} color={monitors.color} intensity={monitors.intensity} />
      <directionalLight position={moon.position} color={moon.color} intensity={moon.intensity} />
      {/* Glowing panels that only show up as reflections: a warm ceiling, the lamp side, the window side */}
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#0a0a12']} />
        <Lightformer form="rect" intensity={1.6} color="#ffc890" position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[5, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ff9a4d" position={[-4, 1, -3]} rotation-y={Math.PI / 3} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#9db8ff" position={[4, 2, 4]} rotation-y={-Math.PI * 0.75} scale={[4, 3, 1]} />
      </Environment>
    </>
  );
}

interface SceneProps extends HotspotsProps {
  awake: boolean;
}

function Scene({ awake, hoveredId, onHover, onPick }: SceneProps) {
  const { fov, background } = useControls('View', {
    fov: { value: sceneConfig.camera.fov, min: 10, max: 60, step: 1 },
    background: sceneConfig.background,
  });
  useControls('Save', { 'Copy all settings': button(copyAllSettings) });

  return (
    <>
      <color attach="background" args={[background]} />
      <PerspectiveCamera makeDefault fov={fov} position={sceneConfig.camera.position} />
      <OrbitControls
        makeDefault
        target={sceneConfig.camera.target}
        enablePan={false}
        minDistance={4}
        maxDistance={22}
        minPolarAngle={0.3}
        maxPolarAngle={1.32}
        minAzimuthAngle={-0.15}
        maxAzimuthAngle={Math.PI / 2 + 0.15}
      />
      <Lamps />
      <Suspense fallback={null}>
        <Room awake={awake} />
        <DrumKit />
        <Alex awake={awake} />
        <Duvet awake={awake} />
        <Hotspots hoveredId={hoveredId} onHover={onHover} onPick={onPick} />
      </Suspense>
    </>
  );
}

interface DioramaSceneProps {
  /** Shows the slider panel. Off for normal visitors. */
  editable: boolean;
  /** Hotspot to open with its card showing, when arriving from that section's page. */
  initialSpot?: string;
}

/**
 * The game: clicking things makes noise, noise fills the meter, a full meter
 * wakes Alex. The meter drains on its own while the room is quiet.
 */
export default function DioramaScene({ editable, initialSpot }: DioramaSceneProps) {
  const [noise, setNoise] = useState(0);
  const [awake, setAwake] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pick up where the visitor left off: the meter keeps draining while they
  // read another page, and Alex stays awake if they woke him.
  useEffect(() => {
    const saved = loadRoomState();
    if (saved?.awake) {
      setAwake(true);
      setNoise(1);
    } else if (saved) {
      const secondsAway = (Date.now() - saved.savedAt) / 1000;
      setNoise(Math.max(0, saved.noise - game.calmPerSecond * secondsAway));
    }
  }, []);

  // Remember the game whenever the visitor leaves, by link or by closing the tab
  const latest = useRef({ noise, awake });
  latest.current = { noise, awake };
  useEffect(() => {
    const save = () => saveRoomState(latest.current);
    save(); // also marks the room as visited
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('pagehide', save);
      save();
    };
  }, []);

  // Arriving from a section's page opens that object's card
  useEffect(() => {
    if (initialSpot && hotspots.some((h) => h.id === initialSpot)) setSelectedId(initialSpot);
  }, [initialSpot]);

  // Quiet drains the meter
  useEffect(() => {
    if (awake) return;
    const timer = setInterval(() => {
      setNoise((n) => Math.max(0, n - game.calmPerSecond * 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [awake]);

  // A full meter wakes him
  useEffect(() => {
    if (!awake && noise >= 1) {
      setAwake(true);
      if (!muted) playSound('wake');
    }
  }, [noise, awake, muted]);

  const pick = useCallback(
    (spot: Hotspot) => {
      setSelectedId(spot.id);
      if (!muted) playSound(spot.sound);
      if (!awake) setNoise((n) => Math.min(1, n + spot.noise));
    },
    [awake, muted]
  );

  const letSleep = useCallback(() => {
    setAwake(false);
    setNoise(game.afterSleep);
    setSelectedId(null);
  }, []);

  const byId = (id: string | null) => hotspots.find((h) => h.id === id) ?? null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: sceneConfig.background }}>
      <Leva hidden={!editable} collapsed titleBar={{ position: { x: 0, y: 70 } }} />
      {/* "flat" turns off tone mapping: the bake already has the final colours */}
      <Canvas flat dpr={[1, 2]} onPointerMissed={() => setSelectedId(null)}>
        <Scene awake={awake} hoveredId={hoveredId} onHover={setHoveredId} onPick={pick} />
      </Canvas>
      <Hud
        noise={noise}
        awake={awake}
        muted={muted}
        hovered={byId(hoveredId)}
        selected={byId(selectedId)}
        onToggleMute={() => setMuted((m) => !m)}
        onCloseCard={() => setSelectedId(null)}
        onLetSleep={letSleep}
      />
    </div>
  );
}

useGLTF.preload(sceneConfig.roomUrl);
useGLTF.preload(sceneConfig.drumKitUrl, sceneConfig.dracoPath);
useGLTF.preload(sceneConfig.alexUrl, sceneConfig.dracoPath);
useGLTF.preload(sceneConfig.duvetUrl, sceneConfig.dracoPath);
