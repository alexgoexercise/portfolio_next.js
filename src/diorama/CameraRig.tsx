import { useCallback, useEffect, useRef, type ElementRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneConfig, type Vec3, type ViewName, type ViewPreset } from './sceneConfig';

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
  /** Jump straight there instead of gliding, for a page opened directly on a view. */
  instant?: boolean;
}

/** The lens to use for a view on a screen of this shape (width divided by height). */
function lensFor(view: ViewPreset, aspect: number) {
  const REFERENCE = 1.6; // a typical laptop screen
  if (!view.fitWidth || aspect >= REFERENCE) return view.fov;
  // Keep the sideways angle the preset has on a laptop, and let the vertical one grow
  const halfWidth = Math.atan(Math.tan(THREE.MathUtils.degToRad(view.fov) / 2) * REFERENCE);
  return Math.min(80, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfWidth) / aspect)));
}

/** Where a view puts the camera on a screen of this shape. */
function placeFor(view: ViewPreset, aspect: number) {
  if (view.tall && view.blendTall) {
    // From a square screen (0 = the normal camera) to a phone's (1 = the tall camera)
    const k = THREE.MathUtils.smoothstep(1 - aspect, 0, 0.5);
    const mix = (a: Vec3, b: Vec3): Vec3 => [
      THREE.MathUtils.lerp(a[0], b[0], k),
      THREE.MathUtils.lerp(a[1], b[1], k),
      THREE.MathUtils.lerp(a[2], b[2], k),
    ];
    return { position: mix(view.position, view.tall.position), target: mix(view.target, view.tall.target) };
  }
  const tall = view.tall && aspect < 1 ? view.tall : view;
  return { position: tall.position, target: tall.target };
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
const goalPosition = new THREE.Vector3();
const goalTarget = new THREE.Vector3();

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
  return (
    !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
  );
}

interface Glide {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  fromFov: number;
  view: ViewPreset;
  elapsed: number;
}

export default function CameraRig({
  request,
  locked = false,
  touchLocked = false,
}: {
  request: ViewRequest | null;
  locked?: boolean;
  /** Fingers do not move the camera (behind the drum kit, where they are for playing). The mouse still can. */
  touchLocked?: boolean;
}) {
  const controls = useRef<Controls>(null);
  // While locked (the projects page) the visitor cannot move the camera
  const lockedRef = useRef(locked);
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const canvas = useThree((state) => state.gl.domElement);
  const size = useThree((state) => state.size);
  const held = useRef(new Set<string>());
  const glide = useRef<Glide | null>(null);
  // The last preset asked for; while locked the camera is held exactly there, whatever the visitor did before
  const pose = useRef<ViewPreset | null>(null);

  const stopGlide = useCallback(() => {
    if (!glide.current) return;
    glide.current = null;
    if (controls.current) controls.current.enabled = !lockedRef.current;
  }, []);

  // With the touch lock on, fingers go to the drums instead of orbiting, so two or more can play at once
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.touches.ONE = touchLocked ? (-1 as THREE.TOUCH) : THREE.TOUCH.ROTATE;
    c.touches.TWO = touchLocked ? (-1 as THREE.TOUCH) : THREE.TOUCH.DOLLY_PAN;
  }, [touchLocked]);

  // Locking the camera switches the visitor's controls off; unlocking hands them back
  useEffect(() => {
    lockedRef.current = locked;
    if (controls.current && !glide.current) controls.current.enabled = !locked;
  }, [locked]);

  // A request for a preset view starts a glide to it, or jumps there at once
  useEffect(() => {
    if (!request || !controls.current) return;
    const view: ViewPreset = views[request.name];
    const aspect = size.width / size.height;
    const from = {
      position: camera.position.clone(),
      target: controls.current.target.clone(),
      fov: camera.fov,
    };
    // The controls glide to a stop after a drag (damping), and keep that leftover turn while switched off,
    // then apply it when handed back. Use it up now, before the move, so it cannot twist the camera later.
    const damped = controls.current.enableDamping;
    controls.current.enableDamping = false;
    controls.current.update();
    controls.current.enableDamping = damped;
    const place = placeFor(view, aspect);
    pose.current = view;
    if (request.instant) {
      camera.position.set(...place.position);
      controls.current.target.set(...place.target);
      camera.lookAt(controls.current.target);
      camera.fov = lensFor(view, aspect);
      camera.updateProjectionMatrix();
      return;
    }
    glide.current = {
      fromPosition: from.position,
      fromTarget: from.target,
      fromFov: from.fov,
      view,
      elapsed: 0,
    };
    controls.current.enabled = false; // the glide steers; touching the room hands control back
  }, [request, camera]); // eslint-disable-line react-hooks/exhaustive-deps -- the screen size is only read when a view is asked for

  // Grabbing or scrolling the room while it glides hands control back at once
  useEffect(() => {
    // (not while locked: there the camera is not the visitor's to take over)
    const takeOver = () => {
      if (!lockedRef.current) stopGlide();
    };
    canvas.addEventListener('pointerdown', takeOver, true);
    canvas.addEventListener('wheel', takeOver, true);
    return () => {
      canvas.removeEventListener('pointerdown', takeOver, true);
      canvas.removeEventListener('wheel', takeOver, true);
    };
  }, [canvas, stopGlide]);

  // Keyboard movement
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (lockedRef.current) return;
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

  useFrame((state, frame) => {
    const c = controls.current;
    if (!c) return;
    // Real elapsed time, so a slow computer glides for the same 1.4 s (long stalls, such as a shader compile, count for little)
    const dt = Math.min(frame, 0.25);
    // The lens depends on the shape of the screen, which can differ from when the view was asked for (the canvas starts out a default size)
    const aspect = state.size.width / state.size.height;

    const g = glide.current;
    if (g) {
      g.elapsed += dt;
      const t = Math.min(1, g.elapsed / limits.glideSeconds);
      const eased = t * t * (3 - 2 * t);
      const to = placeFor(g.view, aspect);
      camera.position.lerpVectors(g.fromPosition, goalPosition.set(...to.position), eased);
      c.target.lerpVectors(g.fromTarget, goalTarget.set(...to.target), eased);
      // The controls only turn the camera while they are enabled, so while gliding it is aimed here
      camera.lookAt(c.target);
      camera.fov = THREE.MathUtils.lerp(g.fromFov, lensFor(g.view, aspect), eased);
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
        delta
          .set(0, 0, 0)
          .addScaledVector(forward, ahead * step)
          .addScaledVector(right, side * step);
        delta.y = lift * step * 0.6;
        c.target.add(delta);
        camera.position.add(delta);
      }
    }

    if (lockedRef.current && !g && pose.current) {
      // Locked (projects page): sit at the preset's exact angle so every model is in frame
      const view = pose.current;
      const place = placeFor(view, aspect);
      const fov = lensFor(view, aspect);
      camera.position.set(...place.position);
      c.target.set(...place.target);
      camera.lookAt(c.target);
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      return;
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
