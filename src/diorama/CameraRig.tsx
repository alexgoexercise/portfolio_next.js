import { useCallback, useEffect, useRef, type ElementRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneConfig, type ViewName } from './sceneConfig';

/**
 * The camera: what the visitor can do with it, and what keeps them from
 * getting lost.
 *
 * - Drag to turn around the room, scroll or pinch to zoom.
 * - Slide through the room: right-drag, Shift-drag, two fingers on a touch
 *   screen, or the keyboard (W A S D or the arrow keys; Q and E for lower and
 *   higher). Sliding moves the point the camera looks at, along the floor.
 *   That point is kept inside a box a little smaller than the room.
 * - Outside either solid wall, the camera is kept high enough to see over it.
 * - The view buttons and the drum kit's card glide the camera to a preset.
 */

type Controls = ElementRef<typeof OrbitControls>;

/** A request to glide to a preset view. The number changes with every request, so asking for the same view twice still moves the camera back. */
export interface ViewRequest {
  name: ViewName;
  nonce: number;
}

const { limits, views } = sceneConfig.camera;
const TARGET_MIN = new THREE.Vector3(...limits.target.min);
const TARGET_MAX = new THREE.Vector3(...limits.target.max);
const COS_MIN_POLAR = Math.cos(limits.minPolar);
/** The highest the camera can ever be, whatever it is looking at: stops the wall rule asking for the impossible. */
const MAX_REACH = limits.maxDistance * COS_MIN_POLAR * 0.95;

const MOVE_KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyE', 'PageUp'],
  down: ['KeyQ', 'PageDown'],
};
const ALL_MOVE_KEYS = new Set(Object.values(MOVE_KEYS).flat());

// Scratch objects, so nothing is allocated on every frame
const delta = new THREE.Vector3();
const offset = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const spherical = new THREE.Spherical();

/**
 * How high the camera has to be, so that a wall between it and the target
 * does not block the view. Zero when the camera is inside the room.
 *
 * The line from the camera to the target crosses the wall's plane part of the
 * way along; at that point it must be above the wall's top.
 */
function heightToSeeOverWalls(camera: THREE.Vector3, target: THREE.Vector3) {
  const { left, back, top, clearance, fadeIn } = limits.walls;
  const clearTop = top + clearance;
  let need = 0;

  const check = (cameraAxis: number, targetAxis: number, wallAt: number) => {
    const outside = wallAt - cameraAxis; // how far the camera is beyond this wall
    const inside = targetAxis - wallAt; // how far the target is in front of it
    if (outside <= 0 || inside <= 0) return;
    const along = outside / (outside + inside); // how far along the line the wall is crossed
    const needed = (clearTop - target.y * along) / (1 - along);
    // Eased in over the first stretch outside the wall, so crossing it does not make the camera jump
    need = Math.max(need, needed * THREE.MathUtils.smoothstep(outside, 0, fadeIn));
  };

  check(camera.x, target.x, left); // left wall: the room is at larger x
  check(camera.z, target.z, back); // back wall: the room is at larger z
  return need;
}

/** Keeps the target inside the room and the camera clear of the walls. Run every frame, after the controls have moved things. */
function constrain(camera: THREE.Camera, controls: Controls) {
  const target = controls.target;

  // The point being looked at stays in its box; the camera goes with it
  delta.copy(target).clamp(TARGET_MIN, TARGET_MAX).sub(target);
  if (delta.lengthSq() > 0) {
    target.add(delta);
    camera.position.add(delta);
  }

  // Behind a wall, tilt the camera up (or back it away) until it can see over
  for (let i = 0; i < 4; i++) {
    const need = Math.min(heightToSeeOverWalls(camera.position, target), target.y + MAX_REACH);
    if (camera.position.y >= need - 0.002) break;
    spherical.setFromVector3(offset.copy(camera.position).sub(target));
    const rise = need - target.y;
    if (rise / spherical.radius > COS_MIN_POLAR) spherical.radius = rise / COS_MIN_POLAR;
    spherical.phi = Math.acos(Math.min(rise / spherical.radius, COS_MIN_POLAR));
    spherical.makeSafe();
    camera.position.copy(target).add(offset.setFromSpherical(spherical));
  }
}

