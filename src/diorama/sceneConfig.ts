/**
 * Settings for the diorama page.
 *
 * The room itself is modelled, lit and baked in Blender (see /blender), so the
 * only things decided here are how the browser frames it.
 *
 * Three.js axes: +x right, +y up, +z toward the viewer. The room is centred on
 * the origin with its floor at y = 0; the back wall is at -z, the left wall at -x.
 */

export type Vec3 = [number, number, number];

export const sceneConfig = {
  /** Night sky behind the room. Matches the Blender renders. */
  background: '#0b0f22',

  /** Baked room exported by blender/bake_room.py. */
  roomUrl: '/models/room.glb',

  /**
   * The same two texture sheets as room.glb, but baked with the lights off.
   * Keyed by the name of the baked material they replace. Made by bake_room.py.
   */
  roomNightUrls: {
    baked_shell: '/models/room_night_shell.webp',
    baked_props: '/models/room_night_props.webp',
  },

  /** Slimmed drum kit exported by blender/export_kit.py, already in position. */
  drumKitUrl: '/models/drumkit.glb',

  /** Alex with his skeleton and poses, exported by blender/export_alex.py, already in bed. */
  alexUrl: '/models/alex.glb',

  /**
   * The duvet, draped by a cloth simulation in blender/duvet.py. It carries a
   * second shape, "Awake", pushed down toward the foot of the bed.
   */
  duvetUrl: '/models/duvet.glb',

  /**
   * Timing of waking up and going back to sleep, in seconds. The two moves are
   * taken in turn so the duvet never passes through him: waking, the duvet
   * slides off first and then he sits up; going back to sleep, he lies down
   * first and then the duvet comes back over him.
   */
  motion: {
    duvetSlide: 0.7,
    /** Waking: how long he waits for the duvet to clear before sitting up. */
    sitUpDelay: 0.6,
    /** How long sitting up or lying down takes. */
    sitUp: 0.9,
    /** Going back to sleep: how long the duvet waits for him to lie down. */
    duvetReturnDelay: 0.8,
    /** How far the duvet rises mid-slide, in metres, to clear his hands and toes. */
    duvetLift: 0.07,
  },

  /** Folder in /public holding three.js's decoder for compressed models. */
  dracoPath: '/draco/',

  /**
   * Lights for the pieces that are not baked (the drum kit, and later Alex).
   * They stand where the lamps are in room.blend so those pieces pick up the
   * same glow as the baked room around them. The room itself ignores them.
   */
  lights: {
    kitLamp: { position: [1.2, 2.35, 0.9] as Vec3, color: '#ffc890', intensity: 14 },
    bedsideLamp: { position: [-0.88, 0.75, -1.73] as Vec3, color: '#ff9a4d', intensity: 5 },
    monitors: { position: [1.0, 1.1, -1.2] as Vec3, color: '#9fc4ff', intensity: 2 },
    moon: { position: [-4, 3, 0.5] as Vec3, color: '#9db8ff', intensity: 0.6 },
    fill: { color: '#2a2f55', intensity: 0.5 },
  },

  /**
   * Lights on while Alex is awake, lights off while he sleeps.
   *
   * The room's two moods are baked textures (see roomNightUrls); the drum kit,
   * Alex and the duvet are lit live, so their lights are faded to match.
   */
  lighting: {
    /** Seconds the lights take to come on or go off. */
    fadeSeconds: 1.1,
    /** Brightness of the lights-off textures. 1 is as baked; raise it to lift the dark room. */
    nightGain: 0.8,
    /**
     * How much of each live light is left with the lights off, as a share of
     * its normal intensity. The lamps and the monitor glow go out completely;
     * moonlight and a little cool fill stay, so the room is dim but not black.
     */
    night: { kitLamp: 0, bedsideLamp: 0, monitors: 0, moon: 1, fill: 1.6, environment: 0.25 },
    /** How much of the PC's glass panels' tint stays in the dark (they would glow against black). */
    nightGlass: 0.15,
    /** Warm glow added to a hovered piece of furniture: strong in the dark, gentle with the lights on. */
    hoverGlow: { night: 0.055, day: 0.02 },
  },

  camera: {
    fov: 28,
    /** Same viewpoint as the "Cam_Hero" camera in room.blend. */
    position: [7.6, 6.4, 7.9] as Vec3,
    target: [0, 0.6, -0.1] as Vec3,
  },
};