function isTyping(event: KeyboardEvent) {
  const el = event.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

interface Glide {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  fromFov: number;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
  toFov: number;
  elapsed: number;
}

export default function CameraRig({ request }: { request: ViewRequest | null }) {
  const controls = useRef<Controls>(null);
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const canvas = useThree((state) => state.gl.domElement);
  const held = useRef(new Set<string>());
  const glide = useRef<Glide | null>(null);

  const stopGlide = useCallback(() => {
    if (!glide.current) return;
    glide.current = null;
    if (controls.current) controls.current.enabled = true;
  }, []);

  // A request for a preset view starts a glide to it
  useEffect(() => {
    if (!request || !controls.current) return;
    const view = views[request.name];
    glide.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.current.target.clone(),
      fromFov: camera.fov,
      toPosition: new THREE.Vector3(...view.position),
      toTarget: new THREE.Vector3(...view.target),
      toFov: view.fov,
      elapsed: 0,
    };
    controls.current.enabled = false; // the glide steers; touching the room hands control back
  }, [request, camera]);

  // Grabbing or scrolling the room while it glides hands control back at once
  useEffect(() => {
    canvas.addEventListener('pointerdown', stopGlide, true);
    canvas.addEventListener('wheel', stopGlide, true);
    return () => {
      canvas.removeEventListener('pointerdown', stopGlide, true);
      canvas.removeEventListener('wheel', stopGlide, true);
    };
  }, [canvas, stopGlide]);

  // Keyboard movement
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!ALL_MOVE_KEYS.has(e.code) && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') return;
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      held.current.add(e.code);
      if (ALL_MOVE_KEYS.has(e.code)) {
        e.preventDefault();
        stopGlide();
      }
    };
    const up = (e: KeyboardEvent) => held.current.delete(e.code);
    const clear = () => held.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [stopGlide]);

  useFrame((_, frame) => {
    const c = controls.current;
    if (!c) return;
    const dt = Math.min(frame, 0.05);

    const g = glide.current;
    if (g) {
      g.elapsed += dt;
      const t = Math.min(1, g.elapsed / limits.glideSeconds);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(g.fromPosition, g.toPosition, eased);
      c.target.lerpVectors(g.fromTarget, g.toTarget, eased);
      camera.fov = THREE.MathUtils.lerp(g.fromFov, g.toFov, eased);
      camera.updateProjectionMatrix();
      if (t >= 1) stopGlide();
    } else if (held.current.size) {
      const has = (keys: string[]) => keys.some((k) => held.current.has(k));
      const ahead = Number(has(MOVE_KEYS.forward)) - Number(has(MOVE_KEYS.back));
      const side = Number(has(MOVE_KEYS.right)) - Number(has(MOVE_KEYS.left));
      const lift = Number(has(MOVE_KEYS.up)) - Number(has(MOVE_KEYS.down));
      if (ahead || side || lift) {
        // "Forward" is whichever way the camera is facing along the floor
        forward.copy(c.target).sub(camera.position).setY(0);
        if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
        forward.normalize();
        right.set(-forward.z, 0, forward.x);
        const fast = held.current.has('ShiftLeft') || held.current.has('ShiftRight') ? 2 : 1;
        const step = limits.keyboardSpeed * fast * dt;
        delta.set(0, 0, 0).addScaledVector(forward, ahead * step).addScaledVector(right, side * step);
        delta.y = lift * step * 0.6;
        c.target.add(delta);
        camera.position.add(delta);
      }
    }

    constrain(camera, c);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={sceneConfig.camera.target}
      enablePan
      screenSpacePanning={false} // slide along the floor, not up the screen
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      minPolarAngle={limits.minPolar}
      maxPolarAngle={limits.maxPolar}
    />
  );
}
